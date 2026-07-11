# Sheridan's 1864 Shenandoah Valley Campaign - Battle-Build Research Packet

**Status:** durable battle-build research packet (docs only; no data/runtime/registry change).
**Lane:** shenandoah-1864
**Verdict:** READY_FOR_SPEC

Sheridan's August-October 1864 campaign broke Confederate power in the Valley in three stand-up fights - Third Winchester (Opequon), Fisher's Hill, and Cedar Creek - plus "The Burning" (hard war against Valley civilians) and, upstream in July, Early's raid checked at Monocacy. Cedar Creek is the standout buildable candidate: a Confederate dawn surprise that overruns three Union corps, then collapses under Sheridan's afternoon counterattack the same day - a natural T8 two-phase scenario with the attacker/defender roles reversing between phases. Third Winchester is a strong second (single-phase or two-phase). Fisher's Hill and Monocacy are teaching-leaning; "The Burning" is teaching-ONLY on dignity grounds.

## 1. Candidate Battles Ranked By Buildability

| Rank | Battle/Campaign | Buildable shape | Buildability | One-line why |
|------|-----------------|-----------------|--------------|--------------|
| 1 | Cedar Creek (Oct 19 1864) | T8 two-phase (P1 CS dawn attacker-seize -> P2 US afternoon attacker-seize / counterattack) | High | Same-day role reversal maps perfectly onto two phases; the surprise emerges from dawn fog + flank approach + camp-caught VIII Corps, the collapse from US strength edge + fresh cavalry, zero fudge. |
| 2 | Third Winchester / Opequon (Sep 19 1864) | Single-phase attacker-seize (US), optional T8 two-phase (Berryville Pike morning grind -> Crook's flank + cavalry charge) | High | Largest Valley battle, true stand-up fight; US ~39k vs CS ~15k plus a decisive late flank produces the historic US win by OOB + timing. |
| 3 | Fisher's Hill (Sep 22 1864) | Single-phase attacker-seize (US) turning the CS left | Medium | Buildable but decided by Crook's concealed flank march around Little North Mountain against a demoralized, 4:1-outnumbered CS - a rout, less of a fight than a maneuver. |
| 4 | Monocacy (Jul 9 1864) | Delaying defender-hold (US loses field but wins time) - teaching-leaning | Low-Medium | The teaching ("the battle that saved Washington") is the DELAY, not holding the objective; the objective-hold engine scores the field, which the US loses - the lesson does not map to the scoreboard. |
| 5 | "The Burning" (Sep-Oct 1864) | Teaching-ONLY (hard war on civilians) | None | Devastation of a civilian granary; a dignity line forbids scoring it. Teaching card + codex only, never a playable objective. |

## 2. Recommended Playable Shape

**Cedar Creek (top candidate) - T8 two-phase, roles REVERSE between phases (RECOMMENDED primary).**
- Battle id: `cedar-creek`. Aggregate winner US by weighted score; the decisive phase is the Union counterattack.
- **Phase 1 "Gordon's Dawn Assault" (scoreWeight 1):** attacker = CS ("CS"), defender = US ("US"). CS crosses Cedar Creek before dawn, Gordon's flank column having crossed the Shenandoah below Massanutten Mountain, and overruns Crook's VIII Corps in its camps around Belle Grove and Middletown; CS must seize the camp line. **Fog ON** - the pre-dawn river fog was real and is an ACCURATE input (D92), not an attacker bonus; the surprise emerges from fog + pre-dawn timing + the concealed flank approach + a VIII Corps caught unentrenched in camp (low readiness = an accurate default, not a fudge). Historical lean CS.
- **Phase 2 "Sheridan's Counterattack" (scoreWeight 3, DECISIVE):** attacker = US ("US"), defender = CS ("CS") now holding the captured ground north of Middletown. Sheridan, back from Winchester, re-forms VI/XIX/VIII and, with Torbert's cavalry (Custer, Merritt) on the flanks, retakes the field. **Fog OFF** (clear afternoon). US must seize; the collapse emerges from the US strength edge (~32k vs ~21k), fresh cavalry on the disorganized CS flank, and a CS line that had paused/scattered (modeled as CS cohesion/reinforcement TIMING, never a scripted rout). Historical lean US, decisive.
- **scoreWeight sum = 4 (1 + 3 DECISIVE = 4).** Two-phase convention. State this explicitly so a probe does not assert 5.
- Engine-grain fit: each phase is a discrete sector fought to decision; objective-hold favors bodies-on-objective + cover, so P1's CS seize comes from the surprise/flank mass and P2's US seize from the strength edge + cavalry. The role reversal is the teaching spine: the same field, won by each side in turn on the same day.

**Third Winchester (second candidate) - single-phase attacker-seize (US), optional two-phase.**
- Roles: attacker = US ("US"), defender = CS ("CS") defending Winchester behind the Opequon. US must seize the CS main line. Single-phase: the US strength edge (~39k vs ~15k) + a late flank (Crook) + Torbert's cavalry charge from the north produce the historic US win. Optional T8: P1 "The Berryville Pike & Middle Field" (scoreWeight 1, the costly morning grind up the canyon of Red Bud Run) -> P2 "Crook's Flank & the Cavalry Charge" (scoreWeight 3, DECISIVE). Fog OFF (clear September day). Sum = 4.

## 3. Source Register

| Source | Use | URL | Confidence |
|--------|-----|-----|------------|
| American Battlefield Trust - Cedar Creek (fetched this run) | Date; two-phase sequence (dawn surprise -> Sheridan's ride -> counterattack); strengths (~31,945 US / 21,000 CS); casualties; Belle Grove; Lincoln-reelection significance. NOTE: its facts box mislabels Early "Major General" | https://www.battlefields.org/learn/civil-war/battles/cedar-creek | Verified |
| American Battlefield Trust - Third Winchester (fetched + re-fetched this pass) | Date; Sheridan = Maj. Gen., Early = Maj. Gen. (see rank note); strengths (US 39,240 / CS 15,200 - the facts-box "Forces Engaged 54,440" is the COMBINED total, 39,240 + 15,200; do not read 54,440 as one side); casualties (US 5,020 / CS 3,610, total 8,630); Opequon Creek, Berryville Pike, Red Bud Run; VI/XIX/VIII Corps | https://www.battlefields.org/learn/civil-war/battles/third-winchester | Verified |
| NPS - Battle of Cedar Creek (fetched + re-fetched this pass) | Ranks CORRECTLY: Sheridan Maj. Gen., Wright Maj. Gen. (VI), Crook Brig. Gen. (VIII), Emory Maj. Gen. (XIX), Early Lt. Gen. (Army of the Valley), Gordon Maj. Gen., Ramseur Maj. Gen.; Crook's VIII Corps caught in camp; Massanutten all-night march; Sheridan's ride from Winchester; NPS carries the LOWER ~7,682-total casualty accounting (vs ABT's 8,824) | https://www.nps.gov/articles/000/battle-of-cedar-creek.htm | Verified |
| NPS - Third Battle of Winchester | Campaign framing, Sheridan/Early ranks, Opequon terrain | https://www.nps.gov/articles/000/third-battle-of-winchester.htm | cite-pending |
| American Battlefield Trust - Fisher's Hill facts | Strengths (US ~38,950 / CS ~9,500); Crook's flank march around Little North Mountain; Tumbling Run; casualties (~US 520 / CS 1,230, ~900 captured) | https://www.battlefields.org/learn/civil-war/battles/fishers-hill | cite-pending |
| American Battlefield Trust - Monocacy facts | Wallace = Maj. Gen.; Early ~14,000 / Wallace ~6,050; Ricketts's VI Corps division; "battle that saved Washington"; casualties ~US 1,300 / CS 700 | https://www.battlefields.org/learn/civil-war/battles/monocacy | cite-pending |
| Wikipedia - Battle of Cedar Creek (re-fetched this pass) | Infobox gives US 5,665 (644 k / 3,430 w / 1,591 m) / CS 2,910 (320 k / 1,540 w / 1,050 m), total 8,575 - so it corroborates the US-bled-more DIRECTION but does NOT say "7,682" (that is the NPS total); strengths US 31,610 / CS 21,102 effectives; Ramseur mortally wounded and captured by the 1st Vermont Cavalry | https://en.wikipedia.org/wiki/Battle_of_Cedar_Creek | Verified (corroboration only) |
| NPS Monocacy - Jubal Early biography | Early's temporary Lt. Gen. grade (May 31 1864) and Army of the Valley command | https://www.nps.gov/mono/learn/historyculture/jubalearly.htm | Verified (2026-07-11 pass; temporary grade + May 31 1864 date CONFIRMED) |
| US Army CMH Cedar Creek Staff Ride - Order of Battle appendix (fetched 2026-07-11; live URL Akamai-403s bots — use the Wayback mirror) | THE strength anchor: US per-corps engaged (VI 8,506 inf + 600 arty / 24 guns · VIII 4,000 + 200 / 16 · XIX 8,748 + 414 / 20 · Kitching's Provisional Div 1,000 · Cavalry 7,500 + 642 / 30 · total 31,610 / 90 guns); CS per-division (31 Oct 1864 field-inspection returns + ~3,500 Cedar Creek losses added back; page footnote: "No official report is available", alt estimate as low as 15,680): Ramseur 2,442 · Pegram 2,013 · Gordon 2,227 · Kershaw 3,071 · Wharton 1,421 (11,174 inf + 1,101 arty / 40+ guns); cavalry Lomax 3,121 · Rosser 2,206; total 21,102 | https://history.army.mil/books/Staff-Rides/CedarCreek/ccob.htm (mirror: https://web.archive.org/web/20230928113544/https://history.army.mil/books/Staff-Rides/CedarCreek/ccob.htm) | Verified (single .mil source; per-unit strengths ship "Verified identity; Inferred strength") |
| US Army CMH Cedar Creek Staff Ride - battle narrative | Dawn sequence (Kershaw waded Cedar Creek unopposed 04:30), halt decision ~10:00 a.m., 4:00 p.m. counterattack timing | https://history.army.mil/books/Staff-Rides/CedarCreek/ccbattle.htm (mirror: https://web.archive.org/web/20230928101540/https://history.army.mil/books/Staff-Rides/CedarCreek/ccbattle.htm) | Verified |
| Cedar Creek Battlefield Foundation - order of battle | Full both-side unit/commander hierarchy (brigade level); aggregate totals only (US 31,945 / 5,764; CS 21,000 / 3,060); NOTE its rank labels can use ultimate/best-known grade (Torbert/Rosser "Maj. Gen.") — do not trust for battle-date rank | https://ccbf.us/order-of-battle/ | Verified (structure), rank labels UNRELIABLE |
| NPS - "The Fatal Halt" article (fetched 2026-07-11) | THE anchor for the DISPUTED halt: quotes Early's plunder account ("so many of our men had stopped in the camp to plunder…") AND Gordon's Reminiscences ch. XXV counterclaim ("the fatal halting, the hesitation, the spasmodic firing… lost us the great opportunity"); Mahr's "succession of delays" framing; halt ~9:30-10:00 a.m. with delays toward ~12:30 | https://www.nps.gov/articles/000/fatal-halt.htm | Verified |
| NPS - "Sheridan Arrives" article (fetched 2026-07-11) | Sheridan's ride: departed Winchester ~9:00 a.m. on Rienzi (Forsyth, O'Keefe, ~20 troopers), ~12 miles — not the poem's 20 — on the field ~10:30 a.m. | https://www.nps.gov/articles/000/sheridan-arrives.htm | Verified |
| Gordon, "Reminiscences of the Civil War", ch. XXV "The Fatal Halt at Cedar Creek" (primary; hosted at docsouth.unc.edu/fpn/gordon/ — 2026-07-11 fetch reached front matter only, ch.-XXV text verified via the NPS Fatal Halt article's quotations) | Gordon's side of the dispute; the "glory enough for one day" line attributed to Early exists ONLY via Gordon's account — attribute to Gordon's Reminiscences, never state as fact (a claimed ABT-page attribution was default-refuted 2026-07-11) | https://docsouth.unc.edu/fpn/gordon/gordon.html | Verified via NPS quotation (primary text access pending) |

## 4. OOB And Rank Traps

- **Philip H. Sheridan - RANK TRAP.** At ALL three battles his field grade was **Major General, U.S. Volunteers**, commanding the **Middle Military Division / Army of the Shenandoah**. His **Regular-Army brigadier general** commission dated **Sep 20 1864** (one day AFTER Third Winchester), and his Regular-Army **major general** came **effective Nov 8 1864** (AFTER Cedar Creek) as the reward for Cedar Creek - do NOT backdate it onto the OOB. He was **NOT a lieutenant general until 1869** - never label him Lt. Gen. in this lane. (NPS + ABT confirm "Maj. Gen. Philip Sheridan"; Regular-Army dates from Army Historical Foundation / Wikipedia.)
- **Jubal A. Early - RANK TRAP (temporary grade).** He was **Lieutenant General (TEMPORARY grade), C.S.A.**, appointed on **May 31 1864** on Lee's request under Davis's temporary-promotion authority, commanding the **Army of the Valley**. Encode "Lieutenant General (temporary grade)." **CONFLICT:** the ABT Cedar Creek AND Third Winchester facts boxes both call him "Major General" - that is an ABT error; **NPS correctly gives "Lt. Gen. Jubal A. Early."** Use NPS; record the conflict. (Separate trap: at First Bull Run 1861 - already in the repo - he was a **Colonel**; do not carry the 1864 rank backward, and note the CSA had no Lt. Gen. grade before Oct 1862.)
- **Horatio G. Wright - Major General**, VI Corps (and acting overall US commander at Cedar Creek in the morning before Sheridan arrived). (NPS-confirmed.)
- **George Crook - RANK TRAP. Brigadier General**, VIII Corps ("Army of West Virginia"). His **major-generalcy dated Oct 21 1864** - two days AFTER Cedar Creek and one MONTH after Fisher's Hill - so at Winchester, Fisher's Hill, AND Cedar Creek he was a **Brig. Gen.** Do NOT inflate to Maj. Gen. (NPS Cedar Creek confirms "Brig. Gen. George Crook.") His division commanders at Fisher's Hill/Cedar Creek included Col. Rutherford B. Hayes and Col. Joseph Thoburn.
- **William H. Emory - RANK TRAP (corrected 2026-07-11, §12). Brigadier General (Bvt. Maj. Gen.)**, XIX Corps. His SUBSTANTIVE USV grade on Oct 19 1864 was Brig. Gen. (from Mar 17 1862), holding a brevet Maj. Gen. USV (Jul 23 1864); full MG USV came only Sep 25 1865. NPS's "Maj. Gen. William H. Emory" is courtesy/brevet usage — two independent 2026-07-11 verification passes (default-refute + a dedicated rank packet) converged on the substantive grade. Encode "Brig. Gen. (Bvt. Maj. Gen.)"; the exact brevet date is packet-note-grade, not an in-game Verified claim.
- **John B. Gordon - Major General**, C.S.A.; led the flank column over Massanutten at Cedar Creek. (NPS-confirmed.) Do not inflate to Lt. Gen.
- **Stephen D. Ramseur - Major General**, C.S.A. (division), **mortally wounded at Cedar Creek Oct 19, died Oct 20** at Belle Grove. Encode as Maj. Gen.; his death is a teaching-card beat, NEVER a scripted-death mechanic (D74).
- **Alfred T. A. Torbert - Brigadier General**, chief of cavalry, Army of the Shenandoah. **George A. Custer - Brigadier General** (3rd Cavalry Division) - NOT major general yet (his MG came 1865); **Wesley Merritt - Brigadier General** (1st Cavalry Division). Do not inflate Custer/Merritt.
- **Third Winchester deaths:** **Robert E. Rodes = Major General, C.S.A.**, killed; **David A. Russell = Brigadier General, U.S.**, killed. (Wikipedia; corroborate against ABT/NPS before stamping in-scenario.)
- **Monocacy:** **Lew Wallace = Major General, U.S.** (the delaying commander); **James B. Ricketts = Brigadier General, U.S.** (the VI Corps division lent to Wallace). (ABT-cited.)

## 5. Terrain And Objective Landmarks

- **Cedar Creek:** **Cedar Creek** (the pre-dawn crossing), **Belle Grove** plantation (Sheridan's HQ, the fight's namesake and reference point), the **Valley Pike** (the axis of both the CS drive north and the US counterattack), **Middletown**, **Massanutten Mountain** (Gordon's concealed flank climb/observation), the **North Fork of the Shenandoah** (Gordon's crossing below Massanutten), **Cedar Creek Grade / Belle Grove camps** of Crook's VIII Corps, and the **stone walls / high ground north of Middletown** the CS held in the afternoon.
- **Third Winchester:** **Opequon Creek** (the US crossing east of town), the **Berryville Pike / Canyon** (the narrow US approach), **Red Bud Run** and the **Middle Field / First Woods**, **Star Fort** and the earthworks north of Winchester (the CS anchor turned by Crook + cavalry), and the **Valley Pike / Martinsburg Pike** escape route.
- **Fisher's Hill (teaching-leaning):** the **Fisher's Hill** ridge two miles south of **Strasburg**, **Tumbling Run** (the stream fronting the works), **Little North Mountain** (Crook's concealed flank march around the CS left), and the **Massanutten** anchoring the CS right.
- **Monocacy (teaching-leaning):** the **Monocacy River** and its **railroad bridge / Jug Bridge / stone bridge**, the **Georgetown Pike**, **Thomas (Araby) and Worthington farms**, and the **B&O Railroad** - the crossings Wallace held to buy Washington a day.
- **"The Burning" (teaching-only):** the barns, mills, and granaries from **Staunton to Winchester** - named honestly as civilian devastation, never as a map objective.

## 6. Teaching Cards And Anti-Lost-Cause Framing

- **"Sheridan's Ride: The Rally and the Myth."** The rally was REAL - Sheridan galloped ~15 miles from Winchester and re-formed a broken army into a counterattack. But **"Sheridan's Ride" is Thomas Buchanan Read's 1865 propaganda POEM** - a mythologized artifact, printed for the campaign season. Teach the two separately: the leadership fact stands; the poem is propaganda, not evidence. Do not let the poem's gloss dictate the scenario's tone.
- **"The Burning: Hard War Against Civilians."** Sep-Oct 1864 Sheridan systematically destroyed barns, mills, crops, and livestock to deny the Valley as a Confederate granary and invasion corridor - deliberate hard war whose cost fell on the Valley's farm families. Teach it HONESTLY with the civilian cost named (the repo already carries the `sheridan-burning` card in `data/hard-war.json`). **DIGNITY LINE: never a scored or gamified objective** - teaching card and codex only.
- **"The Man Who Invented the Lost Cause."** The Confederate commander beaten here, **Jubal Early**, became postwar the chief architect of the Lost Cause myth through the Southern Historical Society - manufacturing the "marble man" Lee and the "overwhelmed by numbers" alibi. The repo's `data/generals.json` already names this. The card teaches that the mythology was authored by the losers, on purpose - not neutral memory.
- **"Monocacy: The Battle That Saved Washington."** A US tactical DEFEAT that was a strategic win: Wallace's outnumbered force bought a day that let VI Corps reinforce Washington before Early arrived. Teaches that "who held the field" is not the same as "who won the campaign" - and is exactly why Monocacy resists the objective-hold scoreboard (Section 1).

## 7. D74 No-Fudge Risks

- **The Cedar Creek surprise temptation:** hard-coding the dawn rout with a `fireMult`/`powerMult`/`fudge` so the CS "surprise" reproduces. FORBIDDEN. It must EMERGE from accurate inputs: **fog ON** in P1 (the real pre-dawn river fog), pre-dawn low readiness for Crook's VIII Corps caught unentrenched in camp, and Gordon's concealed flank mass arriving on the exposed US left - the universal objective-hold model then yields the CS seize.
- **The Cedar Creek collapse temptation:** scripting "the Confederate army routs in the afternoon" or a forced US winner. FORBIDDEN. Encode the true ~32k-vs-21k US strength edge, Torbert's fresh cavalry on the disordered CS flank, and CS cohesion/reinforcement TIMING (the army had paused, some units scattered) - the collapse then emerges from OOB + timing + scoreWeight.
- **CASUALTY-DIRECTION TRAP (critical for THIS lane):** at Cedar Creek **US total casualties EXCEEDED CS** even though the US WON - the morning rout and captures loaded the US column. All three accountings agree on this direction: ABT facts box US 5,764 / CS 3,060 (total 8,824); Wikipedia infobox US 5,665 / CS 2,910 (total 8,575); NPS gives a lower ~7,682 total. Different totals, same direction - US bled more. So a naive "winner bleeds less / US losses < CS losses" direction guard is WRONG here and would falsely fail a correct build. The Cedar Creek casualty guard must be **direction-neutral** (or split by phase: P1 CS-favored losses on the US, P2 US-favored losses on the CS) - never "US < CS overall." Third Winchester is the opposite: US losses (5,020) exceeded CS (3,610) too - again the ATTACKER bled more, so do NOT guard "US < CS." Guard only the SYSTEM validations (cover reduces casualties, more guns = more fire, flank/surprise raises the struck side's losses), per D92.
- **The Fisher's Hill / Monocacy temptation:** inventing a per-battle switch to force the rout (Fisher's Hill) or to make a lost-field-but-won-time "victory" (Monocacy). FORBIDDEN and unnecessary - Fisher's Hill emerges from the 4:1 edge + the flank march; Monocacy stays teaching-leaning precisely because its lesson is not a scoreboard state.

## 8. Candidate Probe Teeth

- **No-fudge key rejection:** grep the new `data/cedar-creek.json` for `damage|dmg|fireMult|casualtyMult|lossMult|killMult|powerMult|fudge` and FAIL on any hit (also `fireMultiplier`).
- **Both-baselines gotcha (D86/D88/D90):** the new id `cedar-creek` MUST be added to BOTH `tools/probe-tactical-roster.mjs` EXPECTED and `tools/probe-custom-battle-builder.mjs` EXPECTED historical-registry baselines in the SAME commit; assert both lengths so a stale baseline fails loudly.
- **Cedar Creek two-phase structure:** assert exactly two phases; P1 "Gordon's Dawn Assault" (scoreWeight 1) with role attacker="CS"/defender="US" and `defaultFog` ON; P2 "Sheridan's Counterattack" (scoreWeight 3, decisive) with role attacker="US"/defender="CS" and fog OFF; **weights sum to 4 (1 + 3 DECISIVE)** - assert sum==4, NOT 5.
- **Landmark string assertions:** "Belle Grove", "Valley Pike", "Massanutten", "Cedar Creek", "Middletown" present; for the optional Winchester build "Opequon", "Berryville Pike", "Red Bud Run".
- **Rank-trap guards:** Sheridan encoded "Major General" (never Lt. Gen., no backdated Regular-Army grade); Early "Lieutenant General (temporary grade)" (never "Major General" - reject the ABT-facts-box label); Crook "Brigadier General" (never Maj. Gen. - his MG postdates the battle); Wright/Emory/Gordon/Ramseur = Maj. Gen.; Torbert/Custer/Merritt = Brig. Gen.
- **Casualty-DIRECTION guards (lane-specific, see Section 7):** do NOT assert "US losses < CS losses" for Cedar Creek or Third Winchester (the attacker/struck side historically bled more). Assert only system-validation direction: the surprised/flanked side takes disproportionate losses in the phase it is struck; cover reduces losses; more guns = more fire.
- **Ramseur death guard:** assert Ramseur's mortal wounding is TEACHING text/flavor only, with no scripted-death combat key.
- **Dignity guard:** assert no scenario object references "The Burning" as a scored objective; it may appear only in teaching/codex text.

## 9. Remaining Traps To Re-Verify Before Spec

*(2026-07-11 status: the Cedar Creek items below are RESOLVED by the §12 pre-spec research pass; the bullets are retained as the audit trail. Third Winchester items remain genuinely open for that follow-on build.)*

- **RESOLVED (§12.1):** Cedar Creek engaged strengths and casualty split - the ABT facts box (US ~31,945 / CS 21,000; casualties US ~5,764 / CS ~3,060, total 8,824) CONFLICTS on the TOTAL with NPS (~7,682) and Wikipedia's infobox (US 5,665 / CS 2,910, total 8,575; strengths 31,610 / 21,102 effectives) - but all three agree US casualties EXCEEDED CS, so the Section 7 direction guard is safe. → The CMH staff-ride OOB appendix now anchors strengths at unit grain (US per-corps; CS per-division); casualty guard stays DIRECTION-NEUTRAL; NPS's 7,682 has NO per-side split (confirmed) so ABT's 5,764/3,060 is the only split anchor.
- **STILL OPEN (Third Winchester only):** CS strength - ABT gives 15,200, other sources ~17,000; and confirm Rodes (CS, killed) and Russell (US, killed) against ABT/NPS before stamping.
- **RESOLVED (§12.2-12.3):** Cedar Creek corps-to-sector assignments in P2 - which CS divisions held which ground north of Middletown, and which US corps led the counterattack. → Counterattack axes CONFIRMED (XIX right · VI left · Merritt left flank · Custer far right · Crook reserve; Custer broke the CS left/Gordon first); the full CS west-to-east line order remains Inferred-grade (label it so in data).
- **RESOLVED (§12.4):** Gordon's flank-march composition and the exact fog/timing window. → Gordon's column (Gordon/Ramseur/Pegram) crossed at McInturff's + Bowman's Fords; Kershaw via Strasburg to Bowman's Mill Ford (waded 04:30 per CMH); Wharton up the Pike at Hupp's Hill; attack opened ~5:00 a.m. in fog.
- **RESOLVED (§12.5):** Sheridan's Regular-Army dates (BG Sep 20 1864; MG effective Nov 8 1864) - CONFIRMED by the 2026-07-11 default-refute pass; field grade at the battle = Maj. Gen. USV.
- **RESOLVED (§12.5):** Early's temporary-Lt.-Gen. wording and the May 31 1864 date - CONFIRMED (temporary grade under the CS temporary-general legislation; NPS bio row flipped to Verified in §3).

## 10. Verdict

**READY_FOR_SPEC.** The lane has a marquee engine-native build - **Cedar Creek as a T8 two-phase scenario with the attacker/defender roles reversing** (CS dawn seize -> US afternoon seize), grounded in three pages fetched this run (ABT Cedar Creek, ABT Third Winchester, NPS Cedar Creek) plus corroborating searches, with the full D74 no-fudge path specified (fog ON + camp-caught VIII Corps + flank mass in P1; strength edge + fresh cavalry + CS timing in P2; scoreWeights 1 + 3 = 4). Third Winchester is a strong single-phase or two-phase second. The rank traps are resolved from sources: Sheridan Maj. Gen. (no backdated Regular-Army grade), Early Lt. Gen. **temporary** (correcting the ABT facts-box "Major General" error via NPS), Crook Brig. Gen. (MG postdates the battle), Gordon/Wright/Emory/Ramseur Maj. Gen., Torbert/Custer/Merritt Brig. Gen. Three Verified anchors meet the two-source bar. A lane-specific hazard is flagged loudly: the historic US casualties EXCEEDED CS at both Cedar Creek and Third Winchester, so the usual "winner bleeds less" guard is inverted here and must be direction-neutral. "The Burning" is teaching-ONLY on dignity grounds; Monocacy stays teaching-leaning because its "won time, lost field" lesson does not map to an objective-hold scoreboard. Residual OOB/strength/sector items are listed in Section 9 for the spec pass.

## 11. Exact Next Recommended Slice

Write a **D### Cedar Creek two-phase spec + probe scaffold** (T8 two-phase, roles reversing: P1 CS dawn attacker-seize with fog ON, P2 US afternoon attacker-seize with fog OFF; scoreWeights 1 + 3 = 4), mirroring the `chattanooga-plan` build pattern - including the **direction-NEUTRAL** casualty guards (per Section 7, NOT "US < CS"), the no-fudge key-rejection grep, the rank-trap guards from Section 8 (especially Early Lt.-Gen.-temporary vs the ABT "Major General" error, and Crook Brig. Gen.), and the both-baseline registry updates for `cedar-creek`. Keep Third Winchester queued as the immediate follow-on; keep Fisher's Hill and Monocacy as teaching-leaning (build only if a later pass proves them; do not force them); keep "The Burning" a teaching card only (never a scored objective).

## Verification Notes (adversarial pass)

**Sources fetched and confirmed:**
- **ABT Cedar Creek** (https://www.battlefields.org/learn/civil-war/battles/cedar-creek) - CONFIRMED: date Oct 19 1864; strengths US 31,945 / CS 21,000; casualties US 5,764 / CS 3,060 (total 8,824); narrative calls both "Maj. Gen. Phil Sheridan" and "Maj. Gen. Jubal A. Early" - so the packet's claim that the ABT prose mislabels Early "Major General" is CORRECT.
- **NPS Cedar Creek** (https://www.nps.gov/articles/000/battle-of-cedar-creek.htm) - CONFIRMED verbatim ranks: "Lt. Gen. Jubal A. Early", "Brig. Gen. George Crook", "Maj. Gen. Philip H. Sheridan", "Maj. Gen. Horatio G. Wright", "Maj. Gen. William H. Emory", "Maj. Gen. John B. Gordon", "Maj. Gen. Stephen D. Ramseur"; the all-night march "along the base of the Massanutten"; Sheridan's "famous and dramatic ride from his headquarters in Winchester". NPS is the correct authority for Early Lt. Gen. and Crook Brig. Gen.
- **ABT Third Winchester** (https://www.battlefields.org/learn/civil-war/battles/third-winchester) - CONFIRMED: date Sep 19 1864; casualties US 5,020 / CS 3,610 (total 8,630); Sheridan/Early = Maj. Gen. in the facts box; Opequon Creek, Berryville Pike named. Facts-box "Forces Engaged 54,440" is the COMBINED total (39,240 US + 15,200 CS = 54,440); a naive read would mis-assign it - the packet's US 39,240 / CS 15,200 split is correct and corroborated by search.
- **Wikipedia Cedar Creek** (https://en.wikipedia.org/wiki/Battle_of_Cedar_Creek) - infobox US 5,665 (644/3,430/1,591) / CS 2,910 (320/1,540/1,050), total 8,575; strengths 31,610 / 21,102 effectives; Ramseur "mortally wounded and captured by the 1st Vermont Cavalry". Corroboration only, never a standalone anchor.
- **Rank-date searches** (Army Historical Foundation / Wikipedia / ABT bios): Sheridan Regular-Army BG dated Sep 20 1864 (one day AFTER Third Winchester) and Regular MG effective Nov 8 1864 (AFTER Cedar Creek) CONFIRMED; Crook MG of volunteers dated Oct 21 1864 (two days AFTER Cedar Creek) CONFIRMED; Early temporary Lt. Gen. May 31 1864 CONFIRMED.

**Corrections applied inline:**
1. **Casualty mis-attribution (the one substantive defect).** The packet claimed a "~7,682-total figure in ABT's own summary and Wikipedia." FALSE. 7,682 is the **NPS** total; Wikipedia's infobox gives **8,575** (US 5,665 / CS 2,910); ABT gives 8,824. Fixed in Section 3 (Wikipedia row), Section 7, and Section 9 to attribute each total to its real source, and added the load-bearing note that ALL THREE accountings agree US casualties exceeded CS (so the direction guard survives regardless of which total is chosen).
2. Section 3, Third Winchester row: added an explicit warning that the facts-box "Forces Engaged 54,440" is the combined two-side total, not one side, so an implementer does not mis-encode 54,440 as Union strength.
3. Section 3, NPS Cedar Creek row: noted NPS carries the lower ~7,682 total (vs ABT's 8,824) and marked both anchors re-fetched this pass.

**Flagged claims + safer implementation choice:**
- *Cedar Creek per-side casualty split:* three sources give three totals (ABT 8,824 / Wikipedia 8,575 / NPS 7,682) but the SAME direction (US > CS). Safer choice: encode OOB from the effectives (ABT 31,945 / 21,000 or Wikipedia 31,610 / 21,102 - both agree to within ~1%) and make the casualty guard **direction-only**, never a count gate (D74).
- *Early rank:* encode "Lieutenant General (temporary grade)" per NPS, and record that the ABT Cedar Creek AND Third Winchester facts boxes mislabel him "Major General." Do not carry his 1861 First Bull Run **Colonel** grade forward, and remember the CSA had no Lt. Gen. grade before Oct 1862.
- *Sheridan / Crook:* encode Sheridan "Major General" (USV) and Crook "Brigadier General" per NPS; both men's higher grades postdate the battles (Sheridan Regular BG Sep 20 / MG Nov 8; Crook MG Oct 21) - do NOT backdate them.
- *Rodes (CS, killed) / Russell (US, killed) at Third Winchester and Fisher's Hill/Monocacy strengths:* left cite-pending; corroborate against ABT/NPS text before stamping in-scenario.

**Anti-Lost-Cause / dignity check:** PRESENT and correct. "The Burning" is teaching-ONLY on the dignity line (never a scored objective) and named honestly as hard war whose cost fell on Valley farm families. Early is framed as the postwar ARCHITECT of the Lost Cause (the "marble man" Lee, the "overwhelmed by numbers" alibi), not laundered. "Sheridan's Ride" separates the real rally from Thomas Buchanan Read's 1865 propaganda poem. Ramseur's death is teaching-card flavor, never a scripted-death mechanic. Monocacy stays teaching-leaning (its "won time, lost field" lesson does not map to an objective-hold scoreboard). No massacre, atrocity, or Native-nation content in this lane, so no DO_NOT_BUILD_NOW dignity constraint applies.

**Ratified verdict: READY_FOR_SPEC.** Three reputable anchors were re-fetched and confirmed this pass (ABT Cedar Creek, NPS Cedar Creek, ABT Third Winchester), clearing the two-Verified bar; Section 9 carries six explicit remaining-traps bullets; the rank traps resolve cleanly from NPS; the two-phase scoreWeight arithmetic is correct (1 + 3 = 4, NOT 5); and the D74 no-fudge path (fog + camp-caught VIII Corps + flank mass in P1; strength edge + fresh cavalry + CS timing in P2) smuggles in no per-battle multiplier or forced winner. The one substantive defect (the 7,682 casualty mis-attribution) is corrected inline and does not affect buildability, because the casualty guard is direction-only and the direction is confirmed by all three sources.

## 12. Pre-Spec Research Addendum — 2026-07-11 (D374; Fable workflows wf_1c51d565-bc5 + wf_ed9fb1e2-cec, 19 agents, 0 errors; Sonnet gather → Opus default-refute → Opus critic)

This pass resolves every Cedar Creek item in §9 and corrects one §4 rank line (Emory). Method per
the Contract Relay: mechanical Sonnet gathers, Opus default-refute verification of every claim
against the fetched sources, an Opus completeness critic, Fable adjudication. Where sources
conflict, the refuter's verdict controls; anything not CONFIRMED below ships Inferred or is avoided.

### 12.1 Strengths at unit grain (the CMH staff-ride OOB appendix — see the §3 row)
- **US per corps:** VI 8,506 inf + 600 arty / 24 guns · VIII 4,000 + 200 / 16 · XIX 8,748 + 414 / 20 ·
  Kitching's Provisional Division 1,000 · Cavalry Corps 7,500 + 642 / 30 · **total 31,610 / 90 guns.**
- **CS per division** (31 Oct 1864 field-inspection returns with ~3,500 Cedar Creek losses added
  back; the page's own footnote flags "No official report is available" and an alternative estimate
  as low as 15,680 total): **Ramseur 2,442 · Pegram 2,013 · Gordon 2,227 · Kershaw 3,071 ·
  Wharton 1,421** (inf subtotal 11,174 + 1,101 arty / 40+ guns); cavalry **Lomax 3,121 ·
  Rosser 2,206**; **total 21,102.**
- Encoding law: every unit ships **"Verified identity; Inferred strength"** with the CMH table as the
  disclosed estimating basis (it is a post-battle reconstruction, not an Oct 19 morning report);
  ABT/NPS additionally put the ATTACKING CS force at ~14,000 engaged vs the ~21,000 army total —
  state as a range where player-facing. A same-day Oct 19 return does NOT exist in approved sources
  (OR Ser. I Vol. 43 returns unqueried — optional future lead). No division split may be presented
  as an exact battle-morning count.

### 12.2 Afternoon CS line + Getty's cemetery stand (P2 geometry)
- Halt line near **Miller's Mill / Miller Lane (modern Cougill Rd)** ~10:30 a.m., further delay at
  **Old Forge Road** ~11:00-12:30 (CONFIRMED). Getty's VI-Corps division fell back ~300 yds to the
  **Middletown cemetery hill** and repelled three successive assaults — **Pegram's division, then
  Ramseur-command NC regiments (43rd/45th/53rd NC + 2nd NC Bn), then Wharton** (CONFIRMED) — while
  Wheaton's and Keifer's divisions re-formed.
- The full CS west-to-east order (Gordon–Kershaw–Ramseur–Pegram–Wharton, Wharton east of the Pike)
  is **Inferred-grade only** (default-refute left it UNRESOLVED for Verified on Wikipedia-only
  support). Sector placement may use it; label Inferred; do not write a probe tooth on it.

### 12.3 Counterattack axes (CONFIRMED)
- Just before **4:00 p.m.**: **XIX Corps (Emory) Union right · VI Corps (Wright) left · Merritt's
  cavalry left flank · Custer far right · Crook's VIII in reserve.** The cavalry broke the CS left
  (Gordon) first. **Rosser** opposed Custer on the **Back Road (Cupp's Ford)**; **Lomax** operated
  via the Front Royal–Winchester Rd toward Newtown (cite the NPS unit battle-plan account or the VA
  DHR NHL nomination for the Rosser/Lomax movements — the shenandoahatwar article does not carry them).
- Pursuit prose stays COUNT-FREE: "recaptured the morning's lost guns and took most of Early's
  artillery and trains." The circulating 43-gun / 24-recaptured / ~200-wagon / ~1,000-prisoner
  figures did NOT survive default-refute against fetched approved pages; the Strasburg bridge
  collapse/jam is single-source (ccbf) — corroborate vs the OR before any Verified use.

### 12.4 Dawn assault (P1 geometry, CONFIRMED)
- Gordon's column (**Gordon/Ramseur/Pegram divisions**) crossed the North Fork at **McInturff's and
  Bowman's Fords** after the all-night march along the base of Massanutten; **Kershaw** moved through
  Strasburg to **Bowman's Mill Ford** and waded Cedar Creek unopposed at **04:30** (CMH); **Wharton**
  advanced up the Valley Pike at **Hupp's Hill**; the attack opened ~**5:00 a.m.** in fog, struck
  Thoburn's camp first, then Hayes/Kitching, then the XIX Corps camps, with VI Corps fighting the
  delaying withdrawal. Sheridan's HQ at Belle Grove was overrun.
- **Sheridan's ride (two-source, NPS):** departed Winchester ~9:00 a.m. on Rienzi with Maj. G. A.
  Forsyth, Capt. J. O'Keefe, ~20 troopers; **~12 miles** (the poem's "twenty miles away" is Read's
  1865 propaganda inflation — teach the split per §6); on the field ~10:30 a.m., attacked at 4 p.m.

### 12.5 Battle-date rank table (substantive grades; default-refute CONFIRMED unless noted)
- **US:** Sheridan **Maj. Gen. USV** (Regular BG Sep 20 1864 + Regular MG eff. Nov 8 1864 both
  post-battle — never backdate); Wright **Maj. Gen.** (army command that morning; Ricketts briefly
  VI Corps, then wounded — **Keifer, Col.**, took 3rd Division; Getty briefly held the corps);
  **Emory Brig. Gen. (Bvt. Maj. Gen.)** — the §4 correction; Crook **Brig. Gen.** (MG Oct 21 1864);
  Getty/Wheaton/Ricketts **Brig. Gen.** (Getty/Ricketts brevet-MG paperwork Dec 1864, post-battle);
  Dwight/Grover **Brig. Gen.**; **Torbert Brig. Gen. (Bvt. MG)** — the "Maj. Gen." labels on
  NPS/CCBF are courtesy usage, REFUTED as substantive; Merritt/Custer **Brig. Gen.**; **Powell Col.**
  (2nd Cav Div); **Thoburn Col.** (killed Oct 19 — DROP the "commission made out the day of his
  death" claim, the NPS bio does not state it); **Hayes Col.** (2nd/Kanawha Div, succeeded Duval);
  **Lowell Col.** (Reserve Bde under Merritt; wounded, kept command, mortally wounded, died Oct 20;
  his brigadier star was posthumous — he never held the grade in life). Kitching's grade: verify at
  spec time.
- **CS:** Early **Lt. Gen. (temporary grade, May 31 1864)**; Gordon **Maj. Gen.**; Kershaw
  **Maj. Gen.** (eff. May 18 1864); Ramseur **Maj. Gen.** (eff. June 1 1864 — mortally wounded near
  Miller's Mill in the collapse, two horses already shot under him; captured; died Oct 20 at Belle
  Grove — TEACHING FLAVOR ONLY, never a scripted-death mechanic); Pegram **Brig. Gen.** (his death
  is Hatcher's Run, Feb 1865 — later, not here); Wharton **Brig. Gen.** (eff. July 8 1863);
  **Rosser Brig. Gen.** (MG Nov 1 1864 post-battle; commanded Fitz Lee's division — Lee wounded at
  Third Winchester; the NPS OOB's "Maj. Gen. Rosser" is an ERROR, refute-confirmed); Lomax
  **Maj. Gen.** (Aug 1864).
- Brigade rosters (CONFIRMED, for OOB notes): Ramseur (Battle/Grimes/Cook/Cox), Kershaw
  (Conner/Humphreys/Wofford/Bryan), Pegram (Hoffman/Johnston/Goodwin), Gordon (Evans/Terry/York),
  Rosser (Wickham/Payne/Laurel), Lomax (Imboden/Johnson/McCausland/Jackson), Lowell = Reserve Bde
  under Merritt (Devin led a BRIGADE under Merritt — a fetched "Devin division" mention was a
  summarizer error, refute-killed).

### 12.6 The Fatal Halt — ships as an explicit DISPUTE (teaching card law)
- **Early's account** (quoted by the NPS Fatal Halt article): the army stopped because it was
  exhausted, disordered, and thinned by men plundering the captured camps.
- **Gordon's account** (Reminiscences ch. XXV, quoted by the same NPS article): the halt itself —
  "the fatal halting, the hesitation, the spasmodic firing… lost us the great opportunity" — and
  the **"glory enough for one day"** line attributed to Early, which exists ONLY via Gordon's
  postwar account: attribute to Gordon, never state as fact.
- Modern treatments (NPS; Mahr's "succession of delays") keep the dispute open. The teaching card
  must present BOTH primaries with attribution and leave the verdict to the player — this is the
  packet's anti-Lost-Cause §6 in action (Early authored the Lost Cause; his alibi here is part of
  that historiography lesson, but the plundering claim is not simply false either — the dispute IS
  the lesson).
- Timing for the scenario: halt ~9:30-10:30 a.m. over Gordon's objection; counterattack 4:00 p.m.
  The P2 "CS cohesion/reinforcement TIMING" input from §2 stays the honest mechanism; no mechanic
  may encode either commander's blame theory as fact.

### 12.7 Critic residue (what is still NOT citation-grade — avoid or label)
- Gun/wagon/prisoner capture counts (see 12.3) — avoid numbers.
- The CS west-to-east afternoon order (see 12.2) — Inferred label.
- The Strasburg bridge jam — single-source, corroborate before Verified.
- Kitching's exact grade; the exact Emory/Torbert brevet DATES (packet-note-grade only).
- Third Winchester's own §9 items remain open — untouched by this pass.
