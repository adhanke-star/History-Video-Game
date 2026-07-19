# Cross Keys / Port Republic Battle-Build Spec (D377)

**Status:** D377 planning/spec plus a filesystem-first plan probe. This slice adds no runtime data, registry entry, menu button, schema row, Army Register row, generated-game behavior, combat change, or baseline-count movement.

**Task shape:** build the fifth LANE-003 contract from `docs/design/battle-build-research/shenandoah-1862-battle-build-research.md` (READY_FOR_SPEC, ratified). The playable unit is the June 8-9 Valley Campaign finale: Ewell holds at Cross Keys, then Jackson concentrates at Port Republic and takes The Coaling. The whole Valley Campaign remains strategic teaching because this engine cannot model interior lines, operational feints, or three separated Union columns honestly.

**Research basis and confidence rule:** this contract uses the committed Shenandoah-1862 packet only. No D377 claim upgrades the packet's confidence. The packet pins dates, army-present strengths, side-total casualties, senior commanders, outcomes, and terrain anchors for both battles. It does **not** pin Fremont's actually committed strength, a brigade-grain Cross Keys OOB, the battery at The Coaling, the regiments that stormed it, or gun counts. Those gaps stay explicit: modeled committed strengths and all lower-level splits are **Inferred**; the Coaling battery identity remains **Unpinned**; no exact regiment or battery claim may appear without a separately committed citation amendment.

## Scope

**Battle:** Cross Keys, Virginia, June 8, 1862, followed by Port Republic, Virginia, June 9, 1862.

**Playable shape:** one two-phase T8 scenario across two adjacent but distinct fields. The command roles and the field orientation both change at the phase boundary.

- **Top-level roles:** `attacker:"US"` / `defender:"CS"`, matching the opening Cross Keys phase.
- **Phases:** `phases[]` length 2.
  - Phase 1: `Cross Keys - Ewell Holds the Ridge`, scoreWeight 1, `attacker:"US"` / `defender:"CS"`, `defaultFog:false`, `assaultDoctrine:"cautious"`. Fremont attacks south of Mill Creek with only an unpinned portion of his 11,500-man force committed. Ewell's roughly 5,800 hold the high ground astride the Port Republic Road. The cautious doctrine is an accurate command input for Fremont's limited commitment, not a firepower penalty. Historical direction: CS holds the ridge; US fails to seize it.
  - Phase 2: `Port Republic - The Coaling`, scoreWeight 3, **DECISIVE**, `attacker:"CS"` / `defender:"US"`, `defaultFog:false`, `assaultDoctrine:"standard"`. Jackson concentrates roughly 6,000 against Tyler and Carroll's roughly 3,500. Taylor's Louisiana Brigade uses the wooded flank route to take The Coaling, the Union artillery position on the left. Historical direction: CS seizes The Coaling; US withdraws.
- **Score weights: 1 + 3 = 4.** The sum is 4, never 5. Port Republic carries decisive weight because the packet identifies it as the harder, army-saving fight.
- **Role-flip law:** phase 1 is US attack / CS defense; phase 2 is CS attack / US defense. Both phases declare roles explicitly. This is a role flip across two fields, not Cedar Creek's same-field reversal.
- **Fog law:** fog is OFF in both phases. The packet notes early-morning haze at Port Republic, but it also directs the build to model the woods-covered flank route as terrain rather than a fog toggle. Presentation weather may use `sky:"haze"`, `time:"morning"`, `provenance:"Inferred"`; the note must state that the tactical fog mechanic remains off.
- **Objectives:** phase 1 objective name carries `Ewell's Ridge` and the high ground south of Mill Creek. Phase 2 objective name carries `The Coaling`.
- **Menu rank:** `crossKeysPortRepublic:12`, after `bullrun1:10` and before `gainesMill:15`. The two dates precede Gaines' Mill on June 27, 1862.
- **Registry naming:** file `data/cross-keys-port-republic.json`, top-level key and scenario id `crossKeysPortRepublic`, injected as `GAME_DATA["cross-keys-port-republic"]`, registry line `R.crossKeysPortRepublic = GAME_DATA["cross-keys-port-republic"].crossKeysPortRepublic`.

