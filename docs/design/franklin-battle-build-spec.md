# Franklin Battle-Build Spec (D332)

**Status:** D332 planning/spec + probe scaffold. No runtime data, registry/menu entry, generated HTML behavior, or combat code is added in this slice.

**Task shape:** build the first Franklin/Nashville lane item from the D327 research packet, with Franklin as the first playable slice. Nashville remains queued as the follow-on two-phase battle; Spring Hill stays teaching-only.

## Scope

**Battle:** Franklin, Tennessee, November 30, 1864.

**Playable shape:** a single-phase defender-hold scenario.

- **Roles:** top-level `attacker:"CS"` / `defender:"US"`.
- **No `phases[]`:** Franklin should start as one coherent assault, not a T8 sequence.
- **Fog:** `defaultFog:false`. The assault began in daylight across open ground into visible works; the defender's edge is breastworks, abatis, artillery, and cohesion, not fog.
- **Objective:** hold or seize the Columbia Pike main line around the Carter House / Carter cotton gin salient.
- **Historical direction:** the Confederate attacker should usually fail to break the Union main line and should lose more men. That direction must emerge from the universal combat model, not from a forced casualty or winner key.

## Source Register

These are the minimum D333 runtime anchors. Add more before data authoring if any sector, brigade, strength, rank, or terrain claim remains unsettled.

| Source | Use | Current confidence |
|---|---|---|
| American Battlefield Trust, Franklin (`https://www.battlefields.org/learn/civil-war/battles/franklin`) | Date, commanders, strengths/casualties, Carter House breach, Opdycke counterattack, Brown/Cleburne attack, broad OOB and casualty direction | Verified for battle facts, terrain landmarks, Opdycke, and casualty direction |
| Battle of Franklin Trust, history page (`https://boft.org/history`) | Hood's pursuit after Spring Hill, Schofield's 27,000, Hood's 30,000-plus army, Union line length and Carter House/Cox HQ, roughly 20,000 Confederates advancing at 4 p.m. | Verified for local battlefield interpretation and assaulting-strength scale |
| National Park Service, Battle of Franklin Special Resource Study (`https://npshistory.com/publications/srs/bafr-srs.pdf`) | Carter House NHL context, Cox command post, cotton gin assault site, Hood recklessness interpretive theme, frontal-assault tactical lesson, Franklin/Nashville Western-theater destruction frame | Verified for official preservation/interpretive framing |
| War of the Rebellion / Official Records, Series I, Vol. XLV, Pt. 1 (Cornell / OR page references via the Franklin packet) | Schofield/Cox/Hood report cross-checks, casualty-report caveats, primary report language for future runtime notes | Primary-source anchor to re-open before D333 data authoring |
| Civil War Trust / Wikipedia-hosted Franklin OOB pages, sourced to OR and former Civil War Trust OOB | Unit identities for detailed D333 OOB only where corroborated; useful for Cheatham/Stewart/Lee corps structure and dead/wounded general list | Cite-pending for runtime; do not use alone for exact game strengths |

## OOB And Rank Traps

Do not encode a unit, commander, rank, strength, or sector until it is verified against at least two reputable anchors or explicitly marked Inferred. Franklin's game OOB should use a compact assaulting slice, not Hood's whole army present.

### Union Defenders

- **John M. Schofield - Major General, USA.** Commanding the Army of the Ohio / field army. Do not make him lieutenant general.
- **Jacob D. Cox - Brigadier General, USA.** Field commander at the Carter House line and temporary XXIII Corps commander in the Franklin defense. The Carter House served as his headquarters.
- **David S. Stanley - Major General, USA.** Commanding IV Corps at Franklin and wounded in the battle. Do not carry him forward as IV Corps commander at Nashville; Thomas J. Wood takes that role there.
- **George D. Wagner - Brigadier General, USA.** His forward brigades under Conrad and Lane are the exposed first line that breaks back through the main works. Treat their forward placement as a setup/teaching trap, not a reason to weaken the main line artificially.
- **Emerson Opdycke - Colonel, USA.** His brigade refuses the exposed forward line, waits roughly behind the Carter House, and counterattacks to seal the breach. Do not promote him at Franklin; his later brigadier-general rank is not battle-date rank.
- **Nathan Kimball / Thomas J. Wood / Thomas H. Ruger / James W. Reilly - division/sector names to re-check before runtime.** Use only if the D333 OOB needs sector-level units.

