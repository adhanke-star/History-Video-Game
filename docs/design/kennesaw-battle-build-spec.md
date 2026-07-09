# Kennesaw Mountain Battle-Build Spec (D330)

**Status:** D330 planning/spec + probe scaffold. This is durable repo state before runtime implementation. It does not add `data/kennesaw.json`, a registry line, a menu button, or generated HTML behavior.

**Task shape:** build Kennesaw Mountain as the first Atlanta/March battle-build item after D327/D329 completed the research library. D330 locks the intended scope, source traps, OOB grain, rank rules, D74 no-fudge wall, and future probe teeth so D331 can implement without inventing units, ranks, strengths, terrain, quotations, casualties, or combat exceptions.

## Scope

**Battle:** Kennesaw Mountain, June 27, 1864.

**Playable shape:** a single-phase frontal-assault scenario.

- **Roles:** top-level `attacker:"US"` / `defender:"CS"`.
- **No `phases[]`:** one coherent assault, not a T8 sequence.
- **Fog:** `defaultFog:false`. The teaching point is a daylight frontal assault into prepared high ground, not a fog-of-war seizure.
- **Objective:** seize the ridge crest / Confederate breastwork line linking the two assault sectors: Pigeon Hill / Little Kennesaw on the north, and Cheatham's Hill / the "Dead Angle" on the center.
- **Historical direction:** the player-as-attacker historically loses. Kennesaw should be allowed to end differently under skillful play, but the default AI-vs-AI pattern should make the US fail to seize the ridge and lose more men because the ground, works, guns, and OOB inputs are true.

## Source Register

These are the minimum D331 anchors. Add more before data authoring if a rank, strength, sector, battery, or terrain claim remains unsettled.

| Source | Use | Current confidence |
|---|---|---|
| NPS, Kennesaw Mountain National Battlefield Park overview (`https://www.nps.gov/kemo/index.htm`) | Kennesaw terrain sequence: Big Kennesaw, Little Kennesaw, Pigeon Hill, Cheatham Hill, Confederate seven-mile defense, Atlanta proximity | Verified for landscape and campaign framing |
| NPS, Union Order of Battle (`https://www.nps.gov/kemo/learn/historyculture/union-order-of-battle.htm`) | Sherman, Thomas, Newton, Davis, Morgan L. Smith, Giles A. Smith, Lightburn, Walcutt, Harker, Wagner, Kimball, McCook, Mitchell, and Union battery organization | Verified for campaign OOB and named assault brigades; not a strength table |
| NPS, Confederate Order of Battle (`https://www.nps.gov/kemo/learn/historyculture/confederate-order-of-battle.htm`) | Johnston, Hardee, Cheatham, Maney, Vaughn, Cleburne, Walker, French, Loring, and artillery organization | Verified for campaign OOB and principal defending formations; not a strength table |
| NPS National Register text, Kennesaw Mountain National Battlefield Park (`https://npgallery.nps.gov/pdfhost/docs/NRHP/Text/66000063.pdf`) | Sector-grain assault strengths, two-pronged assault shape, Pigeon Hill terrain, Dead Angle defenses, named assault brigades, casualty direction | Verified. It records 5,500 Federals at Pigeon Hill, 9,000 Federals in Newton's and Davis's Cheatham Hill assault, and US ~3,000 losses vs CS under 1,000 |
| American Battlefield Trust, Kennesaw Mountain (`https://www.battlefields.org/learn/civil-war/battles/kennesaw-mountain`) | Date, result, broad casualty direction, terrain names, warning that 150,000/100,000 are campaign/army-group totals | Verified in D327 packet. Use broad casualty direction only, not exact count-forcing |
| American Battlefield Trust, Cheatham Hill article (`https://www.battlefields.org/learn/articles/cheatham-hill`) | Cheatham Hill assault participants and line distance | Verified as a secondary anchor: Newton's division plus McCook and Mitchell from Davis's division attacked there |

## OOB And Rank Traps

Do not encode a unit, commander, rank, strength, or sector until it is verified against at least two reputable anchors or explicitly marked Inferred. The D331 data should prefer NPS OOB identity and the NPS National Register sector narrative, then mark game-scale strength abstractions honestly where a source gives only sector totals.

### Union Assault Force

