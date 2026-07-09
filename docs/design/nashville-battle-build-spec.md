# Nashville Battle-Build Spec (D334)

**Status:** D334 planning/spec + probe scaffold. No runtime data, registry/menu entry, generated HTML behavior, or combat code is added in this slice.

**Task shape:** build the second Franklin/Nashville lane item from the D327 research packet after D333 made Franklin playable. Franklin remains a separate single-phase battle. Nashville is its own two-day T8 battle. Spring Hill remains teaching-only.

## Scope

**Battle:** Nashville, Tennessee, December 15-16, 1864.

**Playable shape:** a two-phase T8 scenario, US attacker both phases.

- **Roles:** top-level `attacker:"US"` / `defender:"CS"`.
- **Phases:** `phases[]` length 2.
  - Phase 1: `December 15 - Redoubts and Montgomery Hill`, scoreWeight 1.
  - Phase 2: `December 16 - Shy's Hill and Peach Orchard Hill`, scoreWeight 3, decisive.
- Score weights: 1 + 3 = 4. Do not resurrect the D327 arithmetic error that expected 5.
- **Fog:** `defaultFog:false`. There was morning fog and bad weather, but Nashville's playable problem is Thomas's prepared, deliberate attack against Hood's line, not a surprise/fog teaching hinge. Weather can be teaching text and light terrain context, not a defender-aiding fog default.
- **Objective:** aggregate Union victory by rolling Hood's line: day-one redoubts/Montgomery Hill pressure on the Confederate left, then day-two Shy's Hill collapse while Peach Orchard Hill / Overton Hill is pinned.
- **Historical direction:** Union attacker should usually win the weighted battle and Confederate losses should exceed Union losses. This is a direction guard only. The result must emerge from OOB, terrain, works, artillery, phase weights, Wilson's rear pressure, USCT/Steedman pinning pressure, and the universal combat model.

## Source Register

These are the minimum D335 runtime anchors. Add more before data authoring if a rank, strength, brigade, corps, hill, redoubt, battery, or USCT regiment claim remains unsettled.

| Source | Use | Current confidence |
|---|---|---|
| American Battlefield Trust, Nashville (`https://www.battlefields.org/learn/civil-war/battles/nashville`) | Date, commanders, broad strength/casualty totals, two-day sequence, redoubts #1-#5, Thomas/Hood, USCT presence, Compton's/Shy's Hill, Peach Orchard/Overton Hill, McArthur and Shy, collapse of the Army of Tennessee | Verified for battle facts, broad OOB frame, phase shape, terrain landmarks, casualty direction, and anti-Lost-Cause frame |
| American Battlefield Trust, "Battle of Nashville: Enemies Front and Rear" (`https://www.battlefields.org/learn/articles/battle-nashville-enemies-front-and-rear`) | Thomas's plan; A. J. Smith, Wilson, Wood, Schofield, and Steedman assignments; day-one redoubts; day-two Lee/Stewart/Cheatham line; McArthur's Shy's Hill assault; Wilson rear pressure | Verified for operational sequence and named corps/wing roles |
| Battle of Nashville Trust, Peach Orchard Hill (`https://www.battleofnashvilletrust.org/peach-orchard-hill/`) | Peach Orchard / Overton Hill terrain, Lee's right flank, Wood and Steedman assault, 12th/13th/100th USCT in Thompson's 2nd Colored Brigade, 18th USCT in Grosvenor's brigade, abatis/open-field uphill attack, 13th USCT casualty direction, Black agency framing | Verified for local terrain, Steedman/USCT details, and USCT dignity framing; exact casualty counts still direction-only |
| Battle of Nashville Trust, Shy's Hill (`https://www.battleofnashvilletrust.org/shys-hill/`) | Compton's/Shy's Hill terrain, Cheatham's corps on the left, Bate's division, mis-sited trenches, thin line/no reserves, Wilson pressure, McArthur's late assault, Col. William L. Shy's death, Confederate collapse | Verified for local Shy's Hill terrain/sequence; use BONT local detail plus ABT for broad OOB |
| Nashville Metropolitan Historical Commission, Military Sites markers (`https://www.nashville.gov/departments/historic-preservation/programs/historical-markers/military-sites`) | Official local marker confirmation for USCT at Peach Orchard Hill, December 15 USCT right-flank attack, Shy's Hill decisive break, S. D. Lee at Peach Orchard Hill, Federal line/McArthur launch, Confederate final stand | Verified official local source; use for terrain/marker corroboration and USCT/Steedman guardrails |
| D327 Franklin/Nashville packet (`docs/design/battle-build-research/franklin-nashville-battle-build-research.md`) | Starting packet, source register, D74 risks, initial T8 shape, remaining traps | Starting point only, not authority; superseded by this Nashville-specific recheck where it conflicts |

