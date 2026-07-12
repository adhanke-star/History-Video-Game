# Five Forks Battle-Build Spec (D379)

**Status:** D379 planning/spec plus a filesystem-first, dual-mode plan probe. This slice adds no Five Forks runtime data, scenario registry entry, menu button, schema row, Army Register row, shared officer implementation, generated-game behavior, combat input, or baseline-count movement.

**Task shape:** build the sixth LANE-003 contract from `docs/design/battle-build-research/appomattox-campaign-battle-build-research.md` (`READY_FOR_SPEC`, adversarial pass ratified). The playable unit is Five Forks on April 1, 1865: Sheridan's dismounted cavalry fixes Pickett's thin White Oak Road line while Warren's V Corps turns the refused Confederate left. The approved Warren-to-Griffin relief is specified as a reusable data-driven T3 officer event for future D380; D379 does not implement it.

## 1. Scope And Planning Boundary

**Battle:** Five Forks, Virginia, April 1, 1865.

**Tactical id and future file:** `fiveForks` in `data/five-forks.json`.

**Playable shape:** one single-phase attacker-seize scenario.

- **Roles:** `attacker:"US"` / `defender:"CS"`.
- **Phase law:** no `phases[]`. Reject the research packet's optional T8 form. The cavalry fix and V Corps turn are simultaneous parts of one decisive late-afternoon fight, not two separately scored sub-battles.
- **Fog:** `defaultFog:false`. Visibility was not the load-bearing Confederate failure; the thin refused line, the Federal strength edge, the turning geometry, and absent senior Confederate command are.
- **Objective:** `Five Forks Crossroads`. The US attacker must seize the crossroads and roll the White Oak Road works from the refused left at the return / the Angle.
- **Menu rank:** `fiveForks:85`, after `nashville:80`.
- **Presentation:** late afternoon. A future `weather.time` may use the supported late-afternoon presentation value. Any exact sky value remains `Inferred` unless a committed source amendment pins it.
- **Terminal boundary:** D379 stops before `data/five-forks.json`, T1/T10 registration, any T3 edit, any count change, any generated-game behavior change, or the full release battery.

## 2. Research Basis And Source Register

This contract uses only the committed Appomattox Campaign packet and Aaron's approved D379 seam. No claim is promoted beyond the packet. A URL's presence does not turn a thin or disputed claim into a Verified claim.

