# Cedar Creek Battle-Build Spec (D375)

**Status:** D375 planning/spec plus filesystem plan probe. This slice adds no runtime data, registry entry, menu button, generated-game behavior, or combat change.

**Task shape:** build the fourth LANE-003 battle from `docs/design/battle-build-research/shenandoah-1864-battle-build-research.md` (READY_FOR_SPEC, ratified; §12 pre-spec addendum committed in D374). Cedar Creek is the lane's marquee build: the same field won by each army in turn on the same day — a Confederate dawn surprise that overruns three Union corps, then collapses under Sheridan's afternoon counterattack. It is the game's first battle in which the attacker/defender ROLES REVERSE between phases, and it travels with the lane's loudest honest hazard: the WINNER bled more.

**Research basis:** the D374 pre-spec research pass (19 agents across two workflows, 0 errors; Sonnet gather → Opus default-refute → Opus critic; Fable adjudication) resolved every packet §9 Cedar Creek unknown and is committed as packet §12 — the CMH staff-ride strength table at unit grain, the counterattack axes, the dawn geometry, the substantive-grade rank table (including the Emory correction), and the Fatal Halt as an explicit two-primary DISPUTE. One §12.5 item was left "verify at spec time" and is resolved in this slice: a 3-agent D375 workflow (2 Sonnet gathers → 1 Opus default-refute, 0 errors) CONFIRMED **Col. J. Howard Kitching** as the substantive battle-date grade from three institutional sources (NPS people page, CCBF OOB, NY State Military Museum), with the trap documented below. Fable 5 adjudicated every disputed point and owns this contract.

## Scope

**Battle:** Cedar Creek (Belle Grove), Virginia, October 19, 1864.

**Playable shape:** a two-phase T8 scenario in which the roles REVERSE between phases — the dawn surprise and the afternoon counterattack are discrete sub-battles on the same field, fought to decision in turn.