## Reverification Readback

The D327 packet's Nashville shape survived recheck. The Dec. 15 redoubts/Montgomery Hill action and the Dec. 16 Shy's Hill/Peach Orchard action fit the existing T8 phase engine better than a single-phase battle because the days have different tactical problems and different teaching load.

- ABT battle summary confirms Dec. 15-16, Thomas vs Hood, Union victory, redoubts #1-#5 on the Confederate left, the Dec. 16 Peach Orchard pin, McArthur's Compton's/Shy's Hill break, Col. William Shy's death, and the destruction of Hood's offensive power.
- ABT operational article confirms Thomas's Dec. 15 plan: Smith and Wilson against Hood's left; Wood pressing south; Schofield shifting/reserve; Steedman making the diversion. It also confirms Dec. 16's Lee right / Stewart center / Cheatham left layout, Wood/Steedman at Overton Hill, Wilson behind the left, and McArthur's Shy's Hill charge.
- BONT Peach Orchard Hill and Nashville Metro both corroborate specific USCT participation at Peach Orchard/Overton Hill: 12th, 13th, and 100th USCT in Thompson's 2nd Colored Brigade under Steedman's command; BONT also places the 18th USCT in Grosvenor's brigade. These can be named in teaching and, if used in runtime OOB, must carry `Verified identity; Inferred strength` unless a runtime source pins headcounts.
- BONT Shy's Hill and Nashville Metro corroborate Shy's Hill as the decisive western/left-flank break, with Col. William L. Shy of the 20th Tennessee killed there. Encode Shy as a colonel/lieutenant colonel only if the runtime text explains the source wording; do not promote him.
- The broad ABT force figures are useful battle-scale context, but D335 should not place 85,000 Union and 55,000 Confederate men as active map strengths. These broad force figures should guide asymmetry without becoming literal active map OOB. Runtime should use a compact playable slice and label exact game-unit strengths as inferred unless source-pinned.

## OOB And Rank Traps

Do not encode a unit, commander, rank, strength, or sector until it is verified against at least two reputable anchors or explicitly marked Inferred. Nashville's data should use a compact day-one/day-two combat slice, not every man in the broad force-engaged total.

### Union Attackers

