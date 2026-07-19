# Elkhorn Tavern Battle-Build Spec (D387)

**Status:** D387 planning/spec plus a filesystem-first, dual-mode plan probe. This slice adds no
Elkhorn Tavern runtime data, scenario registry entry, menu button, schema row, Army Register row,
generated-game behavior, combat input, or baseline-count movement.

**Task shape:** build the eighth LANE-003 contract from
`docs/design/battle-build-research/trans-mississippi-battle-build-research.md` (`READY_FOR_SPEC`,
D327-era adversarial pass ratified; writable for THIS axis under Aaron's D359 unlock and the D382
ladder) plus this session's 14-agent research workflow (6 Sonnet gather packets → 6 Opus
default-refute verifiers → 1 Opus completeness critic, completed across a pause/resume boundary
with every per-agent result adjudicated from the run journals; Fable adjudication owns every claim
below). The playable unit is the Elkhorn Tavern axis of the Battle of Pea Ridge, Arkansas, March
7-8, 1862: Van Dorn's enveloping army appears in the Union rear, Price's wing grinds Carr's
division back through Cross Timber Hollow and takes the tavern by nightfall, and the next morning
Curtis's re-formed army — behind the massed guns on Welfley's Knoll — breaks a Confederate army
whose ammunition train had been mistakenly ordered twelve miles away. **The Leetown fight is
TAUGHT, never fielded: the D359 dignity carve-out bars any Leetown Native OOB, and this axis had
no Native combat unit in its battle line** (section 9).

## 1. Scope And Planning Boundary

**Battle:** Pea Ridge (Elkhorn Tavern axis), Benton County, Arkansas — March 7-8, 1862, with the
March 6 Bentonville rearguard skirmish and Van Dorn's three-day forced march as teaching context.
NPS frames the span as March 6-8; the core battle days are March 7-8.

**Tactical id and future file:** `elkhornTavern` in `data/elkhorn-tavern.json`.

**Playable shape:** a two-phase T8 battle with the attacker/defender ROLE REVERSAL between phases
(the Cedar Creek shipped seam). The engine fights the Elkhorn Tavern axis only; Leetown enters as
teaching (sections 8-9).

- **Roles:** top-level `attacker:"CS"` / `defender:"US"`. Phase 1 CS attacker / US defender;
  Phase 2 **US attacker / CS defender** (per-phase override, the shipped Cedar Creek pattern).
- **Phase law:** exactly two `phases[]` — `Elkhorn Tavern - March 7` (scoreWeight 1) →
  `Curtis's Counterattack - March 8` (scoreWeight 3, DECISIVE). The `scoreWeight` array is
  `[1, 3]`; weights sum 4 (the two-phase convention, never 5); decisive index = 1.
- **The D92 phase-weight audit, written down BEFORE the weights (the D383 law):** the sourced
  phase leans are — March 7: the CS seizes the tavern by nightfall (Verified, section 7); March
  8: the US retakes the field decisively (Verified, section 7); the sourced aggregate result is
  a Union victory. Under `[1, 3]` the AI-vs-AI aggregate leans Union exactly as the sources do.
  **The packet's recommended weighting SURVIVES the audit unchanged** — recorded here so the
  audit is visible, not skipped (Fort Donelson's packet failed this same audit and had to be
  reweighted; this one passes).
- **Fog:** top-level `defaultFog:false`; **Phase 1 sets per-phase `defaultFog:true`; Phase 2
  stays fog OFF.** The honest disclosure this contract requires verbatim in the runtime teaching:
  **no literal weather fog is sourced for March 7** — the Phase 1 fog is the engine's
  fog-of-war/scouting model standing in for the OPERATIONAL surprise the sources do pin: Van
  Dorn's night march up the Bentonville Detour, the army appearing in the Union REAR, Curtis
  learning only about 10:30 a.m. that Confederates were on the Telegraph Road behind him, and the
  all-day information problem of which axis carried the main blow. ABT's campfires-kept-burning
  ruse detail is single-source and ships `Inferred` if used. March 8 was the opposite condition —
  NPS: one of the rare occasions when an entire army was visible in line of battle from flank to
  flank — so Phase 2 fog is OFF.
- **Objectives:** Phase 1 — Elkhorn Tavern itself (the CS seizes it); Phase 2 — the tavern and
  the Telegraph/Huntsville road junction behind it (the US retakes it; the junction is where Van
  Dorn's withdrawal route east actually ran).
- **The overnight interstitial:** Phase 2's `transition.lead` (the inter-phase card the player
  reads between March 7 and March 8 — the Stones River / Fort Donelson shipped pattern; no T8
  code change) carries the night that decided the battle: the ammunition train mistakenly
  ordered back to Camp Stephens, Greer bringing the leaderless McCulloch-wing remnant to Van
  Dorn, and Curtis re-forming his four divisions into one line. Never a scored phase.
- **Home edges (the envelopment made visible):** the CS home edge is NORTH (out of Cross Timber
  Hollow, in the Union rear); the US home edge is SOUTH (back toward the Little Sugar Creek
  line). Side-keyed and constant across both phases (the Cedar Creek convention). The player
  should feel the inversion: the Union army fights facing its own former rear.
- **Menu rank:** `elkhornTavern:49`, between `fortDonelson:48` and `shiloh:50` — the Western/
  Trans-Mississippi arc runs in campaign chronology (Donelson February 1862 → Pea Ridge March
  1862 → Shiloh April 1862).
- **Supply is load-bearing here** (section 5): the T4 per-phase `supply` train positions are the
  engine-native encoding of the battle's deciding logistics fact.
- **Terminal boundary:** D387 stops before `data/elkhorn-tavern.json`, T1/T10 registration, any
  focused runtime probe, any count movement, any generated-game behavior change, and the full
  release battery.

## 2. Research Basis And Source Register

