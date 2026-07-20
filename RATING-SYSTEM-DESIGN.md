# RATING-SYSTEM-DESIGN.md — the OVR / "Madden layer" (D94, design-captured)

**Status:** DESIGN CAPTURED + BUILD AUTHORIZED 2026-06-21. Aaron reviewed the design and locked four choices (AskUserQuestion):
1. **Build the full system NOW** — R-0→R-4 reprioritized *ahead of* Chattanooga (pulls the D93 substrate forward from "after C+E").
2. **X-Factor feel = DRAMATIC Madden surge** — visible glow + announcement + a strong swing, *still hard-capped under `CMD_BONUS_CAP (0.9)`* by construction (the cap, not the feel, is the no-fudge wall).
3. **Negatives = VERIFIED + plainly named** — name the documented flaw directly when ≥2 sources support it (Bragg "Piecemeal Commitment", McClellan "The Slows"); the anti-Lost-Cause citation rigor applies to flaws as much as virtues.
4. **Tier scale = A–F report-card** — **A+ / A / B / C / D / F** (A+ = the ≥90 "Legendary" club). **No gaming "S" tier.** Neutral 64 = "C".

This is the rating substrate for the **D93 "The Soldier's Story"** pillar (originally scheduled after the C+E roadmap; pulled forward by choice 1 above).

