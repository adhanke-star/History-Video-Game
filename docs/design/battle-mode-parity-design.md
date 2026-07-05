# BATTLE-MODE PARITY & ENEMY-MODEL DESIGN LAW — design session 2026-07-03

**Status: AARON-LOCKED (four AskUserQuestion popups + one free-text directive, design session 2026-07-03). NOT yet built.**
This document is the single deliverable of the E42/E43/E45 + ATTACKER-AI design session that D237 authorized. It was
written in a READ-ONLY session (a parallel pane was closing the D237 batch gate): **nothing here is committed, no
tracked file was edited, no code was changed.** The next build session commits this file under its own D### as part of
its first milestone, then builds the plan in §3. Session HEAD at design time: `98311b3` (D237); HEAD may be newer by
build time (D238/D239 were landing in the parallel pane) — that is expected and changes nothing below.

**Evidence discipline:** every claim in this doc was verified against the code THIS session — first-hand reads of
`src/tactical/T2-campaign-link.js`, `src/tactical/T8-phases.js`, `src/87-auto-resolve.js`,
`src/86-battle-conditioning.js`, `src/tactical/T6-presets.js`, `src/tactical/T0-field-sandbox.js` (fldAiAttacker /
fldCheckVictory), `src/85-battle-bridge.js` (bridgeArmy), `build/base.html` (campaignAdvance / genForce / BATTLES /
serializeSave) — then a 4-agent Opus default-refute verification workflow (9 claims: 7 CONFIRMED, 2 PARTIAL with
sharpening corrections, 0 refuted). File:line citations appear throughout.

---

## §1 — THE FOUR LOCKED DECISIONS (append-ready DECISIONS.md form)

The build session appends these under its own numbers (placeholders `D2XX-a..d`), each stamped
**[AARON popup, design session 2026-07-03]**, when the corresponding milestone ships.

### D2XX-a — E42 RESOLVED: auto-resolve becomes a SIM-BACKED resolve (one battle-truth model) — [AARON popup, design session 2026-07-03]
**Decision:** the campaign auto-resolve no longer decides winners from a rating margin. It runs a **seeded headless
real-time sim** of the same conditioned battle (`fldLaunchSandbox` with `renderer:'none'`, `autoBoth:true`, the same
`campaign` ctx and `skirmish` params the fought path uses → `fldStepN` to decision) and reads the outcome through the
same `fldCampaignComputeOutcome` → `fldCampaignApplyOutcome` path the fought battle uses. The
`bridgeResolveOutcome` rating-margin model, its loser-casualty floors (0.42/0.72), its ±5 draw band, and its
margin≥18 decisive threshold are all superseded; `campaignAdvance` and the whole consequence pipeline are untouched.
**Why:** the header claim ("balanced equivalently", "SUBSTITUTABLE" — T2:12-13,27) was refuted by the math: the
rating model ignored the battle's authored OOB entirely (bd.us/bd.cs appear nowhere in the margin — 87:59-103), and
its floors paid an auto-resolved win ~2-3× the inflicted-blood rewards of a typical fought win (measured: fought win
eFrac 0.245 in `tools/shots/probe-campaign-link.json` vs the 0.42 floor) — the game paid MORE for skipping its
centerpiece layer, a §27 violation. A calibrated abstraction would be a permanent re-fitting treadmill; the sim-backed
resolve makes substitutability true **by construction** and extends D74 (accurate inputs → emergent outcomes) to the
third mode. The "your strategic war decided this field" teaching survives as INPUTS: bridgeArmy conditioning,
battle-prep, the bought armory, and (D2XX-b) enemy will all shape the field the AI then fights.
**Popup answer:** Aaron asked "which one of these would be gold standard if cost no object", was given the honest
answer (sim-backed + its full costs), and locked **"Gold standard: sim-backed"** over calibrated-abstraction,
docs-honesty-only, and floors-only.
**Aaron rider (free-text, same session, verbatim):** *"make sure ability to have better weapons upgrade does impact
battlefield results though, only makes sense that way."* — codified as the INVESTMENT-VISIBILITY invariant (§2 PL-3).
Note this decision **fixes a live gap** for that rider: `bridgeArmy` (85:73-130) never reads `C.armory` — under the
old rating model the bought loadout had ~zero effect on a delegated outcome; under the sim-backed resolve the loadout
re-arms the line through the same `_fldArmPlan`/`fldCampaignConditionUnit` seam the fought path uses (T2:63-111,
era-gated), so better weapons genuinely decide delegated battles too. D48 gains a superseding note.