This contract uses the committed trans-Mississippi packet plus this session's
gather→default-refute→critic workflow (~66 claim verdicts; the pause/resume boundary was
reconciled from the per-agent journals, never a resumed run's final return). No claim is promoted
beyond its evidence. A URL's presence does not turn a thin or disputed claim into a Verified
claim.

**The single-scholar disclosure (a load-bearing independence finding):** the NPS Civil War Series
narrative (npshistory.com series 19) was written by William L. Shea, co-author of Shea & Hess,
*Pea Ridge: Civil War Campaign in the West* (1992) — the field's controlling monograph. Essential
Civil War Curriculum and Wikipedia cite Shea & Hess directly, and ABT's narrative derives from
the same scholarship. Much apparent multi-source corroboration for this battle therefore
collapses to ONE scholarly root. Encyclopedia of Arkansas and the ABT facts compilation are the
meaningfully separate voices. Where this register says "Verified," it means at least two
genuinely independent source FAMILIES support the exact claim; where every path leads back to
Shea & Hess alone, the claim ships `Inferred` with the monograph named.

| Source | Contract use | Confidence |
|---|---|---|
| [NPS Pea Ridge order of battle](https://www.nps.gov/peri/learn/historyculture/order-of-battle.htm) | The rank anchor: Brig. Gens. Curtis/Sigel/Asboth; COLONELS Osterhaus, Jefferson C. Davis, Carr, Dodge, Vandever; the MSG-vs-CSA organizational split | Verified, fetched |
| [NPS park page](https://www.nps.gov/peri/) + [Stop 7 Elkhorn Tavern](https://www.nps.gov/peri/planyourvisit/stop-7-elkhorn-tavern.htm) + Stop 10 Federal Artillery | "Most pivotal Civil War battle west of the Mississippi River" (verbatim, THIS page, never the /articles page); over 23,000 soldiers combined; Carr's stand; the 21-gun day-2 line on Welfley's Knoll vs 12 CS guns | Verified, fetched |
| [NPS Civil War Series sec8 (Shea)](https://npshistory.com/publications/civil_war_series/19/sec8.htm) | Day-2 sequence: six batteries, 3,600+ rounds, two-hour cannonade, ~10 a.m. infantry advance; ammunition train "a dozen miles distant at Camp Stephens"; the Huntsville Road withdrawal; 203/980/201 = 1,384 US casualties; 12,000-13,000 CS actually engaged | Verified, fetched (Shea authorship disclosed above) |
| [American Battlefield Trust - Pea Ridge](https://www.battlefields.org/learn/civil-war/battles/pea-ridge) + [battle article](https://www.battlefields.org/learn/articles/battle-pea-ridge) + [Mar 8 map](https://www.battlefields.org/learn/maps/pea-ridge-elkhorn-tavern-mar-8-1862) | US 10,500 / CS 16,000; CS casualties 2,500 (the high voice of the range); the forced march (March 4 start, 50 miles, snow, trains left behind); Little Sugar Creek entrenchments; the double envelopment; Sigel drove the right / Davis the center | Verified, fetched |
| [Encyclopedia of Arkansas - Pea Ridge](https://encyclopediaofarkansas.net/entries/battle-of-pea-ridge-508/) + [campaign entry](https://encyclopediaofarkansas.net/entries/pea-ridge-campaign-507/) | ~10,250 US / ~16,000 CS; ~2,000 CS casualties (the low voice); the 9:30 a.m. Cross Timber Hollow first contact (Cearnal's battalion vs a 24th Missouri company); Vandever's 12:30 p.m. arrival; Clemons' farm and Ruddick's field; Little's Huntsville Road push at nightfall; "greater than any other Confederate force in a single campaign"; Van Dorn ordered to Corinth under A. S. Johnston, Arkansas abandoned | Verified, fetched |
| [Wikipedia - Battle of Pea Ridge](https://en.wikipedia.org/wiki/Battle_of_Pea_Ridge) + [CS order of battle](https://en.wikipedia.org/wiki/Pea_Ridge_Confederate_order_of_battle) | Cross-checks; the 203/980/201 split (OR-derived); divisional returns (Carr 682, Davis 344); Van Dorn's distrusted ~800 k/w self-report; the March 6 Bentonville rearguard action; Greer succession | Verified as the OR/Shea mirror — ONE voice, never counted as the second source |
| [Encyclopedia of Arkansas - Indian soldiers](https://encyclopediaofarkansas.net/entries/indian-soldiers-6392/) + [ABT Cherokees at Pea Ridge](https://www.battlefields.org/learn/articles/cherokees-pea-ridge) + [Oklahoma Historical Society](https://www.okhistory.org/publications/enc/entry?entry=PE001) | The Leetown/Native teaching content: Pike's "no more than 900" engaged (2,500 paper); the Foster's Farm fight; Watie's March 8 Big Mountain skirmish (the carve-out evidence); the alliance-politics quotes (EOA); the 1st=Drew / 2nd=Watie numbering (four concordant voices) | Verified for the two-chain claims (Foster's Farm, the two-mile separation, the regiment numbering). **The refute pass caught a gather misattribution: the ENTIRE scalping/Pike-reaction cluster lives in the ABT article ONLY (← Shea & Hess) — the EOA indian-soldiers page contains none of it (two direct fetches). That whole cluster ships single-source `Inferred`** |
| Shea & Hess, *Pea Ridge: Civil War Campaign in the West* (1992) | The controlling monograph behind NPS/ECWC/Wikipedia/ABT narratives; named on every claim whose corroboration collapses to it (the day-2 line order, Greer's overnight march, the 21-gun placement) | The scholarly anchor — cited by name, not by URL |

**Two-source rule:** every future runtime teaching card and codex claim stamped `Verified`
requires at least two genuinely independent source families supporting that exact claim, with the
Shea-root collapse rule above applied honestly. One family = `Inferred`; a real conflict =
`Disputed` with both values shown. D388 may amend this register with a second family before
upgrading provenance; it may not silently promote a claim in runtime data. **The completeness
critic's highest-leverage D388 upgrade path: a page-cited Shea & Hess (1992) fetch (archive.org /
Google Books) — the single pass that would lift the P1 axis strengths, the P2 line order, Big
Mountain, Pike's 3:30 retreat, and the scalping cluster from `Inferred` toward `Verified`.**

**Packet addendum:** the trans-Mississippi packet carries a D387 spec-time addendum (its §12)
recording what this research pass corrected or resolved beyond the packet text: Price's at-battle
label (CSA commission March 6, 1862 — the packet's §8 state-force probe string belongs to
Wilson's Creek, not Pea Ridge), the Slack colonel/posthumous-BG trap (the packet never mentions
Slack), Welfley's Knoll as sourced day-2 geometry, the landmark re-fetch results, and the
Drew/Watie regiment-number majority convention. The packet text above the addendum stays as the
historical record of what the earlier pass believed.

## 3. Strength And OOB Contract

Use engaged forces on the active map, not campaign-wide present figures — and on THIS battle,
never whole-army or whole-wing figures as axis figures.

- **Whole-battle anchors (Verified):** US about **10,500** (EOA "about 10,250"; NPS 10,250
  engaged) against CS about **16,000-16,500** (ABT 16,000; Wikipedia 16,500; NPS puts CS troops
  ACTUALLY ENGAGED at 12,000-13,000 — strength and engagement are different measures and are
  never conflated). These anchor the envelopes below; they are NOT phase-committed totals.
- **Wing arithmetic (Verified, still not axis figures):** Price's wing ~7,000 Missourians took
  the Bentonville Detour onto this axis; McCulloch's wing ~8,000 (including Pike's ~900 engaged
  Native brigade) fought at Leetown. The refute pass held the line the packet drew: **no source
  pins an Elkhorn-axis engaged figure for either day** — the widely-circulated "950 infantry and
  310 dragoons against ~5,000" opening rests on a single unfetchable secondary and ships
  `Inferred`; the "Van Dorn had ~5,000 at the tavern on March 8" figure is unsourced and is
  REJECTED outright.
- **Phase committed-total envelopes (engine abstractions, all `Inferred`):** each phase fields a
  committed SLICE of each army. D388 authors inside these envelopes and the plan probe enforces
  them once data exists:
  - Phase 1 (March 7): CS 4,000-6,500 committed (Price's wing on the axis, minus the sourced
    straggler loss of the forced march; NPS's ~3-to-1 troops / 7-to-1 artillery ratios
    corroborate the 4,500-5,500 middle of the range — the 7,000 wing total is a ceiling that is
    never encoded as the engaged count) against US 2,000-5,500 (Carr's 4th Division opening
    small — about 1,260 in the first line per the single-source opening figure, `Inferred` —
    then the sourced piecemeal day: Dodge up the Wire Road, Vandever arriving about 12:30 p.m.,
    Asboth's relief late in the day — modeled as timed reinforcements, the shipped D90/D384
    attacker-seize recipe).
  - Phase 2 (March 8): US 7,500-10,500 (the re-formed four-division line — right to left Carr,
    Davis, Osterhaus, Asboth, with Sigel commanding the two left divisions; the order is Shea
    1997 p.239 via ECWC/Wikipedia, and the ABT map's differing arrangement is its DAWN snapshot,
    a temporal caveat the OOB notes carry — plus the massed guns) against CS 5,000-11,000 (the
    consolidated remnant including Greer's overnight McCulloch-wing arrivals; low ammunition
    modeled through section 5, never through the count).
- **Artillery:** the March 8 gun figures are genuinely sourced and may ship as counts — **21
  Federal guns massed (six batteries) on Welfley's Knoll against 12 Confederate guns** (NPS park
  Stop 10 + Shea p.230-36; the two-family rule is satisfied by NPS-park + the monograph via
  ECWC). March 7 gun splits are coarse `Inferred` under the universal gun model (NPS's 7-to-1
  day-1 artillery ratio is derivative corroboration, not a count).
- **Every lower split ships coarse:** brigade grouping strengths, crew counts, experience,
  formation, readiness, reinforcement seconds, and exact sector placements remain coarse and
  `Inferred` unless a register source pins them. Named formations the OOB may use with `Verified
  identity; Inferred strength`: Carr's 4th Division (Dodge's and Vandever's brigades, the 24th
  Missouri's first-contact company), Asboth's and Osterhaus's and Davis's divisions (day 2),
  Little's 1st Missouri Brigade, Slack's 2nd Missouri Brigade, Frost's MSG 7th/9th divisions,
  Gates's 1st Missouri Cavalry (identity ONLY — the refute killed the dismounted-fight,
  captured-guns, and casualty details), Cearnal's cavalry battalion, Greer's day-2 remnant.
- **CS exhaustion is an input, not a penalty:** Van Dorn's men arrived off a three-day, fifty-mile
  forced march through snow on short rations, having left the trains behind (ABT + EOA,
  Verified). D388 encodes this as accurate readiness/experience/fatigue-class INPUTS on the
  universal model within the shipped input vocabulary — never a battle-named multiplier
  (section 8).

## 4. Terrain And Objective Contract

The future map must carry these landmarks as terrain, objective, marker, road, water, or teaching
context. Coordinates and geometry remain Inferred abstractions.

- **Elkhorn Tavern** — the objective, on the Telegraph Road at the Huntsville Road junction;
  Van Dorn's brief HQ and a field hospital for both sides (NPS).
- **Telegraph Road (Wire Road)** — the north-south spine; the CS descent route from Cross Timber
  Hollow and the axis both fights ran along.
- **Huntsville Road** — east from the tavern; Little's men pushed along it at nightfall on March
  7, and Van Dorn's army withdrew east on it on March 8, escaping past Curtis's right.
- **Cross Timber Hollow** — the deep hollow north of the tavern where the Telegraph Road drops
  off the plateau; the CS approach INTO the Union rear; first contact about 9:30 a.m. (Cearnal's
  battalion against a 24th Missouri company).
- **Big Mountain** — the high ground northwest of the tavern; day-2 teaching context (Watie's
  Cherokees skirmished near its point on March 8 and were driven off — section 9. The refute
  pass resolved the attribution: "Asboth's regiments drove the 2nd Cherokee Mounted Rifles from
  the point of Big Mountain" is Shea & Hess via Wikipedia's own footnote, with the March 8
  skirmish independently in the Oklahoma Historical Society entry; the NPS Asboth biography's
  "no direct part" line describes Asboth PERSONALLY managing the trains, not his division's
  regiments — a unit-vs-commander distinction, not a contradiction. Ships `Inferred` on the
  Shea root, attributed exactly).
- **Clemons' farm** — east of the tavern; Dodge's brigade's fight (the sources spell it
  Clemons/Clemon's/Clemmon's; one spelling is chosen and noted).
- **Ruddick's field** — over a quarter-mile south of the tavern; Carr's final March 7 line and
  the anchor of the US fallback geometry.
- **The tanyard** — the ravine/tanyard ground in Cross Timber Hollow (`Inferred` — the name rests
  on thin NPS-archeology support; it may appear as flavor, never as a load-bearing sourced
  claim).
- **Welfley's Knoll** — the ridge west of the tavern where Sigel massed the 21-gun line on March
  8 (named for Capt. Martin Welfley; NPS park Stop 10). The Phase 2 US gun positions live here.
- **Little Sugar Creek** — Curtis's original fortified line facing south, two miles from the
  ridge; southern map-edge/teaching context and the US home-edge anchor.
- **Bentonville Detour and Camp Stephens** — the CS approach route and the place the trains
  stayed; off-map/edge context that positions the Phase 2 CS supply marker (section 5).
- **Ford Road and Leetown** — attested landmarks of the OTHER axis (McCulloch's March 7 fight);
  teaching context only on this battle's map, never an objective.

The wooded hollows and fences may provide ordinary universal cover. No terrain element writes
casualties, morale, rout, score, or winner.

## 5. Supply-Collapse Input Contract (The Ammunition Law)

Pea Ridge was decided by ammunition logistics, and this battle encodes it ONLY through levers the
engine already owns:

1. **The sourced fact (Verified):** Van Dorn cut loose from his trains for the envelopment march;
   the army's reserve ammunition was with the wagon train, and on the night of March 7 the train
   was **mistakenly ordered back to Camp Stephens — "a dozen miles distant" (NPS/Shea), about a
   six-hour march** — so on March 8 the Confederate army could not refill and Van Dorn ordered
   the withdrawal east on the Huntsville Road (NPS/Shea + EOA + ABT).
2. **The engine-native encoding:** T4 logistics reads the per-phase `supply` positions
   (`sd.supply.US` / `sd.supply.CS` — the shipped Fort Donelson pattern). Phase 1 places the CS
   train marker at the far northern map edge (the army marched ahead of its trains); Phase 2
   places it at the extreme edge in the Camp Stephens direction with the name carrying the
   teaching (e.g. `The trains — ordered back to Camp Stephens`), so resupply latency and the
   culminating-point mechanics T4 already implements do the historical work. The US trains sit
   close behind their line in both phases (intact supply — the accurate input).
3. **FORBIDDEN encodings:** any battle-named ammunition/supply/exhaustion multiplier or penalty
   key (section 8); scripting the day-2 collapse; draining CS cartridge boxes by fiat; an
   out-of-ammo flag written by the scenario. The collapse must EMERGE from train distance,
   universal reserve/resupply mechanics, readiness inputs, and the US gun mass.
4. **The teaching card carries the law:** "the ammunition was twelve miles away" is the battle's
   deciding fact and ships as a card (section 9), so the player learns why the army that took the
   tavern on March 7 could not hold it on March 8.

## 6. Battle-Date Ranks And Command Traps

The future runtime probe searches leaders, unit commanders, notes, brief/end text, teaching
cards, and codex content. Rank checks are scenario-scoped. March 1862 is EARLY-WAR: five of the
eight Union commanders above brigade level were COLONELS, and both Missouri brigade commanders
died or were promoted into the grades people remember them by — this cast is a backdating
minefield on both sides.

**Union (the NPS order of battle is the rank anchor; ABT corroborates the generals):**

- **Curtis battle-date rank — Brig. Gen. Samuel R. Curtis; the Major General promotion (date of
  rank March 21, 1862) was the reward FOR this victory and postdates the fight — never render
  Maj. Gen. during the battle.** (Two-source: Civil War on the Western Border + EOA. The
  GO-No.63/June-10 issuance detail failed verification and never ships.)
- **Brig. Gen. Franz Sigel** — commanding the 1st and 2nd Division wing; on March 8 he
  commanded the two left divisions and the massed guns. (At Pea Ridge his grade is firm — the
  Wilson's Creek Colonel-vs-BG conflict belongs to August 1861, not here.)
- **Brig. Gen. Alexander Asboth** — 2nd Division; wounded in the right arm March 7 (Verified).
  His nomination/confirmation paperwork dates are single-source and never ship as fact.
- **Col. Peter J. Osterhaus** — leading the 1st Division's fighting despite colonel's grade
  (Brig. Gen. only June 1862). Sources vary between styling him a division or brigade commander;
  the OOB discloses the ambiguity rather than resolving it.
- **Col. Jefferson C. Davis** — 3rd Division. Reject `Brig. Gen. Jefferson C. Davis` at this
  battle: NPS and ABT OOBs print Colonel; his brigadier date is genuinely conflicted in the
  record (a lapsed/reworked 1861 appointment) and ships `Disputed` in any bio note.
- **Col. Eugene A. Carr** — 4th Division, the axis's defending commander. Reject
  `Brig. Gen. Carr` at this battle: the OOBs print Colonel; his BG commission was appointed in
  April 1862 with date of rank BACKDATED to March 7, 1862 — the backdate is disclosed as a
  teaching nuance, never rendered as the at-battle grade. Wounded repeatedly while holding all
  day (the Medal of Honor citation says "several times wounded"; the neck/arm/ankle enumeration
  is single-source and ships `Inferred`). **His Medal of Honor was awarded January 16, 1894 —
  thirty-two years later; never render it as an 1862 decoration.**
- **Col. Grenville M. Dodge** — 1st Brigade, 4th Division; wounded (EOA: three horses shot from
  under him, ribs broken). His BG promotion is post-battle; no date ships (the March 31 figure
  failed verification).
- **Col. William Vandever** — 2nd Brigade, 4th Division (BG only November 29, 1862).

**Confederate / Missouri State Guard (the dual-authority army):**

- **Maj. Gen. Earl Van Dorn** — C.S.A., commanding the Army of the West; took the
  Trans-Mississippi District January 1862 (ordered January 10; assumed command January 29,
  HQ Pocahontas).
- **Maj. Gen. Sterling Price — THE COMMISSION NUANCE, resolved:** his CONFEDERATE major-general
  commission is dated **March 6, 1862 — the eve of this battle** (two-source: ABT biography +
  Wikipedia). Before it he was Major General of the MISSOURI STATE GUARD, a state force. The
  honest at-battle label is `Maj. Gen. Sterling Price` with the nuance taught, not hidden: his
  Confederate commission was one day old, and most of the Missourians he led still served under
  State Guard organization, not the Confederate army. Wounded March 7; kept command through the
  March 8 rear guard. (The packet's `Maj. Gen., Missouri State Guard` probe string is the
  WILSON'S CREEK rendering — at Pea Ridge it would be FALSE precision the other way.)
- **Col. Henry Little** — 1st Missouri Brigade, C.S.A.; led the axis assault. Reject
  `Brig. Gen. Little` (BG April 12, 1862, after the battle).
- **Col. William Y. Slack** — 2nd Missouri Brigade. **The posthumous trap, both directions:** at
  Pea Ridge he was a COLONEL in Confederate service (his earlier Missouri State Guard
  brigadier-generalship belongs to the Guard, and the OOB label follows his Confederate grade
  with the Guard history disclosed). Mortally wounded March 7 near the tavern; died March 21;
  his Confederate brigadier general's commission was POSTHUMOUS (appointed April 17, to date
  from April 12 — the Senate may not yet have known he was dead). Never render
  `Brig. Gen. Slack` on this battle's OOB. The wound mechanics (hip vs groin, the deflected
  ball) are a genuine primary-source conflict and ship `Disputed` if described.
- **Brig. Gen. Daniel M. Frost — the REVERSE trap:** he WAS a Confederate brigadier general at
  this battle (commissioned March 3, 1862, four days before), while commanding MISSOURI STATE
  GUARD divisions (the 7th and 9th). Do not "correct" him down to an MSG-only grade.
- **Col. Elijah Gates** — 1st Missouri Cavalry. Identity only: the refute pass REFUTED the
  dismounted-at-the-tavern fight, the two-captured-guns story, and the 18/41/16 casualty figures
  (the cited page contains none of them); none of it ships.
- **Col. Elkanah Greer** — 3rd Texas Cavalry; the senior surviving officer of McCulloch's wing
  after March 7, who took command of the remnant as it disengaged and rejoined Van Dorn for
  March 8 (EOA Greer entry + the CS order of battle; the overnight-march detail is Shea-rooted
  and cites the monograph).
- **Leetown's cast is teaching-only on this axis** (sections 8-9): Brig. Gen. Ben McCulloch
  (KILLED March 7 while reconnoitering), Brig. Gen. James McIntosh (KILLED shortly after,
  leading an attack — the "charge to recover the body" motive is in NEITHER cited source and
  never ships), Col. Louis Hébert (CAPTURED in Morgan's Woods), Brig. Gen. Albert Pike (at 3:30
  p.m. he led the regiments nearest him in retreat toward Twelve Corners Church — single-source
  via the Shea root, ships `Inferred`; never rendered as a formal wing-command succession),
  **Col. Stand Watie** (2nd Cherokee Mounted Rifles — a COLONEL in March 1862; his brigadier
  general's star belongs to 1864 and is never backdated), Col. John Drew (1st Cherokee Mounted
  Rifles). None of these may appear as a fielded unit or leader in this battle's OOB.
- **Promotion-paperwork dates are disclosure-only:** every granular commission/nomination/
  confirmation date in this cast (Asboth's, Carr's, Dodge's, Slack's posthumous pair) is
  single-source pending an Official Records / Warner pass; battle-date GRADES are the probe-
  pinned law, and no teaching card states a paperwork date as settled fact.

Command loss enters the model ONLY as accurate inputs: Slack's mortal wounding is his unit's
ordinary leader-fate input and a teaching card; McCulloch's death reshaping March 8 is the
consolidated-army composition of Phase 2 (Greer's arriving remnant), never a scripted event.

## 7. Historical Direction Law And Honest A/B

D388 runs exactly eight shared-model deterministic seeds in one serialized focused process.
Require at least **5/8** for each independent direction guard, each derived from a sourced
outcome, never from a prior:

1. **Phase 1 — the CS seizes Elkhorn Tavern** (by nightfall March 7 the Confederates held the
   tavern and the Federals had fallen back to Ruddick's field — EOA narrative + ABT map
   annotation, Verified).
2. **Phase 2 — the US seizes the objective** (the two-hour bombardment from Welfley's Knoll,
   then Sigel driving the Confederate right and Davis the center; the field and the road
   junction retaken by late morning — NPS/Shea + ABT map, Verified).
3. **The aggregate battle winner is the US** (Union victory; Missouri secured — every register
   source).
4. **Aggregate casualty DIRECTION only: CS total losses exceed US total losses** (US 1,384 is
   firm and triple-attested; the CS record is a genuine range — Shea/EOA ~2,000 against ABT
   2,500, with Van Dorn's own ~800 report distrusted as an undercount — but EVERY reputable
   estimate sits well above 1,384, so the direction is source-safe while the magnitude is not.
   The refute pass endorsed exactly this guard shape.)

**Forbidden guards:** no casualty MAGNITUDE, ratio, or split tooth; **no per-phase casualty tooth
in either phase in either direction** — the Confederate returns were never completed and no
per-day split exists in the record, so a phase-scoped casualty guard would be fabricated
precision (this battle's variant of the Cedar Creek direction-neutral lesson: the aggregate
direction is sourced, the phase decomposition is not). No prisoner, capture, gun-loss, or rout
tooth.

If D388 changes any simulation input after the first eight-seed battery, `DECISIONS.md` logs the
old value, new value, and both observed guard counts for every iteration. Eligible inputs are
committed strengths inside the section 3 envelopes, coarse OOB splits, universal gun counts (the
sourced 21/12 on March 8), ordinary leader quality/aura inputs, terrain/cover geometry,
formation, experience/readiness (the forced-march exhaustion), reinforcement timing (the sourced
piecemeal March 7 defense), supply-train positions (section 5), objective radius, and universal
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
`panicMult`, `collapseMult`.

Named temptations, all forbidden: forcing the March 8 collapse with an ammunition or supply
multiplier instead of the section 5 train-position encoding; a Van Dorn left-the-trains debuff; a
forced-march casualty or morale tick (exhaustion is a readiness INPUT); scripting the Phase 1
seizure instead of giving the CS the historical means (mass against a piecemeal defense — the
shipped D90 recipe); a surprise/envelopment bonus (the envelopment is geometry: the home-edge
inversion and the fog model); modeling Price's or Curtis's leadership as a result-writer; any
Native super-unit (doubly barred — D359 bars the unit, D74 bars the fudge); any source branch
that checks `elkhornTavern` and writes combat output.

The result must emerge from committed strength, terrain cover, reinforcement and supply-train
timing/geometry, formation, experience/readiness, universal command aura, the 21-against-12 gun
mass, and the objective/time model.

## 9. Teaching, Dignity, And Memory Contract

D388 requires at least eight restrained teaching cards plus one codex entry. Every claim obeys
the two-source/provenance rule with the Shea-root disclosure (section 2); sourced quote text is
rendered exactly; disputed counts show both values.

1. **The Most Pivotal Battle West of the Mississippi.** NPS's verbatim superlative — "Pea Ridge
   was the most pivotal Civil War battle west of the Mississippi River" — with its true scope:
   over 23,000 soldiers combined, the fate of Missouri decided, the state secured for the Union
   for the next two years. NEVER "largest" (NPS does not say it; the claim failed refute). EOA's
   quotable frame: the Confederate advantage in men and artillery was "greater than any other
   Confederate force in a single campaign during the entire Civil War" — and they lost.
2. **A State Army, Not a Confederate One.** Missouri's elected convention rejected secession
   98-1; the rump Neosho ordinance (October 30-31, 1861) and the Confederacy's November 28
   admission created a government-in-exile; the Missouri State Guard fought under STATE
   authority. At Pea Ridge the nuance peaks: Price's Confederate major-general commission was
   dated March 6, 1862 — the day before the battle — while most of his Missourians were still
   State Guard men, and Frost held a four-day-old Confederate brigadier's commission while
   commanding State Guard divisions. Teach the dual-authority army; never flatten it to
   "Confederates."
3. **The Envelopment and the About-Face.** Curtis fortified Little Sugar Creek facing south; Van
   Dorn refused the front entirely and marched the Bentonville Detour around Big Mountain into
   the Union REAR (the campfire ruse ships `Inferred`, single-source). About 10:30 a.m. Curtis
   learned the enemy was on the Telegraph Road behind him and calmly re-faced his entire army —
   the battle's defining act of command. The map's home edges carry the lesson.
4. **Three Days of Snow, Fifty Miles, No Trains.** The forced march (March 4 onward) through
   snow on short rations, the trains left behind for speed — Van Dorn arrived with exhausted,
   hungry men and no reserve ammunition at hand. Accurate inputs BEFORE the first shot; the card
   names the price paid on March 8.
5. **Carr Holds the Hollow.** The all-day outnumbered stand: first contact 9:30 a.m. in Cross
   Timber Hollow, Dodge's fight at Clemons' farm, Vandever's 12:30 p.m. arrival, four successive
   lines back to Ruddick's field, Asboth's late-day relief. Carr — a colonel commanding a
   division — "several times wounded" and holding (the Medal of Honor citation, awarded January
   16, 1894, rendered exactly). Carr's division bore 682 of the army's 1,384 casualties (the
   divisional returns; OR/Wikipedia voice, `Inferred`). Col. William Y. Slack fell near the
   tavern — the posthumous-brigadier trap taught plainly.
6. **Twenty-One Guns on Welfley's Knoll.** March 8, about 8:30 a.m.: six batteries — 21 guns —
   massed on the knoll west of the tavern against 12 Confederate guns; over 3,600 rounds in two
   hours, the most effective massed artillery preparation of the war to that date taught WITHOUT
   that unsourced superlative — then the infantry went in about 10 a.m., Sigel driving the
   Confederate right, Davis the center. (NPS park Stop 10 + NPS/Shea sec8.)
7. **The Ammunition Was Twelve Miles Away.** The reserve train, mistakenly ordered back to Camp
   Stephens, a six-hour march distant; an army holding the ground it won and unable to refill
   its cartridge boxes; Van Dorn's withdrawal east on the Huntsville Road past Curtis's right.
   **The causation is taught whole, never as exculpatory accident (the critic's anti-Lost-Cause
   condition):** the empty cartridge boxes were the end of a chain of Van Dorn's OWN operational
   choices — the exhausting no-rations forced march, cutting loose from the trains, the train
   ordered back, a wing's leadership spent at Leetown — met by Union competence: Curtis's
   about-face, the re-formed line, Sigel's guns. Never "a gallant army betrayed by bad luck."
   (The engine's supply model IS this card, section 5.)
8. **Leetown: The Other Field.** March 7's second fight, two miles southwest: McCulloch shot
   dead reconnoitering, McIntosh killed minutes later, Hébert captured — a wing leaderless in
   under an hour; Greer, the senior colonel left standing, brought the remnant to Van Dorn
   overnight. Why March 8 at the tavern was the whole army's fight. (This card is the honest
   window onto the axis this game deliberately does not field.)
9. **Native Nations at Pea Ridge — Agency, Not Exotica.** Reuses the shipped D183 framing
   verbatim as the packet requires: Pike's brigade — Watie's 2nd and Drew's 1st Cherokee Mounted
   Rifles, "no more than 900" engaged of about 2,500 on paper — fought at LEETOWN on March 7
   (Foster's Farm), and on March 8 Watie's men skirmished near the point of Big Mountain and
   were driven off before the decisive assault (Shea-rooted, attributed per section 4):
   peripheral to this axis, and taught as exactly that. The alliance politics are the card's
   spine — the U.S. Army's abandonment of Indian Territory's forts, sovereignty fears, the
   slaveholding Treaty-Party elite, Ross's coerced calculus (the EOA quote, single-family
   `Inferred`), the Ross-vs-Watie blood feud running back to New Echota and 1839, and Drew's
   regiment's earlier mass defection rather than fight Opothleyahola's Unionist refugees
   (count-free — the sourced fragments are ~400 deserting with Drew and about 28 staying, one
   voice; no "only mass defection of the war" superlative ships). Native soldiers appear as
   historical actors with their own politics; the numbering confusion in the secondary
   literature (1st=Drew / 2nd=Watie is the four-voice majority convention) is noted on the
   card. **No Native unit is fielded — D359.**
10. **The Scalping and Its Weaponization.** After the Leetown cavalry fight, some of Watie's men
    scalped at least eight of Trimble's Iowa cavalrymen and mutilated others. **Provenance
    honesty is the card's frame: this whole cluster — the scalpings, Pike's horror, his orders
    against the practice, the court-martial, the July 1862 resignation, the federal indictment —
    is carried by the ABT article alone on the Shea & Hess root (the refute pass proved the EOA
    page contains none of it), so every sentence ships `Inferred` with that attribution.** The
    Northern press seized the atrocity and inflated it into anti-Native propaganda; who did the
    scalping was never established (the earlier packet pass recorded ABT noting the perpetrators
    were unidentified; this pass could not re-find the line — ships `Inferred`), and no
    Union-retaliation claim was located in accessible sources (an honest non-finding, never an
    affirmative "none occurred"). Teach BOTH the atrocity AND its weaponization. Never a scored
    objective; neither "Native savagery" nor "Union innocence" is laundered.

**Dignity boundaries (executable):** **NO Leetown scenario, data file, registry entry, or
fielded Native unit may exist — the D359 carve-out.** The plan probe and the future focused
probe enforce a LEETOWN ABSENCE GUARD on the Fort Pillow pattern: no `data/leetown*` file, no
Leetown registry line, and no OOB unit or reinforcement in any `data/elkhorn*` file whose
name/commander/note marks it as a Native formation (Cherokee / Mounted Rifles / Watie / Drew /
Pike's brigade / Indian Brigade). Teaching cards MAY — and card 9-10 MUST — name Pike, Watie,
Drew, and the scalping controversy honestly. The research carve-out verdict this contract rests
on (the completeness critic's explicit finding): the Native combat role was concentrated at
Leetown — off this axis entirely — and the March 8 presence on this axis was a peripheral
skirmish near the point of Big Mountain, driven off before the decisive assault. **The "not
load-bearing on March 8" judgment is an argument from silence and is rendered `Inferred` ("no
cited source depicts a Native combat unit in the decisive March 8 Elkhorn action"), never as a
Verified fact** — and the omission is dignity-by-design, not erasure: cards 8-10 are MANDATORY
so the player learns the participation the OOB deliberately does not field. **If future evidence
shows a Native unit load-bearing on THIS axis, that is a HALT-and-surface event, not a silent
OOB edit.**

The codex entry uses `theater:"Trans-Mississippi"`, `campaign:"Pea Ridge Campaign"`, and
`result:"Union victory"`, with the state-army nuance and the strategic consequence (Van Dorn
ordered to Corinth; Arkansas left open — EOA campaign entry) stated plainly.

## 10. Frozen Classic And Rail-Route Collision Law

One lowercase Classic layer already exists and remains untouched:

- frozen Classic `build/base.html` has exactly one
  `{id:"peariver", name:"Pea Ridge", year:1862, th:"TM", atk:"CS", us:10500, cs:16000, ...}`
  roster row (with `cmdUS:"Curtis", cmdCS:"Van Dorn"` and `wx:"clear"`);
- `data/logistics-rail.json` has NO route for this battle, and the tactical id must not create
  one (northwest Arkansas had no rail line to model — the wagon-train story of section 5 is the
  point).

The new tactical id is camel-case `elkhornTavern` and the new data filename is hyphenated
`elkhorn-tavern.json`. D388 must preserve the lowercase Classic `peariver` record byte-for-byte
as a separate layer. No attempt may rename, merge, delete, or repurpose it, and no
`elkhornTavern`/`elkhorn-tavern`/`peariver` rail route may appear. The Classic row's
10,500/16,000 happen to match the register anchors, but the frozen row is never cited as a
source.

## 11. Planned-Only And Future Complete-Integration Baselines

### D387 planned-only baselines (must remain exact)

- registered tactical scenarios: **20**;
- battle files / total schema files: **20 / 50**;
- Army Register: **1281**;
- explicit flags / valid weather hints / Intel opening-scene coverage / media opening scenes:
  **20 / 20 / 20 / 20**;
- no-regression suite list: **125**; sweep comment: **20** battles;
- generated HTML md5: **`a9b42b69c1c735b81fff7c9c878c1bc0`**;
- no `data/elkhorn-tavern.json`, no `tools/probe-elkhorn-tavern.mjs`, no T1/T10/runtime
  integration, and no Elkhorn-Tavern identifier in any scanned integration surface.

The D387 plan probe fails if even one Elkhorn Tavern runtime seam appears while the data file is
absent. Half-registration is always red.

### D388 future atomic integration contract

All surfaces arrive in one green runtime commit or the plan probe fails closed:

- `data/elkhorn-tavern.json`, top-level key/id `elkhornTavern`, two-phase T8 per section 1
  (roles CS>US then US>CS, weights `[1, 3]`, top-level fog off with Phase 1 per-phase
  `defaultFog:true`, per-phase `supply` positions per section 5), committed strengths inside the
  section 3 envelopes, terrain per section 4, teaching per section 9, ranks per section 6;
- `src/tactical/T1-bull-run.js` exact registry line
  `R.elkhornTavern = GAME_DATA["elkhorn-tavern"].elkhornTavern` and menu rank `elkhornTavern:49`;
- tactical scenarios **20 -> 21**;
- `tools/validate-data-schemas.mjs` battle enrollment and total schema files **50 -> 51**;
- `tools/probe-tactical-roster.mjs` and `tools/probe-custom-battle-builder.mjs` historical
  baselines include `elkhornTavern`; the roster's `PHASE_COUNTS` records `elkhornTavern: 2` and
  the DOM check includes `fldScnBtn_elkhornTavern`;
- Army Register **`1281 + (unique Elkhorn Tavern side-unit ids × 3)`**, with every whole-registry
  pin moved and documented in the same commit — the full pin-history chain is preserved and the
  new `D388: 1281 -> N — Elkhorn Tavern ...` fragment is appended in the documented-history
  format;
- `src/tactical/T10-flags.js` explicit Elkhorn Tavern metadata **`TM / false / first-national`**
  (Trans-Mississippi theater — the game's first, matching the Classic row's `th:"TM"` and the
  codex axis; no AotP badges; First National family — March 1862 precedes this game's sourced
  Hardee-pattern convention, which begins at Stones River; Shiloh and Fort Donelson are the
  shipped precedents) with an Inferred-representative disclosure, and `tools/probe-flags.mjs`
  coverage teeth at 21 — **if T10's theater vocabulary does not yet admit `TM`, D388 uses `W`
  with the Trans-Mississippi disclosure in the metadata comment and the codex, and logs the
  choice; either way the flag family is first-national and badges are false**;
- flags/weather/Intel/media coverage **20 -> 21**; the weather hint ships clear/cold-March
  presentation only (sky/time `Inferred`; the frozen Classic row's `wx:"clear"` is a separate
  layer, not a source);
- `tools/probe-elkhorn-tavern.mjs` focused browser/runtime guard enrolled in
  `tools/vet-no-regression.mjs`; suite **125 -> 126** and sweep comment **20 -> 21**;
- generated `civil_war_generals.html` rebuilt only through `node tools/build.mjs`;
- frozen lowercase Classic `peariver` row unchanged; no rail route;
- **the LEETOWN ABSENCE GUARD green:** no `data/leetown*` file, no Leetown registry line, no
  Native-formation unit row in any `data/elkhorn*` file (section 9);
- no new Wilson's Creek, Glorieta, or Red River data or registration of any kind (they remain
  queued/teaching-only per the packet).

## 12. Plan Probe Contract

`tools/probe-elkhorn-tavern-plan.mjs` is filesystem-first, dual-mode, and fail-closed. It writes
`tools/shots/probe-elkhorn-tavern-plan.json`, exits nonzero on failure, prints exactly one
14-step summary, and reports each failed step on stderr. Because this spec is hard-wrapped, its
text anchors match on whitespace-normalized text (the D385 idiom) — the teeth still bite on any
word-level tamper.

The fourteen steps, in this exact order, are:

1. `SPEC SHAPE`
2. `PHASES + WEIGHTS + AUDIT`
3. `SOURCES + STRENGTH`
4. `TERRAIN`
5. `SUPPLY-COLLAPSE INPUTS`
6. `RANKS + TRAPS`
7. `HISTORY + DIGNITY`
8. `LEETOWN ABSENCE GUARD`
9. `D74 NO-FUDGE`
10. `DIRECTION LAW`
11. `CLASSIC/RAIL COLLISION`
12. `PLANNED-ONLY BASELINES`
13. `FUTURE COMPLETE-INTEGRATION CONTRACT`
14. `LANE`

When the runtime data file is absent, the probe requires every D387 count/hash and rejects any
partial runtime seam. When the runtime data file is present, it requires the complete
21/51/`1281+3U`/21/126 integration plus the two-phase shape, the role flip, the Phase-1 fog and
Phase-2 clear contract, the supply positions, envelope sums, rank walls, teaching provenance, the
Leetown absence guard, and the focused-probe direction contract. Half-registration is always red.
The `LANE` step anchors on durable ladder history and the role-roster owner check (any recognized
TOP-LOOP tool), never the current lock holder (the D381 relay lesson).

## 13. D387 Negative Bind And Focused Gate

After the clean plan probe passes:

1. record md5 for this spec and the generated HTML;
2. change only the section 6 Curtis rank-lock line (the bulleted lock beginning `**Curtis
   battle-date rank — Brig. Gen. Samuel R. Curtis`) to a firm `Maj. Gen.` battle-date rendering;
3. run `node tools/probe-elkhorn-tavern-plan.mjs` and require exit 1 with exactly
   `RANKS + TRAPS` red (13/14 green);
4. restore the line byte-identically;
5. require the spec md5 to match exactly;
6. rebuild and require generated HTML md5 `a9b42b69c1c735b81fff7c9c878c1bc0`;
7. rerun the plan probe 14/14 green.

The rank tooth is section-scoped to section 6's own body (the D383 hardening — a quotation of
the lock line elsewhere in this document can never mask a tamper). Harden only the rank tooth if
the tamper fails too broadly or does not bite. Do not weaken any unrelated tooth.

Set `TMPDIR="$PWD/.tmp"` and run serially:

```bash
node --check tools/probe-elkhorn-tavern-plan.mjs
node tools/build.mjs
node tools/validate-data-schemas.mjs
node tools/probe-battle-build-research.mjs
node tools/probe-elkhorn-tavern-plan.mjs
node tools/probe-fort-donelson-plan.mjs
node tools/probe-five-forks-plan.mjs
node tools/probe-cedar-creek-plan.mjs
node tools/probe-cross-keys-port-republic-plan.mjs
node tools/probe-stones-river-plan.mjs
node tools/probe-new-market-heights-plan.mjs
node tools/probe-gaines-mill-plan.mjs
node tools/probe-women-in-war-arc-plan.mjs
node tools/probe-women-in-war.mjs 2>/dev/null
node tools/vet-no-regression.mjs --list
git diff --check
```

Require build `GATE OK`; generated HTML md5 unchanged `a9b42b69c1c735b81fff7c9c878c1bc0`; schema
50/50; research 15/15 (with the packet §12 addendum — additive, the D383 precedent); Elkhorn
Tavern plan 14/14; all eight prior plan probes green (`ALL OK`); the women focused probe 13/13
at the 11-record lock with 0 pageerrors; suite list 125; every produced JSON/HTML artifact
parsed and read; no failed step or recursive pageerror. Do not run `npm run vet:noreg`.

## 14. D388 Runtime Gate Contract

D388 starts only from the clean pushed D387 contract under a LANE-003 DRIVE recorded in the
ledger. At minimum it runs, serially and with full artifact readback:

- `node --check` on every new/touched JS/MJS file, including preparse of any cooked browser
  SETUP/DOM strings (the S-03 amendment-8 law);
- `node tools/build.mjs`;
- `node tools/validate-data-schemas.mjs`;
- `node tools/probe-battle-build-research.mjs`;
- `node tools/probe-elkhorn-tavern-plan.mjs` (implementation-present branch);
- `node tools/probe-elkhorn-tavern.mjs` (two-phase runtime guard: registry/menu/launch, per-phase
  objective/role/fog assertions, the supply-position teeth, the 8-seed four-guard direction
  battery, rank walls, the D74 scan, the executable Leetown absence guard, Classic separation,
  0 pageerrors);
- `node tools/probe-tactical-roster.mjs`;
- `node tools/probe-custom-battle-builder.mjs`;
- `node tools/probe-loot-survival.mjs`;
- `node tools/probe-flags.mjs`;
- `node tools/probe-weather.mjs`;
- `node tools/probe-intel-uhd617-profile.mjs`;
- `node tools/probe-media-budget.mjs`;
- `node tools/vet-no-regression.mjs --list`;
- 1-3 directly adjacent current battle probes selected from the final diff (Fort Donelson and
  Shiloh are the natural menu neighbors);
- the registry-removal bind AND the Curtis-rank bind, each proving exactly its predeclared teeth
  red with byte-identical (md5-proven) restores;
- honest A/B per section 7 if any simulation input moves after the first battery;
- `git diff --check`.

After playable Elkhorn Tavern is green, the full serialized `npm run vet:noreg` release battery
(owed since the D384 residual and the D386 pin edits) should run at the next checkpoint, ALONE on
the machine.

## 15. D387 Completion Criteria

D387 is green when this spec and `tools/probe-elkhorn-tavern-plan.mjs` pass 14/14; the Curtis
rank bind makes exactly one step red and restores byte-identically; every required focused
artifact is read; the 20/50/1281/20/125 baselines and generated HTML md5
`a9b42b69c1c735b81fff7c9c878c1bc0` remain exact; the trans-Mississippi packet carries the D387
spec-time addendum; canonical docs record the two-phase shape, the ammunition law, the Leetown
absence guard, and the D388 runtime boundary; the final D387 commit is pushed; and no Elkhorn
Tavern runtime surface has started.

## 16. D460 Addendum — the D455 Cherokee-fielding unlock (LANE-013 P2, 2026-07-18)

Aaron's D455 popup-locked decision (§3 row 7: "field 1st/2nd Cherokee Mounted Rifles,
two-source law; teaching cards 8-10 mandatory") AMENDS the D359 carve-out this spec's §
"Dignity boundaries (executable)" recorded. The original text above is preserved verbatim as
the historical record; this addendum is the controlling law for the fielding.

**What the evidence supports (gather + default-refute pass, 2026-07-18):** both Cherokee
regiments verifiably fought at LEETOWN on March 7 — off this build's deliberately non-Leetown
axis — where Pike's own OR report (Ser. 1 Vol. 8 pp. 287-292) has Watie's regiment on foot and
Drew's mounted charging the battery, with Drew's "about 500 strong." On March 8, only Watie's
2nd Cherokee Mounted Rifles has combat-presence support on this field: the point of Big
Mountain, driven off by Asboth's regiments before the decisive assault (the Shea & Hess
scholarly family, with 1889 Goodspeed directional support that the regiment remained an
organized force through March 8, and one uncited modern dissent recorded). Every account
agrees Drew's 1st CMR saw NO combat on March 8 (the three accounts diverge only on its
non-combat station: train guard, retreat toward Bentonville, or dispersal).

**The fielding law:**
1. Phase 1 (March 7, the Elkhorn axis) fields NO Native formation — fielding them there would
   relocate a Leetown action onto the wrong field.
2. Phase 2 (March 8) fields EXACTLY ONE Native formation: `cs_et_watie_2cmr`, "Watie's 2nd
   Cherokee Mounted Rifles - Point of Big Mountain", commander exactly `Col. Stand Watie`
   (the 1864 brigadier is a backdate trap), weapon-poor (`smooth`), 350 men as an Inferred
   share of Pike's ~900-1,000 brigade after Drew's two-source ~500, position at the Big
   Mountain shoulder. Its note carries the two placement families (Shea & Hess + Goodspeed),
   the numbering law (the regiment was the SECOND at Pea Ridge; "1st" only from December
   1862), and the Inferred placement/strength disclosures.
3. Drew's 1st Cherokee Mounted Rifles is NEVER a combat marker on this build — a combat
   placement would fabricate what the record refutes, violating the same two-source law the
   D455 lock invokes. The regiment enters the battle data at its sourced non-combat station:
   the phase-2 transition record names it (Lt. Col. William P. Ross; ~500 by Pike's report)
   standing with the supply train, with the divergent-accounts disclosure. The tension between
   the lock's plain "field both" reading and the refuted placement is surfaced to Aaron in the
   session report; a future Leetown-sector build (its own lane) is the path to fielding
   Drew's regiment honestly.
4. Teaching cards 8-10 (`et_leetown_other_field`, `et_native_agency`,
   `et_scalping_weaponized`) remain MANDATORY and byte-identical to the D388 corpus
   (probe-pinned: parsed-JSON md5 `4abd77c94ede36077976054fba3f3cfe`).
5. Direction guards are UNTOUCHED (Pea Ridge inverts winner-bleeds-less; the 8-seed
   direction battery still requires P1 CS seizes / P2 US seizes / aggregate US / aggregate
   CS-losses-exceed-US at >=5/8).

**Teeth (both probes, re-pinned with documented D460 chains in the same commit as the data):**
the runtime probe's LEETOWN SCOPE + D460 CHEROKEE FIELDING check (registry absence kept;
phase-1 Native absence; the exact one-unit phase-2 fielding with the two-source note tooth;
Drew never-a-marker; the cards-8-10 pin) and the plan probe's LEETOWN ABSENCE GUARD
(re-scoped the same way). Army Register pins move 1614 -> 1617 tree-wide (one unique
side-unit id x 3 slots) with the documented chain at every pin site.
