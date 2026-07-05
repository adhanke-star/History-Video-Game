# E53 — ATTACKER TACTICAL PARITY: the AARON-LOCKED design law (D267; E53-v2 amendment D272; shipped D273; D274 E47 postscript)

**Scope lock (Aaron, D265, verbatim): "allow AI attacker like user to concentrate, envelop, and/or
exploit."** Full attacker tactical parity — concentration + envelopment/flanking + exploitation +
the long-scoped assault-abandonment (filed D255) — with the two-sided goal on the E53 ledger line:
the AI **reproduces historical outcomes** AND **provides historical-quality resistance**, so
alt-history is EARNED. This file is the law the E53 BUILD milestone honored verbatim; **§0 is the
current shipped E53-v2 law**, and the D267 sections below are the preserved baseline law/evidence
D269 tested. The original session record is DECISIONS **D267**; the D272 amendment record is
DECISIONS **D272**; the D273 build shipped §0; D274 records the first downstream E47 acceptance
result. The D267 measurement harnesses and artifacts are `.tmp/measure-attacker-d267*` (gitignored —
the tables below carry every load-bearing number so this law survives a fresh clone).

Session pattern (the D255/D259/D263 discipline): engine facts first-hand → NEW measurements →
a 3-lens default-refute Opus panel (wf_bd1e6180-aaf) BEFORE Aaron saw candidates → a seam-faithful
emulation answering the panel's central open → Aaron locked 6 decisions by popup. Docs-only:
nothing sim-affecting ships with this law; the deliverable was cmp-proven byte-identical to HEAD
`f2871d7` after every temporary measurement build.

---

## §0 — CURRENT BUILD LAW: E53-v2 amendment (D272, 2026-07-05)

**Status:** D272 amends D267 after the D269 build ran the original law verbatim and went red on its
own a-priori §4 battery. D273 shipped this A+B/no-C law. D267 remains the evidence record; this
section is the operative shipped law. Where this section conflicts with §1/§3/§4/§6 below, **this
D272/D273 law controls**.

**Fresh evidence (D272, all fresh foreground runs, 0 pageerrors):** temporary T26 was re-landed
only for measurement, then removed and rebuilt away. Artifacts:
`.tmp/fresh-e53v2-anatomy-d272.json`, `.tmp/fresh-e53v2-variants-d272.json`,
`.tmp/fresh-e53v2-cautious-d272.json`, and `.tmp/measure-e53v2-final.json`.

### §0.1 — Mass-capture governor (E53-active, zero new constants)

**Rule:** while E53 attacker parity is active, a router is cut off only if the existing T25 lane
test blocks at the router's real `x` **and** at both virtual sidesteps `x - FLD.RALLY_R` and
`x + FLD.RALLY_R`, clamped to the existing field edge safety margin. A corridor-width sidestep
that escapes the blocker means open flank / detour, not capture; the existing rally/danger scan
continues. This uses `FLD.RALLY_R`, not a new knob, and it does not change casualties, morale,
victory, or side scoring.

**Scope:** the valve ships as an **E53-active / parity-gated** rule for this build, not as a global
T25 rewrite. Reason: D272's mechanism lens rejected a global valve for this milestone because the
session contract requires OFF-state row identity. `govBase` showed the valve would alter parity-off
base captures at battles such as Gettysburg/Shiloh. Global pocket semantics and capture-where-
documented work stay on E54.

**Measured basis:** the valve kills the D269 phantom-capture class without weakening the direction
gates when C is off: `govNoC` reads Chancellorsville CS 8/8 default + 7/8 probe with capCS 0;
Chickamauga CS 11/11 with capUS 0; Antietam aggCS 11/11 with capUS 0; Gettysburg aggUS 8/8 both
sets while preserving the documented Day-1 captured band (capCS 3,531).

### §0.2 — Attacker behavior at Bull Run (universal cautious-v2 plus accurate data)

**Rule:** the D64 cautious posture is amended universally: when `_atkCautious` is true and fog is
off, the attacker presses until it is within the existing `FLD.ATK_ASSAULT_R` of the nearest visible
defender, then holds in line and trades fire. Under fog it defers to the stock fog doctrine. With no
visible defender in the band, it keeps pressing; it never parks unopposed inside an objective ring.

**Data row:** `bullrun1` gets `assaultDoctrine:"cautious"` as an accurate-input posture for
McDowell's piecemeal commitment. This is the same D92 class as Fredericksburg's cautious posture:
historical input, not per-battle combat math. There are no per-battle constants.

