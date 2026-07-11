# Stones River Battle-Build Spec (D365)

**Status:** D365 planning/spec plus filesystem plan probe. This slice adds no runtime data, registry entry, menu button, generated-game behavior, or combat change.

**Task shape:** build the third LANE-003 battle from `docs/design/battle-build-research/western-gaps-battle-build-research.md` (READY_FOR_SPEC, ratified). Stones River / Murfreesboro is the lane's lead build: the Western winter battle that teaches the project's rarest honest lesson — a strategic victory bought with MORE casualties than the loser's. The near-parity law travels with it.

**Research basis:** an 11-agent D365 research pass (five Sonnet web-research packets, five Opus default-refute verifiers, one Opus completeness critic; ~581k tokens; 0 errors) resolved the packet §9 unknowns and audited every strength, rank, landmark, and teaching claim. The critic returned two ship-blockers — both encoded below as label law: there is NO citation-grade phase-by-phase casualty split (only the aggregate and the Jan-2 CS figure are Verified), and the Jan-2 CS>US guard must be DIRECTION-only and scoped so it can never invert the aggregate near-parity guard. Fable 5 adjudicated every disputed point and owns this contract.

## Scope

**Battle:** Stones River (Murfreesboro), Tennessee, December 31, 1862 - January 2, 1863.

**Playable shape:** a two-phase T8 scenario — the two real combat days. January 1, 1863 was a lull (both armies held and tended wounded) and is a TEACHING INTERSTITIAL carried by the phase-2 transition card; it is NEVER a scored phase. Do not resurrect three-phase arithmetic.

- **Roles:** top-level `attacker:"CS"` / `defender:"US"`, identical in both phases. Rosecrans's Army of the Cumberland is the objective-holder.
- **Phases:** `phases[]` length 2.
  - Phase 1: `December 31 - The Dawn Attack and the Round Forest` (~6:00 a.m.), scoreWeight 3, DECISIVE. Hardee's corps (McCown, then Cleburne from reserve) smashes McCook's unready right at breakfast and wheels it back toward the Nashville Pike; Polk's corps (Cheatham, Withers) extends the assault against the center; the US line bends three miles but anchors on the Round Forest ("Hell's Half Acre", Col. William B. Hazen's brigade — reportedly the only Union brigade that did not give ground) and the Nashville Pike / railroad interior line, and does NOT break. Breckinridge's division starts east of the river: Adams's and Jackson's brigades cross mid-morning and are repulsed at the Round Forest; Preston's and Palmer's brigades make the final ~4:00 p.m. piecemeal assault as daylight fails. Historical direction: US HOLDS — this is where the battle was decided.
  - Phase 2: `January 2 - Breckinridge at McFadden's Ford` (~4:00 p.m.), scoreWeight 1. Breckinridge — having protested the order — attacks with ~4,500 men in two lines (front: Hanson's Orphan Brigade + Palmer's brigade under Brig. Gen. Gideon J. Pillow; support: Adams's brigade under Col. Randall L. Gibson + Preston's brigade) across open ground against Col. Samuel Beatty's ~4,000 on the high ground east of the ford. Capt. John Mendenhall's massed guns on the west bank (~57-58 per NPS/ABT; ABT's narrative says "nearly 50 cannon hub-to-hub") tear the assault apart in about 45 minutes; Negley's division (Miller's and Stanley's brigades) counterattacks across the ford. Historical direction: US holds, sharply.
- Score weights: 3 + 1 = 4 (the two-phase convention; the DECISIVE day carries the weight).
- **Fog:** `defaultFog:false` both phases. The Dec 31 dawn surprise must EMERGE from accurate positioning — concentrated CS mass against an un-refused, unentrenched right caught at breakfast — never from the fog mechanic (the D90 lesson) and never from a surprise multiplier. Jan 2 was an open-field assault the gunners plainly saw coming.
- **Doctrine:** `assaultDoctrine:"standard"` both phases — pressed corps/division assaults.
- **Weather:** `sky:"rain"`, `time:"dawn"` (supported T17 enums). The battle was fought in bitter cold, rain, and sleet with roads freezing at night (Verified). NEVER `snow` — the Classic layer's `wx:"snow"` on its own `stonesriver` roster row is a separate frozen layer, not a source.
- **Objectives:** Phase 1 — the Round Forest / Nashville Pike corridor (US holds its lifeline). Phase 2 — the high ground east of McFadden's Ford.
- **Menu rank:** `stonesRiver:52` — after `shiloh:50` and before `vicksburg:55`, keeping the Western arc chronological (Shiloh Apr 1862 → Stones River Dec 1862-Jan 1863 → Vicksburg 1863 → Chickamauga → Chattanooga → Kennesaw → Franklin → Nashville).
- **Registry id vs the Classic layer:** the tactical id is `stonesRiver` (file `data/stones-river.json`, key `stonesRiver`, `GAME_DATA["stones-river"]`). The frozen Classic roster's `stonesriver` id and the `data/logistics-rail.json` `routes.stonesriver` entry belong to the strategic/Classic layer (the `malvern`/`malvernHill` precedent) — do NOT rename either, and no logistics change is needed.

## The near-parity law (the load-bearing design decision)

Stones River INVERTS the usual direction guard twice over:

1. **The winner bled MORE.** The Verified aggregate lock (ABT battle page): US 12,906 casualties (1,677 k / 7,543 w / 3,686 m) of 41,400 engaged; CS 11,739 (1,294 k / 7,945 w / 2,500 m) of 35,000 engaged. The Union WON — by holding the field and the Nashville Pike until Bragg withdrew on the night of January 3 — while losing more men. **FORBIDDEN: any guard, tooth, or tuning pass that forces US losses below CS.** The aggregate direction guard is NEAR-PARITY: in a majority of 8 seeds, neither side's total losses exceed 1.6× the other's (the band is an Inferred engine tolerance around the historical 1.10 ratio).
2. **The one lopsided datum is phase-scoped.** The ONLY Verified phase-casualty figure in the battle is Breckinridge's Jan 2 loss: ~1,700-1,800+ of ~4,500 in under an hour (ABT "36%"; Wikipedia "over 1,800"; Breckinridge's own report ~1,700). The phase-2 guard is therefore CS phase-losses > US phase-losses, DIRECTION ONLY — the US Jan-2-only figure (~700) is single-source (Warfare History Network) and stays Inferred; no US phase magnitude may be asserted. This phase guard and the aggregate near-parity guard point in opposite directions and BOTH must hold; the phase-2 repulse emerges from the universal artillery/canister model + the open half-mile approach + fog OFF, never from a per-phase switch.
3. **No citation-grade Dec-31 casualty split exists.** Phase-1 losses are only a derived remainder of the aggregate. The spec, data notes, and teaching may cite ONLY the aggregate lock and the Jan-2 CS figure as Verified; every other split is labeled Inferred.

