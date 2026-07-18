# Gaines' Mill Battle-Build Spec (D361)

**Status:** D361 planning/spec plus filesystem plan probe. This slice adds no runtime data, registry entry, menu button, generated-game behavior, or combat change.

**Task shape:** build the first LANE-003 battle from `docs/design/battle-build-research/eastern-1862-battle-build-research.md`. Gaines' Mill is the Seven Days counterpart to the shipped Malvern Hill battle. The same objective-hold engine must produce the opposite result from different historical inputs.

## Scope

**Battle:** Gaines' Mill, Virginia, June 27, 1862.

**Playable shape:** single-phase defender-hold focused on the decisive evening assault.

- **Roles:** `attacker:"CS"` / `defender:"US"`.
- **Shape:** no `phases[]`. The single clock compresses the afternoon pressure and the 7-8 p.m. general assault into one battle with scheduled reinforcements.
- **Fog:** `defaultFog:false`. Woods and smoke complicated sight, but fog was not the defender's load-bearing advantage. Boatswain's Creek, the wooded slope, the ridge, and Federal artillery carry that job.
- **Doctrine:** `assaultDoctrine:"standard"`. A. P. Hill's early attacks were piecemeal, but this scenario centers Lee's evening mass. The cautious-doctrine switch would erase the concentration the battle needs to teach.
- **Objective:** the Watt House plateau behind the Boatswain's Creek line. Confederate control represents breaking Porter's arc before darkness; Union control represents buying enough time to withdraw across the Chickahominy.
- **Historical direction:** Confederate attacker wins a majority of the eight-seed battery. Confederate killed and wounded exceed Union killed and wounded in a majority. These are independent direction guards.
- **Menu rank:** `gainesMill:15` belongs after `bullrun1:10` and before `malvernHill:18`, preserving battle chronology while putting the two Seven Days inverses beside each other.

## Source Register

The D329 research packet supplied the starting hypothesis. These sources control D362 runtime claims where they conflict with a summary or label.

