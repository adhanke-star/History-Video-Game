# Petersburg Initial Assaults Battle-Build Spec (D396)

**Status:** D396 planning/spec plus a filesystem-first, dual-mode plan probe. This slice adds no
Petersburg runtime data, scenario registry entry, menu button, schema row, Army Register row,
generated-game behavior, combat input, or baseline-count movement.

**Task shape:** build the eleventh LANE-003 planning contract from
`docs/design/battle-build-research/1864-65-attrition-battle-build-research.md` (`READY_FOR_SPEC`,
ratified by the D327 adversarial pass) plus this session's two research workflows (a 7-agent
gather → default-refute → critic pass, 140 claims, then a 3-agent gap pass, 53 claims; 10
agents, 0 errors; combined 189 CONFIRMED / 4 ADJUSTED / 0 REFUTED; the yield is committed as
the packet's §14 D396 addendum; Fable adjudication owns every claim below). The selection is
NOT an adjudication: Aaron himself named this battle in DECISIONS D395 — the D382 item 3.5
Petersburg trench treatment IS the initial assaults of June 15-18, 1864, spec-first with
runtime excluded, and Cold Harbor stays DEFERRED (explicit-reorder-only). **THE REDUNDANCY
DISCHARGE (D395 obligation 1):** the packet's own §1 flagged this battle "redundant with
Spotsylvania/Cold Harbor as assault vs works"; the D396 research pass REFUTED that flag — the
honest shape is a **DEFENDER-REINFORCEMENT RACE**, the war's canonical missed opportunity, with
a USCT proving ground no shipped battle carries. The playable unit is the four-day fight of
June 15-18, 1864: Grant's army, having slipped across the James on the war's longest pontoon
bridge, striking the 10-mile Dimmock Line while it stood nearly empty — and Beauregard filling
it, hour by hour, faster than the Union command could bring itself to walk in. **The Crater,
New Market Heights, Fort Stedman, the April 2 breakthrough, the Bermuda Hundred/Howlett Line
front, and First Petersburg (June 9) remain outside this scenario** — each is its own lane or
its own shipped battle with its own dignity handling.

## 1. Scope And Planning Boundary

**Battle:** the initial assaults on Petersburg, Virginia (the Second Battle of Petersburg) —
**June 15-18, 1864**, a standalone SINGLE PHASE at the battle's grain (the four-day arc carried
through timed reinforcements on BOTH sides; each day's weight arrives on the sourced clock).

**Tactical id and future file:** `petersburgAssaults` in `data/petersburg-assaults.json` (the
hyphenated cedar-creek/stones-river filename convention; the registry accessor is
`GAME_DATA["petersburg-assaults"].petersburgAssaults`).

**Player-facing title:** `Petersburg: The Initial Assaults`.

**Playable shape:** a standalone single-objective scenario (the Franklin / Five Forks /
Spotsylvania / Wilderness shipped pattern — no `phases[]` block, no T8 routing, no new engine
capability, so no D92 phase-weight audit is owed).

- **Roles:** `attacker:"US"` / `defender:"CS"`. Grant's army crossed the James to seize
  Petersburg before Lee could shift the Army of Northern Virginia south; Beauregard's
  improvised defense is the sourced defensive invariant.
- **Objective:** **the eastern approach into Petersburg — the city ground behind the Dimmock
  Line** (the corridor the final Confederate line covered). The objective anchor sits on the
  INNER ground, NOT on the outer works: the outer Dimmock batteries fell on June 15 and the
  city never did — the sourced shape is a breached outer line and a held city, and the anchor
  placement is what lets both be true in the same seed.
- **Date/grain law:** one phase, one continuous fight. The sourced clock anchors (Smith's
  attack delayed to 7:00 p.m. June 15; Hancock's 16,000 at about 9:00 p.m.; Hoke's brigades
  overnight; the June 16 II Corps Redan attacks; Potter's stealthy pre-dawn June 17 approach;
  the overnight June 17-18 retirement to the final line; Kershaw and Field filing in June 18;
  the 4:00 p.m. June 18 assaults) live inside the single phase as timing/reinforcement INPUTS.
- **Fog:** top-level `defaultFog:false`. The June 15 exploitation died of darkness, command
  conservatism, and Cold Harbor's shadow — not weather — and the engine's fog model aids the
  DEFENDER, which would double-count the defender's improvisation edge. Night and hesitation
  are timing inputs and teaching cards, never a fog buff (THE REINFORCEMENT-RACE LAW,
  section 5).
- **Menu rank:** `petersburgAssaults:69`, between `spotsylvania:68` and `kennesaw:70` —
  campaign chronology (Spotsylvania May 12 → Petersburg June 15-18 → Kennesaw June 27). No
  existing rank moves, but SIX shipped adjacency/chronology teeth and FOUR shipped scope scans
  must be reshaped in the runtime commit (section 11 — the D391/D393 insertion-lesson class,
  now TEN named obligations). **THE COLD HARBOR RANK DISCLOSURE:** 69 is the only free integer
  between 68 and 70; Cold Harbor (June 3, 1864) stays DEFERRED per D395, and an explicit Aaron
  reorder inserting it would carry its own rank-renumber obligation of this same insertion
  class — that consequence is accepted and disclosed here, not discovered later.
- **Weather:** hot, dry mid-June Virginia; the weather hint ships `Inferred` (no fetched
  source gives a June 15-18 weather report; the frozen Classic layer is never cited as a
  source).
- **No battle-named branch or special combat mechanic:** no Petersburg-specific code path, no
  hesitation/caution system, no command-paralysis stat, no scripted halt, no night-assault
  mechanic, no USCT-specific modifier in either direction. The scenario is data on the
  existing universal engine.
- **Terminal boundary:** D396 stops before `data/petersburg-assaults.json`, T1/T10
  registration, any focused runtime probe, any count movement, any generated-game behavior
  change, and the full release battery.

## 2. Research Basis And Source Register