- **George H. Thomas - Major General, USV.** Overall commander at Nashville. His Regular-Army full-major-generalcy was awarded for Nashville; do not backdate later honors or Thanks of Congress into the battle-date OOB.
- **Andrew J. Smith - Major General, USA/USV.** Commands the Detachment of the Army of the Tennessee / former XVI Corps wing. His veterans hit Hood's left on Dec. 15 and McArthur's division provides the decisive Shy's Hill assault on Dec. 16.
- **John McArthur - Brigadier General, USA.** Division commander under A. J. Smith. He leads/orders the Shy's Hill attack. Do not inflate him above brigadier general.
- **Thomas J. Wood - Brigadier General / brevet-style source conflict guard.** Many battle narratives call him "General Wood" or "Brig. Gen. Thomas J. Wood"; by Nashville he commands IV Corps. Runtime should avoid unsupported "Maj. Gen." unless a battle-date rank source is pinned. Use `Brig. Gen. Thomas J. Wood, IV Corps` unless stronger evidence is added before D335.
- **John M. Schofield - Major General, USA.** Commands XXIII Corps / Army of the Ohio at Nashville under Thomas. He is not the overall commander at Nashville and not a lieutenant general.
- **James H. Wilson - Major General, USV.** Commands the Cavalry Corps. His cavalry pressure on the Confederate left/rear matters to Shy's Hill and Granny White Pike; model as flank/rear pressure, not a separate cavalry-raid battle.
- **James B. Steedman - Major General, USV.** Commands the Provisional Detachment / district troops and USCT brigades. His role is central to the USCT teaching and the Peach Orchard/Overton pin.
- **Charles R. Thompson - Colonel, USA.** Commands the 2nd Colored Brigade at Peach Orchard Hill. Include only if regiment-level USCT runtime detail is used.
- **Thomas J. Morgan / Charles H. Grosvenor - colonels.** Names tied to Dec. 15 and/or supporting USCT brigade details. Verify exact brigade assignment before runtime if encoded.
- **12th, 13th, 100th USCT - verified Peach Orchard/Overton Hill participants.** Use source-honest placement: they are in the Peach Orchard / Overton assault and should not be shifted to Shy's Hill for convenience. The 13th USCT casualty direction can be taught, but never force a casualty count with a per-regiment loss switch.
- **18th USCT - verified by BONT as in Grosvenor's brigade at Peach Orchard context.** If used, keep it as supporting/adjacent USCT presence, not the core Thompson 2nd Colored Brigade trio.

### Confederate Defenders

- **John Bell Hood - General (temporary grade), C.S.A.; permanent grade lieutenant general.** Hood commands the Army of Tennessee at Nashville. Sources vary between "Lt. Gen." and "Gen." because his temporary full-general appointment was never confirmed and later reverted. Runtime text should use `General (temporary grade)` or explicitly note the permanent-grade nuance.
- **Stephen D. Lee - Lieutenant General, C.S.A.** Commands the Confederate right on Dec. 16 / Peach Orchard-Overton sector. Nashville Metro and BONT both tie Lee's corps to the Peach Orchard/Overton line. Do not place him at Shy's Hill.
- **Alexander P. Stewart - Lieutenant General, C.S.A.** Commands the center after the Dec. 15 withdrawal. His corps is badly worn from Franklin and day-one action; exact runtime unit strengths should be inferred unless pinned.
- **Benjamin F. Cheatham - Major General, C.S.A.** Commands the left / Shy's Hill sector on Dec. 16. Do not make him lieutenant general. Cheatham's corps was badly hurt at Franklin and stretched thin at Shy's Hill.
- **William B. Bate - Major General, C.S.A.** Division on/around Shy's Hill under Cheatham. Include if runtime needs the Shy's Hill defender slice.
- **William L. Shy - Colonel / Lieutenant Colonel wording trap.** BONT and local markers name him as Col. William Shy / W. M. Shy of the 20th Tennessee; other military records may style him lieutenant colonel. Runtime may say `Col. William L. Shy` only with source note, and must not make him a general.
- **S. D. Lee / Cheatham sector separation:** Lee = Peach Orchard/Overton/right; Cheatham = Shy's Hill/left; Stewart = center. A runtime file that swaps these sectors should fail the focused probe.
- **Nathan Bedford Forrest - absent from the main Nashville field.** Hood detached Forrest toward Murfreesboro before the battle. Do not place Forrest on the playable Nashville map; at most mention his absence in teaching about Hood weakening himself.

### Strength Rule

- **Forbidden:** using ABT's broad **85,000 / 55,000** force-engaged presentation as literal active map OOB strength. The field engine cannot represent that scale faithfully, and the point is not to flood the map.
- **Runtime target:** a compact two-phase OOB that preserves the source-honest asymmetry. Use the broad ratio as context, then model a playable slice with the Union stronger overall, especially in phase 2 where Wilson/McArthur/Smith pressure converges.
- **Inferred unit strengths:** exact brigade/regiment strengths for many Nashville units are not fully pinned by the current source set. Any game-unit number not directly sourced must be labeled **Verified identity; Inferred strength**.
- **USCT dignity guard:** if the 12th/13th/100th USCT appear as runtime units, their role is the Peach Orchard/Overton pin and human-cost teaching. Do not make the player "win Nashville" by sacrificing USCT in a punitive scripted repulse; the weighted battle should reward the combined operational effect of pinning Lee's right while Shy's Hill collapses.