| Source | Runtime use | Confidence |
|---|---|---|
| National Park Service, Richmond NBP, [The Battle of Gaines' Mill](https://www.nps.gov/rich/learn/historyculture/gainesmillbull.htm) | Porter's 27,000-man core force and later rise toward 34,000; 1.5-mile defensive arc; swampy Chickahominy at his back; Whiting and Hood at the first break; Watt House; roughly 6,000 Union total casualties and 9,000 Confederate killed/wounded | Verified for field shape, operational sequence, breakthrough, and casualty direction; not proof that only 27,000 Federals were present at 7 p.m. |
| National Park Service, CWSAC, [Gaines' Mill battle detail](https://www.nps.gov/civilwar/search-battles-detail.htm?battleCode=va017) | Boatswain's Swamp behind the V Corps line; Peninsula Campaign/result; broad 34,214 US / 57,018 CS and casualty context | Verified for the named terrain and broad context; its generic commander rank labels do not control battle-date ranks |
| American Battlefield Trust, [Gaines' Mill battle page](https://www.battlefields.org/learn/civil-war/battles/gaines-mill) | Broad force figures 34,212 US / 57,018 CS; Boatswain's Creek; Watt and Adams farms; Jackson's arrival; Confederate victory; casualties 6,800 US / 8,700 CS | Verified for broad context, terrain names, sequence, and result |
| American Battlefield Trust, [Gaines' Mill, 7:00-8:00 p.m. map](https://www.battlefields.org/learn/maps/gaines-mill-june-27-1862-700-800-pm) | One final-assault estimate: about 32,000 Confederates in 16 brigades; Porter around 34,000 including reinforcements; more Federal artillery; Brig. Gen. Hood's Texas regiments first through the line | Verified as the source's stated estimate and concentration; the aggregate is Disputed against CMH's 50,000 figure |
| U.S. Army Center of Military History, [The Virginia Campaigns, March-August 1862](https://history.army.mil/portals/143/Images/Publications/catalog/75-5.pdf) | Porter's 20,000-man V Corps line plus Slocum's 7,000-man division; ridge and Old/New Cold Harbor road context; Lee and Jackson's combined force near 60,000; 50,000 Confederates amassed for the 6:30 p.m. assault; Brig. Gen. Porter and Brig. Gen. Hood; Longstreet and A. P. Hill open the attacks | Verified source claims; the 50,000 final-assault count conflicts with ABT's roughly 32,000 |
| National Park Service, [Fitz John Porter](https://www.nps.gov/people/fitz-john-porter.htm) | Porter remained a brigadier general on June 27; his major-general promotion came July 4, 1862 | Verified battle-date rank when paired with CMH's Brig. Gen. Porter identification |
| American Battlefield Trust, [A. P. Hill](https://www.battlefields.org/learn/biographies/p-hill) | Hill became a major general on May 26, 1862 and commanded the Light Division during the Seven Days | Verified battle-date rank when paired with Virginia Humanities below |
| Virginia Humanities, Encyclopedia Virginia, [A. P. Hill](https://encyclopediavirginia.org/entries/hill-a-p-1825-1865/) | Hill's rapid promotion from brigadier general after Williamsburg to youngest major general, before the Seven Days | Independent corroboration of Hill's battle-date grade and Light Division role |
| National Park Service, [John Bell Hood](https://www.nps.gov/people/john-bell-hood.htm) | Hood became a brigadier general in March 1862; he commanded the Texas Brigade and helped break Porter's line at Gaines' Mill; his major-general promotion followed in October | Verified battle-date rank and brigade role when paired with CMH and the ABT 7-8 p.m. map |
| Library of Congress, [Map of the battle field of Gaines's Mill](https://www.loc.gov/resource/g3884o.cw0558100/) | Period-derived roads, houses, drainage, vegetation, and commander positions. Use as map corroboration, not a numerical strength source | Verified map artifact; later 1885 publication |

## Reverification Readback

The packet's single-phase recommendation survives. The source recheck exposes a real strength dispute and therefore narrows what the game may claim.

- ABT's 34,212 / 57,018 figures describe the broad forces engaged or available over the battle. D362 must not put 57,018 Confederates into one synchronized game charge.
- The CMH account starts Porter with 20,000 men and adds Slocum's 7,000. NPS calls that the core defensive force, then says later reinforcements raised Porter toward 34,000. A **27,000-man modeled Union force is therefore a deliberate core-line abstraction**, not the exact 7 p.m. total.
- The Confederate final-assault aggregates conflict. ABT's 7-8 p.m. map says about 32,000 in 16 brigades; CMH says Lee had amassed 50,000 by 6:30 p.m.; NPS describes about 60,000 brought to the attack over the battle. D362 may model **31,500-32,500 Confederates only as the bounded 16-brigade ABT slice**. The aggregate provenance is **Disputed; modeled strength Inferred**, never Verified.
- The paired ABT evening estimate is roughly 32,000 CS against roughly 34,000 US. This spec intentionally does not claim that its 32,000-versus-27,000 game abstraction is a same-source snapshot. It selects the core Federal line and the specifically enumerated 16-brigade Confederate wave so the single universal engine can represent the decisive contact without fielding every late or supporting formation. That choice must remain visible in teaching/provenance and cannot be described as an exact OOB.
- Meagher and French did enter late. They remain teaching-only in the 27,000 abstraction because their addition would require changing the modeled time slice to the reinforced evening total. If D362 includes them, it must move the Union total toward 34,000 and re-open the paired Confederate aggregate instead of silently adding only one side.
- NPS and ABT agree that Hood's Texas Brigade made the first break. That fact supports a named brigade and teaching card. It does not authorize a scripted breakthrough, bonus key, forced rout, or winner write.
- NPS and ABT both show a costly Confederate victory. The casualty tooth must subtract captured and missing men from total losses before comparing killed/wounded direction.

## Strength And Timing Contract

D362 should use the existing single-phase reinforcement seam to compress the afternoon without turning the game into an undocumented two-phase battle.

### Union defenders

- **Opening V Corps line:** about 20,000 active men across Morell, Sykes, and McCall abstractions. The three identities are historical; each game-unit split remains Inferred until D362 pins it.
- **Slocum reinforcement:** about 7,000 from VI Corps, scheduled after the first Confederate pressure. CMH gives the aggregate. Exact brigade splits and arrival seconds remain Inferred.
- **Artillery:** Porter had a material artillery advantage. D362 must carry gun counts through the universal gun model and give the Union more guns than the Confederacy. Crew totals remain subordinate to `guns`.
- **Late II Corps support:** Meagher and French appear in teaching as real late arrivals omitted from the bounded core-line abstraction. Runtime inclusion requires a pinned engaged count and arrival role, moves the Union model toward 34,000, and re-opens the paired Confederate aggregate. Do not smuggle them into the 27,000 contract.

### Confederate attackers

- **Opening pressure:** Longstreet and A. P. Hill begin the attack. A. P. Hill's Light Division must appear as a named unit under a major general.
- **Evening mass:** D. H. Hill, Ewell, Whiting, Jackson's supporting elements, and Hood's Texas Brigade supply the later weight. The combined modeled Confederate field strength remains within 31,500-32,500 as an **Inferred 16-brigade abstraction under a Disputed aggregate**, not a claim that only those men assaulted.
- **Texas Brigade:** Hood is a brigadier general. The brigade belongs within Whiting's division and carries no battle-specific combat bonus.
- **Timing:** reinforcements may create concentration through arrival sequence. They cannot receive a hidden morale, damage, speed, casualty, score, or capture modifier.

### Honest A/B rule

If D362 changes a simulation input after the first run, log both values and the observed eight-seed direction result in `DECISIONS.md`. Eligible inputs are OOB strength inside the ranges above, gun counts, unit experience, terrain placement, reinforcement timing, formation, objective radius, and the universal time/hold thresholds. A result-derived multiplier is forbidden.

## OOB And Rank Traps

The runtime probe must search the full Gaines' Mill payload, including leaders, units, notes, and teaching.

- **Fitz John Porter:** `Brig. Gen. Fitz John Porter`. NPS dates his promotion to major general of volunteers to July 4, seven days after Gaines' Mill. Reject `Maj. Gen. Fitz John Porter` in this battle.
- **A. P. Hill:** `Maj. Gen. A. P. Hill`, Light Division. ABT's biography dates the promotion to May 26. Reject `Brig. Gen. A. P. Hill` and `Lt. Gen. A. P. Hill`.
- **John Bell Hood:** `Brig. Gen. John B. Hood`, Texas Brigade. Reject major-general and lieutenant-general labels at Gaines' Mill.
- **Robert E. Lee:** General, commanding the Army of Northern Virginia. Lee can appear as overall Confederate leader.
- **Thomas J. Jackson:** Major General and wing commander. Reject a June 1862 lieutenant-general or corps label.
- **James Longstreet, D. H. Hill, and Richard S. Ewell:** major generals in the battle OOB. Runtime text should avoid later formal corps labels.
- **William H. C. Whiting:** `Brig. Gen. William H. C. Whiting` — a BRIGADIER general commanding his division at Gaines' Mill *(C73/D428 correction: this spec previously mis-graded him major general, and the shipped data inherited it)*. The postwar U.S. War Department Serial Set roster of Confederate general officers (govinfo SERIALSET-05241) records his major-general appointment on April 22, 1863, to rank from February 28, 1863; the Dictionary of North Carolina Biography (Clyde Wilson, 1996, via NCpedia) has him promoted brigadier general on the field of First Manassas on July 21, 1861, commanding his division "with conspicuous ability" through the Seven Days as such, with the major-generalcy following his November 1862 Wilmington assignment. Reject `Maj. Gen. William H. C. Whiting` in this battle; Malvern Hill's `Brig. Gen. W. H. C. Whiting` four days later was already correct.
- **George B. McClellan:** Major General and army commander, but south of the Chickahominy. He belongs in teaching context and must not appear as an on-map Gaines' Mill leader.
- **V Corps label:** Porter's formation was the Fifth Provisional Army Corps in late June. `V Corps` is acceptable game shorthand only when a note names the provisional status.

## Terrain And Objective

D362 must treat the field as a defensive system, without copying Malvern Hill's open gun-line geometry.

- **Boatswain's Creek / Boatswain's Swamp:** ABT uses both names across its battle page and map; the separately registered NPS CWSAC battle detail names Boatswain's Swamp. The runtime may use overlapping `swamps[]` to model the wet ravine and a `creek` marker for the watercourse. The creek is an obstacle and cover input, not a damage source.
- **Watt House plateau:** the main objective. The NPS battlefield page calls the Watt House the centerpiece of the preserved field.
- **Adams farm:** a verified battle-area landmark from ABT. Use as a marker or teaching reference.
- **Chickahominy River:** Porter's rear boundary and withdrawal route. Use a marker and home-edge framing. Do not create an impassable river unless the engineering river schema can supply verified bridges and a safe retreat path.
- **Old Cold Harbor / New Cold Harbor roads:** CMH confirms the ridge's relation to both crossroads. Road markers can carry the Confederate approach and Union retreat context.
- **Gaines' Mill / William Gaines:** verified name origin and map context. Teaching only unless the mill fits without crowding the tactical field.
- **Turkey Hill:** excluded. The packet flagged the name as unverified and the recheck did not clear it.

The US defender sits at low z with the Chickahominy behind it; the CS attacker enters from high z. D362 must declare `homeEdge:{"US":"low","CS":"high"}` so routers flee toward their own rear. The focused probe must verify the override and a sandbox relaunch must prove it does not leak.

## Victory And Balance Intent

The universal combat model owns the outcome.

- Confederate aggregate direction: at least 5 of 8 deterministic seeds end with CS holding the objective.
- Cost direction: at least 5 of 8 seeds produce Confederate killed/wounded greater than or equal to Union killed/wounded. Derive killed/wounded as total fielded loss minus `captured` minus `missing`.
- The two majorities need not occur on the same seeds. The guard protects the historical pattern, not an exact result table.
- The Union line needs meaningful cover at the Watt House ridge and wet ground at Boatswain's Creek. The open Confederate approach cannot receive a wall or fort.
- A human Union player can hold with better reserve use. A human Confederate player can coordinate the assault. Passive launches for both sides must terminate without NaN state.

## Teaching And Anti-Lost-Cause Frame

D362 needs at least five teaching cards and one codex entry.

- **A costly victory:** Lee won the field while Confederate killed and wounded exceeded Union killed and wounded. The Confederacy could not replace blood at the Union's rate.
- **Concentration after failure:** A. P. Hill and Longstreet spent the afternoon against the line. The evening mass finally broke it. The lesson is timing, staff work, and accumulated pressure.
- **Porter bought time:** Porter's corps held while McClellan shifted the army's base toward the James. The battle was a tactical Confederate victory inside a larger Union withdrawal.
- **Hood without mythology:** Hood's brigade made the first break. The card should name the achievement and the casualties without turning personal aggression into a supernatural trait.
- **Farms became a battlefield:** Watt and Adams family land anchors the civilian landscape. The game should name the place without treating a preserved house as scenery detached from the people who lived there.
- **The Seven Days link:** Malvern Hill follows four days later. Gaines' Mill shows mass overcoming a defended creek line; Malvern Hill shows disjointed assaults failing under a better gun position. One engine produces both results.

The codex axes should include `theater:"Eastern"`, `campaign:"Peninsula / Seven Days"`, `result:"Confederate victory"`, and a casualty-direction note. The summary must reject a costless-masterpiece reading.

## D74 No-Fudge Acceptance Gates

D362 must add no Gaines' Mill-specific damage, firepower, morale, casualty, rout, capture, winner, or score control. The data scan must reject keys matching this family:

`damage`, `dmg`, `damageMult`, `firepower`, `firepowerMult`, `fireScale`, `fireMult`, `fireMultiplier`, `killScale`, `killMult`, `casualtyScale`, `casualtyMult`, `lossMult`, `combatScale`, `battleDamage`, `battleFire`, `powerMult`, `moraleMult`, `routMult`, `captureMult`, `scoreBonus`, `scoreMult`, `winner`, `winOverride`, `victoryOverride`, `outcomeOverride`, `forceWin`, `winnerFudge`, `fudge`.

Hood's break stays in history text. The engine cannot script it.

## D362 Implementation Files

- `data/gaines-mill.json` with top-level key `gainesMill`.
- No `src/00-manifest.json` edit. `tools/build.mjs` discovers sorted `data/*.json` files and injects this one as `GAME_DATA["gaines-mill"]`.
- `src/tactical/T1-bull-run.js` registry entry and chronology-aware menu order.
- `src/tactical/T10-flags.js` explicit Gaines' Mill battle metadata: `theater:"E"`, `badges:false`, `csFlag:"anv"`. Gaines' Mill is an Eastern battle before the Army of the Potomac adopted corps badges; the existing D131/D351 flag-family policy maps the Army of Northern Virginia to the Southern Cross pattern. Do not inherit the fallback silently.
- `tools/validate-data-schemas.mjs` battle-file enrollment.
- `tools/shots/data-schema-validation.html` regenerated with a substantive 44th row.
- `tools/probe-gaines-mill.mjs` focused browser and direction guard.
- `tools/probe-tactical-roster.mjs` `EXPECTED`, menu, DOM, and phase metadata update.
- `tools/probe-custom-battle-builder.mjs` historical baseline update.
- `tools/probe-loot-survival.mjs` Army Register pin from 912 to `912 + units x 3`, with a D362 history comment. Count unique battle/side/unit ids across opening OOB and reinforcements before setting the number.
- `tools/probe-flags.mjs` registered-scenario metadata coverage from 13 to 14 and a Gaines' Mill semantic tooth.
- `data/media-budget.json` opening-scene count from 13 to 14. Keep Kennesaw as `largestShippedScene` only if Gaines' Mill opens with 17 units or fewer.
- `tools/probe-intel-uhd617-profile.mjs` opening-scene coverage count from 13 to 14. If Gaines' Mill exceeds 17 opening units, repoint the largest-scene profile and keep every existing cap.
- `tools/vet-no-regression.mjs` enrollment for the focused Gaines' Mill probe, increasing the suite from 118 to 119 commands. Its sweep timeout comment must change from 13 to 14 battles; `tools/sweep-all-battles.mjs` reads the registry and needs no scenario-list edit.
- `weather` data with one legal time and sky value, a note, sources, and exact `Verified` or `Inferred` provenance. `tools/probe-weather.mjs` discovers the file without an id baseline.
- Generated `civil_war_generals.html` rebuilt through `node tools/build.mjs` only.

## Required D361 Planning Gate

- `node --check tools/probe-gaines-mill-plan.mjs`
- `node tools/build.mjs`
- `node tools/validate-data-schemas.mjs`
- `node tools/probe-battle-build-research.mjs`
- `node tools/probe-gaines-mill-plan.mjs`
- `node tools/probe-tactical-roster.mjs`
- `node tools/probe-custom-battle-builder.mjs`
- `node tools/probe-bullrun.mjs`
- `node tools/probe-malvern-hill.mjs`
- `git diff --check`

## Required D362 Runtime Gate

- `node --check tools/probe-gaines-mill-plan.mjs`
- `node --check tools/probe-gaines-mill.mjs`
- `node --check src/tactical/T1-bull-run.js`
- `node --check src/tactical/T10-flags.js`
- `node tools/build.mjs`
- `node tools/validate-data-schemas.mjs`
- `node tools/probe-gaines-mill-plan.mjs`
- `node tools/probe-gaines-mill.mjs`
- `node tools/probe-tactical-roster.mjs`
- `node tools/probe-custom-battle-builder.mjs`
- `node tools/probe-loot-survival.mjs`
- `node tools/probe-flags.mjs`
- `node tools/probe-weather.mjs`
- `node tools/probe-intel-uhd617-profile.mjs`
- `node tools/probe-media-budget.mjs`
- `node tools/vet-no-regression.mjs --list`
- `node tools/probe-malvern-hill.mjs`
- `node tools/probe-nashville.mjs`
- `git diff --check`

Browser probes run in full access with one shared server and `TMPDIR="$PWD/.tmp"`. Read every required artifact under `tools/shots/`; require `ok:true`, zero failed steps, and zero pageerrors. Run the eight-seed direction battery in one foreground process.

Full `npm run vet:noreg` remains deferred for each D361/D362 slice under D160/D176. It is owed after the final battle shipped in this LANE-003 session, before the lane's release handoff.

## Future Runtime Probe Teeth

When `data/gaines-mill.json` exists, `tools/probe-gaines-mill.mjs` must verify:

- single-phase data and runtime state, CS attacker / US defender, fog off, standard doctrine, and no T8 phase machinery;
- chronology order after Bull Run and before Malvern Hill, with one accessible menu button and two side-choice cards;
- Watt House, Boatswain's Creek/Swamp, Adams farm, Chickahominy, and Old/New Cold Harbor context;
- US modeled strength 27,000 at the agreed abstraction and Confederate modeled strength 31,500-32,500, with Inferred labels on unsourced splits;
- more Union guns than Confederate guns, all artillery using positive gun counts and sane crews;
- Porter/Hill/Hood battle-date ranks; Jackson, Longstreet, D. H. Hill, and Ewell as major generals and Whiting as a brigadier general (C73/D428) without later corps labels; McClellan absent from the on-map leader list;
- role-aware home edges plus a negative leak test against the sandbox;
- no forbidden D74 key at any depth;
- deterministic same-seed replay and passive US/CS completion without hangs or NaN;
- the eight-seed split direction guard using killed/wounded after subtracting captured and missing;
- exact `Verified identity; Inferred strength` labels on every unpinned unit split; at least five teaching cards and one Eastern/Peninsula codex entry, each claim carrying at least two source URLs; no Turkey Hill claim;
- the Army Register pin increase equals unique new Gaines' Mill unit ids times three;
- negative bind proof: remove or bypass the new scenario guard, observe the Gaines' Mill tooth fail, then restore the exact bytes before commit.

## D361 Completion Criteria

D361 is green when this spec and `tools/probe-gaines-mill-plan.mjs` pass; the plan probe confirms no half-registration; the build and current 13-battle roster stay green; the required JSON files have been read; LANE-003 is locked to ChatGPT/Codex in `DRIVE`; and the commit is pushed. Runtime work starts only from that clean D361 boundary.
