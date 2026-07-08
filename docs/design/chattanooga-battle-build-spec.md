# Chattanooga Battle-Build Spec (D325)

**Status:** D325 planning/spec + probe scaffold. This is durable repo state replacing the old `.tmp/chattanooga-design.md` scratch note. It is not an implementation and does not add `data/chattanooga.json`, a registry line, a menu button, or generated HTML behavior.

**Task shape:** build Chattanooga as the next unlocked Western battle lane after D324, but only after the source/OOB substrate is clean. D325 locks the intended scope, known source traps, acceptance gates, and future probe teeth so D326 can implement without inventing units, ranks, strengths, terrain, quotations, or combat exceptions.

## Scope

**Battle:** Chattanooga / Battles for Chattanooga, November 23-25, 1863.

**Playable shape:** a three-phase T8 multi-phase scenario, matching the Vicksburg and Chickamauga precedent:

- **P0 - Orchard Knob, November 23:** Thomas's Army of the Cumberland turns a reconnaissance/review into a real attack and seizes the Confederate forward rifle pits and Orchard Knob. Intended direction: US attacker seizes.
- **P1 - Lookout Mountain, November 24:** Hooker's composite force crosses Lookout Creek and clears the Cravens-house bench in fog/low cloud. Intended direction: US attacker seizes, but casualties stay light by Civil War standards and the fighting stays below the palisade, not on the summit.
- **P2 - Missionary Ridge, November 25:** Thomas's four center divisions take the base rifle pits, then surge up the ridge and break Bragg's center. Intended direction: US attacker seizes decisively. This is the **scoreWeight 3** phase.

**Top-level roles:** `attacker:"US"` / `defender:"CS"` across all phases. Chattanooga is the reversal of Chickamauga: the besieged Union armies take the offensive and break Bragg's siege line.

**Optional modeled nuance:** Tunnel Hill / Cleburne should be carried at least as a teaching card and end-note beat. It may become a fourth playable phase only if the D326 source pass proves the extra phase can be authored without crowding or weakening the three-phase reversal arc. Default recommendation: keep Cleburne/Tunnel Hill and Ringgold Gap as source-honest teaching and probe text in D326, not a fourth phase.

## Source Register

These are the minimum D326 source anchors. Use them before authoring data; add more if a rank, sector, strength, or terrain claim remains unsettled.

| Source | Use | Current confidence |
|---|---|---|
| NPS / National Park Civil War Series, "The Battles for Chattanooga" (`https://npshistory.com/publications/civil_war_series/9/sec7.htm`) | Campaign sequence, Confederate casualty/captured split, 40 guns, Ringgold consequence | Verified for campaign arc and casualty/capture direction |
| U.S. Army Space and Missile Defense Command staff ride PDF, *The Campaign for Chattanooga* (`https://www.smdc.army.mil/Portals/38/Documents/Publications/History/Staff%20Ride/LookoutBook.pdf`) | Orchard Knob, Lookout, Missionary Ridge, OOB tables, timeline, operational terrain | Verified for phase sequence and staff-ride OOB substrate |
| American Battlefield Trust, Chattanooga overview (`https://www.battlefields.org/learn/civil-war/battles/chattanooga`) | Date, outcome, strategic significance, broad casualties | Verified for overview; casualty total differs from NPS on CS total, so do not use it alone for captured/missing split |
| American Battlefield Trust, Lookout Mountain map page (`https://www.battlefields.org/learn/maps/chattanooga-lookout-mountain-nov-24-1863`) | Cracker Line precondition, Hooker's plan, Geary lead, Walthall/Moore, Cravens-house bench, fog | Verified for Lookout phase framing |
| NPS Missionary Ridge page (`https://www.nps.gov/chch/learn/historyculture/missionary-ridge.htm`) | Sherman/Tunnel Hill, 73rd Pennsylvania, Cleburne's hold, Ringgold Gap | Verified for north-end defensive success and Ringgold teaching |
| Existing repo `HISTORICAL-DATA-ECONOMY.md` rail/logistics section | Chattanooga relief rail movement and Cracker Line logistics context | Verified/Inferred as already tagged there |
| Existing `.tmp/chattanooga-factsheet.json` | Prior research scratch only; useful checklist of traps, not authority | Must be re-verified before any data claim ships |

## OOB And Rank Traps

Do not encode a unit, commander, rank, strength, or sector until it is verified against at least two reputable anchors or explicitly marked Inferred.