- **William T. Sherman - Major General, USA.** Commanding the Military Division of the Mississippi. Do not backdate "General" or lieutenant general.
- **George H. Thomas - Major General, USA.** Army of the Cumberland; chose the Cheatham Hill assault sector.
- **John M. Schofield - Major General, USA.** Army of the Ohio; his demonstration on the far right was Sherman's only strategic gain, but it is not the playable assault objective.
- **James B. McPherson - Major General, USA.** Army of the Tennessee; present at Kennesaw and killed later at Atlanta on July 22. Do not carry him into post-July-22 Atlanta scenarios.
- **John A. Logan - Major General, USA.** XV Corps, Army of the Tennessee, directs the Pigeon Hill attack.
- **Morgan L. Smith - Brigadier General, USA.** His XV Corps Second Division furnishes the Pigeon Hill assaulting brigades. The NPS order of battle lists him as a brigadier general; do not inflate him.
- **Pigeon Hill assault:** the NPS National Register narrative identifies three brigades and about **5,500 Federals**: Brig. Gen. Giles A. Smith, Brig. Gen. Joseph A. J. Lightburn, and Col. Charles Walcutt. Use this as a sector total, not three invented full-strength brigades.
- **Cheatham Hill / Dead Angle assault:** the NPS National Register narrative identifies about **9,000 Federals** in Newton's and Davis's divisions. It specifically names Newton's brigades under Brig. Gen. Charles G. Harker, Brig. Gen. George D. Wagner, and Brig. Gen. Nathan Kimball, and Davis's two attacking brigades under Cols. Daniel McCook and John G. Mitchell.
- **John Newton - Brigadier General, USA.** IV Corps Second Division. The NPS OOB and ABT Cheatham Hill article anchor his role.
- **Jefferson C. Davis - Brigadier General, USA.** XIV Corps Second Division. Do not confuse him with Confederate president Jefferson Davis, and do not overpromote him at Kennesaw.
- **Charles G. Harker - Brigadier General, USA.** Killed June 27 at Kennesaw; NPS OOB confirms death at the battle.
- **Daniel McCook - Colonel, USA.** Mortally wounded at the Dead Angle. Do not inflate him to general.
- **John G. Mitchell - Colonel, USA.** Attacks the south flank of the salient with part of Davis's division; do not inflate him.

### Confederate Defenders

- **Joseph E. Johnston - General (full), CSA.** Commanding the Army of Tennessee at Kennesaw. Relieved July 17, 1864; do not carry him past that date into later Atlanta scenarios.
- **John Bell Hood - not army commander at Kennesaw.** Hood takes over July 18 at the temporary full-general grade and is not the Kennesaw army commander.
- **William J. Hardee - Lieutenant General, CSA.** Hardee's corps holds the Cheatham/Cleburne portion; lieutenant general is correct here, not an anachronism.
- **William W. Loring - Major General, CSA.** Commands Polk's old corps after Polk is killed June 14. His corps and Walker/French sectors cover the Pigeon Hill/Little Kennesaw end in the NPS National Register narrative.
- **Benjamin F. Cheatham - Major General, CSA.** His division anchors the Cheatham Hill line. The hill is later named for the successful defense by his troops.
- **George E. Maney - Brigadier General, CSA.** Maney's Tennessee Brigade is part of Cheatham's Division in the NPS Confederate OOB. The D327 packet and ABT page tie Maney/Dead Angle to the defense. Do not mark Maney as a major general.
- **Alfred J. Vaughn - Brigadier General, CSA.** Vaughn's Tennessee Brigade is in Cheatham's Division in the NPS Confederate OOB and is a required rank-trap guard. Do not spell him "Vaughan" in data unless quoting a source variant; the NPS OOB uses Vaughn.
- **Patrick R. Cleburne - Major General, CSA.** Cleburne's Division is in Hardee's Corps and defends the low ridge area with Cheatham. Do not make him a lieutenant general.
- **W. H. T. Walker and Samuel G. French - Major Generals, CSA.** The NPS National Register text assigns Walker's and French's divisions to the Pigeon Hill/Little Kennesaw defense. Use as sector context, not a license to overbuild every regiment in one scenario.

### Strength Rule

- **Forbidden:** ABT's 150,000 vs 100,000 or any similar whole-theater / army-group total. Those are campaign totals and cannot enter OOB.
- **Verified sector totals for D331 modeling:** Pigeon Hill = about **5,500 Federals** attacking; Cheatham Hill / Dead Angle = about **9,000 Federals** attacking. The combined attacking slice is therefore about 14,500, consistent with the smaller engaged-strength figure but not equal to Sherman's whole army.
- **Confederate sector strengths:** the NPS National Register text identifies defending divisions and works, but not exact brigade headcounts for every unit. D331 may use game-scale, explicitly **Inferred** defending brigade strengths drawn from the named divisions/brigades, but must not invent a source label. If a runtime number is not directly sourced, the note must say "Verified identity; Inferred strength."

## Landmarks

Minimum landmark set for D331 data:

- **Pigeon Hill / Little Kennesaw sector:** Little Kennesaw, Pigeon Hill, Burnt Hickory Road, steep gorge, dense underbrush, abatis, vertical rock faces, Confederate breastworks, supporting batteries from Little Kennesaw.
- **Cheatham Hill / Dead Angle sector:** Cheatham's Hill, the "Dead Angle" salient, Dallas Road / south-of-Dallas-Road approach, open wheat field, deep trenches, firing platforms, traverses, abatis, chevaux-de-frise, sharpened pine stakes, a small creek between the lines, Mebane's two-gun Tennessee Battery / redoubt, flanking artillery south of the salient.
- **Campaign frame:** Big Kennesaw and the Western & Atlantic Railroad as context, not the objective; Powder Springs Road / Schofield's right-flank demonstration as the strategic reason Johnston later withdraws, not as the playable assault.

## Victory And Balance Intent