**Measured basis:** the refuted D269 0.85×ring band (`cv1T`) flips the tooth. Cautious-v2 (`cv2T`)
pins the Bull Run tooth CS 8/8 in the clean fog-off config; fog-on shipping Bull Run is row-identical
to base (0 diffs / 0 flips). Watch rows from the same run: Fredericksburg keeps its historical
direction but shifts cost fidelity; Malvern Hill sits at the 6/8 floor; Chickamauga P0 moves
US→CS under parity while P2 cautious stays unchanged. These are build-battery watch rows, not
licenses to tune.

### §0.3 — C-v2 abandonment shape (dropped for E53-v2)

**Decision:** E53-v2 ships **A+B plus the mass-capture valve**. It does **not** ship C/abandonment/
recall in this build.

**Reason:** the abandonment trigger is refuted twice. D269 showed C stands Lee off at
Chancellorsville (2/8+2/8) and is ineffective on the capture channel it was meant to fix. D272
confirmed that once the valve lands, C is harmful: `gov` reads Chancellorsville CS 6/8 default +
5/8 probe, while `govNoC` reads CS 8/8 + 7/8. Wave-only/no-wing is also refuted (`waveValve`
Chancellorsville 4/8 + 3/8; Gettysburg capCS 0). Therefore A+B are retained jointly, C is removed,
and any future "failed assault calls off" mechanic becomes a separate design item with new evidence,
never a retune of `E53_ABANDON_X`.

### §0.4 — E53-v2 build battery deltas

The original §4 battery remains a floor; these deltas are mandatory for the v2 build:

1. **OFF-state byte identity is hard.** `_parityOff` / parity-disabled rows must be row-identical to
   current HEAD across the full battery. The mass-capture valve must be inactive when E53 is inactive.
2. **A+B active with C absent.** The build must prove the trigger/wing/wave composite plus the valve,
   not C. There is no `E53_ABANDON_X` shipping path in v2.
3. **Valve isolation teeth.** Active parity rows must show the D272 readings that made the doctrine
   legal: Chancellorsville CS 8/8 + 7/8 with capCS 0; Chickamauga and Antietam false captures 0;
   Gettysburg aggUS 8/8 with the Day-1 capCS band preserved.
4. **Bull Run successor tooth.** The old D268 vector remains an attribution baseline, but the v2 build
   also pins the accurate-input `bullrun1` cautious-v2 row: clean fog-off tooth CS 8/8, fog-on shipping
   rows byte-identical to base. E58's rail-pivot tooth stays an expected-red owner-slice until resolved.
5. **Standing gates are not weakened.** Chancellorsville §6, Malvern Hill US >=6/8, Antietam phase
   directions, Gettysburg aggregate direction, Shiloh, E49 protective teeth, `git diff --check`,
   `node tools/build.mjs`, and JSON/pageerror readback all still apply.
6. **Watch rows, not knobs.** Log Malvern Hill's 6/8 floor, Fredericksburg cost ratio, Chickamauga
   P0 movement, captured undershoots where history has smaller captures, and any E58 interaction.

### §0.5 — 3-lens default-refute review (D272)

- **Mechanism lens:** the valve is sound only as E53-active for this milestone; a global T25 change
  violates the OFF-state identity contract. A+B remain jointly required; wave-only/no-wing and C-on
  are both refuted by fresh rows.
- **History lens:** the valve intentionally prefers under-capture to false five-figure POW columns at
  battles with no mass surrender. Gettysburg's real Day-1 capture band is preserved; Antietam and
  Chickamauga small-capture honesty stay on E54.
- **Gate lens:** C is not salvageable by retuning, and Bull Run should be solved by the accurate-input
  cautious row plus the universal defender-anchored cautious rule. Section-4 gates remain intact; E58
  is kept explicitly red until its owner-slice lands.

### §0.6 — Downstream E47 acceptance postscript (D274)

D274 re-applied the D262 Shiloh/Gettysburg flip edits only as a temporary acceptance test on top of
the shipped D273 E53-v2 build, then reverted them. The direction projection proved correct enough:
Shiloh flip CS 7/8 default + 8/8 probe, and Gettysburg aggregate US 8/8 with Day 1 CS 7/8 default +
7/8 probe. The captured projection also proved correct: captured stayed 0 on every seed at both
targets. Therefore E53-v2 is sufficient for the direction half but does not complete E47; the
captured/pocket semantics are now explicitly E54's scope, and the E47 gates stay unchanged.

