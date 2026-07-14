# Wilderness Battle-Build Spec (D392)

**Status:** D392 planning/spec plus a filesystem-first, dual-mode plan probe. This slice adds no
Wilderness runtime data, scenario registry entry, menu button, schema row, Army Register row,
generated-game behavior, combat input, or baseline-count movement.

**Task shape:** build the tenth LANE-003 planning contract from
`docs/design/battle-build-research/1864-65-attrition-battle-build-research.md` (`READY_FOR_SPEC`,
ratified by the D327 adversarial pass) plus this session's 7-agent research workflow (4
Sonnet/medium gather packets → 2 Opus/high default-refute verifiers, 82 verdicts → 1 Opus/high
completeness critic, 0 agent errors; the yield is committed as the packet's §13 D392 addendum;
Fable adjudication owns every claim below). The selection follows DECISIONS D382's ratified 3.5
extension order (Wilderness · Spotsylvania's Mule Shoe · a Petersburg trench treatment):
Spotsylvania is discharged (D390 → D391), and the Wilderness is the next Aaron-named lane the
packet supports — ranked Med-High with a designed-lean requirement, ahead of every Petersburg
treatment (Crater Med with its own dignity handling; initial assaults Med "redundant"; the
April 2 breakthrough Med-Low and un-researched; the siege Low, teaching-only). Cold Harbor
ranks High in the packet but is NOT named in D382's 3.5 lock — that gap is surfaced for Aaron
in D392, not self-resolved. The playable unit is the two-day collision of May 5-6, 1864 in the
Wilderness of Spotsylvania — Lee striking Grant's army mid-march in seventy square miles of
second-growth thicket, the fight freezing onto the Brock Road / Orange Plank Road junction, and
Grant marching SOUTH on the night of May 7 anyway. **Cold Harbor, Petersburg, and the Crater
remain outside this scenario** — each is its own packet lane with its own dignity handling.

## 1. Scope And Planning Boundary

**Battle:** the Wilderness, Spotsylvania and Orange Counties, Virginia — **May 5-7, 1864**, a
standalone SINGLE PHASE at the battle's grain (the two-day arc carried through timed
reinforcements; May 7 saw no major infantry battle and enters as the turn-south teaching).

**Tactical id and future file:** `wilderness` in `data/wilderness.json` (the single-word
shiloh/franklin filename convention).

**Player-facing title:** `The Wilderness`.

**Playable shape:** a standalone single-objective scenario (the Franklin / Five Forks /
Spotsylvania shipped pattern — no `phases[]` block, no T8 routing, no new engine capability, so
no D92 phase-weight audit is owed).

- **THE AXIS-SCOPE LAW:** the standalone models the **ORANGE PLANK ROAD AXIS** — the fight for
  the Brock Road / Orange Plank Road junction (Getty, then Hancock's II Corps, then Wadsworth's
  division against A. P. Hill's Third Corps, then Longstreet's First Corps and the
  railroad-grade flank column). The Orange Turnpike / Saunders Field axis (Warren and Sedgwick
  against Ewell, about 2.5 miles north) and Gordon's dusk flank attack on the Union right are
  TAUGHT in cards, never fielded — the two axes fought largely independent battles and the
  junction axis carries the decision, the objective, and the honest single-map grain. No
  Ewell/Warren/Sedgwick-axis OOB row may appear in the runtime data.
- **Roles:** `attacker:"CS"` / `defender:"US"`. Lee chose to strike the Union army mid-march in
  the thickets; Hill's May 5 objective up the Plank Road was the junction itself, and the May 6
  afternoon assault targeted exactly that line. This is a deliberate, logged deviation from the
  packet's §2 CAMPAIGN phase-1 recipe (US attacker "clears the crossroads") — that recipe
  remains valid for a future Overland T8 build; the standalone models the sourced defensive
  invariant (the packet §13 addendum records the adjudication).
- **Objective:** the **Brock Road / Orange Plank Road junction** — the Union army's road south.
  The Confederates never captured it: cavalry screen, then Getty's division (dispatched 10:30
  a.m. May 5), then Hancock's II Corps held it from May 5 through the May 7 night departure;
  the 4:15-5:00 p.m. May 6 assault briefly planted flags on the works and was retaken within
  about an hour. The objective anchor sits ON the junction and its Brock Road works line.
- **Date/grain law:** one phase, one continuous fight. The sourced clock anchors (Getty's
  10:30 a.m. dispatch; Hancock building from about 3:00-4:15 p.m. May 5; the 5:00 a.m. May 6
  dawn assault; Longstreet's 6:00-7:00 a.m. arrival; the ~11:00 a.m. flank attack; the
  4:15-5:00 p.m. works assault) live inside the single phase as timing/reinforcement INPUTS.
- **Fog:** top-level `defaultFog:false`. The battlefield blindness was dense second-growth
  VEGETATION plus gunpowder and brush-fire SMOKE — no fetched source describes literal weather
  fog on May 5-6 — and it neutralized the numerically superior side's artillery/cavalry edge,
  the OPPOSITE of the engine's fog model, which aids the DEFENDER (the D90/D326 grain lesson).
  The blindness ships per THE THICKET LAW (section 5); the smoke and thickets are cards and
  cover terrain, never a fog buff.
- **Menu rank:** `wilderness:67`, between `chattanooga:65` and `spotsylvania:68` — campaign
  chronology (Chattanooga November 1863 → the Wilderness May 5-7 → Spotsylvania May 12). Rank
  66 stays free for a possible future late-1863 lane (Mine Run). No existing rank moves, but
  FOUR shipped adjacency teeth and TWO shipped scope scans must be reshaped in the runtime
  commit (section 11 — the D391 insertion lesson).