## Landmarks

Minimum landmark set for D335 data:

### Phase 1 - December 15

- Confederate Redoubts #1-#5 on Hood's left.
- Montgomery Hill north of Redoubt No. 1.
- Hillsboro Pike / Granny White Pike / Franklin Pike context.
- Nashville & Chattanooga Railroad demonstration axis on Hood's right.
- Redoubt No. 4 / Redoubt No. 5 as outer-left anchors, if the data uses individual redoubt markers.
- Redoubt No. 1 as the Montgomery Hill/Loring-line hinge if the data compresses the redoubts.
- Hood's army falling back roughly two miles to the shorter Dec. 16 line.

### Phase 2 - December 16

- **Shy's Hill / Compton's Hill:** Confederate left anchor, mis-sited trenches/geographical crest problem, thin line, Col. Shy death, McArthur's three-brigade charge, Granny White Pike and Franklin Pike retreat routes.
- **Peach Orchard Hill / Overton Hill:** Confederate right anchor held by S. D. Lee's corps; open muddy uphill approach, abatis, Confederate breastworks, Wood/Steedman assault, USCT regiments.
- **Center / Stewart's line:** dry-stack stone walls and central line linking the two hills; use as terrain context if phase 2 needs a center objective/secondary marker.
- **Wilson pressure:** cavalry pressure behind/around the Confederate left and Granny White Pike; model as flank pressure/terrain/teaching, not a separate cavalry scenario.
- **Travellers Rest:** Hood headquarters / Overton plantation context, teaching only unless used as a rear marker.
- **Cumberland River / Fort Negley / Nashville works:** strategic frame only; Nashville is Thomas attacking out of the defenses, not Hood storming Fort Negley.

## Victory And Balance Intent

Use the universal combat model only. Outcomes must emerge from OOB, terrain, timing, doctrine, gun counts, cover, hills/works, phase scoreWeight, and objective mechanics.

- Aggregate/default pattern: Union victory in the majority.
- Phase 1 direction: Union seizes or outflanks the redoubts/Montgomery Hill line in the majority, but phase 1 carries lower weight because the army was not destroyed on Dec. 15.
- Phase 2 direction: Union seizes Shy's Hill in the majority and wins the weighted battle; Peach Orchard/Overton can be a bloody repulse/pin that still contributes to the operational collapse by fixing Lee and drawing Confederate attention.
- Casualty direction: Confederate losses exceed Union losses in the aggregate. ABT's broad totals are about 6,000 Confederate and 3,061 Union casualties; this is a **direction guard**, never a count-forcing gate.
- Player agency: a skilled Confederate player can do better by holding the redoubts longer, keeping Shy's Hill supported, and managing retreat lines, but the default AI-vs-AI pattern should teach why Hood's post-Franklin army could not hold Nashville.
- Forrest absence is an input/teaching fact, not a combat penalty switch.
- Spring Hill is not a combat phase. It belongs in teaching context as the missed opportunity before Franklin and Nashville.

## Teaching And Anti-Lost-Cause Framing

- **The end of Hood's offensive power:** Nashville was not a noble last stand. It was the destruction of a Confederate army after a reckless Tennessee campaign and the Franklin disaster.
- **Thomas was deliberate, not timid:** teach the weather/cavalry/readiness controversy without making Grant's impatience the battle's explanation. Thomas attacked when his force and plan were ready, and the attack worked.
- **USCT at Peach Orchard Hill:** center Black combat agency. The 12th, 13th, and 100th USCT, with the 18th USCT in supporting context if used, fought in a bloody uphill assault that pinned the Confederate right and helped enable the collapse elsewhere. Their repulse is taught as sacrifice and contribution, not failure.
- **Shy's Hill was a systems failure:** the hill looked strong, but shallow/mis-sited works, tired troops, artillery pressure, Wilson's rear threat, and troop transfers left it vulnerable. The collapse should not be framed as mystical Confederate weakness or one heroic Union rush alone.
- **No Spring Hill combat:** Spring Hill was a command failure and operational missed opportunity, not a satisfying tactical battle. Keep it in teaching/end-note text.
- **Human cost with gravity:** Peach Orchard/Overton and Shy's Hill both carry heavy casualty and memory burdens. Avoid spectacle and avoid valorizing Confederate defeat.

