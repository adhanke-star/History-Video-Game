# 1864-65 Attrition (Overland Campaign & Petersburg) - Battle-Build Research Packet

**Status:** D327 durable battle-build research packet (docs only; no data/runtime/registry change).
**Lane:** 1864-65-attrition
**Verdict:** READY_FOR_SPEC (ratified by D327 adversarial pass; see Verification Notes)

The Overland Campaign is the lane's flagship T8 multi-phase build (attacker=US vs a dug-in Lee across Wilderness -> Spotsylvania -> Cold Harbor), and Spotsylvania's Bloody Angle and Cold Harbor's June 3 assault are both strong standalone single-phase candidates that already fit the current engine grain.

## 1. Candidate Battles Ranked By Buildability

| Rank | Battle/Campaign | Buildable shape | Buildability score | One-line why |
|---|---|---|---|---|
| 1 | Spotsylvania Court House (May 8-21 1864) | Single-phase (Mule Shoe / Bloody Angle assault) | High | Fortified-assault candidate with a crisp objective (the salient), a clear defender-holds/attacker-breaks-in lean, and 3+ divisions on works — a textbook D90 defender-hold setup. |
| 2 | Overland Campaign (Wilderness -> Spotsylvania -> Cold Harbor) | T8 multi-phase (attacker=US) | High | Three named sequential fights, one strategic through-line (Grant refuses to retreat), casualties carry forward — the lane's flagship build. |
| 3 | Cold Harbor (Jun 3 1864 assault) | Single-phase (doomed frontal assault) | High | One coherent fight; open-approach-into-entrenched-enfilade is exactly the attacker-fails geometry the grain produces, and honestly a Union tactical failure. |
| 4 | The Wilderness (May 5-7 1864) | Single-phase (dense-woods meeting engagement) | Med-High | Best-in-lane fit for the fog/woods engine-grain lesson; harder to score because it is historically Inconclusive (bistable-risk — needs a designed lean). |
| 5 | The Crater / Petersburg assault (Jul 30 1864) | Single-phase (mine-crater assault) | Med | Buildable as an assault-fails scenario, but the mine explosion + massacre demand careful dignity handling and add no new combat mechanic; strong teaching value. |
| 6 | Petersburg initial assaults (Jun 15-18 1864) | Single-phase (fortified assault) | Med | Buildable but redundant with Spotsylvania/Cold Harbor as "assault vs works"; lower distinctiveness. |
| 7 | Petersburg siege (Jun 1864-Apr 1865, whole) | Campaign-teaching-only | Low | 292-day siege of attrition/logistics has no tactical-battle shape at brigade-marker scale; teach as strategic-layer + card content. |
| 8 | Petersburg final breakthrough (Apr 2 1865) | Single-phase (breakthrough) candidate | Med-Low | Buildable as an attacker-seizes scenario (VI Corps cracks a thinned line), but needs its own OOB research; teaching-only until then. |

## 2. Recommended Playable Shape

**Top candidate A - Overland Campaign (T8 multi-phase, attacker=US, defender=CS/Lee).**
- Phase 1 - **The Wilderness** (Orange Plank Road / Saunders Field): US must claw through dense woods; objective = clear the crossroads. scoreWeight 1.
- Phase 2 - **Spotsylvania: the Mule Shoe** (Bloody Angle): US assaults a fortified salient; objective = break into the works. scoreWeight **3 (decisive)** - it is the campaign's defining assault and the clearest tactical decision point.
- Phase 3 - **Cold Harbor** (June 3 assault line): US frontal assault into entrenched enfilade; objective = carry the CS line (historically fails). scoreWeight 1.
- Total 5. Roles: attacker=US throughout, defender=CS. The aggregate DRAW band should let a historically-accurate player (heavy Union losses, no clean breakthrough, campaign continues) land near a strategic-attrition read rather than a crisp tactical "win," honoring that Grant kept advancing.