Use the universal combat model only. Outcomes must emerge from OOB, terrain, timing, doctrine, gun counts, cover, slope, and the existing objective-hold mechanics.

- Aggregate/default pattern: CS defensive victory in the majority; the US attacker fails to seize the ridge/breastwork objective.
- Casualty direction: US losses exceed CS losses by a wide margin. The NPS National Register text estimates US casualties around 3,000 and Confederate losses below 1,000, with main-line Confederate losses minimal because the breastworks protected them. This is a **direction guard**, never a count-forcing gate.
- Player agency: a skilled US player can do better by massing, timing, and using artillery, but the default AI-vs-AI run should teach why the frontal assault was a mistake.
- The attacker losing is not a scripted loss. It must come from dense attacker columns, short but exposed approaches, high ground, breastworks, abatis, rocky slope, flanking canister, and cautious Confederate defense.
- Schofield's demonstration belongs in teaching/end-note text. The battle can note that Sherman gained operational leverage on the flank after the tactical repulse, but the playable objective is the failed assault line.

## Teaching And Anti-Lost-Cause Framing

- **The frontal-assault trap:** Sherman tried a costly direct assault after weeks of maneuver. The lesson is the brutal advantage of prepared defenders on high ground in 1864, not Confederate romance or inevitability.
- **Confederate tactical success, strategic failure:** Johnston's army won the June 27 defensive fight but did not stop Sherman. The battle delayed the campaign, raised Southern morale briefly, and then Johnston withdrew when Schofield threatened the flank.
- **No Lost-Cause overread:** Do not frame Johnston as a perfect genius or Hood as the only problem. Johnston's defensive caution preserved the army but yielded initiative and space; Hood's later attacks bled the army in a different way.
- **Human cost with gravity:** Harker, McCook, and many men reached or nearly reached the works and were killed, wounded, or captured. The "Dead Angle" is teaching about the cost of tactical doctrine against field fortifications, not a spectacle.
- **Atlanta-election connection:** The Kennesaw repulse did not save Atlanta. The campaign continued to Atlanta's fall, which helped Lincoln's reelection and emancipation's survival.

## D74 No-Fudge Acceptance Gates

D331 implementation must not introduce any battle-specific damage, firepower, morale, casualty, or winner-writing keys. Forbidden examples include `damage`, `dmg`, `fireMult`, `fireMultiplier`, `casualtyMult`, `lossMult`, `killMult`, `fudge`, `powerMult`, or any Kennesaw-only combat switch.

Required D331 gates:

- `node tools/build.mjs`
- `node tools/validate-data-schemas.mjs`
- `node --check tools/probe-kennesaw-plan.mjs`
- `node --check tools/probe-kennesaw.mjs`
- `node tools/probe-kennesaw-plan.mjs`
- `node tools/probe-kennesaw.mjs`
- `node tools/probe-tactical-roster.mjs`
- `node tools/probe-custom-battle-builder.mjs`
- `node tools/probe-chattanooga.mjs`
- `git diff --check`

Browser/readback gates must inspect JSON artifacts under `tools/shots/` and require `ok=true`, zero failed steps, and zero pageerrors. Do not weaken existing probes.

## Future Probe Teeth

When `data/kennesaw.json` is added:

- `tools/probe-kennesaw.mjs` must verify a single-phase scenario with no `phases[]`, US attacker / CS defender, `defaultFog:false`, ridge/breastwork objective, Pigeon Hill / Little Kennesaw / Burnt Hickory Road landmarks, Cheatham's Hill / Dead Angle / Dallas Road / Mebane battery landmarks, and Schofield flank teaching.
- Runtime probe must verify rank traps: Sherman = Maj. Gen.; Johnston = Gen.; Thomas, Schofield, McPherson = Maj. Gen.; Hardee = Lt. Gen.; Cheatham and Cleburne = Maj. Gen.; Maney and Vaughn = Brig. Gen.; Harker = Brig. Gen.; McCook and Mitchell = Col.; Hood is not army commander.
- Runtime probe must verify OOB-strength honesty: no 150,000/100,000 campaign totals; Pigeon Hill and Cheatham Hill sector totals or notes are present; any unsourced unit strength is marked Inferred.
- Runtime probe must verify the D74 no-fudge key family by scanning `data/kennesaw.json` directly.
- Balance/direction teeth: across a small deterministic seed set, the US fails to seize in the majority and US casualties exceed CS casualties in the majority. The probe should guard direction, not exact counts.
- Both-baselines gotcha: `tools/probe-tactical-roster.mjs` `EXPECTED`, menu order, and DOM button list must include `kennesaw`; `tools/probe-custom-battle-builder.mjs` historical-registry baseline must include `kennesaw`.
- Adjacent guard: `tools/probe-chattanooga.mjs` must stay green to protect the immediately preceding Western-theater scenario.

## D330 Completion Criteria

D330 is green when this durable packet exists, the D330 plan probe passes, build remains green, current registry probes remain green without Kennesaw registered, JSON readback is inspected, and live docs record that D331 is the next runtime implementation slice only after this spec is committed and pushed.