**Provenance:** lead-architect synthesis of a 3-lens design workflow (5 agents: 1 survey + 3 independent design lenses + 1 judged synthesis), verified against the live engine. Builds on **D74** (one universal combat model, no per-battle fudge), **D92** (accurate-inputs principle), **D93** (the Soldier's Story pillar). See **DECISIONS D94**.

**The one-line thesis:** the OVR is a **read-out, not a force** — a documented persona is *derived* into true attributes (skill, weapon, cohesion, fate…), those attributes *seed* the levers the engine already reads, and the **D74 universal model produces the outcome**. No rating is ever read at the moment a casualty, melee, rout, or victory is computed.

**Proposal scoring (the workflow's judged panel, 1-5):**

| Proposal | Madden-feel | No-fudge | History | Implementable | Scalable |
|---|---|---|---|---|---|
| A — madden-faithful | **5** | 4 | 4 | 4 | 4 |
| B — sim-accurate-input | 3 | **5** | **5** | **5** | 4 |
| C — prosopography-data-first | 3 | 4 | **5** | 4 | **5** |

**Chosen spine:** **B** (engine spine + unification + the global stacking cap) · **C** (the per-person data record + `fldDerivePerson` + lazy materialization for thousands at runtime-cheap) · **A** (the Star/Superstar/X-Factor rungs + "in the zone" + the Legendary band) — A's amplification routed **through B's capped `cmdBonus`/`sev.*` path** so the spectacle can never escape the no-fudge wall.

---

<!-- The full architect synthesis follows verbatim. -->

## 1. Overview, design pillars, and the proposal scoring

**What this is.** A unified **1–100 OVR** rating system layered over three entity tiers — the **individual** (the D93 prosopography person), the **officer/leader** (command entity), and the **brigade** (the combat token). It is an *accurate-input* layer: a documented historical persona is derived into true attributes, those attributes seed the levers the engine already reads, and the universal combat model (D74) produces the outcome. **The rating is never read at resolve-time to force a result.**

**Design pillars (locked):**
1. **The OVR *number* is a read-out; the *attributes* it summarizes fully drive the fight.** Ratings decide casualties and winners — strongly — by seeding better `xp`, `quality`→`cmdBonus`, `weapon`, `radius`, `fate`, `cohesion`, and bounded `sev.*` *once, at build/preset-apply*, after which the normal combat model runs on them. The strong unit wins *emergently* (and can still be out-played). The only thing forbidden is a handler that writes the casualty count / winner **directly** from a rating at resolution time (the scripted hack). `fldResolveFire`/`fldResolveMelee`/`fldMoraleStep` keep reading the same fields — the rating changes what those fields are *seeded to*, not the formula. (D74.)
2. **One spine, anchored at 64.** A person/unit with no rating data computes to ~64 / `quality 0.55` / authored `xp` → **byte-identical to Classic**. The rating extends `_cmdGenRating`/`commandLeadership`; it does not run a parallel scale.
3. **Flaws rate as honestly as virtues.** Bragg, Burnside, McClellan, green levies get real negative badges with real mechanical bite (dampers, never enemy-buffs). `aggression` is excluded from the OVR roll-up so recklessness never inflates the headline number. (Anti-Lost-Cause.)
4. **Data-first, runtime-cheap.** The substrate is JSON the engine reads; thousands of people live as flat data; a brigade carries **one** aggregate number; individual rows are materialized lazily on inspect/play-as. (D93 / D68.)
5. **Madden soul, D74 wall.** Star / Superstar / X-Factor rungs and an "in the zone" activation give the feel; every magnitude is routed through a capped existing lever so the spectacle can never escape the no-fudge boundary.

**Chosen spine and why.** **Lens B is the engine spine** — it has the cleanest D74-safe wiring (one `fldBadgeFactor(u,lever)` hook returning identity when `__FIELD.badges` is absent), the tightest unification (persona → `skill` at the *front* of the existing pipe, zero downstream edits), and the only **global per-unit per-lever stacking cap** in the set (the anti-fudge guard A and C both miss). **Lens C supplies the data substrate** — the per-person JSON record, the `fldDerivePerson` pipeline (`RANK_BASE`/`BRANCH_TILT`/`YEAR_DRIFT` + *deterministic seeded jitter, not runtime RNG*), and the decisive **lazy-materialization** rule (one `menMeanOVR` per token; per-person rows built only when inspected/played) — the only proposal that genuinely answers "thousands at runtime-cheap," plus its calibration-oracle insight (lock the derivation table against the 9 shipped scenarios' authored `quality`/`xp`). **Lens A supplies the Madden layer** — the three rungs, the X-Factor "in the zone" activation, the `Legendary` 90+ club, `abZap`/HUD glow — but its X-Factor amplification is routed **through B's capped `cmdBonus`/`sev.*` path** so the doubling can never write a casualty or breach `CMD_BONUS_CAP (0.9)`.

---

## 2. The unified attribute model (3 tiers, 0–100 internally, anchored at 64)

Every attribute is **0–100, neutral at 64** (matching `commandLeadership`'s anchor and `_cmdGenRating`'s 64-fallback), each carrying a provenance tag `{v:"Verified"|"Inferred"|"Disputed", src:[…]}`. Untagged ⇒ 64 ⇒ no-op.

### Tier 1 — INDIVIDUAL (the `person` record, D93 substrate)
The atomic prosopography row. It does **not** touch the sim directly; it *rolls up* into an officer card or contributes to a brigade's aggregate.

| Attr | Meaning | Eventually feeds (via roll-up) |
|---|---|---|
| `tactical` | grasp of ground & maneuver | officer `skill` seed; `commandMarginEdge` |
| `command` | ability to move/coordinate a force (latent in a private until promotion) | officer `skill` seed; activates the officer tier on promotion |
| `resolve` | tenacity / refusal to break | unit morale resilience (rally proxy) |
| `discipline` | drill, order-keeping, march rate | unit `xp`/cohesion seed; `skill` seed |
| `marks` | marksmanship / fire discipline | unit `xp` fire weight |
| `vigor` | stamina / march endurance | fatigue resistance; Foot-Cavalry seam |
| `charisma` | inspirational lift on the men | officer `radius`/`quality` magnitude |
| `aggression` *(bidirectional)* | propensity to press — **excluded from OVR roll-up** | `commandMarginEdge`; badges; fate exposure |
| `grit` | personal exposure/durability | officer `fate` |
| `gunnery` *(optional, null for most)* | artillery competence | `_canisterScale` seam |

Plus `role` (`general`/`officer`/`nco`/`private`/`civilian`), `personaTags[]` (the badge/derivation keys), `flaws[]` (documented negatives → negative badges), `badges[]`, `fate`, `sources[]`, and display fields (`bio/voice/strength/weakness/portrait/team`).

### Tier 2 — OFFICER / LEADER (a person holding a command billet)
**Not a new entity** — a `person` with `command ≥ threshold` plus a `radius`. It is exactly the shipped `fldMakeOfficer` shape, now *derived* not hand-typed:

| Existing officer field | Derived from person attrs |
|---|---|
| `quality` (0–1, → `cmdBonus`) | `skill` seed mapped through the existing `(lead-42)/46` clamp |
| `radius` (yd, aura range, 175–280 band) | `charisma` + `command` |
| `fate` (>0, durability) | `grit` + `resolve` (Bee 0.42 … Jackson 3.2) |
| `_canisterScale` (artillery officers only) | `gunnery` |

### Tier 3 — BRIGADE (the combat token, one marker per D68)
The brigade has **no independent personality and no stored OVR field**. Its OVR is **computed** from its men + materiel + attached officer — the anti-fudge guarantee: you cannot hand a token a "win" number, only better men, a better colonel, and better rifles.

| Component | Source (existing field) |
|---|---|
| `manQuality` | mean of the men's `resolve/marks/discipline` — or, when no per-man data, the authored `xp` mapped up: `64 + (xp-2)*8` |
| `materiel` | `weapon` profile (`pow`/`rng` from `fldWeaponProfile`) + `guns` + `ammo` start |
| `condition` | live `morale/maxMor`, `fatigue` |
| `leadership` | the attached officer's contribution via **live `cmdBonus`** (0 when no officer in radius — never stored) |

**How a brigade's OVR composes from its men + officer:** `manQuality` (the dominant axis) sets the floor; `materiel`+`condition` adjust it; the officer adds a small visible halo to the *displayed* OVR (and mechanically lifts the brigade **only** through the live `cmdBonus` aura — the shipped path). A brilliant colonel cannot paper over green troops with empty rifles: the floor is the men's `xp`+`weapon`. The OVR *rises when the general rides up and falls when he dies* — emergent, visible, never stored. Only **two pure-data fields** are added to a unit: `cohesion` (0–100, drill/pride; defaults from `xp`) and `legend` (an optional unit-badge key, e.g. `iron_brigade`); both default to a no-op.

---

## 3. OVR formula per tier + bands

All three OVRs are computed at the data layer, **displayed**, and (officer/brigade) used to derive the sim seed **once**. Never re-read mid-sim.

**Individual OVR** (transparent combat-weighted mean; `aggression` deliberately absent):
```
OVR_ind = round( 0.28*tactical + 0.22*command + 0.18*resolve
               + 0.16*discipline + 0.10*marks + 0.06*charisma )
  + branchBonus: + max(0,(gunnery-64)*0.1) if person.marksFor == unit.arm
```

**Officer OVR — IS `_cmdGenRating`, by construction** (so the leader card and the Command desk can never disagree):
```
skill_seed = round( 0.45*command + 0.35*tactical + 0.20*discipline )   // persona -> the existing `skill` field
OVR_off    = 0.55*skill_seed + 0.45*reputation                         // identical shape to _cmdGenRating L189
```
`reputation` is the evolving campaign value (`cmdOnResolve`: decisive win +6, win +3, draw −1, loss −4, decisive loss −8) — so winning battles literally levels up a general's OVR (the Madden dev-trait progression, already half-built).

**Brigade OVR** (computed, displayed on the token tooltip; `leadership` reads live `cmdBonus`):
```
OVR_brg = round( 0.42*manQuality + 0.25*materiel + 0.18*condition + 0.15*leadership )
          + officerHalo (0..6, capped)
```

**Bands — REUSE `_cmdLeadWord` verbatim, add exactly ONE top band (`Legendary ≥90 = A+`).** The letter grade (A+/A/B/C/D/F) is a thin overlay on the existing five words so both surfaces say the same thing about the same man. A neutral 64 unit lands in **Steady / "C"** (the 64-anchor compatibility requirement):

**A–F report-card scale (Aaron-locked — no gaming "S" tier).** A+ is the elite "Legendary" club; the five existing `_cmdLeadWord` words map onto A/B/C/D/F; neutral 64 lands in **C / Steady**:

| Letter | OVR | Word | Color (shipped hex) | Notes |
|---|---|---|---|---|
| **A+** | ≥ 90 | **Legendary** *(new band)* | `#2f5130` (darker than Masterful) | the elite club — documented merit only (anti-inflation review, §11.1) |
| **A** | 82–89 | **Masterful** | `#4a6b3a` | existing |
| **B** | 70–81 | **Able** | `#6f9e5a` | existing |
| **C** | 58–69 | **Steady** | `#b8863b` | **64-anchor lands here** |
| **D** | 48–57 | **Uneven** | `#c9712e` | negative-trait tier |
| **F** | < 48 | **Faltering** | `#9c3b2e` | negative-trait tier |

Triple-encoded everywhere: **number + word + letter-grade (A+/A/B/C/D/F)**, color decorative only (see §10).

---

## 4. The BADGE / ABILITY system

**Rung structure (Lens A's three rungs, on Lens B's hook):**
- **Star** (common): a single small *static* attribute nudge — always on, resolves to a *seed* at build (cheap).
- **Superstar** (named figures): a larger *conditional* nudge, gated by a trigger the engine already observes (defending, flank, cover, morale state, casualties taken).
- **X-Factor** (the iconic moments): a Superstar badge with an **activation** — when its trigger fires it enters "in the zone": the magnitude amplifies for a bounded window, with a one-shot `fldAnnounce` ("abZap") + HUD glow. **An X-Factor may ONLY raise `cmdBonus` toward `CMD_BONUS_CAP (0.9)` or write a `sev.*` key inside its `FLDP.levers` band — it can never set a casualty or a winner.**

**Activation model (one guarded seam, two parts):**
- *Static/situational badges* resolve to **seeds** at build / a small additive delta via **`fldBadgeFactor(u, leverName)`** — returns identity (`1.0` for multiplicative levers, `0` for additive) when `__FIELD.badges` is absent. This is the only new combat read, inserted as a one-token factor at the existing `xpF`/melee/rally lines.
- *X-Factor amplification* is a per-tick flag on the unit (`u._xfActive`, default-undefined→1) that scales **only the already-summed `cmdBonus` aura**, which `fldMoraleStep` already clamps at `CMD_BONUS_CAP`. The fire/melee formulas never read `_xfActive` directly.
- **Global stacking cap (Lens B's guard, locked):** `fldBadgeFactor` caps the **summed** badge delta *per unit per lever* (e.g. total fire-badge delta ≤ +0.10; total `sev.*` write stays inside the documented band). So even "stack every positive badge in one brigade" cannot breach the realism intent.

### Badge catalog (20 — positives, X-Factors, and first-class negatives)

| # | Badge | Who/what | Rung | Trigger (engine-observable) | Exact lever fed | Magnitude (in-band) | Prov |
|---|---|---|---|---|---|---|---|
| 1 | **Foot Cavalry** | Jackson | X-Factor | inf in radius, `vigor`≥85, redeploy/march order | `fldMoveFactor` via new `u._spdMul` term | ×1.10, capped 1.15 | Verified |
| 2 | **Stonewall** | Jackson / Stonewall Bde | Superstar | defending on/near objective, under fire | `fate` ×1.3 + `quality` +0.08 (→`cmdBonus`) | within `quality` clamp | Verified |
| 3 | **Rock of Chickamauga** | G.H. Thomas | X-Factor | defending AND nearby morale <50 (last stand) | `_saveBase` via higher `cmdBonus` weight + local `sev.veteran`→1.2 | rout-save +0.06, in band | Verified |
| 4 | **Hancock the Superb** | Hancock | Superstar | friendly unit in radius routing; center sector | `cmdBonus` recovery term toward cap; `radius` +30 | within 175–280 band | Verified |
| 5 | **Stonewall of the West** | Cleburne | Superstar | defending in cover (`fldCoverAt`>0) | `quality` +0.07, `radius` +20, `fate` ×1.25 | in clamp | Verified |
| 6 | **First with the Most** | Forrest | X-Factor | `arm:cav`, flanking/rear facing | `aggression`→`commandMarginEdge` +1.5; charge-tick `cmdBonus`→cap | edge ≤ ±2 cap | Verified |
| 7 | **Gunner's Eye** | Henry Hunt / Alexander | Superstar | officer attached to `arm:'art'`, `gunnery`≥82 | `_canisterScale` ×1.10–1.15 | inside `sev.canister` 0.7–1.3 | Verified |
| 8 | **Bayonet!** | Chamberlain | X-Factor | inf, `ammo`<10 & defending | one-shot melee `cmdBonus`→cap window | capped at `CMD_BONUS_CAP` | Verified |
| 9 | **The Iron Brigade** | unit `legend` (black hats) | Superstar | inf, holding, casualties >40% | morale-loss `rally` divisor /1.15; `cohesion`→rally | in rally-proxy bounds | Verified |
| 10 | **Sharpshooters** | Berdan | Star | unit `marks`≥88 & `weapon:rifled` | fire `xpF` at ceiling | `xpF`→1.00 (the cap) | Verified |
| 11 | **Earned in Blood** | USCT @ New Market Hts | X-Factor | USCT brigade assaulting works, under canister | melee `xp` term + morale resilience (local `sev.veteran`) | `xp` melee +0.06 (0.9–1.08) | Verified |
| 12 | **Drillmaster** | Hardee / Upton | Star | any held unit in radius | `cohesion` +10 → rally proxy seam | ±0.06 at extremes | Verified |
| 13 | **Cavalier Screen / Eyes of the Army** | Stuart | Superstar | `arm:cav role:screen` present | local `sev.sight` ×1.08 (its *absence* at Gettysburg is the teaching) | inside 0.88–1.15 | Verified |
| 14 | **The Gray Ghost** | Mosby | Superstar | `arm:cav role:raid`, behind lines | local `sev.sight` ×1.12 + `_spdMul` ×1.1 | capped 1.15 | Inferred |
| — | **NEGATIVES (anti-Lost-Cause core)** | | | | | | |
| 15 | **Piecemeal Commitment** | Bragg | Superstar (−) | his command attacks, multi-unit | inverse `commandMarginEdge` −1.5 + `quality` −0.05 (staggered commit; **no enemy buff**) | edge inside ±2 | Verified |
| 16 | **Rigid Plan** | Burnside | Superstar (−) | attacking fortified ground | `quality` −0.06; suppresses replan; `skill`-derived `commandLeadership` −8 effect | within clamp | Verified |
| 17 | **The Slows** | McClellan | X-Factor (−) | his army on the offensive | `caution`→`commandMarginEdge` (drag) + `_spdMul` <1 (slow commit) | bounded; **no buff** | Verified |
| 18 | **Reckless Valor** | Hood | Superstar (±) | attacking | `aggression`→edge (can help) BUT `fate` ↓ (leader-fall risk) + higher self-exposure | bidirectional | Verified |
| 19 | **Green Levies** | any fresh regiment | Star (−) | the brigade token, first fire | seed `xp:0`, `cohesion`≤50, lower rout threshold | `xpF` 0.85 (existing green) | Inferred |
| 20 | **Broken at Shiloh / Powder-Shy** | surprised or conscript unit | Star (−) | `resolve`≤45 & surprised at launch / first volley | lower rout threshold; `morale` start ~55 → `morF` | in rally-proxy bounds | Inferred |

Every badge row stores `{key,label,kind,polarity,trigger,lever,magnitude,sources[],prov}`. The catalog **loader clamps each magnitude to the `FLDP.levers` band and logs any badge that tries to exceed it.** Negatives are *dampers/removals* only — never "the enemy takes more casualties."

**Citation sourcing (D103 — the R-6 catalog-wide provenance sweep, DONE):** every `Verified` badge now carries **≥2 independent real sources**, supplied by an adversarial citation research+verify workflow (15 Opus agents: per-domain finders → default-refute verifiers → a completeness critic; sources web-checked, zero fabrication found). Two judgment calls: **`beloved` is held *Inferred*** (its one solid cite is Symonds on Cleburne; the obvious Lee source — Freeman 1934 — is Lost-Cause-tinged and held out until a second non-hagiographic Lee cite is added), and **`grand_charge` is upgraded to *Verified*** (Stewart 1959 · Hess 2001 · Sears 2003). The negative badges on real men (`the_slows`/`rigid_plan`/`piecemeal`/`reckless_valor`) carry the firmest pairs (Sears+Rafuse, Marvel+O'Reilly, Cozzens+Daniel, McMurry+Sword). The **same sweep cleared every `Verified`-with-<2-source violation across the whole data catalog — 47 records in six files** (badges 13 · personas 2 · weapons 9 · artillery 9 · engineering 8 · terrain 1 · cabinet 5), and a new **build gate (`tools/build.mjs` 4e)** now FAILS the build if *any* `Verified` record anywhere in `data/*.json` carries <2 sources (matching by a trimmed/case-normalized stamp on either the `prov` or `provenance` key, so neither a whitespace/case variant nor an `Inferred`-masks-`Verified` pairing can erode it) — the citation-grade non-negotiable made un-erodable, mirroring the 4d no-fudge wall.

---

## 5. Persona → rating derivation

The bridge from documented history to numbers, applied data-first so thousands scale (Lens C's pipeline, with Lens B's provenance floor):

```
fldDerivePerson(record):
  1. AUTHORED where documented (named figures): use hand-set persona{} + sources. >=2 sources => Verified, else Inferred/Disputed.
  2. GENERATED where not (unnamed soldiers/regiments) from STRUCTURAL facts already in the data:
       base   = RANK_BASE[rank]              // Pvt 48, Sgt 54, Capt 60, Col 64, BrigGen 66, MajGen 68
       attr.* = base + BRANCH_TILT[branch] + YEAR_DRIFT(year)   // 1864 veterans drift up
              + seededJitter(pid, +/-6)       // DETERMINISTIC from a pid hash — NOT runtime RNG
       also derive from xp -> (resolve,marks,discipline) via 64+(xp-2)*8; weapon -> marks nudge;
       battle record (held/broke) -> resolve adjustment, tagged Inferred
  3. flaws[] -> assign NEGATIVE badges; badges[]/personaTags -> assign positive badges
  4. PROJECT to engine seeds (ONCE, at build) — named and generated flow through identical code:
       skill        = round(0.45*command + 0.35*tactical + 0.20*discipline)
       quality(0-1) = fldClamp((commandLeadership-42)/46, 0.18, 0.95)   // the EXISTING map, reused verbatim
       radius/fate/_canisterScale  from their attr composites
       unit.xp / cohesion          from man-attr bands
  5. provenance = authored ? Verified/Disputed : Inferred  (a derived axis pins to 64/Inferred — NEVER invents a HIGH number)
```

**Provenance gate (D92, structural):** a `personaTag`/axis contributes only with a `prov` tag; a number with no tag-with-source **cannot exist**, so fabrication is impossible by construction. Flaws are first-class — the system *must* be able to rate a man *below* 64 (Bragg, Burnside) and attach his negative badge. **Calibration oracle (Lens C, locked):** the `RANK_BASE`/weights/derivation table is regression-locked against the 9 shipped scenarios' existing hand-authored `quality`/`xp` — derived must reproduce authored within tolerance before any mass is generated (a miscalibrated table won't trip a gate; it silently skews battles).

---

## 6. ENGINE WIRING (the crux)

**Reads that already exist — DO NOT TOUCH.** `fldResolveFire` (`xpF`/`morF`/`fatF`/`ammoF`), `fldResolveMelee`, `fldMoraleStep` (`(u.cmdBonus||0)` terms). They keep reading the same fields; the rating only changes what those fields are *seeded to*.

| Attribute / badge | Existing lever OR new guarded seam | Where written | No-op-when-inactive guarantee |
|---|---|---|---|
| officer OVR → `quality` (0–1) | `fldMakeOfficer` reads `o.quality` (T3:120); propagates via `cmdBonus` (T0:454/461/473/478) | build | absent `o.quality` ⇒ existing `0.55` clamp ⇒ identical |
| `skill_seed` → `gen.skill` | `_cmdGenRating` (35:185) & `commandLeadership` (35:197) consume unchanged | build / appoint-pool | absent ⇒ `skill` default 64 ⇒ identical |
| `tactical`/`aggression`/`caution` | `commandMarginEdge` (35:222) — already wired | build | absent ⇒ 50 ⇒ edge 0 |
| `fate`/`grit` → `_fate` | `fldMakeOfficer` `_fate` seam (T3:132) | build | absent `o.fate` ⇒ `fateMul=1` ⇒ identical |
| `gunnery` → `_canisterScale` | T2 canister bridge (T2:109) `u._canisterScale`; `fldArtFireMult` (T5:102) | build/preset-apply | absent ⇒ scale 1 ⇒ identical |
| man-attrs → `xp` / `weapon` | `fldResolveFire` `xpF`, rally proxy, melee — already read | build | authored `xp` path unchanged |
| `cohesion` → rally proxy | **NEW guarded extension** in `fldMoraleStep`: `rally = 1 + xp*0.12*_vet + 0.06*coh*_vet` where `coh=(cohesion-50)/50` else `0` | build | `cohesion` absent ⇒ `coh=0` ⇒ byte-identical |
| any combat-lever badge | **NEW `fldBadgeFactor(u,lever)`** one-token factor at `xpF`/melee/rally lines; identity `1.0`/`0` when `__FIELD.badges` absent | per-tick (read), seeds at build | absent ⇒ identity ⇒ byte-identical (mirrors `(u.cmdBonus||0)`) |
| Foot-Cavalry / The Slows march | **NEW `u._spdMul`** term in `fldMoveFactor` (T0:179 already takes `u`): `f *= (u._spdMul||1)` | per-tick via badge | `undefined`⇒1 ⇒ byte-identical |
| X-Factor amplification | `u._xfActive` scales the **already-summed** `cmdBonus`; clamped at `CMD_BONUS_CAP` | per-tick | `undefined`⇒1; fire/melee never read it directly |
| Thomas/Stuart/USCT `sev.*` | written ONCE at `fldPresetsApply` post-step into `__FIELD.sev`, clamped to `FLDP.levers` band | preset-apply | stacks *multiplicatively* with B-5, never re-applied |

**Stacking with B-5 presets:** all `sev.*` rating writes happen at `fldPresetsApply` time so they compose multiplicatively with the difficulty bundle and stay inside the documented bands — never a second formula. The **summed badge delta per unit per lever is globally capped** so dense stacking can't breach realism intent.

**EXPLICIT no-fudge statement:** *No rating, attribute, badge, OVR, or X-Factor is ever read at the moment a casualty count, melee result, rout roll, or victory test is computed. The rating layer only sets inputs (`quality`/`xp`/`weapon`/`radius`/`fate`/`cohesion`/bounded `sev.*`) at build or preset-apply. No badge handler may write `cas`, `aCas`/`bCas`, the victory tally, `tgt.men`, or any `sev.*` outside its documented band — enforced by a build-gate assertion (§9), not a convention.*

**Naming:** `_cmd*` (strategic) / `fld*` (tactical) helpers; state on `C.president.command` (strategic) / `__FIELD.persons`/`__FIELD.badges`/`__FIELD.ratings` (tactical); bare-name globals only; no `window.*`; no literal comment-closer in a block comment.

---

## 7. Unification with the strategic layer (one spine)

The rating inserts **only at the front** of the existing pipe and reuses every downstream stage:

```
persona attributes --(§5 derivation)--> gen.skill --> _cmdGenRating(0.55*skill+0.45*rep)
                                                   --> commandLeadership(64-anchor blend, clamp 42-88)
                                                   --> fldOfficerSideQuality((lead-42)/46) --> leader.quality --> cmdBonus
```

- The officer OVR **is** `_cmdGenRating`'s output — same `0.55*skill + 0.45*reputation`, same 64 anchor, same 42–88 clamp. The rating's only job there is to *derive a documented `skill`* instead of a static authored one.
- `commandLeadership` stays THE strategic→tactical bridge; OVR feeds it, doesn't replace it. **No second bridge.**
- `reputation` evolution (`cmdOnResolve`) is unchanged and now visibly levels up a general's OVR per battle (dev-trait progression).
- **One vocabulary** (`_cmdLeadWord` + the five hexes + Legendary), **one palette**, every surface — they call the same function on the same number and cannot disagree. The A+/A/B/C/D/F grade is a glyph overlay, not a second scale.

---

## 7.5 Integration across ALL layers (Aaron directive: "integrated in all layers of the game")

The OVR is **one rating spine that surfaces and bites in every layer** — not a tactical-only feature. Because the spine *is* `commandLeadership`/`_cmdGenRating` (the value the strategic desk and all three battle modes already consume), full-layer integration is mostly *surfacing the existing number + routing the same badge effects through each layer's existing resolution*, never a parallel system.

| Layer | What the rating drives | Existing hook it rides | Increment |
|---|---|---|---|
| **Strategic — President's Desk / Command (S2)** | Appointment pool, cabinet, and command cards show each general's **OVR + grade + badges**; appointing a higher-OVR general visibly raises the army's projected strength. | `cmdRenderTab`/`_cmdGenRow`/`_cmdCardHTML` already print `_cmdGenRating`; add OVR grade + badge chips. `commandLeadership` already gates everything downstream. | R-1/R-2 |
| **Strategic — economy/production/manpower readouts** | Army-quality readouts (the War Effort overview) reflect the *mean* officer/brigade OVR of the force, so a well-officered army reads stronger. | `presProdBlock`/`presManpowerBlock` overviews; pull the force's mean OVR (computed, cached). | R-2 |
| **Auto-resolve battles** | A general's OVR + his command badges shift the **auto-resolve margin** (Bragg's "Piecemeal" and McClellan's "Slows" drag it; Hancock/Jackson lift it) — the same effect the real-time field would produce, so the three modes stay substitutable. | `bridgeResolveOutcome`/`bridgeAutoResolve`/`_arEnemyRating` already read `commandLeadership` + `commandMarginEdge`; add a capped `_cmdBadgeEdge(C)` term. | R-3 |
| **Classic hex battles** | The conditioned Classic army inherits **OVR-derived troop quality + officer effect** (a higher-rated force fights better in Classic too), via the existing conditioning anchor — never by editing the frozen base. | `86-battle-conditioning.js` (`_a6Condition`, the ±12% anchor) reads the rating-derived quality; `genForce` unchanged. | R-3 |
| **Real-time tactical (T0–T13)** | The full badge/X-Factor system — the dramatic surge, the situational triggers — through the §6 guarded seams. | `fldBadgeFactor`, `u._spdMul`, `u._xfActive`, `cmdBonus`, bounded `sev.*`. | R-3/R-4 |
| **Campaign progression** | Winning battles raises a general's `reputation` → raises his displayed OVR over the war (Madden dev-traits); losses lower it. Surfaced in the desk. | `cmdOnResolve` already moves `reputation`; OVR re-reads it. | R-6 |
| **Custom Battle Builder (C4)** | Authoring a scenario can set personas/badges; the builder shows the OVR of each unit/leader as you build. | `T11-custom-battle` validation + the OVR pure functions. | R-5 |
| **The D93 Soldier's Story / journey mode** | The per-person OVR + badges + career trajectory ARE the journey-mode character sheet; play-as-anyone starts from the person's real OVR. | the §8 person record + lazy materialization. | R-5 |

**The unifying guarantee across layers:** all three battle-resolution modes (auto-resolve · Classic · real-time) read the *same* rating-derived inputs, so a given army resolves consistently however you choose to fight — exactly the substitutability the Phase-A bridge (D62) established. The rating never forces an outcome in *any* layer; it only sets that layer's inputs.

---

## 8. The D93 per-person data record (JSON the system reads)

```jsonc
{
  "pid": "cs_jackson_tj",
  "name": "Thomas J. Jackson", "short": "Jackson", "fullName": "Thomas Jonathan Jackson",
  "side": "CS", "rank": "Lt. General", "branch": "inf",
  "born": 1824, "diedAt": "1863-05-10",        // null if survived the war
  "role": "general",                            // general|officer|nco|private|civilian
  "persona": {                                  // 0-100 documented traits — anchored at 64, the SOURCE of truth
    "tactical": 88, "command": 84, "resolve": 95, "discipline": 92,
    "marks": 70, "vigor": 90, "charisma": 70,
    "aggression": 90, "grit": 88, "gunnery": null,
    "marksFor": "inf"
  },
  "flaws": ["secretive-orders", "punishing-marches"],   // -> negative badges
  "personaTags": ["audacious_marcher", "iron_defense"], // -> attr deltas + positive badges
  "badges": ["foot_cavalry", "stonewall"],
  "fate": 3.2,                                  // existing seeded-fate multiplier
  "provenance": "Verified",                     // Verified | Inferred | Disputed
  "sources": ["Robertson 1997", "OR Ser.I Vol.XII"],
  "portrait": "jackson.jpg",
  "team": { "army": "ANV", "corps": "II Corps" }, // EA-style "team" (journey-mode hook)
  "bio": "...", "voice": "...", "strength": "...", "weakness": "...",
  // --- when this person holds a billet, the officer projection adds: ---
  "attach": "cs_2bde", "radius": 250, "atSec": null,
  "teach": "...", "teachReq": null, "teachAlt": ""
}
```
A **plain enlisted man** is the same schema, everything generated (§5 step 2), `name` synthesized, `provenance:"Inferred"`. **Scale rule:** generated masses are NOT instantiated as N rows at runtime — a brigade carries an aggregate `menMeanOVR` (one derived number from its rank-mix + `xp`); individual rows are **materialized lazily**, only for a person the player inspects or plays-as (D93). The mean is always *recomputable*, never the source of truth (so a future zoom-to-regiment becomes a roll-up of materialized rows, not a stored mean).

---

## 9. Build-increment plan (data-first; each independently vetted + byte-identical)

Each increment: `node tools/build.mjs` GATE OK → focused probe + FULL no-regression suite + `diag-classic` (Classic paints, `nonBlank:346`) + **0 pageerrors** → adversarial bug-hunt (every confirmed finding fixed) → commit → `git push origin main`.

| Inc | Scope | Probe assertions |
|---|---|---|
| **R-0 — Data spine (no engine change)** | `fldDerivePerson` + `RANK_BASE`/`BRANCH_TILT`/`YEAR_DRIFT` tables + `BADGE_DEFS` + the OVR pure functions + `persona`/`flaws`/`provenance` on Bull Run roster (Verified). | OVR computes; untagged ⇒ ~64; **build byte-identical**; **calibration oracle**: derived `quality`/`xp` reproduce the 9 scenarios' authored values within tolerance. |
| **R-1 — Officer derivation → existing pipe** | `skill_seed`→`gen.skill`; `quality`/`radius`/`fate`→`fldMakeOfficer`. Author the 9 hardened-roster (D92) commanders. | Appoint-pool words match history; field auras shift for rated, **byte-identical for unrated**; diag-classic green; 0 pageerrors. |
| **R-2 — OVR read-out UI** | OVR + word + letter on the Command desk + new unit-inspect line; reuse `_cmdLeadWord`/`_cmdTraitBar`. **Pure display.** | WCAG-AA contrast pass; CVD triple-encode (number+word+glyph); no sim change. |
| **R-3 — Badge engine (guarded seam) + stacking cap** | `fldBadgeFactor(u,lever)` + `u._spdMul` march seam + `cohesion` rally extension; ship Star/Superstar (Jackson #2, Iron Bde, Drillmaster, the negatives Bragg/Burnside/McClellan/Green/Powder-Shy). | **Badges-off byte-identical**; badges-on shifts bounded and *reversed by removing data*; **adversarial "stack every positive badge in one brigade" stays under the per-lever cap**; build-gate assertion: no badge handler writes `cas`/`aCas`/`bCas`/victory/`tgt.men` or `sev.*` out of band. |
| **R-4 — X-Factors** | `u._xfActive` activation (scales summed `cmdBonus`, capped at `CMD_BONUS_CAP`) + `abZap`/`fldAnnounce` + HUD glow; Foot Cavalry, Rock of Chickamauga, Bayonet!, First with the Most, Earned in Blood, The Slows. | **Deterministic seed-replay: badges-on final casualties differ from badges-off only within the bounded lever delta** (the no-fudge replay gate); X-Factor never exceeds `CMD_BONUS_CAP`; 0 pageerrors; profile per-tick cost on the 8 GB target. |
| **R-5 — D93 scale-out** | Bulk-derive individual rows; lazy materialization; latent-`command` promotion (play-as-anyone); the EA-style `team`/journey hook. | One mean per token (no N-row instantiation at runtime); inspect/play-as builds one row lazily; Inferred OVRs visually distinct from Verified. |
| **R-6 — Badge sweep (+ dev-traits)** | **[citation-provenance DONE — D103]** every `Verified` record ≥2 sources + build-gate 4e. **[ROSTER ASSIGNMENT DONE — D104]** 43 documented +/- badges assigned to all 9 battles via a central `data/ratings.json` `rosterBadges` map (the seam stamps via `fldBrSpec`→`fldMakeUnit`); accurate-inputs, never an output gate (D74/D92); anti-Lost-Cause CS 12 clear virtues:6 flaws:4 dual / US 11:10; a badge-chip HUD. **[LIVE DEV-TRAITS DONE — D105]** the Madden development arc: a hidden potential **ceiling**/**floor**/**rate**/**attritionDrag** per general (`data/ratings.json` `devTraits`: 12 archetypes × 20 assignments, Inferred + sourced) SHAPES the existing `cmdOnResolve` reputation evolution → `_cmdGenRating` → the displayed OVR; **byte-identical for an UNASSIGNED general** (clamp [5,98], rate 1, no drag); accurate-inputs never an output gate (build-gate 4d now scans `35-command.js`); anti-Lost-Cause (the Union elite are RISERS rated as high as Lee/Jackson; failures named both sides); a Command-desk "Career Arc" read-out. **R-6 is now feature-complete.** | **D104 vet:** byte-identity 30/30 off==HEAD + 0 winner-flips-against-history; all 9 per-battle probes green WITH badges on (Pickett still repulsed, Burnside still breaks, the Rock still holds); `probe-ratings` 21/21; bug-hunt 16-agent SAFE. **+ gate 4e (D103).** **D105 vet:** `probe-command` 34/34 (byte-identical-off across all 5 outcome quadrants + both clamp rails · rising-star-vs-plateau-ceiling · floor-cap · attrition-drag-bounded · no-output-gate · save-tamper · 4 trend branches); `probe-ratings` 21/21 (tactical untouched, byte-identical by construction); bug-hunt 29-agent SAFE (1 HIGH citation + 10 lower, all fixed); GATE OK no-fudge ✓ citations ✓; wcag AA. |

---

## 10. WCAG-AA / CVD-safe badge + tier UI

- **Triple-encode, color last.** Every tier/badge ships **number + word + letter-grade (A+/A/B/C/D/F)** as the primary channels; the `_cmdLeadWord` ramp (green→amber→orange→red) is *decorative only*. This is mandatory because that ramp is **not CVD-safe by hue alone** — deuteranopia/protanopia collapse green↔amber. The letter+word carry the meaning.
- **Contrast.** Text sits on the dark `--rule` ground already shipped in `_cmdTraitBar` (passes WCAG-AA ≥4.5:1 for normal text); the new `Legendary` `#2f5130` is darker than Masterful, so white/light text contrast is verified at UI time.
- **Badge chips** distinguish rung by **shape** (Star = small filled dot, Superstar = ring, X-Factor = diamond/glow) in addition to color, and polarity by an explicit `+`/`−` glyph (negatives never rely on red alone).
- **Provenance is surfaced** on the OVR: an `Inferred`/derived rating renders with a hatched/striped bar so the player never mistakes a generated number for a sourced one.

---

## 11. Open forks for Aaron (genuine design calls)

> **RESOLVED 2026-06-21 — see DECISIONS `D94-forks`; where this section's earlier recommendations differ, the resolved decision WINS:** soft-cap = realism-slider-scaled (§15.1 stands) · Legendary A+ = **pure merit, NO club cap** (anti-inflation via Verified sourcing, not a size gate) · political-general bind = **softer flavor cost** (capital surcharge + flavor, no election mechanic) · `cohesion` = a **required authored field** (derive-from-`xp` only as a safety fallback) · reputation→OVR dev-traits = **live in-campaign now** · GM transfers/commissions = **available from the start** · the 2 rank disputes (Heintzelman/Mansfield) = **resolve by the prevailing source + annotate** · night bar = **balance breadth + polish**.

The original surfaced forks (for the record):

1. **Legendary (S, ≥90) club gate & composition.** Confirm the ≥90 cutoff and *who* is allowed in the 90+ club. Make the "≥90 not >60% one side" balance review a **hard gate** or a **soft check**? (Anti-Lost-Cause inflation risk lives here.)
2. **X-Factor "in the zone" feel.** How big is the amplification window/multiplier? It stays under `CMD_BONUS_CAP 0.9` by construction, but the *feel* — a subtle stiffening vs a dramatic glowing surge — is the line between Madden spectacle and perceived fudge. **Aaron's taste call.**
3. **Headline-OVR honesty.** One number can't capture situational reality (Thomas is a "C" on offense, an "A" on a defensive ridge). Confirm we label the headline "general competence" and let situational badges carry context.
4. **The two genuinely-new magnitudes** (Foot-Cavalry `_spdMul`, Stuart/Mosby local `sev.sight`): confirm the caps (proposed `_spdMul ≤ 1.15`, `sev.sight ≤ 1.15`). The only seams without an existing documented unit-stat read.
5. **`cohesion`: new authorable field vs derive-from-`xp`.** Authorable = more expressive, more authoring burden across every scenario JSON. Derived = zero new authoring, less nuance.
6. **Reputation-driven OVR level-up scope.** Should winning battles visibly raise a general's OVR mid-campaign now (dev-traits, half-built in `cmdOnResolve`), or reserve that progression for the later D93 journey mode?
7. **Negative-badge attribution sensitivity.** "The Slows"/"Piecemeal Commitment"/"Rigid Plan" on real named men is historically defensible but pointed. Is the ≥2-source Verified bar sufficient cover, or should negatives carry a softer Disputed/contextual UI framing?

*Synthesis complete. R-0 alone is shippable value — the prosopography substrate D93 needs, with zero combat change.*

---

## 12. The Army GM layer — roster management, transfers & political clout (Aaron directive)

> *"Moving soldiers, commanders, officers, generals should actually matter to fighting and matchups — an army version of waiver/trading/transfer. Political clout as currency."*

**This already has a spine in the code.** `cmdAppoint`/`cmdRevert` already let the President appoint or relieve the *army* commander, spending **`C.clock.capital` (political capital)** scaled by `_cmdReliefCost` (relief-class base `easy 4 / costly 12 / very-costly 22` + a prestige surcharge for a popular general — the McClellan problem). The GM layer **generalizes that one billet into a full depth chart** and makes every assignment move the army's OVR (§2–3) → the battle (§6) → the matchup (§13). **Political capital is the currency** (no new resource).

### 12.1 The depth chart (billets)
A campaign army is a tree of **billets**: `Army → Corps → Division → Brigade`. Each billet holds one officer (a `person`, §8) or is **vacant** (vacancy = a competence penalty: a leaderless corps fights at a reduced effective OVR — the historical cost of the command-vacuum). Every billet shows its holder's **OVR + grade + badges** and the **roll-up OVR** of everything under it. This is the "roster screen."

> **[SUBSTRATE SHIPPED — D106]** the read-only **OOB-mapping substrate** is built — `src/tactical/T15-oob.js` (`fldCampaignOOB`/`fldOOBForSide`) maps the strategic next-battle (`_brgNextBattle`) to a STRUCTURED **commander → corps → brigade** tree for BOTH sides, each billet carrying its OVR/grade/strength/provenance (the T14 spine). Where a hand-built tactical scenario exists it reads the REAL brigade OOB (real commanders + authored provenance); else it DERIVES a deterministic Inferred tree (formation-labeled, **no fabricated officers** — D92/#4). Surfaced as a read-only **"Order of Battle — the Next Engagement"** board on the Command desk (`fldCampaignOOBHtml`) — the player EXACT, the enemy FUZZY (§15, scouting deepens it via the `reveal` tier). **Byte-identical (pure read, called only from `cmdRenderTab`; build-gate 4d scans T15).** This is the shared plumbing: the **MOVES** below (12.2) extend `cmdAppoint`/`cmdPromote` over this tree; **Q8b scouting** (15) tier-reveals the enemy via the board's `reveal` param **[SHIPPED — D107]**; a **symmetric AI-GM** drafts over the same roster.

### 12.2 The moves (each spends/earns political capital)

> **[SHIPPED — Q9 D102 (Promote) · Q10 D108 (the CORPS DEPTH-CHART: seat/reassign/vacate corps billets) · Q11 D109 (Commission) · Q12 D110 (the DIVISION sub-tier)]** The **army-commander** Appoint/Relieve is the original `cmdAppoint`/`cmdRevert` spine; **Promote** (Q9) raises a general one grade up the ladder for a bounded skill lift. **Q10** adds the CORPS depth chart: the President SEATS pool generals into the army's I–IV Corps billets (`cmd.corps`, `cmdSeatCorps`/`cmdVacateCorps`), spending `seatCost` political capital. Each seated corps commander adds a small BOUNDED lift to `commandLeadership` (`_cmdCorpsLift` = clamp(Σ(effRating−64)×perSlotWeight, ±liftCap)) — an INPUT, never the scoreboard; **byte-identical until a corps is seated** (lift 0; a vacant billet = 0, NOT a penalty). The grade-fit is **side-aware** (a US corps = Maj. Gen.; a CS corps = Lt. Gen.): a junior man leads `belowGrade` until Promoted (the Q9 synergy — on the shipped roster only CS Stuart). One corps per general; the army commander can't double-hold; `cmdInit` sanitizes the record on load. The seated commanders also NAME the player's derived corps on the D106 OOB board (pure display; the edge is unchanged). **Q11 (Commission, D109)** adds the "bring a new officer into the pool" row: the President COMMISSIONS the documented POLITICAL GENERALS (US Banks/Butler/Sigel/McClernand, CS Floyd/Pillow — a SEPARATE `data/generals.json` `sides[side].commissionPool`, **never the starting roster**) into the pool for `costPolitical` capital, after which they're appointable/promotable/seatable; `cmdCommission` writes only `cmd.commissioned`+capital+reputation. These are LOW combat OVR / HIGH political value (rank≠competence — a commissioned Banks fields leadership 49 vs Grant 87) — §12.3's command-politics bind made playable; capped by `maxCommissions` (3). Byte-identical until you commission (`_cmdRosterPlusCommissioned`===the bare roster when empty); the three GM moves gate on the commissioned set (`_cmdByIdRoster`+`cmdCommissioned`) so an un-commissioned officer can't sneak in. **Q12 (the DIVISION sub-tier, D110)** adds the next rung under each seated corps: `cmdSeatDivision`/`cmdVacateDivision` seat pool generals into 3 division billets per corps (`cmd.divisions`, a tree — a division is staffable only under a seated corps), spending `seatCost` capital; each adds a small BOUNDED `_cmdDivLift` = clamp(Σ(effRating−64)×0.03, ±2) — deliberately smaller than the corps lift (cap 2 vs 4) so the hierarchy holds (army ±17 > corps ±4 > division ±2). A division was a **Maj. Gen.'s** billet in BOTH armies, so a Brig. Gen. leads `belowGrade` until promoted (the Q9 synergy, both sides). Byte-identical until a division is seated; one billet per man; vacating a corps cascades at the READ layer (`_cmdDivClean`); `cmdInit` sanitizes on load. *(Provenance: the Q12 code was a Codex hand-off of interrupted Claude-Code work — sound + committed `7b64d2e` + pushed — closed out with the bug-hunt [5 finders + critic invariantsHold=TRUE; 1 LOW anti-Lost-Cause-balance fixed] + the doc trail; D110.)* **Still OPEN:** the §12.3 ELECTION-SUPPORT relief-bind for the political generals (needs the 1864-election state — pairs with the E victory/election work), cross-theater **Transfer** (needs authored `theater` fields in `generals.json`, all absent), and the symmetric **AI-GM** (⚠ [hard]).

> **[STATUS UPDATE — D113/D173]** The old "Still OPEN" sentence above is historical. D113 shipped the Union-only election-support relief-bind/readout for commissioned political generals. D173 shipped the first symmetric AI-GM shadow/readout: the enemy drafts an army commander plus bounded corps/division staff over its current roster and exposes Command/OOB readouts without save writes or scoreboard/output writes. Cross-theater **Transfer** remains blocked until `data/generals.json` has honest `theater` fields; deeper AI-GM outcome wiring remains a later no-fudge decision, not part of D173.

| Move | Effect | Cost (political capital) | Historical constraint |
|---|---|---|---|
| **Appoint / reassign** | put a pool officer into a billet | small if billet vacant; = `_cmdReliefCost(incumbent)` if it bumps someone | can't exceed the billet's rank ceiling without **Promote** first |
| **Relieve** | send an officer to the pool | `_cmdReliefCost` (existing; McClellan surcharge) | a **political general** (see 12.3) costs election support, not just capital |
| **Promote** | raise rank → higher `RANK_BASE` OVR + wider command `radius` + eligible for higher billets | scales with the leap; **gated on merit** (reputation/OVR) — promoting past merit costs extra + risks a reputation/jealousy hit | West Point **seniority**: leapfrogging a senior officer adds a friction cost |
| **Transfer** | move an officer between corps/armies/**theaters** (Grant brought East) | higher (cross-theater = dearer); the losing front feels the gap | finite simultaneous high commands |
| **Commission** | bring a new officer into the pool | cheap for a **political general** (low OVR, high political value); dear for a proven professional | political generals can't be freely relieved (12.3) |

### 12.3 The anti-gamey constraints (so you can't just stack five A+ generals — and it teaches the real command politics)
- **Political generals** (Banks, Butler, Sigel, McClernand): **low combat OVR, high political value** — keeping them delivers immigrant/faction support that feeds the **1864 election** (33-morale); relieving them *before* the election costs **election support**, not just capital. The real bind Lincoln lived.
- **Seniority & rank ceilings:** a brigade billet wants a Colonel/BG; you can't drop a Maj. Gen. there cheaply, nor put a Captain over a corps without promoting through the grades (each promotion = capital + merit gate). `RANK_BASE` is the floor of the billet.
- **Finite top commands** + **command friction:** some historical pairings carry a small malus (documented feuds), some a synergy (a trusted lieutenant under his chief). A few authored, the rest neutral.
- **Vacancy penalty:** an unfilled billet fights below grade — you can't strip officers to "bank" them.

### 12.4 How it reaches the fight (no new combat path)
A GM move only changes **which `person` seeds which billet's `quality`/`radius`/`fate`/badges** (§6). The army that takes the field — in **all three modes** (auto-resolve `_cmdBadgeEdge`, Classic conditioning, real-time auras) — is the depth chart you built. **Nothing new is read at resolve-time.** Putting Thomas (defensive A+) on the corps that will be assaulted, or Jackson (Foot Cavalry) on the flanking wing, *matters* — because OVR+badges feed the levers, the advantage **emerges**.

---

## 13. Matchups & the dual Attack/Defend OVR (resolves the §11.3 headline-honesty fork)

A single headline OVR lies about a man whose gift is one-sided (Thomas is a **C on offense, an A+ on a defended ridge**; Hood the reverse). So the system carries **two situational sub-OVRs** alongside the headline:

```
OVR_attack  = headline + attackTilt,   attackTilt  = round((aggression-64)*0.25 + attackBadgeBias)
OVR_defend  = headline + defendTilt,    defendTilt  = round((resolve-64)*0.20  + cover/hold-badge bias)
```
- The **headline OVR is labeled "general competence"** (a starting estimate); the Attack/Defend pair carries the situational truth. `aggression` — excluded from the headline by design — *is* what bends the Attack tilt, so recklessness shows up exactly where it should.
- **Pre-battle matchup screen** (Madden's matchup view): your corps/brigades vs the enemy's, each showing the *relevant* sub-OVR for its role in the coming fight (your attacking wing shows Attack OVR vs the enemy sector's Defend OVR). This is pure display over numbers that already feed the sim — it *reveals* the emergent edge, it doesn't create one.
- **Officer-unit FIT multiplier:** an officer commanding off-arm (a cavalryman over infantry) operates a little below his OVR; a gunner over a battery, above (`gunnery`→`_canisterScale`). A small, capped `fit` term on the seeded `quality`.

---

## 14. Scoring & weight recommendations (you asked — here's my take, with trade-offs)

**Keep (they're sound):** the officer skill_seed `0.45 command + 0.35 tactical + 0.20 discipline` (command should dominate a commander); `aggression` *out* of the headline; the brigade floor on `manQuality 0.42` (a great colonel can't paper over green troops with empty rifles).

**Change / add (my recommendations):**
1. **Adopt the dual Attack/Defend OVR (§13).** *Recommended.* It's the single highest-leverage change — it makes matchups meaningful, makes the GM layer a real decision, and fixes the headline-honesty problem. Low cost (pure derivation over existing attributes).
2. **Bump brigade `materiel` 0.25 → 0.28, trim `condition` 0.18 → 0.15.** So the **armory choices the player makes strategically** (buy Spencers) visibly move a brigade's OVR — rewarding the S1/Armory layer. Trade-off: weather/fatigue matters slightly less to the headline (it still fully drives the *sim*).
3. **Political-capital economy numbers (starting calibration, tune by playtest):** earn — decisive win **+8**, win **+4**, won 1864 election **+25**, favorable press turn **+1**; spend — the existing relief table, **Promote** = `(newRankBase − oldRankBase) × 1.5` (+`×2` if above merit), **cross-theater Transfer** +10, **Commission** professional 8 / political 2. A political general relieved pre-election also costs **−10 election support**. Keeps clout *scarce* so the depth chart is a real budget, not a shopping spree.
4. **`fit` + `friction` as small capped terms** (≤ ±0.06 on seeded quality), authored only where documented — they add texture without becoming a spreadsheet optimization.
5. **Legendary (A+) gate = soft review, not a hard cap** (re: §11.1) — let merit put a man at ≥90, but run the "not >60% one side" balance check at R-6 and surface it; a hard cap would force ahistorical deflation.
6. **Reputation→OVR live (dev-traits) ON in-campaign** (re: §11.6) — winning *should* visibly raise a general's OVR mid-war; it's the GM-layer feedback loop (your appointments earn their reputation). **[SHIPPED — D105]** the half-built `cmdOnResolve` reputation evolution is now SHAPED by a per-general Madden **dev-trait** (a hidden potential ceiling/floor + a development rate + an attrition drag — `data/ratings.json` `devTraits`, 12 archetypes × 20 Inferred+sourced assignments), surfaced as the Command-desk "Career Arc" read-out; byte-identical for an unassigned general; accurate-inputs, never an output gate (build-gate 4d scans `35-command.js`). See §9-R-6 + DECISIONS D105.

**Build placement:** the Army GM layer is a **strategic-desk increment** — it slots in at **R-2/R-3** (the depth-chart UI rides the existing Command tab; the moves extend `cmdAppoint`). The dual OVR is part of **R-0** (pure derivation). None of this changes the R-0 foundation — it's all read-outs and input-seeding over the same spine.

**Open forks (your call):** (a) how punishing should the political-general bind be — a *real* election cost (my rec, it teaches the history) or a softer flavor cost? (b) do transfers/commissions unlock from the start, or gate behind campaign progress (you earn the authority to reshape your army as the war escalates)? (c) clout as the *sole* currency, or also a "manpower/seniority" second axis for promotions?

---

## 15. Aaron's 30-answer elicitation (10 rounds) — LOCKED spec deltas

These answers refine §1–14. Where an answer changed the baseline, the new spec is the rule.

**Badge tiers — content (R1, all-of-the-above at every rung):**
- **Star** (common, always-on): drill & fundamentals · terrain & conditions · arm basics · veteran seasoning (incl. negative seasoning).
- **Superstar** (named, conditional): command auras · signature tactics · reputation effects (Feared/Beloved) · logistics & engineering specialties.
- **X-Factor** (rare, activated, DRAMATIC surge): historical signature moments · battle-turning surges (last-stand/breakthrough/grand-charge) · personal heroics · doomed/tragic double-edged (Pickett's Charge: a huge surge that can also break the unit).

**Attributes (R2):** **expand to ~15** — the §2 core ten **plus** `initiative`, `logistics`, `engineering`, `cavalry`, `artillery` (the arm/strategic sub-skills, for richer matchups). **Shared attribute set, weighted by level** (soldier leans marks/resolve/discipline; officer leans command/tactical/charisma; general adds the strategic skills below). **Visibility:** own army exact, **enemy fuzzy** (revealed by scouting).

**General-tier strategic skills (R4, all):** `operational maneuver` (campaign movement/timing) · `logistics & supply` (feeds S1) · `political savvy` (earns/preserves clout) · `grand-tactical coordination` (the anti-piecemeal). These are the general-level attributes the strategic layer reads.

**Brigade identity (R4, all):** `legend`/esprit (Iron Bde, Stonewall Bde) · ethnic/regional (Irish Bde, German XI Corps, **USCT spotlight**) · veteran `cohesion` (re-enlisted vs raw) · hard-luck/jinxed (lower rally — double-edged). The `legend` field (§2) carries these.

**Negatives (R4, all kinds, Verified+named):** command flaws (Piecemeal/Slows/Rigid/Quarrelsome) · personal vices (drink/insubordinate/glory-hunting/sick) · unit frailties (green/mutinous/disease/demoralized) · political-general drag.

**The between-battle camp loop (R3 — NEW subsystems):**
- **Drilling = practice:** each camp turn, pick a drill focus (musketry / maneuver / entrenching / endurance) for a **concordant** skill+`cohesion` gain, **or delegate** to the officer for auto-sim gains (the Treasury/Cabinet delegate pattern). Over-drilling risks fatigue.
- **Scouting = simmable:** an auto-simmable scouting phase (Madden draft/practice-scouting), **tiered by recon quality** — scales with your `cavalry` rating: light → strength + fuzzy grade; better → named badges + posture; great → the enemy OOB. **[SHIPPED — D107]** the between-battle cavalry **reconnaissance** is built on the D106 OOB board: an "Order a reconnaissance" control on the Command desk spends political capital (`C.clock.capital`, the existing GM currency) to tier-reveal the enemy OOB via `fldCampaignOOBHtml`'s `reveal` param, scaled by the **appointed army commander's persona `cavalry`** — light (unscouted) → better (cavalry < 65: named commander + per-corps grade + posture/terrain advisory) → full (cavalry ≥ 65: the complete enemy OOB). The WRITE (`cmdScout`) lives in `35-command.js` (writes only `cmd.scout` + capital, keyed to the next-battle id so intel is fresh per engagement); T15 stays a pure read-out (the new `_fldOOBSideScouted` "better"-tier renderer + `_fldScoutPosture`, honoring `C.flipAtk`). **Byte-identical combat** (no combat path reads `cmd.scout`); teaches cavalry-as-the-army's-eyes (Stuart's rides; the Gettysburg intelligence vacuum). See DECISIONS D107. **[FIRST AI-GM SHADOW SHIPPED — D173]** the enemy command shadow now names enemy army/corps commanders in the OOB readout; consuming those helper values in outcomes remains a later [hard] no-fudge decision.
- **Progression:** attributes grow from **combat XP + drilling**, each entity has a hidden **potential ceiling** (Madden dev-trait), and **decline** with heavy attrition/casualties/age. Reputation→OVR is live in-campaign.

**The Army GM layer (R5/R7 — maximal franchise economy):**
- **Transfer scope = full war-wide free-agency pool** — draw/trade any historical figure into your army (alt-history dream-teams allowed) — *balanced by* a **symmetric AI GM** (the opponent drafts/promotes too — an arms race) + **difficulty scaling** (harder B-5 tiers = sharper AI rosters, never extra strength) + the clout cost + historical anchors (figures cost more to pull off their real side/theater).
- **Promotion = all paths:** merit (reputation/OVR) · political capital · seniority (pay to leapfrog) · **field brevet on an X-Factor heroic**.
- **Officer casualties:** killed = **permanent** (promote a successor from the depth chart) · wounded = out-then-returns (the existing fate system).
- **Currency = FULL multi-currency:** **political capital** (primary) + **seniority/manpower points** (promotions) + **supply** (large transfers). Earned from **all** sources (battles · 1864 election/home-front will · press/decisions · diplomacy/strategy). Under **pressure** from **factional demands** (Congress/press/governors demand an appointment or a relief) + **event shocks** (scandals/defeats/elections swing it). A tense budget, not a shopping spree.

**Matchups (R6):** **dual Attack/Defend OVR** (§13) confirmed. The pre-battle **matchup screen** shows all of: corps-vs-corps OVR board · players-to-watch duels · a labeled predicted-edge bar · terrain/posture advisories. **Counters are emergent**, surfaced as scouting advice (never hard RPS).

**Presentation (R8):** roster = a **period "Army Register" broadsheet**. In-battle badges surface **all four ways**: HUD chips (selected unit) · X-Factor banner + glow · floating proc text · a marker grade/badge glyph. **Portraits = initials/rank placeholders now**, PD photos in the Phase-H pass.

**Data scope & rigor (R9):** **full prosopography is the target** (every identifiable individual) — built via per-army research workflows (named figures hand-authored) over a generated substrate (deterministic rank/unit/year + hand-authored standouts + real muster-roll names in a later pass). **Strict provenance: 2+ sources = Verified**, derived = Inferred, flaws meet the same bar, never invent a high number (D92 rigor).

**Build order (R10):** **OVR ratings + badges in battle ship FIRST** (R-0→R-4), then the GM/roster+clout layer and the camp loop. Confirms the increment plan (§9).

### 15.1 THE SOFT-CAP RECONCILIATION (R10 — the one place I'm interpreting your choice to protect the non-negotiable)

You chose **"soften the cap for power-fantasy."** Taken literally against "no-fudge," that collides with the project's hardest rule (D74/D92: ratings never force an outcome) and with this design's keystone. Here is how I'm honoring your choice **without** breaking the wall — and why it's actually better than either extreme:

- **Ratings fully decide casualties and winners — through the inputs, never by overriding the result.** A high-OVR unit wins and bleeds less because its *seeded inputs* (`xp`, `quality`→`cmdBonus`, `weapon`, `cohesion`, morale resilience) are better and the normal fight runs on them — the strong unit dominates *emergently*, and can still lose if flanked or out-played. What is forbidden (the "output wall") is the narrow act of a badge/rating handler writing `cas`/`aCas`/`bCas`/`tgt.men`/the victory tally **directly** at resolution time — the scripted "higher rating ⇒ +20% enemy casualties / auto-win" hack. That is an architectural invariant (build-gate-asserted, §9): it would turn the simulation into a cutscene, make wins feel unearned, and kill the teaching. **The rating reaches the casualty count and the winner every time — via the soldiers' stats, not via editing the scoreboard.**
- **The INPUT caps soften — and scale with the existing B-5 realism slider.** The "power-fantasy" lives entirely at the *input* layer: a stacked elite / dream-team / dramatic X-Factor can push effective `cmdBonus`, badge deltas, and `sev.*` **well past the historical-realism band** — so it *feels* dominant — but those are still **inputs the sim consumes**, never outputs it's handed. Concretely: **`CMD_BONUS_CAP` and the per-lever badge cap become realism-scaled** — **Arcade = generous/dramatic (your power-fantasy)**, **Balanced = moderate**, **Historian = the tight historical wall** (the simulation-honest mode the D92 teaching depends on). The slider that the whole Engineering Corps and presets already read now also sets how hard the rating layer can push.
- **Net:** you get the dramatic, dream-team power-fantasy at the default/Arcade feel; the historian still gets the honest wall; and *no outcome is ever scripted or forced* at any setting. The dramatic feel comes from a **generous input cap, not an absent output wall.** (If you want it even louder than Arcade allows, that's a one-number tuning, not an architecture change.)

*If you'd rather the cap soften regardless of realism setting (a flat higher ceiling at all difficulties), say so — but I'd recommend the slider-scaled version so Historian mode stays the citation-grade teaching tool the project is built around.*

### 16. R-7 + THE COVERAGE SWEEP (D481/D482 — LANE-017 slices 4-5, 2026-07-20)

**R-7 — per-situation gating of the R-3 static triggers (the D104 deferred-log refinement, SHIPPED D481).**
`_fldBadgeTrig` now gates every situational static trigger on engine-observable, deterministic,
seed-replayable state instead of defaulting always-on:

| trigger | predicate (engine-observable) |
|---|---|
| `defend_objective` | NOT committed to an attack (`order.type` not charge/move) |
| `last_stand_defend` (static path) | ALWAYS-ON — the D481 adjudication-9 EXCEPTION, logged: gating it flickered under mid-hold reposition orders and broke probe-chickamauga's sourced P2 tooth (Thomas >=7/8 fell to 6/8); the situational last-stand layer is the R-4 X-Factor surge, unchanged |
| `first_fire` | unbloodied: `men >= 0.92 × maxMen` |
| `surprised` | the opening minutes: `__FIELD.t < 300` |
| `his_attack` / `his_offensive` / `usct_assault` / `march_vigor` (static path) | committed to the advance (move/charge order) |
| `ammo_low_defend` (static path) | `ammo < 12` and not charging |
| `attack_fortified` | committed AND the order target is fortified ground — a fort circle (`fldInFort`) OR within ~45yd of a `terrain.walls` segment (the Fredericksburg stone-wall / Vicksburg works idiom) |

**THE ABSENT-STATE LAW:** each predicate gates only on OBSERVED disqualifying state; a unit with no
live order/men/clock (deploy phase, synthetic fixtures, Custom Battle inline badges) keeps the
historical always-on TRUE — every pre-R-7 pure-function baseline is unchanged, and in battle (where
units always carry orders) the gating is real. Caps are untouched; gated triggers get NO cap
exemption (probe-ratings' D481 gated-stack tooth). The X-Factor ACTIVATION zone (`_fldXFactorInZone`,
strict: alive/not-routing/live morale+ammo) is unchanged — two consumers, one situation vocabulary,
different strictness. Evidence per adjudication 9: `tools/ab-badge-direction.mjs` (the D104 A/B sweep
modernized — 8 seeds × badges off/on per touched battle, zero-flips-against-history + per-carrier
activation sampling proving no gated badge is silently deactivated at its home battle).

**THE COVERAGE SWEEP (§4d.2) — rosterBadges + X-Factors from the original 9 battles to all 29
scenarios, with the per-row citation law made data.** New rows ship with a sibling
`data/ratings.json` `rosterBadgeProv` block — per (scenario, unit, badge) `{key, prov, sources[],
note}`: **Verified requires ≥2 named sources; Inferred/Disputed ≥1 and displayed as such** (the badge
card's "This assignment:" line, hover + SR + visible). The original 9 D104-workflow battles remain
documented in `_rosterNote` and carry no rows (probe-pinned exemption). Coverage floor, source floor,
orphan-record refusal, and majority-Verified are probe-ratings teeth (D481).

### 17. SOLDIER-TIER BADGES (D484 — LANE-017 slice 6, §4d.3, 2026-07-20)

**TWO badge sources, one capped lever wall, visually distinct always (the §10 provenance idiom is
the distinction).**

- **Historical-record badges** (`soldierBadgeDefs` class `historical`, assigned by
  `soldierBadges[pid]` rows): the documented service/valor of the Verified register soldiers
  (the D152/D421 replacement lane). Each assignment row carries the per-row citation law
  (the rosterBadgeProv idiom): **Verified requires ≥2 named sources drawn from the register
  record's OWN source list**, else Inferred/Disputed and displayed as such. **SOLID styling
  requires BOTH the row AND the carrying record Verified** — a Verified row on a non-Verified
  carrier, or an Inferred/Disputed row, renders hatched/dashed and says so (the Verified-only
  law; probe-loot-survival teeth + bind).
- **Career badges** (class `career`): earned through play, **DERIVED on read from the journey
  career log** (`cwCareerBadges` — battles / promotions / defeat-survived / wounded /
  war-ended). Nothing is ever stored: a legacy save is byte-identical, the D149 sanitizer
  shape is untouched, and `_SAVE_VER` stays 1. **ALWAYS hatched, labeled "Earned in play",
  never solid, never a Verified stamp** (probe-loot-survival + probe-war-career teeth + bind).
- **The lever law (D74):** every def's `fldLever` uses the EXISTING badge-lever vocabulary
  (fire/rally/speed/melee/none) and any consumer must route through **`fldSoldierBadgeFactor`**,
  which clamps the summed per-lever delta at the SAME `fldRatingRealismCap` `badgeLever` wall
  as `fldBadgeFactor` — **no new lever class**. No unit is stamped with these keys and no
  combat line consumes them in D484 (presentation + the capped gateway only; sim inputs did
  not move, so no A/B battery was owed).
- **Surfaces:** the Army Register detail card and the journey panel (`_ssSoldierBadgesHTML`)
  — chips carry the rung glyph tinted by the ONE rarity language (`cwRungTierInfo`), the
  provenance accent bar (solid/hatched/dashed), the prov word, and hover/SR source text.
- **Adjudicated drops (single-source floor):** Sherman's Bull Run crossing, Webb's Medal of
  Honor (ships `command_at_the_crisis` instead), Howard, Griffin. Beaty's `medal_of_honor`
  rests on two distinct CMOHS documents (same institution — flagged in the row note). The
  MoH cluster is US-only because the Confederacy had no equivalent decoration — an asymmetry
  of the record, not of authoring; CS strengths ship where sourced and the memorial rows
  carry both sides. Full note: the `data/ratings.json` `_soldierBadgeNote`.