## Source Register

These control D366 runtime claims where they conflict with any summary or label. ABT pages count as ONE institution; NPS (nps.gov/stri + npshistory HRS + NPS Civil War Series), Warfare History Network, Civil War Monitor, westerntheatercivilwar (Breckinridge's OR report transcription), and civilwarhome (OR OOB transcription) are each independent.

| Source | Runtime use | Confidence |
|---|---|---|
| American Battlefield Trust, [Stones River battle page](https://www.battlefields.org/learn/civil-war/battles/stones-river) | THE aggregate lock: US 41,400 / CS 35,000 engaged; US 12,906 / CS 11,739 casualties with k/w/m splits; Maj. Gen. Rosecrans, Gen. Bragg, Lt. Gen. Hardee, Maj. Gen. Breckinridge; 6:00 a.m. Dec 31 attack; Jan 1 lull; ~4 p.m. Jan 2 assault; "nearly 50 cannon hub-to-hub" | Verified (fetched) |
| NPS Stones River, [Hell's Half Acre](https://www.nps.gov/stri/learn/historyculture/hellshalfacre.htm) | Round Forest = "Hell's Half Acre" between the Nashville Pike and Stones River; Hazen's brigade held it through four successive assaults (Chalmers, Donelson, then two Breckinridge-brigade attacks); the Hazen Brigade Monument | Verified (fetched) |
| NPS Stones River, [Tour Stop 3 / Cotton Field](https://www.nps.gov/stri/learn/photosmultimedia/battle_stop3.htm) | The Nashville Pike as the lifeline ("Rosecrans only means of retreat should the army falter"); the cotton field assaults; "over thirty cannons had a clear shot"; Parsons's batteries H & M | Verified (fetched) |
| NPS Stones River, [Slaughter Pen / Tour Stop 2](https://www.nps.gov/stri/learn/photosmultimedia/battle_stop2.htm) | The Slaughter Pen, the Cedars / cedar glades and rock outcroppings, Sheridan's pivot anchored on Negley, the (Wilkinson) Turnpike | Verified (fetched) |
| Breckinridge's OR report via [westerntheatercivilwar.com](https://www.westerntheatercivilwar.com/post/in-his-own-words-john-c-breckinridge-and-the-battle-of-stones-river) | Division tabular strength 7,053 on Dec 31 (Bragg's appendix, statement No. 7); "some 4,500 men" into the Jan 2 attack; the Dec 31 brigade sequence (Adams and Jackson repulsed first; Preston and Palmer at ~4 p.m.) | Verified (fetched primary via transcription) |
| Warfare History Network, [Final Attack at Stones River](https://warfarehistorynetwork.com/article/final-attack-at-the-battle-of-stones-river/) | The Jan 2 two-line formation (Hanson + Pillow/Palmer front; Gibson/Adams + Preston support); Mendenhall's gun mass; the ~45-minute repulse; Negley's counterattack. Its US ~700 Jan-2 loss figure is single-source — Inferred | Verified (fetched) for formation/sequence |
| Wikipedia, [Stones River CS order of battle](https://en.wikipedia.org/wiki/Battle_of_Stones_River_order_of_battle:_Confederate) + [US order of battle](https://en.wikipedia.org/wiki/Battle_of_Stones_River_order_of_battle:_Union) | Cross-check only: McCown = Ector/Rains/McNair; Cleburne = L. Polk/Liddell/B. Johnson/S.A.M. Wood; Cheatham = Donelson/A.P. Stewart/Maney/Preston Smith; Withers = Deas/Chalmers/Anderson-Walthall/Manigault; US wing/division structure; Hazen's regiments | Cross-check, never sole source |
| Lincoln to Rosecrans, Aug 31 1863 ([Collected Works Vol. 6](https://quod.lib.umich.edu/l/lincoln/lincoln6/1:661?rgn=div1;view=fulltext)) | "you gave us a hard earned victory, which, had there been a defeat instead, the nation could scarcely have lived over." | Verified (primary) |
| NPS/ABT biographies (Sheridan, Cleburne, Bragg, Polk, Hardee, Hanson) | Battle-date ranks and the promotion traps below | Verified (fetched this pass) |

**Discrepancy register (SURFACE, never reconcile silently):** the NPS Historic Resource Study gives CS 37,700 engaged / US 43,400 present / 13,244 US casualties; Wikipedia's infobox gives US 13,906 (4,686 captured/missing) and US strength 43,400; the NPS Civil War Series (McDonough) gives US 12,706 / CS 9,870 (the CS gap sits in the prisoner column, 868 vs 2,500). The ABT battle page is the primary anchor; the variants are recorded in teaching/notes, not averaged. A previously-reported "US 13,249 / CS 10,266" ABT snippet could not be located on any live ABT page — DO NOT USE. The McFadden's Ford gun count is 57 (NPS) vs 58 (ABT) — cite "~57-58" or the sourced range; never assert one exact count as a tooth. ABT's "highest percentage of casualties of any major battle" superlative is self-conflicting across its own pages (its 10-Facts page ranks Stones River second behind Gettysburg by an NPS 29% rate) — attributed-only teaching flavor, never an engine input or probe tooth.

## Reverification Readback (what the refute pass changed)

- **S.A.M. Wood's brigade belongs to CLEBURNE, not McCown.** McCown's division had THREE brigades (Ector, Rains, McNair); Cleburne's had four (Lucius Polk, Liddell, Bushrod Johnson, S.A.M. Wood — Wood in reserve). A gather packet mis-assigned Wood; corrected from Hardee's report + the CS OOB.
- **Cheatham's fourth brigade is Preston Smith's** (Donelson, A.P. Stewart, Maney, Preston Smith) — a "W. Smith" rendering is an artifact; reject it.
- **The claimed OR per-brigade strength table was REFUTED.** Full-text extraction of the cited 115-page NPS HRS PDF contains NONE of the McCown/Cleburne/Cheatham/Withers brigade figures a gatherer attributed to it. The ONLY OR-sourced sub-army CS figure is Breckinridge's division: 7,053 on Dec 31 and ~4,500 on Jan 2 (his own report). Every other CS division/brigade strength in the runtime is an Inferred split of the Verified 35,000 army anchor. McCown ~4,000 is loosely corroborated — still Inferred.
- **The Jan 2 assault force is ~4,500, not 5,000.** NPS "about 4,500" + Breckinridge's own "some 4,500"; the 5,000 framing is the loose end of the 4,400-5,000 source range. Lock 4,500.
- **The Dec 31 ~4:00 p.m. east-of-forest assault was Preston + Palmer, NOT Hanson.** The Orphan Brigade's charge is Jan 2 only; never gloss "Palmer/Hanson" as equivalent.
- **Two Confederate generals fell at Stones River, not four.** Brig. Gen. James E. Rains killed Dec 31; Brig. Gen. Roger W. Hanson mortally wounded Jan 2 (died Jan 4). Four is the BOTH-SIDES total (with Union Brig. Gens. Sill and Kirk). Never print "four Confederate generals." Reject the "Robert W. Hanson" rendering (an ABT map-page error).
- **Garesché carried a pocket copy of à Kempis's *The Imitation of Christ*, not a "personal Bible."** Lt. Col. Julius P. Garesché, Rosecrans's chief of staff, was decapitated by a cannonball riding beside Rosecrans on Dec 31 — his first battle; Hazen recovered his West Point ring.
- **The generals' revolt language is precise:** Polk wrote directly to Davis recommending Bragg's replacement by Johnston, Hardee concurred (his "unwise, in a high degree" is from Hardee's OFFICIAL REPORT, not a web summary), Davis sent Johnston to investigate rather than relieving Bragg. "Round robin" properly names BRAGG'S OWN circular letter asking his generals whether they had counseled retreat — use "generals' revolt / no-confidence" for the movement against him. Kirby Smith is NOT part of the post-battle petition (his anti-Bragg role is pre-battle; he had left for East Tennessee). Bragg's "I have given the order to attack the enemy in your front and expect it to be obeyed" is secondary-attested — attribute to the literature, never cite as OR.
- **The campfire detail runs the other way:** McCook's numerous campfires were meant to DISGUISE his unanchored right flank; in the event they contributed to McCown's leftward drift and the gap Cleburne filled. Do not write that they "increased the attack's effectiveness," and do not conflate them with Bragg's separate withdrawal-deception fires of Jan 3.
- **The cotton-field numbers were dropped.** NPS Tour Stop 3 supports only "over thirty cannons had a clear shot" and Parsons's batteries H & M — a "~38 cannon / ~30,000 troops" rendering is unsourced; use "a concentrated Union artillery line along the Nashville Pike, 30-plus guns."
- **Wilkinson Pike, the Cedars, and the Slaughter Pen ARE NPS-named landmarks** (a gatherer's gap was lifted by the refuter). Caveat: "the Battle of the Cedars" (Dec 7, 1864) is a SEPARATE engagement — don't conflate names.
- **Wheeler's raid start date is hedged** (Dec 29 vs Dec 30 across sources): "starting December 29-30."

## Strength And Timing Contract

Engaged strengths, not campaign paper totals. **Every fielded unit carries `Verified identity; Inferred strength`** — the army-level anchors are Verified, but every division/brigade split is Inferred (the refute pass killed the only claimed sub-army table). The two Verified sub-army numbers (Breckinridge 7,053 / ~4,500) live in unit notes and teaching, and the ~4,500 becomes the phase-2 CS total bound.

### Phase 1 — December 31 (~6:00 a.m.)

- **US:** the Army of the Cumberland at division grain — McCook's right wing (Johnson, Davis, Sheridan under Brig. Gens. Richard W. Johnson, Jefferson C. Davis, and Philip H. Sheridan), Thomas's center (Negley, Rousseau), Crittenden's left (Wood, Palmer — with Hazen's brigade fielded as its own Round Forest anchor unit — and Van Cleve's division recalled from its morning crossing). Modeled bound: **phase-1 US total 38,000-41,400** (the ABT 41,400 anchor; the split Inferred). US artillery: the Nashville Pike gun line (30-plus guns NPS-supported) — total US guns 30-60, Inferred distribution.
- **CS:** Hardee's corps (McCown's division — Ector/Rains/McNair; Cleburne's division — L. Polk/Liddell/B. Johnson/S.A.M. Wood) leading, Polk's corps (Cheatham's and Withers's divisions) extending. Breckinridge's brigades arrive as REINFORCEMENTS on the schedule (Adams + Jackson mid-phase, repulsed at the forest; Preston + Palmer late). Modeled bound: **phase-1 CS total 30,000-35,000** (the ABT 35,000 anchor minus the east-bank elements that never crossed, Inferred). CS guns 20-50, Inferred.
- Direction: US holds in ≥5/8 seeds. NO phase-casualty magnitude tooth (no citation-grade Dec-31 split exists).
- Opening-scene grain note for D366: keep the phase-1 opening OOB at wing/division grain (~12-16 units). If the opening unit count exceeds Kennesaw's 17, `data/media-budget.json` `largestShippedScene` and the Intel probe's largest-scene leg MUST move to Stones River in the same commit; if it stays at or under 17, Kennesaw keeps the crown. The probe derives the inventory either way.

### Phase 2 — January 2 (~4:00 p.m.)

- **CS:** Breckinridge's division at ~4,500 (**Verified division strength from his own report; the four-brigade split Inferred**): front line Hanson's Orphan Brigade + Palmer's brigade under Brig. Gen. Gideon J. Pillow; support line Adams's brigade under Col. Randall L. Gibson + Preston's brigade. Modeled bound: **phase-2 CS total 4,200-5,000**. CS guns 0-12 (the attached artillery never effectively deployed — Inferred).
- **US:** Col. Samuel Beatty commanding Van Cleve's division (~4,000 — brigades Grider, Fyffe, Price) on the high ground east of the ford, Grose's brigade in support, and **Mendenhall's massed west-bank guns: total US phase-2 guns 45-58** (NPS 57 / ABT 58 / "nearly 50" — the range IS the tooth; never one exact count). Negley's counterattack (Miller's and Stanley's brigades) arrives on the reinforcement schedule. Modeled bound: **phase-2 US total 7,000-11,000**.
- Direction: US holds in ≥5/8 seeds; CS phase-2 losses exceed US phase-2 losses in ≥5/8 (DIRECTION ONLY — the US magnitude is Inferred).

### Aggregate

- Weighted score 3+1: US wins the aggregate in ≥5/8 seeds.
- NEAR-PARITY guard: in ≥5/8 seeds, `max(totalUS, totalCS) / min(totalUS, totalCS) ≤ 1.6`. Explicitly NOT `US < CS`; a probe asserting US < CS would falsely encode a differential history did not produce.
- Same-seed determinism; passive US and passive CS launches terminate without NaN.

### Honest A/B rule

If D366 changes a simulation input after the first battery, log both values and the observed 8-seed result in `DECISIONS.md`. Eligible inputs: OOB strengths inside the bounds above, gun counts within the sourced ranges, xp, terrain/works placement, reinforcement timing, formation, objective radius, hold/time thresholds, phase time limits. A result-derived multiplier is forbidden.

## OOB And Rank Traps

The runtime probe must search the full payload, including leaders, units, notes, and teaching. All ranks below survived a 23-claim default-refute battery (all CONFIRMED).

- **Maj. Gen. William S. Rosecrans** — Army of the Cumberland. **Lt. Col. Julius P. Garesché** — his chief of staff, killed Dec 31 (teaching).
- **Maj. Gen. George H. Thomas** (center), **Maj. Gen. Alexander M. McCook** (right wing), **Maj. Gen. Thomas L. Crittenden** (left wing).
- **Brig. Gen. Philip H. Sheridan** — THE TRAP: his Maj. Gen. of Volunteers commission issued April 10, 1863 with a BACKDATED date of rank of Dec 31, 1862 (awarded FOR this battle). He was a BRIGADIER during the battle. Reject `Maj. Gen. Philip H. Sheridan`.
- **Col. William B. Hazen** — a COLONEL at the Round Forest; his brigadier appointment came later. Reject `Brig. Gen. William B. Hazen` anywhere in the payload.
- **Brig. Gen. James S. Negley** — treat as Brig. Gen.; his Nov 29, 1862 MG appointment is disputed/unconfirmed (expired Mar 4, 1863) — one-line footnote allowed, reject `Maj. Gen. James S. Negley` as a fielded rank.
- **Brig. Gen. Horatio P. Van Cleve** (wounded Dec 31) → **Col. Samuel Beatty** commands the division Jan 2. Beatty is a COLONEL — reject any general's grade.
- **Brig. Gens. Richard W. Johnson, Jefferson C. Davis, Thomas J. Wood (wounded), John M. Palmer**; **Maj. Gen. Lovell H. Rousseau**. **Capt. John Mendenhall** — Crittenden's chief of artillery (a CAPTAIN massing ~57 guns — teach it).
- **Gen. Braxton Bragg** — FULL general (from April 12, 1862), Army of Tennessee (renamed from Army of the Mississippi, Nov 1862). Reject `Lt. Gen. Braxton Bragg`.
- **Lt. Gen. Leonidas Polk** and **Lt. Gen. William J. Hardee** — THE HEADLINE FLIP: both were among the first CSA lieutenant generals, effective Oct 10, 1862 (Polk announced Oct 11). They were Maj. Gens. at Perryville (Oct 8) but LIEUTENANT generals here. Reject `Maj. Gen. Leonidas Polk` and `Maj. Gen. William J. Hardee` in this battle's payload.
- **Maj. Gen. John C. Breckinridge** — reject `Lt. Gen.` (post-war/late-war inflation).
- **Maj. Gen. Patrick R. Cleburne** — promoted Dec 13, 1862, eighteen days before the battle (Brig. Gen. at Perryville). Reject `Brig. Gen. Patrick R. Cleburne` here.
- **Maj. Gens. John P. McCown, Benjamin F. Cheatham, Jones M. Withers**.
- **Brig. Gen. Roger W. Hanson** — Orphan Brigade, mortally wounded Jan 2, died Jan 4. Reject `Robert W. Hanson`.
- **Brig. Gen. Gideon J. Pillow** (Palmer's brigade, Jan 2 front line), **Col. Randall L. Gibson** (commanding Adams's brigade), **Brig. Gen. William Preston**.
- **Brig. Gens. Joseph Wheeler and John A. Wharton** — CS cavalry (Wheeler's raid is a teaching card, not an on-map unit).
- **Brig. Gens. Joshua W. Sill and Edward N. Kirk** — killed/mortally wounded Dec 31 (Sheridan's and Johnson's brigades); with Rains and Hanson they make FOUR generals lost across BOTH sides (never "four Confederate generals").
- **Absent-by-law:** Garfield (joined Rosecrans's staff in 1863, after the battle) and Rosecrans-at-Perryville-style transplants. No Perryville leader set may be copied over.

## Terrain And Objective

- **The Nashville Pike and the Nashville & Chattanooga Railroad** — the parallel US lifeline corridor and phase-1 objective axis ("Rosecrans only means of retreat should the army falter" — NPS).
- **The Round Forest ("Hell's Half Acre")** — the cedar copse between the Nashville Pike and Stones River; the phase-1 objective anchor; Hazen's brigade as its own fielded unit.
- **The Cedars / cedar glades and the Slaughter Pen** — the rock-outcropping thickets of Sheridan's fighting withdrawal (NPS-named; woods + rough-ground inputs).
- **The cotton field** — the open ground of the repeated assaults on the pike line.
- **Wilkinson Pike** — the mid-field road of the center's fight.
- **Stones River and McFadden's Ford** — the river band; phase 2 fights east of it with the ford as the crossing.
- **The high ground east of McFadden's Ford** — the phase-2 objective; **the west-bank artillery ridge** where Mendenhall massed the guns.
- Home edges: the US rear is the Nashville Pike corridor (toward Nashville, LOW z per the map orientation chosen at runtime); the CS rear is Murfreesboro (HIGH z). Declare `homeEdge` role-aware at top level; the probe verifies the override plus a sandbox leak test.
- All placements are Inferred map abstractions of Verified features — label every terrain note.

## Victory And Balance Intent

The universal combat model owns the outcome. The correct levers are true near-parity strength mass, the interior-line/objective geometry, the massed-gun OOB input on Jan 2, terrain friction (cedars, river, open approaches), xp, formation, timing, and phase weights.

- Phase 1 teaches that holding the pike IS winning: the US line bends dramatically but the objective-hold model decides on the corridor, not on a body count.
- Phase 2's repulse emerges from ~4,500 infantry crossing open ground against ~4,000 dug-in infantry backed by a 45-58-gun mass — the universal canister model does the work. No per-phase switch, no scripted repulse.
- A human CS player can do better than Bragg (concentrate the Dec 31 assault, refuse the Jan 2 order's mistake); a human US player can lose the pike by stripping the Round Forest. The default AI-vs-AI pattern must teach the documented shape: a terrifying CS morning that fails at the anchor, a lull, a doomed twilight charge, a strategic Union victory bought at higher total cost.
- Casualty gravity: ~24,600 total casualties in three days of a winter battle. Present with restraint; no spectacle.

## Teaching And Anti-Lost-Cause Framing

At least seven cards, each claim with at least two source URLs; one codex entry (`theater:"Western"`, Stones River / Middle Tennessee campaign axes, `result:"Union victory"` with the near-parity cost note).

1. **`sr_won_by_holding`** — the lane's core teaching: the Union lost MORE men (12,906 vs 11,739) and WON — Rosecrans held the field and the pike; Bragg withdrew the night of Jan 3 toward Tullahoma; Middle Tennessee changed hands. Lincoln's Aug 31, 1863 letter, quoted exactly: "you gave us a hard earned victory, which, had there been a defeat instead, the nation could scarcely have lived over." Victory is decided by ground and campaign, not the casualty scoreboard — the inverse of Fredericksburg.
2. **`sr_dawn_breakfast`** — ~6:00 a.m., McCown then Cleburne strike Johnson's division at breakfast with arms stacked; Kirk mortally wounded, Willich captured; the right wheels back three miles; the campfires that were meant to disguise the unanchored flank; Sill killed in the counterattack. The surprise as POSITIONING, which is exactly how the game models it.
3. **`sr_hells_half_acre`** — Hazen's brigade (a colonel's command) holds the Round Forest through four successive assaults; reportedly the only Union brigade that did not give ground on Dec 31; the Hazen Brigade Monument (1863) as one of the war's oldest battlefield memorials. The 32nd Alabama's 280-in / 58-out figure carried as attributed.
4. **`sr_breckinridge_protest`** — Breckinridge protests the Jan 2 order as suicidal; Bragg's "I have given the order... and expect it to be obeyed" (secondary-attested, attributed to the literature); ~1,700-1,800 of ~4,500 fall in under an hour; Hanson dies. Framed as a command decision and its predictable cost — never as doomed Southern gallantry.
5. **`sr_mendenhall`** — a captain masses ~57-58 guns before daylight and breaks a division in 45 minutes: the artillery arm's decisive DEFENSIVE moment; the gun-count disagreement (~50 vs 57-58) surfaced as sources differing.
6. **`sr_garesche`** — Lt. Col. Julius P. Garesché, decapitated riding beside Rosecrans in his first battle; the West Point ring Hazen recovered; the pocket copy of *The Imitation of Christ* (NOT a "personal Bible"). Command exposure and the human cost at headquarters.
7. **`sr_generals_revolt`** — after the battle Polk writes Davis recommending Johnston replace Bragg; Hardee concurs ("unwise, in a high degree" — his official report); Davis sends Johnston to investigate and keeps Bragg; the Army of Tennessee's command dysfunction (already taught in `data/generals.json`) hardens here and helps lose Chattanooga. Internal command failure, not bad luck — no Lost-Cause laundering.
8. **`sr_emancipation`** — the Emancipation Proclamation took effect January 1, 1863: the quiet middle day of this battle. Union fortunes at their low ebb after Fredericksburg; the hard-earned hold at Stones River buttressed the Proclamation winter. "Word did not reach the battlefield" framed as reasonable inference, not sourced fact.
9. *(Optional ninth)* **`sr_wheeler`** — Wheeler's ~2,500 troopers ride around the army starting Dec 29-30, burning wagons and taking ~1,000 prisoners without severing the pike; Stanley's outnumbered US cavalry holds the line open. Why the raid is a teaching card and not an on-map unit.

No massacre or atrocity content is in this lane; the dignity carve-outs (no Leetown Native OOB, no playable Fort Pillow) are untouched by this battle.

## D74 No-Fudge Acceptance Gates

D366 must add no Stones-River-specific damage, firepower, morale, casualty, rout, capture, winner, or score control. The data scan must reject keys matching the standing family at any depth:

`damage`, `dmg`, `damageMult`, `firepower`, `firepowerMult`, `fireScale`, `fireMult`, `fireMultiplier`, `killScale`, `killMult`, `casualtyScale`, `casualtyMult`, `lossMult`, `combatScale`, `battleDamage`, `battleFire`, `powerMult`, `moraleMult`, `routMult`, `captureMult`, `scoreBonus`, `scoreMult`, `winner`, `winOverride`, `victoryOverride`, `outcomeOverride`, `forceWin`, `winnerFudge`, `fudge`, `valorMult`, `heroism`.

Named temptations, all FORBIDDEN: a parity-forcing casualty key (the US bled more and won); a dawn-surprise `powerMult` (positioning carries it); a "reserves-locked"/acoustic-shadow-style morale switch (not even applicable here — that is Perryville's trap); an exact Mendenhall gun-count tooth (the range is the tooth); a scripted Jan-2 repulse (the gun mass in the OOB carries it).

## D366 Implementation Files

- `data/stones-river.json` with top-level key `stonesRiver` (two-phase T8; `tools/build.mjs` injects it as `GAME_DATA["stones-river"]`).
- `src/tactical/T1-bull-run.js` registry entry and menu rank `stonesRiver:52`.
- `src/tactical/T10-flags.js` explicit metadata: `theater:"W"`, `badges:false`, `csFlag:"hardee"` (the Army of Tennessee's Western lineage — the Hardee-pattern blue-disc flag was carried by this very army; consistent with Chickamauga through Nashville).
- `tools/validate-data-schemas.mjs` battle-file enrollment (`stones-river.json`, 46 files).
- `tools/shots/data-schema-validation.html` regenerated with a substantive 46th row.
- `tools/probe-stones-river.mjs` focused browser + direction guard (teeth below).
- `tools/probe-tactical-roster.mjs` `EXPECTED` + `PHASE_COUNTS` (`stonesRiver: 2`), menu, and DOM updates.
- `tools/probe-custom-battle-builder.mjs` historical baseline update.
- `tools/probe-loot-survival.mjs` Army Register pin from 990 to `990 + unique units × 3`, with a D366 documented-history comment (unique battle/side/unit ids across BOTH phases' opening OOBs and reinforcements; phase-repeated ids dedupe).
- `tools/probe-flags.mjs` registered-scenario metadata coverage from 15 to 16 and a Stones River semantic tooth (Army of Tennessee / Hardee pattern).
- `data/media-budget.json` opening-scene count from 15 to 16 — AND the largest-scene check: if the phase-1 opening OOB exceeds 17 units, `largestShippedScene` moves to Stones River in the same commit; otherwise Kennesaw keeps the crown.
- `tools/probe-intel-uhd617-profile.mjs` opening-scene coverage from 15 to 16 (same largest-scene rule).
- `tools/vet-no-regression.mjs` enrollment for the focused probe, suite 120 → 121; the sweep timeout comment moves from 15 to 16 battles.
- `weather`: `sky:"rain"`, `time:"dawn"`, exact single-value provenance per the D355 convention, two source URLs, and a note on the cold/sleet conditions (never snow).
- Generated `civil_war_generals.html` rebuilt through `node tools/build.mjs` only.
- NO change to `data/logistics-rail.json` (its `stonesriver` route is the Classic/strategic layer).

## Required D365 Planning Gate

- `node --check tools/probe-stones-river-plan.mjs`
- `node tools/build.mjs`
- `node tools/validate-data-schemas.mjs`
- `node tools/probe-battle-build-research.mjs`
- `node tools/probe-stones-river-plan.mjs`
- `node tools/probe-new-market-heights-plan.mjs`
- `node tools/probe-tactical-roster.mjs`
- `node tools/probe-custom-battle-builder.mjs`
- `node tools/probe-nashville.mjs`
- `git diff --check`

Plus a surgical negative bind: tamper one load-bearing spec line (a rank lock), observe exactly the corresponding plan-probe step fail, restore byte-identical.

## Required D366 Runtime Gate

- `node --check` on the new/touched probe and `src/tactical/*.js` files
- `node tools/build.mjs`
- `node tools/validate-data-schemas.mjs`
- `node tools/probe-stones-river-plan.mjs`
- `node tools/probe-stones-river.mjs`
- `node tools/probe-tactical-roster.mjs`
- `node tools/probe-custom-battle-builder.mjs`
- `node tools/probe-loot-survival.mjs`
- `node tools/probe-flags.mjs`
- `node tools/probe-weather.mjs`
- `node tools/probe-intel-uhd617-profile.mjs`
- `node tools/probe-media-budget.mjs`
- `node tools/vet-no-regression.mjs --list`
- `node tools/probe-new-market-heights.mjs`
- `node tools/probe-nashville.mjs`
- `git diff --check`

Browser probes run serially in full access with one shared server and `TMPDIR="$PWD/.tmp"`. Read every required artifact under `tools/shots/`; require `ok:true`, zero failed steps, zero pageerrors. Full `npm run vet:noreg` remains owed after the final LANE-003 battle, before the lane's release handoff.

## Future Runtime Probe Teeth

When `data/stones-river.json` exists, `tools/probe-stones-river.mjs` must verify:

- two-phase T8 data and runtime state: `phases.length === 2` (the Jan 1 lull is NOT a phase), CS attacker / US defender both phases, `defaultFog:false`, score weights 3 and 1 (total 4), phase names carrying `December 31` and `January 2`;
- menu chronology after Shiloh and before Vicksburg, one accessible button, two side-choice cards, side preserved through `fldLaunchBattle`;
- landmark teeth: `Nashville Pike`, `Round Forest`, `Hell's Half Acre`, `Stones River`, `McFadden`, `Wilkinson Pike`, `the Cedars`, `Slaughter Pen`, `cotton field`; role-aware home edges plus a negative sandbox leak test;
- phase-1 US total 38,000-41,400; phase-1 CS total 30,000-35,000; phase-2 CS total 4,200-5,000; phase-2 US total 7,000-11,000 with total US phase-2 guns 45-58; every unit note carrying `Verified identity; Inferred strength`;
- rank teeth (exact): `Maj. Gen. William S. Rosecrans`, `Gen. Braxton Bragg`, `Lt. Gen. Leonidas Polk`, `Lt. Gen. William J. Hardee`, `Maj. Gen. John C. Breckinridge`, `Maj. Gen. Patrick R. Cleburne`, `Brig. Gen. Philip H. Sheridan`, `Col. William B. Hazen`, `Col. Samuel Beatty`, `Brig. Gen. Roger W. Hanson`, `Capt. John Mendenhall`; rejections: `Maj. Gen. Philip H. Sheridan`, `Brig. Gen. William B. Hazen`, `Maj. Gen. Leonidas Polk`, `Maj. Gen. William J. Hardee`, `Lt. Gen. John C. Breckinridge`, `Brig. Gen. Patrick R. Cleburne`, `Lt. Gen. Braxton Bragg`, `Maj. Gen. James S. Negley`, `Robert W. Hanson`, `four Confederate generals`;
- no forbidden D74 key at any depth (including `valorMult`/`heroism`);
- deterministic same-seed replay; passive US and passive CS completion without hangs or NaN;
- the 8-seed battery: phase-1 US holds ≥5/8; phase-2 US holds ≥5/8; phase-2 CS losses > US losses ≥5/8 (direction only); aggregate US wins ≥5/8; aggregate NEAR-PARITY `max/min ≤ 1.6` ≥5/8 — and NO tooth anywhere asserting aggregate US < CS;
- teaching: at least seven cards, each claim with at least two source URLs, including the won-by-holding card with Lincoln's exact quote, the Breckinridge-protest card, the generals'-revolt card, the Garesché card (Imitation of Christ, not Bible), and the Emancipation interstitial card; one codex entry with `theater:"Western"` and `result:"Union victory"` with the near-parity cost note;
- the Army Register pin increase equals unique Stones River unit ids times three;
- negative bind proof: remove the T1 registry line and separately tamper a rank lock → exactly the corresponding teeth fail → restore exact bytes before commit.

## D365 Completion Criteria

D365 is green when this spec and `tools/probe-stones-river-plan.mjs` pass; the plan probe confirms no half-registration; the build and current 15-battle roster stay green; the required JSON artifacts have been read; LANE-003 records the D365 boundary; and the commit is pushed. Runtime work starts only from that clean D365 boundary.
