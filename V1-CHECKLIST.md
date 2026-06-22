# V1 FEATURE-COMPLETE CHECKLIST — "The Civil War"  (APPROVED — run-k Q&A, 2026-06-15)

**Purpose:** give "complete all project goals" a concrete, ordered target so autonomous runs can drive to a
content-complete v1 (still a perpetual project after — D54). Built from `MODERN-UGG-PLAN.md` (P0–P5),
`GRAND-STRATEGY-PLAN.md` (S2–S5), and the §8 charter systems. **Status: APPROVED** — all 12 forks across a
3-round Q&A are locked (recorded as DECISIONS **D61**). The phase order below is the roadmap for autonomous runs.

---

## OPERATING MODEL (LOCKED — run-k Q&A, 2026-06-15)
1. **Surface judgment calls.** Design/balance forks are surfaced for your approval BEFORE building; only
   mechanical/obvious continuations + the build-and-vet itself run autonomously. (Refines charter §8.3
   "decide & ship" — that applied to the all-night charter; you've now opted for design oversight.)
2. **Clear-then-continuous.** I clear a SCOPE's designs with you upfront, then execute the whole scope
   continuously (all-night style), pausing only at scope-end or when a NEW unforeseen fork appears.
3. **Per-milestone vetting + push** stays the same: GATE OK → focused probe + full no-regression + diag-classic
   + 0 pageerrors → adversarial bug-hunt (all fixed) → commit → `git push origin main`. Balance auto-tuned + logged.
4. **Content standard:** ≥2-source Verified (else Inferred), anti-Lost-Cause, period-but-tight voice.

---

## DONE SO FAR (shipped + pushed)
S0–S1 economy/production/blockade/manpower/victory · Battle layer A1–A6 (owner-mode war playable end-to-end) ·
S2 m1–m5 (cabinet, decisions, 3-layer morale + 1864 election, press, command/named-generals) · **Tactical
P0 sandbox · P1a First Bull Run · P1b-i fog · P1b-ii auto-pause · P1b-iii role-aware DEFENDER AI · PHASE A
connect-the-layers (A1 conditioning · A2 fight-from-bridge + FREE skirmish · A3 result feedback) · **Phase B
tactical depth COMPLETE** (B1 attacker AI · B2 officers/command · B3 in-battle logistics · B4 distinct arm roles · B5 difficulty/realism presets · B6 CS-player "command either side").**

---

## THE V1 CHECKLIST (proposed order — edit freely)

### Phase A — CONNECT THE TWO LAYERS  ‹✅ DONE — run k, 2026-06-15, DECISIONS D62›
- [x] **A1 Bridge conditioning into tactical:** the strategic-desk army (weapons bought, the 3 corps,
      general/leadership, morale, manpower strength) conditions the tactical battle's forces (strength /
      firepower / quality / morale / fatigue) — the owner-mode army you built actually fields in the real-time fight.
      *(`src/tactical/T2-campaign-link.js` `fldCampaignCondition`; 74-anchor ±12% identical to Classic/auto-resolve; re-arms from the loadout incl. reinforcements.)*
- [x] **A2 Tactical FREE mode:** a menu entry to launch a custom skirmish (pick side / forces / terrain) and
      to fight the Bull Run scenario from the bridge (not just the standalone demo).
      *("Fight in real time ⚔" on the bridge briefing; First Bull Run [US]→bullrun1 else a conditioned procedural fight; a "⚔ SKIRMISH" main-menu setup [side/size/ground/year/fog].)*
- [x] **A3 Result feedback loop:** the real-time battle outcome flows back into the campaign (casualties,
      ground, `enemyWill`) — substitutable for the existing Classic / auto-resolve result (MODERN-UGG §2).
      *(REAL casualty fractions from the fight → `startBattleRuntime`+`_arApplyCasualties`+`campaignAdvance`→`_t1Resolve`; win advances, loss recovers; deterministic. probe-campaign-link 16/16.)*

