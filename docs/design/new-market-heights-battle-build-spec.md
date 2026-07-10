# New Market Heights Battle-Build Spec (D363)

**Status:** D363 planning/spec plus filesystem plan probe. This slice adds no runtime data, registry entry, menu button, generated-game behavior, or combat change.

**Task shape:** build the second LANE-003 battle from `docs/design/battle-build-research/usct-battle-build-research.md` (READY_FOR_SPEC, ratified). New Market Heights is the USCT lane's strongest dignified build: Paine's all-USCT division storming a fortified line, fourteen Black soldiers earning the Medal of Honor. The battle ships as the game's first USCT-led playable scenario, and the dignity law travels with it.

**Research basis:** a 13-agent D363 research pass (six Sonnet web-research packets, six Opus default-refute verifiers, one Opus completeness critic; ~697k tokens; 0 errors) resolved every packet §9 unknown before this spec. All CONFIRM/AMEND/REFUTE/UNPROVEN verdicts below are from that pass; Fable 5 adjudicated every disputed point and owns this contract.

## Scope

**Battle:** New Market Heights (Chaffin's Farm), Virginia, September 29, 1864.

**Playable shape:** a two-phase T8 scenario over the SAME ground — the two documented assault waves.

- **Roles:** top-level `attacker:"US"` / `defender:"CS"`, identical in both phases.
- **Phases:** `phases[]` length 2.
  - Phase 1: `Duncan's Assault - the Abatis` (~5:30 a.m.), scoreWeight 1. Col. Samuel A. Duncan's 3rd Brigade (4th and 6th USCT, ~700 effectives) attacks the full Confederate line through Four Mile Creek's marsh and two abatis lines. Historical direction: the defense HOLDS and the attacker bleeds — Duncan lost about 350 of 700.
  - Phase 2: `Draper Carries the Heights` (~7:00-8:00 a.m.), scoreWeight 3, decisive. Col. Alonzo G. Draper's 2nd Brigade (5th, 36th, 38th USCT, ~1,300) attacks over the same ground with Col. John H. Holman's 1st Brigade (1st, 22nd, 37th USCT) in support, against a line under sourced withdrawal orders — the phase-2 Confederate OOB is REDUCED (`Inferred residual strength`).
- Score weights: 1 + 3 = 4 (the two-phase convention; do not resurrect the "total 5" three-phase arithmetic).
- **Fog:** `defaultFog:false`. Duncan attacked through THICK DAWN FOG (two independent fetched sources), but the game's fog MECHANIC aids the defender by blinding the attacker's targeting — the wrong lever here, per the D90 lesson the research packet itself invokes. The sourced fog ships as the presentation-layer weather hint (`sky:"fog"`, `time:"dawn"`) and in teaching text; the tactical difficulty is carried by the works, the double abatis, and the marsh.
- **Doctrine:** `assaultDoctrine:"standard"` both phases. These were pressed brigade assaults, not Fredericksburg-style cautious stand-off.
- **Objective:** the Confederate earthworks on New Market Heights above New Market Road. Union control represents carrying the works; Confederate control represents holding the line.
- **Historical direction (three independent guards):** phase 1 CS holds in a majority of 8 seeds; phase 2 US carries in a majority; aggregate US wins the weighted battle in a majority WHILE total US losses exceed total CS losses in a majority. New Market Heights INVERTS "the winner bleeds less" — the victor bore the cost (the ~850 two-brigade / 961 division casualty tabulations against a far lighter defender bill). Never assume US < CS here.
- **Menu rank:** `newMarketHeights:45` — after `gettysburg:40` and before `shiloh:50`, keeping the Eastern arc chronological (Bull Run 1861 → Seven Days 1862 → Antietam → Fredericksburg → Chancellorsville → Gettysburg 1863 → New Market Heights 1864) before the Western arc begins.

## Why NOT a Fort Harrison phase (adjudicated deviation from the packet default)

The packet's default was Phase 1 New Market Heights (scoreWeight 3) + Phase 2 Fort Harrison (scoreWeight 1), with a single-phase fallback authorized if Fort Harrison proved too thin. The research pass split the verdict: Fort Harrison's UNION side is the best-pinned piece in the whole packet (Brig. Gen. George J. Stannard's 1st Division, XVIII Corps — brigades under Col. Aaron F. Stevens, Brig. Gen. Hiram Burnham (killed; the fort was renamed Fort Burnham), and Col. Samuel H. Roberts, with Col. Edgar M. Cullen assuming a brigade mid-battle — at an OR-pinned ~2,800 men), but its CONFEDERATE side is only a coarse abstraction: about 200 defenders, "artillerymen and Johnson's Tennessee Brigade," with the garrison commander's name UNPROVEN (Wikipedia's "Maj. Richard C. Taylor" is single-source and contradicted by Stannard's OR report, which records an unnamed captured lieutenant colonel).

Fable's adjudication: a ~2,800-versus-200 phase is below the engine's brigade-scale grain — a degenerate walkover, not a battle — and its CS OOB cannot be encoded without fabricating structure the sources do not give. The completeness critic also barred any clock-timed or cause-pinned defender-thinning mechanic (below); in a shape where Fort Harrison is phase TWO, the Fort Harrison event cannot reach backward to thin the phase-ONE New Market Heights line anyway. The evidence-superior shape is the one the sources actually document in detail: the two USCT assault waves. Both phases of this build have citation-grade attacker OOBs, an identified defender, and a Confirmed outcome each. Fort Harrison ships at full teaching strength — the inter-phase transition card, the endNote, teaching cards, and codex carry Stannard's storming, Burnham's death, Ord's wounding, and Lee's failed September 30 counterattack (~1,200 Confederate casualties, two-sourced). Never fabricate a playable Fort Harrison garrison OOB.

## The withdrawal contract (the load-bearing design decision)

Whether the Confederates were driven from the New Market Heights line by the USCT assault, withdrew on orders when Fort Harrison's fall made the line untenable, or a mix of both, **remains an explicitly stated historiographical controversy** (beyondthecrater states this verbatim). What IS two-source-supported: Bass and Gary received orders to abandon the position and reinforce the inner line under attack by Ord's corps; and the withdrawal began under fire, roughly thirty minutes into Draper's assault, before the works were carried. What is NOT sourced: a clock time for the order, and whether it arrived before or after Draper's breakthrough was already succeeding.

Therefore:

- **FORBIDDEN:** any clock-timed thinning trigger, any scripted mid-phase unit removal, any mechanic that encodes "the defenders left because Fort Harrison fell" as settled causation, and any framing that encodes "the works were stormed at full strength" as settled.
- **THE MODEL:** the phase boundary itself carries the withdrawal. Phase 1 fields the full line (~1,800-2,000 with Hardaway's guns). Phase 2 fields a REDUCED Confederate OOB — the same unit identities at residual strength (a departing line's rear elements), labeled `Verified withdrawal order; Inferred residual strength`. This is an OOB input exactly like a reinforcement schedule, not a combat modifier; the universal model then decides each seed. Some seeds will read as a hard fight for the works, some as pressure against a thinning line — which is precisely the range the sources leave open.
- **THE TEACHING:** a dedicated withdrawal-controversy card presents all three readings and names the dispute as a dispute. The transition card between phases narrates the Fort Harrison fall and the orders to Bass and Gary as the sourced hinge.

## Source Register

These control D364 runtime claims where they conflict with any summary or label. ABT pages (battlefields.org) count as ONE institution; NPS, Beyond the Crater (Siege of Petersburg Online), battleofnewmarketheights.org, warfarehistorynetwork, and Emerging Civil War are each independent.

| Source | Runtime use | Confidence |
|---|---|---|
| NPS Richmond NBP, [overview](https://www.nps.gov/rich/learn/historyculture/overview.htm) | Two-column plan (Birney's X Corps + Paine's USCT division at Deep Bottom; Ord's XVIII Corps at Aiken's Landing toward Fort Harrison); ~800 division casualties; 14 Medals of Honor | Verified (fetched) |
| NPS Richmond NBP, [casualties table](https://www.nps.gov/rich/learn/historyculture/casualties.htm) | Per-regiment New Market Heights casualties: Duncan's brigade 387 (4th USCT 178, 6th USCT 209), Draper's brigade 455 (5th USCT 236, 36th USCT 108, 38th USCT 111), Holman's brigade 119 (1st/22nd/37th USCT); division total 961 | Verified (fetched); the authoritative regiment-level tabulation |
| NPS Richmond NBP, [USCT](https://www.nps.gov/rich/learn/historyculture/usct.htm) + [MoH recipients](https://www.nps.gov/rich/learn/historyculture/mohrecip.htm) | The 14 named Medal of Honor recipients | Verified (fetched) |
| American Battlefield Trust, [Covered With Glory](https://www.battlefields.org/learn/articles/covered-glory) | Two attacking brigades just over 2,000 combined; well over 800 casualties, more than 130 dead; 14 MoH awarded April 6, 1865; Gregg's Texans plus Gary's dismounted cavalry | Verified (fetched) |
| American Battlefield Trust, [New Market Heights battle page](https://www.battlefields.org/learn/civil-war/battles/new-market-heights) | ~1,800 Confederates manning one mile of works; 16 total MoH of whom 14 USCT; Lee's Sep 30 counterattack repulsed. CAUTION: its headline 14,500 CS strength is the WHOLE Sep 29-30 operation, never the New Market Heights line | Verified (fetched) |
| Beyond the Crater, [New Market Heights summary](https://www.beyondthecrater.com/resources/bat-sum/fifth-offensive-summaries/the-battle-of-new-market-heights-september-29-1864/) | Brigade order of battle (Holman 1st: 1st/22nd/37th; Draper 2nd: 5th/36th/38th; Duncan 3rd: 4th/6th); Duncan ~700, 5:30 a.m., 350 lost; Draper ~1,300, 447 lost; "thirty brutal minutes"; the Confederates "began to withdraw" | Verified (fetched) |
| Beyond the Crater, [Chaffin's Farm summary](https://www.beyondthecrater.com/resources/bat-sum/fifth-offensive-summaries/the-battle-of-chaffins-farm-new-market-heights-september-29-30-1864/) | The withdrawal controversy stated verbatim; Fort Harrison thinly defended, ~200; "When Fort Harrison fell, the New Market Heights line to the east became untenable"; Sep 30 counterattack detail | Verified (fetched) |
| Beyond the Crater, [Fleetwood in Deeds of Valor](https://www.beyondthecrater.com/resources/other-pubs/deeds-of-valor-vol-1/dov-v1-434-christian-a-fleetwood/) | First-person: "two lines of abatis and one line of palisades"; the 4th USCT's 11 officers + 350 enlisted reduced to ~85 men and 3 officers rallying | Verified (fetched primary account via compilation) |
| Stannard's OR report, [OR XLII pt.1 #317 via Beyond the Crater](https://www.beyondthecrater.com/resources/ors/vol-xlii/part-1-sn-87/or-xlii-p1-317-g-j-stannard-1-xviii-sept-28-30-1864/) | Fort Harrison teaching: ~2,800 engaged (3,115 less ~260 detached), brigades Stevens/Burnham/Roberts, Cullen's mid-battle succession, captured works commander an unnamed lieutenant colonel | Verified (fetched primary); Fort Harrison is teaching-only in this build |
| Warfare History Network, [Battle of New Market Heights](https://warfarehistorynetwork.com/article/battle-of-new-market-heights/) | Bass and Gary "received orders to abandon their position and reinforce the lines closer to the city"; word of Fort Harrison reached Gregg; Gary next to the Rockbridge Artillery; Gregg-at-Fort-Harrison detail is single-source (Inferred) | Verified (fetched) for the orders claim; no clock time given |
| battleofnewmarketheights.org, [history](https://battleofnewmarketheights.org/history-of-the-battle/) + [Medal of Honor](https://battleofnewmarketheights.org/medal-of-honor/) | 5:30 a.m. thick fog; ~7:30 a.m. second assault; Duncan wounded four times; the 14 MoH roster with award-date nuance (12 on April 6, 1865; Hawkins 1870; Harris 1874); two white officers (Edgerton, Appleton) | Verified (fetched) |
| Wikipedia, [Chaffin's Farm Confederate OOB](https://en.wikipedia.org/wiki/Battle_of_Chaffin%27s_Farm_order_of_battle:_Confederate) + [Texas Brigade](https://en.wikipedia.org/wiki/Texas_Brigade) + [Hampton's Legion](https://en.wikipedia.org/wiki/Hampton%27s_Legion) | Cross-check only: Texas Brigade = 3rd Arkansas, 1st/4th/5th Texas (Field's Division); Gary's brigade = Hampton's Legion, 7th SC Cavalry, 24th Virginia Cavalry; Hardaway's battalion | Cross-check, never sole source |
| SHSP via Wikisource, [Attack on Fort Gilmer](https://en.wikisource.org/wiki/Southern_Historical_Society_Papers/Volume_01/June/Attack_on_Fort_Gilmer,_September_29th,_1864) | Hardaway's 1st Virginia Light Artillery Battalion batteries at FOUR guns each; Rockbridge Artillery (Capt. Graham) and 3rd Co. Richmond Howitzers (Lt. Carter) on the line | Verified (fetched via refute pass) |

## Reverification Readback (what the refute pass changed)

- **Duncan commanded the 3rd Brigade** (4th + 6th USCT), Holman the 1st (1st/22nd/37th), Draper the 2nd (5th/36th/38th). One gather packet's "Duncan 1st Brigade" was corrected; a search-snippet "Brigadier General Henry Holman" is an artifact — reject it.
- **The Hardaway artillery claim survived refutation in reverse:** the gatherers reported "no gun counts found, Hardaway likely a conflation" — REFUTED. Lt. Col. Robert A. Hardaway's 1st Virginia Light Artillery Battalion (Field's Division) held the line with the Rockbridge Artillery and the 3rd Company Richmond Howitzers at four guns each. The runtime models 8 Confederate guns in two 4-gun batteries (`Verified identity; Inferred strength` on crews).
- **The casualty figures reconcile rather than conflict:** Duncan 387 + Draper 455 = 842 = ABT's "well over 800" for the two assaulting brigades; adding Holman's 119 gives the NPS division tabulation of 961. Carry both figures with their exact scopes; never average them.
- **ABT's 14,500 Confederate figure is the whole two-day operation.** The New Market Heights line is ~1,800 (ABT) to ~2,000 (Beyond the Crater, Gregg's whole command). No OR strength return exists for either CS brigade separately — every CS strength is `Inferred`.
- **Draper's assault time is imprecise across sources** (~7:00 vs ~7:30 a.m.) — the phase timing note says "about 7 a.m." and marks the clock Inferred.
- **Medal of Honor award dates:** twelve of the fourteen were awarded April 6, 1865 (Hilton posthumously — he died of wounds October 21, 1864); Sgt. Maj. Thomas R. Hawkins's medal came February 8, 1870 and Sgt. James H. Harris's February 18, 1874, for the same September 29, 1864 assault. The 36th USCT private is indexed by CMOHS as James Gardiner (also rendered James Daniel Gardner).
- **The 22nd USCT was NOT an assault-wave regiment and earned none of the 14 medals** — it was Holman's brigade's lead skirmish element and later "swung west... and skirmished with Hood's Texas Brigade" (verified verbatim). Model Holman's brigade as phase-2 support, never as an assault-column peer of Draper's.
- **Gregg-personally-at-Fort-Harrison is single-source** — the runtime may say Col. Frederick S. Bass (1st Texas) held immediate field command at the works (two-sourced) with Brig. Gen. John Gregg in overall command, but the "Gregg was at Fort Harrison" flavor stays Inferred or is omitted.

## Strength And Timing Contract

Engaged strengths, not campaign totals. Every unit split carries `Verified identity; Inferred strength` unless a figure is directly pinned below.

### Phase 1 — Duncan's Assault (~5:30 a.m.)

- **US:** Duncan's 3rd Brigade as the assault, ~700 effectives total (single-specialist-source figure consistent with ABT's 2,000 combined — Inferred). The 4th USCT went in with 361 (11 officers + 350 enlisted, Fleetwood's first-person figure); the 6th USCT's ~339 is the arithmetic remainder (Inferred). Modeled bound: Duncan's two regiments 630-770 at T=0. *(D364 amendment, logged in DECISIONS:)* Holman's 22nd USCT skirmishers are SOURCED as opening the engagement while the brigade was delayed in the Four Mile Creek marshes — they join phase 1 on the reinforcement schedule as a detachment of at most 250 (`Verified identity; Inferred strength`), so the phase-1 US total including that arrival is bounded 630-1,000. No US artillery accompanied the assault — the US fields 0 guns.
- **CS:** the full line: Gregg's Texas Brigade (3rd Arkansas, 1st/4th/5th Texas — identity Verified; strength Inferred), Gary's dismounted cavalry brigade (Hampton's Legion, 7th SC Cavalry, 24th Virginia Cavalry — identity Verified; strength Inferred), and Hardaway's two 4-gun batteries. Modeled bound: phase-1 CS total 1,700-2,100 with exactly 8 CS guns. UNIT-NAMING RULE: do not put "Hampton" in a fielded unit's display name — T10's name-trigger would assign the 1861 Hampton's Legion flag, unverified for this 1864 dismounted command; name the unit for Gary and carry the Legion in the note.
- Direction: CS holds in ≥5/8 seeds; US phase-1 losses exceed CS phase-1 losses (the documented ~50% repulse).

### Phase 2 — Draper Carries the Heights (~7:00-8:00 a.m.)

- **US:** Draper's 2nd Brigade ~1,300 (Inferred) as the assault mass, plus Holman's 1st Brigade in SUPPORT (identity Verified; strength Inferred; the 22nd USCT as the skirmish element) — support may arrive on the reinforcement schedule rather than at T=0. Modeled bound: phase-2 US total 1,900-2,400.
- **CS:** the SAME unit identities at residual strength under the sourced withdrawal orders — `Verified withdrawal order; Inferred residual strength` on every phase-2 CS unit note. Modeled bound: phase-2 CS total 600-1,100, guns reduced (0-4, limbering away).
- Direction: US carries in ≥5/8 seeds.
- The phase-2 abatis belts are PARTIALLY BREACHED (reduced obstacle strength — Duncan's pioneers had cut into the belt and Draper attacked over the same ground).

### Aggregate

- Weighted score 1+3: US wins the aggregate in ≥5/8 seeds while total US losses exceed total CS losses in ≥5/8 (the inverse-winner-bleeds-less guard).
- Same-seed determinism; passive US and passive CS launches must terminate without NaN.

### Honest A/B rule

If D364 changes a simulation input after the first battery, log both values and the observed 8-seed result in `DECISIONS.md`. Eligible inputs: OOB strengths inside the bounds above, gun counts within the sourced battery structure, xp, terrain/works/obstacle placement and strength, reinforcement timing, formation, objective radius, hold/time thresholds. A result-derived multiplier is forbidden.

## The obstacle belt (T13 pre-placed works seam — the one new engine capability)

Fleetwood's first-person account pins "two lines of abatis and one line of palisades" in front of the works; both narrative sources put the casualty concentration in that belt while axemen and pioneers cut lanes under fire. T13 already models EXACTLY this behavior for player-built abatis: line-segment obstacles that slow crossing, disorder formations, and are clearable by infantry work parties, with real 3D meshes.

D364 adds a bounded, guarded seam: scenario/phase data may declare pre-placed completed obstacle belts (`engineering.abatis[]`: `{x1,z1,x2,z2,prepared,strength}` per phase, owned by the DEFENDER side), seeded into `__FIELD.engObstacles` at phase build after `fldEngPhaseReset`. Contract:

- No scenario without the data key is affected — the seam is a no-op for every shipped battle, the sandbox, and custom battles (byte-identity bind test required).
- Phase 1 declares two full-strength belts (the two abatis lines; the palisade folds into the works wall). Phase 2 declares the same belts at reduced strength (partially breached).
- The obstacles use T13's existing crossing/clearing/rendering code paths unmodified — no new combat math, no damage source, D74 intact.
- The focused probe asserts belts exist at t=0 in both phases, slow an attacker crossing them, are absent in the sandbox and in Gaines' Mill, and that removing the seam makes exactly the obstacle teeth red.

## OOB And Rank Traps

The runtime probe must search the full payload, including leaders, units, notes, and teaching.

- **Maj. Gen. Benjamin F. Butler** — Army of the James commander (MG USV since May 16, 1861). Teaching/brief context; not an on-map field leader.
- **Maj. Gen. David B. Birney** — X Corps, commanded the Deep Bottom column. Teaching/brief context (his corps demonstrated and later attacked Fort Gilmer); the on-map assault command is Paine's.
- **Brig. Gen. Charles J. Paine** — 3rd Division, XVIII Corps (all-USCT), detached to Birney's column. RANK TRAP: a brigadier general on the battle date; reject `Maj. Gen. Charles J. Paine` (his major general grade is post-war).
- **Col. Samuel A. Duncan** — 3rd Brigade (4th, 6th USCT). Wounded four times; command passed to Col. John W. Ames (6th USCT). Reject any general's grade (brevets post-date the battle).
- **Col. Alonzo G. Draper** — 2nd Brigade (5th, 36th, 38th USCT). Reject any general's grade (brevet BG dates from October 28, 1864, after the battle).
- **Col. John H. Holman** — 1st Brigade (1st, 22nd, 37th USCT). Reject any general's grade and reject the artifact name "Henry Holman."
- **Brig. Gen. John Gregg** — overall Confederate command at the heights; Texas Brigade (3rd Arkansas, 1st/4th/5th Texas, Field's Division). Alive on Sep 29 (killed October 7, 1864 on the Darbytown/New Market Road). Reject any major general grade.
- **Col. Frederick S. Bass** (1st Texas) — immediate field command at the works (two-sourced). "Col" per the OOBs; the Lt. Col. rendering appears in one summary — use `Col.` with the note carrying the variant.
- **Brig. Gen. Martin W. Gary** — dismounted cavalry brigade (Hampton's Legion, 7th SC Cavalry, 24th Virginia Cavalry), Department of Richmond; rank from May 19, 1864.
- **Lt. Col. Robert A. Hardaway** — 1st Virginia Light Artillery Battalion; Rockbridge Artillery (Capt. Graham) + 3rd Co. Richmond Howitzers (Lt. Carter), four guns each.
- **Lt. Gen. Richard S. Ewell** — Department of Richmond. Teaching context. **Gen. Robert E. Lee** — teaching context only (his general-in-chief elevation is February 1865; he directed the failed Sep 30 counterattack). Neither is an on-map New Market Heights leader.
- **Fort Harrison teaching names:** Maj. Gen. Edward O. C. Ord (wounded Sep 29), Brig. Gen. George J. Stannard (wounded Sep 30, arm amputated — NOT wounded Sep 29), Brig. Gen. Hiram Burnham (killed; fort renamed Fort Burnham). The Fort Harrison garrison commander is UNPINNED — never name "Maj. Richard C. Taylor" as fact.
- **Medal of Honor lock (every named runtime use must match exactly):** 4th USCT — Sgt. Maj. Christian A. Fleetwood, Sgt. Alfred B. Hilton (posthumous; died of wounds Oct 21, 1864), Pvt. Charles Veal; 5th USCT — Sgt. Maj. Milton M. Holland, 1st Sgt. Powhatan Beaty, 1st Sgt. James H. Bronson, 1st Sgt. Robert A. Pinn; 6th USCT — Sgt. Maj. Thomas R. Hawkins (awarded 1870), 1st Sgt. Alexander Kelly; 36th USCT — Pvt. James Gardiner (Gardner), Cpl. Miles James; 38th USCT — 1st Sgt. Edward Ratcliff, Sgt. James H. Harris (awarded 1874), Pvt. William H. Barnes. Plus two white officers: 1st Lt. Nathan H. Edgerton (6th USCT, awarded 1898) and 1st Lt. William H. Appleton (4th USCT) — ABT's "sixteen" total. The Butler Medal is a separate Army of the James decoration, not a Medal of Honor.

## Terrain And Objective

- **Four Mile Creek and its marsh:** the approach obstacle — `swamps[]` bands across the US approach, plus a creek road/water marker. An obstacle and slowing input, never a damage source.
- **The rising open slope:** ABT describes roughly 500 yards of rising plain from the marsh to the works — keep the final approach open (no cover gift to the attacker).
- **The two abatis lines:** the T13 pre-placed belts (above), in front of the works.
- **The works on the heights:** `walls[]` breastworks on the crest per the Franklin pattern (the palisade folds into this line), with the objective centered on the works above New Market Road.
- **New Market Road:** a road marker running along/behind the Confederate position (the CS lateral/withdrawal route).
- **Deep Bottom:** the US rear context (marker or brief text).
- **Home edges:** the CS defender's rear is the LOW-z edge (toward Richmond/New Market Road); the US attacker enters from HIGH z (Deep Bottom). Declare `homeEdge:{"US":"high","CS":"low"}` at top level; the probe verifies the runtime override and a sandbox relaunch proves no leak.
- **Fort Harrison, Fort Gilmer, Aiken's Landing, Varina Road:** teaching/transition-card geography only — NOT on-map objectives.

## Victory And Balance Intent

The universal combat model owns the outcome. The correct levers are true strength mass, the obstacle belt, works cover, gun counts, xp, formation, timing, and phase weights.

- No USCT-specific valor, damage, morale, casualty, winner, or score key of any kind — the packet's own warning: the temptation is to give the USCT a per-battle buff so the heights carry. FORBIDDEN. The phase-2 carry emerges from Draper's mass plus Holman's support against the sourced residual line through partially-breached obstacles.
- A human US player can do better than history (coordinate the waves, use the pioneers); a human CS player can hold longer (rotate the line, keep the guns firing). The default AI-vs-AI pattern must teach the documented shape: a bloody repulse, then the heights carried at terrible cumulative cost.
- Casualty gravity: the division lost 961 by the NPS tabulation, "well over 800" of them in the two assault brigades, in about an hour of fighting each wave. Present with restraint; no spectacle.

## Dignity Law (travels with this battle)

1. **Black agency, not white validation:** the teaching centers what the USCT soldiers did — the color relays, the NCOs taking command of companies whose officers were down (Holland, Beaty, Bronson, Pinn, Ratcliff), the works entered first by enlisted men (Ratcliff, Barnes). Butler's advocacy and the Butler Medal are context, never the point. The "the question is settled" framing stays attributed, not celebratory.
2. **No valor fudge:** dignity is honored by TRUE inputs under the one universal model (D92). No `valorMult`, no heroism stat, no casualty floor, no scripted breakthrough.
3. **Fort Pillow absence guard (hard tooth, both probes):** no playable Fort Pillow scenario may exist — no `data/fort-pillow.json` or any fort-pillow battle file, no registry entry, no menu button, no vet-suite enrollment. Teaching-only treatment elsewhere may name the massacre accurately and directly (Maj. Gen. Forrest's command massacred surrendering Black soldiers, April 12, 1864); the no-quarter shadow these men fought under may be taught in this battle's cards with sources.
4. **The CS side-choice card is sober:** commanding the defense is framed as holding fortifications against a Union assault — period-plain, no glamor, no Lost-Cause valor framing, and the endNote for a CS player still teaches what the fourteen medals meant.

## D74 No-Fudge Acceptance Gates

D364 must add no New Market Heights-specific damage, firepower, morale, casualty, rout, capture, winner, or score control. The data scan must reject keys matching this family at any depth:

`damage`, `dmg`, `damageMult`, `firepower`, `firepowerMult`, `fireScale`, `fireMult`, `fireMultiplier`, `killScale`, `killMult`, `casualtyScale`, `casualtyMult`, `lossMult`, `combatScale`, `battleDamage`, `battleFire`, `powerMult`, `moraleMult`, `routMult`, `captureMult`, `scoreBonus`, `scoreMult`, `winner`, `winOverride`, `victoryOverride`, `outcomeOverride`, `forceWin`, `winnerFudge`, `fudge`, `valorMult`, `heroism`.

The withdrawal lives in the phase-2 OOB numbers. The medals live in teaching. The engine scripts neither.

## D364 Implementation Files

- `data/new-market-heights.json` with top-level key `newMarketHeights` (two-phase T8 shape; `tools/build.mjs` discovers and injects it as `GAME_DATA["new-market-heights"]`).
- `src/tactical/T1-bull-run.js` registry entry and menu rank `newMarketHeights:45`.
- `src/tactical/T13-engineering.js` (or a new guarded module): the pre-placed obstacle-belt seam, no-op without the data key.
- `src/tactical/T10-flags.js` explicit metadata: `theater:"E"`, `badges:false`, `csFlag:"anv"`. `badges:false` with a comment: the X and XVIII Corps had adopted their own badges by September 1864, but T10's badge institution models the Army of the Potomac's badge set only — representing Army of the James badges is a future T10 extension, not a silent reuse. The CS defenders (Field's Division units + Department of Richmond cavalry) map to the ANV Southern Cross family.
- `tools/validate-data-schemas.mjs` battle-file enrollment (`new-market-heights.json`).
- `tools/shots/data-schema-validation.html` regenerated with a substantive 45th row.
- `tools/probe-new-market-heights.mjs` focused browser + direction guard (teeth below).
- `tools/probe-tactical-roster.mjs` `EXPECTED`, menu, DOM, and phase metadata update.
- `tools/probe-custom-battle-builder.mjs` historical baseline update.
- `tools/probe-loot-survival.mjs` Army Register pin from 957 to `957 + unique units x 3`, with a D364 documented-history comment. Count unique battle/side/unit ids across BOTH phases' opening OOBs and reinforcements (phase-repeated identities dedupe — the phase-2 residual line reuses phase-1 unit ids on purpose).
- `tools/probe-flags.mjs` registered-scenario metadata coverage from 14 to 15 and a New Market Heights semantic tooth.
- `data/media-budget.json` opening-scene count from 14 to 15. Phase-1 opens small (Duncan's two regiments plus the CS line) — Kennesaw's 17-unit scene stays `largestShippedScene` unless the count says otherwise.
- `tools/probe-intel-uhd617-profile.mjs` opening-scene coverage count from 14 to 15.
- `tools/vet-no-regression.mjs` enrollment for the focused probe, suite 119 → 120; the sweep timeout comment moves from 14 to 15 battles.
- `weather`: `sky:"fog"`, `time:"dawn"`, with the two fetched fog sources and exact single-value provenance per the D355 convention (`Verified` if both quotes stand at runtime re-check, else `Inferred`); the note explains the fog-mechanic-vs-presentation split.
- Generated `civil_war_generals.html` rebuilt through `node tools/build.mjs` only.

## Required D363 Planning Gate

- `node --check tools/probe-new-market-heights-plan.mjs`
- `node tools/build.mjs`
- `node tools/validate-data-schemas.mjs`
- `node tools/probe-battle-build-research.mjs`
- `node tools/probe-gaines-mill-plan.mjs`
- `node tools/probe-new-market-heights-plan.mjs`
- `node tools/probe-tactical-roster.mjs`
- `node tools/probe-custom-battle-builder.mjs`
- `node tools/probe-nashville.mjs`
- `git diff --check`

Plus a surgical negative bind: tamper one load-bearing spec line (a rank lock), observe exactly the corresponding plan-probe step fail, restore byte-identical.

## Required D364 Runtime Gate

- `node --check` on the new/touched probe and `src/tactical/*.js` files
- `node tools/build.mjs`
- `node tools/validate-data-schemas.mjs`
- `node tools/probe-new-market-heights-plan.mjs`
- `node tools/probe-new-market-heights.mjs`
- `node tools/probe-tactical-roster.mjs`
- `node tools/probe-custom-battle-builder.mjs`
- `node tools/probe-loot-survival.mjs`
- `node tools/probe-flags.mjs`
- `node tools/probe-weather.mjs`
- `node tools/probe-intel-uhd617-profile.mjs`
- `node tools/probe-media-budget.mjs`
- `node tools/vet-no-regression.mjs --list`
- `node tools/probe-gaines-mill.mjs`
- `node tools/probe-nashville.mjs`
- `git diff --check`

Browser probes run serially in full access with one shared server and `TMPDIR="$PWD/.tmp"`. Read every required artifact under `tools/shots/`; require `ok:true`, zero failed steps, zero pageerrors. Run the 8-seed battery in one foreground process. Full `npm run vet:noreg` remains deferred under D160/D176 — owed after the final battle shipped in this LANE-003 session, before the lane's release handoff.

## Future Runtime Probe Teeth

When `data/new-market-heights.json` exists, `tools/probe-new-market-heights.mjs` must verify:

- two-phase T8 data and runtime state: `phases.length === 2`, US attacker / CS defender both phases, `defaultFog:false`, score weights 1 and 3 (total 4), phase names carrying `Duncan` and `Draper`;
- menu chronology after Gettysburg and before Shiloh, one accessible button, two side-choice cards, side preserved through `fldLaunchBattle`;
- Four Mile Creek swamp, works walls, New Market Road, Deep Bottom context; role-aware home edges (`US:"high"`, `CS:"low"`) plus a negative sandbox leak test;
- pre-placed abatis belts present at t=0 in BOTH phases, phase-2 belts at reduced strength, belts absent from the sandbox and Gaines' Mill;
- phase-1 US opening OOB 630-770 (Duncan's regiments) with the sourced 22nd USCT skirmish detachment capping the phase-1 US total at 1,000, and 0 US guns; phase-1 CS total 1,700-2,100 with exactly 8 CS guns; phase-2 US total 1,900-2,400; phase-2 CS total 600-1,100; every unit note carrying `Verified identity; Inferred strength` or `Verified withdrawal order; Inferred residual strength` (phase-2 CS);
- rank teeth: exact `Brig. Gen. Charles J. Paine`, `Col. Samuel A. Duncan`, `Col. Alonzo G. Draper`, `Col. John H. Holman`, `Brig. Gen. John Gregg`, `Brig. Gen. Martin W. Gary`; reject `Maj. Gen. Charles J. Paine`, any `Gen.` grade on Draper/Duncan/Holman, `Henry Holman`, and `Maj. Richard C. Taylor`;
- no forbidden D74 key at any depth (including `valorMult`/`heroism`);
- deterministic same-seed replay; passive US and passive CS completion without hangs or NaN;
- the 8-seed battery: phase-1 CS holds ≥5/8; phase-2 US carries ≥5/8; aggregate US wins ≥5/8; total US losses exceed total CS losses ≥5/8;
- teaching: at least six cards, each claim with at least two source URLs, including the withdrawal-controversy card, the Medal of Honor card with exact names/ranks, the Fort Harrison operation card, and the abatis/Fleetwood card; one codex entry with `theater:"Eastern"`, Richmond-Petersburg campaign axes, and `result:"Union victory"` with the costly-victory note;
- the Fort Pillow absence guard: no fort-pillow data file, registry entry, menu button, or suite row anywhere;
- the Army Register pin increase equals unique New Market Heights unit ids times three;
- negative bind proof: remove the T1 registry line and separately the obstacle seam → exactly the corresponding teeth fail → restore exact bytes before commit.

## D363 Completion Criteria

D363 is green when this spec and `tools/probe-new-market-heights-plan.mjs` pass; the plan probe confirms no half-registration; the build and current 14-battle roster stay green; the required JSON artifacts have been read; LANE-003 records Claude/Fable in `DRIVE`; and the commit is pushed. Runtime work starts only from that clean D363 boundary.