---

## §1 — The six locked answers (AARON popups, 2026-07-05)

**D272 note:** §1 records the D267 popup answers as the historical lock that D269 tested. The D272
amendment in §0 supersedes the D267 "A+B+C" and Bull Run remedy clauses for the next build.

1. **The build ships A+B+C as ONE doctrine** (envelopment wing + wave-commit + abandonment/recall),
   with every panel clause in §3. Measured basis: wing-alone reaches 1/8 at flipped Shiloh (below
   the shipping AI's 3/8), press-alone 0/8, the composite 8/8 — and abandonment is the recall rule
   that stops a dying wing from banking phantom prisoners. *(Recommended option.)*
2. **The D64 design-lock (a) supersession is APPROVED and recorded** (law §7.5-style,
   supersedes-with-why in §5 below). B must be an order-writing pre-seam — SL-10 clean, never
   mutating the D64 `localSup` gate. *(Recommended option.)*
3. **Bull Run: the build's real A/B decides.** The seam emulation flipped First Bull Run (US 8/8
   where the CS held historically); Aaron chose NOT to pre-approve the McDowell-piecemeal posture
   lane — the build runs without it first. **If Bull Run reds in the real battery: revert-file-halt
   + surface the prepared remedy** (a citation-stamped `assaultDoctrine` posture for McDowell's
   documented piecemeal commitment — the exact Fredericksburg "cautious" precedent, D92
   accurate-inputs) **as a DECISION-NEEDED for Aaron.** Never weaken the gate; never tune the
   trigger toward it (SL-7).
4. **Captured-honesty = a DECISION-RULE, not a numeric gate:** `captured` stays a logged WATCH row
   everywhere (SL-7), plus a RED-CLASS rule in the build battery — a five-figure captured column at
   any battle whose record documents NO mass surrender is a refute-and-revert defect adjudicated by
   Aaron as gate owner; fixed by mechanism or reverted, never re-tuned numerically. *(Recommended.)*
5. **The phase-clock question (D265): FILE the accurate-inputs audit; clocks stand meanwhile** —
   NEW ledger **E57**: audit every phase `timeLimitSec` against documented phase durations and
   normalize to a CONSISTENT compression ratio (measured today: flat 220s = ~49×–90× inconsistent
   compression vs the single-battle ~30×). The D92/E52 playbook — correct the INPUT, accept the
   result; never lengthen-to-flip (D74). Separate sim-affecting milestone. *(Recommended.)*
6. **Queue: E56 → the E53 BUILD → the E47 flips → E46 Piper honestly → PM3.** E56 (bullrun1
   baseline attribution + deliberate re-anchor) runs FIRST — bullrun1 is asymmetric and
   wing-active, so a drifted baseline makes build attribution impossible. The flip re-attempt's
   DIRECTION gate projects green (seam 8/8 vs ≥4/8); its `captured>0` half is unreached by any E53
   config — **if it reds, that half goes to an E54-scoped design session, never a weakened gate.**
   The E46 Piper re-attempt is EXPECTED RED (seam 4/8 vs ≥6/8) — E46's completion stays honestly
   open pending E57 and/or E54. PM3 stays hard-gated on E47 fully landing. *(Recommended.)*

## §2 — The measured evidence (all 0 pe; harnesses `.tmp/measure-attacker-d267{,b,c,d,e}.mjs`)

Engine facts (first-hand): the D64 attacker (T0:823-904) is per-unit and deterministic — commit
requires `!fog && !_atkCautious`, `globRatio ≥ ATK_GLOBAL_FLOOR 0.85`, and a per-unit
`localSup` read (`friendMen ≥ foeMen × effLocal` within AI_LOCAL_R 360, visible only); movement
always presses the objective's attacker-side FACE (`aimZ = obj.z + sign×obj.r×0.25` — the "flank"
is a lateral lean, never a wheel); when in range without `localSup` it holds at `rng×0.92` and
trades fire. Rally (T0:537-556) = 6 continuous seconds with no enemy within RALLY_R 240 —
**so deep attacker presence on the rout axis DENIES rally by existing**. A rout (SPD_ROUT 62)
outruns any charge (SPD_LINE 30): captures can only come from PRE-POSITIONED depth, never pursuit.
The SL-2 surrender predicate (T25, LOCKED) fires today when someone actually envelops.

