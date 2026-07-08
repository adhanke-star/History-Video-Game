# Atlanta Campaign & The March to the Sea - Battle-Build Research Packet

**Status:** D327 durable battle-build research packet (docs only; no data/runtime/registry change).
**Lane:** atlanta-march
**Verdict:** READY_FOR_SPEC (ratified by D327 adversarial pass)

The Atlanta Campaign gives the engine one near-perfect clean tactical build (Kennesaw Mountain, a frontal assault on entrenched high ground that historically FAILS) plus a decisive two-phase capstone (Jonesborough, whose fall hands Lincoln the 1864 election); the March to the Sea is campaign/teaching-only (hard-war logistics, no set-piece pitched battle) and its Black-agency story is refugees, Ebenezer Creek, and Special Field Orders No. 15 — not a USCT combat build.

## 1. Candidate Battles Ranked By Buildability

| Rank | Battle/Campaign | Buildable shape | Buildability score | One-line why |
|---|---|---|---|---|
| 1 | Kennesaw Mountain (Jun 27 1864) | Single-phase | High | Clean attacker-must-win-but-fails: US assaults CS on hill + breastworks; the objective-hold grain reproduces the historical repulse with zero fudge. |
| 2 | Jonesborough (Aug 31-Sep 1 1864) | T8 multi-phase (2) | High/Med | Day 1 CS assault repulsed -> Day 2 the one successful major Federal frontal assault of the campaign; decisive, and it IS the fall of Atlanta. |
| 3 | Battle of Atlanta (Jul 22 1864) | Single-phase or T8 (2) | Med | Dramatic (Hardee's night flank march, McPherson KIA) but the historical fight was a swirling double-envelopment that is hard to shape cleanly at brigade-marker grain. |
| 4 | Peachtree Creek (Jul 20 1864) | Single-phase | Med | Hood's first sortie; CS piecemeal attack on Thomas repulsed — clean but risks feeling like a lesser twin of Kennesaw/Ezra Church. |
| 5 | Ezra Church (Jul 28 1864) | Single-phase | Med/Low | Third CS-attack-repulsed in a row; strong lopsided casualties but high sameness risk with Peachtree Creek and Jonesboro Day 1. |
| 6 | Griswoldville (Nov 22 1864) | Single-phase (small) / teaching | Low | Georgia militia (old men and boys) slaughtered assaulting entrenched US infantry; grim and one-sided — better as a teaching card than a playable battle. |
| — | March to the Sea (Nov-Dec 1864) | Campaign / teaching-only | N/A | Hard-war maneuver and logistics, no pitched set-piece; teach via cards (foraging, destruction of war-making capacity, Ebenezer Creek, SFO No. 15), not a battle-build. |

Tactical-battle candidates: Kennesaw, Jonesborough, Atlanta (Jul 22), Peachtree Creek, Ezra Church. Teaching-only: March to the Sea (and Griswoldville is best left as a teaching card).

## 2. Recommended Playable Shape

**Top pick - Kennesaw Mountain (single-phase, Bull Run/Fredericksburg fallback pattern).**
- Roles: attacker = **US** ("US"), defender = **CS** ("CS"). This is the rare build where the player-as-attacker historically LOSES, which is exactly the teaching point.
- One coherent fight: Sherman's two-pronged assault (Pigeon Hill/Little Kennesaw on the north, Cheatham's Hill / the "Dead Angle" in the center) against Johnston's entrenched line. Objective = seize the ridge crest / breastwork line.
- Engine-grain fit: the objective-hold mechanic favors bodies-on-the-objective + cover + high ground. Give CS the hill, breastworks, and cautious posture with fog OFF (a daylight frontal assault, not a fog-of-war seizure); the US assault fails to dislodge and takes the heavier loss **because the inputs are true**, never because a number forces it. Casualty direction: US > CS by a wide margin (ABT-confirmed ~3,000 US vs ~1,000 CS — use as a DIRECTION guard, not a forced count).

