# Battle of Atlanta (July 22, 1864) — Battle-Build Spec

**Status:** D436 durable spec (LANE-010, D431/D432 overnight queue item 4; spec-first per the
battle-ladder convention). Runtime follows in the same D436 slice.
**Packet law:** `docs/design/battle-build-research/atlanta-march-battle-build-research.md`
(D327, verdict READY_FOR_SPEC for the lane) — its §4 rank traps, §5 landmarks, §6 teaching
framing, and §7 D74 risks are BINDING here. The packet ranks the Jul 22 battle "Med —
single-phase or T8 (2)" for shape; Aaron's D431 queue names it as the last locked Western
battle (the shipped `data/western-theater.json` promises `lockedScenarioIds:["atlanta"]`).
**Two-source spine (live-fetched 2026-07-18, both pages read this session):**
- American Battlefield Trust, Battle of Atlanta —
  https://www.battlefields.org/learn/civil-war/battles/atlanta : Jul 22 1864, Fulton County GA,
  Union victory; US 3,722 / CS 5,500 casualties; Hardee's 15-mile night march and late dawn
  attack; McPherson's death at 2:02 p.m.; Cleburne vs Leggett's division on the treeless
  hilltop; Cheatham overrunning the XV Corps line at the Troup Hurt House.
- Wikipedia, Battle of Atlanta — https://en.wikipedia.org/wiki/Battle_of_Atlanta : Jul 22 1864,
  Union victory; Army of the Tennessee 34,863 present vs CS 40,438; casualties US 3,722, CS
  5,000–5,500 (multi-source attribution); Hardee flank march + Wheeler toward Decatur +
  Cheatham on the front; McPherson shot on reconnaissance; Walker shot by a sharpshooter;
  Bald Hill hand-to-hand until after dark, "The Federals held the hill"; Cheatham's breakthrough
  at the Georgia railroad answered by twenty massed guns + Logan's XV Corps repulse; Sprague at
  Decatur; Wheeler recalled by Hood (packet: Hardee wing recalled thrice); siege continues.
- Ranks per the packet's fetch-confirmed register (Wikipedia John Bell Hood page): Hood was
  promoted **temporary full General Jul 18 1864** (never Senate-confirmed; reverted Lt. Gen.
  Jan 23 1865).

## 1. Shape

**T8 two-phase, top-level attacker = CS, defender = US.** Aggregate historical result: **US
victory** (both defensive stands hold; the siege of Atlanta continues — this battle does NOT
take the city; Jonesborough (Aug 31–Sep 1) severs the railroad and forces the Sep 2 fall).