| Source | Contract use | Confidence |
|---|---|---|
| [Encyclopedia Virginia - Five Forks, Battle of](https://encyclopediavirginia.org/entries/five-forks-battle-of/) | April 1 date; engaged strengths about 21,000 US / 9,200 CS; 830 US casualties; about 3,005 CS casualties including about 2,400 captured; Sheridan's relief of Warren; Pickett, Fitz Lee, and Rosser at the shad bake; court-of-inquiry finding | Packet-Verified, fetched |
| [American Battlefield Trust - Five Forks](https://www.battlefields.org/learn/civil-war/battles/five-forks) | Sheridan, Warren/V Corps, Pickett, Fitz Lee, White Oak Road, shad-bake context, Confederate defeat; broad 32,600 US / 22,000 CS figures retained only as a rejected active-map total | Packet-Verified, fetched |
| [NPS - United States Colored Troops at Appomattox](https://www.nps.gov/apco/learn/historyculture/united-states-colored-troops-at-appomattox.htm) | Future campaign-end teaching: 2nd Division, XXV Corps, seven USCT regiments, Black agency in forcing the war's end; never Five Forks active OOB | Packet-Verified, fetched |
| [Charles Griffin summary and cited V Corps report](https://en.wikipedia.org/wiki/Charles_Griffin) | Griffin's April 1 substantive Brigadier General grade, brevet Major General, and April 2 full Major General of Volunteers promotion | Packet cite-pending; the packet's adversarial pass confirms the grade trap |
| [Battle of Appomattox Court House](https://en.wikipedia.org/wiki/Battle_of_Appomattox_Court_House) | Corroborating campaign-end context only; the surrender remains teaching-only | Packet cite-pending |

**Two-source rule:** every future runtime teaching card and codex claim stamped `Verified` requires at least two independent packet source URLs that support that claim. If the packet supplies only one directly supporting URL, the claim remains `Inferred` or `Disputed` even when the packet's narrative treats the underlying fact as well established. D380 may amend the packet with a second source before upgrading provenance; it may not silently promote a claim in runtime data.

## 3. Strength And OOB Contract

Use engaged forces on the active map, not campaign-wide present figures.

- **US engaged anchor:** about **21,000**. This is Encyclopedia Virginia's engaged figure and the D380 active-map target.
- **CS engaged anchor:** about **9,200**. This is Encyclopedia Virginia's engaged figure and the D380 active-map target.
- **Rejected active-map figures:** American Battlefield Trust's **32,600 US / 22,000 CS** are broader present/engaged labels and must not become the fielded Five Forks totals. They remain a discrepancy taught honestly, not an alternative tuning target.
- **Federal shape:** Sheridan's combined operation at coarse command grain. Dismounted cavalry fixes the Confederate front; Warren's V Corps turns the refused left; Griffin assumes V Corps command only when the relief event fires.
- **Confederate shape:** Pickett's thin command holds the White Oak Road works, including the refused left at the return / the Angle. Pickett, Fitzhugh Lee, and Rosser are not active aura sources in the decisive sector because they were absent from command.
- **Lower-grain ceiling:** brigade/division grouping names, subordinate strengths, gun counts, crew counts, experience, formation, readiness, reinforcement seconds, and exact sector placements remain coarse and `Inferred` unless the committed packet pins them. D380 may select honest simulation abstractions inside the two engaged anchors, but every unpinned unit note must disclose `Inferred strength` and may not manufacture exact regimental or battery identity.
- **Artillery ceiling:** the packet does not pin an active-map gun total. D380 may use a coarse Inferred gun envelope under the universal gun model; it may not present that number as Verified or use guns as a back-solved outcome switch.

The approximately 2.3:1 Federal edge is an accurate input, not a license for an output key. Northern manpower and industry, emancipation, siege attrition, and Confederate manpower limits explain why that edge existed; the teaching may not collapse the result into Lost-Cause inevitability or Confederate cowardice.

## 4. Terrain And Objective Contract

The future map must carry these packet landmarks as terrain, objective, marker, road, water, or teaching context. Coordinates and geometry remain Inferred abstractions.

- **Five Forks** - the five-road crossroads and scored objective.
- **White Oak Road** - the entrenched Confederate line.
- **the return / the Angle** - the approximately 150-yard refused left and the break-in point.
- **Ford's Road or Scott's Road** - the road-axis naming variant preserved honestly; runtime must choose a consistent display form without presenting a disputed alias as two separate roads.
- **Gravelly Run** - a water/terrain boundary and approach anchor, never a damage source.
- **Hatcher's Run** - the broader field boundary and campaign context, never a second scored objective.
- **Dinwiddie Court House** - Sheridan's March 31 position and teaching context, not a Five Forks objective.
- **the shad-bake site** - teaching context behind the lines, never a collectible, objective, buff, penalty, or comic prop.

The Confederate works may provide ordinary universal cover. The refused flank and field geometry may expose the line to a turn. No terrain element writes casualties, morale, rout, score, or winner.

## 5. Approved Future Generic Leader-Replacement Contract

D379 specifies this seam and proves that the contract is durable. D380 implements it in the shared officer module and extends generic officer tests before relying on it for Five Forks. The exact shared seams are: current-cast flatten/build validation in `fldOfficerRoster` / `fldBuildOfficers`; conditional field copy in `fldMakeOfficer`; an order-independent due-event prepass before aura accumulation in `fldOfficersStep`; atomic state plus presentation through `fldOfficerActivate` or a dedicated generic helper; and explicit relieved branches in the down-list, selected-unit HUD, roster HUD, end report, 2D renderer, and 3D sync. No Five-Forks-only combat hook is authorized.

### 5.1 Future data shape

The future Five Forks US leader roster may contain this timed replacement record:

```js
{
  id: "ld_griffin",
  atSec: <relief time>,
  replaces: "ld_warren",
  entry: "Sheridan relieves Warren; Griffin assumes command of V Corps."
}
```

The record also carries the normal T3 leader fields (`side`, `name`, `short`, `quality`, `radius`, position/attachment, note, and any source-honest fate input). `replaces` is generic leader data, not a scenario id and not a result modifier.

### 5.2 Validation and atomic event semantics

- A present `replaces` must be a nonblank string and must name one existing leader in the current T3 cast. A replacement record also requires an explicit nonblank source `id`, a finite nonnegative `atSec`, and a nonblank string `entry`.
- The target must be `active:true`, `alive:true`, not already `relieved`, and on the same side as the replacement.
- The replacement must be a distinct leader id, initially inactive because it has a finite `atSec`, and must not itself already be active, relieved, or the target of another replacement.
- The replacement fires **once** when the new leader reaches `atSec`.
- Validate raw cast identities and replacement relationships before constructing replacement rows. A rejected row must not consume the seeded `_fate` RNG draw or shift any unrelated leader's fate threshold.
- Resolve all due replacement events as one nonthrowing validation/prepass before any aura accumulation for that tick. Validate the whole due batch before applying any event. This prevents one-tick Warren/Griffin overlap caused by roster order and prevents partial mutation when a later event in the batch is invalid.
- A valid event applies atomically: the old leader becomes `active:false` and `relieved:true` while remaining `alive:true`; the new leader becomes `active:true`; the old aura is absent and the new leader is the sole replacement aura source for that tick and every later tick.
- There is no gap and no overlap in the command aura. At the event boundary, exactly one of the old/new leaders contributes an aura.
- The exact `entry` string may drive the existing presentation-only announcement/banner seam once. It may not write battle results, campaign state, scoreboards, casualties, morale, rout, winner, or any persistent output ledger.

### 5.3 Fail-closed cases

Invalid data leaves every pre-event target state unchanged, leaves the proposed replacement inactive, emits no relief announcement, consumes no extra RNG, throws no exception/pageerror, and performs no partial unit/result mutation. Rejection is terminal for that record rather than retried on every later tick. D380's generic tests must cover every class independently:

1. present but blank/non-string `replaces`;
2. missing/blank explicit replacement `id`;
3. blank/non-string `entry`;
4. nonfinite/negative `atSec`;
5. missing target id;
6. target not active at the event time;
7. target already relieved or dead;
8. target on the opposite side;
9. self-replacement (`id === replaces`);
10. duplicate leader id inside the current cast;
11. two replacement records naming the same target;
12. a replacement chain/cycle or a replacement leader targeted by another due event;
13. repeated calls/ticks after a valid event or after terminal rejection.

Duplicate, chained-in-the-same-tick, cross-side, self, missing-target, and repeated events all fail closed. D380 must not partially deactivate one leader while leaving another event half-applied.

### 5.4 Output-neutral relief, presentation, and byte identity

- Relief is not a wound, fall, death, capture, casualty, rout, morale shock, score event, winner event, or campaign-output event.
- Never call `fldOfficerWounded` or `fldOfficerFalls` for relief. The existing fall path changes morale and death narration and is semantically forbidden here.
- Warren remains alive. He receives no `fellAt`, no wound marker, no command shock, and no entry in the lost-officers list.
- HUD roster, selected-unit command attribution, 2D marker/label, 3D marker/aura, and end reporting must distinguish **relieved** from **fallen**. A relieved leader may be shown in the officer roster/end teaching as “relieved”; he must never carry the fallen cross, dagger, “lost,” “fell,” or death language.
- The old leader's inactive relieved state must not render a living aura. The new active leader alone renders the aura.
- A missing `replaces` field follows the current timed-arrival path byte-for-byte. No new property, announcement, HUD fragment, end-report fragment, aura order, RNG consumption, or serialized trace may appear for every current scenario and every synthetic legacy officer fixture.
- The implementation lives in `src/tactical/T3-officers.js` and the generic officer probe. No `fiveForksPenalty`, `fiveForksBonus`, battle-name branch, or Five-Forks-only combat hook exists.

### 5.5 T8 phase-view boundary

T8 currently copies a phase's `leaders` into the per-phase `__FIELD.scenData` view, resets the phase clock, and rebuilds officers on each phase reset. Replacement validation, duplicate/repeat scope, and `atSec` are therefore current-cast/phase-local. Leader ids reused in a different scenario or phase remain legal. No T8 code change is required. Five Forks itself is single-phase and must not use this seam as a reason to add `phases[]`.

The current Custom Battle authoring/serialization surface does not carry `atSec`, `replaces`, or `entry`. D380 reusability means the shared T3 authored-scenario data contract plus generic tests; it does not authorize a Custom Builder UI or share-format expansion in this slice.

### 5.6 Required D380 generic and Five Forks teeth

Before the Five Forks runtime direction battery, D380 extends `tools/probe-officers.mjs` with executable generic tests for valid atomic relief, no overlap/no gap, exact once-only announcement, every fail-closed class above, relieved-vs-fallen HUD/render/end output, and byte-identical missing-`replaces` behavior. `tools/probe-five-forks.mjs` then proves Warren is active before the event, Griffin is active after it, Warren is alive+relieved, exactly one aura source exists on both sides of the boundary, and no result/output ledger changes merely because the relief fires.

## 6. Battle-Date Ranks And Decisive-Command Absences

The future runtime probe searches leaders, unit commanders, notes, brief/end text, teaching cards, and codex content. Rank checks are scenario-scoped.

- **Maj. Gen. Philip H. Sheridan** commands the combined operation. Reject `Lt. Gen. Philip H. Sheridan`.
- **Maj. Gen. Gouverneur K. Warren** commands V Corps at the start. He remains alive when relieved.
- **Griffin April 1 rank — Brig. Gen. (brevet Maj. Gen.); never a firm Maj. Gen. of Volunteers on April 1.** His full Major General of Volunteers promotion dates April 2.
- **Maj. Gen. George E. Pickett** commands the Confederate task force but is absent from decisive command at the shad bake. Reject a full `General` or lieutenant-general rendering.
- **Maj. Gen. Fitzhugh Lee** is absent from decisive command at the shad bake.
- **Maj. Gen. Thomas L. Rosser** is absent from decisive command at the shad bake.
- **Lt. Gen. Ulysses S. Grant** belongs in operational teaching context. Reject `Maj. Gen. Ulysses S. Grant` and a four-star/full `General Ulysses S. Grant` rendering here.
- Pickett, Fitz Lee, and Rosser may appear in teaching text explaining the documented absence. They must not be active on-map aura sources in the decisive Five Forks cast.

Absent command may remove only an ordinary leadership input by omitting the absent leader from the active aura cast. It may not write casualties, morale, rout, winner, score, or any result output.

## 7. Historical Direction Law And Honest A/B

D380 runs exactly eight shared-model deterministic seeds in one serialized focused process. Require at least **5/8** for each independent direction guard:

1. the US seizes the Five Forks crossroads;
2. Confederate total losses exceed Union total losses.

“Total losses” means the universal fielded-minus-survivor loss ledger; captured and missing remain labeled subsets and are never added twice. The guard is direction-only.

Do **not** guard casualty magnitude, a casualty ratio, prisoner count, captured-general count, captured-gun count, surrender count, rout count, or any killed/wounded/captured split. Prisoner totals conflict across the packet and remain teaching text.

If D380 changes any simulation input after the first eight-seed battery, `DECISIONS.md` logs the old value, new value, and both observed guard counts for every iteration. Eligible inputs are engaged strength inside this contract, coarse OOB splits, universal gun counts, ordinary leader quality/aura inputs, terrain/works geometry, formation, experience/readiness, reinforcement/relief timing, objective radius, and universal time/hold thresholds. No result-derived multiplier or scripted verdict is eligible.

## 8. D74 No-Fudge Acceptance Wall

The future data scan rejects these keys and families at any depth:

`damage`, `dmg`, `damageMult`, `firepower`, `firepowerMult`, `fireScale`, `fireMult`, `fireMultiplier`, `killScale`, `killMult`, `casualtyScale`, `casualtyMult`, `lossScale`, `lossMult`, `captureScale`, `captureMult`, `surrenderScale`, `surrenderMult`, `routScale`, `routMult`, `moraleScale`, `moraleMult`, `combatScale`, `battleDamage`, `battleFire`, `powerMult`, `scoreBonus`, `scoreMult`, `winner`, `winOverride`, `victoryOverride`, `outcomeOverride`, `forceWin`, `winnerFudge`, `fudge`, `genius`, `geniusMult`, `hesitation`, `hesitationMult`, `flank`, `flankMult`, `commandFailure`, `commandFailureMult`, `shadBake`, `shadBakeMult`, `fiveForksPenalty`.

Named temptations, all forbidden: a Sheridan genius bonus; a Warren hesitation penalty; a Griffin relief bonus; a Pickett command-failure casualty writer; a shad-bake morale/rout switch; a refused-flank firepower multiplier; a scripted prisoner haul; a forced US winner; a CS casualty multiplier; any source branch that checks `fiveForks` and writes combat output.

The result must emerge from engaged strength, thin-line density, ordinary works, the refused-flank geometry, timing, formation, experience/readiness, universal command aura, and the objective/time model.

## 9. Teaching, Dignity, And Memory Contract

D380 requires at least seven restrained teaching cards plus one codex entry. Every claim obeys the two-source/provenance rule.

1. **Warren inquiry and posthumous finding.** The inquiry convened December 9, 1879; Warren died August 8, 1882; findings were reported in November 1882. Teach institutional redress arriving too late, without a hero/villain binary. If two direct packet URLs do not support the complete date cluster, label the card `Inferred` until the packet is amended.
2. **The shad bake, carefully.** Pickett, Fitz Lee, and Rosser were documented away from decisive command. Exact culpability, the acoustic-shadow mechanism, and blame remain `Disputed`; no caricature, joke, fish collectible, or command-failure result key.
3. **Why the line broke.** Ten months of siege attrition and Confederate manpower limits stretched the works. Retain Northern manpower, industry, and emancipation context; do not turn “overwhelmed by numbers” into a Lost-Cause alibi severed from slavery and state capacity.
4. **Appomattox remains teaching-only.** The frozen Classic `appomattox` record may remain. No new tactical Appomattox/surrender data, registry entry, scored objective, or capture mechanic may accompany Five Forks.
5. **XXV Corps / USCT at the end.** Preserve the packet's 2nd Division, XXV Corps, seven-regiment/5,000-plus NPS anchor for future campaign-end teaching and center Black agency. It is not Five Forks active OOB.
6. **Reconciliation memory.** Preserve David Blight's race-and-reunion framing for the future surrender teaching: white sectional reconciliation must not erase emancipation or Black freedom.
7. **Prisoner totals conflict.** Encyclopedia Virginia's approximately 2,400 captured and other broader claims remain conflicting teaching text. Never convert the conflict into a runtime count tooth.

The codex uses `theater:"Eastern"`, `campaign:"Appomattox Campaign"`, and `result:"Union victory"`, with the cost/direction and command-relief limits stated plainly.

## 10. Frozen Classic And Rail-Route Collision Law

Two lowercase `fiveforks` layers already exist and remain untouched:

- frozen Classic `build/base.html` has exactly one `{id:"fiveforks", name:"Five Forks"...}` roster row and campaign-chain references;
- `data/logistics-rail.json` has the existing lowercase route `fiveforks` labeled `South Side Railroad pressure` with E-theater friction `{US:8, CS:18}`.

The new tactical id is camel-case `fiveForks` and the new data filename is hyphenated `five-forks.json`. D380 must preserve the lowercase Classic and rail records byte-for-byte as separate layers. No attempt may rename, merge, delete, or repurpose them.

## 11. Planned-Only And Future Complete-Integration Baselines

### D379 planned-only baselines (must remain exact)

- registered tactical scenarios: **18**;
- battle files / total schema files: **18 / 48**;
- Army Register: **1170**;
- explicit flags / valid weather hints / Intel opening-scene coverage / media opening scenes: **18 / 18 / 18 / 18**;
- no-regression suite list: **123**;
- generated HTML md5: **`097eabeea06387e47bd819d125950f0d`**;
- no `data/five-forks.json`, no `tools/probe-five-forks.mjs`, no T1/T10/runtime integration, and no T3 `replaces` implementation.

The D379 plan probe fails if even one Five Forks runtime seam appears while the data file is absent.

### D380 future atomic integration contract

All surfaces arrive in one green runtime commit or the plan probe fails closed:

- `data/five-forks.json`, top-level key/id `fiveForks`, single-phase US attacker / CS defender, fog off, engaged anchors and coarse Inferred splits, terrain, teaching, codex, ranks, and the generic leader replacement record;
- `src/tactical/T3-officers.js` generic `replaces` implementation plus `tools/probe-officers.mjs` generic relief tests; no battle-name branch;
- `src/tactical/T1-bull-run.js` exact registry line and `fiveForks:85` after Nashville;
- tactical scenarios **18 -> 19**;
- `tools/validate-data-schemas.mjs` battle enrollment and total schema files **48 -> 49**;
- `tools/probe-tactical-roster.mjs` and `tools/probe-custom-battle-builder.mjs` historical baselines include `fiveForks`; roster treats it as single-phase and includes `fldScnBtn_fiveForks`;
- Army Register **`1170 + (unique Five Forks side-unit ids × 3)`**, with every whole-registry pin moved and documented in the same commit;
- `src/tactical/T10-flags.js` explicit Five Forks metadata **`E / true / anv`** (Eastern, AotP badges enabled, ANV-family Confederate flag) and `tools/probe-flags.mjs` semantic/coverage teeth;
- flags/weather/Intel/media coverage **18 -> 19**; late-afternoon presentation; any sky value stays `Inferred` unless newly sourced;
- `tools/probe-five-forks.mjs` focused browser/runtime guard enrolled in `tools/vet-no-regression.mjs`; suite **123 -> 124** and sweep comment **18 -> 19**;
- generated `civil_war_generals.html` rebuilt only through `node tools/build.mjs`;
- frozen lowercase Classic/rail `fiveforks` layers unchanged;
- no new tactical Appomattox/surrender data or registration.

## 12. Plan Probe Contract

`tools/probe-five-forks-plan.mjs` is filesystem-first, dual-mode, and fail-closed. It writes `tools/shots/probe-five-forks-plan.json`, exits nonzero on failure, prints exactly one 12-step summary, and reports each failed step on stderr.

The twelve steps, in this exact order, are:

1. `SPEC SHAPE`
2. `SOURCES + STRENGTH`
3. `TERRAIN`
4. `COMMAND EVENT`
5. `RANKS + ABSENCES`
6. `HISTORY + DIGNITY`
7. `D74 NO-FUDGE`
8. `DIRECTION LAW`
9. `CLASSIC/RAIL COLLISION`
10. `PLANNED-ONLY BASELINES`
11. `FUTURE COMPLETE-INTEGRATION CONTRACT`
12. `LANE`

When the runtime data file is absent, the probe requires every D379 count/hash and rejects any partial runtime seam. When the runtime data file is present, it requires the complete 19/49/`1170+3U`/19/124 integration plus the shared T3/officer-test/focused-runtime contract. Half-registration is always red.

## 13. D379 Negative Bind And Focused Gate

After the clean plan probe passes:

1. record md5 for this spec and generated HTML;
2. change only the exact line `Griffin April 1 rank — Brig. Gen. (brevet Maj. Gen.); never a firm Maj. Gen. of Volunteers on April 1.` to a firm `Maj. Gen.` rendering;
3. run `node tools/probe-five-forks-plan.mjs` and require exit 1 with exactly `RANKS + ABSENCES` red (11/12 green);
4. restore the line with `apply_patch`;
5. require the spec md5 to match exactly;
6. rebuild and require generated HTML md5 `097eabeea06387e47bd819d125950f0d`;
7. rerun the plan probe 12/12 green.

Harden only the rank tooth if the tamper fails too broadly or does not bite. Do not weaken any unrelated tooth.

Set `TMPDIR="$PWD/.tmp"` and run serially:

```bash
node --check tools/probe-five-forks-plan.mjs
node tools/build.mjs
node tools/validate-data-schemas.mjs
node tools/probe-battle-build-research.mjs
node tools/probe-five-forks-plan.mjs
node tools/probe-cross-keys-port-republic-plan.mjs
node tools/probe-cross-keys-port-republic.mjs 2>/dev/null
node tools/probe-tactical-roster.mjs 2>/dev/null
node tools/probe-custom-battle-builder.mjs 2>/dev/null
node tools/vet-no-regression.mjs --list
git diff --check
```

Require build `GATE OK`; generated HTML md5 unchanged; schema 48/48; research 15/15; Five Forks plan 12/12; Cross Keys plan 11/11; Cross Keys runtime 15/15 with zero pageerrors; roster 8/8 with 18 scenarios; builder 15/15 with 18 scenarios; suite list 123; every produced JSON/HTML artifact parsed and read; no failed step or recursive pageerror. Do not run `npm run vet:noreg`.

## 14. D380 Runtime Gate Contract

D380 starts only from the clean pushed D379 contract and a new LANE-003 DRIVE takeover. At minimum it runs, serially and with full artifact readback:

- `node --check` on T3 and every new/touched JS/MJS file, including preparse of any cooked browser strings;
- `node tools/build.mjs`;
- `node tools/validate-data-schemas.mjs`;
- `node tools/probe-battle-build-research.mjs`;
- `node tools/probe-five-forks-plan.mjs`;
- `node tools/probe-officers.mjs`;
- `node tools/probe-five-forks.mjs`;
- `node tools/probe-tactical-roster.mjs`;
- `node tools/probe-custom-battle-builder.mjs`;
- `node tools/probe-loot-survival.mjs`;
- `node tools/probe-flags.mjs`;
- `node tools/probe-weather.mjs`;
- `node tools/probe-intel-uhd617-profile.mjs`;
- `node tools/probe-media-budget.mjs`;
- `node tools/vet-no-regression.mjs --list`;
- 1-3 directly adjacent current battle/officer probes selected from the final diff;
- both generic-replacement and Five Forks negative binds, with byte-identical restores;
- `git diff --check`.

After playable Five Forks is green, the full serialized `npm run vet:noreg` release battery becomes due. Nothing runs concurrently with it on the 8 GB Mac.

## 15. D379 Completion Criteria

D379 is green when this spec and `tools/probe-five-forks-plan.mjs` pass 12/12; the Griffin bind makes exactly one step red and restores byte-identically; every required focused artifact is read; the 18/48/1170/18/123 baselines and generated HTML md5 remain exact; canonical docs record the approved generic command seam and the D380 runtime boundary; LANE-003 returns to CONTRACT/unowned; the final D379 commit is pushed; and no Five Forks runtime surface or T3 implementation has started.