This contract uses the committed 1864-65 attrition packet (its §14 D396 addendum records this
pass's corrections) plus the two D396 gather → default-refute workflows. No claim is promoted
beyond its evidence. A URL's presence does not turn a thin or disputed claim into a Verified
claim.

**The single-scholar disclosure (the Howe/Chick roots):** the modern tactical narrative of
June 15-18 leans on **Thomas J. Howe, *Wasted Valor: The Battle of Petersburg, June 15-18,
1864*** and **Sean Michael Chick, *The Battle of Petersburg, June 15-18, 1864***, with A.
Wilson Greene's Petersburg scholarship behind the ECWC essay; the ABT and Beyond-the-Crater
strength/casualty tables collapse to ONE official-returns/CWSAC root, the eight NPS URLs are
one publisher family, and the Wikipedia battle article plus its biography cluster is one
family. Where this register says "Verified," it means at least two genuinely independent
source FAMILIES support the exact claim with those collapses named; where every path leads to
one root, the claim ships `Inferred` with the root named (the Rhea-root/Shea-root precedent).

| Source | Contract use | Confidence |
|---|---|---|
| [ABT Petersburg battle page](https://www.battlefields.org/learn/civil-war/battles/petersburg) | The siege frame (June 1864-April 1865, the 292-day siege follows the failed assaults); the Dimmock Line 55-battery/10-mile description; USCT battery captures under Hinks; the Crater/New Market Heights/Fort Stedman/April 2 exclusion wall | Verified, re-fetched this pass (the packet-era citation stands) |
| [ABT opening-assaults map page](https://www.battlefields.org/learn/maps/petersburg-opening-assaults-june-16-1864) | Capt. Charles Dimmock and the summer-1862 line; the ravine flanking of Battery 5 (26th Virginia); Smith's 7:00 p.m. delay awaiting Hancock; the June 16 II Corps Redan captures "at a frightful cost" | Verified, fetched |
| [ABT "Storming Battery 9"](https://www.battlefields.org/learn/articles/storming-battery-9-petersburg-june-15-1864) | The 4th USCT (Lt. Col. Rogers) and 1st USCT at Battery 9; 3,700+ USCT engaged; 378 killed and wounded that day; Kiddoo's "fullest confidence" report; the "capable combat soldiers" judgment | Verified, fetched |
| [ABT Baylor's Farm heritage site](https://www.battlefields.org/visit/heritage-sites/baylors-farm) | The morning June 15 delaying action: Dearing's cavalry + the Petersburg Artillery; "Never before tested in battle, Hinks' black soldiers pressed forward"; slightly more than 300 Union casualties; the 22nd USCT leading | Verified, fetched |
| [NPS "The Opening Assaults"](https://www.nps.gov/pete/learn/historyculture/the-opening-assaults.htm) | Smith's 14,000 vs Beauregard's 2,200; the "two mile-long hole" (its own breach figure); Hancock's II Corps at 9 p.m. with 16,000; Lee convinced and rushing reinforcements | Verified, fetched |
| [NPS Battery 5](https://www.nps.gov/places/battery-5.htm) + [interpretive trail](https://www.nps.gov/places/confederate-battery-5-interpretive-trail.htm) | Battery 5 as the salient (four guns); the 7:00 p.m. two-hour assault; the "1.5-mile-long hole" (the NPS-internal breach conflict, disclosed); the capture confirmed | Verified, fetched |
| [NPS Battery 9](https://www.nps.gov/places/battery-9.htm) | Black Federal troops captured the position on June 15 | Verified, fetched (one sentence) |
| [NPS Civil War Series — Siege of Petersburg §5](https://npshistory.com/publications/civil_war_series/20/sec5.htm) | Hinks's 3,500-man division; Batteries 7 through 11 (its own range); the captured gun of Graham's Petersburg Artillery; the June 18 supporting role and 36 losses | Verified, fetched |
| [NPS historical handbook 13](https://www.npshistory.com/handbooks/historical/13/hh13d.htm) | 18,000 Union on the way vs fewer than 4,000 under Beauregard; "by dusk of that second day Beauregard could muster about 14,000"; Lee down from Chester; the 4:00 p.m. June 18 1st Maine charge (850 strong there — scope disclosed); "Grant's attempt to capture Petersburg had failed, with a loss of 10,000 men" | Verified, fetched |
| [NPS battle-unit record — 1st Maine Heavy Artillery](https://www.nps.gov/civilwar/search-battle-units-detail.htm?battleUnitCode=UME0001RAH) | "Sustained greatest loss of any one Regiment in any one action of the War" (June 18) | Verified, fetched |
| [Wikipedia — Second Battle of Petersburg](https://en.wikipedia.org/wiki/Second_Battle_of_Petersburg) | The chronology spine; Brooks/Martindale/Hinks + Kautz composition; the per-day strength ladder (50,000 June 16 / 67,000 June 18 vs 14,000 / 20,000+); the 5,400-38,000 CS infobox range; casualties 11,386 (1,688/8,513/1,185) vs ~4,000 (200/2,900/900) — ITS Union-only reading; Baylor's Farm (second family); "at the mercy of the Federal commander, who had all but captured it"; the Willcox "Major General" anachronism (documented error, section 6) | Verified, fetched (one family with its biography cluster) |
| Wikipedia biography cluster (Beauregard, W. F. Smith, Hancock, Gibbon, Kershaw, Hoke, B. Johnson, Hinks, Dearing, Wise, Burnside, Ledlie, Potter, Willcox, Warren, Griffin, Ayres, Crawford, Cutler, Field, Wright) | The battle-date rank wall of section 6, each entry carrying its own adjudicated confidence; the Smith restored-commission trail; the Willcox brevet trail | Fetched; per-claim confidence in section 6 |
| [Encyclopedia Virginia — the Dimmock Line](https://encyclopediavirginia.org/entries/dimmock-line-the/) | Only 2,200 Confederates positioned in the Dimmock Line June 15; the 7:00/7:15 bombardment-then-infantry sequencing; Batteries Six through Eleven to the USCT by nine o'clock (its own range); "conservative Union commanders" and the deferred night advance | Verified, fetched — the packet-era `/entries/petersburg-campaign-the/` slug 404s and the live `/entries/petersburg-campaign/` entry carries no June-15-18 numbers |
| [ECWC Petersburg essay (PDF)](https://www.essentialcivilwarcurriculum.com/assets/files/pdf/ECWC%20TOPIC%20Petersburg%20Essay.pdf) | The 55-battery Dimmock description (second family); "nearly three miles" captured June 15 (its own breach figure); "darkness and uncertainty caused the blue-clad commanders to defer"; "outnumbered six-to-one" June 17; "the First Petersburg Offensive ended with the city still in Confederate hands"; the whole-campaign 70,000 wall figure (NEVER a June-15-18 number) | Verified, fetched (one authored essay — the Greene voice) |
| [ECW "Petersburg Day Four"](https://emergingcivilwar.com/2021/06/18/petersburg-day-four-saturday-june-18-1864/) | Lee at 11:00 a.m. June 18 conferring with Beauregard at the Customs House; Kershaw's veterans filing in (second family); the ~23,000 inbound scope; Wilkeson's refusal testimony | Verified, fetched |
| [ECW 1st Maine guide map](https://emergingcivilwar.com/2021/10/22/under-fire-battlefield-guide-map-for-the-charge-of-the-first-maine-heavy-artillery/) | 632 of ~900 in about ten minutes, the war's worst single-action regimental loss (the 115/489/28 split ships `Inferred` — not on this page) | Verified for the 632/worst-loss facts, fetched |
| [Beyond the Crater — Second Petersburg summary](https://www.beyondthecrater.com/resources/bat-sum/first-offensive-summaries/the-second-battle-of-petersburg-summary/) + [CS OOB](https://www.beyondthecrater.com/oob/petersburg-siege-oob/2-off-oob/confederate-army-2/) + [Lee's OR dispatches](https://www.beyondthecrater.com/resources/ors/vol-xl/part-1-sn-80/or-xl-p1-293-r-e-lee-anv/) | The CWSAC-root aggregate table (104,000 / 62,000 / 42,000; 11,386 as the GRAND total — the scope collision, section 3); the Hoke/Johnson brigade rosters; Wise's brigade plus militia as the whole opening force; the Pickett/Howlett-Line dispatches (the scope wall); Kershaw + Field June 18 (first family) | Fetched; OR-mirror/compilation voice — never counted as a second family against ABT's table |
| [NARA — Grant's lieutenant general nomination](https://www.archives.gov/legislative/features/grant) | The D390-fetched Grant rank anchor stands: the act signed February 29, 1864; Senate confirmation March 2, 1864; General-in-Chief a role, not a rank | Verified, fetched (D390) |
| Thomas J. Howe, *Wasted Valor: The Battle of Petersburg, June 15-18, 1864*; Sean Michael Chick, *The Battle of Petersburg, June 15-18, 1864* | The controlling monographs behind the tertiary web; named on every claim whose corroboration collapses toward them | The scholarly anchors — cited by name, not by URL |

**Two-source rule:** every future runtime teaching card and codex claim stamped `Verified`
requires at least two genuinely independent source families supporting that exact claim, with
the NPS-publisher, Wikipedia-cluster, CWSAC-root, and Howe/Chick collapses applied honestly.
One family = `Inferred`; a real conflict = `Disputed` with both values shown. The runtime
slice may amend this register with a second family before upgrading provenance; it may not
silently promote a claim in runtime data. **The highest-leverage upgrade path: a page-cited
Howe (1988) fetch — the single pass that would lift the per-day division-grain strengths and
the June 17 assault sequencing from `Inferred` toward `Verified`.**

**Citation-integrity corrections this pass (baked in, per-fact):** several ABT facts-box
numbers surfaced only via search snippets and are excluded as load-bearing (the fetched-page
rule); the ECW guide-map URL carries a "six-18" slug typo (the corrected June-18 slug is in
this register); the packet-era Encyclopedia Virginia campaign slug 404s; no live NPS Baylor's
Farm page exists (the guessed slug 404s — ABT and Wikipedia carry that action); the NPS
publisher's own two pages conflict on the June 15 breach length (disclosed in section 4).

## 3. Strength And OOB Contract

Use engaged forces at the eastern front, never army-present or whole-campaign figures sold as
committed totals.

- **THE PER-DAY LADDER (context frame, each figure with its family and scope named):** June
  15: CS **2,200 ON THE DIMMOCK LINE** (EV + NPS + the Wikipedia battle article) inside
  Beauregard's **~5,400 WHOLE FORCE** ("boys, old men, and patients" — the Wikipedia
  biography + Beyond the Crater; the NPS handbook's "less than 4,000" a third scope) against
  Smith's **14,000** (NPS) / **15,000-16,000 moved** (EV), plus Hancock's **16,000 at about
  9:00 p.m.** (NPS). June 16: CS **~14,000** (Wikipedia + NPS) vs US **~50,000** (Wikipedia;
  ECW corroborates). June 17: **"outnumbered six-to-one"** (ECWC, qualitative). June 18: CS
  **"over 20,000"** (Wikipedia) with Lee's **~23,000 inbound** (ECW scope note) vs US
  **~67,000** (Wikipedia). Whole-battle: the Wikipedia infobox CS range **5,400-38,000**; the
  CWSAC-root aggregate **104,000 total / US 62,000 / CS 42,000** (ONE root cited twice —
  ABT + Beyond the Crater). All shipped `Disputed` as a cluster, never one number.
- **NO source pins per-day committed axis totals or division-engaged strengths** — every
  committed split ships as an Inferred envelope.
- **Committed-total envelopes (engine abstractions, all `Inferred`):** the runtime slice
  authors inside these envelopes and the plan probe enforces them once data exists:
  - **US committed 25,000-62,000** across the four-day arc — the opening wave small
    (Smith + Hinks + Kautz, **10,000-18,000** on-map at start), then Hancock's II Corps,
    Burnside's IX Corps, and Warren's V Corps entering as timed reinforcements on the sourced
    clock.
  - **CS committed 14,000-30,000** across the arc — **with the OPENING ON-MAP GARRISON
    STRICTLY 2,200-5,400** (THE REINFORCEMENT-RACE LAW, section 5): Wise's brigade, Dearing's
    cavalry, and the militia scrapings; then Hoke's division overnight June 15-16, Johnson's
    division June 16-17, and the Kershaw/Field First Corps relief June 18 as timed arrivals.
- **Named formations the OOB may field with `Verified identity; Inferred strength`:** US —
  Hinks's 3rd Division XVIII Corps (all-USCT; the 22nd, 4th, 1st, 5th, and 6th USCT are the
  named regiments of its June 15 record); Brooks's and Martindale's XVIII Corps divisions;
  Kautz's cavalry division; Birney's, Gibbon's, and Barlow's II Corps divisions; Ledlie's,
  Potter's, and Willcox's IX Corps divisions; Griffin's, Ayres's, Crawford's, and Cutler's V
  Corps divisions; the 1st Maine Heavy Artillery (June 18, within Birney's front — its charge
  is the June 18 card). CS — Wise's brigade (the opening line); Dearing's cavalry brigade;
  the Petersburg Artillery (Graham's battery is its named element); Hoke's division
  (Clingman, Hagood, Martin, Colquitt); Bushrod Johnson's division (Wise's, Elliott's,
  Ransom's, Gracie's brigades); Kershaw's and Field's First Corps divisions (June 18 timed
  relief). **VI Corps (Wright) is NEVER fielded — THE VI CORPS ABSENCE WALL (no fetched
  source places it in these assaults); Pickett's division is NEVER fielded — THE
  PICKETT/BERMUDA HUNDRED SCOPE WALL (Lee's own dispatches place it on the Howlett Line).**
- **Every lower split ships coarse:** brigade strengths, crew counts, experience, formation,
  readiness, reinforcement seconds, and exact sector placements remain coarse and `Inferred`
  unless a register source pins them.
- **Captures are outputs, never inputs:** the several hundred of Wise's men captured June 15,
  Graham's gun, and the battery counts are teaching content; no prisoner count, capture rate,
  or gun-capture figure is ever an engine input or a probe tooth.

## 4. Terrain And Works Contract

The future map must carry these landmarks as terrain, objective, marker, road, or teaching
context. Coordinates and geometry remain Inferred abstractions.

- **The Dimmock Line** — the 10-mile, 55-battery fortified arc (ABT + ECWC, two families)
  laid out from the summer of 1862 under Capt. Charles Dimmock: the OUTER works, formidable
  in profile and nearly empty of men on June 15. Its eastern face (Batteries 1 through 11) is
  the fielded ground.
- **Battery 5** — the salient (four guns) whose rear a ravine exposed; the June 15 breach
  anchor. **The ravine** is the sourced approach geometry (ABT + NPS).
- **Battery 9** — the USCT storming ground (the 4th and 1st USCT).
- **Baylor's Farm** — the morning June 15 delaying position on the City Point Railroad
  approach (Dearing + the Petersburg Artillery vs Hinks's division); an approach-corridor
  landmark or the opening cavalry/USCT contact texture.
- **The Jordan Point Road** — Hinks's sourced approach axis.
- **The breach frontage** — the June 15 hole in the line: **`Disputed` — "1.5-mile-long"
  (NPS Battery 5 page) vs "two mile-long" (NPS opening-assaults page) vs "nearly three
  miles" (ECWC)** — ships as a disclosed range, never one number.
- **Harrison Creek** — the improvised intermediate line ground where Beauregard's men dug in
  overnight June 15-16 (the first fallback).
- **The final line** — the June 18 position: the overnight June 17-18 retirement, "500-800
  yards" (Beyond the Crater) / "approximately half a mile closer to Petersburg" (NPS), where
  the race ended and the works finally had an army in them. The objective anchor sits behind
  this ground.
- **The Prince George Court House Road** — the June 18 1st Maine charge corridor (NPS).
- **Petersburg itself** — the city edge as the objective context; the Appomattox River
  bounding the northern flank; the City Point Railroad as the Union approach corridor.

The works are built from the universal breastwork/entrenchment cover vocabulary the engine
already owns; open approach fields and the ravine are ordinary open/cover classes. No terrain
element writes casualties, morale, rout, score, or winner.

## 5. The Reinforcement-Race Law

The June 15-18 fight has an accurate-input encoding, and this scenario ships it ONLY through
levers the engine already owns:

1. **The sourced fact (Verified, multi-family):** the works were nearly EMPTY on June 15 —
   about 2,200 men on a 10-mile line against 14,000-18,000 attackers — and the defense was
   rebuilt in motion: Beauregard stripped the Howlett Line unilaterally, Hoke's division
   arrived overnight June 15-16, Johnson's June 16-17, and Kershaw's and Field's First Corps
   veterans filed in on June 18 as Lee finally turned the Army of Northern Virginia south.
   The attacker's opportunity DECAYED by the hour; the defender's works filled by the hour.
2. **The engine-native encoding:** (a) the opening CS on-map garrison is HONESTLY TINY —
   strictly inside the 2,200-5,400 envelope — holding real works; (b) every Confederate
   accession is a TIMED REINFORCEMENT on the sourced clock, never a starting garrison; (c)
   the Union weight also arrives on its sourced clock (Smith's 7:00 p.m. June 15 step-off
   after the Baylor's Farm delay; Hancock about 9:00 p.m.; Burnside June 16; Warren June
   17-18), so hesitation costs the attacker exactly what the record says it cost; (d) works
   geometry (the Dimmock profile, the Harrison Creek line, the final line) carries the
   defensive value — cover classes the engine owns.
3. **FORBIDDEN encodings:** any static full garrison; any hesitation/caution/command-paralysis
   stat or multiplier; scripting Smith's halt, the night pause, or the overnight retirements
   as events; a night/darkness combat penalty standing in for the sourced timing; any
   "opportunity" or "race" bonus; modeling Cold Harbor's shadow as a morale modifier. The
   race texture must emerge from garrison size, works geometry, arrival clocks, and mass.
4. **The teaching card carries the law:** "the race for the works" ships as a card (section
   9), so the player learns why four days of Union assaults against a line that began the
   battle almost empty ended with the city held — and what the hesitation bought.

## 6. Battle-Date Ranks And Command Traps

The future runtime probe searches leaders, unit commanders, notes, brief/end text, teaching
cards, and codex content. Rank checks are scenario-scoped. June 1864 sits on live promotion
seams, and this battle adds REVERSE traps of its own: officers whose later grades must not
be backdated here, and two officers whose famous earlier traps now legitimately resolve.

**Union:**

- **Lt. Gen. Ulysses S. Grant** — General-in-Chief (a ROLE, not a rank; he directs the
  crossing and the assaults through Meade and Butler). The grade was revived by the act
  Lincoln signed February 29, 1864; the Senate confirmed March 2, 1864 (NARA, fetched at
  D390). He is NEVER a full "General" — that grade waited for July 1866.
- **Maj. Gen. George G. Meade** — commanding the Army of the Potomac under Grant's direct
  supervision. Never the theater commander; never promoted.
- **Maj. Gen. William F. "Baldy" Smith — THE RESTORED-COMMISSION TRAP, resolved:** commanding
  XVIII Corps (Army of the James, on loan to the Petersburg front) as a MAJOR GENERAL. His
  first MG appointment (July 4, 1862) EXPIRED March 4, 1863 when the Senate failed to
  confirm, reverting him to brigadier general; he was re-nominated and the Senate confirmed
  him major general of volunteers **March 9, 1864**. The Wikipedia battle article's
  "Brigadier General William F. 'Baldy' Smith" is adjudicated as the stale-grade error class
  — the dated commission trail controls — and the intra-family conflict ships disclosed, not
  hidden. His June 15 evening halt in front of a broken line is the scenario's central
  teaching fact, encoded ONLY as the sourced timing (section 5), never as a caution stat.
- **Maj. Gen. Winfield S. Hancock** — II Corps (grade since November 29, 1862), arriving
  about 9:00 p.m. June 15 with 16,000. **THE SENIORITY-DEFERENCE FACT:** though senior to
  Smith, Hancock deferred to him because Smith knew the ground and had been on the field all
  day (his biography, verbatim). The deference is a card, never a mechanic.
- **Maj. Gen. David B. Birney** and **Maj. Gen. John Gibbon — THE REVERSE ANACHRONISM:**
  Gibbon's major-generalcy is dated **June 7, 1864 — BEFORE this battle**, so here (unlike
  the Wilderness, where his brigadier grade was the trap) he IS `Maj. Gen. John Gibbon`. The
  fetched battle article never names his June 15-18 division role; if fielded, his division
  ships as ordinary II Corps weight. **Brig. Gen. Francis C. Barlow** — led his division
  against Redans 13, 14, and 15.
- **Maj. Gen. Ambrose E. Burnside** — IX Corps, now inside the Army of the Potomac (the
  D390/D392 incorporation seam — late May 1864 — is behind this battle; the exact day stays
  `Disputed` and is never load-bearing).
- **Brig. Gen. James H. Ledlie — THE SUCCESSOR-CHAIN LOCK:** commanding the 1st Division IX
  Corps from **June 9, 1864**, succeeding Brig. Gen. Thomas G. Stevenson (killed May 10 —
  the D392 Stevenson wall's chain continues here). His division's June 17 evening failure is
  sourced; his Crater infamy belongs to a DIFFERENT lane and no card here may borrow it.
- **Brig. Gen. Robert B. Potter** — 2nd Division IX Corps; his stealthy pre-dawn June 17
  approach and dawn attack is the sourced June 17 texture.
- **Brig. Gen. Orlando B. Willcox — THE ANACHRONISM CATCH, this battle's documented error
  class:** commanding the 3rd Division IX Corps as a BRIGADIER GENERAL. The Wikipedia battle
  article renders him "Major General," but his own biography carries only a BREVET major
  generalcy to rank from **August 1, 1864 — AFTER this battle** (nominated December 12,
  1864; confirmed April 14, 1865). Never `Maj. Gen. Willcox` at the initial assaults.
- **Maj. Gen. Gouverneur K. Warren** — V Corps (MG August 8, 1863), arriving for the June
  17-18 weight. His division commanders **Griffin, Ayres, Crawford, and Cutler are ALL
  BRIGADIER GENERALS** on June 15-18 (each carries only a brevet-MG dated August 1, 1864 or
  later — after this battle). Never a major general among them here.
- **Brig. Gen. Edward W. Hinks** — 3rd Division XVIII Corps (rank from November 29, 1862),
  the division composed entirely of United States Colored Troops; its June 15 record is the
  scenario's USCT proving ground (section 9). **Brig. Gens. William T. H. Brooks and John H.
  Martindale** — the other XVIII Corps divisions. **Brig. Gen. August Kautz** — the cavalry
  division on the approach.
- **THE VI CORPS ABSENCE WALL:** Maj. Gen. Horatio G. Wright and VI Corps fought at Cold
  Harbor through June 12 and are NOT in the June 15-18 assaults — no fetched source places
  them here and the battle article never mentions Wright. VI Corps is never fielded and no
  card may put it on this field.
- **Col. — no colonel-grade trap is load-bearing here;** regimental commanders (Lt. Col.
  George Rogers of the 4th USCT is the named example) ship at their sourced grades.

**Confederate:**

- **Gen. P. G. T. Beauregard — THE FULL-GENERAL ANCHOR, this battle's bind anchor:** commanding the initial defense of Petersburg as a full GENERAL, CSA — one of only seven officers appointed to that grade, his date of rank July 21, 1861, fifth in seniority. He commands the Department of North Carolina and Southern Virginia; the defense of June 15-17 is HIS, "arguably his finest combat performance of the war." He is never a lieutenant general, never a subordinate of Lee in this window, and never erased in favor of Lee on any June 15-17 card.
- **Gen. Robert E. Lee — THE LATE-ARRIVAL TRAP:** full General, Army of Northern Virginia.
  He dispatches two divisions toward Petersburg beginning **3:00 a.m. June 18** and arrives
  in person about **11:00 a.m. June 18**, conferring with Beauregard at the Customs House
  (ECW; NPS's "came down from Chester" corroboration). **Never render Lee commanding the
  Petersburg defense on June 15-17** — that erasure is this battle's signature historical
  error, and it steals Beauregard's due.
- **Brig. Gen. Henry A. Wise** — his brigade plus the militia scrapings ARE the opening
  Dimmock Line force (2,200 on the line); the former governor of Virginia. His
  Military-District-of-Petersburg assignment dated June 17 is paperwork disclosure, never a
  battle-date command claim beyond his brigade.
- **Maj. Gen. Robert F. Hoke** — division arriving overnight June 15-16 (MG April 23, 1864,
  ranking from April 20). His brigades at the June 15-18 front: **Brig. Gens. Thomas L.
  Clingman, Johnson Hagood, James G. Martin, and Alfred H. Colquitt** (the OOB lists five
  brigades with Martin's — his June 28 relief is after this battle and never encoded).
- **Maj. Gen. Bushrod R. Johnson** — division (MG May 21, 1864) with **Wise's, Elliott's,
  Ransom's, and Gracie's brigades** under it in the OOB voice.
- **James Dearing — THE UNCONFIRMED-COMMISSION TRAP:** commanding Beauregard's cavalry
  brigade (the Baylor's Farm delaying action). He was slated for brigadier general **April
  29, 1864, and the promotion was NEVER approved by the Confederate Congress** — he served
  in the grade regardless. He ships as `Brig. Gen. James Dearing` ONLY with the
  unconfirmed-commission disclosure on his card/note (the Anderson-temporary-grade class);
  a bare unannotated grade is a probe-catchable error.
- **Maj. Gen. Joseph B. Kershaw — THE REVERSE OF THE WILDERNESS BIND:** his major-generalcy
  is dated **June 2, 1864 — BEFORE this battle**, so here he IS `Maj. Gen. Joseph B.
  Kershaw`, filing his First Corps division into the Petersburg line on June 18 (three
  families). The Wilderness's brigadier lock must never leak forward onto this field.
- **Maj. Gen. Charles W. Field** — the other First Corps division arriving June 18
  (Wikipedia + Beyond the Crater; ECW corroborates two divisions on hand). His grade is
  Verified; his exact MG date-of-rank is unpinned by the fetched biography and ships
  `Inferred` — no card may state it as settled.
- **THE PICKETT/BERMUDA HUNDRED SCOPE WALL:** Maj. Gen. George Pickett's division reached
  Drewry's Bluff June 16 and held the Howlett Line trenches from June 17 (Lee's own OR
  dispatches) — it was NEVER in the Petersburg assaults proper, and neither Pickett nor the
  Bermuda Hundred front may appear in this scenario's OOB.
- **Promotion-paperwork dates are disclosure-only:** Smith's March 9 restoration, Willcox's
  August-1-dated brevet, Dearing's unconfirmed appointment, Hoke's April 20/23 pairing,
  Martin's June 28 relief, and Wise's June 17 district assignment are paperwork facts;
  battle-date GRADES are the probe-pinned law, and no teaching card states a disputed
  paperwork date as settled fact.

Command loss enters the model ONLY as accurate inputs; no general officer dies on this field
in the sourced record, and none may be killed by a card.

## 7. City-Hold Direction Law And Honest A/B

The runtime slice runs exactly eight shared-model deterministic seeds in one serialized
focused process. The direction law, derived from sources and from both refute passes:

1. **THE CITY GUARD — the defender ultimately holds:** in at least **5/8** seeds the CS
   retains the Petersburg city-approach objective. Sourced as the uncontested outcome: "the
   First Petersburg Offensive ended with the city still in Confederate hands" (ECWC), and
   the 292-day siege followed (ABT). A Union capture of the city is the honest alt-history
   minority spread — the record itself says Petersburg was "at the mercy" of the June 15
   attacker — never the lean.
2. **THE AGGREGATE CASUALTY-DIRECTION TOOTH:** in at least **5/8** seeds total US losses
   EXCEED total CS losses — DIRECTION only, never a magnitude, ratio, or per-side count.
   The direction survives every honest fetched pairing (even the widest: 8,150 vs 4,000 —
   the CWSAC grand-total reading against Wikipedia's CS figure); **THE 11,386 SCOPE
   COLLISION** (the same headline number rendered Union-only by Wikipedia and grand-total by
   the CWSAC root) ships `Disputed` on every card and is never load-bearing. The
   Stones-River inversion check ran and this battle is NOT inverted: the attacker bled more
   and failed.
3. **The race textures are EMERGENT requirements, not teeth:** the scenario must be authored
   so the accurate inputs (the tiny opening garrison, the timed accessions, the ravine
   geometry, the massed but staggered Union weight) make the June 15 outer-works breach and
   the June 18 futility natural textures across seeds — but no probe asserts a breach, a
   breach timing, a battery count, or a per-day event.
4. **No forced winner:** the engine's existing result/DRAW grain applies. A city-hold
   majority with occasional Union captures or draws is the honest spread; nothing writes the
   result.

**Forbidden guards:** any casualty magnitude, ratio, split, or per-side count tooth; any
prisoner, capture, gun-loss, surrender, or battery-count tooth; any timing tooth on the June
15 breach, the night pause, the June 17-18 retirement, or the June 18 assaults; any per-day
casualty tooth (no per-day split is sourced).

If the runtime slice changes any simulation input after the first eight-seed battery,
`DECISIONS.md` logs the old value, new value, and both observed guard counts for every
iteration. Eligible inputs are committed strengths inside the section 3 envelopes (the
opening-garrison sub-envelope included), coarse OOB splits, universal gun counts, ordinary
leader quality/aura inputs, terrain/cover/works geometry, formation, experience/readiness,
reinforcement timing (the sourced four-day clock), entry positions, objective radius, and
universal time/hold thresholds. No result-derived multiplier or scripted verdict is
eligible. If the two guards cannot BOTH be reached from enumerated honest inputs, that is a
HALT-and-surface per the standing law — never a fudge, never a weakened tooth.

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
`hesitationMult`, `cautionMult`, `commandParalysis`, `delayPenalty`, `opportunityBonus`,
`raceBonus`, `nightMult`, `darknessPenalty`, `garrisonBonus`, `worksEmptyBonus`,
`assaultRefusal`, `refusalMult`, `usctBonus`, `usctPenalty`, `valorBonus`, `greenTroopMult`.

Named temptations, all forbidden: a hesitation/caution stat for Smith, Hancock, or Meade
standing in for the sourced timing inputs; a night or darkness combat penalty; scripting the
June 15 halt, the Howlett-Line strip, or the overnight retirements as events; modeling "Cold
Harbor syndrome" as a morale or refusal multiplier (the June 18 refusals are a teaching
card; the engine's honest inputs — exhausted mass against filled works — carry the result);
ANY USCT-specific combat modifier in either direction (no green-troops penalty, no valor
bonus — accuracy-as-dignity means the same universal model for every soldier); a Beauregard
genius aura beyond ordinary leader inputs; a mine, bombardment, or special-assault event (the
mine belongs to the Crater lane); any source branch that checks `petersburgAssaults` and
writes combat output; hardcoding ANY casualty magnitude anywhere.

The result must emerge from committed strength, the tiny opening garrison, works and ravine
geometry, timed arrivals on both sides, formation, experience/readiness, universal command
aura, and the objective/time model.

## 9. Teaching, Dignity, And Memory Contract

The runtime slice requires at least eight restrained teaching cards plus one codex entry.
Every claim obeys the two-source/provenance rule with the NPS-publisher, Wikipedia-cluster,
CWSAC-root, and Howe/Chick collapses disclosed (section 2); sourced quote text is rendered
exactly; disputed counts show both values. **Human cost is rendered with gravity and without
glory framing.**

1. **The race for the works.** The 10-mile, 55-battery Dimmock Line stood nearly empty —
   2,200 men — when 14,000 arrived in front of it; the defense was rebuilt in motion faster
   than the attack could bring itself to walk in. THE REINFORCEMENT-RACE LAW's engine
   encoding IS this card (section 5).
2. **The bridge that made it possible.** Grant slipped a 100,000-man army out of Lee's front
   and across the James on the war's longest pontoon bridge — the strategic surprise that
   put Smith in front of empty works (links the existing T13 engineering teaching layer; the
   2,100-foot figure is already shipped there).
3. **THE USCT PROVING GROUND — accuracy as dignity.** Hinks's division fought through
   Baylor's Farm in the morning ("Never before tested in battle, Hinks' black soldiers
   pressed forward") and stormed the Dimmock batteries in the evening — the exact range
   ships `Disputed` (Six through Eleven vs 7 through 11), the captures themselves Verified —
   taking a gun of Graham's Petersburg Artillery, at a cost of 378 killed and wounded on
   June 15. Kiddoo's "fullest confidence in the fighting qualities" report and the "capable
   combat soldiers" judgment anchor the card: twelve days after Cold Harbor, the first major
   USCT combat validation in Virginia. Their June 18 supporting role (36 losses) ships
   `Inferred`. Nothing is invented, nothing erased — and no massacre content exists anywhere
   in this scenario (the Crater is its own lane with its own dignity law).
4. **The night Petersburg stood open.** Smith halted in the dark in front of a broken line;
   Hancock, senior, deferred to the man who knew the ground; "conservative Union commanders"
   were satisfied with a mile of works. Petersburg "at that hour was clearly at the mercy of
   the Federal commander, who had all but captured it." Taught as the cost of caution after
   Cold Harbor — human, understandable, and catastrophic — never as a stat.
5. **Beauregard's finest hours.** The unilateral Howlett-Line strip, the two overnight
   fallback lines dug in motion, 2,200 grown to 20,000 in three days — "arguably his finest
   combat performance of the war." The defense of June 15-17 is Beauregard's, not Lee's; Lee
   arrives at 11:00 a.m. on June 18 to a line already saved. Credit rendered where the
   record puts it.
6. **June 18 — the price of the lost race.** The works were full when the last grand assault
   went in. The 1st Maine Heavy Artillery lost 632 of about 900 men in roughly ten minutes —
   the war's worst single-action regimental loss (the 115/489/28 split ships `Inferred`) —
   and Frank Wilkeson's testimony carries the veterans' refusal: men "supremely disgusted
   with the display of military stupidity." Taught with respect for the soldiers' learned
   judgment, not mockery of it.
7. **The ledger of the four days.** THE 11,386 SCOPE COLLISION is shown to the player as a
   lesson in reading sources: Wikipedia renders 11,386 as the Union loss alone (beside CS
   ~4,000); the CWSAC root renders the same figure as BOTH armies together (US 8,150 / CS
   3,236); the NPS handbook says simply "a loss of 10,000 men." The direction is the
   teaching: the attacker bled at better than two-to-one and the city held — and the 292-day
   siege that followed killed more than the four days ever did.
8. **What the race decided.** Grant did not take Petersburg, but he pinned the Army of
   Northern Virginia to it and never let go: the campaign's dual reading (a Confederate
   defensive victory that began the siege that doomed the Confederacy) ships with both
   framings shown.
9. **What this scenario deliberately is not.** The Crater, New Market Heights (its own
   SHIPPED scenario), Fort Stedman, the April 2 breakthrough, the Bermuda Hundred/Howlett
   Line front (Pickett's ground), and First Petersburg (June 9) are outside; no card borrows
   their content. No massacre content is playable anywhere in this lane.
10. **First Petersburg as context.** The June 9 "battle of old men and young boys" may be
    NAMED as context for Wise's threadbare garrison, teaching-only, never fielded.

The codex entry uses `theater:"Eastern"`, `campaign:"Richmond-Petersburg (Initial
Assaults)"`, and `result:"Confederate victory"` (the city held; the assaults failed), with
the dual strategic framing of card 8 taught beside it, the attrition arithmetic stated
plainly, and the USCT proving ground carried as a codex thread.

## 10. Frozen Classic And Rail-Route Collision Law

The Petersburg NAME is already load-bearing in three separate shipped layers, and the
tactical slice must not touch any of them:

- frozen Classic `build/base.html` has exactly one
  `{id:"petersburg-break", name:"Fall of Petersburg", year:1865, ...}` roster row — the
  APRIL 2, 1865 breakthrough at the Classic layer, a DIFFERENT battle: its `atk:"US"`,
  strengths, and result text are never a source for this scenario, and the row stays
  byte-for-byte;
- `data/logistics-rail.json` already carries a strategic-layer route keyed
  `petersburg-break` ("Petersburg rail lifelines", provenance `Inferred`) — a separate
  layer: the tactical slice must not edit, rename, or delete it, and must not add any new
  route;
- teaching prose across shipped layers (the T13 pontoon-bridge card naming Petersburg, the
  codex/generals/divergence content, New Market Heights's Richmond-Petersburg framing) is a
  separate teaching layer — prose mentions of Petersburg are NOT tactical seams, and the
  runtime-seam scans of the plan probe target TACTICAL IDENTIFIERS only
  (`petersburgAssaults`, `petersburg-assaults`, the registry/menu/DOM/suite strings).

The new tactical id is `petersburgAssaults` and the new data filename is
`petersburg-assaults.json` — deliberately DISTINCT from the Classic `petersburg-break` id and
from every future Petersburg lane (the Crater, Fort Stedman, the April 2 tactical
breakthrough), so no layer ever shares a key. New Market Heights (menu rank 45) is its own
shipped scenario in the same campaign frame; nothing in this scenario duplicates or moves it.

## 11. Planned-Only And Future Complete-Integration Baselines

### D396 planned-only baselines (must remain exact)

- registered tactical scenarios: **23**;
- battle files / total schema files: **23 / 53**;
- Army Register: **1434**;
- explicit flags / valid weather hints / Intel opening-scene coverage / media opening scenes:
  **23 / 23 / 23 / 23**;
- no-regression suite list: **128**; sweep comment: **23** battles;
- generated HTML md5: **`4fc16d813663f9e2285583fca1bc2939`**;
- frozen base md5: **`c9db83fa99230ffb95bdfdfe059f3fb9`**;
- no `data/petersburg-assaults.json`, no `tools/probe-petersburg-initial-assaults.mjs`, no
  T1/T10/runtime integration, and no tactical Petersburg identifier in any scanned
  integration surface (the pre-existing frozen Classic `petersburg-break` row, its strategic
  rail route, and the shipped teaching prose are separate layers and do not count as
  tactical seams).

The D396 plan probe fails if even one tactical Petersburg runtime seam appears while the data
file is absent. Half-registration is always red.

### Future atomic integration contract (the runtime slice, D397 or the then-live number)

All surfaces arrive in one green runtime commit or the plan probe fails closed:

- `data/petersburg-assaults.json`, top-level key `petersburgAssaults`, single-phase per
  section 1 (attacker US / defender CS, `defaultFog:false`, objective/terrain/oob/
  reinforcements in the Franklin/Five Forks shape), committed strengths inside the section 3
  envelopes with the OPENING GARRISON strictly inside 2,200-5,400, terrain per section 4,
  THE REINFORCEMENT-RACE LAW inputs per section 5, ranks per section 6, teaching per
  section 9;
- `src/tactical/T1-bull-run.js` exact registry line
  `R.petersburgAssaults = GAME_DATA["petersburg-assaults"].petersburgAssaults` and menu rank
  `petersburgAssaults:69` between `spotsylvania: 68` and `kennesaw: 70` with no other rank
  moved;
- tactical scenarios **23 -> 24**;
- `tools/validate-data-schemas.mjs` battle enrollment (`petersburg-assaults.json`) and total
  schema files **53 -> 54**;
- `tools/probe-tactical-roster.mjs` and `tools/probe-custom-battle-builder.mjs` historical
  baselines include `petersburgAssaults`; the roster DOM check includes
  `fldScnBtn_petersburgAssaults`; single-phase, so `PHASE_COUNTS` gains NO entry;
- Army Register **`1434 + (unique Petersburg side-unit ids × 3)`**, with every whole-registry
  pin moved and documented in the same commit — grep the OLD value `1434` across `tools/`
  (**THIRTEEN sites at D396 authoring:** probe-cedar-creek, probe-cross-keys-port-republic,
  probe-elkhorn-tavern, probe-five-forks, probe-fort-donelson, probe-gaines-mill,
  probe-new-market-heights, probe-spotsylvania, probe-stones-river, probe-wilderness,
  probe-loot-survival ×2 [the pin and the `1434 of 1434` UI count], and
  probe-women-in-war-arc-plan's exact whole-registry tooth); the full pin-history chain is
  preserved and the new `D###: 1434 -> N — Petersburg initial assaults ...` fragment is
  appended in the documented-history format;
- **THE TEN NAMED RESHAPE OBLIGATIONS (the D391/D393 insertion-lesson class, all in the same
  runtime commit, each with a documented-history comment, each proven by the binds):**
  1. `tools/probe-kennesaw.mjs` menu-order adjacency tooth (`kennesaw === spotsylvania + 1`
     becomes the five-battle chronology with `petersburgAssaults` between them);
  2. `tools/probe-kennesaw.mjs` DOM-button adjacency tooth (same chronology, DOM variant);
  3. `tools/probe-spotsylvania.mjs` menu chronology tooth (its `kennesaw ===
     spotsylvania + 1` leg reshapes; Spotsylvania keeps rank 68);
  4. `tools/probe-spotsylvania.mjs` DOM-button chronology tooth (same, DOM variant);
  5. `tools/probe-wilderness.mjs` menu chronology tooth (its `kennesaw === spotsylvania + 1`
     leg reshapes; Wilderness keeps rank 67);
  6. `tools/probe-wilderness.mjs` DOM-button chronology tooth (same, DOM variant);
  7. `tools/probe-wilderness.mjs` SCOPE forbidden-id regex (drops `petersburg`, keeps
     coldharbor/cold-harbor/crater/overlandCampaign forbidden);
  8. `tools/probe-wilderness.mjs` forbidden-data-file scan (the `data/` filename regex drops
     `petersburg`, keeps cold-harbor/crater forbidden);
  9. `tools/probe-spotsylvania.mjs` SCOPE forbidden-id regex (same drop, same keeps);
  10. `tools/probe-spotsylvania.mjs` forbidden-data-file scan (same drop, same keeps);
- registry-count and coverage pins move with documented history in the same commit:
  probe-five-forks's registry count/scenario **23 -> 24**, probe-spotsylvania's and
  probe-wilderness's `23-scenario registry` counts, `tools/probe-flags.mjs` coverage
  **23 -> 24**, `tools/probe-intel-uhd617-profile.mjs` coverage **23 -> 24**, the
  vet-no-regression sweep comment **23 -> 24**, and the media largest-scene check re-audited
  against Kennesaw's 17;
- `src/tactical/T10-flags.js` explicit metadata **`E / true / anv`** (Eastern theater; AotP
  II/V/IX and XVIII Corps badges legible; the June-1864 Virginia defenders and the arriving
  First Corps use the Southern Cross family) and `tools/probe-flags.mjs` coverage teeth at
  24;
- flags/weather/Intel/media coverage **23 -> 24**; the weather hint ships hot/dry `Inferred`;
- `tools/probe-petersburg-initial-assaults.mjs` focused browser/runtime guard enrolled in
  `tools/vet-no-regression.mjs`; suite **128 -> 129** and sweep comment **23 -> 24**;
- the focused probe fields exactly eight unique deterministic seeds, the **CS-holds-the-city
  ≥5/8** guard AND the **aggregate casualty-direction US>CS ≥5/8** guard (direction only,
  never magnitude — the section 7 law), rank walls per section 6 (including the Willcox and
  Dearing forbidden renderings, the Smith major-general lock, the Kershaw/Gibbon REVERSE
  locks, and the Lee-late-arrival / VI-Corps-absence / Pickett-absence walls), the D74 scan
  per section 8 (including the hesitation/night/USCT-modifier families), the opening-garrison
  sub-envelope check, Classic/rail separation per section 10, and 0 pageerrors, exiting
  nonzero on failure;
- generated `civil_war_generals.html` rebuilt only through `node tools/build.mjs`;
- frozen Classic `petersburg-break` row unchanged byte-for-byte; the strategic rail route
  untouched; no new rail route;
- honest A/B per section 7 if any simulation input moves after the first battery;
- no Cold Harbor, Crater, Fort Stedman, April 2 tactical, Bermuda Hundred, or Overland
  multi-phase data or registration of any kind (they remain packet lanes or deferred).

## 12. Plan Probe Contract

`tools/probe-petersburg-initial-assaults-plan.mjs` is filesystem-first, dual-mode, and
fail-closed. It writes `tools/shots/probe-petersburg-initial-assaults-plan.json`, exits
nonzero on failure, prints exactly one 12-step summary, and reports each failed step on
stderr. Because this spec is hard-wrapped, its text anchors match on whitespace-normalized
text (the D385 idiom) — the teeth still bite on any word-level tamper.

The twelve steps, in this exact order, are:

1. `FILES + STATUS`
2. `SHAPE + ID + DATE`
3. `ROLES + OBJECTIVE`
4. `TERRAIN + WORKS`
5. `OOB + STRENGTHS`
6. `RANKS + COMMAND TRAPS`
7. `SOURCES + PROVENANCE`
8. `CITY + DIRECTION LAW`
9. `D74 NO-FUDGE WALL`
10. `TEACHING + DIGNITY`
11. `FUTURE DIRECTION + INTEGRATION`
12. `LANE + BASELINES`

When the runtime data file is absent, the probe requires every D396 count/hash above and
rejects any partial tactical runtime seam. When the runtime data file is present, it requires
the complete 24/54/`1434+3U`/24/129 integration plus the single-phase shape, the
US-attacker/CS-defender roles, fog off, the envelope sums with the opening-garrison
sub-envelope, the rank walls, the teaching provenance, the focused-probe direction contract
(eight seeds, the city-hold guard, the casualty-direction tooth), the absence walls
(VI Corps, Pickett), and the Classic/rail separation. Half-registration is always red. The
`LANE + BASELINES` step anchors on durable ladder history and the role-roster owner check
(any recognized TOP-LOOP tool), never the current lock holder (the D381 relay lesson).

## 13. D396 Negative Bind And Focused Gate

After the clean plan probe passes:

1. record md5 for this spec, the plan probe, the generated HTML, and the frozen base;
2. change only the section 6 Beauregard rank-lock line — the bulleted lock whose bolded head
   names Beauregard as the full-general bind anchor — to a lieutenant-general battle-date
   rendering (a one-token patch);
3. run `node tools/probe-petersburg-initial-assaults-plan.mjs` and require exit 1 with
   exactly `RANKS + COMMAND TRAPS` red (11/12 green);
4. restore the line byte-identically with the file-edit tool (never a broad checkout);
5. require the spec md5 to match its pre-bind value exactly;
6. rerun the plan probe 12/12 green and read the JSON artifact (ok=true, twelve green
   steps);
7. no red probe artifact may enter git.

The rank tooth is section-scoped to section 6's own body (the D383 hardening — a mention of
Beauregard's grade elsewhere in this document can never mask a tamper). Harden only the rank
tooth if the tamper fails too broadly or does not bite. Do not weaken any unrelated tooth.

Set `TMPDIR="$PWD/.tmp"` and run serially:

```bash
node --check tools/probe-petersburg-initial-assaults-plan.mjs
node tools/build.mjs
node tools/validate-data-schemas.mjs
node tools/probe-battle-build-research.mjs
node tools/probe-petersburg-initial-assaults-plan.mjs
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

Require build `GATE OK`; generated HTML md5 unchanged `4fc16d813663f9e2285583fca1bc2939`;
schema 53/53; research 15/15 (with the packet §14 addendum — additive, the D383/D387/D390/
D392 precedent); Petersburg plan 12/12; all eleven prior plan probes green (`ALL OK`); suite
list 128; every produced JSON/HTML artifact parsed and read; no failed step or recursive
pageerror. Do not run `npm run vet:noreg` — D394 discharged the release checkpoint and this
slice moves no runtime byte. Do not run any browser probe — no simulation input exists in a
planning slice.

## 14. Future Runtime Gate Contract

The runtime slice starts only from the clean pushed D396 contract under a LANE-003 DRIVE
recorded in the ledger. At minimum it runs, serially and with full artifact readback:

- `node --check` on every new/touched JS/MJS file, including preparse of any cooked browser
  SETUP/DOM strings (the S-03 amendment-8 law);
- `node tools/build.mjs`;
- `node tools/validate-data-schemas.mjs`;
- `node tools/probe-battle-build-research.mjs`;
- `node tools/probe-petersburg-initial-assaults-plan.mjs` (implementation-present branch);
- `node tools/probe-petersburg-initial-assaults.mjs` (single-phase runtime guard:
  registry/menu/launch, role/fog/objective assertions, THE REINFORCEMENT-RACE LAW inputs
  incl. the opening-garrison sub-envelope, the eight-seed city-hold battery AND the
  aggregate casualty-direction tooth, rank walls incl. the Willcox/Dearing/Smith/Kershaw/
  Gibbon locks and the Lee/VI-Corps/Pickett walls, the D74 scan, Classic/rail separation,
  0 pageerrors);
- `node tools/probe-spotsylvania.mjs`, `node tools/probe-wilderness.mjs`, and
  `node tools/probe-kennesaw.mjs` — the TEN reshaped adjacency/scope teeth proven green, and
  `node tools/probe-chattanooga.mjs` as the upstream menu neighbor;
- `node tools/probe-five-forks.mjs` — its whole-registry count pin moved with documented
  history;
- `node tools/probe-tactical-roster.mjs`;
- `node tools/probe-custom-battle-builder.mjs`;
- `node tools/probe-loot-survival.mjs`;
- `node tools/probe-flags.mjs`;
- `node tools/probe-weather.mjs`;
- `node tools/probe-intel-uhd617-profile.mjs`;
- `node tools/probe-media-budget.mjs`;
- `node tools/vet-no-regression.mjs --list`;
- the registry-removal bind AND the Beauregard-rank bind, each proving exactly its
  predeclared teeth red with byte-identical (md5-proven) restores;
- honest A/B per section 7 if any simulation input moves after the first battery;
- `git diff --check`.

After playable Petersburg is green, the full serialized `npm run vet:noreg` release battery
runs at the next agreed checkpoint, ALONE on the machine — the Petersburg runtime will be
the first battle since D394's 128/128, so that checkpoint lands AT or within 2-3 battles of
the runtime slice per the D160/D176 law.

## 15. D396 Completion Criteria

D396 is green when this spec and `tools/probe-petersburg-initial-assaults-plan.mjs` pass
12/12; the Beauregard rank bind makes exactly one step red and restores byte-identically;
every required focused artifact is read; the 23/53/1434/23/128 baselines, sweep 23,
generated HTML md5 `4fc16d813663f9e2285583fca1bc2939`, and frozen base md5
`c9db83fa99230ffb95bdfdfe059f3fb9` remain exact; the attrition packet carries the §14 D396
spec-time addendum; canonical docs record the single-phase shape, THE REINFORCEMENT-RACE
LAW, the city-hold + casualty-direction law, THE 11,386 SCOPE COLLISION disclosure, the
USCT proving-ground contract, the ten named reshape obligations, and the runtime boundary;
the final D396 commit is pushed with LANE-003 released to CONTRACT/unowned; and no
Petersburg tactical runtime surface has started.