**Capstone - Jonesborough (T8 two-phase).**
- Top-level roles attacker/defender = **US**/**CS**; the aggregate historical result is a US victory (the fall of Atlanta, Union occupation Sep 2 1864 — ABT/Wikipedia confirmed).
- Phase 1 - "Hardee's Assault, Aug 31" (scoreWeight 1): CS (Hardee + S.D. Lee) attacks Howard's Army of the Tennessee dug in west of Jonesborough along the Flint River; US defends and repulses. Objective: hold the Federal line. Casualty direction Aug 31: US light (~172-179) vs CS heavy (~1,700-2,200: Lee's corps ~1,400 + Cleburne's ~800).
- Phase 2 - "Breaking the Line, Sep 1" (scoreWeight **3, decisive**): S.D. Lee's corps has been pulled north toward Atlanta overnight (march ordered ~2 a.m. Aug 31), leaving Hardee's thinned single corps (under Cleburne); five converging US corps assault and breach Cleburne's division (Govan captured with ~600 men). Objective: seize the Confederate works astride the Macon & Western Railroad. This is the campaign's only successful major Federal frontal assault — model it with US mass (many divisions) + open approach + a thinned defender, per the D90 attacker-seizes recipe. Casualty direction Sep 1: US ~1,272-1,274 vs CS ~1,400 (incl ~900 prisoners).
- scoreWeight logic: [1, 3] (total 4 — the two-phase convention is decisive=3, other=1; the "total 5" rule applies to three-phase battles like Chattanooga's 1+1+3). Decisive phase = the Sep 1 breakthrough that severs the last railroad and forces the evacuation. Prefer a clear historical lean in each phase (shared-RNG bistability warning from Chickamauga) rather than a true 50/50.

## 3. Source Register

| Source | Use | URL | Confidence |
|---|---|---|---|
| ABT - Kennesaw Mountain | Commanders, strengths, casualties, terrain (Dead Angle, Pigeon Hill, Cheatham's Hill) | https://www.battlefields.org/learn/civil-war/battles/kennesaw-mountain | **Verified (fetched D327: Jun 27 1864; US 3,000 / CS 1,000; CS victory; Maney's TN brigade/Dead Angle/Little Kennesaw/Pigeon Hill all present; 150k/100k are campaign totals)** |
| ABT - Atlanta (battle facts) | Jul 22 battle, McPherson KIA, Hardee's flank march | https://www.battlefields.org/learn/civil-war/battles/atlanta | Verified (repo anchor) |
| ABT - Atlanta Campaign map | Campaign arc and sequence | https://www.battlefields.org/learn/maps/atlanta-campaign | Verified (repo anchor) |
| ABT - Peachtree Creek | Jul 20 attack, Thomas/Hardee/Stewart | https://www.battlefields.org/learn/civil-war/battles/peachtree-creek | cite-pending (repo anchor; returned 404 on fetch; NOT re-verified in D327 pass — re-verify slug or substitute NPS/Wikipedia before citing) |
| ABT - Jonesborough | Two-day fight, Sep 1 breakthrough, fall of Atlanta | https://www.battlefields.org/learn/civil-war/battles/jonesborough | Verified (repo anchor) |
| Georgia Historical Society - Ebenezer Creek marker | Dec 9 1864 atrocity, Jeff C. Davis, refugee drownings | https://www.georgiahistory.com/ghmi_marker_updated/march-to-the-sea-ebenezer-creek/ | cite-pending (search snippet; not fetched in D327 pass) |
| Wikipedia - Battle of Ezra Church | Jul 28 CS repulse, S.D. Lee/Stewart, casualties | https://en.wikipedia.org/wiki/Battle_of_Ezra_Church | cite-pending (search snippet) |
| Wikipedia - Battle of Jonesborough | Two-day sequence, Sep 1 breakthrough, Govan capture, casualties | https://en.wikipedia.org/wiki/Battle_of_Jonesborough | **Verified (fetched D327: Aug 31-Sep 1 1864; Hood=Gen, Hardee & S.D. Lee=Lt Gen, Howard=Maj Gen; Lee's corps withdrawn overnight; Sep 1 US ~1,272-1,274 vs CS ~1,400 incl ~900 prisoners; Aug 31 CS ~1,700-2,200; Govan +600 captured; Atlanta occupied Sep 2)** |
| Wikipedia - John Bell Hood | Command change Jul 18 1864, temporary full general, permanent Lt Gen | https://en.wikipedia.org/wiki/John_Bell_Hood | **Verified (fetched D327: promoted temporary full general Jul 18 1864; never Senate-confirmed; commission reverted to Lt Gen Jan 23 1865)** |

## 4. OOB And Rank Traps

- **John Bell Hood - THE rank trap.** Assumed command of the Army of Tennessee and was promoted to the **temporary rank of full General** on **Jul 18 1864** (fetch-confirmed). The temporary general grade was **never confirmed by the Confederate Senate**, and his commission **reverted to Lieutenant General on Jan 23 1865** — so his **permanent/substantive rank was Lieutenant General.** Many secondary sources (including ABT snippets seen here) call him "Lt. Gen." at Peachtree Creek/Atlanta/Ezra Church/Jonesborough — encode him as **General (temporary), CSA** for all battles from Jul 18 onward, and note the permanent-Lt.-Gen. wrinkle. He was NOT army commander at Kennesaw (division/corps command earlier in the campaign).
- **Joseph E. Johnston - General (full), CSA**, commanding the Army of Tennessee at Kennesaw; **relieved Jul 17 1864.** Do not carry him past Jul 17. (ABT Kennesaw page lists him as the CS commander; the rank is well-established.)
- **William T. Sherman - Major General, USA**, commanding the Military Division of the Mississippi (his higher regular-army grades post-date the campaign — do not back-date "General"/lieutenant general to 1864). (ABT lists him as the US commander; rank per established record.)
- **James B. McPherson - Major General, USA**, commanding the Army of the Tennessee; **killed Jul 22 1864.** Dead-officer-commanding trap: do NOT list him at Ezra Church (Jul 28) or Jonesborough.
- **John A. Logan - Major General, USA (XV Corps)** held **temporary** command of the Army of the Tennessee on Jul 22 only. **Oliver O. Howard - Major General, USA** took permanent command of the Army of the Tennessee ~Jul 27 (before Ezra Church; Howard=Maj Gen confirmed on the Jonesborough page). Wrong-commander trap for Jul 28/Aug-Sep.
- **George H. Thomas - Major General, USA** (Army of the Cumberland); **John M. Schofield - Major General, USA** (Army of the Ohio / XXIII Corps).
- **William J. Hardee - Lieutenant General, CSA** (corps commander; commanded the Jonesborough wing). (Lt Gen confirmed on the Jonesborough page.)
- **Alexander P. Stewart - Lieutenant General, CSA** — promoted **Jun 23 1864** to corps command after Polk's death; wounded at Ezra Church. Do not pre-date the lieutenant-generalcy before late June.
- **Stephen D. Lee - Lieutenant General, CSA** — promoted **Jun 23 1864**; arrived late July to take Hood's old corps; commanded a corps at Ezra Church and at Jonesborough (withdrawn north the night of Aug 31 — fetch-confirmed). (Lt Gen confirmed on the Jonesborough page.)
- **Patrick Cleburne - Major General, CSA** (division commander) — at Jonesborough he temporarily commanded Hardee's corps (notably Sep 1 with Lee's corps gone); **Daniel C. Govan - Brigadier General, CSA**, captured with ~600 of his brigade on Sep 1 (fetch-confirmed). Wrong-attachment trap: Cleburne is a division commander, elevated only situationally.
- **CSA lieutenant-general grade check:** the grade did not exist before Oct 1862; every Lt Gen here (Hardee, Stewart, S.D. Lee) is dated to 1862 or later (Stewart/Lee to Jun 23 1864) — no anachronism.
- **Strength caveat:** the "150,000 vs 100,000" ABT figures are whole-theater/army-group totals (fetch-confirmed on the ABT page), not troops engaged. Kennesaw's actual assault engaged a fraction (Sherman's assaulting columns ~a few divisions vs Johnston's ~63,000-man army). Encode true engaged strengths at the sector level, not the campaign totals.

## 5. Terrain And Objective Landmarks

- **Kennesaw Mountain:** Kennesaw Mountain (main peak), **Little Kennesaw**, **Pigeon Hill** (north assault), **Cheatham's Hill / the "Dead Angle"** (center; Maney's Tennessee brigade salient where men threw rocks — Maney/Dead Angle fetch-confirmed on the ABT page), Burnt Hickory Road, Dallas Road, the Confederate breastwork line above Marietta.
- **Peachtree Creek:** Peachtree Creek itself, Collier Road, Tanyard Branch, Clear Creek, the Federal crossing/ridge line north of Atlanta.
- **Battle of Atlanta (Jul 22):** **Bald Hill / Leggett's Hill**, the Georgia Railroad, the Troup Hurt house, the road toward **Decatur** (Wheeler's cavalry raid on the wagon train), the Union XVI/XVII Corps left-flank refusal.
- **Ezra Church (Jul 28):** Ezra Church (Meeting House), **Lick Skillet Road**, the hastily improvised log-and-pew barricades on the Union right.
- **Jonesborough:** the **Macon & Western Railroad** (the last supply line into Atlanta), the **Flint River** crossings west of town, the Confederate works around Jonesborough, the Sep 1 breach point in Cleburne's line.
- **March to the Sea (teaching):** Griswoldville, **Ebenezer Creek**, Milledgeville (state capital), Savannah (terminus), the M&W and Central of Georgia rail lines torn up as "Sherman's neckties."

## 6. Teaching Cards And Anti-Lost-Cause Framing

- **"The frontal-assault trap" (Kennesaw):** Sherman's own admission that the assault was a mistake teaches that entrenched high ground plus rifled muskets made 1864 frontal attacks murderous — this is a Union failure named plainly, not a Confederate "genius." The player feels it by losing the assault.
- **"Davis fires Johnston; Hood attacks and bleeds the army white":** Name the Confederate command failure squarely — Hood's aggressive sorties (Peachtree Creek, Atlanta, Ezra Church) cost the Army of Tennessee ~11,000 men in his first 11 days and did not save Atlanta. Reject the Lost-Cause framing of Hood as a gallant fighter; his offensives wrecked his own army.
- **"Atlanta and the 1864 election":** The fall of Atlanta on Sep 2 1864 (Union occupation fetch-confirmed) revived Northern morale and helped re-elect Lincoln over the peace-platform Democrats — tying a battlefield outcome directly to emancipation's political survival. This is the campaign's real strategic meaning.
- **"Black agency on the March":** Tens of thousands of enslaved people self-emancipated by attaching to Sherman's columns. Center them as actors, not scenery; the March's liberatory effect was driven by their own flight.
- **"Ebenezer Creek" (dignity rule):** On Dec 9 1864 Brig. Gen. Jefferson C. Davis (USA) cut the pontoon bridge and abandoned freed people (accounts vary; commonly cited as several hundred), many of whom drowned or were killed/re-enslaved by Wheeler's cavalry. This is **memory and teaching, never a gamified objective or "win"** — present it as an atrocity by a Union officer that outraged other Union soldiers and helped prompt **Special Field Orders No. 15** ("40 acres," issued Jan 16 1865). Hold the dignity rule strictly: no score, no player action, no reenactment of the drownings. Keep casualty figures as a sourced range in prose, not a stat.
- **Hard-war, not "needless barbarism":** Frame the March as a deliberate strategy against the Confederacy's war-making capacity (railroads, mills, foodstuffs, the psychology of secession) with real civilian hardship — refusing BOTH the Lost-Cause "wanton savagery against innocents" myth AND any sanitized "gentleman's war" gloss. State the documented limits (targeting infrastructure and provisions) and the documented harms honestly.

## 7. D74 No-Fudge Risks

- **Kennesaw's lopsided ratio is the #1 temptation.** A lazy implementer will want a `casualtyMult`/`lossMult` to force the ~3:1 US:CS bloodbath. Forbidden. It must EMERGE from: US attacking uphill across open ground into breastworks (cover asymmetry + slope in the shared terrain model), a cautious dug-in defender, and universal rifle/canister gun-counts firing into a dense assault column. If the ratio comes out too flat, fix the INPUTS (slope, cover value, defender gun counts, approach openness), never add a battle switch.
- **Jonesborough Sep 1 "the breakthrough" temptation.** Do not `powerMult` the US assault to guarantee the historical breach. Model it structurally: S.D. Lee's corps physically absent (withdrawn to Atlanta), Hardee's line thinned and overextended, US committing many divisions on an open approach — the seizure then follows the objective-hold grain honestly.
- **Hood-offensive "must-fail" temptation** (Peachtree Creek / Atlanta / Ezra Church): do not force the CS repulse with a winner gate. Give the defender the true edge (prepared/supported Federal line, timely reinforcement) and let the piecemeal CS attack fail on its own — and let the player who plays Hood better actually do better, since casualty ratios follow tactics, not a scripted number.
- **No "March to the Sea" combat build at all** — resist inventing pitched-battle stats or fictional USCT combat units to make the March "playable." It is teaching-only.

## 8. Candidate Probe Teeth

- Kennesaw: assert single-phase (no `phases[]`), roles attacker="US"/defender="CS"; assert landmark strings present (e.g. "Dead Angle" or "Cheatham's Hill", "Pigeon Hill", "Little Kennesaw").
- Kennesaw casualty-direction guard: US casualties > CS casualties AND US fails to seize the crest objective (the attacker-loses invariant).
- Jonesborough: assert `phases[]` length 2; phase names contain "Aug 31" and "Sep 1" (or equivalent); scoreWeights [1,3] summing to 4 (decisive Sep 1 = 3, Aug 31 = 1); decisive phase = Sep 1; aggregate winner = US.
- Jonesborough Sep 1 guard: US seizes the objective (breach) with US-favorable casualty direction on that phase; Phase 1 guard: CS assault repulsed (US holds, CS>US losses). Guard on DIRECTION only, not the exact counts (Aug 31 CS ~1,700-2,200; Sep 1 CS ~1,400 incl ~900 prisoners vs US ~1,272-1,274).
- Rank-trap guards: reject any record giving Hood a rank other than "General (temporary)" on/after Jul 18 1864; reject Johnston appearing at/after Jul 18; reject McPherson appearing at Ezra Church or Jonesborough; reject Stewart/S.D. Lee lieutenant-generalcy dated before Jun 23 1864; reject any CSA Lt Gen dated before Oct 1862.
- No-fudge key rejection: grep the scenario JSON for the forbidden key families (`damage`, `dmg`, `fireMult`, `fireMultiplier`, `casualtyMult`, `lossMult`, `killMult`, `powerMult`, `fudge`) and fail on any hit.
- Registry-baseline gotcha (D86/D88/D90): when the new scenario lands, update BOTH baselines (scenario registry count AND the phase/battle inventory) so the both-baselines probe does not false-fail.
- Terrain/objective landmark assertions per scenario (Bald Hill/Leggett's Hill for Jul 22, Lick Skillet Road/Ezra Church for Jul 28) if those get built later.

## 9. Remaining Traps To Re-Verify Before Spec

- **Kennesaw engaged strengths at sector grain** — pull the true assaulting-division strengths (Pigeon Hill columns vs Cheatham's Hill columns) and the specific CS brigades holding each (Maney's, Vaughan's, Cheatham's/Cleburne's sectors) from the Official Records or an NPS OOB; the ABT "150k/100k" totals are fetch-confirmed to be campaign totals and are unusable as engaged numbers.
- **Peachtree Creek slug** — the repo-anchor URL returned 404 and was NOT re-verified in the D327 pass; confirm the live ABT slug (or substitute the NPS/Wikipedia page) before citing.
- **Jonesborough Day-1 vs Day-2 OOB split** — confirmed at fetch level (Lee's corps ordered back to Atlanta ~2 a.m. Aug 31, leaving Hardee's thinned single corps under Cleburne Sep 1); still pull the precise brigade OOB so Phase 2's "thinned defender" input is historically exact, and keep Aug 31 vs Sep 1 casualty figures separated (do not conflate the ~2,200 Aug 31 CS loss into Sep 1).
- **Ezra Church command** — confirm Howard (not Logan) held Army of the Tennessee command on Jul 28 (Howard=Maj Gen already fetch-confirmed for Jonesborough), and Stewart's wounding, before any Ezra Church build.
- **USCT identities** — this lane has minimal USCT combat presence; do NOT encode USCT combat units without a citation. Re-verify whether any USCT (e.g. garrison/rear-area units) belong anywhere before adding them; default to none.
- **Ebenezer Creek figures** — the drowning/abandonment counts vary by source; keep as teaching-card prose with a range, not precise casualty stats, and source to Georgia Historical Society + a second reputable account (neither fetched in the D327 pass — both remain cite-pending).

## 10. Verdict

**READY_FOR_SPEC** (ratified) — for **Kennesaw Mountain as a single-phase build** and **Jonesborough as a two-phase T8 capstone**. Both now have fetch-confirmed reputable source-register entries (ABT Kennesaw fetched; Wikipedia Jonesborough fetched; Hood command/rank fetched), both map cleanly onto the existing engine grain without any D74 fudge (Kennesaw's repulse and Jonesboro's breakthrough emerge from terrain, entrenchment, and force ratios), and the anti-Lost-Cause spine (1864 election, hard war, Ebenezer Creek dignity rule) is well-framed. This is NOT massacre-only content — Griswoldville and Ebenezer Creek are correctly held as teaching-only, not playable. The residual unknowns in section 9 are sector-level OOB precision and two still-cite-pending March-teaching sources, not existential — they gate the spec's numbers and the March cards, not the decision to build Kennesaw/Jonesborough.

## 11. Exact Next Recommended Slice

Write a **D### Kennesaw Mountain single-phase spec + probe scaffold** (in the chattanooga-plan pattern): attacker="US"/defender="CS", the "attacker historically loses" casualty-direction + objective-hold guards, the Dead-Angle/Pigeon-Hill landmark strings, and the forbidden-key rejection grep — pulling true sector strengths from the Official Records/NPS OOB first (the ABT 150k/100k are confirmed unusable as engaged numbers). Hold Jonesborough as the immediate follow-on two-phase build; keep the March to the Sea as teaching-cards only (do not build).

## Verification Notes (D327 adversarial pass)

**Fetched and confirmed (3 authoritative URLs):**
1. **ABT — Kennesaw Mountain** (https://www.battlefields.org/learn/civil-war/battles/kennesaw-mountain): CONFIRMED date Jun 27 1864; casualties US 3,000 / CS 1,000 (US>CS direction holds); result Confederate Victory; Cheatham's Hill / "Dead Angle" / Brig. Gen. George Maney's Tennessee brigade / Little Kennesaw / Pigeon Hill all present. CONFIRMED the "150,000 / 100,000" figures are army-group/campaign totals (page-level), not troops engaged.
2. **Wikipedia — Battle of Jonesborough** (https://en.wikipedia.org/wiki/Battle_of_Jonesborough): CONFIRMED dates Aug 31–Sep 1 1864; Hood=Gen, Hardee & S.D. Lee=Lt Gen, Howard & Thomas & Sherman=Maj Gen; Lee's corps ordered back to Atlanta ~2 a.m. Aug 31; Sep 1 = "the only successful large-scale frontal assault in the Atlanta campaign"; Govan + ~600 men captured; railroad severance → Hood's evacuation → Union occupation Sep 2 1864. Casualties by day: Aug 31 US ~172-179 vs CS ~1,700-2,200 (Lee ~1,400 + Cleburne ~800); Sep 1 US ~1,272-1,274 vs CS ~1,400 incl ~900 prisoners.
3. **Wikipedia — John Bell Hood** (https://en.wikipedia.org/wiki/John_Bell_Hood): CONFIRMED promoted to temporary full general Jul 18 1864 and given the army outside Atlanta; the temporary grade was never Senate-confirmed and his commission reverted to Lieutenant General Jan 23 1865. Validates the packet's "General (temporary), CSA from Jul 18 onward; permanent Lt Gen" encoding.

**Corrections applied inline:**
- §3 register + §2 Phase 1/Phase 2: relabeled Jonesborough casualties by day. The packet's original register row ("Sep 1 casualties (US 1,274; Cleburne 911; Hardee ~2,200)") conflated Aug 31 and Sep 1 losses — the ~2,200 CS figure is the AUGUST 31 total. Corrected to Aug 31 CS ~1,700-2,200 vs Sep 1 CS ~1,400 (incl ~900 prisoners), US Sep 1 ~1,272-1,274.
- §4 Hood: added the fetch-confirmed revert date (Lt Gen, Jan 23 1865) and the "never Senate-confirmed" note; changed the command/promotion date wording to Jul 18 1864 throughout.
- §4: added an explicit CSA Lt-Gen anachronism check (grade did not exist before Oct 1862; all Lt Gens here are 1862+, Stewart/Lee to Jun 23 1864 — clean).
- §6 Ebenezer Creek: softened the fixed "600+" to "accounts vary; commonly several hundred" and added the SFO No. 15 issue date (Jan 16 1865), consistent with the packet's own §9 "keep as a range" instruction.

**Flagged claims + safer implementation choices:**
- Jonesborough Sep 1 casualty labeling (fixed above): encode Aug 31 and Sep 1 losses as SEPARATE per-phase casualty-DIRECTION guards, never a count-forcing gate (D74).
- Peachtree Creek ABT URL (404, not re-verified): keep cite-pending; do not cite until the live slug or a substitute is confirmed. Non-blocking (rank-4 candidate, not in the recommended build).
- Kennesaw 150k/100k strengths: confirmed to be campaign totals; must be replaced with sector-level engaged strengths from OR/NPS before any numbers enter the spec.
- Ebenezer Creek marker + Ezra Church Wikipedia: still cite-pending (not fetched this pass); source before building the relevant March teaching cards / any Ezra Church build.

**Main-loop final-verifier correction (D327):** the two-phase Jonesborough scoreWeight sum was fixed from "5" to **4** in §2 and §8 — a two-phase [1,3] build totals 4; the "total 5" convention is three-phase only (Chattanooga's 1+1+3). Recommendation only; no historical claim affected.

**Ratified verdict: READY_FOR_SPEC** for Kennesaw Mountain (single-phase) and Jonesborough (two-phase T8). Two of the two recommended builds have fetch-confirmed ≥2-source support (ABT + Wikipedia + Hood command source), rank/dead-officer/anachronism traps are explicit and check out, the D74 no-fudge risks are named, the anti-Lost-Cause and Ebenezer Creek dignity framing are present and correct, and the content is not massacre-only. No downgrade warranted.