## D74 No-Fudge Acceptance Gates

D335 implementation must not introduce any battle-specific damage, firepower, morale, casualty, or winner-writing keys. Forbidden examples include `damage`, `dmg`, `fireMult`, `fireMultiplier`, `casualtyMult`, `lossMult`, `killMult`, `fudge`, `powerMult`, `scoreBonus`, `forceWin`, `winnerFudge`, or any Nashville-only combat switch.

Required D335 gates:

- `node --check tools/probe-nashville-plan.mjs`
- `node --check tools/probe-nashville.mjs`
- `node tools/build.mjs`
- `node tools/validate-data-schemas.mjs`
- `node tools/probe-nashville-plan.mjs`
- `node tools/probe-nashville.mjs`
- `node tools/probe-tactical-roster.mjs`
- `node tools/probe-custom-battle-builder.mjs`
- `node tools/probe-franklin.mjs`
- `node tools/probe-kennesaw.mjs`
- `git diff --check`

Browser/readback gates must inspect JSON artifacts under `tools/shots/` and require `ok=true`, zero failed steps, and zero pageerrors. Do not weaken existing probes.

## Future Probe Teeth

When `data/nashville.json` is added:

- `tools/probe-nashville.mjs` must verify a two-phase T8 scenario with `phases.length === 2`, US attacker / CS defender, `defaultFog:false`, score weights 1 and 3, and total scoreWeight 4.
- Phase 1 must include redoubts #1-#5 and/or Redoubt No. 1 plus Montgomery Hill, with Dec. 15 labeling.
- Phase 2 must include Shy's Hill / Compton's Hill, Peach Orchard Hill / Overton Hill, Granny White Pike, Franklin Pike, and USCT/Steedman presence.
- Runtime probe must verify rank traps: Thomas = Maj. Gen.; A. J. Smith = Maj. Gen.; McArthur = Brig. Gen.; Schofield = Maj. Gen.; Wilson = Maj. Gen.; Steedman = Maj. Gen.; Wood not overpromoted without source note; Hood = General (temporary grade) or with permanent lieutenant-general nuance; S. D. Lee and Stewart = Lt. Gens.; Cheatham and Bate = Maj. Gens.; Shy not a general; Forrest absent from the map.
- Runtime probe must verify OOB-strength honesty: no literal active map use of 85,000 / 55,000 as unit totals; any unsourced exact brigade/regiment strength is marked Inferred.
- Runtime probe must verify source-honest USCT presence: generic USCT plus 12th/13th/100th only if the BONT/Nashville Metro corroboration remains in source notes; no invented regiment-level placement at Shy's Hill.
- Runtime probe must verify Spring Hill is teaching-only and no Franklin content is folded into Nashville runtime.
- Runtime probe must scan `data/nashville.json` directly for the D74 no-fudge key family.
- Balance/direction teeth: across a small deterministic seed set, the Union wins the weighted battle in the majority and Confederate casualties exceed Union casualties in the majority. Guard direction, not exact counts.
- Both-baselines gotcha: `tools/probe-tactical-roster.mjs` `EXPECTED`, menu order, and DOM button list must include `nashville`; `tools/probe-custom-battle-builder.mjs` historical-registry baseline must include `nashville`.
- Adjacent guards: `tools/probe-franklin.mjs` must stay green to protect the immediately preceding Franklin/Nashville lane battle, and `tools/probe-kennesaw.mjs` must stay green if menu order/registry flow is touched.

## D334 Completion Criteria

D334 is green when this durable packet exists, the filesystem-only Nashville plan probe passes, build remains green, Nashville is not half-registered, current registry probes remain green without Nashville registered, JSON readback is inspected, and live docs record that D335 is the runtime implementation slice only after this spec is committed and pushed.
