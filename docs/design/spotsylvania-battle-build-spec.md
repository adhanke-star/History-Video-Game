# Spotsylvania Battle-Build Spec (D390)

**Status:** D390 planning/spec plus a filesystem-first, dual-mode plan probe. This slice adds no
Spotsylvania runtime data, scenario registry entry, menu button, schema row, Army Register row,
generated-game behavior, combat input, or baseline-count movement.

**Task shape:** build the ninth LANE-003 planning contract from
`docs/design/battle-build-research/1864-65-attrition-battle-build-research.md` (`READY_FOR_SPEC`,
ratified by the D327 adversarial pass; its §11 names this exact slice) plus this session's
6-agent research workflow (4 Sonnet/medium gather packets → 2 Opus/high default-refute
verifiers, ~40 verdicts, 0 agent errors; the yield is committed as the packet's §12 D390
addendum; Fable adjudication owns every claim below). The playable unit is the May 12, 1864
assault on the Mule Shoe salient at Spotsylvania Court House, Virginia — Hancock's II Corps
smashing through the gun-stripped tip at first light, taking most of Edward Johnson's division
prisoner, and then nearly a full day of the war's most terrible sustained close combat at the
Bloody Angle while Lee's counterattacks re-formed a line the Union could not break. **The Crater
and Cold Harbor remain outside this scenario** — each is its own packet lane with its own
dignity handling.

## 1. Scope And Planning Boundary

**Battle:** Spotsylvania Court House (the Mule Shoe / Bloody Angle assault), Spotsylvania
County, Virginia — **May 12, 1864**, a standalone SINGLE PHASE at the day's grain. The wider
May 8-21 battle, Upton's May 10 assault, Laurel Hill, and Sedgwick's May 9 death enter as
teaching context, never as playable phases.

**Tactical id and future file:** `spotsylvania` in `data/spotsylvania.json` (the single-word
shiloh/franklin filename convention).

**Player-facing title:** `Spotsylvania: The Bloody Angle`.

**Playable shape:** a standalone single-objective scenario (the Franklin / Kennesaw / Five Forks
shipped pattern — no `phases[]` block, no T8 routing, no new engine capability).

- **Roles:** `attacker:"US"` / `defender:"CS"`. The attacker is Hancock's II Corps assault
  column joined by Wright's VI Corps; the defender is Ewell's Second Corps on the Mule Shoe,
  reinforced through the day by the documented counterattack forces.
- **Objective:** break or hold the Bloody Angle / Mule Shoe works. The objective anchor sits on
  the salient's INTERIOR ground (the McCoull-house ground toward the base line), not on the
  captured tip — so the sourced result (a spectacular break-in that never became a breakthrough)
  reads honestly on the engine's hold/seize grain: Hancock took the works at the tip within the
  first hour; the day's question was whether the Union could push THROUGH, and it could not.
- **Date/grain law:** one phase, one day. The pre-dawn step-off (4:30-4:35 a.m., the sources
  split by five minutes), the first-hour break-in, the counterattack timeline, and the
  night-long stalemate live inside the single phase as timing/reinforcement INPUTS.
- **Fog:** top-level `defaultFog:false`. The sourced pre-dawn fog and rain concealed the massed
  assault column — an ATTACKER-aiding condition — while the engine's fog model aids the
  DEFENDER (the D90/D326 grain lesson). Running fog ON would therefore push the simulation
  AGAINST the sourced dynamics. The rain, mist, and damp powder ship as teaching cards and
  weather presentation; the break-in emerges from mass against a gun-stripped tip (section 5).
- **Menu rank:** `spotsylvania:68`, between `chattanooga:65` and `kennesaw:70` — campaign
  chronology (Chattanooga November 1863 → Spotsylvania May 1864 → Kennesaw June 1864). No
  existing rank moves.
- **Weather:** rain. Sourced: steady rain May 11, heavy pre-dawn fog, a driving rainstorm
  through the day's fighting. Sky/time-of-day presentation details ship `Inferred`; the frozen
  Classic row's `wx:"rain"` is a separate layer and is never cited as a source.
- **No battle-named branch or special combat mechanic:** no Spotsylvania-specific code path,
  no scripted break-in event, no hand-to-hand melee mechanic, no prisoner-capture system. The
  scenario is data on the existing universal engine.
- **Terminal boundary:** D390 stops before `data/spotsylvania.json`, T1/T10 registration, any
  focused runtime probe, any count movement, any generated-game behavior change, and the full
  release battery.

## 2. Research Basis And Source Register