## Two-field orientation contract

T8 already reads `p.homeEdge || top.homeEdge` at each phase build. D378 must use phase-level side-keyed edges because the scenario changes fields and axes.

- **Cross Keys:** orient increasing z toward Ewell's ridge and Port Republic. Use `homeEdge:{"US":"low","CS":"high"}`. This is an Inferred engine orientation selected from the packet's landmark sequence, not a Verified cardinal mapping.
- **Port Republic:** orient increasing z from Port Republic toward Lewiston Lane. Use `homeEdge:{"US":"high","CS":"low"}`. This is an Inferred engine orientation selected from the packet's landmark sequence, not a Verified cardinal mapping.
- The two mappings must both be explicit and opposite. A sandbox relaunch must prove that neither mapping leaks outside this scenario.

## Source register

These rows control future runtime claims. Confidence labels reproduce the committed packet; a URL's presence does not promote an Inferred claim.

| Source | Runtime use | Confidence |
|---|---|---|
| [American Battlefield Trust - Cross Keys](https://www.battlefields.org/learn/civil-war/battles/cross-keys) | June 8 date; Fremont, Ewell, and Jackson grades; 11,500 US / 5,800 CS army-present anchors; 684 US / 288 CS side-total casualties; Mill Creek, Port Republic Road, high ground; Confederate victory | Packet-Verified, fetched |
| [American Battlefield Trust - Port Republic](https://www.battlefields.org/learn/civil-war/battles/port-republic) | June 9 date; Tyler, Carroll, Jackson; 3,500 US / 6,000 CS; 1,002 US / 816 CS; The Coaling, South Fork, Louisiana flank; Confederate victory | Packet-Verified, fetched |
| [Encyclopedia Virginia - Shenandoah Valley Campaign of 1862](https://encyclopediavirginia.org/entries/shenandoah-valley-campaign-of-1862/) | Interior-lines and Massanutten operational framing; Jackson and Ewell grades; foot-cavalry context | Packet cite-pending; use Inferred unless independently corroborated |
| [Encyclopedia Virginia - Turner Ashby](https://encyclopediavirginia.org/entries/ashby-turner-1828-1862/) | May 23 promotion nuance; killed June 6; absent from both playable phases | Packet-confirmed in adversarial notes; commission status Disputed |
| [American Battlefield Trust - Kernstown](https://www.battlefields.org/learn/civil-war/battles/kernstown) | Tactical Union victory / strategic Confederate benefit; Kimball field command while Shields was wounded | Packet cite-pending; teaching only |
| [Wikipedia - Battle of McDowell](https://en.wikipedia.org/wiki/Battle_of_McDowell) | Winner-bled-more trap; never a playable phase in this scenario | Packet corroboration only; teaching only |

**Discrepancy and unpinned register:**

1. Cross Keys `11,500` is Fremont's force present, not an actually committed subtotal. The packet gives no citation-grade committed number. Runtime copy must never call the modeled fielded total exact or Verified.
2. The packet pins Port Republic at 3,500 US / 6,000 CS but does not pin brigade splits, gun totals, the battery at The Coaling, or the exact Louisiana regiments that stormed it. Battery and regiment names remain unpinned.
3. The fetched ABT pages pin side-total casualties only. No killed/wounded/captured split may ship as Verified.
4. Turner Ashby is absent after his June 6 death. His May 23 brigadier appointment's Senate-confirmation status is Disputed and has no playable effect.
5. The packet's `350-650 miles` and representative `30+ mile` foot-cavalry figures are not fetched scholarly numbers. Runtime teaching stays count-free unless a later citation amendment pins them.

## Strength, OOB, artillery, and timing contract

Engaged strengths, not campaign totals. The modeled ranges below are **D377 Inferred simulation envelopes**, not newly discovered historical figures. They exist to prevent runtime authors from silently presenting army-present totals as committed OOB or inventing regiment-grain certainty.

### Phase 1: Cross Keys

- **CS defender:** modeled fielded total **5,500-6,100**, centered on the packet's 5,800 anchor. Use Ewell's command at division/wing grain. `Maj. Gen. Richard S. Ewell` and the high-ground line are Verified; any split into left, center, or Trimble's ridge sector is labeled `Inferred grouping; Inferred strength`.
- **US attacker:** the packet pins **11,500 present** but no committed subtotal. Model **6,000-9,500 committed** and carry the 11,500 figure in teaching/notes as the full army-present anchor. Every fielded subdivision uses `Inferred grouping; Inferred committed strength`. No unit or card may describe the modeled total as the exact number Fremont committed.
- **Artillery:** both sides field artillery because the packet and terrain narrative require an artillery-bearing stand, but no count or battery identity is pinned. D378 uses broad model envelopes only: US **8-24 guns**, CS **8-20 guns**, with every artillery note carrying `Unpinned battery identity; Inferred guns and crew`. No named battery ships from this packet.
- **Commitment mechanism:** Fremont's noncommitted balance is simply not in the fielded OOB. Do not create a firepower, morale, hesitation, or casualty multiplier. The universal `assaultDoctrine:"cautious"`, terrain, formation, and reinforcement timing carry the historical command behavior.

### Phase 2: Port Republic

- **CS attacker:** modeled total **5,700-6,300**, centered on the packet's 6,000 anchor. Required high-level formations are `Taylor's Louisiana Brigade`, `Winder's Brigade`, and a clearly labeled Inferred supporting group if runtime grain needs it. No 7th or 9th Louisiana regiment name may ship without a source amendment.
- **US defender:** modeled total **3,300-3,700**, centered on the packet's 3,500 anchor. Required high-level formations are `Tyler's Brigade` and `Carroll's Command`; lower splits remain Inferred.
- **The Coaling artillery:** use the generic display `Union Artillery at The Coaling` with the exact note `Verified emplacement; Unpinned battery identity; Inferred strength`. D378 must not invent a battery commander or battery designation. Model **6-12 US guns** and **6-18 CS guns** as explicit Inferred envelopes, not historical counts.
- **Flank mechanism:** Taylor's wooded approach and the knoll geometry carry the seizure. No flank, surprise, Louisiana, or Coaling combat multiplier exists.

### Provenance labels

Every runtime unit note must contain one of these exact labels:

- `Verified identity; Inferred strength` for a formation or commander identity the packet pins;
- `Inferred grouping; Inferred committed strength` for Cross Keys modeling subdivisions or an unpinned support grouping;
- `Verified emplacement; Unpinned battery identity; Inferred strength` for the Coaling artillery;
- `Unpinned battery identity; Inferred guns and crew` for other generic artillery.

No runtime prose may upgrade `Inferred`, `Unpinned`, or `Disputed` to `Verified` without a committed citation amendment and a matching plan-probe change.

## OOB and battle-date rank traps

The runtime probe searches leaders, unit names, notes, brief/end copy, teaching cards, and codex text. Rank rejection is scoped to `crossKeysPortRepublic`; never apply the Jackson guard across later 1862-63 battles.

- **Maj. Gen. Thomas J. Jackson** - overall Confederate commander, present at Port Republic. He was a major general throughout this Valley campaign. Reject `Lt. Gen. Thomas J. Jackson` in this payload only; his October 10, 1862 promotion makes lieutenant general correct at Fredericksburg and Chancellorsville.
- **Maj. Gen. Richard S. Ewell** - Cross Keys field commander. Reject a brigadier rendering.
- **Maj. Gen. John C. Fremont** - Mountain Department commander. Reject a brigadier rendering.
- **Brig. Gen. Erastus B. Tyler** - Union command at Port Republic. Reject major general.
- **Col. Samuel S. Carroll** - Union command at Port Republic. Reject any general's grade.
- **Brig. Gen. Richard Taylor** - Louisiana Brigade and the wooded flank attack. Reject major general.
- **Brig. Gen. Charles S. Winder** - Stonewall Brigade. Reject major general.
- **Turner Ashby - ABSENT BY LAW.** He was killed June 6, two days before Cross Keys. No phase OOB or reinforcement may contain `Ashby`; teaching may explain the absence and the disputed commission status.
- Kernstown command does not leak into this scenario: Shields was wounded, Kimball commanded the field, and neither becomes a playable Cross Keys/Port Republic unit.

## Terrain and objective contract

### Cross Keys

- **Mill Creek:** a slowing creek band the Union advance must cross, never a damage source.
- **Port Republic Road:** the road axis toward Jackson's escape/concentration point.
- **High ground south of Mill Creek:** Ewell's defensive ridge and the phase objective.
- **Union Church / Cross Keys crossroads:** a navigation landmark, not the objective.
- **Trimble's ridge:** the CS right-sector terrain anchor. The terrain name is Verified; any modeled wing split is Inferred.

### Port Republic

- **The Coaling:** a wooded knoll and Union artillery emplacement on the Union left; the decisive objective.
- **Lewiston / Lewis farm and Lewiston Lane:** the Union line and eastward retreat axis.
- **South Fork of the Shenandoah River:** the water boundary behind the Confederate concentration.
- **North River bridge at Port Republic:** a concentration/escape landmark, not a scored crossing.
- **Wheat field / flats:** open ground before the line; Taylor's approach retains a woods-covered flank route.

All coordinates, radii, woods polygons, water bands, road paths, and home-edge z values are Inferred map abstractions of these Verified landmarks.

## Historical direction and balance law

The universal combat model owns every result. The only eligible levers are the contracted strength envelopes, terrain, objective geometry, formation, xp/readiness, cautious-vs-standard doctrine, reinforcement timing, hold/time thresholds, and phase weights.

The future 8-seed battery carries four source-derived direction guards:

1. Phase 1: CS holds Ewell's Ridge in at least 5/8 seeds.
2. Phase 2: CS seizes The Coaling in at least 5/8 seeds.
3. Aggregate: CS wins the 1+3 weighted scenario in at least 5/8 seeds.
4. Phase 1: US losses exceed CS losses in at least 5/8 seeds, direction only.

Port Republic's fetched side totals also run US above CS, but the packet's candidate teeth deliberately keep that phase verdict-scoped because the lower-grain OOB is unpinned. There is no phase-2 or aggregate casualty-direction tooth, casualty magnitude, killed/wounded/captured split, fixed ratio, or count-forcing tooth. Same-seed replay must match exactly. Passive US and passive CS launches must terminate without NaN or a hang.

**Honest A/B rule:** if D378 changes any simulation input after the first battery, `DECISIONS.md` logs the old value, new value, and all four observed 8-seed guard counts. A result-derived multiplier or scripted verdict is forbidden.

## Teaching and anti-Lost-Cause contract

The scenario requires at least six teaching cards plus one codex entry. Each carries at least two packet URLs and an exact `Verified`, `Inferred`, or `Disputed` provenance value. Two URLs do not promote a claim when the packet labels the evidence thin.

1. **`vk_two_day_finale`** - Cross Keys and Port Republic as consecutive fights that preserved Jackson's concentration. Keep battlefield facts distinct from operational interpretation.
2. **`vk_limited_commitment`** - Fremont had 11,500 present but committed only a fraction. The exact committed number remains Unpinned; the model range is disclosed as Inferred.
3. **`vk_the_coaling`** - the wooded artillery knoll and Taylor's Louisiana flank. The battery and storming-regiment identities remain Unpinned.
4. **`vk_three_armies_one_valley`** - Banks, Fremont, and Shields failed to combine around Massanutten. This is strategic teaching only; no operational-maneuver score or buff exists.
5. **`vk_foot_cavalry_not_deified`** - forced marching, straggling, exhaustion, secrecy, and interior lines without Lost-Cause sainthood or an unsourced mileage count. Never encode a Jackson speed, morale, or genius bonus.
6. **`vk_victorious_defeat`** - Kernstown was a tactical Union victory and strategic Confederate benefit. Jackson remains the loser of that fight; Kernstown is teaching-only here.
7. *(Optional)* **`vk_mcdowell_cost_trap`** - McDowell's Confederate field victory with higher Confederate losses. Teaching-only and explicitly barred from this scenario's casualty assumptions.

The codex entry uses `theater:"Eastern"`, `campaign:"Shenandoah Valley Campaign of 1862"`, and `result:"Confederate victory"`. It states that the campaign's defining operational maneuver is not simulated by the tactical objective-hold engine.

**Dignity and scope guards:** Front Royal's mass surrender and the Two Marylands story remain teaching-only and are never a scored capture objective. The Valley campaign as a whole, Kernstown, McDowell, First Winchester, and Front Royal are not extra phases. The standing no-Leetown-Native-OOB and no-playable-Fort-Pillow carve-outs remain untouched.

## D74 no-fudge acceptance wall

D378 adds no Cross Keys / Port Republic-specific damage, firepower, morale, casualty, rout, capture, commitment, flank, winner, or score control. The data scan rejects these keys at any depth:

`damage`, `dmg`, `damageMult`, `firepower`, `firepowerMult`, `fireScale`, `fireMult`, `fireMultiplier`, `killScale`, `killMult`, `casualtyScale`, `casualtyMult`, `lossMult`, `combatScale`, `battleDamage`, `battleFire`, `powerMult`, `moraleMult`, `routMult`, `captureMult`, `scoreBonus`, `scoreMult`, `winner`, `winOverride`, `victoryOverride`, `outcomeOverride`, `forceWin`, `winnerFudge`, `fudge`, `valorMult`, `heroism`, `geniusMult`, `speedMult`, `commitmentMult`, `flankMult`.

Named temptations, all forbidden: a Fremont hesitation/firepower nerf; an Ewell high-ground winner key; a Jackson speed/genius bonus; a Louisiana flank multiplier; a scripted Coaling seizure; a casualty ratio target; a capture-count objective.

## D378 complete future runtime integration contract

- `data/cross-keys-port-republic.json` with top-level key/id `crossKeysPortRepublic`, two T8 phases, top-level US attacker / CS defender, and per-phase roles, doctrines, fog, home edges, OOB, terrain, objectives, teaching, codex, and Inferred weather above.
- `src/tactical/T1-bull-run.js`: exact registry line and menu rank `crossKeysPortRepublic:12`, producing Bull Run -> Cross Keys / Port Republic -> Gaines' Mill -> Malvern Hill.
- `src/tactical/T10-flags.js`: explicit `theater:"E"`, `badges:false`, `csFlag:"anv"`. The `anv` value is an **Inferred representative mid-war Eastern flag family**, not a claim that every Valley regiment carried one identical Southern Cross. The comment must preserve that limitation.
- `tools/validate-data-schemas.mjs`: enroll `cross-keys-port-republic.json`; 18 battle files and **48 total schema rows**.
- `tools/shots/data-schema-validation.html`: regenerate through the validator with a substantive 48th row.
- `tools/probe-cross-keys-port-republic.mjs`: focused browser/runtime guard with the four-direction battery and every tooth below.
- `tools/probe-tactical-roster.mjs`: add `crossKeysPortRepublic` to `EXPECTED`, `PHASE_COUNTS` as 2, chronology, and DOM button coverage.
- `tools/probe-custom-battle-builder.mjs`: add `crossKeysPortRepublic` to the historical `EXPECTED` baseline.
- `tools/probe-gaines-mill.mjs`: replace both immediate Bull Run -> Gaines' Mill assumptions with Bull Run -> Cross Keys / Port Republic -> Gaines' Mill -> Malvern Hill, without weakening the Gaines battle teeth.
- `tools/probe-loot-survival.mjs`: move the whole-registry pin from 1125 to `1125 + unique Cross Keys / Port Republic side-unit ids x 3`, with a D378 history comment. The same commit bumps every other whole-registry pin, including Gaines' Mill, New Market Heights, Stones River, and Cedar Creek.
- `src/tactical/T10-flags.js` plus `tools/probe-flags.mjs`: explicit scenario metadata and registered coverage **17 -> 18**, with a semantic E/false/anv tooth and the Inferred-family limitation.
- `tools/probe-weather.mjs`: no source enrollment is expected because it discovers structured weather dynamically; its readback must move from **17 -> 18** valid hints.
- `data/media-budget.json`: opening-scene coverage **17 -> 18**. Derive the largest opening OOB: if the new phase opening exceeds Kennesaw's 17 units, move `largestShippedScene`; otherwise Kennesaw keeps the crown.
- `tools/probe-intel-uhd617-profile.mjs`: opening-scene coverage **17 -> 18** and the same largest-scene rule.
- `tools/vet-no-regression.mjs`: enroll the focused probe, suite **122 -> 123**, and update the sweep timeout comment from 17 to 18 battles. `tools/sweep-all-battles.mjs` remains dynamic.
- `civil_war_generals.html`: rebuild only through `node tools/build.mjs`.
- No manifest enrollment and no `data/logistics-rail.json` change are expected.

**Classic-layer collision law:** frozen `build/base.html` already contains separate Classic ids `crosskeys` and `portrepublic`. They remain untouched. The tactical id is the combined camel-case `crossKeysPortRepublic`; the plan/runtime probes verify the separation and that no `crosskeys` or `portrepublic` rail route is introduced.

## Required D377 planning gate

- `node --check tools/probe-cross-keys-port-republic-plan.mjs`
- `node tools/build.mjs` and require `GATE OK` with generated HTML byte-identical
- `node tools/validate-data-schemas.mjs`
- `node tools/probe-battle-build-research.mjs`
- `node tools/probe-cross-keys-port-republic-plan.mjs`
- `node tools/probe-gaines-mill-plan.mjs`
- `node tools/probe-new-market-heights-plan.mjs`
- `node tools/probe-stones-river-plan.mjs`
- `node tools/probe-cedar-creek-plan.mjs`
- `node tools/probe-tactical-roster.mjs`
- `node tools/probe-custom-battle-builder.mjs`
- `git diff --check`

Run browser probes serially with nothing else competing on the 8 GB Mac. Read every produced JSON artifact. Full `npm run vet:noreg` is not owed for this planning slice.

Plus one surgical negative bind: tamper the load-bearing Jackson battle-date rank line, observe exactly the HISTORY step fail and a nonzero exit, then restore the spec byte-identically and rerun green.

## Required D378 runtime gate

- `node --check` on every new/touched JS or MJS file, including preparse of any cooked browser strings
- `node tools/build.mjs`
- `node tools/validate-data-schemas.mjs`
- `node tools/probe-battle-build-research.mjs`
- `node tools/probe-cross-keys-port-republic-plan.mjs`
- `node tools/probe-cross-keys-port-republic.mjs`
- `node tools/probe-tactical-roster.mjs`
- `node tools/probe-custom-battle-builder.mjs`
- `node tools/probe-loot-survival.mjs`
- `node tools/probe-flags.mjs`
- `node tools/probe-weather.mjs`
- `node tools/probe-intel-uhd617-profile.mjs`
- `node tools/probe-media-budget.mjs`
- `node tools/vet-no-regression.mjs --list`
- `node tools/probe-bullrun.mjs`
- `node tools/probe-gaines-mill.mjs`
- `node tools/probe-malvern-hill.mjs`
- `node tools/probe-new-market-heights-plan.mjs`
- `node tools/probe-stones-river-plan.mjs`
- `node tools/probe-cedar-creek-plan.mjs`
- `git diff --check`

Run every browser probe serially with one shared server, `TMPDIR="$PWD/.tmp"`, and no concurrent workflow/helper. Read every produced JSON; require `ok:true`, zero failed steps, and zero pageerrors. Full `npm run vet:noreg` remains deferred until the ratified stretch-battle release boundary.

## Future runtime probe teeth

When `data/cross-keys-port-republic.json` exists, `tools/probe-cross-keys-port-republic.mjs` and this plan probe's implementation branch must verify:

- exact two-phase shape, names, roles, doctrines, fog booleans, weights 1+3=4, and per-phase opposite home-edge maps;
- menu and DOM chronology Bull Run -> Cross Keys / Port Republic -> Gaines' Mill -> Malvern Hill, one accessible button, two side-choice cards, and side preserved through `fldLaunchBattle`;
- Cross Keys landmarks `Mill Creek`, `Port Republic Road`, `Union Church`, `Ewell's Ridge`, and `Trimble`; Port Republic landmarks `The Coaling`, `Lewiston`, `Lewiston Lane`, `South Fork`, `North River bridge`, and `wheat field`;
- phase-1 totals CS 5,500-6,100 and US committed 6,000-9,500, with the full 11,500 anchor present only in candid notes/teaching; phase-2 totals CS 5,700-6,300 and US 3,300-3,700;
- artillery model envelopes P1 US 8-24 / CS 8-20, P2 US 6-12 / CS 6-18; generic Unpinned battery labels; no battery commander, 7th Louisiana, or 9th Louisiana claim;
- every unit note carrying one of the exact provenance labels in this spec;
- exact rank/absence teeth for Jackson, Ewell, Fremont, Tyler, Carroll, Taylor, Winder, and Ashby; the Jackson rejection remains scenario-scoped;
- no forbidden D74 key at any depth, including genius/speed/commitment/flank temptations;
- at least six teaching cards and one codex entry, each with at least two packet URLs and exact provenance; the whole campaign/Kernstown/McDowell/Front Royal stay teaching-only;
- same-seed replay; passive launches terminate; the four 8-seed source-direction guards above;
- future Army Register pin equals 1125 plus unique new side-unit ids times three, with every whole-registry pin moved in the same commit;
- negative binds: remove the exact T1 registry line and separately tamper the Jackson rank rendering; each makes only its corresponding dependent teeth red before byte-identical restoration.

## D377 completion criteria

D377 is green when this spec and `tools/probe-cross-keys-port-republic-plan.mjs` pass; the probe proves no half-registration and retains the exact planned-only baselines of 17 scenarios, 47 schema rows, Army Register 1125, 17 flags/weather/Intel/media hints/scenes, and suite 122; the negative bind bites exactly HISTORY and restores byte-identically; the requested focused/adjacent gate and JSON readback are green; canonical docs record the boundary; LANE-003 returns to CONTRACT/unowned for D378 runtime; and the commit is pushed.

## D461 addendum — the Front Royal scored-capture lift (LANE-013 P3, 2026-07-18)

Aaron's D455 popup-locked decision (§3 row 8: "Front Royal never-scored guard → UNLOCK —
conventional capture may score") AMENDS the dignity-and-scope guard above for Front Royal
ONLY. The original sentence ("Front Royal's mass surrender and the Two Marylands story
remain teaching-only and are never a scored capture objective") is preserved above as the
historical record; this addendum is the controlling law.

**The lift:** Front Royal's conventional capture MAY score through the existing universal
capture path when a future build registers the action — no new scoring family, no
capture-harvest mechanic, no per-battle scoring switch (D74 holds). The mass surrender of
the Front Royal garrison (~700, May 23 1862) becomes representable as an ordinary
capture-credit outcome of play, exactly as every other battle's captures already score.
The Two Marylands story (1st Maryland US vs 1st Maryland CS) remains teaching content and
is untouched by this lift. Kernstown, McDowell, and First Winchester remain teaching-only
— their guards are engine-mismatch and casualty-inversion cautions, not the lifted scope
guard — and the standing Fort Pillow / Leetown carve-outs recorded above are UNCHANGED by
this phase (Fort Pillow's own availability moved under D455 §3 row 6 in its own lane
phases, never here).

**Enforcement surface (re-pinned with documented D461 chains in the same commit):** the
runtime probe's teaching-only barred list drops `frontRoyal` (kernstown/mcdowell/
firstWinchester stay); a new scored-lift tooth pins this addendum's presence, and
stripping the addendum reds exactly that tooth (the inverse bind). No runtime, data, or
generated byte moves in this phase — the guard's entire enforcement surface was spec text
plus probe teeth, and the deterministic A/B evidence is the unchanged generated-game hash
(`7c13850e7f340f1ab7cc9227423d7340` before and after).