### Phase B — TACTICAL DEPTH  (P2–P5, real-time engine)  ‹✅ COMPLETE — B1 D64 · B2 D65 · B3 D66 · B4 D67 · B5 D70 · B6 D72 — run k, 2026-06-15/16›
- [x] **B1 Smarter ATTACKER AI** — defender-favored, fog aids the defender (LOCKED); attacker doctrinally
      sound (concentrate / assault) but the fog inversion tuned out. (Prototype exists: `ATTACKER-AI-PROPOSAL.md`.)
      *(`fldAiAttacker`: concentrate-on-weaker-flank / close / assault, GRADUAL per-unit commit [no knife-edge] + CAUTIOUS-WHEN-BLIND. Sweep: both-doctrines Bull Run fog-OFF CS 6/8, fog-ON 8/8 — fog aids the defender; def-cas 4592 vs the passive 1276. probe-ai 15/15.)*
- [x] **B2 Officers / command** — leaders with command radius + morale bonus, can be hit (ties named-generals). ‹✅ — run k, 2026-06-15, DECISIONS D65›
      *(`src/tactical/T3-officers.js`: a command AURA [faster recovery / rally / capped rout-resistance] + an exposure→wound→fall hazard with a one-time command shock; per-leader HISTORICAL fate + risk-decay + cover so army commanders survive [10/10] and only the real casualties [Bee/Bartow] are fall-prone; ties `bridgeArmy` leadership; the real Bull Run cast in `data/bullrun.json`. Officers-ON Bull Run CS 7/8 fog-OFF · 8/8 fog-ON. probe-officers 15/15; 6 baselines byte-identical.)*