- **Grant:** Major General at Chattanooga. Do not backdate lieutenant general.
- **Sherman:** Major General; attacked Tunnel Hill and did not decide the battle.
- **Thomas:** Major General of Volunteers; his Army of the Cumberland supplies the center assault.
- **Hooker:** Major General; commands the composite Lookout/Rossville force.
- **Granger:** Major General; IV Corps.
- **Palmer:** Major General; XIV Corps parent for Baird/Johnson in the center assault.
- **Bragg:** full Confederate General; removed after the campaign.
- **Hardee:** Lieutenant General; Confederate right / Tunnel Hill sector.
- **Breckinridge:** Major General; center and left, not "right/center"; do not backdate lieutenant general.
- **Cleburne:** Major General; held Tunnel Hill and then Ringgold Gap.
- **J. Patton Anderson:** Brigadier General at the battle; do not backdate major general.
- **Bate:** Brigadier General at the battle; do not backdate major general.
- **John K. Jackson:** Brigadier General acting over Cheatham's Division where Cheatham was absent.
- **Osterhaus:** Brigadier General at Lookout; do not inflate.
- **Orchard Knob / Indian Hill:** treat Indian Hill as the old name for Orchard Knob, not a second objective or Sheridan seizure.
- **Lookout Mountain:** fighting happens on the bench around the Cravens house below the palisade; the summit itself is not the combat objective.
- **Missionary Ridge rupture:** do not assert Bate/Tyler as the first break without re-verification; the scratch factsheet flags Tucker's brigade/Bird's Mill Road as the likely rupture point.

## Landmarks

Minimum landmark set for D326 data:

- **Orchard Knob:** Fort Wood line, open plain, forward rifle pits/barricades, Orchard Knob summit, Missionary Ridge in view.
- **Lookout Mountain:** Lookout Creek crossing, Cravens house, bench/ledge, ravines/boulders, palisade/cliff, Walthall forward line, Moore main line.
- **Missionary Ridge:** base rifle pits, physical/topographic crest, military-crest blind-zone teaching, open western slope, Bird's Mill Road / center rupture point if verified, Tunnel Hill north end, Rossville Gap south end.

## Victory And Balance Intent

Use the universal combat model only. Outcomes must emerge from OOB, terrain, timing, doctrine, `scoreWeight`, and existing universal systems.

- Aggregate: US tactical victory in the majority, via weighted phase result.
- Score weights: P0 `1`, P1 `1`, P2 `3`; total `5`, matching Vicksburg/Chickamauga convention.
- P0: US seizes Orchard Knob in the majority.
- P1: US seizes Lookout Mountain bench in the majority; casualty magnitude remains modest.
- P2: US seizes Missionary Ridge in the majority and the aggregate turns on this phase.
- Alt-history: a CS player who holds Missionary Ridge should be able to overturn the battle; do not force a Union win.
- Casualty teaching: campaign totals should distinguish total losses from killed/wounded. NPS reports CS losses dominated by captured/missing; the D326 probe should guard that the authored note says the Confederate total-loss edge is a capture/rout signature, while Union killed/wounded were heavier.

## D74 No-Fudge Acceptance Gates

D326 implementation must not introduce any battle-specific damage, firepower, morale, casualty, or winner-writing keys. Forbidden examples include `damage`, `dmg`, `fireMult`, `fireMultiplier`, `casualtyMult`, `lossMult`, `killMult`, `fudge`, `powerMult`, or any Chattanooga-only combat switch.

Required D326 gates:

- `node tools/build.mjs`
- `node --check data/probe files touched where applicable`
- `node tools/probe-chattanooga.mjs`
- `node tools/probe-tactical-roster.mjs`
- `node tools/probe-custom-battle-builder.mjs`
- `node tools/probe-vicksburg.mjs`
- `node tools/probe-chickamauga.mjs`
- `git diff --check`

Browser/readback gates must inspect the JSON artifacts under `tools/shots/` and require `ok=true`, zero fail steps, and zero pageerrors. Do not weaken existing probes.

## Future Probe Teeth

When `data/chattanooga.json` is added:

- `tools/probe-chattanooga.mjs` must verify three named phases, US attacker / CS defender, score weights `1+1+3`, Orchard Knob / Lookout / Missionary Ridge landmarks, rank traps, Lookout bench-not-summit framing, Cleburne/Tunnel Hill teaching, universal gun model, no per-battle fudge keys, deterministic headless completion, phase-score/casualty carryover, and casualty/capture teaching direction.
- `tools/probe-tactical-roster.mjs` `EXPECTED`, menu order, and DOM button list must include `chattanooga`.
- `tools/probe-custom-battle-builder.mjs` historical-registry baseline must include `chattanooga`; this is the D86/D88/D90 recurring gotcha.
- `tools/probe-tactical-visuals.mjs` should add 2D/3D Chattanooga captures if D326 changes the public roster.
- A `tools/sweep-chattanooga.mjs` helper is recommended for balance watch rows before locking the probe thresholds.

## D325 Completion Criteria

D325 is green when this durable packet exists, the D325 plan probe passes, current registry probes remain green without Chattanooga registered, and live docs record that the next queued item is D326 Chattanooga playable implementation only after source/OOB verification.