### D2XX-b — E43 RESOLVED: ONE enemy model — authored OOB + era arms everywhere, plus ONE shared, bounded enemy-conditioning contract — [AARON popup, design session 2026-07-03]
**Decision:** the enemy in every mode is the **authored per-battle OOB** (`bd.us`/`bd.cs`) with **era-gated arms**
(`_fldYearWeapon` T2:54-58 real-time; `infWeapon`/`artWeapon`/`cavWeapon` base.html:644-662 Classic — CS lags a year
in both). The auto-resolve generic year curve (`_arEnemyRating` 87:49-56: US-foe 64−4·yi, CS-foe 58+2·yi) **dies with
the margin model** — the OOB already carries each battle's year truth, and the verified defect was substitution (the
curve replaced the authored odds), not double-counting. The strategic→enemy coupling is rebuilt honestly: **one shared
enemy-conditioning function** maps `C.strategy.enemyWill` to a small, **capped** enemy morale/steadiness debuff,
**exact-zero at the fresh-campaign baseline** (enemyWill 72 when the player is CS, 70 when US — 80-victory.js:54,71),
applied through the same conditioning seams in all three modes: the T2 enemy leg covers real-time fought AND the
sim-backed resolve; an `_a6Condition` enemy leg covers Classic.
**Why:** verified split-brain: enemyWill touched battle outcomes ONLY through the now-dead auto-resolve rating term
(87:53-54) — blockade/hard-war/politics eroded enemy will with zero battlefield payoff if you actually fought. With
the margin model gone, doing nothing would silently delete that payoff in every mode. The conditioning version is the
accurate-inputs form (a broken-willed army genuinely fought worse — the 1864-65 CS desertion crisis), §27-clean
(exact-zero default, capped like the E35 precedent), D74-clean (input conditioning, never an output gate).
**Popup answer:** **"Shared enemy conditioning"** over victory-track-only and defer-with-data.