- **Phase 1 — "Hardee Strikes the Refused Left" (~12:15 p.m.; scoreWeight 1).** Hardee's four
  divisions (Bate, Walker, Cleburne, Maney), at the end of the delayed 15-mile night march,
  strike the Union left/rear: Dodge's XVI Corps (Fuller, Sweeny) caught in echelon facing the
  gap, Blair's XVII Corps (Leggett, Giles A. Smith) on Bald Hill / Leggett's Hill. Objective =
  **Bald Hill (Leggett's Hill)**, US-held. McPherson falls at 2:02 p.m. (leader fate note);
  Walker falls to a sharpshooter (leader fate note). Historically the line refuses, bends, and
  HOLDS. Direction: CS loss > US loss.
- **Phase 2 — "The Georgia Railroad Breakthrough" (~3:30–4 p.m.; scoreWeight 3, decisive).**
  Cheatham's corps (Brown's division with Manigault's brigade leading, Clayton's division) with
  G. W. Smith's Georgia militia demonstrating, breaks the XV Corps line at the railroad cut /
  **Troup Hurt house**, capturing Degress's four-gun 20-pounder Parrott battery. Sherman masses
  ~**twenty guns** (Schofield's batteries) on the Confederates; Logan leads the XV Corps
  counterattack that retakes the line and the guns. Objective = **the Troup Hurt house line**,
  US-held; the CS surge is modeled by attacker mass + the works gap (a real breach that the
  defender must retake — the D90 grain honors it as a swing, not a scripted event). Direction:
  CS loss > US loss.
- scoreWeight logic [1, 3] sums 4 per the two-phase convention (packet main-loop correction:
  "total 5" is three-phase only).

## 2. Engaged-strength honesty (packet §4 caveat + §9)

The ABT "75,301 / 40,438" pair is Sherman's whole army group vs Hood's present-for-duty — NOT
this field. Encode the SECTOR: the Army of the Tennessee (34,863 present per Wikipedia) is the
defending army; Hardee's and Cheatham's attacking corps + militia come from the CS 40,438. All
committed per-division strengths are brigade/division-scale abstractions marked **Inferred**
inside those Verified army-present anchors; phase totals stay below the army anchors because
this is a sector fight (XV/XVI/XVII Corps on the field; IV/XIV/XX and Schofield's infantry are
NOT committed — Schofield contributes the massed guns only).

## 3. The rank wall (packet §4 — BINDING; no anachronistic grades)

- **Hood: "General (temporary), CSA"** from Jul 18 1864 — never "Lt. Gen." here, never
  Senate-confirmed full general as permanent; army commander, NOT on the tactical field line.
- **Sherman: Maj. Gen., USA**, commanding the Military Division of the Mississippi (overall;
  observer at the Howard House on this field — leader note, no higher grade back-dated).
- **McPherson: Maj. Gen., USA**, Army of the Tennessee — **killed 2:02 p.m.** (ABT). The
  highest-ranking Union officer killed in the war; dead-officer trap honored (he never appears
  after Jul 22).
- **Logan: Maj. Gen., USA** — XV Corps; **temporary** Army of the Tennessee command Jul 22 only
  (Howard takes permanent command ~Jul 27 — teaching note, not an OOB claim).
- **Hardee: Lt. Gen., CSA** (corps); **Cheatham: Maj. Gen., CSA** (corps, temporary command of
  Hood's old corps); **Cleburne: Maj. Gen., CSA**; **Walker: Maj. Gen., CSA — killed Jul 22**;
  **Bate: Maj. Gen., CSA**; **Maney: Brig. Gen., CSA** (commanding Cheatham's old division in
  Hardee's column); **Brown: Maj. Gen., CSA**; **Clayton: Maj. Gen., CSA**; **Manigault:
  Brig. Gen., CSA**; **G. W. Smith: Maj. Gen. (Georgia Militia)**; **Wheeler: Maj. Gen., CSA**
  (off-field at Decatur — teaching/endNote only, never an OOB unit here).
- **Dodge: Maj. Gen., USA** (XVI Corps — the "left wing"); **Blair: Maj. Gen., USA** (XVII);
  **Leggett: Brig. Gen., USA**; **Giles A. Smith: Brig. Gen., USA**; **Morgan L. Smith:
  Brig. Gen., USA** (XV division at the railroad); **Fuller: Brig. Gen., USA**; **Sweeny:
  Brig. Gen., USA**.
- CSA Lt-Gen anachronism check: Hardee's grade dates from Oct 1862 — clean.

## 4. Terrain and landmarks (packet §5)

Phase 1: **Bald Hill / Leggett's Hill** (the treeless hilltop — the objective), Flat Shoals
Road, the wooded approach ravines Hardee's columns emerged from, Sugar Creek valley. Phase 2:
the **Georgia Railroad** cut, the **Troup Hurt house** (the breach point — objective), the
railroad embankment works, the Howard House rise (Sherman's vantage, US rear), **Decatur**
named in teaching/endNote only (Wheeler vs Sprague's train guard). Direction of attack:
Hardee from the south/southeast into the refused left; Cheatham from the west — the game seats
one coherent CS home edge per phase with the objective on the US side (the engine's
one-axis grain; noted as GAME ABSTRACTION in the phase teaching).

## 5. D74 no-fudge law (packet §7)

- NO casualtyMult/lossMult/powerMult/winner gate anywhere. The CS-heavier loss direction must
  EMERGE from: US works/cover on the objectives, the massed-gun line in phase 2, attacker
  formations crossing open approach ground, true gun counts, and defender xp.
- The phase-2 breach is modeled STRUCTURALLY (a gap in the works at the railroad cut, attacker
  mass at the seam, the militia demonstration pinning the flank) — never a scripted capture.
- Hood's "must-fail" temptation rejected: a better-played CS assault may genuinely win the
  phase; the historical result is the par, not a rail.
- The forbidden-key families (`damage`, `dmg`, `fireMult`, `fireMultiplier`, `casualtyMult`,
  `lossMult`, `killMult`, `powerMult`, `fudge`) never appear in the scenario JSON.

## 6. Integration pin table (every site moves with the documented-history idiom)

| Site | From → To |
|---|---|
| `src/tactical/T1-bull-run.js` registry | + `R.atlanta` line (GAME_DATA.atlanta.atlanta) |
| `src/tactical/T1-bull-run.js` menu rank | + `atlanta: 71` (Jul 22 1864 — after kennesaw:70, before cedarCreek:72) |
| `src/tactical/T10-flags.js` `_FLD_BATTLE_META` | + `atlanta: { theater: "W", badges: false, csFlag: "hardee" }` (Army of Tennessee) |
| `tools/validate-data-schemas.mjs` | battle enrollment 55 → 56 |
| Army Register (probe-loot-survival ×2, probe-war-career ×2) | 1512 → 1512 + U×3 (U = unique atlanta side-unit ids) |
| scenario-count pins (probe-flags, probe-tactical-roster, probe-custom-battle-builder, probe-intel-uhd617-profile, probe-women-in-war-arc-plan, per-battle scenario/count pins, `data/media-budget.json`) | 24 → 25 |
| `tools/vet-no-regression.mjs` suite | 131 → 132 (+ probe-atlanta row) |
| `tools/probe-atlanta.mjs` | AUTHORED this slice (registry/OOB/rank/direction teeth; NOT run tonight — D431) |
| `data/western-theater.json` | currentArc + atlanta entry (scenarioId, playable-now, ≥2 sources); futureLocks drops the atlanta lock, gains the March-to-the-Sea campaign-treatment lock `lockedScenarioIds:["marchToTheSea"]` (campaign/teaching-only per packet §1 — non-empty futureLocks preserved for the schema rule; the D423 registry-truth tooth enforces the whole equation at audit) |

## 7. Probe teeth (authored into `tools/probe-atlanta.mjs`; the audit session runs them)

1. Registry: `fldScenarioRegistry().atlanta` present; menu rank 71 lands Jul 22 1864 after
   kennesaw and before cedarCreek; `_FLD_BATTLE_META.atlanta` = W/false/hardee.
2. Shape: phases.length 2; scoreWeights [1,3]; top-level attacker CS / defender US; defaultFog
   false; both phase objectives named ("Bald Hill"/"Leggett's Hill"; "Troup Hurt").
3. Rank wall: Hood string contains "General (temporary)"; McPherson "Maj. Gen." + a 2:02 note;
   NO "Johnston" on this field; Hardee "Lt. Gen."; Walker fate note present; Logan temporary
   command note present; no CS Lt. Gen. except Hardee.
4. Landmarks: "Bald Hill", "Leggett", "Troup Hurt", "Georgia Railroad", "Decatur" (teaching),
   "twenty" massed guns reference in phase 2.
5. Forbidden-key rejection: grep the scenario JSON for the D74 key families — zero hits.
6. Casualty-direction battery (AUDIT SESSION, 8 seeds/phase): phase 1 US holds ≥5/8 with CS
   losses > US; phase 2 US holds ≥5/8 with CS losses > US; aggregate winner US and CS total
   losses > US total. Direction only — never a count gate.
7. Sources: the battle object carries a `sources` register (≥2 distinct — the 4e-2 law) naming
   the two live-fetched pages + the D327 packet.
8. S44 cross-check: western-theater currentArc contains atlanta with scenarioId "atlanta";
   futureLocks lockedScenarioIds == ["marchToTheSea"]; the D423 registry-truth tooth equation
   (registry ∩ theater-W == currentArc ids; locked ids unregistered) holds with atlanta live.

## 8. Teaching spine (packet §6 — anti-Lost-Cause, in-file cards)

1. **McPherson at 2:02** — the army loses its commander on reconnaissance; Logan's one-day
   command; Howard ~Jul 27 (the packet's wrong-commander trap taught, not tripped).
2. **Hood attacks and bleeds his army** — the command failure named squarely (Davis fires
   Johnston Jul 17/18; the sorties cost ~11,000 in Hood's first 11 days and did not save
   Atlanta); Hood as neither caricature nor gallant myth.
3. **Bald Hill until dark** — hand-to-hand on the treeless hilltop; "The Federals held."
4. **The Troup Hurt breakthrough** — a REAL breach: Degress's Parrotts lost and retaken;
   twenty massed guns + Logan's counterattack; why a breach is not a victory.
5. **Atlanta and the 1864 election** — this battle did NOT take the city; the siege ground on
   until Jonesborough severed the Macon & Western and Atlanta fell Sep 2, reviving Lincoln's
   re-election and emancipation's political survival.