- **Roles:** top-level `attacker:"CS"` / `defender:"US"` (the battle opens with the Confederate assault); EACH phase declares its own attacker/defender explicitly, and they REVERSE at the phase boundary. This is the teaching spine: the same ground, seized by each side in one day.
- **Phases:** `phases[]` length 2.
  - Phase 1: `Gordon's Dawn Assault` (~5:00 a.m.), scoreWeight 1, `attacker:"CS"` / `defender:"US"`, **per-phase `defaultFog:true`**. Gordon's column (Gordon/Ramseur/Pegram divisions) crosses the North Fork at McInturff's and Bowman's Fords after the all-night march along the base of Massanutten; Kershaw moves through Strasburg to Bowman's Mill Ford and wades Cedar Creek unopposed at 04:30 (CMH); Wharton advances up the Valley Pike at Hupp's Hill. The attack opens ~5:00 a.m. in fog, strikes Thoburn's camp first, then Hayes/Kitching, then the XIX Corps camps; VI Corps fights the delaying withdrawal, and Getty's division makes the cemetery-hill stand (repelling Pegram, then Ramseur-command NC regiments, then Wharton) while Wheaton's and Keifer's divisions re-form. Sheridan's HQ at Belle Grove is overrun. CS must SEIZE the camp line. Historical lean CS.
  - Phase 2: `Sheridan's Counterattack` (4:00 p.m.), scoreWeight 3, DECISIVE, `attacker:"US"` / `defender:"CS"`, **per-phase `defaultFog:false`** (clear afternoon). Sheridan — back from Winchester by the ~12-mile ride, on the field ~10:30 a.m. — re-forms the army and attacks just before 4:00 p.m.: XIX Corps (Emory) the Union right, VI Corps (Wright) the left, Merritt's cavalry the left flank, Custer the far right, Crook's VIII in reserve. The cavalry breaks the CS left (Gordon) first; Rosser opposes Custer on the Back Road (Cupp's Ford). US must SEIZE the halt line — the stone walls / high ground north of Middletown near Miller's Mill. Historical lean US, decisive.
- **Score weights: 1 + 3 = 4** (the two-phase convention; the DECISIVE counterattack carries the weight). The sum is 4, NOT 5 — the probe asserts sum == 4.
- **Fog law:** the pre-dawn river fog was REAL and is an ACCURATE input (D92), not an attacker bonus — phase 1 ships per-phase `defaultFog:true`, and the surprise EMERGES from fog + pre-dawn low-readiness camps + the concealed flank mass on the exposed US left. Phase 2 ships per-phase `defaultFog:false`. The T8 seam applies each phase's boolean at phase build (`_fldBuildPhase` reads `p.defaultFog`); an explicit player/probe fog pin still wins.
- **Doctrine:** `assaultDoctrine:"standard"` both phases — pressed corps/division assaults on both days.
- **Weather:** `sky:"fog"`, `time:"dawn"` (supported T17 enums; the D364 New Market Heights fog/dawn precedent). The battle OPENED in dense pre-dawn river fog (Verified — CMH narrative + NPS); the clear afternoon is carried by phase 2's `defaultFog:false`, per the D355 single-value convention the weather block follows the battle's opening. Exact provenance plus two source URLs required.
- **Objectives:** Phase 1 — the Union camp line at Belle Grove (the VIII/XIX camps; the objective name carries "Belle Grove"). Phase 2 — the high ground north of Middletown (the Miller's Mill halt line; the objective name carries "Middletown").
- **Menu rank:** `cedarCreek:72` — after `kennesaw:70` and before `franklin:75`, ranking by full date (June 27 1864 → October 19 1864 → November 30 1864) per Aaron's ratified order.
- **Registry naming:** file `data/cedar-creek.json`, top-level key `cedarCreek`, injected as `GAME_DATA["cedar-creek"]`, registry line `R.cedarCreek = GAME_DATA["cedar-creek"].cedarCreek`. D376 must grep the frozen Classic layer for any `cedarcreek`-style id collision before wiring (the `stonesriver` / `malvernHill` precedent) and document the result; no `data/logistics-rail.json` change is expected.

## The direction-neutral casualty law (the load-bearing design decision)

Cedar Creek is the lane's loudest inversion of "the winner bleeds less" — **US bled MORE and WON**:

1. **All three accountings agree on the direction and disagree on the totals.** ABT facts box US 5,764 / CS 3,060 (total 8,824); Wikipedia infobox US 5,665 / CS 2,910 (total 8,575); NPS carries a lower ~7,682 total with NO per-side split (confirmed §9). Different totals, same direction — the morning rout and captures loaded the US column. **FORBIDDEN: any aggregate casualty tooth in either direction** — neither `US < CS` (falsely encoding a history that did not happen) nor `CS < US` (a count-shaped gate on conflicting totals). The aggregate casualty guard is DIRECTION-NEUTRAL: there is none.
2. **The only casualty guards are the phase-scoped SYSTEM validations (D92):** the surprised/flanked side bleeds in the phase it is struck. Phase 1: US phase-losses exceed CS phase-losses in ≥5/8 seeds (DIRECTION ONLY — the surprised side). Phase 2: CS phase-losses exceed US phase-losses in ≥5/8 seeds (DIRECTION ONLY — the struck/collapsing side). No phase-casualty magnitude tooth exists anywhere: there is no citation-grade phase split.
3. **Pursuit prose is COUNT-FREE.** The circulating 43-gun / 24-recaptured / ~200-wagon / ~1,000-prisoner figures failed default-refute against fetched approved pages (§12.3). The runtime payload must not carry them; "recaptured the morning's lost guns and took most of Early's artillery and trains" is the sourced ceiling. The Strasburg bridge jam is single-source (ccbf) — avoided.

## Source Register

These control D376 runtime claims where they conflict with any summary or label. The packet §3 register is the master; the rows below are the runtime-controlling anchors. NPS pages, the US Army CMH staff ride, CCBF, and Wikipedia are each independent institutions; ABT counts as ONE institution across its pages.

| Source | Runtime use | Confidence |
|---|---|---|
| [ABT — Cedar Creek](https://www.battlefields.org/learn/civil-war/battles/cedar-creek) | Date; the two-phase sequence; strengths ~31,945 / 21,000; casualties US 5,764 / CS 3,060; Belle Grove; the Lincoln-reelection significance. Its facts box mislabels Early "Major General" — recorded, rejected | Verified (fetched) |
| [NPS — Battle of Cedar Creek](https://www.nps.gov/articles/000/battle-of-cedar-creek.htm) | THE rank anchor (Sheridan Maj. Gen., Early Lt. Gen., Crook Brig. Gen.); Crook's corps caught in camp; the Massanutten all-night march; the ride. NOTE its "Maj. Gen. William H. Emory" is courtesy/brevet usage — §12 correction controls | Verified (fetched) |
| [US Army CMH Cedar Creek Staff Ride — OOB appendix](https://history.army.mil/books/Staff-Rides/CedarCreek/ccob.htm) ([Wayback mirror](https://web.archive.org/web/20230928113544/https://history.army.mil/books/Staff-Rides/CedarCreek/ccob.htm) — the live URL Akamai-403s bots) | THE strength anchor at unit grain (US per corps, CS per division — §12.1); the honest caveat that the CS table is a 31-Oct field-inspection reconstruction ("No official report is available"; alt estimate as low as 15,680) | Verified (single .mil source; per-unit strengths ship "Verified identity; Inferred strength") |
| [US Army CMH Cedar Creek Staff Ride — battle narrative](https://history.army.mil/books/Staff-Rides/CedarCreek/ccbattle.htm) | Kershaw waded Cedar Creek unopposed 04:30; the halt ~10:00 a.m.; the 4:00 p.m. counterattack | Verified (fetched) |
| [Cedar Creek Battlefield Foundation — order of battle](https://ccbf.us/order-of-battle/) | Both-side brigade-level structure; "Provisional Division, Col. J. Howard Kitching". Its rank labels can use ultimate/best-known grade (Torbert/Rosser "Maj. Gen.") — structure Verified, rank labels UNRELIABLE | Verified (structure) |
| [NPS — "The Fatal Halt"](https://www.nps.gov/articles/000/fatal-halt.htm) | THE anchor for the DISPUTED halt: quotes Early's plunder account AND Gordon's Reminiscences ch. XXV counterclaim; halt ~9:30-10:30 with delays toward ~12:30 | Verified (fetched) |
| [NPS — "Sheridan Arrives"](https://www.nps.gov/articles/000/sheridan-arrives.htm) | The ride: departed Winchester ~9:00 a.m. on Rienzi, ~12 miles — NOT the poem's 20 — on the field ~10:30 a.m. | Verified (fetched) |
| [Gordon, *Reminiscences of the Civil War*, ch. XXV](https://docsouth.unc.edu/fpn/gordon/gordon.html) | Gordon's side of the dispute; the "glory enough for one day" line exists ONLY via Gordon's account — attribute to Gordon's Reminiscences, never state as fact | Verified via NPS quotation (primary text access pending) |
| [NPS Monocacy — Jubal Early biography](https://www.nps.gov/mono/learn/historyculture/jubalearly.htm) | Early's TEMPORARY Lt. Gen. grade (May 31 1864) and Army of the Valley command | Verified |
| [Wikipedia — Battle of Cedar Creek](https://en.wikipedia.org/wiki/Battle_of_Cedar_Creek) | Corroboration only: US 5,665 / CS 2,910 (total 8,575); strengths 31,610 / 21,102 effectives; Ramseur mortally wounded and captured by the 1st Vermont Cavalry | Verified (corroboration only) |
| [NPS — J. Howard Kitching](https://www.nps.gov/people/j-howard-kitching.htm) | Kitching's wound and death ("died of fever due to his wound, January 11, 1865"); the posthumous-brevet trap | Verified (fetched, D375 pass) |
| [NY State Military Museum — 6th NY Heavy Artillery](https://museum.dmna.ny.gov/unit-history/artillery/6th-heavy-artillery-regiment) | "Col. Kitching" at the battle; "1st brigade, Kitching's provisional division, Army of the Shenandoah, from September 27, 1864" | Verified (fetched, D375 pass) |

**Discrepancy register (SURFACE, never reconcile silently):** casualty totals ABT 8,824 / Wikipedia 8,575 / NPS ~7,682 (NPS has NO per-side split — ABT's 5,764/3,060 is the only split anchor; all three agree US > CS); strengths ABT/CCBF 31,945 / 21,000 vs CMH/Wikipedia 31,610 / 21,102 (within ~1%; the CMH table is the unit-grain anchor); the CS ATTACKING force is ~14,000 engaged vs the ~21,000 army total (ABT/NPS) — state as a range where player-facing; the CMH CS table is a post-battle reconstruction with its own "No official report is available" footnote and an alternative estimate as low as 15,680 — no division split may be presented as an exact battle-morning count. The ABT facts-box "Major General" for Early is an ABT ERROR (NPS controls). The NPS OOB's "Maj. Gen. Rosser" is an ERROR (refute-confirmed; his MG is Nov 1 1864). Sheridan's ride is ~12 miles (NPS) — the poem's "twenty miles away" is Read's 1865 propaganda inflation.

## Strength And Timing Contract

Engaged strengths, not campaign paper totals. **Every fielded unit carries `Verified identity; Inferred strength`** — the identities and army-level anchors are Verified, but the CMH per-unit table is a disclosed post-battle reconstruction, so every division/corps figure ships as an Inferred estimate with the CMH table as the estimating basis (§12.1).

The CMH anchors (§12.1): **US per corps** — VI 8,506 inf + 600 arty / 24 guns · VIII 4,000 + 200 / 16 · XIX 8,748 + 414 / 20 · Kitching's Provisional Division 1,000 · Cavalry 7,500 + 642 / 30 · **total 31,610 / 90 guns**. **CS per division** — Ramseur 2,442 · Pegram 2,013 · Gordon 2,227 · Kershaw 3,071 · Wharton 1,421 (11,174 inf + 1,101 arty / 40+ guns) · cavalry Lomax 3,121 · Rosser 2,206 · **total 21,102**.

### Phase 1 — Gordon's Dawn Assault (~5:00 a.m.)

- **CS (attacker):** the five infantry divisions + artillery + Rosser's cavalry on the Back Road opposing Custer. Gordon's flank column (Gordon 2,227 / Ramseur 2,442 / Pegram 2,013) via the fords; Kershaw 3,071 via Bowman's Mill Ford; Wharton 1,421 up the Valley Pike at Hupp's Hill; CS artillery ~1,101 / 40+ guns; Rosser 2,206. **Lomax (3,121) is NOT fielded** — he operated via the Front Royal–Winchester Road toward Newtown and never effectively reached the main field (§12.3); he appears in teaching/notes only. Modeled bound: **phase-1 CS total 12,500-14,500** (the ~14,000-attacking anchor; every split Inferred). CS guns 30-48.
- **US (defender):** the camps at corps/division grain — Crook's VIII (Col. Joseph Thoburn's and Col. Rutherford B. Hayes's divisions, 4,200 with arty / 16 guns), Kitching's Provisional Division (Col. J. Howard Kitching, 1,000), Emory's XIX (Brig. Gen. William Dwight's and Brig. Gen. Cuvier Grover's divisions, 9,162 / 20 guns), Wright's VI (Brig. Gens. Frank Wheaton and George W. Getty + Col. J. Warren Keifer's 3rd Division, 9,106 / 24 guns), and Torbert's cavalry (Merritt, Custer, Powell — 8,142 / 30 guns) covering the flanks and the withdrawal. Modeled bound: **phase-1 US total 27,000-31,610** (the CMH 31,610 anchor; splits Inferred). US guns 60-90.
- **Reinforcement grain:** the assault may arrive on the §12.4 schedule (Kershaw wading at 04:30 → Gordon's column ~5:00 → Wharton up the Pike) and the US cavalry may enter as covering reinforcements — bounds count opening OOB plus reinforcements together. Timing offsets are Inferred abstractions of the sourced sequence.
- **Direction:** CS seizes the camp line in ≥5/8 seeds; US phase-losses exceed CS phase-losses in ≥5/8 (DIRECTION ONLY — the surprised side bleeds in the phase it is struck).
- **Opening-scene grain note for D376:** keep the phase-1 opening OOB at corps/division grain. If the opening unit count exceeds Kennesaw's 17, `data/media-budget.json` `largestShippedScene` and the Intel probe's largest-scene leg MUST move to Cedar Creek in the same commit; if it stays at or under 17, Kennesaw keeps the crown. The probe derives the inventory either way.

### Phase 2 — Sheridan's Counterattack (4:00 p.m.)

- **US (attacker):** the re-formed army minus the morning's losses and disorder — XIX Corps the right, VI Corps the left, Merritt's cavalry the left flank, Custer the far right, Crook's VIII + the Kitching remnant in reserve (§12.3, CONFIRMED axes). Modeled bound: **phase-2 US total 22,000-28,500** (Inferred: the 31,610 anchor minus the morning's ~5,000-6,000 casualties and stragglers). US guns 40-90 (Inferred — the morning's lost guns are a within-phase sim event, never an OOB count tooth).
- **CS (defender):** the five divisions + artillery on the Miller's Mill / stone-walls line north of Middletown, Rosser still opposing Custer on the Back Road. The army is thinned by the morning's fighting and by the DISPUTED straggling/plunder (§12.6) — the honest mechanism is CS cohesion/reinforcement TIMING and the true strength bounds, NEVER a mechanic encoding either commander's blame theory. The CS west-to-east line order (Gordon–Kershaw–Ramseur–Pegram–Wharton) is **Inferred-grade only** — sector placement may use it, the data labels it Inferred, and NO probe tooth asserts the order. Modeled bound: **phase-2 CS total 13,000-19,000** (Inferred). CS guns 15-48 (Inferred).
- **Direction:** US seizes the halt line in ≥5/8 seeds; CS phase-losses exceed US phase-losses in ≥5/8 (DIRECTION ONLY).

### Aggregate

- Weighted score 1+3: US wins the aggregate in ≥5/8 seeds.
- **NO aggregate casualty tooth in either direction** (the direction-neutral law above).
- Same-seed determinism; passive US and passive CS launches terminate without NaN.

### Honest A/B rule

If D376 changes a simulation input after the first battery, log both values and the observed 8-seed result in `DECISIONS.md`. Eligible inputs: OOB strengths inside the bounds above, gun counts within the sourced ranges, xp/readiness, terrain/works placement, reinforcement timing, formation, objective radius, hold/time thresholds, phase time limits. A result-derived multiplier is forbidden.

## OOB And Rank Traps

The runtime probe must search the full payload, including leaders, units, notes, and teaching. All grades below are the §12.5 substantive battle-date table (default-refute CONFIRMED), plus the D375 Kitching resolution. **Format law: brevet parentheticals follow the NAME, never prefix it** — encode `Brig. Gen. William H. Emory (Bvt. Maj. Gen.)`, so the prefix-scan rejections below stay clean.

- **Maj. Gen. Philip H. Sheridan** — Middle Military Division / Army of the Shenandoah. His Regular-Army BG (Sep 20 1864) and Regular MG (eff. Nov 8 1864) are post-battle — never backdate; he was NOT a lieutenant general until 1869. Reject `Lt. Gen. Philip H. Sheridan`. (The Stones River payload requires the OPPOSITE rendering — Brig. Gen. — these are per-battle payload teeth; never cross-apply.)
- **Lt. Gen. Jubal A. Early** — Army of the Valley, **Lieutenant General (temporary grade)**, appointed May 31 1864. Reject `Maj. Gen. Jubal A. Early` (the ABT facts-box ERROR).
- **Maj. Gen. Horatio G. Wright** — VI Corps; acting army commander that morning before Sheridan arrived.
- **Brig. Gen. William H. Emory (Bvt. Maj. Gen.)** — XIX Corps. THE §12 C73-CLASS CORRECTION: his substantive USV grade on Oct 19 1864 was Brig. Gen. (from Mar 17 1862); NPS's "Maj. Gen." is courtesy/brevet usage. Reject `Maj. Gen. William H. Emory`. The exact brevet date is packet-note-grade, not an in-game Verified claim.
- **Brig. Gen. George Crook** — VIII Corps / Army of West Virginia. His MG dates Oct 21 1864 — two days AFTER the battle. Reject `Maj. Gen. George Crook`.
- **Brig. Gens. George W. Getty and Frank Wheaton** (VI Corps divisions); **Brig. Gen. James B. Ricketts** wounded early — **Col. J. Warren Keifer** took the 3rd Division (Getty briefly held the corps). Getty/Ricketts brevet-MG paperwork is Dec 1864, post-battle.
- **Brig. Gens. William Dwight and Cuvier Grover** — XIX Corps divisions.
- **Brig. Gen. Alfred T. A. Torbert (Bvt. Maj. Gen.)** — chief of cavalry. The NPS/CCBF "Maj. Gen." labels are courtesy usage, REFUTED as substantive. Reject `Maj. Gen. Alfred T. A. Torbert`.
- **Brig. Gens. Wesley Merritt and George A. Custer** — 1st and 3rd Cavalry Divisions. Custer's MG is 1865. Reject `Maj. Gen. George A. Custer` and `Maj. Gen. Wesley Merritt`.
- **Col. William H. Powell** — 2nd Cavalry Division. A colonel commanding a division. Reject a general's grade.
- **Col. Joseph Thoburn** — killed Oct 19. The "commission made out the day of his death" claim is DROPPED (the NPS bio does not state it). Reject `Brig. Gen. Joseph Thoburn`.
- **Col. Rutherford B. Hayes** — 2nd (Kanawha) Division, VIII Corps (succeeded Duval). The future president was a COLONEL here. Reject `Brig. Gen. Rutherford B. Hayes`.
- **Col. Charles Russell Lowell** — Reserve Brigade under Merritt; wounded, kept command, mortally wounded, died Oct 20. His brigadier star was POSTHUMOUS — he never held the grade in life. Reject `Brig. Gen. Charles Russell Lowell` as a fielded rank (teaching may name the posthumous star as such).
- **Col. J. Howard Kitching** — Provisional Division. THE D375-RESOLVED TRAP: his brevet BG was awarded POSTHUMOUSLY (he died of his Cedar Creek foot wound January 11, 1865) and merely BACKDATED to Aug 1 1864 — the effective date predates the battle, but he carried no brigadier's commission of any kind on Oct 19. Encode Colonel; reject `Brig. Gen. J. Howard Kitching`; never encode him killed-in-action (mortally wounded, died ~3 months later).
- **Maj. Gen. John B. Gordon** — led the flank column. Never Lt. Gen. here. Reject `Lt. Gen. John B. Gordon`.
- **Maj. Gen. Joseph B. Kershaw** (eff. May 18 1864) and **Maj. Gen. Stephen D. Ramseur** (eff. June 1 1864). Ramseur was mortally wounded near Miller's Mill in the collapse (two horses already shot under him), captured, and died Oct 20 at Belle Grove — **TEACHING FLAVOR ONLY, never a scripted-death mechanic** (D74).
- **Brig. Gen. John Pegram** — his death is Hatcher's Run, Feb 1865 — later, not here. Reject `Maj. Gen. John Pegram`.
- **Brig. Gen. Gabriel C. Wharton** (eff. July 8 1863). Reject `Maj. Gen. Gabriel C. Wharton`.
- **Brig. Gen. Thomas L. Rosser** — commanded Fitz Lee's division (Lee wounded at Third Winchester); his MG is Nov 1 1864, post-battle. The NPS OOB's "Maj. Gen. Rosser" is an ERROR (refute-confirmed). Reject `Maj. Gen. Thomas L. Rosser`.
- **Maj. Gen. Lunsford L. Lomax** (Aug 1864) — teaching/notes only (not fielded; the Front Royal road).
- Brigade rosters for OOB notes (§12.5, CONFIRMED): Ramseur (Battle/Grimes/Cook/Cox), Kershaw (Conner/Humphreys/Wofford/Bryan), Pegram (Hoffman/Johnston/Goodwin), Gordon (Evans/Terry/York), Rosser (Wickham/Payne/Laurel), Lomax (Imboden/Johnson/McCausland/Jackson); Lowell = Reserve Brigade under Merritt; **Devin led a BRIGADE under Merritt** (a "Devin division" rendering was refute-killed).

## Terrain And Objective

- **Cedar Creek** — the pre-dawn crossing band fronting the US left/center; **Bowman's Mill Ford** (Kershaw's 04:30 wade).
- **The North Fork of the Shenandoah** with **McInturff's and Bowman's Fords** — Gordon's flank-column crossings below Massanutten.
- **Massanutten Mountain** — the concealed all-night flank march and observation; the field's southeastern anchor.
- **Belle Grove** — Sheridan's HQ, the phase-1 objective anchor and the fight's namesake plantation.
- **The Valley Pike** — the axis of both the CS drive north and the US counterattack; **Hupp's Hill** (Wharton's approach).
- **Middletown**, the **Middletown cemetery hill** (Getty's stand), **Miller's Mill / Old Forge Road** (the halt line), and the **stone walls / high ground north of Middletown** — the phase-2 objective.
- **The Back Road (Cupp's Ford)** — Rosser vs Custer on the western flank.
- Home edges: the US rear is NORTH (down-Valley toward Winchester/Newtown); the CS rear is SOUTH (up-Valley toward Strasburg/Fisher's Hill). Home edges are SIDE-keyed and constant across BOTH phases — the roles reverse, the rears do not. Declare `homeEdge` role-aware at top level; the probe verifies the override plus a sandbox leak test.
- All placements are Inferred map abstractions of Verified features — label every terrain note.

## Victory And Balance Intent

The universal combat model owns the outcome. The correct levers are true strengths inside the bounds, the fog/readiness inputs, objective geometry, reinforcement timing, terrain friction (the creek and ford band, the Pike corridor, the walls north of Middletown), xp, formation, and phase weights.

- Phase 1's surprise EMERGES: fog ON + pre-dawn low-readiness camps (accurate xp/entrench/readiness defaults for an army caught at reveille) + the concealed flank mass arriving on the exposed US left. NEVER a surprise multiplier, NEVER a scripted rout.
- Phase 2's collapse EMERGES: the US strength edge (~26k vs ~15k that afternoon, Inferred within the bounds) + fresh cavalry on both flanks + CS cohesion/reinforcement TIMING (the army had paused and thinned — the §12.6 dispute about WHY stays in teaching). NEVER a scripted collapse, NEVER a plunder/straggle mechanic encoding Early's blame theory.
- A human CS player can do better than Early (press before 10:00 a.m., refuse the halt); a human US player can lose the afternoon (attack piecemeal before re-forming). The default AI-vs-AI pattern must teach the documented shape: a stunning dawn overrun, the halt, the ride, the decisive counterattack.
- Casualty gravity: ~8,600 total in one day, the heavier column on the WINNER. Present with restraint; no spectacle.

## Teaching And Anti-Lost-Cause Framing

At least seven cards, each claim with at least two source URLs; one codex entry (`theater:"Eastern"`, Shenandoah Valley 1864 campaign axes, `result:"Union victory"` with the winner-bled-more cost note). **Card-claims law:** every card claim must stay inside §12/§3-adjudicated content; any NEW claim introduced at D376 authoring time requires its own citation-verify packet first (the D366 pre-authoring workflow pattern).

1. **`cc_fatal_halt`** — THE DISPUTED CARD, the packet's centerpiece (§12.6): Early's account (the army stopped because it was exhausted, disordered, and thinned by plundering the captured camps) AND Gordon's Reminiscences ch. XXV counterclaim ("the fatal halting, the hesitation, the spasmodic firing… lost us the great opportunity") — BOTH quoted via the NPS Fatal Halt article, BOTH attributed. The **"glory enough for one day"** line exists ONLY via Gordon's postwar account — attribute to Gordon's Reminiscences, NEVER state as fact. The card presents both primaries and leaves the verdict to the player; the dispute IS the lesson. No mechanic encodes either blame theory.
2. **`cc_sheridans_ride`** — the rally was REAL: Sheridan departed Winchester ~9:00 a.m. on Rienzi with ~20 troopers, rode ~12 miles, reached the field ~10:30 a.m., and re-formed a broken army. "Sheridan's Ride" the POEM is Thomas Buchanan Read's 1865 propaganda ("twenty miles away" is the poem's inflation). Teach the two separately: the leadership fact stands; the poem is a campaign-season artifact, not evidence.
3. **`cc_the_burning`** — Sep-Oct 1864 Sheridan systematically destroyed the Valley's barns, mills, crops, and livestock — deliberate hard war whose cost fell on the Valley's farm families. Named honestly, cross-linked to the repo's standing `sheridan-burning` card in `data/hard-war.json`. **DIGNITY LINE: teaching-only — never a scored or gamified objective.**
4. **`cc_ramseur`** — Maj. Gen. Stephen D. Ramseur, 27, mortally wounded near Miller's Mill with two horses already shot under him, captured, died Oct 20 at Belle Grove — the same house that had been Sheridan's HQ that morning. Command exposure and the war's human cost; teaching flavor only, never a scripted-death mechanic. *(The age and any deathbed detail beyond §12.5 must pass the D366 citation-verify packet at D376 authoring or be dropped.)*
5. **`cc_gordons_march`** — the all-night flank march along the base of Massanutten to McInturff's and Bowman's Fords, Kershaw wading Cedar Creek unopposed at 04:30, the attack opening ~5:00 a.m. in fog: the surprise as PLANNING and POSITIONING — which is exactly how the game models it (fog + readiness + mass, no multiplier).
6. **`cc_lost_cause_architect`** — the commander beaten here, Jubal Early, became postwar the chief architect of the Lost Cause through the Southern Historical Society — manufacturing the "marble man" Lee and the "overwhelmed by numbers" alibi (already named in `data/generals.json`). His Cedar Creek plunder claim is part of that historiography lesson — AND the claim is not simply false (§12.6): the mythology was authored by the losers, on purpose, which is why the Fatal Halt card presents both primaries instead of adjudicating.
7. **`cc_election_1864`** — Cedar Creek's political weight: the decisive Valley victory three weeks before the 1864 election (the ABT page carries the Lincoln-reelection significance). Frame as the campaign's strategic payoff — the Valley ceased to be a Confederate granary and invasion corridor — not as a partisan flourish.
8. *(Optional eighth)* **`cc_lowell`** — Col. Charles Russell Lowell: wounded early, kept command, mortally wounded in the counterattack, died Oct 20; his brigadier star was posthumous — he never held the grade in life.

No massacre or atrocity content is in this lane; the standing dignity carve-outs (no Leetown Native OOB, no playable Fort Pillow) are untouched by this battle. "The Burning" is this lane's OWN dignity line: teaching-only, never scored.

## D74 No-Fudge Acceptance Gates

D376 must add no Cedar-Creek-specific damage, firepower, morale, casualty, rout, capture, winner, or score control. The data scan must reject keys matching the standing family at any depth:

`damage`, `dmg`, `damageMult`, `firepower`, `firepowerMult`, `fireScale`, `fireMult`, `fireMultiplier`, `killScale`, `killMult`, `casualtyScale`, `casualtyMult`, `lossMult`, `combatScale`, `battleDamage`, `battleFire`, `powerMult`, `moraleMult`, `routMult`, `captureMult`, `scoreBonus`, `scoreMult`, `winner`, `winOverride`, `victoryOverride`, `outcomeOverride`, `forceWin`, `winnerFudge`, `fudge`, `valorMult`, `heroism`.

Named temptations, all FORBIDDEN: a dawn-surprise `powerMult`/readiness fudge (fog + camp readiness + flank mass carry it); a scripted afternoon rout or forced US winner (strength edge + cavalry + timing carry it); a plunder/straggle mechanic encoding Early's blame theory as fact (§12.6 — cohesion/reinforcement timing only); a gun/wagon/prisoner capture-count tooth (the counts failed refute — pursuit prose is count-free); an aggregate casualty-direction tooth in EITHER direction (the winner bled more); a scripted Ramseur death.

## D376 Implementation Files

- `data/cedar-creek.json` with top-level key `cedarCreek` (two-phase T8; `tools/build.mjs` injects it as `GAME_DATA["cedar-creek"]`).
- `src/tactical/T1-bull-run.js` registry entry and menu rank `cedarCreek:72`.
- `src/tactical/T10-flags.js` explicit metadata: `theater:"E"`, `badges:false`, `csFlag:"anv"` — Early's Army of the Valley is the ANV Second Corps detached (Southern Cross), and the badge institution models the AotP set only (VI Corps wore its Greek cross in the Valley; a documented limitation comment per the D364 Army-of-the-James precedent, not a silent reuse).
- `tools/validate-data-schemas.mjs` battle-file enrollment (`cedar-creek.json`, 17 battle files; 47 data files total).
- `tools/shots/data-schema-validation.html` regenerated with a substantive 47th row.
- `tools/probe-cedar-creek.mjs` focused browser + direction guard (teeth below).
- `tools/probe-tactical-roster.mjs` `EXPECTED` + `PHASE_COUNTS` (`cedarCreek: 2`), menu, and DOM updates.
- `tools/probe-custom-battle-builder.mjs` historical baseline update.
- `tools/probe-loot-survival.mjs` Army Register pin from 1068 to `1068 + unique units × 3`, with a D376 documented-history comment (unique battle/side/unit ids across BOTH phases' opening OOBs and reinforcements; phase-repeated ids dedupe). **SAME COMMIT: every other probe carrying the whole-registry pin (grep tools/ for 1068) is bumped with the same documented-history comment — the pin-bump idiom (D364/D366).**
- `tools/probe-flags.mjs` registered-scenario metadata coverage from 16 to 17 and a Cedar Creek semantic tooth (E / no badges / ANV Southern Cross).
- `data/media-budget.json` opening-scene count from 16 to 17 — AND the largest-scene check: if the phase-1 opening OOB exceeds 17 units, `largestShippedScene` moves to Cedar Creek in the same commit; otherwise Kennesaw keeps the crown.
- `tools/probe-intel-uhd617-profile.mjs` opening-scene coverage from 16 to 17 (same largest-scene rule).
- `tools/vet-no-regression.mjs` enrollment for the focused probe, suite 121 → 122; the sweep timeout comment moves from 16 to 17 battles.
- `weather`: `sky:"fog"`, `time:"dawn"`, exact single-value provenance per the D355 convention, two source URLs, and a note that phase 2's clear afternoon rides the per-phase `defaultFog:false` (the fog burned off as the morning ran).
- Generated `civil_war_generals.html` rebuilt through `node tools/build.mjs` only.
- NO change to `data/logistics-rail.json` expected; D376 greps the frozen Classic layer for any `cedarcreek` id collision and documents the result (the `stonesriver` precedent).

## Required D375 Planning Gate

- `node --check tools/probe-cedar-creek-plan.mjs`
- `node tools/build.mjs` (GATE OK; generated HTML unchanged — docs+tools only)
- `node tools/validate-data-schemas.mjs`
- `node tools/probe-battle-build-research.mjs` (15/15)
- `node tools/probe-cedar-creek-plan.mjs`
- `node tools/probe-stones-river-plan.mjs`
- `node tools/probe-new-market-heights-plan.mjs`
- `git diff --check`

Plus a surgical negative bind: tamper one load-bearing spec line (a rank lock), observe exactly the corresponding plan-probe step fail, restore byte-identical (md5-verified).

## Required D376 Runtime Gate

- `node --check` on the new/touched probe and `src/tactical/*.js` files
- `node tools/build.mjs`
- `node tools/validate-data-schemas.mjs`
- `node tools/probe-cedar-creek-plan.mjs`
- `node tools/probe-cedar-creek.mjs`
- `node tools/probe-tactical-roster.mjs`
- `node tools/probe-custom-battle-builder.mjs`
- `node tools/probe-loot-survival.mjs`
- `node tools/probe-flags.mjs`
- `node tools/probe-weather.mjs`
- `node tools/probe-intel-uhd617-profile.mjs`
- `node tools/probe-media-budget.mjs`
- `node tools/vet-no-regression.mjs --list`
- `node tools/probe-stones-river.mjs`
- `node tools/probe-kennesaw.mjs`
- `node tools/probe-franklin.mjs`
- `git diff --check`

Browser probes run serially in full access with one shared server and `TMPDIR="$PWD/.tmp"`; nothing runs concurrently with a probe battery (the D373 lesson). Read every required artifact under `tools/shots/`; require `ok:true`, zero failed steps, zero pageerrors. Full `npm run vet:noreg` is NOT owed per-battle — the next release boundary owes it (D373 discharged the last one).

## Future Runtime Probe Teeth

When `data/cedar-creek.json` exists, `tools/probe-cedar-creek.mjs` must verify:

- two-phase ROLE-REVERSAL teeth: `phases.length === 2`; phase 1 `attacker:"CS"` / `defender:"US"` with per-phase `defaultFog:true`; phase 2 `attacker:"US"` / `defender:"CS"` with per-phase `defaultFog:false`; score weights 1 and 3 (sum EXACTLY 4, never 5); phase names carrying `Gordon's Dawn Assault` and `Sheridan's Counterattack`;
- menu chronology after Kennesaw and before Franklin, one accessible button, two side-choice cards, side preserved through `fldLaunchBattle`;
- landmark teeth: `Belle Grove`, `Valley Pike`, `Massanutten`, `Cedar Creek`, `Middletown`, `Miller's Mill`, `Hupp's Hill`, `Bowman's Mill Ford`; role-aware home edges (US north / CS south, constant across the role reversal) plus a negative sandbox leak test;
- strength bounds: phase-1 CS 12,500-14,500 / US 27,000-31,610; phase-2 US 22,000-28,500 / CS 13,000-19,000; phase-1 guns CS 30-48 / US 60-90; phase-2 guns US 40-90 / CS 15-48; every unit note carrying `Verified identity; Inferred strength`;
- rank teeth (exact, fielded + teaching-named): `Maj. Gen. Philip H. Sheridan`, `Lt. Gen. Jubal A. Early` (+ a `temporary grade` marker in notes/teaching), `Maj. Gen. Horatio G. Wright`, `Brig. Gen. William H. Emory`, `Brig. Gen. George Crook`, `Brig. Gen. Alfred T. A. Torbert`, `Brig. Gen. Wesley Merritt`, `Brig. Gen. George A. Custer`, `Brig. Gen. George W. Getty`, `Brig. Gen. Frank Wheaton`, `Brig. Gen. James B. Ricketts`, `Brig. Gen. William Dwight`, `Brig. Gen. Cuvier Grover`, `Col. William H. Powell`, `Col. Joseph Thoburn`, `Col. Rutherford B. Hayes`, `Col. J. Howard Kitching`, `Col. J. Warren Keifer`, `Col. Charles Russell Lowell`, `Maj. Gen. John B. Gordon`, `Maj. Gen. Joseph B. Kershaw`, `Maj. Gen. Stephen D. Ramseur`, `Maj. Gen. Lunsford L. Lomax`, `Brig. Gen. John Pegram`, `Brig. Gen. Gabriel C. Wharton`, `Brig. Gen. Thomas L. Rosser`;
- rank rejections (prefix-scan; brevet parentheticals follow the name so these stay clean): `Lt. Gen. Philip H. Sheridan`, `Maj. Gen. Jubal A. Early`, `Maj. Gen. William H. Emory`, `Maj. Gen. George Crook`, `Maj. Gen. Alfred T. A. Torbert`, `Maj. Gen. George A. Custer`, `Maj. Gen. Wesley Merritt`, `Brig. Gen. Joseph Thoburn`, `Brig. Gen. Rutherford B. Hayes`, `Brig. Gen. J. Howard Kitching`, `Lt. Gen. John B. Gordon`, `Brig. Gen. Stephen D. Ramseur`, `Maj. Gen. John Pegram`, `Maj. Gen. Gabriel C. Wharton`, `Maj. Gen. Thomas L. Rosser`;
- the Fatal Halt DISPUTE teeth: the payload carries BOTH attributed primaries; `glory enough for one day` appears ONLY inside a card that also attributes it to Gordon's Reminiscences; no data key encodes a plunder/straggle/blame mechanic;
- pursuit count-free teeth: reject `43 guns`, `1,000 prisoners`, `200 wagons`, `24 recaptured` renderings in the payload;
- Ramseur teaching-only: his name appears in notes/teaching; no scripted-death key on any unit;
- "The Burning" dignity tooth: no phase objective or scored key names the Burning; it appears only in teaching/codex text;
- no forbidden D74 key at any depth (including `valorMult`/`heroism`);
- deterministic same-seed replay; passive US and passive CS completion without hangs or NaN;
- the 8-seed battery (five guards): phase-1 CS seizes ≥5/8; phase-2 US seizes ≥5/8; aggregate US wins ≥5/8; phase-1 US losses > CS losses ≥5/8 (direction only); phase-2 CS losses > US losses ≥5/8 (direction only) — and NO tooth anywhere asserting an aggregate casualty direction;
- teaching: at least seven cards, each claim with at least two source URLs, including the Fatal Halt dispute card with both primaries, the ride/poem split card, the Burning teaching-only card, the Ramseur card, and the Lost Cause architect card; one codex entry with `theater:"Eastern"` and `result:"Union victory"` with the winner-bled-more cost note;
- the Army Register pin increase equals unique Cedar Creek unit ids times three;
- negative bind proof: remove the T1 registry line and separately tamper a rank lock → exactly the corresponding teeth fail → restore exact bytes before commit.

## D375 Completion Criteria

D375 is green when this spec and `tools/probe-cedar-creek-plan.mjs` pass; the plan probe confirms no half-registration; the build and current 16-battle roster stay green; the required JSON artifacts have been read; LANE-003 records the D375 boundary; and the commit is pushed. Runtime work starts only from that clean D375 boundary.
