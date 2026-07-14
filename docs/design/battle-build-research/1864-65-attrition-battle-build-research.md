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
## 13. D392 Spec-Time Addendum — The Wilderness Verification Pass (2026-07-13)

A 7-agent read-only workflow (4 Sonnet/medium gatherers → 2 Opus/high default-refute verifiers,
82 verdicts → 1 Opus/high completeness critic, 0 agent errors) re-verified this packet's
Wilderness material before the D392 standalone spec. Fable adjudication owns every conclusion.
The packet text above stays as the record of what the D327 pass believed; this addendum controls
where they differ.

**Shape adjudication (packet §1 rank 4 / §2 phase-1 recipe RESOLVED for the standalone).** The
two-axis structure is confirmed two-family: the Orange Turnpike axis (Saunders Field, Warren's V
Corps then Sedgwick's VI vs Ewell, first contact about 1:00 p.m. May 5 — the packet-era ABT
"around midday" phrasing did NOT reproduce on the fetched page and is retired) and the Orange
Plank Road axis about 2.5 miles south (Getty's division then Hancock's II Corps vs A. P. Hill,
building from about 3:00-4:15 p.m.). The sourced two-day arc: Getty dispatched 10:30 a.m. May 5
to hold the Brock Road / Orange Plank Road intersection ahead of Hill; Hancock's dawn assault
(about 5:00 a.m. May 6) nearly collapsed Hill's unentrenched corps; Longstreet's First Corps
(Kershaw's and Field's divisions only) arrived about 6:00-7:00 a.m. through the Widow Tapp field
(Poague's guns; the Lee-to-the-rear episode — two site families, ONE participant-memoir root,
wording ships Inferred); Sorrel's flank column (three brigades, Mahone senior) rolled up
Hancock's left from the unfinished railroad grade about 11:00 a.m.; Longstreet was wounded by
his own troops about noon near the Jackson-Chancellorsville ground (Wikipedia names the 12th
Virginia; EV renders the wound "right arm and neck"; Jenkins killed in the same volley; "Press
the enemy" to Field); the 4:15-5:00 p.m. assault on the Brock Road works briefly planted flags
and was retaken within about an hour (Carroll's brigade); Gordon's dusk flank attack captured
Brig. Gens. Seymour and Shaler; May 7 saw no major infantry battle and the army marched south
about 8 p.m. to spontaneous cheering (EV verbatim; ECW corroborates the cheering — its
packet-era Bearss "most important intersection" quote is NOT on the page and is dropped). The
critic's shape recommendation is adopted: standalone SINGLE PHASE anchored on the Brock Road /
Orange Plank Road junction as the objective, the two-day arc carried through timed
reinforcements on both sides, no phases[] block (so no D92 phase-weight audit is owed).

**THE JUNCTION INVARIANT (the load-bearing outcome adjudication).** Every fetched family agrees
the Union held the Brock Road / Orange Plank Road intersection continuously — cavalry screen,
then Getty, then Hancock — from May 5 through the May 7 night departure; the Confederates never
captured it. The honest outcome guard is US-DEFENDER-HOLDS-THE-JUNCTION; a Confederate
seize-and-hold is the alt-history spread, never the lean. The honest engine roles for the
standalone are therefore attacker CS / defender US (Hill's May 5 objective was the intersection;
the May 6 afternoon assault targeted exactly that line), a deliberate deviation from this
packet's §2 CAMPAIGN phase-1 recipe (US attacker "clears the crossroads") — that recipe remains
valid for the future Overland T8 build; the standalone models the sourced defensive invariant.

**Casualty direction (RESOLVED — a TOOTH exists, unlike Spotsylvania).** US losses 17,666
(2,246 k / 12,037 w / 3,383 c-m) are carried identically by Wikipedia and EV — adjudicated as
ONE root (the official-returns/CWSAC compilation) — beside ABT "nearly 18,000" and NPS ~18,000:
the US total ships Verified at "about 17,700-18,000." CS losses are genuinely DISPUTED:
~8,000 (NPS) / 11,033 (Wikipedia) / 11,125 (EV) / ~13,000 (ABT), with complete CS returns not
surviving — the CS magnitude ships as the Disputed range ~8,000-13,000. The DIRECTION (US > CS)
survives the widest honest pairing by ~4,000 and both refuters recommend the directional tooth:
**the standalone ships an aggregate casualty-DIRECTION guard (US losses exceed CS losses),
direction only, never a magnitude** — the anti-winner-bleeds-less class again (the holder of the
field's key ground bled more and advanced anyway; the accounting is the attrition teaching).

**Battle-date rank wall (all two-family unless noted).** Grant Lt. Gen. (the fetched NARA
anchor stands); Meade Maj. Gen.; Hancock/Warren/Sedgwick Maj. Gens. — **Sedgwick is ALIVE and
commanding VI Corps throughout this battle** (killed May 9 at Spotsylvania, three days later —
the reverse of the Spotsylvania dead-officer guard); Burnside Maj. Gen. with IX Corps
INDEPENDENT under Grant (the citation-integrity catch: the civilwarintheeast page cited by the
gather does NOT carry the independence claim — re-cited to Wikipedia + NPS; the incorporation
date ships Disputed May 24 vs the D390 addendum's May 25, never load-bearing); **Brig. Gen.
John Gibbon** (the anachronism catch — his MG of volunteers is June 7, 1864, AFTER this battle;
civilwarintheeast's "MG" is the backdated-grade error class); Birney Maj. Gen.; Barlow and Mott
Brig. Gens. (Mott took the division May 2); Brig. Gen. Getty WOUNDED May 6; Brig. Gen.
Wadsworth MORTALLY WOUNDED May 6 in the flank attack, died May 8 in Confederate hands; Brig.
Gen. Alexander Hays KILLED May 5 (2nd Brigade, Birney's division); Brig. Gen. Wright commands
the FIRST DIVISION of VI Corps here (corps command only from May 9); Brig. Gen. Thomas G.
Stevenson commands IX Corps 1st Division (the Stevenson-vs-Crittenden "conflict" is illusory —
civilwarintheeast reads "Stevenson (to 5/10)" with Crittenden the successor; Stevenson was
killed May 10); Brig. Gens. Seymour and Shaler CAPTURED May 6 evening. CS: Lee full General;
Ewell Lt. Gen.; **Lt. Gen. A. P. Hill PRESENT and commanding Third Corps May 5-6** (his
incapacitation dates to about May 8 — never render Early commanding Third Corps at the
Wilderness; Early is a Maj. Gen. DIVISION commander under Ewell here); Longstreet Lt. Gen.
present from about 6 a.m. May 6 until wounded about noon; **Brig. Gen. Joseph B. Kershaw
commanding McLaws's old division — his major-general date of rank is June 2, 1864, AFTER this
battle** (two-family; the likely bind anchor); Maj. Gen. Charles W. Field (Hood's old
division); **Brig. Gen. John B. Gordon commanding a BRIGADE of Early's division** (division
command May 8, MG May 14); Brig. Gen. Micah Jenkins KILLED May 6; Brig. Gen. John M. Jones
KILLED May 5 on the Turnpike (the "Saunders Field" placement by name is Inferred); Brig. Gen.
Leroy Stafford MORTALLY WOUNDED May 5, died May 8; R. H. Anderson's DIVISION belongs to Hill's
Third Corps at this battle and Anderson takes First Corps only AFTER it (sequence two-family;
the exact day single-source, Inferred).

**Strengths (Disputed scopes — never one number).** Union present figures cluster
118,000-120,000 (EV 118,000 / Wikipedia 118,700 + 316 guns at campaign start / NPS 120,000 over
four corps) while ABT's 101,895 is labeled "engaged" — different scopes, each shipped with its
scope named. CS: 61,025 engaged (ABT) / 62,000 (NPS) / 65,000 (EV) / 66,140 incl. staff and
artillery (Wikipedia, single-root). II Corps 28,333 present-for-duty April 30 (single-family).
IX Corps totals roughly 19,000-20,000 — the "~6,000 veterans" figure is a veteran SUBSET and
must never ship as a corps total. Third Corps ~22,675 + 1,910 artillery is single-source
Wikipedia (Inferred). NO source pins committed axis totals or division-engaged strengths — all
committed splits ship as Inferred envelopes.

**Terrain, blindness, and the fires.** The blindness was DENSE SECOND-GROWTH VEGETATION plus
gunpowder and brush-fire SMOKE — no fetched source describes literal weather fog on May 5-6
(confirmed as a negative across four families), and the thickets specifically neutralized the
Union's artillery/cavalry/numbers edge. The engine's fog model aids the DEFENDER, so fog ON
would mismodel this battle: the standalone runs fog OFF with the woods as symmetric universal
cover and honestly low deployed-gun counts (THE THICKET LAW — the D392 spec names it). The
brush fires are confirmed multi-day (May 5 Saunders Field; May 6-7 Orange Plank Road);
McParlin's primary medical estimate of ~200 wounded who burned or suffocated (nearly 10% of
Union deaths) anchors the human-cost card; the 7th Indiana eyewitness quote reproduced verbatim
on the fetched page; the fires are teaching and presentation ONLY, never a mechanic. Landmark
set confirmed: Saunders Field, Widow Tapp field, Chewning farm, the unfinished railroad grade,
the Brock Road log breastworks, Wilderness Tavern.

**Teaching-thread provenance.** Grant's tent-breakdown story ships DISPUTED (the
Rawlins-via-Wilson weeping account vs Porter's "sleeping peacefully" — the conflict itself is
the card); the 1863 Chancellorsville-skeletons detail is single-source (HistoryNet) and ships
Inferred with restraint; the USCT thread (Ferrero's 4th Division guarding trains, NOT in
directed combat here) is single-source (an NPS blog) and ships Inferred — accuracy-as-dignity:
no USCT combat markers at the Wilderness because no directed USCT combat occurred here; the
Texas Brigade's "250 of 800" figure did not reproduce on the fetched ABT page and ships
Inferred. Dead/corrected links: the packet-era NPS
`frsp/learn/historyculture/the-battle-of-the-wilderness.htm` 404s; Encyclopedia Virginia is
LIVE at the corrected slug `encyclopediavirginia.org/entries/wilderness-battle-of-the/`. The
single-scholar root is Gordon Rhea, *The Battle of the Wilderness May 5-6, 1864* — the
NPS/ABT narratives and the Wikipedia/EV casualty tables each collapse toward shared roots, and
the two-FAMILY rule applies with those collapses named (the Elkhorn Shea-root class).

## 14. D396 Spec-Time Addendum — Petersburg Initial Assaults (June 15-18, 1864) Verification Pass (2026-07-14)

Two read-only workflows (a 7-agent pass — 4 Sonnet/medium gatherers, 140 claims → 2 Opus/high
default-refute verifiers → 1 Opus/high completeness critic — then a 3-agent gap pass — 2
Sonnet/medium gatherers, 53 claims → 1 Opus/high default-refute verifier; 10 agents, 0 errors)
re-verified this packet's June 15-18 material before the D396 standalone spec. Combined
verdicts: **189 CONFIRMED, 4 ADJUSTED, 0 REFUTED, 0 UNSUPPORTED across 193 claims.** Fable
adjudication owns every conclusion. The packet text above stays as the record of what the D327
pass believed; this addendum controls where they differ.

**THE REDUNDANCY FLAG (packet §1 rank 6 "redundant with Spotsylvania/Cold Harbor") is
DISCHARGED — REFUTED by the gathered evidence.** The honest shape is not a static
assault-on-manned-works at all: it is a **DEFENDER-REINFORCEMENT RACE**, the war's canonical
missed opportunity. On June 15 the 10-mile, 55-battery Dimmock Line was nearly EMPTY — about
2,200 Confederates on the line (Encyclopedia Virginia + NPS + the Wikipedia battle article;
Wise's Virginia brigade plus militia, Beyond the Crater corroborating) against Smith's 14,000
advancing (NPS) — and the Union evening attack BREACHED it (Batteries 1-11 lost; the breach
magnitude ships Disputed: NPS's own two pages say "two mile-long hole" and "1.5-mile-long
hole" while the ECWC essay says "nearly three miles"). Petersburg that night was "clearly at
the mercy of the Federal commander, who had all but captured it." The drama is the defender
racing to refill the works — Beauregard unilaterally stripping the Howlett Line, improvising
two successive overnight fallback lines (the June 17-18 retirement 500-800 yards, Beyond the
Crater; "approximately half a mile," NPS), growing 2,200 → ~14,000 (June 16, Wikipedia + NPS)
→ 20,000+ (June 18) while the attacker grew ~15-16,000 → ~50,000 → ~67,000 — "arguably his
finest combat performance of the war." Only June 18, AFTER the race was lost, resembles the
sibling battles (the 1st Maine Heavy Artillery's 632 of ~900, the war's worst single-action
regimental loss — Wikipedia + the NPS battle-unit record + ECW, three families; Frank
Wilkeson's sourced refusal testimony), and that day is the CONSEQUENCE the scenario teaches.
The USCT proving ground (below) has no parallel at Spotsylvania, Cold Harbor, Kennesaw, or
Franklin. **Verdict: a genuinely distinct honest shape exists; the spec proceeds. No HALT.**

**Battle-date rank wall (all two-family unless noted).** US: Grant Lt. Gen., General-in-Chief
a role (the D390-fetched NARA anchor stands, not re-fetched); Meade Maj. Gen.; **Maj. Gen.
William F. "Baldy" Smith — THE RESTORED-COMMISSION TRAP:** MG July 4, 1862; the Senate failed
to confirm and the appointment EXPIRED March 4, 1863, reverting him to brigadier general; he
was re-nominated and the Senate confirmed him major general of volunteers **March 9, 1864** —
so he commands XVIII Corps at Petersburg as a MAJOR GENERAL, and the Wikipedia battle
article's "Brigadier General William F. 'Baldy' Smith" rendering is adjudicated as the
stale-grade error class (the dated commission trail controls; the intra-family conflict ships
disclosed); Maj. Gen. Winfield S. Hancock (MG November 29, 1862), II Corps, arriving about
9:00 p.m. June 15 with 16,000 (NPS) — **THE SENIORITY-DEFERENCE FACT: though senior, Hancock
deferred to Smith, who knew the ground** (Wikipedia biography, verbatim); **Maj. Gen. John
Gibbon — THE REVERSE ANACHRONISM:** his MG of volunteers is dated June 7, 1864, so at THIS
battle (unlike the Wilderness) he IS a major general — though the fetched battle article
never names him in the June 15-18 fighting and his division's role ships as context; Maj.
Gen. David B. Birney; Brig. Gen. Francis C. Barlow (led his division against Redans 13, 14,
and 15); Maj. Gen. Ambrose E. Burnside, IX Corps; **Brig. Gen. James H. Ledlie — 1st Division
IX Corps from June 9, 1864, succeeding the dead Stevenson** (the D392 Stevenson wall's
successor chain); Brig. Gen. Robert B. Potter (2nd Division); **Brig. Gen. Orlando B. Willcox
— THE ANACHRONISM CATCH, refute-confirmed:** the Wikipedia battle article renders him "Major
General," but his own biography shows only a BREVET major generalcy to rank from August 1,
1864 (nominated December 12, 1864; confirmed April 14, 1865) — his June 15-18 substantive
grade is BRIGADIER GENERAL (the Gibbon-at-the-Wilderness error class, reversed onto this
battle); Maj. Gen. Gouverneur K. Warren (MG August 8, 1863), V Corps; **Griffin, Ayres,
Crawford, and Cutler ALL Brigadier Generals** (each carries only a brevet-MG dated from
August 1, 1864 or later — after this battle); Brig. Gen. Edward W. Hinks (rank from November
29, 1862), 3rd Division XVIII Corps, composed entirely of USCT; Brig. Gens. William T. H.
Brooks and John H. Martindale (XVIII Corps 1st/2nd divisions); Brig. Gen. August Kautz
(cavalry division). **THE VI CORPS ABSENCE WALL:** no fetched source places Wright's VI Corps
in the June 15-18 assaults (Cold Harbor June 3-12, then the Bermuda Hundred bank; the battle
article never mentions Wright) — VI Corps is never fielded here. CS: **Gen. P. G. T.
Beauregard — full GENERAL, CSA (one of seven; date of rank July 21, 1861; fifth in
seniority), commanding the initial defense** — the D396 bind anchor; Gen. Robert E. Lee
(dispatching two divisions from 3:00 a.m. June 18; arriving in person about 11:00 a.m. June
18, conferring with Beauregard at the Customs House — ECW, with NPS's "came down from
Chester" corroboration; **never the defense commander of June 15-17**); Brig. Gen. Henry A.
Wise (his brigade plus militia the ONLY opening force; former Virginia governor; the
Military-District-of-Petersburg assignment dated June 17 is paperwork disclosure); Maj. Gen.
Robert F. Hoke (MG April 23, 1864, ranking from April 20) with Brig. Gens. Clingman, Hagood,
Martin, and Colquitt (the Beyond-the-Crater OOB lists five brigades — the refute pass's
ADJUSTED catch; Martin's June 28 relief is after this battle); Maj. Gen. Bushrod R. Johnson
(MG May 21, 1864) with Wise's, Elliott's, Ransom's, and Gracie's brigades; **James Dearing —
THE UNCONFIRMED-COMMISSION TRAP:** slated for brigadier general April 29, 1864, the promotion
NEVER approved by the Confederate Congress; he served in the grade commanding Beauregard's
cavalry brigade (the Baylor's Farm delaying action) — ships with the unconfirmed disclosure
(the Anderson-temporary-Lt.-Gen. class); **Maj. Gen. Joseph B. Kershaw — THE REVERSE OF THE
WILDERNESS BIND:** MG June 2, 1864 — at THIS battle he IS a major general, filing into the
Petersburg line June 18 (three families: Beyond the Crater + ECW + Wikipedia); Maj. Gen.
Charles W. Field (grade Verified; his exact MG date-of-rank is not pinned by the fetched
biography and ships `Inferred`, situated near his February 1864 return).

**THE PICKETT/BERMUDA HUNDRED SCOPE WALL (refute-confirmed from Lee's own OR dispatches via
Beyond the Crater):** Pickett's division reached Drewry's Bluff June 16 and occupied the
Howlett Line trenches June 17 — it was NEVER in the June 15-18 Petersburg assaults proper. No
fetched page places Pickett at Petersburg in this window. The Bermuda Hundred front stays
outside the scenario.

**Strengths (Disputed scopes — never one number).** June 15: CS 2,200 ON THE LINE
(EV + NPS + the Wikipedia battle article) inside Beauregard's ~5,400 WHOLE FORCE (the
Wikipedia biography's "weak 5,400-man force — including boys, old men, and patients" + Beyond
the Crater's "5,400 defenders"; the NPS handbook's "less than 4,000" a third scope) against
Smith's 14,000 (NPS) / "approximately 15,000 to 16,000" moved (EV), plus Hancock's 16,000 at
9:00 p.m. June 16: CS ~14,000 (Wikipedia + NPS "by dusk of that second day"); US ~50,000
(Wikipedia; ECW corroborates). June 17: "outnumbered six-to-one" (ECWC, qualitative). June
18: CS "over 20,000" (Wikipedia) with Lee's ~23,000 inbound (ECW scope note); US ~67,000
(Wikipedia). Whole-battle: the Wikipedia infobox range "5,400-38,000" CS; the CWSAC-root
aggregate 104,000 total / US 62,000 / CS 42,000 (Beyond the Crater; the ABT infobox carries
the same table — adjudicated ONE root cited twice). NO source pins per-day committed axis
totals — every committed split ships as an Inferred envelope.

**Casualties and the direction law (RESOLVED — TWO honest teeth).** **THE 11,386 SCOPE
COLLISION is itself a named trap:** Wikipedia renders 11,386 (1,688 k / 8,513 w / 1,185 m) as
the UNION-ONLY total beside CS ~4,000 (200 / 2,900 / 900), while the CWSAC-root table renders
the SAME 11,386 as the GRAND total (US 8,150 / CS 3,236); the NPS handbook says "a loss of
10,000 men." The magnitudes ship `Disputed` with both readings shown and nothing load-bearing
on any figure. But the DIRECTION survives every honest pairing (worst case 8,150 vs 4,000 —
still better than 2:1): **the aggregate casualty-direction tooth (US losses exceed CS losses)
is honest, direction only, never magnitude** — the attacker-bleeds-and-fails class, checked
against the Stones-River inversion warning and confirmed NOT inverted here. And the outcome
direction is uncontested: "the First Petersburg Offensive ended with the city still in
Confederate hands" (ECWC) and the 292-day siege followed (ABT) — **the city-hold guard (CS
defender retains Petersburg) is the sourced lean.** Per-day casualty splits are NOT sourced
(only Hinks's June 15 figure below) — no per-day tooth may exist.

**THE USCT PROVING GROUND (two-source, per D395 obligation 6).** Baylor's Farm, morning June
15: Hinks's division fought through an unexpected fortified delaying position (Dearing's
cavalry + the Petersburg Artillery) — ABT heritage-site ("Never before tested in battle,
Hinks' black soldiers pressed forward"; "slightly more than 300 Union casualties"; the 22nd
USCT leading) + the Wikipedia battle article (two assaults at Baylor's farm) = two families,
`Verified`. The evening Dimmock captures: Hinks's ~3,500-man division took a battery series —
**the exact range ships `Disputed`: "Batteries Six through Eleven" (EV; ABT battle page) vs
"Batteries 7 through 11" (NPS)** — including the storming of Battery 9 (ABT article: the 4th
USCT under Lt. Col. Rogers with the 1st USCT) and the capture of a gun of Graham's Petersburg
Artillery (NPS); division loss June 15: **378 killed and wounded (ABT + NPS, two families,
`Verified`)**; Kiddoo's "fullest confidence in the fighting qualities" and the NPS "capable
combat soldiers" judgment anchor the teaching. June 18's supporting role and 36 losses are
NPS-only (`Inferred`). This is the mirror image of the Wilderness's USCT card:
accuracy-as-dignity here means the sourced combat IS the story — the first major USCT combat
validation in Virginia, twelve days after Cold Harbor — with nothing invented and nothing
erased. No massacre content exists in this scenario; the Crater remains its own lane.

**Confirmed accurate-input stories.** The Dimmock Line: 10-mile arc, 55 batteries, laid out
summer 1862 under Capt. Charles Dimmock (ABT map page + ECWC, two families). Smith delayed
his June 15 attack to 7:00 p.m. (ABT + EV's 7:00/7:15 bombardment-then-infantry sequencing);
darkness and command conservatism deferred the exploitation (EV "conservative Union
commanders"; ECWC "darkness and uncertainty"); the ravine flanking of Battery 5 (ABT + NPS);
Hancock's 16,000 arriving 9:00 p.m.; the II Corps June 16 Redan captures "at a frightful
cost" (ABT map page); Potter's stealthy pre-dawn June 17 approach (Wikipedia battle article);
the June 17-18 overnight retirement to the final line; Kershaw and Field filing in June 18;
the 4:00 p.m. June 18 1st Maine charge from the Prince George Court House Road cover (NPS
handbook, 850 strong there vs ~900 elsewhere — scope disclosed). Every one of these is a
TIMING, POSITION, or GEOMETRY input under the universal model — never a script or multiplier.

**Provenance discipline for the spec.** Single-root collapses named: the eight NPS URLs are
ONE publisher family; the Wikipedia battle article and its biography cluster are ONE family;
the ABT and Beyond-the-Crater strength/casualty tables collapse to ONE official-returns/CWSAC
root; the ECWC essay is one authored essay; Beyond the Crater's OOB pages mirror the OR. The
modern scholarly anchors are **Thomas J. Howe, *Wasted Valor: The Battle of Petersburg, June
15-18, 1864*** and **Sean Michael Chick, *The Battle of Petersburg, June 15-18, 1864*** —
cited by name as the roots the tertiary web leans on; the highest-leverage upgrade path is a
page-cited Howe fetch. Dead/corrected links this pass: the packet-era
`encyclopediavirginia.org/entries/petersburg-campaign-the/` slug 404s (the live entry is
`/entries/petersburg-campaign/`, and it does NOT carry June-15-18 numbers); the guessed NPS
`battle-of-petersburg-june-15-18-1864.htm` and `baylors-farm.htm` slugs 404 (no live NPS
Baylor's Farm page exists); the ECW 2021 guide-map URL contains a "six-18" slug typo
(corrected in the register); several ABT facts-box numbers surfaced only via search snippets
and are excluded as load-bearing (the fetched-page rule).