**Top candidate B - Spotsylvania (standalone single-phase, the Bloody Angle).**
- Role: attacker=US (Hancock's II Corps + Wright's VI Corps), defender=CS (Ewell's Second Corps on the salient).
- Engine-grain: to make the DEFENDER hold per D90, give CS 3+ divisions on a salient with breastworks + timed reinforcement (Lee's counterattack divisions) + cautious posture; give US a strength edge and an initial break-in so the fight is the historically brutal near-run 22-hour hand-to-hand, not a walkover either way. Prefer a slight defender lean (line ultimately re-formed) over a true 50/50 to avoid RNG bistability.

Cold Harbor as an alternative standalone is the cleanest attacker-fails teaching scenario: open approach + dense CS entrenchment + enfilade geometry + fog OFF (the historical dawn fog aided confusion, but per the grain, model the killing ground via terrain + few gaps, not a fog defender-buff) yields the doomed-assault result from true inputs.

## 3. Source Register

| Source | Use | URL | Confidence |
|---|---|---|---|
| ABT - Wilderness | Dates, corps commanders (Warren/Hancock/Sedgwick/Burnside), 101,895 vs 61,025, ~17,000 vs ~13,000 casualties, terrain names | https://www.battlefields.org/learn/civil-war/battles/wilderness | Verified (cited; not re-fetched this pass) |
| ABT - Spotsylvania Court House | Dates, Sedgwick killed May 9 (highest-ranking Union officer killed), Mule Shoe/Bloody Angle May 12, 18,399 vs 12,687 casualties | https://www.battlefields.org/learn/civil-war/battles/spotsylvania-court-house | Verified (fetched D327) |
| ABT - Cold Harbor | June 3 dawn assault (II/VI/XVIII Corps), 12,737 vs 4,595 casualties, Grant's regret quote, CS victory | https://www.battlefields.org/learn/civil-war/battles/cold-harbor | Verified (fetched D327) |
| ABT - Petersburg | Siege dates Jun 1864-Apr 1865, Crater Jul 30, New Market Heights, Fort Stedman, Apr 2 1865 breakthrough, USCT concentration/Medals of Honor | https://www.battlefields.org/learn/civil-war/battles/petersburg | Verified (cited; not re-fetched this pass) |
| Wikipedia - Battle of the Crater | Ferrero's USCT 4th Division trained to lead, Meade's swap order, massacre of Black troops (1.8:1 wounded-to-dead vs 4.8:1 norm), 3,798 vs 1,491 casualties | https://en.wikipedia.org/wiki/Battle_of_the_Crater | Verified (fetched D327) |
| LOC - Grant's lieutenant general commission (10 Mar 1864) | Grant's exact rank on all lane battle dates = Lieutenant General; grade revived Feb 29 1864, confirmed Mar 2, commissioned Mar 10 | https://www.loc.gov/item/mcc.017/ | cite-pending (URL NOT fetched this pass) |
| NARA - Lincoln nomination of Grant to Lieutenant General | Corroborates revived Lt. Gen. grade + General-in-Chief position (a role, not a rank) | https://www.archives.gov/legislative/features/grant | cite-pending (URL NOT fetched this pass) |

## 4. OOB And Rank Traps

- **Ulysses S. Grant - Lieutenant General** (commissioned Mar 10, 1864), holding the position of **General-in-Chief**. TRAP: he is NOT a full "General" on any lane battle date - the four-star grade was created for him only in July 1866. "General-in-Chief" is a duty assignment, not a rank. He commands via Meade, not the Army of the Potomac directly. (Rank facts well-corroborated; specific LOC/NARA URLs remain cite-pending per Source Register.)
- **George G. Meade - Major General**, commanding the Army of the Potomac under Grant's direct supervision. TRAP: do not promote him or make him the theater commander; Grant travels with and oversees his army.
- **Robert E. Lee - General** (full general, CSA - correct as "General"; he outranks the Lt. Gens. under him). Army of Northern Virginia.
- **John Sedgwick - Major General, VI Corps** - alive at the Wilderness (May 5-7) but **killed May 9, 1864 at Spotsylvania** ("They couldn't hit an elephant at this distance"), the highest-ranking Union officer killed in the war. (ABT renders the date ambiguously as "May 9-10"; consensus and the day of the incident is May 9.) TRAP: any Spotsylvania OOB dated after May 9 must transfer VI Corps to **Maj. Gen. Horatio G. Wright** - a dead-officer-commanding error waiting to happen if the Bloody Angle (May 12) scenario still lists Sedgwick.
- **Winfield S. Hancock - Major General, II Corps** (led the May 12 Mule Shoe breakthrough). Correct.
- **Gouverneur K. Warren - Major General, V Corps.** Correct.
- **Ambrose E. Burnside - Major General, IX Corps.** TRAP (corps-attachment): at the Wilderness and early Spotsylvania, IX Corps was an **independent command reporting directly to Grant, NOT under Meade**, because Burnside outranked Meade by date of commission; it was folded into the Army of the Potomac only in late May 1864. Do not draw IX Corps under Meade in the early phases.
- **Philip H. Sheridan - Major General**, commanding the Cavalry Corps (relevant if cavalry markers appear).
- **Edward Ferrero - Brigadier General**, 4th Division (USCT), IX Corps - trained to lead the Crater assault; pulled the day before by Meade's order. Correct rank.
- **CSA corps (Lt. Gen. grade existed since Oct 1862 - all fine): Richard S. Ewell** (Second Corps), **A.P. Hill** (Third Corps), **James Longstreet** (First Corps). TRAP: **Longstreet was wounded by friendly fire May 6, 1864 at the Wilderness** and is absent thereafter; **Richard H. Anderson took First Corps as a Major General** (he was not promoted to Lt. Gen. until May 31, 1864) - so a Spotsylvania OOB must NOT list Longstreet, and must not over-rank Anderson.
- **P.G.T. Beauregard - General** (full), commanded the initial Petersburg defense (Jun 1864) - relevant only if a Petersburg-assault scenario is built.

## 5. Terrain And Objective Landmarks

- **Wilderness:** Orange Turnpike, Orange Plank Road, Saunders Field, Brock Road (the key crossroads), Widow Tapp field (Lee-to-the-rear / Texas Brigade counterattack), dense second-growth woods (the defining cover/fog terrain).
- **Spotsylvania:** the **Mule Shoe** salient and the **Bloody Angle** (west face), the breastworks/log works, the McCoull and Harrison houses, Laurel Hill, the Brock Road, the Court House itself (the road junction both armies raced for).
- **Cold Harbor:** the Cold Harbor crossroads, the entrenched CS line along Boatswain's Creek/swamp, the ravines and swampy approach ground, the killing field in front of the works.
- **Petersburg / Crater:** the Dimmock Line, Elliott's Salient / the mine and the Crater itself, the covered ways, Cemetery Hill; **New Market Heights** (USCT valor, Sept 29 1864) and **Fort Stedman** (Mar 25 1865) for later scenarios; the Apr 2 1865 breakthrough sector (VI Corps).

## 6. Teaching Cards And Anti-Lost-Cause Framing

- **"Grant the Butcher" - the myth rebutted.** Attrition was a deliberate, war-winning strategy against a manpower-inferior enemy, not mindless slaughter. Lee's army bled proportionally as badly (often worse, as a share of a smaller force) and could not replace its losses; Grant could. Naming the strategy honestly is the opposite of romanticizing it.
- **Cold Harbor - honest Union failure.** The June 3 assault was a costly mistake; Grant himself wrote he "always regretted" it. Teach it as a genuine tactical failure WITHOUT flipping to a "butcher" caricature - a hard, admitted error inside a sound campaign.
- **The Bloody Angle - what attrition actually looked like.** 22 hours of hand-to-hand fighting; teach the human cost, not glory.
- **The Crater massacre - dignity rule.** After the failed assault, Confederate troops summarily murdered surrendering and captured USCT soldiers (the wounded-to-killed ratio for Black troops, ~1.8:1, was far outside the ~4.8:1 norm). This is **memory and teaching, never a gamified "win"** - the massacre must never be a score-able player objective or reward; frame it as a documented war crime rooted in the Confederacy's pro-slavery ideology.
- **USCT agency at Petersburg.** The greatest concentration of U.S. Colored Troops served here, earning the large majority of the war's Medals of Honor awarded to Black soldiers (esp. New Market Heights). Center Black soldiers as agents of their own liberation.

## 7. D74 No-Fudge Risks

- **The lane's signature temptation: forcing the historical casualty lopsidedness.** Cold Harbor (12,737 US vs 4,595 CS) and the Crater invite a lazy per-battle `casualtyMult`/`lossMult`/`fireMult` to guarantee the bloody Union result. FORBIDDEN. The disparity must EMERGE from inputs: open approach ground + dense CS entrenchment/breastworks + enfilading line geometry + true gun/soldier counts, so an attacker who charges the works bleeds because the terrain and defense are true, not because a switch is flipped.
- **The 'Cold Harbor 7,000 in 30 minutes' number is teaching-flavor, not an input.** ABT states it, but it is a historiographically disputed figure (Gordon Rhea's scholarship puts the opening-assault toll lower and spread over more than 30 minutes). Never hardcode it as a per-battle casualty count or seed it into the engine - it must remain a loose narrative note.
- **Do not force the winner.** Spotsylvania and the Wilderness were historically Inconclusive; resist a `winner`/`scoreWeight` hack that manufactures a "Confederate defensive victory." Use OOB strength, works, reinforcement timing, and doctrine to produce a defensible lean, and let the DRAW band do the rest.
- **Do not buff the Crater with a "mine explosion" damage event.** The mine's effect is modeled as an initial CS strength/position deficit in the breached sector (fewer defenders, broken works), not a special one-time damage multiplier.
- **Cold Harbor fog:** model the killing ground via terrain + few gaps in the works, NOT a per-battle fog defender-buff; per the grain, run fog OFF and let dense entrenchment do the work.

## 8. Candidate Probe Teeth

- Assert Overland Campaign scenario declares phases named `Wilderness`, `Spotsylvania`/`Mule Shoe`, `Cold Harbor` with scoreWeights `[1,3,1]` summing to 5, decisive phase = Spotsylvania.
- Assert top-level roles attacker=`US`, defender=`CS` on every phase.
- Landmark-string presence guards: `Bloody Angle`/`Mule Shoe`, `Saunders Field`/`Brock Road`, `Cold Harbor`; Petersburg scenarios: `Crater`/`Elliott's Salient`.
- **Rank-trap guards:** reject any OOB where Grant's rank != `Lieutenant General`; reject `General Grant` (full-general) label; reject Sedgwick present in any Spotsylvania phase dated after May 9 (dead-officer guard) and require VI Corps under `Wright`; reject Longstreet present at Spotsylvania (wounded May 6) and reject Anderson labeled Lt. Gen. before May 31; assert IX Corps NOT under Meade in early phases.
- **No-fudge key rejection:** grep the scenario/OOB JSON for `damage|dmg|fireMult|fireMultiplier|casualtyMult|lossMult|killMult|powerMult|fudge` and fail on any hit.
- **Casualty-direction guards:** Cold Harbor phase - US losses > CS losses in the probe's default-tactics run; Crater phase - attacker (US) losses > defender (CS) losses. Guard direction, never a forced number.
- **Registry-baseline updates (D86/D88/D90 both-baselines gotcha):** when the new scenario enters the registry, update BOTH the registry count baseline and the per-scenario manifest baseline in the same slice, or the count probe and the manifest probe disagree.
- Winner/DRAW-band guard: assert aggregate result falls in the intended lean/DRAW band under default tactics (no crisp forced winner for the Inconclusive fights).

## 9. Remaining Traps To Re-Verify Before Spec

- **Division-level OOB** for each phase (which specific US and CS divisions/brigades are ON the objective) is not yet encoded to the accuracy D92 requires - especially Spotsylvania's May 12 (Hancock's II + Wright's VI vs Ewell's defenders + Lee's counterattack divisions). Re-verify from the Official Records / NPS troop-movement maps before writing the OOB.
- **Anderson's exact status** at Spotsylvania (temporary corps command as Maj. Gen. vs the May 31 Lt. Gen. promotion date) - confirm the precise date and title for the May 8-21 window.
- **Cold Harbor XVIII Corps identity** (W.F. "Baldy" Smith, on loan from the Army of the James) and its exact strength - confirm before OOB.
- **Petersburg breakthrough (Apr 2 1865) OOB** is entirely un-researched here; keep teaching-only until a dedicated pass.
- **The Crater's USCT unit identities** (which regiments of Ferrero's 4th Division) need regiment-level confirmation before any card names specific units.
- **LOC/NARA Grant-commission URLs** were not fetched this pass and remain cite-pending; fetch them (or substitute Grant's Personal Memoirs / a standard reference) before the spec anchors the rank claim to those specific links.
- Casualty figures cited are ABT aggregates; per-phase splits (needed to sanity-check the probe's casualty-direction guards) still need OR corroboration. The 'Cold Harbor 7,000 in 30 minutes' figure is disputed and must stay teaching-flavor only.

## 10. Verdict

**READY_FOR_SPEC** (ratified by the D327 adversarial pass). Three ABT/Wikipedia anchor pages were fetched and confirmed directly this pass (Cold Harbor, Spotsylvania, the Crater) - dates, corps commanders, exact casualty numbers and direction, terrain, and the USCT-massacre framing all check out - and two more ABT pages (Wilderness, Petersburg) are cited from the prior pass. The Grant/Anderson/Longstreet/Sedgwick rank-and-date traps are correct as stated (LOC/NARA commission URLs remain cite-pending but the underlying rank facts are standard, well-corroborated history). The engine grain fits cleanly: Spotsylvania as a fortified defender-hold single-phase, or the Overland Campaign as a T8 three-phase attacker=US build, both without any D74 fudge. The Crater is a failed-assault scenario with the massacre as teaching/memory only (never a scoreable objective) - not a massacre-only playable battle - so it does not trip the DO_NOT_BUILD_NOW rule. Residual unknowns (division-level OOB, Anderson's dated title, XVIII Corps strength, Crater regiment identities, the two cite-pending commission URLs) are spec-time verification items, not blockers to starting the spec.

## 11. Exact Next Recommended Slice

Write a **D### Spotsylvania "Bloody Angle" single-phase spec + probe scaffold** in the `chattanooga-plan` mold (attacker=US Hancock+Wright vs defender=CS Ewell on the Mule Shoe; defender-hold tuning per D90; rank-trap guards for the post-May-9 Sedgwick/Wright transfer and the Longstreet-absent/Anderson-Maj.-Gen. CSA OOB; no-fudge key-rejection + Cold-Harbor-style casualty-direction guard). Sequence the standalone Spotsylvania first, then promote it into Phase 2 of the Overland Campaign T8 multi-phase build once its OOB is verified.

## Verification Notes (D327 adversarial pass)

**Sources fetched and confirmed this pass (2026-07-08):**
- **ABT Cold Harbor** (https://www.battlefields.org/learn/civil-war/battles/cold-harbor) - CONFIRMED: casualties 12,737 US (1,844 k / 9,077 w / 1,816 m) vs 4,595 CS (83 k / 3,380 w / 1,132 m); June 3 4:30 a.m. assault by the Second, Sixth, and Eighteenth Corps; Grant's regret quote ("I have always regretted that the last assault at Cold Harbor was ever made..."); Confederate victory. The page DOES state "an estimated 7,000 men are killed or wounded within the first 30 minutes" - so the packet cited it faithfully, but it is a mythologized figure and is now flagged as teaching-flavor only (see Section 7).
- **ABT Spotsylvania Court House** (https://www.battlefields.org/learn/civil-war/battles/spotsylvania-court-house) - CONFIRMED: dates May 8-21 1864; casualties 18,399 US vs 12,687 CS (exact); Sedgwick highest-ranking Union officer killed (page renders date "May 9-10"; consensus May 9); Bloody Angle/Mule Shoe May 12, ~22 hours; Anderson, Lee, Ewell on the CS side; Warren/Hancock/Sedgwick on the US side.
- **Wikipedia Battle of the Crater** (https://en.wikipedia.org/wiki/Battle_of_the_Crater) - CONFIRMED: date July 30 1864; casualties 3,798 US vs 1,491 CS (exact); Ferrero's USCT division trained for two weeks to lead; Meade's day-before swap order; Ledlie's division chosen by lottery; summary execution of Black soldiers with a 1.8:1 wounded-to-killed ratio vs the ~4.8:1 norm.

**Not fetched this pass:** ABT Wilderness and ABT Petersburg (cited from a prior pass, retained as Verified); LOC (mcc.017) and NARA Grant-commission URLs (retained cite-pending).

**Corrections applied inline:** (1) Wikipedia-Crater confidence upgraded cite-pending -> Verified. (2) Cold Harbor "7,000 in 30 minutes" annotated as ABT-stated-but-disputed and fenced off as a non-input (Sections 3 & 7). (3) Sedgwick date ambiguity in ABT flagged; May 9 retained as consensus (Section 4). (4) LOC/NARA cells and Section 4 marked to make clear those URLs were not fetched this pass.

**Flagged claims + safer implementation choices:**
- *Cold Harbor 7,000-in-30-minutes* -> keep as loose teaching narrative; never a per-battle casualty number or engine input.
- *LOC/NARA Grant-commission URLs* -> rank facts safe to state; keep the specific URLs cite-pending until fetched, or anchor to Grant's Personal Memoirs / a standard reference.
- *Sedgwick death date* -> use May 9, 1864; anchor the dead-officer / VI-Corps-to-Wright guard to that date.

**Anti-Lost-Cause / dignity review:** PASS. Grant-the-Butcher myth is rebutted; Cold Harbor is framed as an honest Union failure without a butcher caricature; the Crater massacre carries an explicit dignity rule (never a scoreable objective, framed as a war crime rooted in pro-slavery ideology); USCT agency and Medals of Honor are centered. The Crater is built as a failed-assault scenario with massacre-as-teaching only, so it is NOT a massacre-only playable battle.

**Ratified verdict: READY_FOR_SPEC.** At least three reputable sources were directly confirmed this pass, the OOB/rank/date traps are explicit and correct, the D74 no-fudge risks are named, and no massacre-only playable battle is proposed. Residual items are spec-time verifications, not blockers.

## 12. D390 Spec-Time Addendum — Spotsylvania May 12 Verification Pass (2026-07-13)

A 6-agent read-only workflow (4 Sonnet/medium gatherers, 86 claims → 2 Opus/high default-refute
verifiers, ~40 verdicts, 0 agent errors) re-verified this packet's Section 9 gaps before the D390
standalone Spotsylvania spec. Fable adjudication owns every conclusion. The packet text above
stays as the record of what the D327 pass believed; this addendum controls where they differ.

**Grant's rank sources (Section 9 gap RESOLVED).** The NARA page
(https://www.archives.gov/legislative/features/grant) was FETCHED and confirms: Lincoln signed
the revived-Lieutenant-General act into law February 29, 1864 and sent Grant's nomination the
same day; the Senate confirmed March 2, 1864. It gives NO commissioning-ceremony date, and
secondary sources (Mr. Lincoln's White House, History.com, Fold3) place the White House
presentation on March 9, 1864 — so the packet's "commissioned Mar 10" is unsupported by any
fetched primary and the ceremony date ships Disputed (March 9 vs March 10), never load-bearing.
The LOC URL (https://www.loc.gov/item/mcc.017/) remains bot-403/cite-pending and is dropped as a
load-bearing register row; the fetched NARA page substitutes. Battle-date grade is unchanged and
firm: Lieutenant General, with General-in-Chief a role, not a rank.

**Anderson (Section 9 gap RESOLVED).** Richard H. Anderson was a MAJOR GENERAL commanding the
First Corps for the whole May 8-21 window (temporary corps command from May 6-7 after
Longstreet's wounding, retained until Longstreet's October 1864 return). His TEMPORARY
lieutenant-general appointment is effective May 31, 1864, was never confirmed by the Confederate
Congress, and lapsed when Longstreet returned (two-source: Wikipedia + civilwarintheeast.com).
One outlier — historyofwar.org calling the May 31 action a promotion to "major-general" — is a
documented factual error (Anderson had been a major general since 1862), not a genuine dispute.

**New rank traps found this pass (both directions).** (1) HORATIO WRIGHT: he took VI Corps on
May 9 as a BRIGADIER GENERAL, and his major-general-of-volunteers appointment is dated May 12,
1864 — the assault day itself. The honest at-battle label is Brig. Gen. Horatio G. Wright
commanding VI Corps, with the same-day date-of-rank disclosed as a nuance (the paperwork date is
single-root Wikipedia pending a Warner/Eicher fetch). (2) JOHN B. GORDON commanded his division
on May 12 as a BRIGADIER GENERAL; his major-general promotion is May 14, 1864 (refute-confirmed;
ABT's undated "now a major general in 1864" is imprecise). (3) Jubal EARLY (Maj. Gen.) commanded
the THIRD Corps at Spotsylvania — A. P. Hill was too ill from about May 8 (two-source). (4) The
refute pass corrected IX Corps precision: formally assigned to the Army of the Potomac May 25,
1864 (independent under Grant before that). (5) Edward Johnson (Maj. Gen.) and George H. Steuart
(Brig. Gen.) were both captured May 12.

**Division-grain May 12 OOB (Section 9 gap RESOLVED).** US: Hancock's II Corps assault column =
Barlow (Brig. Gen.), Birney (Maj. Gen.), Mott (Brig. Gen.), and Gibbon (Brig. Gen.; his
division's combat role at the Angle is UNRESOLVED in fetched NPS text and ships disclosed);
Barlow's lead brigades Miles and Brooke; Wright's VI Corps joined from about 6:00 a.m. (Neill's
division at the west angle — Edwards's three regiments by 6:30 — then Russell's division about
9:30 with Upton's brigade; Lewis A. Grant's Vermont and Brown's New Jersey brigades named by
NPS). CS: Edward Johnson's division held the tip (Walker's Stonewall Brigade, Monaghan's
Louisianians for Stafford, Witcher for the dead J. M. Jones, Steuart's brigade); the documented
counterattack forces are Gordon's division, Rodes's brigades (Ramseur, Daniel — mortally
wounded), and the Third Corps brigades Perrin (killed; Mahone's division, still labeled
"Anderson's division" in sources after Anderson went upstairs), Harris (Mississippi), and
McGowan (South Carolina). Strength figures CONFLICT at the corps grain (II Corps 15,000 ABT-page
vs 20,000 overview; VI Corps 15,000) and NO source pins committed axis totals — all strengths
ship as Inferred envelopes. TRAP: the "twelve regiments... some 4,500 men" figure belongs to
UPTON'S MAY 10 assault and must never be encoded as a May 12 VI Corps figure.

**Casualty direction (Section 9 gap RESOLVED — NEUTRAL).** The May 12 grain is genuinely
sourced: about 17,000 total (NPS Bloody Angle page + ABT + Rhea), US about 9,000 vs CS about
8,000 INCLUDING about 3,000 prisoners from Johnson's division. No source recomputes a
prisoners-excluded CS killed/wounded total; raw totals differ by ~1,000 (inside rounding) and
stripping prisoners flips the direction. **The refute recommendation is adopted as law: the
standalone Spotsylvania scenario ships CASUALTY-DIRECTION-NEUTRAL (the Cedar Creek precedent) —
no per-side casualty tooth in either direction.** The sourced 8-seed outcome direction is
DEFENDER-HOLDS: the break-in did not split Lee's army; Gordon's and the successive counterattacks
re-formed the line, and by 2-3 a.m. May 13 the Confederates withdrew half a mile to a mile to a
completed base line that HELD.

**Confirmed accurate-input stories.** The artillery withdrawal (Lee pulled 22 of 30 guns from
the salient May 11 expecting a move; recalled too late; about 20 captured, one gun unlimbering a
single round) is confirmed and is THE accurate-input encoding of the break-in — a gun-stripped
tip, never a surprise bonus. Weather is confirmed: steady rain May 11, heavy pre-dawn fog and
damp powder at the 4:30-4:35 a.m. step-off, a driving rainstorm through the day. Duration
spreads 17-24 hours across sources and ships as "nearly a full day," approximate.

**Provenance discipline for the spec (the Rhea root).** The tactical narrative of May 12 (NPS
Civil War Series #25 sec16 + the ABT article cluster) leans on Gordon Rhea's scholarship — the
same single-scholar-collapse class as Elkhorn's Shea root. Where every path leads to Rhea alone,
claims ship Inferred with the root named. One citation-integrity defect: the
counterattack-brigade cluster attributed to the ABT "bloody miscue" article did not reproduce on
two independent re-fetches; the individual facts (Perrin killed, Daniel mortally wounded, Ramseur
wounded, Harris/McGowan committed) are separately confirmed, but that URL attribution is
unresolved and the cluster ships with per-fact sourcing instead. Dead link: the packet-era
`nps.gov/frsp/learn/historyculture/spotsy-history.htm` now 404s; fresh anchors fetched this pass
include `nps.gov/places/bloody-angle.htm`, `nps.gov/places/east-face-of-salient.htm`,
`npshistory.com/publications/civil_war_series/25/sec16.htm`, the ABT certain-death /
bloody-miscue / men-fell-heaps articles, and `encyclopediavirginia.org`'s battle entry
(full-battle totals 18,399 US / 12,421 CS, no May-12 split — never laundered down).