This contract uses the committed 1864-65 attrition packet (its §12 D390 addendum records this
pass's corrections) plus the 6-agent gather→default-refute workflow. No claim is promoted beyond
its evidence. A URL's presence does not turn a thin or disputed claim into a Verified claim.

**The single-scholar disclosure (the Rhea root):** the tactical narrative of May 12 — the NPS
Civil War Series #25 account and the American Battlefield Trust article cluster — leans on
Gordon Rhea's Overland Campaign scholarship. Much apparent multi-source corroboration for
break-in timing, unit sequence at the Angle, and counterattack order therefore collapses to ONE
scholarly root. Where this register says "Verified," it means at least two genuinely independent
source FAMILIES support the exact claim; where every path leads back to Rhea alone, the claim
ships `Inferred` with the root named (the Elkhorn Shea-root precedent).

| Source | Contract use | Confidence |
|---|---|---|
| [NPS Bloody Angle place page](https://www.nps.gov/places/bloody-angle.htm) | The May 12 grain anchor: nearly 17,000 total casualties at the Mule Shoe; Grant lost as many as 9,000; Lee about 8,000 including about 3,000 captured from Johnson's division; the May 11 rain and heavy fog | Verified, fetched |
| [NPS East Face of the Salient](https://www.nps.gov/places/east-face-of-salient.htm) | The East Angle / East Face geometry; Johnson's defense; the USCT guard detail for the captured generals | Verified, fetched |
| [NPS Civil War Series #25 sec16](https://npshistory.com/publications/civil_war_series/25/sec16.htm) | "The Battle for the Bloody Angle: May 12" — the unit-identification narrative anchor: the break-in "within minutes," Jones's former brigade destroyed, Monaghan/Walker at the tip, Neill's and Russell's VI Corps divisions, Edwards/Upton/Lewis A. Grant/Brown at the west angle | Verified, fetched (Rhea root disclosed above) |
| [ABT "A Union's Bloody Miscue"](https://www.battlefields.org/learn/articles/unions-bloody-miscue-spotsylvanias-muleshoe) | The 4:35 a.m. II Corps assault; Wright's VI Corps at about 6:00 a.m. 300 yards west of Hancock's right; Edwards's three regiments at the angle by 6:30; Gordon's counterattack; Lee-to-the-rear; the withdrawal to the new line by 3 a.m. | Verified, fetched |
| [ABT "Certain Death"](https://www.battlefields.org/learn/articles/certain-death) | The artillery withdrawal (22 of 30 guns pulled May 11; recalled too late; one gun unlimbering a single canister round); the works construction (logs, earth, abatis, traverses); Johnson and Steuart captured; the Rhea May 12 split (Lee 8,000 / Grant 9,000) | Verified, fetched |
| [ABT "Men Fell in Heaps"](https://www.battlefields.org/learn/articles/men-fell-heaps) | Barlow's lead brigades (Miles left, Brooke right; the 7th New York Heavy Artillery penetrating the line) | Verified, fetched (single article — brigade detail ships Inferred) |
| [ABT Spotsylvania battle page](https://www.battlefields.org/learn/civil-war/battles/spotsylvania-court-house) | Full-battle frame May 8-21; 18,399 vs 12,687 aggregates (NEVER the May 12 grain); the II Corps division set (Barlow, Gibbon, Birney, Mott); the 20,000-man column voice | Verified, fetched |
| [Encyclopedia Virginia — Spotsylvania](https://encyclopediavirginia.org/entries/spotsylvania-court-house-battle-of/) | The independent second family: 4:30 a.m. / about 15,000 voice; the fog-shrouded field and damp powder; the driving rainstorm; about twenty guns captured; fighting 6 a.m. May 12 to 3 a.m. May 13; full-battle totals 18,399 / 12,421 with NO May-12 split | Verified, fetched |
| [NARA — Grant's lieutenant general nomination](https://www.archives.gov/legislative/features/grant) | FETCHED this pass (resolving the packet's cite-pending row): Lincoln signed the revived-grade act February 29, 1864 and nominated Grant the same day; the Senate confirmed March 2, 1864. The page gives NO commissioning-ceremony date | Verified, fetched |
| [Wikipedia CS OOB mirror + civilwarintheeast.com Johnson's division](https://civilwarintheeast.com/confederate-armies/csa-may-64/anv-may-64/2nd-corps-may-64/johnsons-div-may-64/) | Johnson's four brigades and their May 6-12 command succession (Walker wounded May 12; Witcher for the dead J. M. Jones; York/Hays for the dead Stafford; Steuart); the Terry consolidation of May 21 | Verified as the OR-mirror voice — never counted as the second family |
| [ABT/Wikipedia biographies — Anderson, Wright, Gordon, Johnson, Steuart, Hancock, Meade](https://en.wikipedia.org/wiki/Richard_H._Anderson_(general)) | The battle-date rank wall of section 6, each entry carrying its own adjudicated confidence | Fetched; per-claim confidence in section 6 |
| Gordon C. Rhea, *The Battles for Spotsylvania Court House and the Road to Yellow Tavern* (1997) | The controlling monograph behind the NPS/ABT narratives; named on every claim whose corroboration collapses to it | The scholarly anchor — cited by name, not by URL |

**Two-source rule:** every future runtime teaching card and codex claim stamped `Verified`
requires at least two genuinely independent source families supporting that exact claim, with
the Rhea-root collapse rule applied honestly. One family = `Inferred`; a real conflict =
`Disputed` with both values shown. The runtime slice may amend this register with a second
family before upgrading provenance; it may not silently promote a claim in runtime data. **The
highest-leverage upgrade path: a page-cited Rhea (1997) fetch — the single pass that would lift
the break-in timeline, the VI Corps commitment sequence, and the counterattack order from
`Inferred` toward `Verified`.**

**Source-status honesty:** the LOC Grant-commission URL (`loc.gov/item/mcc.017/`) remains
bot-403/cite-pending and is NOT load-bearing anywhere in this contract — the fetched NARA page
substitutes. The Grant commissioning-ceremony date is `Disputed` (March 9 per the secondary
consensus vs the packet-era March 10) and never load-bearing; the battle-date GRADE is what
ships. The packet-era `nps.gov/frsp/learn/historyculture/spotsy-history.htm` URL now 404s and is
retired. The citation-integrity defect this pass caught — the counterattack-brigade cluster
attributed to the "bloody miscue" article failing to reproduce on two independent re-fetches —
is handled by per-fact sourcing in sections 3 and 6, never by citing the unresolved cluster.

## 3. Strength And OOB Contract

Use engaged forces at the objective, never campaign-present figures — and on THIS battle, never
the full-battle May 8-21 aggregates as May 12 figures.

- **Whole-battle frame (context only, never phase totals):** roughly 100,000 US present against
  52,000 CS present for the whole battle (the frozen Classic layer happens to carry the same
  frame; it is never cited as a source). Full-battle casualties 18,399 US against 12,687 CS
  (ABT) or 12,421 CS (Encyclopedia Virginia) belong to May 8-21 and are NEVER encoded in this
  scenario.
- **The corps-grain conflict (ships Disputed/Inferred):** Hancock's assault column is 20,000 in
  ABT's overview voice and about 15,000 in Encyclopedia Virginia's; Wright's VI Corps is "the
  15,000 men of Brig. Gen. Horatio Wright's VI Corps" in the ABT article, of which only a
  portion fought at the Angle. **No source pins a committed May 12 axis total for either side.**
- **TRAP — the Upton conflation:** the "twelve regiments... some 4,500 men" figure belongs to
  UPTON'S MAY 10 assault and must never be encoded as a May 12 VI Corps figure (D390 addendum).
- **Committed-total envelopes (engine abstractions, all `Inferred`):** the runtime slice authors
  inside these envelopes and the plan probe enforces them once data exists:
  - **US committed 14,000-25,000** (the II Corps column inside its 15,000-20,000 conflicted
    range, entering at or near full weight from the first minute, plus the VI Corps commitment
    modeled as timed reinforcements arriving from about the 6:00-6:30 a.m. mark — Neill's
    division first, Russell's about 9:30).
  - **CS committed 8,000-16,000** — the initial defense small (Johnson's division on the tip,
    3,500-5,500, its guns stripped per section 5) and the rest arriving as the sourced piecemeal
    counterattack: Gordon's division early, Rodes's brigades (Ramseur, Daniel) through the
    morning, the Third Corps brigades (Harris's Mississippians, McGowan's South Carolinians)
    into the Bloody Angle itself — the shipped D90 defender-hold recipe, built from the
    documented sequence.
- **Named formations the OOB may field with `Verified identity; Inferred strength`:** US —
  Barlow's, Birney's, Mott's, and Gibbon's II Corps divisions (Gibbon's combat role at the
  Angle is UNRESOLVED in fetched NPS text; if fielded he ships with that disclosure, and he may
  honestly ship as a supporting/reserve formation), Miles's and Brooke's brigades (Barlow's
  lead — single-article, `Inferred`), the 7th New York Heavy Artillery as a note, Neill's and
  Russell's VI Corps divisions, Edwards's, Upton's, Lewis A. Grant's (Vermont), and Brown's
  (New Jersey) brigades. CS — Edward Johnson's division and its four brigades (Walker's
  Stonewall Brigade; Monaghan's Louisianians for the dead Stafford; Witcher's Virginians for
  the dead J. M. Jones; Steuart's brigade), Gordon's division, Ramseur's and Daniel's brigades
  of Rodes's division, Harris's Mississippi and McGowan's South Carolina brigades of the Third
  Corps.
- **Every lower split ships coarse:** brigade strengths, crew counts, experience, formation,
  readiness, reinforcement seconds, and exact sector placements remain coarse and `Inferred`
  unless a register source pins them.
- **Prisoners are outputs, never inputs:** the roughly 3,000 captured from Johnson's division
  are teaching content and the reason the initial defense is authored small-and-stripped; no
  prisoner count, capture rate, or surrender figure is ever an engine input or a probe tooth.

## 4. Terrain And Works Contract

The future map must carry these landmarks as terrain, objective, marker, road, or teaching
context. Coordinates and geometry remain Inferred abstractions.

- **The Mule Shoe salient** — the U-shaped bulge in Lee's line, roughly a mile deep; the
  battle's shape. The map's works trace it.
- **The Bloody Angle (the west angle)** — the stretch of works northwest of the tip where the
  hand-to-hand fight ran for nearly a full day; the scenario's name-bearing ground.
- **The East Angle / East Face** — where the salient bent back east (NPS); Johnson's ground and
  the break-in sector.
- **The log works** — stacked-log breastworks with earth banking, sharpened abatis, and internal
  traverses (ABT "Certain Death"); the works are the defender's terrain input, built from the
  universal cover vocabulary — breastwork/entrenchment cover classes the engine already owns.
- **The McCoull house** — the farmstead inside the salient (its detail rests on thin sources
  and ships `Inferred` flavor); the objective's interior anchor per section 1.
- **The Harrison house** — the packet-carried interior landmark toward the salient base
  (`Inferred`).
- **The Landrum house/farm** — the Union approach and Hancock's forward ground northeast of the
  works (Encyclopedia Virginia corroborates the Landrum farm; finer details ship `Inferred`).
- **The Brown house ground** — the II Corps staging area of the night of May 11-12 (thin
  sourcing; teaching flavor, `Inferred`); the US home-edge anchor.
- **Lee's final line (the base line)** — the new works completed across the salient's base
  during the night; the CS fallback geometry and the line that HELD. The completed base line is
  why "the defender ultimately holds" is the honest outcome reading.
- **The oak stump** — the 22-inch oak behind the Bloody Angle felled by musketry alone (its
  stump is in the Smithsonian). Teaching flavor ONLY; the bullet-count variants are unreconciled
  and no version is load-bearing.

The wooded approaches and the muddy open ground may provide ordinary universal cover/mud
presentation. No terrain element writes casualties, morale, rout, score, or winner.

## 5. The Artillery-Withdrawal Input Law

Spotsylvania's break-in has an accurate-input cause, and this scenario encodes it ONLY through
levers the engine already owns:

1. **The sourced fact (Verified, two families):** on May 11 Lee — expecting a Union movement —
   ordered the artillery pulled out of the salient; 22 of 30 guns had been withdrawn when the
   assault massed; Johnson protested and the guns were ordered back but arrived as the column
   struck; about twenty guns were captured, one unlimbering to fire a single round of canister
   (ABT "Certain Death" + Encyclopedia Virginia, counts differing exactly as disclosed in the
   register).
2. **The engine-native encoding:** the initial CS OOB at the tip fields few or no guns (the
   gun-stripped tip), under the universal gun-count model. Returning batteries that were
   historically captured are NOT fielded as reinforcements; CS artillery re-enters only with the
   re-formed line's sectors where sources place working guns. The US assault column fields its
   true supporting weight. The break-in then EMERGES: mass, works stripped of their guns, a
   small first-line defense — the same accurate-inputs recipe as Elkhorn's ammunition law.
3. **FORBIDDEN encodings:** any battle-named surprise/assault bonus; scripting the break-in as
   an event; a "captured works" damage or morale multiplier; draining CS strength by fiat at
   t=0. The break-in must emerge from strength mass, gun counts, works geometry, and timing.
4. **The teaching card carries the law:** "the guns were ordered back too late" ships as a card
   (section 9), so the player learns why a fortified salient collapsed in the first hour — and
   why the fight then froze at the Angle for a day once the counterattacks and the works'
   traverses took over.

## 6. Battle-Date Ranks And Command Traps

The future runtime probe searches leaders, unit commanders, notes, brief/end text, teaching
cards, and codex content. Rank checks are scenario-scoped. May 1864 sits on THREE live promotion
seams — Grant's new grade, the death of Sedgwick, and the Confederate temporary-general act —
and both armies' May 12 cast is a backdating minefield.

**Union:**

- **Lt. Gen. Ulysses S. Grant** — General-in-Chief (a ROLE, not a rank; he commands through
  Meade and travels with the Army of the Potomac). The grade was revived by the act Lincoln
  signed February 29, 1864 (same-day nomination); the Senate confirmed March 2, 1864 (NARA,
  fetched). He is NEVER a full "General" — that grade waited for July 1866. The
  commissioning-ceremony date ships `Disputed` (March 9 secondary consensus vs March 10) and is
  never load-bearing.
- **Maj. Gen. George G. Meade** — commanding the Army of the Potomac under Grant's direct
  supervision. Never the theater commander; never promoted.
- **Maj. Gen. Winfield S. Hancock** — II Corps, commanding the assault column (grade since
  November 1862).
- **Brig. Gen. Horatio G. Wright — THE SAME-DAY TRAP, resolved:** Wright took VI Corps on May 9
  (after Sedgwick's death) as a BRIGADIER GENERAL; his major-general-of-volunteers appointment
  is dated **May 12, 1864 — the assault day itself.** The honest at-battle label is
  `Brig. Gen. Horatio G. Wright` commanding VI Corps, with the same-day date-of-rank disclosed
  as a teaching nuance, never rendered as the settled morning-of grade. (The paperwork date is
  single-root pending a Warner/Eicher pass and ships `Inferred`.)
- **Maj. Gen. John Sedgwick — THE DEAD-OFFICER GUARD:** killed May 9, 1864 at Spotsylvania —
  the highest-ranking Union officer killed in the war. **Any May 12 OOB listing Sedgwick, or VI
  Corps under anyone but Wright, is a probe-fatal error.** His death ships as a teaching card
  (the sharpshooter account with the "elephant" line is the corroborated version; the exact
  quote text renders only as sourced).
- **Maj. Gen. Ambrose E. Burnside** — IX Corps, an INDEPENDENT command reporting directly to
  Grant (Burnside outranked Meade by commission date); IX Corps was formally assigned to the
  Army of the Potomac only on May 25, 1864. If the scenario names Burnside or the command
  structure at all, IX Corps is never drawn under Meade. His May 12 attack on the east face is
  teaching context; fielding IX Corps is optional and NOT required by this contract.
- **Division grades (II Corps):** Maj. Gen. David B. Birney; Brig. Gens. Francis C. Barlow,
  John Gibbon, and Gershom Mott. Barlow's lead brigades under Brig. Gen. Nelson A. Miles and
  Col. John R. Brooke (`Inferred`, single article). VI Corps brigade leads at the Angle:
  Cols. Oliver Edwards, Emory Upton (his colonel's grade at May 12 carries the May 10 assault
  story — his brigadier's star, dated to that assault, was confirmed later and is a teaching
  nuance, not a May 12 OOB grade), Lewis A. Grant, and Henry W. Brown.

**Confederate:**

- **Gen. Robert E. Lee** — full General, Army of Northern Virginia (his February 1865
  General-in-Chief appointment is a later, separate role). The Lee-to-the-rear episode at the
  salient ships as a card only with its sourced form.
- **Lt. Gen. Richard S. Ewell** — Second Corps, the defending corps commander (grade since May
  1863). His May 12 breakdown/rebuke episode is single-source and ships `Inferred` if used.
- **Lt. Gen. James Longstreet — THE ABSENCE GUARD:** wounded by friendly fire May 6, 1864 at
  the Wilderness; ABSENT from all of Spotsylvania. **Longstreet in any May 12 OOB is a
  probe-fatal error.**
- **Richard H. Anderson: Major General** — commanding Longstreet's First Corps in temporary
  succession (assigned May 6-7, retained until Longstreet's October 1864 return). **His
  temporary lieutenant-general appointment is effective May 31, 1864 — AFTER this battle — was
  never confirmed by the Confederate Congress, and lapsed on Longstreet's return. Never render
  `Lt. Gen. Anderson` on any date inside May 8-21.** (Two-source: the Wikipedia and
  civilwarintheeast biographies; the historyofwar.org "major-general" line for May 31 is a
  documented outlier error, not a dispute.) His First Corps fights at Laurel Hill, off this
  scenario's objective; if named, he is context, not a fielded aura.
- **Maj. Gen. Edward "Allegheny" Johnson** — commanding the division holding the tip; CAPTURED
  May 12 with most of his division (about 3,000 prisoners). **Brig. Gen. George H. "Maryland"
  Steuart** (grade since March 6, 1862) — CAPTURED the same morning. Both captures are teaching
  content and the sourced reason the initial defense is small; neither is a scripted event.
- **Johnson's brigade succession (the May 5-12 attrition wall, `Verified identity` via the
  OR-mirror voice):** Brig. Gen. James A. Walker commanding the Stonewall Brigade (wounded May
  12); Col. William Monaghan commanding Stafford's Louisianians (Brig. Gen. Leroy Stafford
  mortally wounded May 5; Harry T. Hays's own wounding on May 10-12 is disclosure-grade);
  Col. William A. Witcher commanding Jones's Virginians (Brig. Gen. John M. Jones killed May
  6); Brig. Gen. George H. Steuart. **Never render Stafford or J. M. Jones alive on May 12.**
- **Brig. Gen. John B. Gordon — THE OTHER SAME-WEEK TRAP, resolved:** commanding Early's old
  division in the counterattack as a BRIGADIER GENERAL on May 12; his major-general promotion
  is dated May 14, 1864. Never `Maj. Gen. Gordon` at the Bloody Angle.
- **Maj. Gen. Jubal A. Early** — commanding the THIRD Corps at Spotsylvania (A. P. Hill too ill
  from about May 8; Hill returned after the battle). Any Third Corps attribution renders Early
  in command, with Hill's illness a disclosure. The counterattacking Third Corps brigades:
  Brig. Gen. Abner Perrin (KILLED May 12 leading his Alabamians in; his brigade belonged to
  Mahone's division — the division sources still label "Anderson's" after Anderson went
  upstairs, a naming nuance the OOB note discloses), Brig. Gen. Nathaniel H. Harris
  (Mississippi), Brig. Gen. Samuel McGowan (South Carolina; wounded May 12).
- **Rodes's counterattack brigades:** Brig. Gen. Stephen D. Ramseur (wounded May 12),
  Brig. Gen. Junius Daniel (MORTALLY wounded May 12, died May 13 — never rendered as surviving
  the battle).
- **Promotion-paperwork dates are disclosure-only:** Wright's May 12 date, Gordon's May 14
  date, Upton's backdated star, and the Grant ceremony date are all single-source or disputed
  paperwork facts; battle-date GRADES are the probe-pinned law, and no teaching card states a
  paperwork date as settled fact.

Command loss enters the model ONLY as accurate inputs: Johnson's and Steuart's captures shape
the initial-defense authoring; Perrin's death and Daniel's mortal wounding are their units'
ordinary leader-fate inputs and teaching cards, never scripted events.

## 7. D90 Defender-Hold Law, Direction Guard, And Honest A/B

The runtime slice runs exactly eight shared-model deterministic seeds in one serialized focused
process. The direction law, derived from sources and from the D390 refute pass's explicit
recommendation:

1. **THE ONE OUTCOME GUARD — the defender ultimately holds:** in at least **5/8** seeds the CS
   retains the objective (the interior/base-line ground). Sourced: Hancock came close to
   splitting Lee's army but the counterattacks re-formed the line; fighting ran to about 2-3
   a.m. May 13 and the Confederates withdrew, intact and unbroken, to the completed base line
   half a mile to a mile behind the Angle. The army did not break; the objective held.
2. **THE CASUALTY-DIRECTION-NEUTRAL LAW (this battle's Cedar Creek variant):** **no per-side
   casualty tooth in either direction, aggregate or otherwise.** The May 12 grain is genuinely
   sourced — about 17,000 total; US about 9,000; CS about 8,000 INCLUDING about 3,000
   prisoners — but no source recomputes a prisoners-excluded CS killed/wounded figure, the raw
   totals differ by roughly 1,000 (inside source rounding), and stripping prisoners flips the
   direction. A casualty-direction tooth would be fabricated precision in either direction.
   The refute pass's recommendation is adopted verbatim: ship NEUTRAL.
3. **The initial break-in is an EMERGENT requirement, not a tooth:** the scenario must be
   authored so the accurate inputs (section 5's gun-stripped tip, the small first-line defense,
   the massed column) make the early Union penetration the natural opening in most seeds — but
   no probe asserts a scripted break-in moment, and no mechanism forces it.
4. **No forced winner:** the engine's existing result/DRAW grain applies. A hold-majority with
   occasional draws or Union seizures is the honest spread for a near-run day; nothing writes
   the result.

**Forbidden guards:** any casualty magnitude, ratio, split, or direction tooth; any prisoner,
capture, gun-loss, surrender, or rout tooth; any first-hour-break-in timing tooth.

If the runtime slice changes any simulation input after the first eight-seed battery,
`DECISIONS.md` logs the old value, new value, and both observed guard counts for every
iteration. Eligible inputs are committed strengths inside the section 3 envelopes, coarse OOB
splits, universal gun counts (the gun-stripped tip of section 5), ordinary leader quality/aura
inputs, terrain/cover/works geometry, formation, experience/readiness, reinforcement timing
(the sourced piecemeal counterattack and the VI Corps arrival), objective radius, and universal
time/hold thresholds. No result-derived multiplier or scripted verdict is eligible.

## 8. D74 No-Fudge Acceptance Wall

The future data scan rejects these keys and families at any depth:

`damage`, `dmg`, `damageMult`, `firepower`, `firepowerMult`, `fireScale`, `fireMult`,
`fireMultiplier`, `killScale`, `killMult`, `casualtyScale`, `casualtyMult`, `lossScale`,
`lossMult`, `captureScale`, `captureMult`, `surrenderScale`, `surrenderMult`, `routScale`,
`routMult`, `moraleScale`, `moraleMult`, `combatScale`, `battleDamage`, `battleFire`,
`powerMult`, `scoreBonus`, `scoreMult`, `winner`, `winOverride`, `victoryOverride`,
`outcomeOverride`, `forceWin`, `winnerFudge`, `fudge`, `genius`, `geniusMult`, `ammoPenalty`,
`ammoMult`, `supplyMult`, `supplyPenalty`, `exhaustionMult`, `fatigueMult`, `starvationMult`,
`marchPenalty`, `surpriseBonus`, `surpriseMult`, `envelopmentBonus`, `envelopmentMult`,
`panicMult`, `collapseMult`, `meleeMult`, `handToHandBonus`, `prisonerMult`, `captureBonus`.

Named temptations, all forbidden: forcing the break-in with a surprise/fog/assault bonus
instead of the section 5 gun-stripped-tip inputs; a hand-to-hand melee multiplier for the
Angle; a rain/mud penalty key; scripting Johnson's capture or the prisoner haul; a traverse
"fortification bonus" outside the universal works/cover vocabulary; a Lee-to-the-rear morale
event; modeling Grant's or Lee's leadership as a result-writer; any source branch that checks
`spotsylvania` and writes combat output; hardcoding ANY casualty magnitude anywhere.

The result must emerge from committed strength, works/cover geometry, gun counts, reinforcement
timing, formation, experience/readiness, universal command aura, and the objective/time model.

## 9. Teaching, Dignity, And Memory Contract

The runtime slice requires at least eight restrained teaching cards plus one codex entry. Every
claim obeys the two-source/provenance rule with the Rhea-root disclosure (section 2); sourced
quote text is rendered exactly; disputed counts show both values. **Human cost is rendered with
gravity and without glory framing — the Bloody Angle is what attrition actually looked like,
taught as cost, never as spectacle.**

1. **Grant the Butcher — the myth rebutted, the errors kept.** Attrition was a deliberate,
   war-winning strategy against an enemy that could not replace losses: on May 12 alone Lee
   lost about 8,000 from a far smaller army — proportionally worse than Grant's roughly 9,000.
   The card rebuts the "butcher" caricature WITHOUT hiding the real Union tactical errors the
   sources name (the ABT article calls the follow-through a "bloody miscue"): the packed,
   unwieldy column after the break-in, and command failures that fed men into a fight already
   frozen. Both truths on one card.
2. **The guns were ordered back too late.** Lee's May 11 misread — 22 of 30 guns pulled out of
   the salient, recalled too late, about twenty captured with one gun firing a single round of
   canister (both counts shown, per the register). The break-in's accurate-input cause; the
   engine's gun model IS this card (section 5).
3. **The first hour.** The 4:30-4:35 a.m. step-off through rain-fog; the tip overrun "within
   minutes"; Johnson and Steuart captured with about 3,000 of their men. Taught with the
   scale of the collapse and the discipline of the numbers' provenance.
4. **Nearly a full day at the Angle.** The hand-to-hand stalemate at the west angle — sources
   spread the duration from 17 to 24 hours, so the card teaches "nearly a full day," honest
   about the spread. The 22-inch oak felled by musketry (its stump in the Smithsonian) is the
   card's single image; its bullet-count variants are noted as unreconciled. No glory framing:
   the card's subject is what sustained close combat did to human beings, rendered with
   restraint.
5. **The counterattacks that re-formed the line.** Gordon's division first, then Ramseur's and
   Daniel's brigades, then Harris's Mississippians and McGowan's South Carolinians into the
   Angle itself; Perrin killed, Daniel mortally wounded, Ramseur and McGowan wounded, Walker
   wounded. The piecemeal arrivals are the defender-hold recipe the scenario fields as timing
   inputs.
6. **Sedgwick, three days before.** The May 9 death of the VI Corps commander — the
   highest-ranking Union officer killed in the war — and Wright's same-day succession, with
   the same-week promotion nuance (section 6) taught plainly.
7. **The prisoners and the East Face.** Johnson's captured division marched to the rear; NPS
   records USCT soldiers guarding the captured generals — one of the earliest combat-adjacent
   USCT duties of the campaign, taught as agency, not anecdote.
8. **Lee's last line.** The night-long construction of the base line, the 2-3 a.m. withdrawal,
   and why "the army did not break" is the day's military meaning — the defender-hold lean the
   player fights against or defends.
9. **What this scenario deliberately is not.** The Crater and Cold Harbor are their own lanes
   with their own dignity handling; Upton's May 10 assault and Laurel Hill are context cards at
   most. No massacre content is playable anywhere in this lane.

The codex entry uses `theater:"Eastern"`, `campaign:"Overland Campaign"`, and
`result:"Inconclusive"` (the full-battle May 8-21 result both register families carry — the
May 12 defender-hold is the day's tactical reading, the campaign ground on), with the
attrition-strategy teaching and the human-cost gravity stated plainly.

## 10. Frozen Classic And Rail-Route Collision Law

One lowercase Classic layer already exists and remains untouched:

- frozen Classic `build/base.html` has exactly one
  `{id:"spotsylvania", name:"Spotsylvania", year:1864, th:"E", atk:"US", us:100000, cs:52000, ...}`
  roster row (with `wx:"rain"` and `cmdUS:"Grant", cmdCS:"Lee"`);
- `data/logistics-rail.json` already carries a strategic-layer route keyed `spotsylvania`
  ("Overland railhead and wagon extension", provenance `Inferred`) — the D159 War-Effort rail
  readout keyed by the CLASSIC battles roster, exactly like the shipped `franklin`/`nashville`
  precedents. It is a separate layer: the tactical slice must not edit, rename, or delete it,
  and must not add any new route.

The new tactical id is the single word `spotsylvania` and the new data filename is
`spotsylvania.json` (the shiloh/franklin convention: the tactical registry id and the Classic
roster id may share a name because the layers never share data). The runtime slice must
preserve the lowercase Classic `spotsylvania` record byte-for-byte, and the Classic row's
100,000/52,000 whole-battle frame is never cited as a source for May 12 authoring.

## 11. Planned-Only And Future Complete-Integration Baselines

### D390 planned-only baselines (must remain exact)

- registered tactical scenarios: **21**;
- battle files / total schema files: **21 / 51**;
- Army Register: **1326**;
- explicit flags / valid weather hints / Intel opening-scene coverage / media opening scenes:
  **21 / 21 / 21 / 21**;
- no-regression suite list: **126**; sweep comment: **21** battles;
- generated HTML md5: **`21544e26c8871bc47e26ff117cce1f32`**;
- frozen base md5: **`c9db83fa99230ffb95bdfdfe059f3fb9`**;
- no `data/spotsylvania.json`, no `tools/probe-spotsylvania.mjs`, no T1/T10/runtime
  integration, and no tactical Spotsylvania identifier in any scanned integration surface
  (the pre-existing frozen Classic row and the strategic rail route are separate layers and do
  not count as tactical seams).

The D390 plan probe fails if even one tactical Spotsylvania runtime seam appears while the data
file is absent. Half-registration is always red.

### Future atomic integration contract (the runtime slice, D391 or the then-live number)

All surfaces arrive in one green runtime commit or the plan probe fails closed:

- `data/spotsylvania.json`, top-level key/id `spotsylvania`, single-phase per section 1
  (attacker US / defender CS, `defaultFog:false`, objective/terrain/oob/reinforcements in the
  Franklin/Five Forks shape), committed strengths inside the section 3 envelopes, terrain per
  section 4, the gun-stripped tip per section 5, ranks per section 6, teaching per section 9;
- `src/tactical/T1-bull-run.js` exact registry line
  `R.spotsylvania = GAME_DATA.spotsylvania.spotsylvania` and menu rank `spotsylvania:68`
  between `chattanooga: 65` and `kennesaw: 70` with no other rank moved;
- tactical scenarios **21 -> 22**;
- `tools/validate-data-schemas.mjs` battle enrollment (`spotsylvania.json`) and total schema
  files **51 -> 52**;
- `tools/probe-tactical-roster.mjs` and `tools/probe-custom-battle-builder.mjs` historical
  baselines include `spotsylvania`; the roster DOM check includes `fldScnBtn_spotsylvania`;
  single-phase, so `PHASE_COUNTS` gains NO entry;
- Army Register **`1326 + (unique Spotsylvania side-unit ids × 3)`**, with every whole-registry
  pin moved and documented in the same commit — the full pin-history chain is preserved and the
  new `D###: 1326 -> N — Spotsylvania ...` fragment is appended in the documented-history
  format;
- `src/tactical/T10-flags.js` explicit Spotsylvania metadata **`E / true / anv`** (Eastern
  theater; AotP II/VI Corps badges legible — the Five Forks precedent; Ewell's ANV defenders
  use the Southern Cross family) and `tools/probe-flags.mjs` coverage teeth at 22;
- flags/weather/Intel/media coverage **21 -> 22**; the weather hint ships the sourced
  rain (sky/time presentation `Inferred`; the frozen Classic row's `wx:"rain"` is a separate
  layer, not a source); the media largest-scene check re-audited against Kennesaw's 17;
- `tools/probe-spotsylvania.mjs` focused browser/runtime guard enrolled in
  `tools/vet-no-regression.mjs`; suite **126 -> 127** and sweep comment **21 -> 22**;
- the focused probe fields exactly eight unique deterministic seeds, the single **defender
  ultimately holds ≥5/8** direction guard, the CASUALTY-DIRECTION-NEUTRAL law as an explicit
  in-file comment anchor, rank walls per section 6, the D74 scan per section 8, Classic/rail
  separation per section 10, and 0 pageerrors, exiting nonzero on failure;
- generated `civil_war_generals.html` rebuilt only through `node tools/build.mjs`;
- frozen lowercase Classic `spotsylvania` row unchanged byte-for-byte; the strategic rail route
  untouched; no new rail route;
- honest A/B per section 7 if any simulation input moves after the first battery;
- no Overland multi-phase campaign, Wilderness, Cold Harbor, Petersburg, or Crater data or
  registration of any kind (they remain packet lanes).

## 12. Plan Probe Contract

`tools/probe-spotsylvania-plan.mjs` is filesystem-first, dual-mode, and fail-closed. It writes
`tools/shots/probe-spotsylvania-plan.json`, exits nonzero on failure, prints exactly one
12-step summary, and reports each failed step on stderr. Because this spec is hard-wrapped, its
text anchors match on whitespace-normalized text (the D385 idiom) — the teeth still bite on any
word-level tamper.

The twelve steps, in this exact order, are:

1. `FILES + STATUS`
2. `SHAPE + ID + DATE`
3. `ROLES + OBJECTIVE`
4. `TERRAIN + WORKS`
5. `OOB + STRENGTHS`
6. `RANKS + COMMAND TRAPS`
7. `SOURCES + PROVENANCE`
8. `D90 DEFENDER-HOLD LAW`
9. `D74 NO-FUDGE WALL`
10. `TEACHING + DIGNITY`
11. `FUTURE DIRECTION + INTEGRATION`
12. `LANE + BASELINES`

When the runtime data file is absent, the probe requires every D390 count/hash above and rejects
any partial tactical runtime seam. When the runtime data file is present, it requires the
complete 22/52/`1326+3U`/22/127 integration plus the single-phase shape, the US-attacker/
CS-defender roles, fog off, the envelope sums, the gun-stripped-tip inputs, the rank walls, the
teaching provenance, the focused-probe direction contract (eight seeds, the one defender-holds
guard, the casualty-neutral anchor), and the Classic/rail separation. Half-registration is
always red. The `LANE + BASELINES` step anchors on durable ladder history and the role-roster
owner check (any recognized TOP-LOOP tool), never the current lock holder (the D381 relay
lesson).

## 13. D390 Negative Bind And Focused Gate

After the clean plan probe passes:

1. record md5 for this spec, the plan probe, the generated HTML, and the frozen base;
2. change only the section 6 Anderson rank-lock line — the bulleted lock whose bolded head
   names Anderson with his major-general grade — to a firm lieutenant-general battle-date
   rendering (a one-token patch);
3. run `node tools/probe-spotsylvania-plan.mjs` and require exit 1 with exactly
   `RANKS + COMMAND TRAPS` red (11/12 green);
4. restore the line byte-identically with the file-edit tool (never a broad checkout);
5. require the spec md5 to match its pre-bind value exactly;
6. rerun the plan probe 12/12 green and read the JSON artifact (ok=true, twelve green steps);
7. no red probe artifact may enter git.

The rank tooth is section-scoped to section 6's own body (the D383 hardening — a mention of
Anderson's grade elsewhere in this document can never mask a tamper). Harden only the rank
tooth if the tamper fails too broadly or does not bite. Do not weaken any unrelated tooth.

Set `TMPDIR="$PWD/.tmp"` and run serially:

```bash
node --check tools/probe-spotsylvania-plan.mjs
node tools/build.mjs
node tools/validate-data-schemas.mjs
node tools/probe-battle-build-research.mjs
node tools/probe-spotsylvania-plan.mjs
node tools/probe-cedar-creek-plan.mjs
node tools/probe-cross-keys-port-republic-plan.mjs
node tools/probe-elkhorn-tavern-plan.mjs
node tools/probe-five-forks-plan.mjs
node tools/probe-fort-donelson-plan.mjs
node tools/probe-gaines-mill-plan.mjs
node tools/probe-new-market-heights-plan.mjs
node tools/probe-stones-river-plan.mjs
node tools/probe-women-in-war-arc-plan.mjs
node tools/vet-no-regression.mjs --list
git diff --check
```

Require build `GATE OK`; generated HTML md5 unchanged `21544e26c8871bc47e26ff117cce1f32`;
schema 51/51; research 15/15 (with the packet §12 addendum — additive, the D383/D387
precedent); Spotsylvania plan 12/12; all nine prior plan probes green (`ALL OK`); suite list
126; every produced JSON/HTML artifact parsed and read; no failed step or recursive pageerror.
Do not run `npm run vet:noreg` — D389 discharged the release checkpoint and this slice moves no
runtime byte.

## 14. Future Runtime Gate Contract

The runtime slice starts only from the clean pushed D390 contract under a LANE-003 DRIVE
recorded in the ledger. At minimum it runs, serially and with full artifact readback:

- `node --check` on every new/touched JS/MJS file, including preparse of any cooked browser
  SETUP/DOM strings (the S-03 amendment-8 law);
- `node tools/build.mjs`;
- `node tools/validate-data-schemas.mjs`;
- `node tools/probe-battle-build-research.mjs`;
- `node tools/probe-spotsylvania-plan.mjs` (implementation-present branch);
- `node tools/probe-spotsylvania.mjs` (single-phase runtime guard: registry/menu/launch,
  role/fog/objective assertions, the gun-stripped-tip inputs, the eight-seed defender-holds
  battery with the casualty-neutral law, rank walls, the D74 scan, Classic/rail separation,
  0 pageerrors);
- `node tools/probe-tactical-roster.mjs`;
- `node tools/probe-custom-battle-builder.mjs`;
- `node tools/probe-loot-survival.mjs`;
- `node tools/probe-flags.mjs`;
- `node tools/probe-weather.mjs`;
- `node tools/probe-intel-uhd617-profile.mjs`;
- `node tools/probe-media-budget.mjs`;
- `node tools/vet-no-regression.mjs --list`;
- 1-3 directly adjacent current battle probes selected from the final diff (Chattanooga and
  Kennesaw are the natural menu neighbors);
- the registry-removal bind AND the Anderson-rank bind, each proving exactly its predeclared
  teeth red with byte-identical (md5-proven) restores;
- honest A/B per section 7 if any simulation input moves after the first battery;
- `git diff --check`.

After playable Spotsylvania is green, the full serialized `npm run vet:noreg` release battery
runs at the next agreed checkpoint, ALONE on the machine.

## 15. D390 Completion Criteria

D390 is green when this spec and `tools/probe-spotsylvania-plan.mjs` pass 12/12; the Anderson
rank bind makes exactly one step red and restores byte-identically; every required focused
artifact is read; the 21/51/1326/21/126 baselines, sweep 21, generated HTML md5
`21544e26c8871bc47e26ff117cce1f32`, and frozen base md5 `c9db83fa99230ffb95bdfdfe059f3fb9`
remain exact; the attrition packet carries the §12 D390 spec-time addendum; canonical docs
record the single-phase shape, the artillery-withdrawal input law, the casualty-direction-
neutral law, and the runtime boundary; the final D390 commit is pushed with LANE-003 released
to CONTRACT/unowned; and no Spotsylvania tactical runtime surface has started.