- **Weather:** dry spring air, teaching the smoke and the fires; no literal fog, no rain. The
  weather hint ships `Inferred` (no fetched source gives a weather report; the frozen Classic
  row's `wx:"clear"` is a separate layer and is never cited as a source).
- **No battle-named branch or special combat mechanic:** no Wilderness-specific code path, no
  fire-spread mechanic, no visibility/blindness system, no scripted flank event, no
  friendly-fire event. The scenario is data on the existing universal engine.
- **Terminal boundary:** D392 stops before `data/wilderness.json`, T1/T10 registration, any
  focused runtime probe, any count movement, any generated-game behavior change, and the full
  release battery.

## 2. Research Basis And Source Register

This contract uses the committed 1864-65 attrition packet (its §13 D392 addendum records this
pass's corrections) plus the 7-agent gather→default-refute→critic workflow. No claim is promoted
beyond its evidence. A URL's presence does not turn a thin or disputed claim into a Verified
claim.

**The single-scholar disclosure (the Rhea root, again):** the modern tactical narrative of the
Wilderness leans on Gordon Rhea's *The Battle of the Wilderness May 5-6, 1864* — the NPS and
ABT narratives track it, and the identical Wikipedia/Encyclopedia Virginia casualty tables
descend from one official-returns/CWSAC compilation. Where this register says "Verified," it
means at least two genuinely independent source FAMILIES support the exact claim with those
collapses named; where every path leads to one root, the claim ships `Inferred` with the root
named (the Elkhorn Shea-root / Spotsylvania Rhea-root precedent).

| Source | Contract use | Confidence |
|---|---|---|
| [ABT Wilderness battle page](https://www.battlefields.org/learn/civil-war/battles/wilderness) | Engaged-scope strengths (101,895 / 61,025, labeled "engaged"); "Inconclusive"; CS casualties ~13,000 (the high figure); the two-axis frame | Verified, fetched — its packet-era "around midday" phrasing did NOT reproduce and is retired |
| [Wikipedia — Battle of the Wilderness](https://en.wikipedia.org/wiki/Battle_of_the_Wilderness) | The chronology spine (Getty 10:30 a.m.; 5:00 a.m. dawn assault; Sorrel's ~11:00 a.m. flank; the 12th Virginia friendly fire; Gordon's dusk attack; "Inconclusive"); 118,700 + 316 guns campaign-start; 66,140 incl. staff/artillery; 17,666 / 11,033; the fire threatening the breastworks | Verified, fetched (Rhea root disclosed above) |
| [Encyclopedia Virginia — the Wilderness](https://encyclopediavirginia.org/entries/wilderness-battle-of-the/) | The independent-voice frame (CS tactical success → US strategic victory); 118,000 / 65,000; 17,666 / 11,125; the ~7 o'clock Texans; "Lee to the rear!"; the ~8 p.m. May 7 march and the cheering; Longstreet's "right arm and neck" | Verified, fetched — LIVE at THIS slug; the packet-era `/entries/battle-of-the-wilderness/` slug 404s |
| [NPS "Grant at the Wilderness"](https://www.nps.gov/articles/000/grant-at-the-wilderness.htm) | ~120,000 over four corps; ~62,000 CS; ~18,000 Union losses; ~8,000 CS losses (the low figure); the terse tent-story voice | Verified, fetched |
| [NPS/FRSP blog — the fires](https://npsfrsp.wordpress.com/2014/05/03/capturing-the-wildernesss-signature-horror-fire/) | McParlin's primary medical estimate: ~200 wounded burned or suffocated, nearly 10% of Union deaths; the multi-day fire timeline (May 5 Saunders Field; May 6-7 Orange Plank Road); the Waud engraving | Verified, fetched (single page carrying a primary medical report) |
| [NPS/FRSP blog — USCT on the eve of the Overland Campaign](https://npsfrsp.wordpress.com/2012/02/13/a-rare-photograph-of-uscts-on-the-eve-of-the-overland-campaign/) | Ferrero's 4th Division guarding trains; no directed USCT combat at the Wilderness | Fetched, single family — the thread ships `Inferred` |
| [civilwarintheeast.com AotP/ANV May-64 mirrors](https://civilwarintheeast.com/us-army-may-64/aop-may-64/2-corps-aop-may-64/) | The OR-mirror OOB voice (II Corps divisions; "Stevenson (to 5/10)"; the ANV corps rosters) — never counted as the second family; its "MG Gibbon" is a documented anachronism (section 6) | Fetched; OR-mirror voice only |
| [Wikipedia Union OOB](https://en.wikipedia.org/wiki/Battle_of_the_Wilderness_order_of_battle:_Union) + biography cluster (Kershaw, Gibbon, Gordon, A. P. Hill, Longstreet, Jenkins, J. M. Jones, Stafford, Wadsworth, Hays, Getty, Sedgwick) | The battle-date rank wall of section 6, each entry carrying its own adjudicated confidence | Fetched; per-claim confidence in section 6 |
| [NARA — Grant's lieutenant general nomination](https://www.archives.gov/legislative/features/grant) | The D390-fetched Grant rank anchor stands: the act signed February 29, 1864; Senate confirmation March 2, 1864; General-in-Chief a role, not a rank | Verified, fetched (D390) |
| [Emerging Civil War — where Grant turned south](https://emergingcivilwar.com/2019/05/03/ecw-weekender-where-grant-turned-south/) | Corroborates the May 7 cheering ("The cheering was so lusty...") — the packet-era Ed Bearss "most important intersection" quote is NOT on this page and is DROPPED | Verified for the cheering only, fetched |
| [HistoryNet — "This place is called the Wilderness"](https://historynet.com/this-place-is-called-the-wilderness/) | The 1863 Chancellorsville-skeletons detail (soldiers marching past the previous year's unburied dead) | Fetched, single family — ships `Inferred`, restrained |
| Gordon C. Rhea, *The Battle of the Wilderness May 5-6, 1864* (LSU Press, 1994) | The controlling monograph behind the NPS/ABT narratives; named on every claim whose corroboration collapses to it | The scholarly anchor — cited by name, not by URL |

**Two-source rule:** every future runtime teaching card and codex claim stamped `Verified`
requires at least two genuinely independent source families supporting that exact claim, with
the Rhea-root and official-returns collapses applied honestly. One family = `Inferred`; a real
conflict = `Disputed` with both values shown. The runtime slice may amend this register with a
second family before upgrading provenance; it may not silently promote a claim in runtime data.
**The highest-leverage upgrade path: a page-cited Rhea (1994) fetch — the single pass that
would lift the Plank Road clock anchors, the flank-column composition, and the Texas Brigade
loss figure from `Inferred` toward `Verified`.**

**Citation-integrity corrections this pass (baked in, per-fact):** the ABT "around midday"
Saunders Field time is NOT on the fetched page (the two-family time is about 1:00 p.m.); the
Texas Brigade "250 of 800" figure is NOT on the fetched ABT page and ships `Inferred`; the Ed
Bearss "most important intersection" quote is NOT on the fetched ECW page and is dropped; the
IX Corps independence claim is NOT on the cited civilwarintheeast page and is re-cited to
Wikipedia + NPS; the packet-era Encyclopedia Virginia slug 404s and the register carries the
live one; the NPS `frsp/learn/historyculture/the-battle-of-the-wilderness.htm` URL is a genuine
404 and is retired.

## 3. Strength And OOB Contract

Use engaged forces at the objective axis, never army-present or whole-battle figures sold as
committed totals.

- **Whole-battle frame (context only, never axis totals — every figure with its scope named):**
  Union present 118,000-120,000 (EV 118,000 / Wikipedia 118,700 + 316 guns at campaign start /
  NPS 120,000 over four corps) while ABT's 101,895 is labeled "engaged" — different scopes, all
  shipped `Disputed` as a cluster, never one number. CS: 61,025 engaged (ABT) / 62,000 (NPS) /
  65,000 (EV) / 66,140 including staff and artillery (Wikipedia, single-root). Whole-battle
  casualties belong to section 7's direction law, never to any unit row.
- **Sourced sub-figures with scopes:** II Corps 28,333 present-for-duty April 30, 1864
  (single-family, `Inferred`); Hill's Third Corps ~22,675 + 1,910 artillery (single-source
  Wikipedia, `Inferred`); Longstreet's First Corps fields TWO divisions only (Kershaw, Field —
  Pickett detached); IX Corps totals roughly 19,000-20,000 and its "~6,000 veterans" figure is
  a veteran SUBSET that must never ship as a corps total. **No source pins committed axis
  totals or division-engaged strengths — every committed split ships as an Inferred envelope.**
- **Committed-total envelopes (engine abstractions, all `Inferred`):** the runtime slice
  authors inside these envelopes and the plan probe enforces them once data exists:
  - **US committed 15,000-30,000** on the junction axis — Getty's opening stand small
    (4,000-9,000 with the cavalry-screen abstraction), Hancock's II Corps divisions and
    Wadsworth's V Corps division entering as timed reinforcements building to the mass that
    made the dawn assault.
  - **CS committed 12,000-26,000** — the opening Third Corps thrust (Heth and Wilcox,
    8,000-16,000), then Longstreet's relief (Kershaw and Field) and the railroad-grade flank
    grouping (three brigades, Mahone senior) as timed arrivals per section 5's timing inputs.
- **Named formations the OOB may field with `Verified identity; Inferred strength`:** US —
  Getty's VI Corps division (the junction stand); Birney's, Mott's, Barlow's, and Gibbon's II
  Corps divisions; Wadsworth's V Corps division (joining the Plank Road fight May 6; mortally
  wounded there); Hays's brigade (Birney's division — killed May 5); Carroll's brigade (the
  works-retaking counterattack); Hammond's cavalry screen (500 troopers with Spencers,
  single-family, may ship as a note or a small opening marker). CS — Heth's and Wilcox's
  divisions (Third Corps); Kershaw's and Field's divisions (First Corps); Gregg's Texas
  Brigade (Field's vanguard at the Widow Tapp field); the Sorrel flank grouping (Mahone
  senior); Poague's artillery battalion (the Widow Tapp guns). **Turnpike-axis formations
  (Ewell's corps, Warren's and Sedgwick's corps, Gordon's brigade) are teaching content only
  under THE AXIS-SCOPE LAW.**
- **Every lower split ships coarse:** brigade strengths, crew counts, experience, formation,
  readiness, reinforcement seconds, and exact sector placements remain coarse and `Inferred`
  unless a register source pins them.
- **Captures are outputs, never inputs:** the 3,383 Union captured/missing (including the dusk
  captures of Seymour and Shaler on the OTHER axis) are teaching content; no prisoner count,
  capture rate, or surrender figure is ever an engine input or a probe tooth.

## 4. Terrain And Works Contract

The future map must carry these landmarks as terrain, objective, marker, road, or teaching
context. Coordinates and geometry remain Inferred abstractions.

- **The Brock Road / Orange Plank Road junction** — the objective; the Union army's road
  south, and the ground the whole axis fought for.
- **The Brock Road works** — the log breastworks and earthworks the II Corps built along the
  Brock Road line; the defender's works are built from the universal breastwork/entrenchment
  cover vocabulary the engine already owns. The May 6 fire that reached a stretch of the works
  is a card, never a mechanic.
- **The Orange Plank Road** — the CS axis of advance; Hill's approach and Longstreet's
  counterattack corridor.
- **The Widow Tapp field** — the one artillery clearing on the axis (Poague's guns; the
  Lee-to-the-rear ground); a CS-side clearing landmark.
- **The unfinished railroad grade** — the concealed corridor south of the Plank Road that
  carried Sorrel's flank column; the flank grouping's entry vector, encoded as an entry
  position/timing input, never a flank bonus.
- **The Chewning farm plateau** — the high ground between the axes (context/teaching landmark).
- **Wilderness Tavern** — the Union staging ground behind the right (context landmark; Getty
  was dispatched from here).
- **The dense second-growth thickets** — the defining terrain: seventy square miles of tangled
  undergrowth where a distinct line could not be preserved. The woods blanket the map as
  symmetric universal cover per THE THICKET LAW (section 5).
- **Saunders Field** — the Turnpike axis's one clearing: a TEACHING landmark only under THE
  AXIS-SCOPE LAW (never fielded ground in this scenario).

The thickets and clearings provide ordinary universal cover/open classes. No terrain element
writes casualties, morale, rout, score, or winner.

## 5. The Thicket Law

The Wilderness's blindness has an accurate-input encoding, and this scenario ships it ONLY
through levers the engine already owns:

1. **The sourced fact (Verified, multi-family):** the dense second-growth and the powder and
   brush-fire smoke — not weather fog — blinded both armies, broke formations, and neutralized
   the Union's artillery, cavalry, and numbers advantage; artillery could barely deploy off
   the roads and clearings.
2. **The engine-native encoding:** (a) dense-woods universal COVER terrain blankets the map
   symmetrically, with open ground only at the sourced clearings (the Widow Tapp field, the
   junction ground); (b) honestly LOW deployed-gun counts on both sides under the universal
   gun-count model — Poague's battalion at the Widow Tapp field is the CS exception (count
   `Inferred`), and the US fields only the few guns the junction clearings could seat; (c)
   top-level `defaultFog:false`, because the engine's fog model aids the defender and the
   historical blindness did not.
3. **FORBIDDEN encodings:** any fog-as-blindness buff; a visibility/blindness/smoke
   multiplier; an artillery-suppression key; a battle-named terrain mechanic; scripting the
   flank attacks or the near-collapse as events. The blind-battle texture must emerge from
   cover geometry, low gun counts, timing, and mass.
4. **The teaching card carries the law:** "the thickets fought both armies" ships as a card
   (section 9), so the player learns why the Union's two-to-one weight could not land in this
   ground — and why Lee chose to fight here at all.

## 6. Battle-Date Ranks And Command Traps

The future runtime probe searches leaders, unit commanders, notes, brief/end text, teaching
cards, and codex content. Rank checks are scenario-scoped. May 1864 sits on live promotion
seams, and the Wilderness adds the REVERSE traps: officers who die or rise days later, at
Spotsylvania, must be alive and at their Wilderness-date grade HERE.

**Union:**

- **Lt. Gen. Ulysses S. Grant** — General-in-Chief (a ROLE, not a rank; he commands through
  Meade and travels with the Army of the Potomac). The grade was revived by the act Lincoln
  signed February 29, 1864; the Senate confirmed March 2, 1864 (NARA, fetched at D390). He is
  NEVER a full "General" — that grade waited for July 1866.
- **Maj. Gen. George G. Meade** — commanding the Army of the Potomac under Grant's direct
  supervision. Never the theater commander; never promoted.
- **Maj. Gen. Winfield S. Hancock** — II Corps, commanding the junction defense from the
  evening of May 5 (grade since November 1862).
- **Maj. Gen. John Sedgwick — THE REVERSE DEAD-OFFICER GUARD:** ALIVE and commanding VI Corps
  throughout this battle; killed May 9, 1864 at Spotsylvania, three days AFTER it. His death
  belongs to the Spotsylvania scenario's teaching; here he is a living Turnpike-axis context
  figure (never fielded on the junction axis under THE AXIS-SCOPE LAW), and no card may date
  his death inside May 5-7.
- **Maj. Gen. Gouverneur K. Warren** — V Corps (Turnpike axis; teaching context only).
- **Maj. Gen. Ambrose E. Burnside** — IX Corps, an INDEPENDENT command reporting directly to
  Grant (Burnside outranked Meade by commission date); the incorporation into the Army of the
  Potomac ships `Disputed` (May 24 per this pass's Wikipedia fetch vs the D390 addendum's May
  25) and is never load-bearing — at THIS battle the corps is independent, and the claim is
  re-cited to Wikipedia + NPS (the fetched civilwarintheeast page does not carry it). His May 6
  role between the axes is teaching context; fielding IX Corps is optional and NOT required by
  this contract. If any IX Corps element is named, its 1st Division commander is **Brig. Gen.
  Thomas G. Stevenson** (killed May 10 — the "Stevenson (to 5/10)" line; Crittenden is his
  SUCCESSOR, never the Wilderness-date commander).
- **Brig. Gen. George W. Getty** — commanding the VI Corps division that held the junction
  ahead of Hill (dispatched 10:30 a.m. May 5); WOUNDED May 6. The junction stand is his unit's
  identity anchor.
- **Brig. Gen. John Gibbon — THE ANACHRONISM CATCH:** commanding his II Corps division as a
  BRIGADIER GENERAL; his major-general-of-volunteers promotion is dated **June 7, 1864 — AFTER
  this battle** (the fetched civilwarintheeast "MG" is the backdated-grade error class,
  documented in the packet §13 addendum). Never `Maj. Gen. Gibbon` at the Wilderness.
- **Maj. Gen. David B. Birney** and **Brig. Gens. Francis C. Barlow and Gershom Mott** — the
  other II Corps division grades (Mott took his division May 2).
- **Brig. Gen. James S. Wadsworth — MORTALLY WOUNDED May 6** in the flank attack, died May 8
  in Confederate hands. Never rendered as surviving the battle; his V Corps division fights on
  the junction axis and his fall is its leader-fate input and a card.
- **Brig. Gen. Alexander Hays — KILLED May 5** leading his brigade of Birney's division near
  the junction. Never alive after May 5.
- **Brig. Gen. Horatio G. Wright — THE FORWARD-REFERENCE TRAP:** at the Wilderness he commands
  the FIRST DIVISION of VI Corps (Turnpike axis, teaching context); VI Corps command comes only
  with Sedgwick's death on May 9. Never "commanding VI Corps" here.
- **Brig. Gens. Truman Seymour and Alexander Shaler — CAPTURED May 6 evening** by Gordon's
  flank attack on the OTHER axis; teaching content only under THE AXIS-SCOPE LAW.
- **Maj. Gen. Philip H. Sheridan** — Cavalry Corps, largely off-field (Todd's Tavern is
  context); Hammond's screen at the junction is the sourced cavalry element.
- **Col. Samuel S. Carroll** — the brigade that retook the breached Brock Road works
  (wounded); colonel, never a general officer here.

**Confederate:**

- **Gen. Robert E. Lee** — full General, Army of Northern Virginia. The Lee-to-the-rear
  episode at the Widow Tapp field ships as a card only with its sourced form (two site
  families, ONE participant-memoir root — the exact wording ships `Inferred`).
- **Lt. Gen. Richard S. Ewell** — Second Corps, the Turnpike axis (teaching context only under
  THE AXIS-SCOPE LAW).
- **Lt. Gen. Ambrose Powell Hill — THE REVERSE ILLNESS TRAP, resolved:** PRESENT and
  commanding the Third Corps through May 5-6 — his incapacitating illness dates to about May 8,
  at Spotsylvania. **Never render Early commanding the Third Corps at the Wilderness** (that is
  the Spotsylvania arrangement); at this battle Early is a Maj. Gen. DIVISION commander under
  Ewell on the other axis.
- **Lt. Gen. James Longstreet — PRESENT, THEN WOUNDED:** First Corps, arriving about 6:00-7:00
  a.m. May 6 and wounded by his own troops about noon near the Jackson-Chancellorsville ground
  (Wikipedia names the 12th Virginia; EV renders the wound "right arm and neck"; the exact
  regiment attribution is single-source and ships `Inferred`). He hands the corps to Field
  with "Press the enemy." His wounding is his leader-fate input and a card, never a scripted
  event. R. H. Anderson's First Corps succession comes AFTER this battle (the exact day is
  single-source, `Inferred`) — Anderson at the Wilderness is a Third Corps DIVISION commander
  and, if named at all, is context, not a fielded aura.
- **Brig. Gen. Joseph B. Kershaw — THE SAME-CLASS TRAP, this battle's bind anchor:**
  commanding McLaws's old division of the First Corps as a BRIGADIER GENERAL; his
  major-general date of rank is **June 2, 1864 — AFTER this battle** (two-family: the
  Wikipedia biography and the OOB voice). Never `Maj. Gen. Kershaw` at the Wilderness.
- **Maj. Gen. Charles W. Field** — commanding Hood's old division (major general since
  February 1864); takes First Corps direction at Longstreet's fall with "Press the enemy."
- **Brig. Gen. John B. Gordon — THE OTHER-AXIS TRAP:** a BRIGADIER commanding a BRIGADE of
  Early's division on the Turnpike axis; his division command dates May 8 and his
  major-generalcy May 14. His dusk flank attack (capturing Seymour and Shaler) is a card only;
  he is never fielded on the junction axis and never rendered above brigadier here.
- **Brig. Gen. Micah Jenkins — KILLED May 6** in the same friendly-fire volley that wounded
  Longstreet. Never alive after May 6.
- **Brig. Gen. William Mahone** — senior brigade commander of the Sorrel flank grouping (Lt.
  Col. G. Moxley Sorrel, Longstreet's staff officer, guided the column — a staff officer,
  never a general officer here).
- **Turnpike-axis fates (teaching cards only under THE AXIS-SCOPE LAW):** Brig. Gen. John M.
  Jones KILLED May 5 on the Orange Turnpike (the "Saunders Field" placement by name is
  `Inferred`); Brig. Gen. Leroy Stafford MORTALLY WOUNDED May 5, died May 8. Both are dead or
  dying before Spotsylvania — the D390 wall already guards their May 12 absence.
- **Promotion-paperwork dates are disclosure-only:** Kershaw's June 2 date, Gibbon's June 7
  date, Gordon's May 8/May 14 dates, and the Burnside incorporation date are paperwork facts;
  battle-date GRADES are the probe-pinned law, and no teaching card states a disputed
  paperwork date as settled fact.

Command loss enters the model ONLY as accurate inputs: Longstreet's wounding, Wadsworth's and
Hays's falls, and Jenkins's death are ordinary leader-fate inputs and teaching cards, never
scripted events.

## 7. Junction-Hold Direction Law And Honest A/B

The runtime slice runs exactly eight shared-model deterministic seeds in one serialized focused
process. The direction law, derived from sources and from both refute passes' explicit
recommendations:

1. **THE JUNCTION GUARD — the defender ultimately holds:** in at least **5/8** seeds the US
   retains the Brock Road / Orange Plank Road junction objective. Sourced as the load-bearing
   invariant: every fetched family agrees the Union held the junction continuously from May 5
   through the May 7 departure; the Confederates briefly planted flags on the works on the
   afternoon of May 6 and were thrown out within about an hour. A Confederate seize-and-hold
   is the honest alt-history minority spread, never the lean.
2. **THE AGGREGATE CASUALTY-DIRECTION TOOTH (this battle's honest split — unlike
   Spotsylvania):** in at least **5/8** seeds total US losses EXCEED total CS losses —
   DIRECTION only, never a magnitude, ratio, or per-side count. The direction survives the
   widest honest fetched pairing (US ~17,666-18,000 Verified against even ABT's high CS
   ~13,000 leaves a ~4,000 gap; the CS magnitude itself ships as the Disputed ~8,000-13,000
   range). This is the anti-winner-bleeds-less class: the side that held the field's key
   ground bled more, and advanced anyway — the accounting IS the attrition teaching.
3. **The near-run reversals are EMERGENT requirements, not teeth:** the scenario must be
   authored so the accurate inputs (the small opening stand, the massed II Corps arrivals, the
   timed First Corps relief, the flank grouping's entry vector) make both the Union dawn
   near-collapse of the CS attack and the CS flank recovery natural textures across seeds —
   but no probe asserts a timing, a breakthrough moment, or a flank event.
4. **No forced winner:** the engine's existing result/DRAW grain applies. A hold-majority with
   occasional CS seizures or draws is the honest spread for a genuinely bistable battle;
   nothing writes the result.

**Forbidden guards:** any casualty magnitude, ratio, split, or per-side count tooth; any
prisoner, capture, gun-loss, surrender, or rout tooth; any timing tooth on the dawn assault,
the flank attack, or the works breach.

If the runtime slice changes any simulation input after the first eight-seed battery,
`DECISIONS.md` logs the old value, new value, and both observed guard counts for every
iteration. Eligible inputs are committed strengths inside the section 3 envelopes, coarse OOB
splits, universal gun counts (THE THICKET LAW's honestly-low deployments), ordinary leader
quality/aura inputs, terrain/cover/works geometry, formation, experience/readiness,
reinforcement timing (the sourced two-day clock anchors), entry positions (the railroad-grade
vector), objective radius, and universal time/hold thresholds. No result-derived multiplier or
scripted verdict is eligible. If the two guards cannot BOTH be reached from enumerated honest
inputs, that is a HALT-and-surface per the standing law — never a fudge, never a weakened
tooth.

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
`panicMult`, `collapseMult`, `meleeMult`, `handToHandBonus`, `prisonerMult`, `captureBonus`,
`woodsMult`, `blindnessMult`, `visibilityPenalty`, `smokeMult`, `brushFireMult`, `fireDamage`,
`flankBonus`, `flankMult`, `rollUpMult`, `friendlyFireEvent`, `confusionMult`.

Named temptations, all forbidden: a fog or visibility buff standing in for the thickets
instead of THE THICKET LAW's cover-and-gun-count inputs; gamifying the brush fires as a
damage, spread, or morale mechanic (section 9's dignity law); a flank/roll-up bonus for the
railroad-grade or dusk attacks instead of entry positions and timing; scripting Longstreet's
friendly-fire wounding or Jenkins's death as an event; a capture bonus or prisoner counter for
Seymour and Shaler; modeling Grant's resolve or Lee's audacity as a result-writer; any source
branch that checks `wilderness` and writes combat output; hardcoding ANY casualty magnitude
anywhere.

The result must emerge from committed strength, cover geometry, honestly-low gun counts,
reinforcement timing and entry vectors, formation, experience/readiness, universal command
aura, and the objective/time model.

## 9. Teaching, Dignity, And Memory Contract

The runtime slice requires at least eight restrained teaching cards plus one codex entry.
Every claim obeys the two-source/provenance rule with the Rhea-root and official-returns
collapses disclosed (section 2); sourced quote text is rendered exactly; disputed counts show
both values. **Human cost is rendered with gravity and without glory framing.**

1. **The thickets fought both armies.** Seventy square miles of second-growth where a line
   could not be preserved; why Lee chose this ground — it neutralized the Union's two-to-one
   weight, its artillery, and its cavalry. The blindness was vegetation and powder smoke, not
   weather fog. THE THICKET LAW's engine encoding IS this card (section 5).
2. **THE BURNING-WOODS DIGNITY LAW.** The brush fires burned across both days (May 5 at
   Saunders Field; May 6-7 along the Plank Road); Surgeon McParlin's primary medical estimate
   — about 200 wounded men burned or suffocated, nearly one in ten Union deaths — anchors the
   card, with the 7th Indiana eyewitness line rendered exactly as fetched. The fires are
   taught as consequence and cost, with restraint; **they are never a mechanic, a spread
   simulation, a spectacle, or a scoring lever anywhere in this lane.**
3. **Getty's race for the crossroads.** The 10:30 a.m. dispatch, the cavalry screen, and why
   the junction was the Union army's road south — held from May 5 to the May 7 departure. The
   dropped Bearss quote stays dropped; the junction's importance is taught in the register's
   own sourced voices.
4. **The dawn assault and the Texans.** Hancock's 5:00 a.m. May 6 attack nearly collapsing
   Hill's unentrenched corps; Longstreet's column arriving through the Widow Tapp field as the
   line broke; "Lee to the rear!" taught with its memoir-root disclosure; the Texas Brigade's
   terrible price (the "250 of 800" figure ships `Inferred` — it did not reproduce on the
   fetched page).
5. **The flank attacks and the friendly fire.** Sorrel's column on the unfinished railroad
   grade rolling up the Union left ("like a wet blanket" — Hancock's own image); Wadsworth's
   mortal wounding; Longstreet shot by his own men near the ground where Jackson fell a year
   earlier, Jenkins killed beside him, "Press the enemy" passing the corps to Field; Gordon's
   dusk attack on the other axis capturing Seymour and Shaler. Contingency, not genius.
6. **Grant does not retreat.** May 7: no grand assault, and at about 8 p.m. the army marched
   SOUTH — the first advance after a bloody check in the Army of the Potomac's experience; the
   spontaneous cheering rendered in EV's fetched words with ECW's corroboration. The
   tent-breakdown story ships `Disputed` — the Rawlins-via-Wilson weeping account against
   Porter's "sleeping peacefully" — and the conflict itself is the card.
7. **The ledger of the two days.** US about 17,700-18,000 (Verified, with the 3,383
   captured/missing composition disclosed) against a CS figure the record cannot pin —
   ~8,000-13,000, returns incomplete (`Disputed`, both bounds shown). The direction is the
   teaching: the army that bled more held its road and kept walking south, against an army
   that could not replace what it lost. Grant-the-Butcher is rebutted with proportions, not
   erasure — and the Union's own errors (the exposed flanks, the piecemeal fights the
   thickets forced) stay on the card.
8. **The bones of Chancellorsville.** The armies fought over the previous May's battlefield;
   the skeletons detail ships `Inferred` (single family), restrained, as memory framing — the
   war returning to its own graves.
9. **The USCT at the Wilderness — accuracy as dignity.** Ferrero's 4th Division guarded the
   trains and crossings; no directed USCT combat occurred here (`Inferred`, single family) —
   so no USCT combat marker appears, and the card says why: their combat record in this
   campaign is written at Petersburg and New Market Heights, not invented here.
10. **What this scenario deliberately is not.** The Turnpike axis and Gordon's dusk attack are
    taught, not fielded (THE AXIS-SCOPE LAW); Cold Harbor, Petersburg, and the Crater are
    their own lanes with their own dignity handling. No massacre content is playable anywhere
    in this lane.

The codex entry uses `theater:"Eastern"`, `campaign:"Overland Campaign"`, and
`result:"Inconclusive"` (ABT and Wikipedia's shared label; EV's CS-tactical-success /
US-strategic-victory framing is taught beside it — the result LABEL ships with both framings
shown, per the refute recommendation), with the attrition-strategy teaching and the human-cost
gravity stated plainly.

## 10. Frozen Classic And Rail-Route Collision Law

One lowercase Classic layer already exists and remains untouched:

- frozen Classic `build/base.html` has exactly one
  `{id:"wilderness", name:"The Wilderness", year:1864, th:"E", atk:"US", us:102000, cs:61000, ...}`
  roster row (with `wx:"clear"` and `cmdUS:"Grant", cmdCS:"Lee"`) — its `atk:"US"` encodes the
  CAMPAIGN frame at the Classic layer and is never a source for the tactical roles of section
  1; its whole-battle strength frame and `wx` are never cited as sources;
- `data/logistics-rail.json` already carries a strategic-layer route keyed `wilderness`
  ("Orange and Alexandria corridor to the front", provenance `Inferred`) — a separate layer:
  the tactical slice must not edit, rename, or delete it, and must not add any new route;
- the strategic-layer probes (`probe-human-cost`, `probe-prisoner-exchange`,
  `probe-disease-medical`, `probe-auto-resolve`) use the CLASSIC `wilderness` id in their own
  fixtures — separate layer, untouched by the tactical slice.

The new tactical id is the single word `wilderness` and the new data filename is
`wilderness.json` (the shiloh/franklin convention: the tactical registry id and the Classic
roster id may share a name because the layers never share data). The runtime slice must
preserve the lowercase Classic `wilderness` record byte-for-byte.

## 11. Planned-Only And Future Complete-Integration Baselines

### D392 planned-only baselines (must remain exact)

- registered tactical scenarios: **22**;
- battle files / total schema files: **22 / 52**;
- Army Register: **1380**;
- explicit flags / valid weather hints / Intel opening-scene coverage / media opening scenes:
  **22 / 22 / 22 / 22**;
- no-regression suite list: **127**; sweep comment: **22** battles;
- generated HTML md5: **`91b9979144731ae3299af4ebaca4628a`**;
- frozen base md5: **`c9db83fa99230ffb95bdfdfe059f3fb9`**;
- no `data/wilderness.json`, no `tools/probe-wilderness.mjs`, no T1/T10/runtime integration,
  and no tactical Wilderness identifier in any scanned integration surface (the pre-existing
  frozen Classic row, the strategic rail route, the strategic-probe fixtures, and the
  chancellorsville terrain-teaching text are separate layers and do not count as tactical
  seams).

The D392 plan probe fails if even one tactical Wilderness runtime seam appears while the data
file is absent. Half-registration is always red.

### Future atomic integration contract (the runtime slice, D393 or the then-live number)

All surfaces arrive in one green runtime commit or the plan probe fails closed:

- `data/wilderness.json`, top-level key/id `wilderness`, single-phase per section 1 (attacker
  CS / defender US, `defaultFog:false`, objective/terrain/oob/reinforcements in the
  Franklin/Five Forks shape), committed strengths inside the section 3 envelopes, terrain per
  section 4, THE THICKET LAW inputs per section 5, ranks per section 6, teaching per section 9;
- `src/tactical/T1-bull-run.js` exact registry line
  `R.wilderness = GAME_DATA.wilderness.wilderness` and menu rank `wilderness:67` between
  `chattanooga: 65` and `spotsylvania: 68` with no other rank moved;
- tactical scenarios **22 -> 23**;
- `tools/validate-data-schemas.mjs` battle enrollment (`wilderness.json`) and total schema
  files **52 -> 53**;
- `tools/probe-tactical-roster.mjs` and `tools/probe-custom-battle-builder.mjs` historical
  baselines include `wilderness`; the roster DOM check includes `fldScnBtn_wilderness`;
  single-phase, so `PHASE_COUNTS` gains NO entry;
- Army Register **`1380 + (unique Wilderness side-unit ids × 3)`**, with every whole-registry
  pin moved and documented in the same commit — grep the OLD value `1380` across `tools/`
  (the D391 lesson found ELEVEN sites and probe-spotsylvania's own register pin makes at least
  TWELVE now); the full pin-history chain is preserved and the new
  `D###: 1380 -> N — Wilderness ...` fragment is appended in the documented-history format;
- **THE SIX NAMED RESHAPE OBLIGATIONS (the D391 insertion-lesson class, all in the same
  runtime commit, each with a documented-history comment, each proven by the binds):**
  1. `tools/probe-kennesaw.mjs` menu-order adjacency tooth (Chattanooga -> Spotsylvania ->
     Kennesaw becomes the true four-battle chronology);
  2. `tools/probe-kennesaw.mjs` DOM-button adjacency tooth (same chronology, DOM variant);
  3. `tools/probe-spotsylvania.mjs` menu-order adjacency tooth (`spotsylvania ===
     chattanooga + 1` becomes `wilderness` between them);
  4. `tools/probe-spotsylvania.mjs` DOM-button adjacency tooth (same, DOM variant);
  5. `tools/probe-spotsylvania.mjs` SCOPE tooth (the forbidden-registry-id regex drops
     `wilderness` and keeps coldharbor/cold-harbor/petersburg/crater/overlandCampaign);
  6. `tools/probe-spotsylvania.mjs` forbidden-data-file scan (the `data/` filename regex drops
     `wilderness` and keeps cold-harbor/petersburg/crater);
- `src/tactical/T10-flags.js` explicit Wilderness metadata **`E / true / anv`** (Eastern
  theater; AotP II/V/VI Corps badges legible; Hill's and Longstreet's ANV attackers use the
  Southern Cross family) and `tools/probe-flags.mjs` coverage teeth at 23;
- flags/weather/Intel/media coverage **22 -> 23**; the weather hint ships dry/clear `Inferred`
  (no fetched weather report; the smoke is cards, not weather; the frozen Classic row's
  `wx:"clear"` is a separate layer, not a source); the media largest-scene check re-audited
  against Kennesaw's 17;
- `tools/probe-wilderness.mjs` focused browser/runtime guard enrolled in
  `tools/vet-no-regression.mjs`; suite **127 -> 128** and sweep comment **22 -> 23**;
- the focused probe fields exactly eight unique deterministic seeds, the **US-holds-the-
  junction ≥5/8** guard AND the **aggregate casualty-direction US>CS ≥5/8** guard (direction
  only, never magnitude — the section 7 law), rank walls per section 6 (including the
  Kershaw/Gibbon/Gordon forbidden renderings and the Hill-present / Sedgwick-alive reverse
  traps), the D74 scan per section 8 (including the thicket/fire/flank families), THE
  AXIS-SCOPE LAW scan (no Ewell/Warren/Sedgwick-axis OOB row), Classic/rail separation per
  section 10, and 0 pageerrors, exiting nonzero on failure;
- generated `civil_war_generals.html` rebuilt only through `node tools/build.mjs`;
- frozen lowercase Classic `wilderness` row unchanged byte-for-byte; the strategic rail route
  untouched; no new rail route;
- honest A/B per section 7 if any simulation input moves after the first battery;
- no Overland multi-phase campaign, Cold Harbor, Petersburg, or Crater data or registration of
  any kind (they remain packet lanes).

## 12. Plan Probe Contract

`tools/probe-wilderness-plan.mjs` is filesystem-first, dual-mode, and fail-closed. It writes
`tools/shots/probe-wilderness-plan.json`, exits nonzero on failure, prints exactly one 12-step
summary, and reports each failed step on stderr. Because this spec is hard-wrapped, its text
anchors match on whitespace-normalized text (the D385 idiom) — the teeth still bite on any
word-level tamper.

The twelve steps, in this exact order, are:

1. `FILES + STATUS`
2. `SHAPE + ID + DATE`
3. `ROLES + OBJECTIVE`
4. `TERRAIN + WORKS`
5. `OOB + STRENGTHS`
6. `RANKS + COMMAND TRAPS`
7. `SOURCES + PROVENANCE`
8. `JUNCTION + DIRECTION LAW`
9. `D74 NO-FUDGE WALL`
10. `TEACHING + DIGNITY`
11. `FUTURE DIRECTION + INTEGRATION`
12. `LANE + BASELINES`

When the runtime data file is absent, the probe requires every D392 count/hash above and
rejects any partial tactical runtime seam. When the runtime data file is present, it requires
the complete 23/53/`1380+3U`/23/128 integration plus the single-phase shape, the
CS-attacker/US-defender roles, fog off, the envelope sums, THE THICKET LAW's zero-heavy-gun
posture, the rank walls, the teaching provenance, the focused-probe direction contract (eight
seeds, the junction-hold guard, the casualty-direction tooth), THE AXIS-SCOPE LAW, and the
Classic/rail separation. Half-registration is always red. The `LANE + BASELINES` step anchors
on durable ladder history and the role-roster owner check (any recognized TOP-LOOP tool),
never the current lock holder (the D381 relay lesson).

## 13. D392 Negative Bind And Focused Gate

After the clean plan probe passes:

1. record md5 for this spec, the plan probe, the generated HTML, and the frozen base;
2. change only the section 6 Kershaw rank-lock line — the bulleted lock whose bolded head
   names Kershaw with his brigadier grade — to a firm major-general battle-date rendering (a
   one-token patch);
3. run `node tools/probe-wilderness-plan.mjs` and require exit 1 with exactly
   `RANKS + COMMAND TRAPS` red (11/12 green);
4. restore the line byte-identically with the file-edit tool (never a broad checkout);
5. require the spec md5 to match its pre-bind value exactly;
6. rerun the plan probe 12/12 green and read the JSON artifact (ok=true, twelve green steps);
7. no red probe artifact may enter git.

The rank tooth is section-scoped to section 6's own body (the D383 hardening — a mention of
Kershaw's grade elsewhere in this document can never mask a tamper). Harden only the rank
tooth if the tamper fails too broadly or does not bite. Do not weaken any unrelated tooth.

Set `TMPDIR="$PWD/.tmp"` and run serially:

```bash
node --check tools/probe-wilderness-plan.mjs
node tools/build.mjs
node tools/validate-data-schemas.mjs
node tools/probe-battle-build-research.mjs
node tools/probe-wilderness-plan.mjs
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

Require build `GATE OK`; generated HTML md5 unchanged `91b9979144731ae3299af4ebaca4628a`;
schema 52/52; research 15/15 (with the packet §13 addendum — additive, the D383/D387/D390
precedent); Wilderness plan 12/12; all ten prior plan probes green (`ALL OK`); suite list 127;
every produced JSON/HTML artifact parsed and read; no failed step or recursive pageerror. Do
not run `npm run vet:noreg` — D389 discharged the release checkpoint and this slice moves no
runtime byte (the next battery is owed at the 2-3-battle checkpoint, alone on the machine).

## 14. Future Runtime Gate Contract

The runtime slice starts only from the clean pushed D392 contract under a LANE-003 DRIVE
recorded in the ledger. At minimum it runs, serially and with full artifact readback:

- `node --check` on every new/touched JS/MJS file, including preparse of any cooked browser
  SETUP/DOM strings (the S-03 amendment-8 law);
- `node tools/build.mjs`;
- `node tools/validate-data-schemas.mjs`;
- `node tools/probe-battle-build-research.mjs`;
- `node tools/probe-wilderness-plan.mjs` (implementation-present branch);
- `node tools/probe-wilderness.mjs` (single-phase runtime guard: registry/menu/launch,
  role/fog/objective assertions, THE THICKET LAW inputs, the eight-seed junction-hold battery
  AND the aggregate casualty-direction tooth, rank walls, the D74 scan, THE AXIS-SCOPE LAW,
  Classic/rail separation, 0 pageerrors);
- `node tools/probe-spotsylvania.mjs` and `node tools/probe-kennesaw.mjs` — the reshaped
  adjacency/scope teeth proven green, and `node tools/probe-chattanooga.mjs` as the upstream
  menu neighbor;
- `node tools/probe-tactical-roster.mjs`;
- `node tools/probe-custom-battle-builder.mjs`;
- `node tools/probe-loot-survival.mjs`;
- `node tools/probe-flags.mjs`;
- `node tools/probe-weather.mjs`;
- `node tools/probe-intel-uhd617-profile.mjs`;
- `node tools/probe-media-budget.mjs`;
- `node tools/vet-no-regression.mjs --list`;
- the registry-removal bind AND the Kershaw-rank bind, each proving exactly its predeclared
  teeth red with byte-identical (md5-proven) restores;
- honest A/B per section 7 if any simulation input moves after the first battery;
- `git diff --check`.

After playable Wilderness is green, the full serialized `npm run vet:noreg` release battery
runs at the next agreed checkpoint, ALONE on the machine — D391 (Spotsylvania) and the
Wilderness runtime will then be the two battles since D389, which puts that checkpoint AT or
immediately after the Wilderness runtime slice.

## 15. D392 Completion Criteria

D392 is green when this spec and `tools/probe-wilderness-plan.mjs` pass 12/12; the Kershaw
rank bind makes exactly one step red and restores byte-identically; every required focused
artifact is read; the 22/52/1380/22/127 baselines, sweep 22, generated HTML md5
`91b9979144731ae3299af4ebaca4628a`, and frozen base md5 `c9db83fa99230ffb95bdfdfe059f3fb9`
remain exact; the attrition packet carries the §13 D392 spec-time addendum; canonical docs
record the single-phase shape, THE AXIS-SCOPE LAW, THE THICKET LAW, the junction-hold +
casualty-direction law, the six named reshape obligations, and the runtime boundary; the final
D392 commit is pushed with LANE-003 released to CONTRACT/unowned; and no Wilderness tactical
runtime surface has started.