**The plan matrix** (8 seeds; temp builds = the exact preserved E46/E47 evidence rows, applied →
measured → reverted → cmp-proven):

| plan (attacker) | Fredericksburg | Antietam P1 | P1+Piper guns | flipped Shiloh | Antietam P0/P2 |
|---|---|---|---|---|---|
| idle (E55) | 0/8 | 0/8 | — | — | 0/8 |
| D64 AI shipping | 0/8 (cautious by data) | 8/8 | 1/8 (=D264) | 3/8 (=D262) | 0/8 |
| D64 aggressive (hook) | **0/8 @ 5,770 cas, 723 routs** | — | — | — | — |
| naive frontal (E55) | 8/8 @ 2,578 | 8/8 | 0/8 | 0/8 | 0/8 |
| rush+player-charge | 0/4 (cover trap) | 8/8 | 4/8 | 0/8 | 0/8 |
| **envelop (½ deep + ½ press)** | 4/4 (cap: 7,040 **US** — see below) | 5/8, 9,582 CS captured | 6/8 | **8/8** | P2 1/8 |
| **seam-faithful A+B (§3 clauses)** | n/a (cautious) | **8/8** | **4/8** | **8/8** | 0/8 |

Load-bearing readings:
- **The parity gap is two behaviors:** (i) the per-unit `localSup` gate + hold-at-fire-range is the
  measured grinder — even aggressive, the D64 front loses Fredericksburg 0/8 at +124% of a naive
  player's cost; (ii) nothing ever goes AROUND — deep presence is the single highest-leverage craft
  (flips flipped-Shiloh 0/8→8/8 for scripted players, fires E49a captures for the first time in any
  correct-direction config: 9,582 at Antietam P1, blockedS 78, defRally 0).
- **A and B are jointly required** (wing-alone 1/8; press-alone 0/8; composite 8/8) — Aaron lock #1.
- **The trigger is load-bearing, measured:** an unconditional wing at Malvern Hill got the
  attacker's own deep half captured wholesale (19,231 men vs documented CS losses ~5,650 TOTAL,
  no mass surrender) — with the §3 trigger the wing stays HOME at MH (0 deploys, US 8/8).
- **Panel sign correction (all 3 lenses):** the Fredericksburg envelop capture was **7,040 US — the
  attacker's OWN cut-off wing surrendering** (the captured ledger is keyed by the surrendering
  side, T25:134), at a battle where the wing is posture-gated OFF. Player-agency evidence only.
- **The phantom-prisoner class:** the seam emulation still banked cap US 22,267 at Antietam (vs
  documented US captured+missing ~750) — the wing dies deep at phases the front cannot carry
  (P0/P2). Candidate C's recall is the mitigation; the §1.4 decision-rule polices it.