### Confederate Attackers

- **John Bell Hood - General (temporary grade), C.S.A.; permanent grade lieutenant general.** Hood commands the Army of Tennessee at Franklin. His July 18, 1864 temporary full-general appointment was not confirmed and later reverted; runtime text should say `General (temporary grade)` or explicitly note the dispute.
- **Benjamin F. Cheatham - Major General, C.S.A.** Cheatham's corps furnishes the central attack including Brown/Cleburne/Bate divisions. Do not make him lieutenant general.
- **Patrick R. Cleburne - Major General, C.S.A.** Killed at Franklin. Do not inflate him above major general.
- **John C. Brown - Major General, C.S.A.** Brown's division helps break into the center around the Carter House before the counterattack.
- **Alexander P. Stewart and Stephen D. Lee - Lieutenant Generals, C.S.A.** Corps commanders; include if runtime needs a broader army-level frame.
- **The six general-officer death nuance:** Patrick Cleburne was a major general; John Adams, Hiram B. Granbury, States Rights Gist, Otho F. Strahl, and John C. Carter were brigadier generals. Carter was mortally wounded on November 30 and died December 10. Avoid a flat "six killed instantly" claim.

### Strength Rule

- **Forbidden:** using Hood's full total present as the assaulting OOB. ABT/Battle of Franklin Trust broad totals are useful context, but the actual assaulting infantry force is closer to **roughly 20,000 Confederates**. The D327 packet flags **18,000-20,000** as the correct game-scale attacker range.
- **Runtime target:** a compact assaulting OOB around 20,000 CS versus a defended Union main line around the high teens / low 20,000s, with the remainder of Schofield's force and Fort Granger/river crossings represented in teaching and artillery context.
- **Inferred unit strengths:** exact brigade headcounts are not fully pinned by the current source set. Any brigade-scale game number that is not directly sourced must be labeled **Verified identity; Inferred strength**.

## Landmarks

Minimum landmark set for D333 data:

- **Main line / Carter sector:** Columbia Pike, Carter House, Carter cotton gin, Carter garden, the retrenchment behind the pike gap, Cox's headquarters, Fort Granger support, the Harpeth River crossing/withdrawal context.
- **Defensive works:** breastworks, ditch, rail-and-earth parapet, head logs, Osage-orange abatis, hastily strengthened main line.
- **Approach:** Winstead Hill as Hood's observation/launch point, two miles of open ground, late-afternoon daylight, Wagner's exposed forward line, Conrad/Lane falling back through the works.
- **Teaching-only:** Carnton / McGavock Confederate Cemetery as field-hospital and memory/cemetery context, not a playable objective; Spring Hill as the night command failure that made Franklin possible.

## Victory And Balance Intent

Use the universal combat model only. Outcomes must emerge from OOB, terrain, timing, doctrine, gun counts, cover, abatis, and objective-hold mechanics.

- Aggregate/default pattern: Union defensive victory in the majority; the Confederate attacker fails to seize and hold the Carter House / Columbia Pike works.
- Casualty direction: Confederate losses exceed Union losses by a wide margin. ABT's common totals are about 6,252 CS and 2,326 US; Battle of Franklin Trust / NPS sources also frame the day as a disproportionate Confederate disaster. This is a **direction guard**, never a count-forcing gate.
- Player agency: a skilled Confederate player can do better by timing the assault and exploiting the pike gap, but the default AI-vs-AI run should teach why Hood's frontal attack was disastrous.
- The Union win is not scripted. It must come from prepared works, abatis, visible fields of fire, reserve counterattack, and the attacker's dense advance.
- Spring Hill belongs in teaching/end-note text. Do not build a Spring Hill combat phase to simulate a non-battle with fake combat parameters.

## Teaching And Anti-Lost-Cause Framing