### D2XX-c — E45 RESOLVED: the cross-phase casualty tally becomes a SAFE future seam (phase-aware campaign feedback) — [AARON popup, design session 2026-07-03]
**Decision:** `__FIELD.battleCas` stays (it is NOT dead code — it drives the interphase card T8:186, the end-screen
T8:240, and 5 probes). T8 additionally accumulates a cumulative **fielded** tally per phase, and
`fldCampaignComputeOutcome` (T2:464-484) becomes **phase-aware defensively**: when `__FIELD.phases` is set it
aggregates losses/fielded across ALL phases instead of reading only the final phase's `__FIELD.units`. A probe tooth
exercises a synthetic phased-launch-with-campaignCtx.
**Why:** no multi-phase scenario is campaign-launchable today (`_fldCampaignScenarioFor` T2:197-205 returns only
`bullrun1` or null→procedural), so the final-phase-only counting is latent — but it would silently under-count the
day the multi-phase epics join the campaign (deferred D74 #4), and the sim-backed resolve (D2XX-a) routes through this
exact function. `__FIELD` is never serialized (serializeSave emits only settings+campaign — base.html:3100-3107), so
the extension is save-compat-free. Inert in every reachable path today; load-bearing automatically later.
**Popup answer:** **"Future-seam, made safe"** over document-only and wire-the-epics-now.

### D2XX-d — ATTACKER-AI-PROPOSAL RESOLVED: retired as SUPERSEDED by D64 — [AARON popup, design session 2026-07-03]
**Decision:** `ATTACKER-AI-PROPOSAL.md` moves to `legacy/` with a "RESOLVED — productionized by D64
(2026-06-15), hardened by D73/D231" header; the `START-HERE.md` canonical-list line that still calls it "a STANDING
OPEN-DECISION doc … not yet approved" is corrected. No code change, no balance change.
**Why:** verified — D64 productionized the prototype *with Aaron's locked answers*: the knife-edge
`ATK_ASSAULT_RATIO` binary became the gradual `effLocal` per-unit commit (T0:805-807), the fog inversion was tuned out
(mass-assault/column gated directly on `!__FIELD.fog` — T0:819; fog aids the defender, per D58), it passed the full
gate, and T6 `aiSkill`, D73's `_atkCautious` doctrine, and D231's charge releases all build on it. The doc's open
label survived by inertia (it was last touched in D236's docs pass, which annotated `.tmp/` paths without
re-examining the approval status). Any FUTURE attacker-AI ambition is a new proposal grounded in today's engine
(post-fortifications, post-E47) — not a revival of this one.
**Popup answer:** **"Retire as superseded"** over relabel-at-root and reopen-as-new-work.

---

## §2 — THE DESIGN LAW (each build milestone honors this verbatim)

- **PL-1 · ONE BATTLE-TRUTH MODEL.** A campaign battle's outcome is decided by the real-time engine — fought by the
  player, or fought headless by the AI on the player's behalf (the sim-backed resolve). No parallel outcome model may
  be (re)introduced. Classic hex remains its own playable *engine*, but its consequences flow through the same
  pipeline and its forces obey PL-4.
- **PL-2 · ACCURATE INPUTS, EMERGENT OUTCOMES (D74/D92 extended to the resolve path).** The strategic war reaches the
  battlefield ONLY as inputs — bridgeArmy conditioning, battle-prep, the bought armory/Cannon Corps, engineering,
  enemy conditioning (PL-4). No output gates, no per-battle fudge, no floors, no forced results — in ANY mode.
- **PL-3 · INVESTMENT VISIBILITY (Aaron rider, 2026-07-03).** Every purchasable army investment must measurably reach
  battlefield RESULTS in every battle mode, through accurate inputs. Mandatory probe tooth: an A/B (bought weapons
  loadout vs empty armory, fixed seeds) must show a measurable outcome/casualty shift in the sim-backed resolve; the
  era gate stays (`WEAPONS[ek].era > year` → skipped — no anachronistic arms).
- **PL-4 · ONE ENEMY MODEL.** The enemy is the authored OOB + era-gated arms, conditioned by the strategic war through
  ONE shared contract (enemyWill → capped morale/steadiness debuff; exact-zero at baseline 70/72; §27). The generic
  year curve is dead. No mode may condition the enemy any other way (raidSupply stays — it is a battle-prep purchase,
  already symmetric across modes).
- **PL-5 · ONE OUTCOME SEMANTICS.** One shared definition across modes: `decisive` = destroyed || loser fraction ≥0.6;
  `draw` = only what the sim verdict produces; consequences flow through the unchanged `campaignAdvance`. No
  mode-specific thresholds.
- **PL-6 · DETERMINISM BY WAR STATE.** The sim-backed resolve's seed is a deterministic function of campaign state
  (never wall clock / Math.random): the same war state resolves to the same field. Preserves 87's
  "deterministic-by-performance" promise and probe reproducibility.
- **PL-7 · CROSS-PHASE INTEGRITY.** Whenever `__FIELD.phases` exists, campaign feedback aggregates losses/fielded
  across ALL phases (battleCas + the fielded tally). The final-phase-only read is forbidden.
- **PL-8 · HONEST COPY.** The T2 header, the briefing line ("substitutable…"), and the auto-resolve result card must
  state the true contract: same consequence pipeline; the war shapes the INPUTS; the field decides the outcome. No
  equivalence claims the math doesn't honor. (Teaching honesty outranks marketing symmetry.)
- **PL-9 · BYTE-IDENTITY OF EVERYTHING ELSE.** All new behavior is reachable only via `campaignCtx` / the resolve
  entry point. Standalone menu battles, the sandbox, skirmish, all shipped battle probes, and Classic stay
  byte-identical. Guarded seams, no-op when inactive — the project's standing law.
- **PL-10 · PRESETS STAY A FOUGHT-BATTLE LAYER (decide-&-log, this session).** The sim-backed resolve runs at the
  NEUTRAL preset (veteran × balanced — the shipped, historically-tuned balance), regardless of the player's chosen
  difficulty — consistent with today's auto-resolve (verified: 87 reads no preset), and the Recruit cushion is a
  human-play affordance that would be incoherent applied to an AI fighting for you. Documented in the result card.

---

## §3 — THE BUILD PLAN (bounded milestones, in order; each = build → focused D160/D176 gate → commit+push → docs+ledger)

**Queue slot:** this arc enters AFTER the already-approved queue (D237: batch checkpoint → Soldier's Story + C64 →
E47 → E46 → E13/E41 → S25) unless Aaron explicitly reorders at kickoff. E47 (rout-direction, all four battles) in
particular should land FIRST — it changes fought-battle casualty distributions, and PM3's pacing A/B should measure
the post-E47 engine, not a moving target.

### PM1 — E45 seam safety (+ the D2XX-d docs retirement riding along) — SMALL, LOW risk
- **Files:** `src/tactical/T8-phases.js` (accumulate `__FIELD.battleFielded` per phase beside battleCas — source it
  from the same committed-force arithmetic `_fldSidePhaseCas` uses, T8:93-97); `src/tactical/T2-campaign-link.js`
  (`fldCampaignComputeOutcome`: if `__FIELD.phases`, fielded/lost = the cumulative tallies); probe (extend
  `tools/probe-phased-ab.mjs` or `probe-campaign-link.mjs` with a synthetic phased+campaignCtx launch asserting the
  aggregated fractions). Docs: `git mv ATTACKER-AI-PROPOSAL.md legacy/` + superseded header + the START-HERE line +
  commit THIS design doc.
- **Guarded seams:** the computeOutcome branch fires only when `__FIELD.phases` is set AND campaignCtx exists —
  unreachable in every shipped path; all multi-phase menu battles carry no campaignCtx → byte-identical.
- **Gates:** node --check ×3 · build GATE OK · the extended probe + adjacent probe-antietam/probe-gettysburg
  (battleCas teeth unchanged) · JSON/pageerror readback · diff-check.
- **Risk:** LOW. Nothing reachable changes; the probes prove it.

### PM2 — E43 shared enemy conditioning — MED-LOW risk
- **Files:** `src/tactical/T2-campaign-link.js` (enemy leg in `fldCampaignCondition`/`fldCampaignConditionUnit`,
  reading the shared function); `src/86-battle-conditioning.js` (enemy leg in `_a6Condition`); the shared function
  itself (new small `src/` module or a home in 85 — build session's call; ONE implementation, two consumers).
  **The old auto-resolve rating term (87:53-54) is left UNTOUCHED here** — auto-resolve doesn't run the sim yet, so
  there is no double-count in any single mode at any point; the term dies wholesale in PM3.
- **Contract:** input `C.strategy.enemyWill`; output a morale delta (and optionally steadiness), **exact-zero at the
  side-correct baseline (72 CS-player / 70 US-player — 80-victory.js:54,71)**, hard-capped (build session tunes the
  cap with A/B; document it like E35's ≤6.0 precedent), clamped, NaN-safe (the E05 typeof+isFinite idiom).
- **Gates:** byte-identity at fresh campaign state (baseline probes seed-for-seed) · A/B at eroded will (N seeds, both
  sides, logged numbers — direction: eroded will → measurably weaker enemy, bounded) · probe tooth pinning
  exact-zero-at-baseline + the cap · node --check · GATE OK · adjacent probe-campaign-link/probe-bridge · Opus review
  (sim-affecting).
- **Risk:** MED-LOW. Reachable only mid-campaign with moved enemyWill; fresh-state byte-identity is provable.

### PM3 — E42 sim-backed resolve — the big one; HIGH effort, bounded blast radius
- **Files:** `src/87-auto-resolve.js` (`bridgeResolveOutcome` → a headless-sim runner; `_arEnemyRating` deleted;
  `_arApplyCasualties` retained — the outcome-apply path still consumes fractions; `_arShowResult` rewritten
  honestly per PL-8); `src/tactical/T2-campaign-link.js` (header rewrite PL-8; briefing line T2:442; reuse
  `_fldCampaignSkirmishParams` + `fldCampaignComputeOutcome` + `fldCampaignApplyOutcome` — the apply path already
  mirrors the fought path by construction). **No `build/base.html` edit** (campaignAdvance untouched).
- **Mechanism:** build the same conditioned battle the fought path would launch
  (`fldLaunchSandbox({renderer:'none', autoBoth:true, campaign:ctx, skirmish:_fldCampaignSkirmishParams(bd,C),
  seed:f(C)})`) → `fldStepN` to decision → `fldCampaignComputeOutcome()` → the shared apply path → `campaignAdvance`.
  Seed `f(C)` per PL-6 (e.g. a stable hash of side+idx+stats.battles — build session decides, must be war-state-pure).
  Teardown discipline: the headless launch must not disturb an open UI (launch/exit hygiene probed).
- **Named sub-decision (decide-&-log in the milestone):** campaign First Bull Run — resolve via the procedural
  skirmish params (consistent, fast) or via the historical bullrun1 scenario headless (more faithful; CS-favored 8/8
  under its fog default, i.e. a US auto-resolve usually loses — historically apt, pacing-relevant). A/B both, log,
  pick, document.
- **Gates (the full stack):** determinism probe (same state → identical outcome twice) · **PL-3 investment-visibility
  A/B** (loadout vs empty armory, fixed seeds → measurable shift) · **campaign-pacing A/B** (full both-side chains ×
  N seeds vs the old model: win/loss/draw rates, funds flow, recovery frequency, chain completion — logged in the
  D###; §27 check: pacing stays playable for the delegating player) · probe-campaign-link rewrite (the old margin
  pins die; new teeth: sim-backed outcome shape, XP parity, infl/casualty bookkeeping) · adjacent probe-bridge /
  probe-full-campaign · byte-identity of every fought/standalone path · 0 pe · **Opus adversarial panel pre-commit**
  (sim-affecting, D235 precedent) · D48 superseding note in DECISIONS.
- **Risk:** HIGH (outcome distributions change by design) — contained: resolve-only code paths; fought paths
  byte-identical; the pacing A/B is the arbiter, and a red A/B halts per HALT rules rather than shipping a
  worse-paced campaign.

### PM4 — (folded into PM1) docs retirement — listed for completeness; no separate milestone.

---

## §4 — ATTACKER-AI-PROPOSAL.md handling note
Per the parallel-session discipline of the design session, **ATTACKER-AI-PROPOSAL.md was NOT edited here.** The build
session performs the retirement (PM1): `git mv` to `legacy/`, prepend the superseded header, fix the START-HERE
canonical-list line, and flip the REVIEW-QUEUE E42/E43/E45 PROPOSED lines to their D### as each milestone lands.

---

## §5 — PASTE-READY BUILD-SESSION KICKOFF PROMPT

> **PREAMBLE — MANDATORY ENTRY CHECKS (added 2026-07-04, §6 queue registration).** Before ANY work: (i) verify
> `git status --short` is CLEAN and HEAD is at or beyond **D239** (`git log --oneline -6` — D238 batch-gate bank +
> D239 Casler/C64/C65 must both be in history); (ii) check whether **E47** (per-scenario homeEdgeZ rout fix) has
> landed — **PM3's pacing A/B is GATED on E47 being in the engine**; if E47 is not landed, M1/M2 may proceed but M3
> must HALT at its boundary and surface; (iii) your FIRST commit (M1) COMMITS THIS DOC
> (`docs/design/battle-mode-parity-design.md`, plus applying the §6 patch blocks) before any code work; (iv) the
> approved queue order is D239 → E47 → E46 → E13+E41 → S25 → THIS ARC — starting the arc ahead of E46/E13+E41/S25
> requires **Aaron's explicit reorder in THIS session** (ask via popup if ambiguous; his call alone).
>
> **ultracode — xhigh.** You are Claude Fable 5 building the **battle-mode parity arc** for "The Civil War" (Aaron's
> personal teaching wargame at `~/Desktop/Video Game`; NOT MJI). Zero context — load from disk.
> ```
> cd ~/Desktop/Video\ Game
> git fetch origin && git status --short --branch && git pull --ff-only origin main
> git log --oneline -6
> ```
> **Read order:** `START-HERE.md` → `FABLE-5-PLAYBOOK.md` §3 (its snippets bind this run) → `HANDOFF.md` +
> `WAKE-UP.md` top blocks → **`docs/design/battle-mode-parity-design.md` — the AARON-LOCKED design law for this arc;
> honor §2 verbatim** → `REVIEW-QUEUE.md` E42/E43/E45 lines → DECISIONS newest-first (D237+; D74/D92 for the
> no-fudge/accurate-inputs law; D48/D64 context) → the code: `src/87-auto-resolve.js`,
> `src/tactical/T2-campaign-link.js`, `src/tactical/T8-phases.js`, `src/86-battle-conditioning.js`,
> `src/85-battle-bridge.js`, `src/80-victory.js` (enemyWill baseline), `build/base.html` campaignAdvance (read-only
> context — never edit base.html).
> **Precondition check:** confirm the D237 batch checkpoint closed green and where the approved queue stands
> (Soldier's Story+C64 · E47 · E46 · E13/E41 · S25). **E47 should be landed before PM3's pacing A/B**; if the queue
> hasn't reached this arc and Aaron hasn't explicitly reordered, STOP and surface.
> **Behavioral law (PLAYBOOK §3):** act when you have enough; audit every progress claim against a tool result from
> THIS session; helpers always explicit model+effort, never Fable; HALT only for irreversible/money/scope forks.
> **THE WORK — three bounded milestones, in order, each committed+pushed behind its own focused gate (D160/D176),
> with a D171 clean stop between groups:**
> **M1 (PM1+docs):** commit `docs/design/battle-mode-parity-design.md`; T8 `battleFielded` tally; phase-aware
> `fldCampaignComputeOutcome` (guarded: phases+campaignCtx only); probe tooth (synthetic phased+campaign launch);
> `git mv ATTACKER-AI-PROPOSAL.md legacy/` + superseded-by-D64 header + START-HERE line fix; append the D2XX-c and
> D2XX-d DECISIONS entries from the design doc §1 (real numbers); flip the E45 ledger line.
> **M2 (PM2):** the shared enemy-conditioning function (exact-zero at enemyWill 72/70 baseline, hard-capped,
> NaN-safe) consumed by the T2 enemy leg + the `_a6Condition` enemy leg; leave 87's rating term untouched (it dies in
> M3); gates per design doc §3 PM2 (fresh-state byte-identity seed-for-seed + eroded-will A/B with logged numbers +
> Opus review); append D2XX-b; flip E43.
> **M3 (PM3):** the sim-backed resolve per design doc §3 PM3 — headless seeded launch of the same conditioned battle,
> outcome via the shared compute/apply path, `_arEnemyRating` + the margin model + the floors deleted, honest copy
> (T2 header, briefing line, result card), war-state-pure seed, Bull-Run sub-decision A/B'd and logged; the FULL gate
> stack: determinism probe · **investment-visibility A/B (PL-3: bought loadout vs empty armory must measurably shift
> outcomes — Aaron's explicit rider)** · full both-side campaign-pacing A/B vs the old model with logged numbers ·
> probe-campaign-link rewrite · adjacent probes · byte-identity of all fought/standalone paths · 0 pe · Opus
> adversarial panel pre-commit; append D2XX-a + the D48 superseding note; flip E42. If the pacing A/B shows an
> unplayable delegating-player experience, HALT and surface with the numbers — do not gate the outcome (PL-2), do not
> ship red.
> **Gate law:** per milestone — build GATE OK · node --check on touched files · focused probe(s) · 1-3 adjacent
> probes · JSON/pageerror readback · `git diff --check` · adversarial review scaled to risk (M2/M3 = Opus panel) ·
> commit + `git push origin main` (the push updates the LIVE public game) · docs (DECISIONS/RUN-LOG/HANDOFF/WAKE-UP)
> + REVIEW-QUEUE ledger flips. Probes: foreground, `2>/dev/null`, `export TMPDIR="$PWD/.tmp"`, one shared server on
> 8765, serialized, READ `tools/shots/*.json`, unpiped exit codes.
> **Locks that stand:** D74 no-fudge · §27 exact-zero/capped · M8-battle-build/Q5/Q6 LOCKED · Phase H parked (D214) ·
> Phase D deferred · E33 parked. **D171:** stop clean at each committed+pushed milestone boundary; refresh the
> continuation prompt.

---

## §6 — QUEUE REGISTRATION (2026-07-04)

**Queue position (Aaron-locked, 2026-07-04, per the main pane's recommendation he accepted): NO reorder.** The
battle-mode-parity arc is QUEUED WORK for a future session, entering AFTER the D237 approved-proposals queue:
**D239 (Casler #16 + C64 Stannard split + C65 Berry-attach) → E47 rout-fix → E46 Antietam draw → E13+E41 save
hardening → S25 palette → THEN this arc (M1 first = commit this doc).**
**Entry conditions:** working tree clean · HEAD ≥ D239 · **E47 landed before PM3's pacing A/B** (standing regardless
of any future reorder). By entry time expect BOTH `docs/design/e46-antietam-research.md` (the main pane's pre-staged
E46 dossier) and this doc to be committed. **Aaron may pull the arc forward at any clean boundary — his call alone;
M1 (doc commit, zero sim surface) is the only piece safe to pull forward independently.** State at registration:
segment 1 of the vet:noreg battery 93/93 green (the sole "red" was the harness killing a GREEN probe-atmospherics
2.4s over its 360s budget — budget raised to 600s, no assertion touched); segment 2 in flight; the main pane owns the
writer lane through D238/D239.

### §6.1 — AMENDMENT (2026-07-04, Aaron, D250): PM2's CHANNEL IS **STRENGTH**, NOT MORALE/STEADINESS
The D249 build attempt proved the morale/steadiness channel INVERTS for an attacking player under the pre-E49
engine (consequence-free rout-rally cycling re-contests the objective; full evidence D249). Aaron resolved the
fork the same day: **the PL-4 / D2XX-b enemy-conditioning contract keeps every term (ONE shared function, two
consumer legs, exact-zero at the 72/70 baseline, hard-capped, NaN-safe, §27) but outputs a capped enemy
STRENGTH multiplier (will-erosion = desertion = fewer men at muster) instead of a morale delta.** Read every
"morale/steadiness debuff" in §1 D2XX-b and §2 PL-4 through this amendment. The morale/steadiness form may be
re-examined after E49 lands (with ledger E51 — same mechanism family). PM3 and its gates are unchanged.

> **BUILD STATUS (D266, 2026-07-05): SHIPPED.** The strength form landed exactly per this amendment + the D251
> spec, with E48+E49a+E49b live underneath: `bridgeEnemyWillStrengthMul` (85) + the T2 men/maxMen and
> `_a6Condition` strength/maxStr consumer legs. The D250 red trigger read GREEN — playerWins 13→17 FOR the
> player (the D249/D251 inversion measured dead); fresh-state byte-identity 0/20; like-for-like casualty
> channel UP; 3× SAFE_TO_COMMIT panel. Direction-parity across all three modes at will 30 (T2 ×0.94 men ·
> 86 ×0.94 strength · 87 −7.0 rating); **magnitude parity is deliberately deferred to PM3** (the 87 rating
> model keeps its own enemyWill read until the sim-backed resolve replaces it — the PL-3 substitutability
> nuance is on the record in D266). Residuals riding E53: the s5 rout-cycling seed class; captured=0 under
> erosion (envelopment geometry). Evidence: DECISIONS **D266**.

### §6.2a — PATCH BLOCK: V1-CHECKLIST.md queue entry (apply with M1)
Slot under the approved-proposals group after the S25 line; if no such group exists yet in V1-CHECKLIST.md, insert
the group header line too:

```markdown
### Approved-proposals queue → battle-mode-parity arc (design law: docs/design/battle-mode-parity-design.md, Aaron-locked 2026-07-03/04)
- [ ] **PARITY-M1 seam + docs:** commit the design doc; T8 `battleFielded` tally; phase-aware `fldCampaignComputeOutcome` (guarded: phases+campaignCtx only) + probe tooth; retire ATTACKER-AI-PROPOSAL.md → legacy/ (superseded by D64) + fix the START-HERE line. LOW risk, zero sim surface — the only piece safe to pull forward independently.
- [ ] **PARITY-M2 shared enemy conditioning:** ONE bounded contract (enemyWill → capped enemy morale/steadiness debuff, exact-zero at the 72/70 baseline) consumed by the T2 enemy leg + the `_a6Condition` enemy leg; 87's rating term untouched (dies in M3); fresh-state byte-identity seed-for-seed + eroded-will A/B + Opus review.
- [ ] **PARITY-M3 sim-backed resolve (AFTER E47 lands — hard gate):** auto-resolve = seeded headless sim of the same conditioned battle via the shared compute/apply path; `_arEnemyRating` + margin model + 0.42/0.72 floors deleted; honest copy (T2 header, briefing, result card); war-state-pure seed; determinism probe · investment-visibility A/B (PL-3, Aaron rider: bought loadout must measurably shift outcomes) · full both-side pacing A/B vs the old model · probe-campaign-link rewrite · Opus panel; D48 superseding note.
```

### §6.2b — PATCH BLOCK: DECISIONS.md entry (apply with M1; build session assigns the real D###)
The per-milestone entries in §1 (D2XX-a..d) are appended as each milestone lands; THIS consolidated entry registers
the design session itself and is appended at M1:

```markdown
## D### — BATTLE-MODE PARITY DESIGN SESSION: E42/E43/E45 + the attacker-AI fork RESOLVED — [AARON popup, design session 2026-07-03; queue-registered 2026-07-04]
A dedicated read-only design session (authorized in the D237 popup; run parallel to the D237/D238 batch gate, no git)
resolved the last four open design debts behind the tactical/strategic contract. Code reality verified first-hand +
by a 4-agent Opus default-refute workflow (9 claims: 7 CONFIRMED, 2 sharpened, 0 refuted). The full law + build plan:
`docs/design/battle-mode-parity-design.md` (committed with this entry; its §2 PL-1..PL-10 is the verbatim law).
- **E42 (popup: "Gold standard: sim-backed"):** auto-resolve becomes a seeded headless sim of the same conditioned
  battle, outcome via the shared `fldCampaignComputeOutcome`/`ApplyOutcome` path; the rating-margin model, its
  0.42/0.72 loser floors, ±5 draw band, and margin≥18 decisive threshold are superseded. **Why:** the "balanced
  equivalently / SUBSTITUTABLE" header claim was refuted — the margin ignored the authored OOB and paid a delegated
  win ~2-3× a fought win's inflicted-blood rewards (measured eFrac 0.245 fought vs the 0.42 floor), teaching players
  to skip the tactical layer (§27 violation). Sim-backed makes substitutability true by construction (D74 extended).
  Aaron asked for the cost-no-object gold standard and locked it knowing the full pacing-A/B cost.
- **E42 rider (Aaron free-text, verbatim):** "make sure ability to have better weapons upgrade does impact
  battlefield results though, only makes sense that way" → the PL-3 INVESTMENT-VISIBILITY invariant with a mandatory
  loadout-vs-empty-armory A/B probe tooth. (Fixes a live gap: `bridgeArmy` never read `C.armory`, so weapon purchases
  had ~zero effect on delegated outcomes under the old model.)
- **E43 (popup: "Shared enemy conditioning"):** ONE enemy model — authored OOB + era arms in every mode; the generic
  year curve dies with the margin model; enemyWill couples to battle through ONE shared, capped conditioning function
  (exact-zero at the 72/70 fresh baseline), consumed by the T2 enemy leg and the `_a6Condition` enemy leg. **Why:**
  enemyWill previously reached battle outcomes ONLY via the dead rating term — strategic will-erosion paid off only
  when you did NOT fight; the conditioning form is the accurate-inputs, §27-clean replacement (1864-65 desertion
  crisis grounding).
- **E45 (popup: "Future-seam, made safe"):** `battleCas` stays (live interphase/end-screen UI + 5 probes — not dead
  code); T8 gains a cumulative fielded tally and `fldCampaignComputeOutcome` becomes phase-aware defensively.
  **Why:** the final-phase-only count is latent today (no phased battle is campaign-launchable) but would silently
  under-count when the epics join the campaign — and the sim-backed resolve routes through this exact function;
  `__FIELD` is never serialized, so the fix is save-compat-free.
- **Attacker-AI fork (popup: "Retire as superseded"):** ATTACKER-AI-PROPOSAL.md → `legacy/` with a
  superseded-by-D64 header; the stale START-HERE "not yet approved" line corrected. **Why:** D64 (2026-06-15)
  productionized the prototype with Aaron's locked answers (gradual `effLocal` commit; fog-aids-defender preserved),
  and T6 aiSkill / D73 cautious doctrine / D231 charge releases all build on it.
- **Queue registration (2026-07-04, Aaron-locked): NO reorder** — the arc enters after D239 → E47 → E46 → E13+E41 →
  S25; PM3 is hard-gated on E47; Aaron alone may pull the arc forward, M1 alone being safe to pull independently.
```

### §6.2c — PATCH BLOCK: HANDOFF/WAKE-UP queue blurb (apply with M1)

```markdown
**QUEUED — the battle-mode-parity arc (Aaron-locked design law: `docs/design/battle-mode-parity-design.md`, popups
2026-07-03, queue-registered 2026-07-04).** Three bounded milestones after the approved-proposals queue (D239 → E47 →
E46 → E13+E41 → S25): PARITY-M1 (E45 seam safety + doc commit + ATTACKER-AI-PROPOSAL retired as superseded-by-D64) →
PARITY-M2 (shared enemyWill→enemy conditioning, exact-zero baseline, capped) → PARITY-M3 (sim-backed auto-resolve
replacing the rating margin + floors; **hard-gated on E47 being landed** — its pacing A/B must measure the post-E47
engine; includes the PL-3 investment-visibility A/B, Aaron's weapons rider). Kickoff prompt: the doc's §5. Aaron may
pull the arc forward at any clean boundary; M1 is the only independently safe pull.
```