- **Standing directions under seam A+B:** Antietam P0/P1/P2 all hold (the front-read exclusion
  fixed a measured P1 8/8→5/8 double-count regression); Chancellorsville §6 zero-headroom CS 8/8
  on the FULL seed set; MH US 8/8 with the wing home; Shiloh unflipped CS 8/8; Gettysburg D1 CS 8/8
  (improved toward history) with D2/D3 US — **except Bull Run flips US 8/8** (Aaron lock #3).
- **The clock ceiling:** Antietam's historically-held P0/P2 resist EVERY measured plan inside their
  220s clocks (~48 rows, one P2 crack). Phase clocks are flat 220s regardless of documented
  duration = ~49×–90× inconsistent compression (single-objective battles ~30×) → E57 (lock #5).
- Watch note: MH seed 7 reads CS/hold at HEAD (D260/D261 recorded US 8/8; the standing
  probe-malvern-hill tooth is US ≥6/8 → reads 7/8, still green). E56-class drift watch, logged.

## §3 — The doctrine (SL-E53; one universal rule each, ZERO per-battle constants — D74/SL-7)

**D272 note:** §3 preserves the D267 law that was built and refuted in D269. For the next build, use
the operative D272 law in §0: A+B retained, C dropped, E53-active valve added, cautious-v2 plus
`bullrun1` accurate-input posture added.

**The seam (SL-E53-0):** a NEW module (`src/tactical/T26-attacker-parity.js` or next free slot)
dispatched from `fldAiUnit` BEFORE the `fldAiAttacker` branch via the established B-3/B-4 override
pattern: `if (__FIELD.attackerParity && typeof fldParityAiUnit === "function" && fldParityAiUnit(u)) return;`
Byte-identical when off. Active ONLY when: asymmetric (`__FIELD.attacker` set) · fog OFF · posture
aggressive (`!__FIELD._atkCautious`) · the unit is the attacker's AND AI-controlled. The seam
writes ONLY `u.order`/`u.formation` (the no-fudge output wall — never morale/men/cas/victory);
NO `fldRng` anywhere (SL-6 precedent); D64 internals untouched (SL-10) — the seam computes its OWN
reads, recomputing `effLocal` from the FLD constants read-only.

**SL-E53-1 · THE TRIGGER (army-level, recomputed at the seam's cadence):**
armed ⇔ `canCommit` (`globRatio ≥ ATK_GLOBAL_FLOOR`) **AND** the aggregate front read holds:
non-wing, non-routing attacker men within AI_LOCAL_R of the objective ≥ `effLocal` × non-routing
defender men there. **The front read EXCLUDES wing-assigned units by flag** (the measured
double-count amplifier). Visibility semantics match D64 (fog is already excluded).

**SL-E53-2 · THE ENVELOPMENT WING (A):** while armed, SURPLUS front units are peeled to wing duty —
furthest-from-objective first, one at a time, ONLY while the remaining front still satisfies the
bar after the peel, capped at half the army's units. Sticky per phase; fresh phase rosters re-arm
selection. The wing's target flank is LATCHED at formation (thinner flank counting NON-routing
defenders only — the D64 defLeft/defRight routing miscount is not copied, and not edited in place).
Wing station: `x = latchedFlankX`, `z = obj.z − sign×(obj.r + WING_DEPTH)` — the defender's side of
the objective, on the rout/rally axis. Wing units hold station and fight with the existing
targeting/fire/melee code; their presence denies rally within RALLY_R and completes SL-2 corridors
(both measured; ZERO E49a/E49b changes — surfaces LOCKED). **WING_DEPTH:** the measured-effective
depth is 180yd beyond the ring; the panel flagged 180 as a harness artifact — the build must either
prove the exact value non-load-bearing (a ±60 depth-sensitivity A/B leg) or anchor it to an
existing constant with independent rationale (RALLY_R-derived — rally denial IS the mechanism).
Documented, universal, never per-battle, never re-tuned toward any gate.

**SL-E53-3 · THE WAVE (B):** while armed, front units press as a body instead of waiting on
per-unit `localSup`: close onto the ring, and inside `obj.r + ATK_ASSAULT_STANDOFF`-class range
engage the nearest FORMED defender (the existing charge order surface — the D64 assault branch's
own melee doctrine, issued by the seam as orders). The moment the trigger drops, the seam stands
down and D64 resumes (units return to the stock doctrine — hysteresis window per build, documented).
**This supersedes D64 design-lock (a) as recorded in §5.**

**SL-E53-4 · ABANDONMENT + RECALL (C):** army-level, deterministic. Count attacker rout EVENTS
since the attacker last had ring presence (any non-routing attacker unit within `obj.r` — no new
radius constant). When the count reaches **2 × the phase-INITIAL alive attacker brigade count**
(a-priori anchor, the history lens's ≥2×: "the army has broken twice over with zero progress";
FIXED before the battery — a red at the hard gates REFUTES C, never re-tunes it), the army
ABANDONS: front units stand off (hold at fire range — the seam's own posture flag, **never**
`__FIELD._atkCautious`), and **the wing is RECALLED** (wing units release to the stand-off front —
the anti-phantom-prisoner rule). Re-arm on any fresh reinforcement spawn (new men = a new attempt —
the Richardson/D266 pattern) and at each phase boundary (counters reset; denominators re-key to the
fresh roster). Cautious battles are excluded from C entirely (Burnside/Lee must NOT get wiser than
the record — their doomed assaults are the historical INPUT; "called off at dark" is the clock's job).

**Symmetry/§27 note (panel-adjudicated FAILED refutation):** these are AI ORDER-selection doctrines
— the combat MODEL stays universal and side-agnostic; `fldAiAttacker`/`fldAiDefender` are already
AI-only. The player keeps full agency (E55 stands as the standing diagnostic).

## §4 — The build battery (the E53 BUILD milestone's gate; red → revert-file-halt)

**D272 note:** the v2 build must satisfy the original protective battery plus the §0.4 deltas. No
section-4 gate is weakened; C-specific teeth are replaced by "C absent" and valve-isolation teeth.

1. **OFF-state byte-identity, as ASSERTED probe teeth (never prose):** parity flag OFF ⇒ row-for-row
   identical to base across the full A/B; symmetric sandbox byte-identical (attacker null); fog-on
   smoke (the seam never activates); cautious battles (Fredericksburg + Chickamauga P2) byte-identical.
2. **The full 9-battle × BOTH-seed-set A/B vs HEAD, ×2 determinism (byte-identical reruns).** Every
   standing direction gate verbatim: Chancellorsville §6 zero-headroom · MH US ≥6/8 · Antietam
   P0/P1/P2/agg (P1 US ≥6/8 both sets) · Gettysburg agg US · probe-shiloh 31/31 · **Bull Run
   (Aaron lock #3: a red here = halt + the prepared McDowell-posture DECISION-NEEDED, never a
   weakened gate or a tuned trigger)**.
3. **Wing-deploy-count teeth:** 0 at Malvern Hill and every cautious battle; >0 at unflipped Shiloh
   (measured 24) — the trigger's protective behavior is asserted, not assumed.
4. **The E49a/E49b protective teeth re-run WING-ACTIVE** (the tally identity `fielded = survivors +
   kw + captured + missing`, the §5.4 first-break bound, by=destroy boundedness) — the wing creates
   new surrender events; "untouched surfaces" must be proven under the new geometry.
5. **The captured decision-rule rows (Aaron lock #4):** captured logged per battle/side vs the
   documented-record note; five-figure captured at a no-documented-mass-surrender battle =
   refute-and-revert class, adjudicated by Aaron.
6. **Watch rows (logged, never gated — SL-7):** MH attacker ratio (toward the documented 1.8–2.7);
   Fredericksburg-AI cost; attacker-side captured (the phantom-prisoner class — expect C's recall
   to collapse the measured 22,267); rout totals; the depth-sensitivity leg (§3 SL-E53-2).
7. Focused probes: a new `tools/probe-attacker-parity.mjs` (the teeth above) + adjacent
   probe-antietam/probe-chancellorsville/probe-ai; 0 pe everywhere; sim-affecting ⇒ a 3-lens Opus
   commit panel; then the standard docs trail.

**Acceptance projections (recorded so the re-attempts are honest, never tuned toward):** the E47
flip direction gate projects GREEN (seam 8/8 vs ≥4/8) but `captured>0` projects RED → E54-scoped
session for that half; the E46 Piper gate projects RED (seam 4/8 vs ≥6/8) → E46 stays open pending
E57/E54. Both re-attempts run behind their preserved specs and the SAME unweakened gates.

## §5 — Supersession-with-why (recorded per law §7.5)

- **D64 design lock (a) — "GRADUAL per-unit commitment, NOT a knife-edge global-ratio commit" — is
  SUPERSEDED for the armed-wave case (Aaron, D267 popup #2):** what the lock rejected (a global
  army-ratio flip) stays rejected; what it prescribed (per-unit-only `localSup`) is now the
  MEASURED grinder (aggressive D64: Fredericksburg 0/8 at 5,770 mean cas and ~90 routs/battle vs a
  naive player's 8/8 at 2,578; MH ratio 3.59 vs documented 1.8–2.7; 723 rout events in 8 seeds).
  The wave keys on locally-ASSEMBLED mass at the objective — the thing the lock's own rationale
  (avoid the prototype's phase transition) never measured. D64's doctrine remains the fallback
  whenever the trigger is not armed.
- **D262/D263's "the SL-2 corridor is structurally unreachable" is SHARPENED:** unreachable by any
  ATTACKER THAT EXISTED THEN. Measured now: deliberate deep presence completes the predicate at
  correct-direction battles (blockedS 78, captures fired) — the absence of an enveloping attacker
  was the blocker, not the predicate. Flipped-Shiloh's shallow (~180yd) corridor still never
  completes (captured 0 in every config incl. the 8/8 ceiling) — that half remains E54's.

## §6 — Build status

- **D267 law built and red-reverted in D269.** The game stayed byte-identical; build evidence and the
  quick re-land recipe live in `.tmp/e53-build-d269/`.
- **E53-v2 design locked docs-only in D272.** No sim/data/code surface ships with D272. The next
  milestone is the E53-v2 build: restore the preserved D269 T26 build, apply §0's v2 deltas, run the
  full §0.4/§4 battery with ×2 determinism and a fresh commit panel, then commit/push only if green.