- **Hood's charge, not noble tragedy:** Franklin was a command decision to send infantry against prepared works after the Spring Hill failure. The tone should reject romance and martyrdom.
- **A breach does not equal victory:** Brown's and Cleburne's divisions helped punch into the center near the Carter House, but Opdycke and nearby Union reserves sealed the breach. This is a tactical lesson about reserves, line gaps, and defensive depth.
- **The six generals:** the deaths and mortal wound are a leadership catastrophe caused by the assault, not a heroic-sacrifice scoreboard.
- **The army that could not recover:** Franklin and Nashville together wreck the Army of Tennessee as an effective fighting force in the Western Theater. Nashville gets its own battle later; Franklin should point forward without trying to compress both battles into one scenario.
- **Human cost with gravity:** Carter House and Carnton are places where civilians, soldiers, wounded men, and memory intersect. Keep the tone restrained.

## D74 No-Fudge Acceptance Gates

D333 implementation must not introduce any battle-specific damage, firepower, morale, casualty, or winner-writing keys. Forbidden examples include `damage`, `dmg`, `fireMult`, `fireMultiplier`, `casualtyMult`, `lossMult`, `killMult`, `fudge`, `powerMult`, `scoreBonus`, `forceWin`, or any Franklin-only combat switch.

Required D333 gates:

- `node tools/build.mjs`
- `node tools/validate-data-schemas.mjs`
- `node --check tools/probe-franklin-plan.mjs`
- `node --check tools/probe-franklin.mjs`
- `node tools/probe-franklin-plan.mjs`
- `node tools/probe-franklin.mjs`
- `node tools/probe-tactical-roster.mjs`
- `node tools/probe-custom-battle-builder.mjs`
- `node tools/probe-kennesaw.mjs`
- `git diff --check`

Browser/readback gates must inspect JSON artifacts under `tools/shots/` and require `ok=true`, zero failed steps, and zero pageerrors. Do not weaken existing probes.

## Future Probe Teeth

When `data/franklin.json` is added:

- `tools/probe-franklin.mjs` must verify a single-phase scenario with no `phases[]`, CS attacker / US defender, `defaultFog:false`, Carter House / Columbia Pike objective, Carter cotton gin, breastworks, Osage-orange abatis, Winstead Hill, Fort Granger, Harpeth River, and Spring Hill teaching.
- Runtime probe must verify rank traps: Hood encoded as `General (temporary grade)` or with the temporary/permanent-grade note; Schofield = Maj. Gen.; Cox = Brig. Gen.; Stanley = Maj. Gen.; Wagner = Brig. Gen.; Opdycke = Col.; Cheatham/Cleburne/Brown = Maj. Gens.; Stewart/Lee = Lt. Gens. only if included; the dead-generals nuance is present.
- Runtime probe must verify OOB-strength honesty: no `33,000` as the active Confederate assaulting force; assaulting CS total is near 18,000-20,000; any unsourced exact brigade strength is marked Inferred.
- Runtime probe must verify the D74 no-fudge key family by scanning `data/franklin.json` directly.
- Balance/direction teeth: across a small deterministic seed set, the Union defender holds in the majority and Confederate casualties exceed Union casualties in the majority. Guard direction, not exact counts.
- Both-baselines gotcha: `tools/probe-tactical-roster.mjs` `EXPECTED`, menu order, and DOM button list must include `franklin`; `tools/probe-custom-battle-builder.mjs` historical-registry baseline must include `franklin`.
- Adjacent guard: `tools/probe-kennesaw.mjs` must stay green to protect the immediately preceding Western/Atlanta scenario.

## Nashville Queue Note

Nashville should be a later two-phase T8 battle, not folded into Franklin:

- Phase 1: December 15 redoubts / Montgomery Hill, US attacker, scoreWeight 1.
- Phase 2: December 16 Shy's Hill / Peach Orchard Hill, US attacker, scoreWeight 3.
- USCT presence and Steedman's role require fresh source verification before regiment-level encoding. Generic USCT presence is safe from ABT Nashville; 12th/13th/100th USCT details remain cite-pending until the Battle of Nashville Trust / stronger anchors are opened in the Nashville spec.

## D332 Completion Criteria

D332 is green when this durable packet exists, the filesystem-only Franklin plan probe passes, build remains green, Franklin is not half-registered, JSON readback is inspected, and live docs record that D333 is the runtime implementation slice only after this spec is committed and pushed.
