# Naval & River Battles - Battle-Build Research Packet

**Status:** D327 durable battle-build research packet (docs only; no data/runtime/registry change).
**Lane:** naval-river
**Verdict:** READY_FOR_SPEC

This lane splits cleanly: the project has a LAND brigade engine only, so ship-vs-ship actions (Hampton Roads, Mobile Bay, the ironclad duels) are teaching-only until a naval mode exists, while the COMBINED land siege at Fort Donelson is a first-class T8 multi-phase candidate that teaches the war-winning river theater without a single ship model on the board.

## 1. Candidate Battles Ranked By Buildability

| Rank | Battle/Campaign | Buildable shape | Buildability score | One-line why |
|------|-----------------|-----------------|--------------------|--------------|
| 1 | Fort Donelson (Feb 11-16 1862) | T8 multi-phase (land) | High | Combined land siege: Union investment -> CS breakout sortie -> Union counterattack/surrender; all land brigades, decisive teaching payload ("Unconditional Surrender" Grant, heartland opened). |
| 2 | Island No. 10 / New Madrid land side (Feb 28-Apr 8 1862) | Single-phase (land) or campaign-teaching-only | Med | The New Madrid investment + Tiptonville cutoff is land-fightable, but the decisive action was gunboats running the batteries + a canal bypass - the *battle* is naval-engineering, so best as teaching-only unless a thin land skirmish is desired. |
| 3 | Fort Henry (Feb 6 1862) | campaign-teaching-only | Low | An almost pure gunboat bombardment; the garrison was evacuated to Donelson and only artillerists stayed - no land brigade fight to build. |
| 4 | Hampton Roads (Mar 8-9 1862, Monitor vs Virginia) | needs-new-naval-engine | Low (DO_NOT_BUILD_NOW as tactical) | Pure ironclad duel; no land engine can represent it. Strong TEACHING candidate only. |
| 5 | Mobile Bay (Aug 5 1864) | needs-new-naval-engine | Low (DO_NOT_BUILD_NOW as tactical) | Fleet-vs-fort-and-ironclad passage; "Damn the torpedoes." Teaching-only until naval mode. |
| 6 | Vicksburg-support river actions (running the batteries, Grand Gulf, Apr 1863) | needs-new-naval-engine / already-covered | Low | Ship-vs-battery passages; the land side is already served by the shipped 3-phase Vicksburg siege. Teaching-only. |

Tactical-battle candidates: Fort Donelson (yes), Island No. 10 land side (marginal). Teaching-only: Fort Henry, Hampton Roads, Mobile Bay, the river-passage actions.

## 2. Recommended Playable Shape

**Top candidate - Fort Donelson (T8 multi-phase, 3 phases).** Roles: top-level attacker = US (Grant), defender = CS (Floyd/Pillow/Buckner). The battle's real drama is a *reversal* - the defender nearly breaks out, then throws it away - which maps perfectly onto phased scoring.