- [x] **B3 In-battle logistics** — ammo + fatigue depth + supply. ‹✅ — run k, 2026-06-15, DECISIONS D66›
      *(`src/tactical/T4-logistics.js`: rear ammunition trains w/ finite reserve, disengaged-resupply, out-of-ammo→bayonet on the objective, exhaustion move penalty; attacker-far/defender-near train asymmetry. **Bug-hunt caught a fog inversion** [logistics-ON inverted fog-aids-defender, CS 8/8→0/8]; surfaced to Aaron → fixed by choking the ATTACKER's resupply under fog → balance-NEUTRAL both fog states [fog-OFF CS 5/8, fog-ON CS 8/8]. Ties strategic supply + raid. probe-logistics 14/14; 7 baselines byte-identical.)*
- [x] **B4 Distinct arm roles** — artillery (canister / long-range), cavalry (scout / flank / screen / raid). ‹✅ — run k, 2026-06-15, DECISIONS D67›
      *(`src/tactical/T5-arms.js`: canister spike vs cover-attenuation + long-range bombardment; the ASYMMETRIC battery doctrine [defender-safe / attacker-forward-and-catchable, the lost crest guns]; the ARM melee table [art 0.35 overrun, cav 1.4 shock / 0.9 braced]; cavalry scout/flank/screen/raid [raid drains the enemy B-3 train]; the Cannon-Corps→field-battery bridge [`_fldArtProfile`: Napoleon→canister, Whitworth→long-range]. **Vetting caught a real byte-identity bug** [the base.html `ARM` melee table was live, not undefined → fixed via a base-ARM fallback when arms off] and **surfaced a stacked-balance fork** [officers+logistics+arms made clear-weather AI-vs-AI Union-favoured; Aaron's call → **First Bull Run now DEFAULTS to fog ON**, the faithful battle where fog aids the defender → live CS 8/8]. arms-only fog-OFF CS 7/8. probe-arms 23/23; 8 baselines byte-identical.)*
- [x] **B5 Difficulty/realism presets** for the AI + sim depth. **Exposes the effectiveness/realism sliders the
      TACTICAL ENGINEERING CORPS effects will key off** (the Engineering Corps stays its OWN later milestone, D69 — B5
      ships the sliders + hooks, not the corps). ‹✅ — run k, 2026-06-16, DECISIONS D70›
      *(`src/tactical/T6-presets.js`: AI tier [Recruit/Regular/Veteran/Hardee] × realism bundle [Arcade/Balanced/Historian]
      + an Advanced per-lever expander, read at `fldInitSim` → `__FIELD.sev`{attrition·canister·supply·cmdShock·sight·veteran}
      + aiSkill/aiResolve/aiCushion → wires the existing B-1..B-4 knobs [mostly wiring, not new sim]. SMARTER-NOT-CHEATING,
      code-enforced: aiResolve ≤1 [never an enemy buff], the player cushion ONLY at a genuine Recruit, Hardee = sharper
      decisions not stat bonuses. **Balanced == today's shipped CS 8/8 SEED-FOR-SEED [byte-identical neutral].** Period-card
      "Command & Realism" picker + an in-battle "⚙ Settings" drawer; WCAG-AA, CVD-safe, reduceMotion, deterministic.
      Bug-hunt 76 agents → 13 confirmed + 6 critic gaps ALL fixed [drawer-Escape-tore-down-battle, picker ARIA, a
      malformed-preset clamp, the fog-scenario V-toggle wipe, …]. probe-presets 26/26; 9 baselines byte-identical.)*
- [x] **B6 CS-player tactical mode** ‹LOCKED: yes, Phase B› — command EITHER side in a battle (you defend as
      the CS, AI attacks). Makes the attacker AI (B1) player-facing. Doubles tactical replayability. ‹✅ — run k, 2026-06-16, DECISIONS D72›
      *(`src/tactical/T7-command-side.js` + seams in T0/T1/T3: `__FIELD.playerSide` authoritative [opts/skirmish/`_fldCamp().side`/US];
      the control layer + the render/HUD FOG VIEWER + the friend/foe line generalized from literal "US" to `fldPlayerSide()`; `fldBrSpec`
      flips the scenario AI flags by side [a CS player DEFENDS; attacker stays US → faces the B-1 AI]; a period side-choice card + side-aware
      briefing/objective/end-"you"-line + a player-home-edge 3D camera. **Vetting caught + fixed a CS-campaign officer/fog regression**
      [fldPlayerSide must resolve a CS campaign LIVE from G.campaign.side]; bug-hunt 52 agents → 11 confirmed + 7 critic gaps, the HIGH
      [skirmish-rematch soft-lock] + 3 MED [side-aware camera · fog-leak reinforcement cue · a render-fog probe gap] + LOW polish all fixed.
      Byte-identical for US; CS defense winnable 8/8 fog-ON; live stacked still CS 8/8. probe-csplayer 16/16; 10 baselines byte-identical.)*

### Phase C — TACTICAL BREADTH  (more real-time battles, data-driven)
- [x] **C1 Eastern marquee (COMPLETE):** ~~Fredericksburg~~ ✅ (D73). ~~Universal artillery gun model~~ ✅ (D75). ~~Antietam~~ ✅ (D76 — first multi-phase epic, bug-hunt later completed in repo history). ~~Gettysburg~~ ✅ (multi-phase Day 1/2/3 scenario present, probe-gettysburg 16/16 after the 2026-06-18 HUD/assertion refresh). ~~Chancellorsville~~ ✅ (Jackson's flank march, single-phase Fredericksburg/Shiloh pattern; data/chancellorsville.json + registry + menu rank 35; 2026-06-18). ~~Malvern Hill~~ ✅ (Seven Days artillery duel, single-phase gun-line defense; data/malvern-hill.json + registry/menu rank 18; probe-malvern-hill 24/24; 2026-06-18). Current roster/order/side-choice/launch contracts are guarded by `tools/probe-tactical-roster.mjs` (D80/D82).
- [~] **C2 Western** ‹LOCKED: Phase C, with breadth›: ~~Shiloh~~ ✅ (first Western theater battle, single-phase Fredericksburg-pattern scenario; probe-shiloh 29/29). ~~Vicksburg~~ ✅ (the river-fortress SIEGE as a 3-phase battle — Stockade Redan → Forlorn Hope → the Saps & the Mine; data/vicksburg.json + registry/menu rank 55; probe-vicksburg 18/18; the May assaults now cost the attacker, the siege wins, the city falls; D86). ~~Chickamauga~~ ✅ (the bloodiest Western battle as a 3-phase epic — the Woods [Sep 19, the line holds] → Longstreet's Breakthrough [Sep 20, the Brotherton gap, the decisive scoreWeight-3 phase] → the Rock of Chickamauga [Thomas holds Snodgrass Hill / Horseshoe Ridge]; top-level attacker=CS/defender=US; data/chickamauga.json + registry/menu rank 60; probe-chickamauga 18/18; aggregate CS 32/32 with the Wood-gap alt-history hinge + the costly-victory teaching; contingency-over-genius + squandered-victory anti-Lost-Cause frame; Harker corrected to Colonel by the bug-hunt; D90). Remaining: **Chattanooga** (the US-offensive reversal — Orchard Knob → Lookout Mountain → Missionary Ridge; design brief at `.tmp/chattanooga-design.md`), then Atlanta/the March, Franklin.
- [ ] **C3 USCT battles (1863–65):** the Crater, New Market Heights, Olustee, Nashville (the flagship teachable arc).
- [x] **C4 Custom-battle builder** (D54/D84): single-phase V1 tactical scenario authoring UI, validation, export/shareable JSON, import/round-trip, six local slots, explicit `custom_...` launch contract through `fldScenarioInit`, and focused/no-regression probes. Phase authoring remains deferred until a phase editor can be proven safely.

### Phase D — FULL HEX TACTICAL ENGINE  ‹⏸ DEFERRED TO v2 — D91 (the real-time engine is mature; a parallel hex engine is no longer a v1 requirement)›
- [ ] **D1** A complete parallel hex/turn-based tactical mode on the modern OOB/scenario data, selectable per
      battle alongside real-time. (Legacy "Classic" hex battles stay frozen; this is a NEW, data-driven hex layer.)
      ‹LOCKED: sits here, after tactical depth, so it duplicates onto a mature engine.›

### Phase E — STRATEGIC ARC COMPLETION  (S3–S5)  ‹▶ NEXT after C breadth — D91 (pulled ahead of the hex engine; the biggest content-thin pillar)›
- [ ] **E1 S3 alt-history:** tiered divergence + hinge forks + emergent toggle + the player-driven "your war
      vs history" tracker + divergence log (no thumb on the scale — D54).
- [ ] **E2 S4 education:** multi-axis codex + inline glossary + the full guided tutorial + play-style presets
      (President / General-Commander, + the Historian settings overlay — D39) + difficulty/realism sliders.
- [ ] **E3 S4 accessibility:** the dedicated FULL WCAG 2.2 AA pass + the 4 a11y modes (high-contrast, CVD-safe,
      SR turn/battle narration, dyslexia font) — your professional bar.
- [ ] **E4 S5 victory:** multiple honest paths incl. negotiated peace + the rich graded after-action report +
      the Reconstruction coda.

### Phase F — CONTENT SYSTEMS  (folded into the phase each best fits)
- [ ] Logistics/rail network · POW exchange-collapse · disease/medical · hard war · irregular war · the four
      under-told-perspective threads · flagship named units · CS finance toolkit · war-finance civics · a real
      diplomacy system · the human-cost-with-gravity treatment. (All from §8 D31–D41.)
- [ ] **Women in the war — soldier & relief threads (Aaron, run-k idea, 2026-06-15).** Add **female leads in the
      soldier-story rotation**, not only male: the women who enlisted **disguised as men** (est. several hundred —
      e.g. Sarah Rosetta Wakeman / "Pvt. Lyons Wakeman", Jennie Hodgers / "Albert Cashier" [served the whole war,
      drew a pension], Loreta Janeta Velázquez / "Harry T. Buford" on the CS side — frame the contested memoir as
      contested), and a **Clara Barton arc** (the "Angel of the Battlefield" → the Missing Soldiers Office → the
      American Red Cross). Neighbors: **Dr. Mary Edwards Walker** (the only woman awarded the Medal of Honor) and
      **Harriet Tubman** (scout/spy; the Combahee River Raid, 1863). Verified/anti-Lost-Cause; ties USCT (C3) +
      the human-cost treatment. ‹idea — implement when soldier-stories / the codex land; not B-4 scope›
- [x] **Tactical Engineering Corps — units, features & effects tied to the effectiveness/realism sliders (Aaron,
      run-k directive, 2026-06-15; "all of the above" locked 2026-06-20, D87) — ✅ COMPLETE (all 3 increments, D87–D89).** Built as `src/tactical/T13-engineering.js`
      in vetted increments. ~~Field entrenchments~~ ✅ (key E; dig-in → facing-aware parapet cover; reads the B-5
      realism slider Arcade ×1.43 / Balanced ×1.62 / Historian ×1.81; 2D+3D works; probe-engineering-corps 8/8;
      byte-identical, player-only; D87). ~~ABATIS / obstacles~~ ✅ (key **B** build / **X** clear; slow + once-per-crossing
      disorder + ragged fire; reads the B-5 realism slider; fog-gated 2D+3D; multi-phase-safe; player-only/byte-identical;
      probe-engineering-corps **15/15**; Mahan-sourced teaching card; bug-hunt 16 agents → 8 confirmed + 4 critic, all
      fixed; **D88**). ~~PONTOON bridging~~ ✅ (key **N** / "Pontoon"; an OPT-IN river terrain feature that gates movement —
      shallow ford [slow] / deep ford [needs a bridge above Arcade] / player-laid pontoon [fast]; the B-5 slider scales
      sapper speed, ford slow, AND fordable-vs-requires-pontoon; the strategic Engineer Works Corps `bridgeArmy.engineering`
      lays bridges faster [A1 anchor]; Skirmish "River crossing" ground; 2D water+boats / 3D water plane+pontoon; citation-grade
      Fredericksburg/James-River teaching card; player-only/byte-identical; probe-engineering-corps **22/22**; bug-hunt 19 agents →
      8 confirmed + 6 critic, all fixed; **D89**). Bull Run's creek stays cosmetic (activating a scenario creek as a live river is a
      documented future extension). AI river-pathing / AI-built works is the named T13 extension point.
      Extend the strategic **Engineer Works Corps** (`src/57-engineering.js`, D43;
      `bridgeArmy(C).engineering`) onto the real-time field as a distinct arm/role (the same gated-seam pattern
      B-4 used for art/cav): **pontoon bridges** (cross a creek/river — the Bull Run terrain already has
      Young's Branch / the Stone Bridge), **field fortifications / entrenchments** (raise cover on the objective),
      **abatis / obstacles** (slow an assault), **obstacle-clearing / road & railhead repair** (restore movement).
      **The "make it make sense" requirement: these effects must INTERACT with the B-5 effectiveness/realism
      sliders** — e.g. the realism preset scales how long entrenching takes, how much cover a parapet confers,
      whether pontoons are required to cross vs. fordable, sapper speed, and how the strategic engineering rating
      gates the field corps' size/quality (the A1-bridge anchor, like B-4 wired Cannon-Corps→battery). Surface a
      concrete design when B-5 / a tactical-engineering milestone is reached. ‹idea + B-5 wiring requirement›

### Phase G — THEATERS
- [ ] Eastern (largely done) → **Western** (same mechanics, new content — D40/D54). Naval/riverine/trans-Miss DEFERRED.

### Phase H — "MAKE IT COME TO LIFE"  (graphics/footage — LOCKED: AFTER gameplay-complete)
- [ ] **H1 PD images:** weapons / flags / USCT / scenes (have 131 portraits) via LoC + Internet Archive +
      Wikimedia, linked-assets + offline fallback. **Asset-ingestion (D71):** extend `tools/build.mjs` (Node, not a
      separate script) to Base64-embed + TIER/COMPRESS media w/ offline fallback so the single file stays portable as
      it grows (D68 #7). **Guardrail (D71):** no Phase-H media lib may require `SharedArrayBuffer` (COOP/COEP headers
      can't be set on GitHub Pages; `coi-serviceworker` is the shim if ever needed). PD imagery > AI art (aesthetic / IP / anachronism).
- [~] **H1b Brigade BADGES & INSIGNIA — the battle flags (Aaron, run-k idea, 2026-06-15).** Render each brigade's
      identity with its **battle flag / colors** on the unit badge: the various Confederate battle flags (ANV
      Southern Cross, Hardee/Polk Western patterns, the national flags), the U.S. national & regimental colors,
      and the **Army of the Potomac corps badges** (Kearny patch, the corps shapes/colors). Tasteful period
      engraving on the 2D/3D unit markers + the selected-brigade HUD; CVD-safe (shape + label, not flag-color
      alone); honor reduceMotion. Pairs with the B-4 arm markers (gun/limber + trooper) already shipped.
      ‹partial: `src/tactical/T10-flags.js` shipped unit flags/insignia; 2026-06-18 follow-up replaced the 3D SVG TextureLoader warning path with cached canvas-backed `CanvasTexture` maps and disposal hooks. `tools/probe-tactical-visuals.mjs` now fails on the known Three.js texture warning and passes with `textureWarnings:0`. Broader Phase-H visual polish remains open.›
- [ ] **H2 Reenactment footage** cutaways at key beats (skippable, offline→procedural fallback).
- [~] **H3 Richer 3D/animation** on the tactical engine (reuse run-h PBR/HDRI/post-FX); period broadsheet/engraving UI throughout.
      ‹partial: 2026-06-19 D85 adds a procedural 3D objective beacon to the live tactical engine and extends `tools/probe-tactical-visuals.mjs` to 8 captures with beacon-coordinate assertions. Broader H3 rendering/animation/readability work remains open.›
- [~] **H4 Richer audio** ‹LOCKED: Phase H›: PD period tunes + battlefield/camp soundscapes + UI cues, all
      accessible (toggles/captions/volume), default off. ‹partial: `src/tactical/T9-audio.js` / audio work exists in recent repo history; full Phase-H polish still pending.›

### Phase I — LOOT / SURVIVAL + "THE SOLDIER'S STORY"  ‹⭐ CORE PILLAR — D91 (loot) + D93 (the character/journey layer)›
- [ ] Standalone rarity-tiered loot + inventory (all modes) · light survival (rations/weather/forage/disease,
      default off) · the Oregon-Trail journey mode. All preset-gated (§27).
- [ ] **"The Soldier's Story" (D93, Aaron) — build AFTER the C+E roadmap; unified with the journey mode above.**
      An EA-Sports-style **prosopography DB** — *every identifiable individual* (granularity = exhaustive) with
      **bio, stats/ratings, character history, portrait, team (army→corps→division→brigade→regiment→company)** — +
      a **play-as-anyone whole-war mode**: pick any person, choose when+where to start, proceed from their **REAL
      rank/position**, then play forward into alt-history. Bottom-up build: (1) granular OOB + per-person/regiment
      **detail cards** (DATA, reuses teaching cards, NO engine change — brigades stay one marker per the D68
      zoom-deferral) → (2) codex **person/unit axis** (Phase E/S4) → (3) the **playthrough mode** (career/trajectory
      model + start-anywhere engine) → (4) **interpersonal/romance** (women-in-the-war / USCT / immigrant hooks;
      period-honest, anti-Lost-Cause). **Hard prereq: accurate rank+position+unit per person — the D92 roster
      hardening is its first roster data.** (Memory `civilwar-soldiers-story-pillar`; DECISIONS D93.)
- [~] **The RATING SYSTEM / "Madden layer" (D94) — the cross-cutting substrate this pillar is built on.** Design law: `RATING-SYSTEM-DESIGN.md`; increments R-0→R-6 (§9). Pulled AHEAD of Chattanooga (D94 fork 1). Shipped: **R-0** the data spine (`data/ratings.json` + `src/tactical/T14-ratings.js` pure fns + `tools/probe-ratings.mjs`; byte-identical) ✅; **R-1** officer derivation into the command + field pipes — persona→`gen.skill` (9 strategic-general personas, exact calibration) + persona→officer `quality`/`radius`/`fate` (explicit-`pid` opt-in, Bull Run cast) ✅ (D95); **R-2** the OVR read-out UI — A–F report-card grade on the Command desk (active card + appoint pool) + a tactical-HUD brigade-OVR line; pure display, byte-identical, WCAG-AA + CVD triple-encode ✅ (D96). Next: R-3 badge engine (the first rating→combat seam: guarded `fldBadgeFactor` + `_spdMul` + `cohesion`, global per-lever stacking cap, no-fudge build-gate assertion) → R-4 X-Factors → GM franchise layer (Q7) → camp loop (Q8) → R-5 prosopography scale-out → R-6 negative-badge sweep + live dev-traits. (DECISIONS D94/D95/D96.)

### Phase J — POLISH / META
- [ ] **Saves** ‹PROPOSED per D54›: localStorage + named slots + export/import; undo-last-turn on the accessible preset.
- [ ] Mod-friendly data + shareable saves/scenarios. **Hosting DEFERRED** (GitHub Pages on request — D54).
      **Publish options when wanted (D71):** GitHub Pages (simplest for one file) OR itch.io + Butler (best indie
      discovery + in-browser play + auto-deploy); Vercel unnecessary. **$0 nuance:** Pages on a PRIVATE repo needs
      GitHub Pro — for true $0 use a public deploy repo or itch.io; rename `civil_war_generals.html`→`index.html` at publish.
- [ ] **Full-campaign playthrough probe** added to the no-regression suite (D54).

---

## ITEMS NEEDING YOUR CONFIRM (the last clarifications)
1. **Phase ORDER** — is A→B→C→D→E→…→H→I→J right? In particular: **strategic S3–S5 (E) vs tactical breadth/hex
   (C/D)** — which first? And does the **full hex engine (D)** really sit after tactical depth, or sooner?
   **✅ RESOLVED (D91): new v1 order = C (finish Chattanooga + USCT) → E (strategic S3–S5) → F → G → H → I → J; the full hex engine (Phase D) is DEFERRED TO v2.**
2. **B6 CS-player tactical mode** — include in v1 (command either side)? Here in Phase B, or later? *(SHIPPED — D72.)*
3. **Western theater (C2)** — fold into tactical breadth as drafted, or its own later phase?
4. **Audio (H4)** — in the come-to-life pass as drafted, or sooner? *(NOTE: `T9-audio.js` already started it under D77, ahead of Phase H.)* **✅ RESOLVED (D91): CONTINUE INCREMENTALLY now — deepen audio a little per milestone, accessible + default-off.**
5. Anything **missing** from v1, or anything here you'd **cut** to v2?

### Open design tensions to resolve (ported from the retired MASTER-TASK-LIST, sourced to D68)
6. **Loot/survival (Phase I) — D68 vs D61 tension:** D68 elevated loot/survival to an always-on "core pillar" (progression + journey mode); D61 says DEFER to after core. Resolve which governs. **✅ RESOLVED (D91): CORE PILLAR now (D68 wins) — build standalone loot + inventory + light survival + the Oregon-Trail journey mode as a built pillar, no longer deferred.**
7. **Zoomable battle scale (D68):** brigades expanding into regiments on zoom — a new tactical-engine requirement beyond the current brigade abstraction; not yet designed. **✅ RESOLVED (D91): DEFER TO v2 — keep the brigade-per-marker abstraction for v1.**
8. **Heavy embedded media (D68):** bundling PD imagery/footage into the single-file deliverable — plan the Phase-H tier/compress pipeline so portability survives (ties H1 + the D71 asset-ingestion pipeline).
9. **Deferred tooling (D54):** the `src/` subsystem folder reorg (`src/strategy/` · `src/render/` etc. — `src/tactical/` already exists), perf presets + hotpath profiling for the Intel UHD-617 floor, and a reusable historical-data layer + in-game sources codex (ties E2).
