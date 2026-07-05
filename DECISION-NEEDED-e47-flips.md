# DECISION NEEDED — the E47 Shiloh/Gettysburg flips still invert WITH E49 fully live (D262, 2026-07-04)

**TL;DR:** E49a envelopment-surrender + E49b straggler-shedding — the two mechanisms D242 said the flips
were missing — are live and healthy, and the flips STILL go red. Both were attempted this session, measured,
and reverted per the law (deliverable byte-identical to HEAD by cmp; nothing red shipped). The reason is now
measured, not guessed: **the surrender predicate can only fire when routers flee INTO the enemy — the exact
artifact direction the flips remove.** Your call on the path; recommendation at the bottom.

## What was measured (all artifacts in `.tmp/`, 0 pageerrors; full numbers in D262)

**Shiloh flip** (data-only `homeEdge {US:low, CS:high}`, the D240/D241 idiom, shipping config = shedding ON):
- Direction: CS **3/8 on BOTH seed sets** (gate ≥4/8). Shedding OFF: CS 2/8 — exactly D242's pre-E49 number
  (shedding helps by one seed and does not break the flip — the D257 guard is clean, but it's not enough).
- **`captured` = 0 on all 11 seeds** — the Prentiss mass-capture half of the gate is not merely short, it never fires.
- The mechanism diagnostic (4 seeds, read-only instrumentation): the maximum `surrenderT` ANY US router ever
  accrues post-flip is **0.8s of the 6s grace** (on 2 of 4 seeds: never blocked for even one poll-second);
  the CS steady line never penetrates deeper than **z 275** (the Landing is z 120), and on US-win seeds it
  spends only 3-5 unit-seconds past the objective across a 480s battle; US units **break 123-134 times per
  battle and return every time**. The bottomless-defense loop D242 named is still the binding physics.

**Gettysburg flip** (top-level `homeEdge`, evidence smoke only — reverted regardless of result):
- Day 1: base CS 6/8 default + **8/8 probe** → flip **CS 1/8 / 0/8** — the D242 inversion verbatim.
- **`captured` = 0 everywhere post-flip** (base had capCS 1,196-4,391 on 6 seeds — artifact-direction captures,
  the backwards class the D258 panel flagged). Aggregate US 8/8 + Days 2-3 hold unchanged.

**Why (the load-bearing finding):** `fldSurrenderBlocked` is direction-correct (code-verified, no sign bug).
But its shape — a steady enemy strictly BETWEEN a fleeing router and its home edge, continuously for 6s, with
no nearer steady friendly — is structurally unreachable once routers flee toward their OWN rear: transient
blockers clear in ~1 second at rout speed, and the attacker's AI presses the objective frontally rather than
enveloping deep. The D258 "Hornets' Nest previewing" captures (capUS 6,349 unflipped) existed BECAUSE the
artifact sent routers INTO the Confederate depth. Historically, mass capture happened by POCKET — enemies
closed around Prentiss BEFORE/AS the position collapsed; the Day-1 retreat was channeled through town — not
by a running man being continuously blocked mid-flight for six seconds.

## Options

**(a) RECOMMENDED — hold both flips; run a bounded Aaron-driven design session (the D255/D259 pattern) on the
envelopment predicate for the flipped geometry**, armed with this evidence packet. Candidate shapes, prepared
NOT decided (the session + a default-refute panel decide): evaluate encirclement at/around the moment of BREAK
rather than mid-flight (a pocket test — steady enemies on multiple sides of the position, or both ahead-of AND
behind within a radius); or an encircled-while-wavering clause. One universal rule, no per-battle constants,
SL-7 binds (nothing chosen to land a flip gate); the flips then re-attempt behind the SAME unweakened gates.
Meanwhile the queue keeps moving on flip-independent items: **the Piper guns restore (the E46 completion item
deferred since D243) → PM2 rebuild + re-A/B (D250 strength channel; the D249 gate verbatim)**. PARITY-M3 stays
hard-gated on E47 fully landing, as locked.

**(b) E53 assault-abandonment session first** — honestly noted: E53 models the ATTACKER breaking off (its
evidence grew this session — the CS grinds the full 480s at ~93% strength on every post-flip US-win seed), but
an attacker that quits earlier is LESS likely to carry the Nest or the ridge, so E53 alone is unlikely to
rescue the flips; choosing (b) sequences two design sessions before any flip re-attempt.

**(c) Re-anchor the flip gates as gate owner (the D261/§6 precedent) — NOT recommended, and distinguished:**
D261 granted one seed of headroom on a knife-edge seed while the mechanic was proven healthy on every
structural gate. Here the mechanism half of the gate (`captured > 0`) fails ABSOLUTELY (0 across all 22
flip-leg rows on both battles) and Shiloh's majority inverts (US 5/8). A re-anchor would ship a Gettysburg
whose Day 1 teaches a Union victory and a Shiloh where the Nest falls by frontal carry in ~3.5 minutes or not
at all — the same class of backwards teaching the flips exist to remove.

**(d) Close E47 as partially-landed (Malvern Hill + Chancellorsville only), leave Shiloh/Gettysburg on the
default edges permanently** — rejects your D237 all-four approval and leaves the artifact's teaching liability
(a near-costless CS assault at Shiloh; backwards mass captures at Gettysburg) standing indefinitely. Not
recommended — but note it is the shipped-for-weeks status quo, and it is exactly what remains in force while
(a) runs, so choosing (a) does not add any new interim risk.

## Re-land cost when resolved
The exact edits + gates are preserved in `.tmp/e47-flip-evidence-d262.md` (the flip is a one-line data edit
per battle + the SL-8 narration text; ~2 minutes + the battery per battle).

**Answer "a" / "b" / "c" / "d"** (or direct otherwise) — the next session executes it.