- **Phase 1 - "The Investment / Feb 13 probes" (scoreWeight 1).** US objective: close the landward ring around the earthworks (Union invests; CS holds rifle pits). Historical lean: CS defensive hold. Engine-grain: defender has works + rising ground, so per D90 give CS breastworks + hill + cautious to hold; keep US probing, not required to seize. fog can be ON (defender-aiding) to match the confused, snowy investment.
- **Phase 2 - "The Breakout Sortie / Feb 15" (scoreWeight 3, DECISIVE).** Roles invert in intent: CS is the ATTACKER trying to open the Charlotte Road escape against the US right. Objective: seize the road exit. Per D90 attacker-seize recipe, give the CS assault a local strength edge + open approach on the US right and a thin US left-flank defense so the sortie can historically succeed - then the design lets the PLAYER decide whether the CS exploits it or (as Floyd did) throws it away. fog OFF + open/rolling approach so the attacker can actually win. This is the decisive phase because the war-turning lesson is that the CS *won the ground and abandoned it*.
- **Phase 3 - "The Recapture & Surrender / Feb 15 PM-16" (scoreWeight 1).** US objective: retake the lost works (Smith's assault on the CS right) and force the surrender. US strength edge + reinforcement timing; CS command paralysis modeled as *fewer bodies committed*, never a damage nerf.

scoreWeight logic: 1 + 3 + 1 = 5, decisive = the breakout (Phase 2) because that is where history was actually decided and where the teaching lives. A DRAW band still resolves via the weighted aggregate. Because phases share one RNG seed stream, each phase carries a clear historical lean (hold / attacker-can-seize / US recapture) rather than a coin-flip.

**Second candidate - Island No. 10 land side:** if built at all, a single-phase "New Madrid investment + Tiptonville cutoff" with US as attacker, CS (McCown/Mackall) as an outnumbered, escape-seeking defender. Recommend deferring to teaching-only; the decisive lever was naval/engineering (Carondelet running the island, the bypass canal), which the land engine cannot honestly represent.

## 3. Source Register

| Source | Use | URL | Confidence |
|--------|-----|-----|------------|
| American Battlefield Trust - Fort Donelson (repo anchor + fetched, re-fetched D327) | Ranks (Grant/Floyd/Pillow/Buckner Brig. Gen.; **Forrest Lt. Col.**; Foote Flag Officer), strengths (US 40,702 total; CS 16,171 total), casualties (US 2,691; CS 13,846 incl. 12,392 captured), terrain (Cumberland R., water batteries, Charlotte Road, Dudley's Hill) | https://www.battlefields.org/learn/civil-war/battles/fort-donelson | Verified |
| American Battlefield Trust - Hampton Roads (repo anchor) | Ironclad-duel framing; teaching-only justification | https://www.battlefields.org/learn/civil-war/battles/hampton-roads | cite-pending |
| American Battlefield Trust - Mobile Bay (repo anchor) | Farragut/Buchanan; "damn the torpedoes"; teaching-only justification | https://www.battlefields.org/learn/civil-war/battles/mobile-bay | cite-pending |
| ABT / Wikipedia - Fort Henry (search) | Foote's 7 gunboats, Tilghman surrender after ~75 min, garrison evacuated to Donelson | https://www.battlefields.org/learn/civil-war/battles/fort-henry | Verified |
| Wikipedia / NHHC - Hampton Roads (search + fetched D327) | Buchanan (Flag Officer) wounded before Mar 9; command to Lt. Catesby ap R. Jones (acting captain) Mar 9; Monitor Lt. John Worden; Cumberland 121 lost (~150 casualties total); tactical draw | https://en.wikipedia.org/wiki/Battle_of_Hampton_Roads | Verified |
| Wikipedia / Encyclopedia of Alabama - Mobile Bay (search + fetched D327) | Rear Adm. Farragut vs Adm. Buchanan; CSS Tennessee; Forts Morgan/Gaines/Powell; US ~328 cas. (151 k / 177 w), CS ~35 + ~1,587 captured; "Damn the torpedoes" is a disputed/late-recorded quote | https://en.wikipedia.org/wiki/Battle_of_Mobile_Bay | Verified |
| Wikipedia / NHHC - Island No. 10 (search) | Pope (Army of the Mississippi), Foote; McCown evacuates New Madrid; Mackall surrenders near Tiptonville Apr 8; ~7,000 prisoners | https://en.wikipedia.org/wiki/Battle_of_Island_Number_Ten | Verified |
| EBSCO / Britannica - Fort Donelson (search) | Cross-check on Floyd/Pillow flight, Buckner surrender, "Unconditional Surrender" | https://www.britannica.com/event/Battle-of-Fort-Donelson | Verified |
| Wikipedia - Fort Donelson (fetched D327, cross-check) | Confirms Forrest = Lt. Col.; Grant/Floyd/Pillow/Buckner = Brig. Gen. | https://en.wikipedia.org/wiki/Battle_of_Fort_Donelson | Verified |

## 4. OOB And Rank Traps

- **Ulysses S. Grant - Brigadier General (USV) at Donelson.** He was promoted to Major General of Volunteers *as a reward for* Donelson (dated Feb 16, 1862). A future implementer will be tempted to write "Maj. Gen. Grant" - WRONG for the battle date. He is Brigadier General on the field.
- **Andrew H. Foote - Flag Officer, U.S. Navy** (not "Admiral" - the U.S. Navy had no admiral grade yet in early 1862; the rank of rear admiral was created July 1862). Navy commander only; irrelevant to the land build but must not be miscast if named in a teaching card.
- **John B. Floyd - Brigadier General (CS),** ranking officer and nominal commander; fled Feb 16 before the surrender. Name the command failure plainly (see section 6).
- **Gideon J. Pillow - Brigadier General (CS),** second; also fled. His sortie opened the road, then he/Floyd threw the escape away.
- **Simon B. Buckner - Brigadier General (CS),** left holding the bag; surrendered "unconditionally." NOT a lieutenant general at Donelson - the CSA lieutenant-general grade was authorized only in Sept 1862 (first appointments Oct 1862), so any "Lt. Gen. Buckner" is a rank trap.
- **Nathan Bedford Forrest - Lieutenant Colonel (CS)** at Donelson, commanding cavalry; he escaped via the Charlotte Road rather than surrender. **CORRECTED (D327):** ABT and Wikipedia both give **Lt. Col.** at Feb 1862 - his promotion to full colonel came in March 1862, after the battle. Do NOT render him as a general (first star July 1862) AND do not elevate him to full colonel for this fight - he is Lieutenant Colonel.
- **Lloyd Tilghman - Brigadier General (CS)** - Fort Henry commander (relevant only to the Henry teaching card, not the Donelson build). Later killed at Champion Hill 1863; not present as a combatant leader at the Donelson fight.
- **Island No. 10 traps (if ever built):** **John Pope** was **Brigadier General** at the campaign's start and promoted **Major General of Volunteers (Mar 21, 1862)** mid-siege - state the date-specific rank. CS command changed hands: **Brig. Gen. John P. McCown** evacuated New Madrid, then **Brig. Gen. William W. Mackall** took over Island No. 10 in late March and surrendered Apr 8 - do not attribute the surrender to McCown.
- **Naval-lane rank traps (teaching cards):** **Franklin Buchanan - Flag Officer (CS Navy)** at Hampton Roads Mar 1862 (later "Admiral" at Mobile Bay 1864 - do not backdate the admiral title to 1862); **Catesby ap Roger Jones - Lieutenant** commanded Virginia on Mar 9; **John L. Worden - Lieutenant** commanded Monitor. **David G. Farragut - Rear Admiral** at Mobile Bay (he became the Navy's first full admiral in 1866 - do not backdate).

## 5. Terrain And Objective Landmarks

- **Fort Donelson:** the earthwork fort and its **river (water) batteries** on the **Cumberland River** bluff; the landward line of **rifle pits/earthworks**; **Dudley's Hill** (Feb 15 CS assault on the US right); the **Charlotte Road** (Wynn's Ferry / the escape route Forrest used); **Hickman Creek** and **Indian Creek** ravines bounding the works; the **Dover** town/landing behind the fort (surrender site). Map objectives: the road exit (Phase 2), the recaptured works (Phase 3), the fort/town (final).
- **Fort Henry (teaching):** low, flooding ground on the **Tennessee River**; Fort Heiman on the west bank; the point is that the fort was half-underwater - a naval, not land, story.
- **Island No. 10 (teaching / marginal land side):** **New Madrid, MO** and its bend; the **island itself**; the **bypass canal** across the neck; **Tiptonville, TN** (the cutoff/surrender point); Fort Pillow downstream as the next objective.
- **Hampton Roads (teaching):** the **roadstead** off Newport News Point; **Sewell's Point**, **Fort Monroe**, the grounded **Congress** and rammed **Cumberland** - naval geography only.
- **Mobile Bay (teaching):** **Fort Morgan / Fort Gaines / Fort Powell** at the bay mouth; the **torpedo (mine) field**; the channel Farragut forced.

## 6. Teaching Cards And Anti-Lost-Cause Framing

1. **"The River War Won the West."** Henry and Donelson (Feb 1862) cracked the Confederate defensive line and opened the **Tennessee and Cumberland rivers** - highways straight into the Confederate heartland, forcing the abandonment of Nashville and Kentucky. Frame the western river theater as *the* war-winning axis, countering the Lost-Cause fixation on Virginia.
2. **"Unconditional Surrender."** Grant's demand - "no terms except an unconditional and immediate surrender" - and the ~12,000-plus Confederates captured. Name it as the first large surrender of the war and the birth of Grant's reputation and doctrine.
3. **CS command failure, stated plainly.** Floyd and Pillow **abandoned their own men and fled** across the river the night before the surrender; Forrest rode out with his cavalry; **Buckner** was left to surrender. This is command collapse, not tragic nobility - refuse any "gallant defense betrayed by fate" gloss framing.
4. **The ironclad revolution (teaching, no gamified win).** Hampton Roads made every wooden navy in the world obsolete in a day. Present the Monitor-Virginia duel and Mobile Bay as *why the Union blockade held and tightened*, closing the last Gulf ports - a strangling of the slaveholding Confederacy's economy.
5. **Dignity rule.** No massacre content in this lane's core battles, but Fort Pillow (1864, downstream) is the atrocity that shadows the river war - if referenced, it is **memory and teaching of a massacre of Black US Colored Troops, never a "win" objective or a scored event.** Fort Pillow as a battle is DO_NOT_BUILD_NOW - it may exist only as a teaching card, never as a playable/scored engagement. Center Black agency in the river war (USCT garrisons and the Mississippi's role in emancipation's advance).

## 7. D74 No-Fudge Risks

The specific temptation in THIS lane is to fake a naval effect with a land-side combat modifier. Concretely a lazy implementer would want to:

- **Simulate Foote's gunboats / the water batteries with a per-battle `fireMult` or bombardment `damage` field.** FORBIDDEN. If naval bombardment matters to the land fight, it must enter as *accurate default artillery in the OOB* (real gun counts in the water batteries) firing the universal gun-fire-weight model, or as terrain/objective placement - never a battle-only firepower switch.
- **Force the historical lopsided surrender count (CS ~13,846 vs US ~2,691) with a `casualtyMult` or a winner gate.** FORBIDDEN by D74/D92. The huge CS "loss" was **prisoners taken on capitulation** (12,392 of the 13,846), not battlefield kills - it must emerge from the surrender/objective-capture mechanic (bodies trapped in the works), not a forced casualty ratio. Casualty *direction* is guarded in the probe, but the number follows the player's tactics.
- **Model Floyd/Pillow's paralysis as a CS `powerMult` debuff in Phase 3.** FORBIDDEN. Command collapse = **fewer CS bodies committed / later reinforcement timing / cautious doctrine**, all accurate-input levers, never a damage nerf.
- **Tune Phase 2 into a scripted CS breakout.** FORBIDDEN. Give the CS the *historical means* to seize the road (local strength edge + open approach per D90) and let the player choose the outcome - the teaching is that the CS *could* have escaped and didn't.

## 8. Candidate Probe Teeth

- Assert scenario has exactly 3 phases with names matching `/Investment/`, `/Breakout|Sortie/`, `/Recapture|Surrender/` (or the final chosen strings).
- Assert `scoreWeight` array = [1, 3, 1] summing to 5, decisive index = 1 (the breakout).
- Assert top-level roles: attacker `US`, defender `CS`.
- Assert landmark strings present: `Cumberland`, `Charlotte Road`, `Dudley's Hill`, `Dover`, `water batter` (batteries).
- Rank-trap guards: reject any occurrence of `Maj. Gen. Grant` / `Major General Grant` in this scenario's data; reject `Lt. Gen. Buckner` / `Lieutenant General Buckner`; reject `Gen. Forrest` / `General Forrest` AND `Col. Forrest` / `Colonel Forrest` (must be `Lt. Col.` at Feb 1862); reject `Admiral Foote`.
- No-fudge key rejection: grep the scenario JSON for the forbidden key families (`damage`, `dmg`, `fireMult`, `fireMultiplier`, `casualtyMult`, `lossMult`, `killMult`, `powerMult`, `fudge`) and fail on any hit.
- Casualty-direction guards: assert Phase 2 can resolve as a CS objective-seize (attacker-can-win), and that the aggregate can produce a US victory via captured/surrendered bodies, WITHOUT a forced numeric casualty target.
- Registry-baseline guards (D86/D88/D90 both-baselines gotcha): when the battle is added, update BOTH the scenario-count baseline and the phase/registry inventory baseline in the same commit, or the registry probe red-flags a phantom drift.

## 9. Remaining Traps To Re-Verify Before Spec

- **Phase-2 OOB granularity:** which specific CS brigades (Pillow's / Buckner's divisions) hit the US right on Feb 15, and which US division (McClernand's) took the blow - need brigade-level strengths to set the local edge honestly rather than eyeballing it.
- **US corps/division attachments Feb 14-16:** McClernand (right), Wallace (center), C.F. Smith (left) - confirm each division's brigade composition and arrival timing so the reinforcement lever is accurate, not invented.
- **Exact "engaged" vs "present" splits:** the ABT page fetched D327 gives US **40,702 total** and CS **16,171 total** but does NOT state the "24,531 engaged" figure quoted earlier in this packet - that number is **cite-pending** and must be pinned to a source (or dropped in favor of the ABT totals) before it sets OOB strength. Confirm the CS *combatant* strength net of the fled/escaped (Floyd's ~1,500, Forrest's cavalry) so Phase 3's trapped-garrison count is right.
- **Water-battery gun counts:** exact number/caliber of the river-battery guns (the 32-pdrs, the 10-inch columbiad, the rifled gun) if the naval bombardment is represented as OOB artillery - currently thin.
- **Weather/ground:** the Feb 14-15 snow/ice storm affected the fight; decide whether to model it as terrain/movement only (presentation-safe) and confirm it never becomes a combat modifier.
- **Island No. 10 land-side feasibility:** if it advances beyond teaching-only, verify there is a real land brigade action at New Madrid/Tiptonville worth building vs a naval-engineering non-event.

## 10. Verdict

**READY_FOR_SPEC** (for Fort Donelson only). Fort Donelson is a genuine combined-arms LAND battle with a clean 3-phase reversal arc, multiple Verified source-register entries (ABT fetched + re-fetched D327, plus Britannica/EBSCO/Wikipedia cross-checks) on ranks, strengths, casualties, and terrain, and a high-value anti-Lost-Cause teaching payload. The D327 adversarial pass confirmed the riskiest claims against two reputable sources each (ABT + Wikipedia) and corrected one factual error (Forrest = Lt. Col., not Col.) and one cite-pending strength figure (24,531 engaged). The residual unknowns in section 9 (brigade-level Phase-2 OOB, water-battery gun counts, trapped-garrison net strength, the engaged-strength source) are spec-refinement items, not blockers. Everything ship-vs-ship in the lane - Hampton Roads, Mobile Bay, Fort Henry, the river passages - is honestly **DO_NOT_BUILD_NOW as a tactical battle** and should ship as teaching cards until a naval mode exists. **Fort Pillow (1864) is DO_NOT_BUILD_NOW as a playable/scored battle** and may appear only as dignity-framed teaching.

## 11. Exact Next Recommended Slice

Write a **D### Fort Donelson 3-phase T8 spec + probe scaffold** in the same shape as the chattanooga-plan commit (D325 "plan ... battle build") - phases [Investment 1, Breakout/Sortie 3, Recapture/Surrender 1], roles US-attacker/CS-defender, the section-8 probe teeth (rank-trap greps including the corrected Forrest=Lt. Col. guard, no-fudge key rejection, casualty-direction guards, both-baselines registry update), and a resolve-before-code checklist for the section-9 OOB/gun-count/engaged-strength unknowns. Keep Fort Henry, Hampton Roads, and Mobile Bay as teaching-only cards; do not build them as tactical battles.

## Verification Notes (D327 adversarial pass)

**Fetched and confirmed (2+ reputable sources on every riskiest claim):**

- **American Battlefield Trust - Fort Donelson** (fetched): Dates Feb 13-16, 1862; Union 40,702 total, Confederate 16,171 total; Union casualties **2,691** (507 k / 1,976 w / 208 m&c); Confederate casualties **13,846** (327 k / 1,127 w / **12,392 m&c**); commanders **Brig. Gen. Grant**, **Brig. Gen. Floyd** (initial), **Brig. Gen. Buckner** (final surrender), **Brig. Gen. Pillow**, **Flag Officer Foote** (naval), **Brig. Gen. C.F. Smith**; and critically **"Lieutenant Colonel Nathan Bedford Forrest"** - contradicting the packet's original "Colonel." Terrain Cumberland River, Dudley's Hill, Charlotte Road, water batteries confirmed.
- **Wikipedia - Battle of Fort Donelson** (fetched, cross-check): confirms **Lt. Col. Forrest** and Brig. Gen. for Grant/Floyd/Pillow/Buckner. Two independent sources agree on Forrest = Lt. Col.
- **Wikipedia - Battle of Hampton Roads** (fetched): **Flag Officer Buchanan** wounded (shot in the thigh) and put ashore before Mar 9; **Lieutenant Catesby ap Roger Jones** acting captain of the Virginia Mar 9; **Lieutenant John L. Worden** commanded the Monitor; USS Cumberland "took 121 seamen down with her" (~150 total casualties); "the general verdict is that the overall result was a draw." All packet claims confirmed.
- **Wikipedia - Battle of Mobile Bay** (fetched): **Rear Admiral Farragut** vs **Admiral Buchanan (CS Navy, 1864)**; Forts Morgan/Gaines/Powell; CSS Tennessee; Union ~328 casualties (151 k / 177 w), Confederate ~35 (13 k / 22 w) + **1,587 captured**; the **"Damn the torpedoes"** quote is noted as disputed/late-recorded. Packet's "damn the torpedoes" framing is fine for a teaching card but should carry a "quote traditionally attributed / disputed" hedge.

**Corrections applied inline:**

1. **Forrest's rank: Colonel -> Lieutenant Colonel** (Section 4 OOB, Section 8 probe teeth, Section 3 source register). Confirmed by ABT AND Wikipedia. His full colonelcy dates to March 1862, after the battle. The probe now rejects both an over-elevation to general and an over-elevation to full colonel.
2. **"US 24,531 engaged" -> cite-pending** (Section 3, Section 9). The fetched ABT page gives Union 40,702 total only; the 24,531 engaged split is unsourced and must be pinned or dropped before it sets OOB strength.
3. **Buckner lieutenant-general trap wording tightened** (Section 4): the CSA grade was authorized Sept 1862 / first appointed Oct 1862, not flatly "created Oct 1862." Buckner is Brig. Gen. at Donelson regardless; the trap is unaffected.

**Flagged claims + safer implementation choices:**

- *Forrest = Colonel* -> render as **Lt. Col.**; probe rejects `Gen./General/Col./Colonel Forrest`, requires `Lt. Col.`
- *US 24,531 engaged* -> **cite-pending**; set Phase OOB from a pinned source or from the ABT-confirmed CS 16,171 / US 40,702 totals net of fled bodies.
- *"Damn the torpedoes"* -> present as a **traditionally-attributed / disputed** quote in the teaching card, not as verbatim fact.

**Anti-Lost-Cause / dignity check:** PASS. Section 6 states the CS command collapse plainly (Floyd/Pillow abandoned their men and fled; Buckner left to surrender), refuses the "gallant defense betrayed" gloss, frames the western river war as the war-winning axis against Virginia-centric Lost-Cause framing, and correctly quarantines Fort Pillow as dignity-framed teaching only (never a scored/playable event). This pass adds an explicit DO_NOT_BUILD_NOW flag on Fort Pillow as a battle in Sections 6 and 10.

**Ratified verdict: READY_FOR_SPEC (Fort Donelson only).** All riskiest claims survived adversarial fetch against 2+ reputable sources; the two defects found were correctable inline (one rank, one cite-pending strength) and are not blockers. Ship-vs-ship battles and Fort Pillow remain DO_NOT_BUILD_NOW as playable tactical/scored battles.