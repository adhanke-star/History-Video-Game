# Franklin-Nashville (Hood's Tennessee Campaign) - Battle-Build Research Packet

**Status:** D327 durable battle-build research packet (docs only; no data/runtime/registry change).
**Lane:** franklin-nashville
**Verdict:** READY_FOR_SPEC

Hood's November-December 1864 invasion of Tennessee ends the Army of Tennessee as a fighting force: a bungled night at Spring Hill, a doomed frontal assault at Franklin that Hood himself ordered, and Thomas's methodical destruction at Nashville where USCT brigades helped shatter the line. Franklin (single-phase defender-hold) and Nashville (T8 two-phase) are both strong buildable candidates; Spring Hill is teaching-only.

## 1. Candidate Battles Ranked By Buildability

| Rank | Battle/Campaign | Buildable shape | Buildability | One-line why |
|------|-----------------|-----------------|--------------|--------------|
| 1 | Franklin (Nov 30 1864) | Single-phase defender-hold (Fredericksburg pattern); optional T8 two-phase to add the Carter House breach + Opdycke seal | High | US behind breastworks + abatis + two miles of open approach = the universal model produces the historic lopsided attacker loss with true OOB; cleanest single-fight in the lane. |
| 2 | Nashville (Dec 15-16 1864) | T8 two-phase (Dec 15 redoubts -> Dec 16 Shy's Hill / Peach Orchard Hill) | High | Two calendar days map cleanly onto two phases; huge US strength edge (85k v 55k) + hills/works + USCT pinning demonstration produce the collapse without any fudge. |
| 3 | Spring Hill (Nov 29 1864) | Campaign-teaching-only | Low | A non-battle / missed opportunity decided at night by command failure, not combat; no satisfying marker-scale fight exists to play. |

## 2. Recommended Playable Shape

**Franklin (top candidate) - single-phase defender-hold, Fredericksburg pattern (RECOMMENDED primary).**
- Roles: attacker = CS ("CS"), defender = US ("US"). US is the objective-holder behind the fortified main line.
- Objective: US holds the Columbia Pike breastworks / Carter House-cotton-gin salient against repeated CS frontal assaults; CS must seize the works.
- Engine-grain fit: objective-hold favors whoever has more bodies ON the objective + cover; give US the entrenchment/abatis + a strong defensive OOB so the historically probable US hold emerges. Fog OFF (this was a late-afternoon assault across open ground the defenders could see) so the attacker is not artificially aided; the density of the works, not fog, is the defender's edge. This is the honest Franklin: a slaughter of the attacker.
- **Optional T8 two-phase enhancement** (only if the single-phase build feels flat):
  - Phase 1 "The Two-Mile Advance & Main Line" (scoreWeight 3, DECISIVE): CS crosses open ground into the Columbia Pike works; US defender-hold. Historical lean US.
  - Phase 2 "Opdycke's Counterattack" (scoreWeight 1): model the brief Carter House garden breach and Col. Emerson Opdycke's reserve-brigade charge that seals the gap; US must restore the line with a fresh, concentrated brigade against disordered CS inside the works. Caution: a near-50/50 seal phase is bistable on the shared RNG - lean it clearly US (fresh brigade, strength edge, short approach) or keep single-phase.

**Nashville (second candidate) - T8 two-phase, US attacker both phases.**
- Roles: attacker = US ("US"), defender = CS ("CS") dug in on the hills.
- Phase 1 "December 15 - The Redoubts & Montgomery Hill" (scoreWeight 1): US demonstrates against the CS right along the Nashville & Chattanooga RR while A.J. Smith / Wood roll up Redoubts #1-#5 on the CS left; CS falls back ~2 miles. US attacker-seize; strength edge + open approach.
- Phase 2 "December 16 - Shy's Hill & Peach Orchard Hill" (scoreWeight 3, DECISIVE): Steedman's USCT brigades assault Overton/Peach Orchard Hill on the CS right (bloody repulse but pins the defenders); McArthur storms Shy's Hill (Compton's Hill) on the thinned CS left and the army collapses. To make the US attacker seize per engine-grain: massive strength edge, the USCT demonstration drawing CS reserves off the decisive flank, and a concentrated left-flank assault. Aggregate winner US by weighted score; the decisive phase carries the teaching.

## 3. Source Register

| Source | Use | URL | Confidence |
|--------|-----|-----|------------|
| American Battlefield Trust - Franklin (repo anchor, fetched + re-fetched D327) | Ranks, strengths (30k US / 33k CS present), casualties (2,326 US / 6,252 CS), Carter House / Columbia Pike / cotton gin, Opdycke, Cleburne = Maj. Gen., 14 CS commanders casualties | https://www.battlefields.org/learn/civil-war/battles/franklin | Verified |
| American Battlefield Trust - Nashville (repo anchor, fetched + re-fetched D327) | Two-day structure, Compton's/Shy's Hill, Peach Orchard Hill, redoubts, strengths (85k US / 55k CS), casualties (3,061 US / 6,000 CS), McArthur = Brig. Gen., USCT present | https://www.battlefields.org/learn/civil-war/battles/nashville | Verified |
| American Battlefield Trust - Spring Hill (repo anchor) | Missed-opportunity framing, Stanley/IV Corps, Forrest | https://www.battlefields.org/learn/civil-war/battles/spring-hill | cite-pending |
| Wikipedia - Battle of Franklin | Corroborates 6,252 CS / 2,326 US casualties; 14 generals casualties (6 killed, 7 wounded, 1 captured) | https://en.wikipedia.org/wiki/Battle_of_Franklin | cite-pending |
| Battle of Nashville Trust - Peach Orchard Hill | USCT identities: 12th, 13th, 100th USCT, 2nd Colored Brigade under Steedman | https://www.battleofnashvilletrust.org/peach-orchard-hill/ | cite-pending |
| Iron Brigader - 13th USCT at Nashville | ~40% casualties in the 13th USCT at Overton/Peach Orchard Hill, 5 color bearers | https://ironbrigader.com/2022/12/10/the-assault-of-the-13th-united-states-colored-troops-usct-at-the-battle-of-nashville-december-1864/ | cite-pending |
| HistoryNet - "The Myth of the 5 Dead Rebel Generals" | Disputed count nuance: 5 killed at/near field + Carter mortally wounded (died Dec 10) = 6 dead | https://historynet.com/the-myth-of-the-5-dead-rebel-generals-february-1998-civil-war-times-feature/ | cite-pending |

## 4. OOB And Rank Traps

- **John Bell Hood** - **RANK TRAP.** On both battle dates his grade was **General (TEMPORARY grade), C.S.A., commanding the Army of Tennessee** (temporary full-general appointment of July 18 1864, never confirmed by the Confederate Congress and later rescinded). His **permanent** grade remained **lieutenant general**. Sources split ("Lt. Gen." vs "Gen."); encode as "General (temporary grade)" and record the dispute. Do NOT treat him as a confirmed permanent Confederate full general. (Note: the CSA lieutenant-general grade did not exist before Oct 1862 - irrelevant to these 1864 dates, but the general principle holds for the game's earlier lanes.)
- **John M. Schofield** - **Major General, US**, commanding the Army of the Ohio (XXIII Corps) with the attached IV Corps at Franklin. Not a lieutenant general. He is the defender/objective-holder at Franklin. (ABT-confirmed "Major General John M. Schofield.")
- **George H. Thomas** - **Major General, USV**, overall US commander at Nashville. TRAP: his Regular-Army full major-generalcy was awarded FOR Nashville (Dec 15 1864) - do not backdate a later rank or the Thanks of Congress onto the OOB. (ABT-confirmed "Maj. Gen. George H. Thomas.")
- **David S. Stanley** - **Major General, US**, commanding **IV Corps** at Franklin (wounded there). At Nashville, IV Corps passed to **Maj. Gen. Thomas J. Wood** - do not leave Stanley commanding IV Corps at Nashville.
- **Nathan Bedford Forrest** - **Major General, C.S.A.**, cavalry. TRAP: at **Nashville he was DETACHED toward Murfreesboro and largely absent from the main field** - do not place Forrest on the Nashville battle map. His cavalry screen matters at Spring Hill/Franklin, not the Nashville decision. (Not independently fetched in the D327 pass; historically well-established; keep as a Section 9 re-verify item.)
- **James B. Steedman** - **Major General, US**, commanded the Provisional Detachment / USCT brigades at Nashville (the Peach Orchard Hill assault). **John McArthur** - **Brig. Gen., US**, led the decisive Shy's Hill charge Dec 16. (ABT-confirmed "Brig. Gen. John McArthur.")
- **The Franklin dead generals** - **Patrick Cleburne = Major General (division commander)**, killed (ABT-confirmed as Major General). **John Adams, Hiram B. Granbury, States Rights Gist, Otho F. Strahl = Brigadier Generals**, killed. **John C. Carter = Brigadier General**, mortally wounded Nov 30, died Dec 10. TRAP: do not inflate the brigadiers to major general; record the "5 killed on field + Carter mortally wounded = 6" nuance rather than a flat "6 killed instantly."
- Wrong-corps/attachment guard: confirm which IV Corps divisions (Wagner, Kimball, Wood) held which sector at Franklin, and that XXIII Corps anchored the line, before encoding brigades.

## 5. Terrain And Objective Landmarks

- **Franklin:** the **Carter House** and garden (breakthrough point), the **Carter cotton gin**, the **Columbia Pike** (axis of the main assault), the **Lewisburg Pike**, the US **breastworks / main line** with an **Osage-orange abatis**, **Winstead Hill** (Hood's launch point and observation), the **two miles of open ground**, the **Harpeth River** and **Fort Granger**, and **Carnton plantation** (McGavock house, field hospital / cemetery - teaching, not an objective).
- **Nashville:** **Shy's Hill / Compton's Hill** (CS left anchor - decisive Dec 16 assault), **Peach Orchard Hill / Overton Hill** (CS right - USCT assault), **Montgomery Hill**, **Confederate Redoubts #1-#5** (Dec 15, CS left), the **Granny White Pike** and **Franklin Pike** (CS escape routes), the **Nashville & Chattanooga Railroad** (Dec 15 demonstration axis), and the **Cumberland River** behind the US works.
- **Spring Hill (teaching-only):** the **Columbia Turnpike / Pike** (the road Hood failed to close), the **crossroads**, **Rippavilla plantation**, and **Rutherford Creek**.

## 6. Teaching Cards And Anti-Lost-Cause Framing

- **"Hood's Charge, Not a Noble Tragedy."** Franklin was a frontal assault across two miles of open ground that **Hood himself ordered** against fortified infantry - a command decision, reportedly made in anger over the Spring Hill escape. Name it plainly: the Army of Tennessee was destroyed by its own commander, not by fate. Reject the "gallant lost cause" gloss.
- **"The Six Generals."** Cleburne (arguably the army's best division commander) and five other general officers died; 55 regimental commanders fell. The card teaches the cost of the assault as a leadership catastrophe, framed as the predictable result of ordering men against breastworks - not as heroic martyrdom.
- **"The Negro Will Fight."** At Peach Orchard/Overton Hill the 12th, 13th, and 100th USCT charged uphill into a repulse (~40% casualties in the 13th, five color-bearers lost) and by pinning the CS right helped enable the Shy's Hill breakthrough. Center Black agency and the strategic value of their assault; quote Thomas's after-action acknowledgment as evidence, not as a white officer's gift of validation. Dignity rule: the USCT repulse is taught as sacrifice and contribution, never scored as a "failed" objective the player is punished for.
- **"Spring Hill: The Night the Army Was Lost."** A teaching interstitial on how command breakdown (not enemy prowess) let Schofield's whole army march past a sleeping Confederate host - the cause of the Franklin disaster the next day.

## 7. D74 No-Fudge Risks

- **The Franklin temptation:** forcing the lopsided ~6,252 CS vs ~2,326 US casualties (or the "six dead generals") with a per-battle `casualtyMult` / `killMult` / scripted-death switch. FORBIDDEN. It must EMERGE: US entrenched behind breastworks + abatis, a two-mile open approach with no fog cover for the attacker, fog OFF, and a defensive OOB with adequate bodies on the works - the universal objective-hold model then produces heavy attacker loss on its own. General deaths are teaching-card flavor, never a mechanic.
- **The Nashville temptation:** hard-coding "the Confederate army collapses / routs" or a forced winner. FORBIDDEN. Encode the true 85k-vs-55k strength edge, the CS hilltop works, the two-day attrition, and the USCT demonstration that pulls CS reserves off the decisive left flank; the collapse then emerges from OOB + terrain + timing + scoreWeight.
- **The Spring Hill temptation:** inventing a `fireMult`/`fudge` to simulate "confusion" so the historic non-fight reproduces. FORBIDDEN and unnecessary - it stays teaching-only, so no combat parameters exist to tune.

## 8. Candidate Probe Teeth

- **Franklin single-phase:** assert one phase; role attacker="CS", defender="US"; landmark strings present: "Carter House", "Columbia Pike", "cotton gin" / breastworks; casualty-DIRECTION guard: CS losses > US losses at a fair-tactics baseline.
- **Franklin optional two-phase:** assert phases named "The Two-Mile Advance & Main Line" (scoreWeight 3, decisive) and "Opdycke's Counterattack" (scoreWeight 1); weights sum to 4 (3 DECISIVE + 1).
- **Nashville two-phase:** assert phase names "December 15 - The Redoubts & Montgomery Hill" (weight 1) and "December 16 - Shy's Hill & Peach Orchard Hill" (weight 3, decisive); weights sum to 4 (1 + 3 DECISIVE); roles attacker="US"/defender="CS"; landmark strings "Shy's Hill" / "Compton's Hill", "Peach Orchard Hill" / "Overton Hill", "Granny White Pike".
- **USCT presence guard:** Nashville decisive phase OOB includes United States Colored Troops under Steedman (assert generic USCT presence; the specific 12th / 13th / 100th regiment list is gated on second-source confirmation - see Section 9).
- **Rank-trap guards:** Hood encoded as "General (temporary grade)" not permanent full general; Schofield = Maj. Gen.; Thomas = Maj. Gen. (no backdated Regular-Army rank); Stanley = IV Corps at Franklin only; **Forrest absent from the Nashville field**; Cleburne = Maj. Gen., the five others = Brig. Gen.
- **No-fudge key rejection:** grep the new scenario JSON for `damage|dmg|fireMult|casualtyMult|lossMult|killMult|powerMult|fudge` and FAIL on any hit.
- **Registry/baseline gotcha (D86/D88/D90):** update BOTH the scenario-count baseline and any battle-registry/index baselines in the same commit; assert the new registry length in the probe so a stale baseline fails loudly.

## 9. Remaining Traps To Re-Verify Before Spec

- Hood's exact rank wording and date of the temporary-general appointment (July 18 1864) - confirm against the Official Records / a Hood biography before stamping Verified in-scenario; sources conflict between "Lt. Gen." and "Gen." (not independently fetched in the D327 pass).
- Franklin CS engaged strength: ABT lists 33,000 CS *present*, but the actual ASSAULTING force was ~18,000-20,000 (Cheatham + Stewart; Lee's corps and most artillery not yet up). Encode the attacking OOB at the assaulting figure, not the 33,000 total. Pin a defensible per-side figure for the OOB.
- Exact IV Corps / XXIII Corps division-to-sector assignments at Franklin (Wagner, Kimball, Wood, Cox) and which brigade held the Carter House salient.
- Nashville CS corps/hill assignments Dec 16 (Cheatham, Stewart, Lee) and which held Shy's Hill vs Peach Orchard Hill; confirm Steedman's full USCT brigade composition (Thompson's brigade) and the demonstration timing. The fetched ABT page confirms generic "United States Colored Troops" but does NOT enumerate the 12th/13th/100th or name Steedman - open the Battle of Nashville Trust Peach Orchard Hill page before encoding regiment-level identity.
- Casualty subtotals: corroborate the Franklin and Nashville killed/wounded/missing splits against a second reputable source (ABT re-fetched and confirmed D327: Franklin 189/1,033/1,104 US and 1,750/3,800/702 CS; Nashville totals 3,061 US / 6,000 CS; the Wikipedia/BONT figures remain cite-pending until opened).
- Confirm the exact number and naming of the Dec-15 CS redoubts (#1-#5) for landmark strings.
- Forrest's Nashville absence (detached toward Murfreesboro) - well-established but not independently fetched in the D327 pass; confirm before stamping in-scenario.

## 10. Verdict

**READY_FOR_SPEC.** The lane has two clean, engine-native builds - Franklin as a single-phase defender-hold (Fredericksburg precedent) and Nashville as a T8 two-phase - both grounded in fetched, citation-grade ABT pages (re-fetched and confirmed in the D327 adversarial pass) plus corroborating sources, with the D74 no-fudge path (entrenchment + open approach + strength edge + USCT demonstration + scoreWeight) fully specified. The rank traps (Hood's temporary grade, Forrest absent at Nashville, the brigadier-vs-major-general death list, Stanley's corps handoff) are identified for the implementer. Two Verified anchors (ABT Franklin + ABT Nashville) independently confirm the strengths, casualty direction, and key commander ranks, so the two-confirmable-sources bar is met; the single probe-teeth arithmetic error (scoreWeights summing to 4, not 5) is corrected inline. Residual unknowns (exact assaulting strengths, division-to-sector assignments, USCT regiment identities, casualty subtotals) remain and are listed in Section 9, so the spec pass must re-verify OOB detail before encoding.

## 11. Exact Next Recommended Slice

Write a **D### Franklin single-phase spec + probe scaffold** (defender-hold, US behind Columbia Pike breastworks, CS attacker across open ground, fog OFF), mirroring the `chattanooga-plan` build pattern - including the casualty-direction guard, the no-fudge key-rejection grep, the rank-trap guards from Section 8, and both-baseline registry updates. Keep Nashville queued as the immediate follow-on two-phase build; keep Spring Hill as a teaching card only (do not build a scenario).

## Verification Notes (D327 adversarial pass)

**Sources fetched and confirmed (2 Verified anchors):**
- **ABT Franklin** (https://www.battlefields.org/learn/civil-war/battles/franklin) - CONFIRMED: date Nov 30 1864; US 30,000 / CS 33,000 present; casualties US 2,326 (189 k / 1,033 w / 1,104 m) and CS 6,252 (1,750 k / 3,800 w / 702 m); Schofield = Major General; Hood = General; **Cleburne = Major General**; "fourteen Southern commanders become casualties"; Opdycke's brigade ~200 yds behind the Carter House charged forward to seal the gap; Columbia pike and Carter House named.
- **ABT Nashville** (https://www.battlefields.org/learn/civil-war/battles/nashville) - CONFIRMED: dates Dec 15-16 1864; US 85,000 / CS 55,000; casualties US 3,061 / CS 6,000; Thomas = Maj. Gen.; **McArthur = Brig. Gen.** charged and broke the line at Compton's Hill; Redoubts #1-#5 on the CS left fell Dec 15; Peach Orchard Hill repulsed a four-brigade Union attack; Compton's Hill (renamed Shy's Hill after Col. William Shy, 20th TN); USCT present in the assault force. (Forrest and Steedman not named on this page.)

**Corrections applied inline:**
1. Section 8, Franklin two-phase: "weights sum to 5" -> "weights sum to 4" (scoreWeights 3 + 1 = 4). A probe asserting sum==5 would falsely fail a correct build.
2. Section 8, Nashville two-phase: "weights sum to 5" -> "weights sum to 4" (scoreWeights 1 + 3 = 4). Same defect.
3. Section 3 source register annotated with the D327 re-fetch confirmations; Section 9 updated to record the confirmed ABT casualty splits and to flag the Franklin assaulting-strength (~18k-20k) vs total-present (33k) distinction and the un-enumerated USCT regiments.

**Flagged claims + safer implementation choice:**
- *Franklin CS strength 33,000:* that is total present, not the assaulting force (~18k-20k). Encode the assaulting OOB at the smaller figure or the lopsidedness is understated. (Section 9 item.)
- *13th USCT ~40% casualties / 5 color-bearers (Iron Brigader blog):* single non-scholarly source, uncorroborated by the two anchors. Keep cite-pending, teaching-flavor only, never a scored mechanic.
- *12th/13th/100th USCT under Steedman (BONT):* the fetched ABT page confirms only generic "USCT." Keep the regiment list and Steedman cite-pending; the USCT-presence probe should assert generic USCT presence, with the specific regiment list gated on opening the BONT page.
- *Hood temporary-grade nuance + Forrest detached at Nashville:* both historically correct but not independently fetched here; retained as rank-trap guards and Section 9 re-verify items.

**Anti-Lost-Cause / dignity check:** PRESENT and correct. Franklin is framed as Hood's own command failure ("destroyed by its own commander, not by fate"), the six-generals card as a leadership catastrophe rather than martyrdom, and the USCT card centers Black agency with an explicit dignity rule (the repulse is taught as sacrifice/contribution, never scored as a punished "failed" objective). No massacre content in this lane, so no Fort-Pillow DO_NOT_BUILD_NOW constraint applies.

**Ratified verdict: READY_FOR_SPEC.** Two reputable sources are confirmable (ABT Franklin + ABT Nashville), the remaining traps are explicit in Section 9, the anti-Lost-Cause and USCT-dignity framing is present, and the lane contains no massacre-only playable content. The one substantive defect found (the scoreWeight arithmetic in Section 8) is corrected inline and does not affect buildability.