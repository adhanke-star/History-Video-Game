# MASTER TASK LIST — The Civil War Video Game

**Last updated:** 2026-06-20
**Live head:** Vicksburg 3-phase siege finished + adversarially hardened (D86)
**Phases complete:** A ✅, B (B1–B6) ✅, C-1 Eastern marquee ✅, C-2 Western (Shiloh ✅, Vicksburg ✅)
**Phase in progress:** C (tactical breadth — Chickamauga/Chattanooga or C3 USCT next); next non-battle priority = Tactical Engineering Corps (Aaron directive)

---

## HOW TO USE

- Check off items as `- [x]` when completed
- Add notes in parentheses after the item
- This file is read by every new session for context
- The authoritative source for decisions is `DECISIONS.md`
- The V1 roadmap is `V1-CHECKLIST.md`

---

## 🔴 IMMEDIATE / UNFINISHED (open items from last session)

- [x] **Complete the Antietam bug-hunt (D76)** — The adversarial bug-hunt for the multi-phase Antietam milestone was launched but NOT completed before commit. Must finish: run the hunt, fix any confirmed findings, re-probe, re-commit. (Dossier complete ✅, all probes pass ✅)
- [x] **Phase C-1 Eastern marquee battles** — Malvern Hill is now complete and verified (data/malvern-hill.json + probe-malvern-hill 24/24). Eastern marquee C1 is complete.
- [x] **Custom-battle builder C4** — First-class single-phase tactical scenario builder with validation, JSON import/export, local slots, explicit custom-ID launch path, focused probe, and full regression gate (D84).
- [x] **D77-D84 leftover gate** — Codex audited the uncommitted lower-model/session leftovers, fixed one Gettysburg probe-output bug, vetted the C4/Malvern/Chancellorsville/custom-builder/visual/help work, and kept Blender closed. (D85)

## 🧭 PRIORITY PICKER / MODEL ROUTING (use when Aaron asks to choose from the list)

### Best suited to Codex / high-reasoning
- [x] **Vicksburg / siege campaign architecture** — Built as a 3-phase siege (Stockade Redan → Forlorn Hope → Saps & Mine) on the T8 engine; data/OOB/terrain/timing/probe, universal gun model, no fudges. The failed May assaults cost the attacker, the siege wins, the city falls. Complete 2026-06-20 (D86).
- [ ] **Chickamauga / Chattanooga design pass** — Decide whether this is one battle, linked battles, or phases; solve theater framing, terrain lessons, balance, and roster placement.
- [x] **Custom-battle builder C4** — Scenario schema UI, validation, launch contracts, export/shareable JSON, local slots, focused probe, and no-regression. Complete 2026-06-18 (D84).
- [ ] **Modern battles selectable in Classic hex / Phase D start** — Frozen-Classic bridge work; high regression risk.
- [ ] **Tactical Engineering Corps on the field** — Pontoons, entrenchments, abatis, obstacle clearing, B5 slider interaction, and strategic engineering linkage.
- [ ] **Full-campaign playthrough probe** — Long-running cross-layer gate from strategy to battle result to saves/victory.
- [ ] **USCT battle arc design** — The Crater, New Market Heights, Olustee, Nashville; historically sensitive and mechanically distinct.
- [ ] **S3 alt-history engine** — Divergence tiers, hinge forks, emergent-only toggle, and divergence log.
- [ ] **S4 codex/glossary architecture** — Multi-axis codex by timeline/topic/person/battle with provenance and cross-links.
- [ ] **Comprehensive WCAG 2.2 AA audit plan + first pass** — Broad UI judgment and remediation sequencing.
- [ ] **Phase H asset-ingestion pipeline** — Extend `tools/build.mjs` for tiered/compressed PD media with offline fallback.
- [ ] **Western theater roster/order/probe framework** — Lock Shiloh → Vicksburg → Chickamauga/Chattanooga → Atlanta/March → Franklin/Nashville ordering and guardrails.

### Suitable for DeepSeek / Cline only after Codex packets it
- [ ] Draft source dossiers from specified URLs/books into a fixed template.
- [ ] Fill teaching-card copy after Codex defines schema, sources, and acceptance criteria.
- [ ] Mechanical help-copy updates after roster changes.
- [ ] Add simple probe assertions copied from an existing probe pattern.
- [ ] Run exact gate commands and paste exact outputs.
- [ ] Screenshot cataloging / artifact inventory.
- [ ] Small JSON cleanup with strict acceptance criteria.

**Loot status:** Armory/Cannon Corps have loot-style rarity tiers, but Phase I standalone loot/survival is not built. Standalone drops/inventory, light survival, and Oregon-Trail journey mode remain open.

---

## 🟠 PHASE C — TACTICAL BREADTH (more real-time battles, data-driven)

### C1 Eastern marquee (complete)
- [x] **Gettysburg** — 3-day multi-phase epic (Day 1: McPherson Ridge/Oak Hill; Day 2: Little Round Top/Devil's Den/Wheatfield; Day 3: Pickett's Charge; probe-gettysburg 16/16 in latest gate)
- [x] **Chancellorsville** — Jackson's flank march, Stonewall's wounding (data/chancellorsville.json + registry + menu rank 35; probe-chancellorsville 24/24; 2026-06-18)
- [x] **Malvern Hill** — The Seven Days' culminating artillery duel (data/malvern-hill.json + registry/menu rank 18; probe-malvern-hill 24/24; roster order now Bull Run → Malvern Hill → Antietam → Fredericksburg → Chancellorsville → Gettysburg → Shiloh; 2026-06-18)

### C2 Western theater battles
- [x] **Shiloh** — First Western theater battle (probe-shiloh 29/29 in latest gate)
- [x] **Vicksburg** (siege campaign) — 3-phase siege; probe-vicksburg 18/18; the May assaults cost the attacker, the siege wins (D86, 2026-06-20)
- [ ] **Chickamauga / Chattanooga**
- [ ] **Atlanta / the March to the Sea**
- [ ] **Franklin / Nashville**

### C3 USCT battles (1863–65)
- [ ] **The Crater** (Petersburg, July 1864)
- [ ] **New Market Heights** (Sept 1864)
- [ ] **Olustee** (Florida, Feb 1864)
- [ ] **Nashville** (Dec 1864 — USCT-heavy)

### C4 Custom-battle builder
- [x] **Custom-battle builder** — Tools-first, ahead of some breadth (D68). Players can author single-phase real-time tactical scenarios with metadata, sides/briefs, objective/field size, terrain/markers, OOB, artillery, reinforcements, optional leaders/supply/teaching/provenance, validation, export/import/shareable JSON, six local slots, and launch through `fldScenarioInit`. Phase authoring remains deferred honestly; no per-custom combat fudges. (D84, 2026-06-18)

---

## 🟡 PHASE D — FULL HEX TACTICAL ENGINE

- [ ] **D1 Co-equal hex/turn-based tactical mode** — Make modern battles selectable in the Classic hex engine via the bridge. (D68 contracted this from "new engine" to "make modern battles selectable in Classic.")

---

## 🟢 PHASE E — STRATEGIC ARC COMPLETION (S3–S5)

### E1 S3 Alt-history engine
- [ ] Tiered divergence (plausible/long-shot/fantastical)
- [ ] Hinge-point forks + emergent-only toggle
- [ ] The "your war vs history" tracker + divergence log
- [ ] Wild-card catalog (11 CS + 10 US gambits — already data-defined in D28)

### E2 S4 Education layer
- [ ] Multi-axis codex (timeline + topic + person + battle, cross-linked, provenance shown)
- [ ] Inline glossary (every specialized term → definition + provenance)
- [ ] Play-style presets (President / General-Commander + Historian settings overlay)
- [ ] Tooltips-only onboarding (D68 contracted from full tutorial)
- [ ] Difficulty/realism sliders (B-5 already ships the hooks)

### E3 S4 Accessibility — WCAG 2.2 AA pass
- [ ] Dedicated comprehensive WCAG audit (Aaron's professional bar)
- [ ] DROP the 4 specialized a11y modes from v1 (D68 contraction)
- [ ] Core AA kept as-built; one big pass to audit everything

### E4 S5 Victory / defeat resolution
- [ ] Multiple honest paths incl. negotiated peace (both sides)
- [ ] Rich graded after-action report (per-domain grades, turn-by-turn divergence, casualties vs historical)
- [ ] Reconstruction coda (13th/14th/15th Amendments, Foner's "unfinished revolution")

---

## 🔵 PHASE F — CONTENT SYSTEMS

- [ ] **Logistics / rail network** — Rail as arteries (USMRR repair vs CS iron decay), supply depots, marches-on-the-stomach effects on bridge supply/fatigue facets
- [ ] **POW exchange-collapse thread** — 1863 cartel breakdown over USCT prisoners, Andersonville/Elmira honestly
- [ ] **Disease / medical system** — Disease killed ~2× combat; camp sanitation/hospitals/Sanitary Commission/Clara Barton; USCT's higher disease toll
- [ ] **Hard war system** — 1864–65 escalation (Sherman's March, Sheridan in the Valley); break enemy will/logistics + honest civilian/enslaved reckoning
- [ ] **Irregular war thread** — Mosby, Quantrill/Lawrence bushwhackers, Union anti-guerrilla policy
- [ ] **Four under-told perspective threads** (woven in + sourced):
  - Enslaved people's agency (self-emancipation, the general strike, spies/guides)
  - Immigrant/ethnic units (Irish Brigade, German regiments, ~25% foreign-born Union)
  - Native nations (Ely Parker, Watie's Cherokee, Trans-Miss, divided loyalties)
  - Women's roles (Barton/Dix nurses, Van Lew/Boyd spies, soldiers in disguise, home-front managers)
- [ ] **Women in the war — soldier & relief threads** (Aaron's run-k idea):
  - Women who enlisted disguised as men (Sarah Rosetta Wakeman, Jennie Hodgers/"Albert Cashier", Loreta Janeta Velázquez)
  - Clara Barton arc (Angel of the Battlefield → Missing Soldiers Office → American Red Cross)
  - Dr. Mary Edwards Walker (only woman awarded the Medal of Honor)
  - Harriet Tubman (scout/spy; Combahee River Raid 1863)
- [ ] **Flagship named units** — 54th Massachusetts, Iron Brigade, Irish Brigade, Stonewall Brigade with identity/history/teaching
- [ ] **CS finance toolkit** — Erlanger loan (corrected 45% on disk), cotton bonds, impressment, produce loan, printing spiral
- [ ] **War-finance civics** — Jay Cooke's bond drives, first US income tax, greenbacks vs gold, taxation politics
- [ ] **Real diplomacy system** — Mason & Slidell, Trent affair, Laird rams, Russian fleet 1863 visit, cotton vs King Wheat
- [ ] **Human-cost-with-gravity treatment** — Beyond aggregate numbers: regiment losses, occasional named soldier/letter, scale made legible (~750,000 dead is the teaching heart)
- [ ] **Tactical Engineering Corps** (Aaron's directive) — Pontoons, field fortifications/entrenchments, abatis/obstacles, obstacle-clearing/road repair. Must INTERACT with B-5 difficulty/realism sliders. (Split from B-5 per D69.)

---

## 🟣 PHASE G — THEATERS

- [ ] **Western theater** (same mechanics, new content — D40/D54): Shiloh, Vicksburg, Chickamauga/Chattanooga, Atlanta/the March, Franklin
- [ ] **Naval / riverine / Trans-Mississippi** — DEFERRED (D54/D68). Ironclads (Monitor/Virginia), commerce raiders (Alabama), river war (gunboats→Vicksburg)

---

## 🟤 PHASE H — "MAKE IT COME TO LIFE" (graphics/footage/audio — AFTER gameplay-complete)

- [ ] **H1 PD images** — Weapons / flags / USCT / scenes via LoC + Internet Archive + Wikimedia; linked-assets + offline fallback
- [ ] **H1b Brigade badges & insignia / battle flags** (Aaron's run-k idea) — Each brigade's battle flag/colors on the unit badge; ANV Southern Cross, Hardee/Polk Western patterns, US national & regimental colors, Army of the Potomac corps badges
- [ ] **Asset-ingestion pipeline** (D71) — Extend `tools/build.mjs` to Base64-embed + TIER/COMPRESS media w/ offline fallback so the single file stays portable as it grows
- [ ] **H2 Reenactment footage** — Contextual cutaways at key beats (skippable, offline→procedural fallback)
- [~] **H3 Richer 3D/animation** — Reuse run-h PBR/HDRI/post-FX; period broadsheet/engraving UI throughout. Partial: D85 adds a procedural 3D objective beacon and extends the tactical visual probe to 8 captures with beacon assertions.
- [ ] **H4 Richer audio** — PD period tunes + battlefield/camp soundscapes + UI cues, all accessible (toggles/captions/volume), default off. (T9-audio.js D77 is the start of this.)

---

## ⚪ PHASE I — LOOT / SURVIVAL (DEFERRED to after core — D61)

- [ ] **Standalone rarity-tiered loot + inventory** (all modes) — Borderlands-style drops with its own inventory
- [ ] **Light survival** — Rations/weather/forage/disease, default off, preset-gated (§27)
- [ ] **Oregon-Trail-style journey mode** — Between-battles march legs

---

## ⚫ PHASE J — POLISH / META

- [ ] **Saves system** — localStorage + named slots + export/import; undo-last-turn on accessible preset (D54). (Weekend polish commit `756c311` started this — save slots + help overlay + first-launch welcome + enhanced export.)
- [ ] **Full-campaign playthrough probe** — Add to the no-regression suite (D54)
- [ ] **Mod-friendly data + shareable saves/scenarios**
- [ ] **Hosting** — DEFERRED (D54). GitHub Pages (simplest) OR itch.io + Butler (best indie discovery). Rename `civil_war_generals.html`→`index.html` at publish. Note: GitHub Pages on a PRIVATE repo needs GitHub Pro → for true $0 use a public deploy repo or itch.io.

---

## 📐 MODERN-UGG-PLAN — REAL-TIME TACTICAL ENGINE (P0–P5)

The real-time UG:G-style engine is largely BUILT (P0 sandbox ✅, P1a Bull Run ✅, P1b-i fog ✅, P1b-ii auto-pause ✅, P1b-iii defender AI ✅, Phase A connect ✅, Phase B B1–B6 ✅). The remaining P-phases from `MODERN-UGG-PLAN.md`:

- [ ] **P2 — The fight (continuous fire/melee/morale/rout/rally)** — Largely done in P0–P1b. Deepen as needed.
- [ ] **P3 — Depth (fog of war ✅, officers/command ✅, ammo/fatigue ✅, distinct arm roles ✅)** — All done.
- [ ] **P4 — Reactive AI** — Largely done (B1 attacker AI ✅, B-1 defender AI ✅). Tune further.
- [ ] **P5 — Expand + teach** — Roll out real OOBs marquee-first (Phase C), campaign result wiring (Phase A ✅), save (Phase J), more battles (Phase C), USCT battles (C3), education/codex layer (E2)

---

## 🎯 OPEN DESIGN / DECISION ITEMS (need Aaron input)

- [x] **Antietam bug-hunt completion** — Dossier complete, all probes pass, committed.
- [ ] **Phase order confirmation** — C (breadth) → D (hex) → E (strategic) → F (content) → G (theaters) → H (graphics) → I (loot) → J (polish) per D61. Confirm still correct.
- [ ] **Audio (H4) timing** — D61 says Phase H, but D77 (T9-audio.js) already started it. Confirm whether audio work continues now or pauses.
- [x] **Custom-battle builder (C4)** — Built as a single-phase V1 tactical scenario authoring tool with import/export, slots, validation, launch contract, and focused/regression probes. (D84)
- [ ] **Loot/survival (Phase I)** — D68 elevated to "core pillar" (always-on progression + journey mode). D61 says defer. Resolve the tension.
- [ ] **Zoomable battle scale** (D68) — Brigades expand into regiments on zoom. New tactical-engine requirement beyond current brigade abstraction. Not yet designed.
- [ ] **Heavy embedded media** (D68) — Bundle PD imagery/footage into deliverable. Plan Phase H to compress/tier so portability survives.

---

## 🔧 TOOLING / INFRASTRUCTURE

- [ ] **Subsystem folder reorg** — Group `src/` into `src/strategy/`, `src/tactical/`, `src/render/`, etc. (D54/D56.3 — deferred, not yet done)
- [ ] **Perf presets + profile hotpaths** — Auto/Low/High, instancing/LOD/culling for Intel UHD 617 floor (D54)
- [ ] **Reusable historical-data layer + in-game sources codex** (D54)

---

## ✅ COMPLETED PHASES (for reference)

- **Phase A** — Connect strategic desk → real-time tactical battle + result feedback loop (D62)
- **Phase B-1** — Smarter attacker AI (D64)
- **Phase B-2** — Officers & command on tactical field (D65)
- **Phase B-3** — In-battle logistics / ammo economy (D66)
- **Phase B-4** — Distinct arm roles (artillery/cavalry) (D67)
- **Phase B-5** — Difficulty/realism presets (D70)
- **Phase B-6** — CS-player "command either side" (D72)
- **Phase C-1** — Eastern marquee battles complete: Fredericksburg (D73), Gettysburg, Chancellorsville (D81), Malvern Hill (D82)
- **Phase C-1.5** — Universal artillery gun model (D75)
- **Phase C-2** — Antietam multi-phase epic (D76 — bug-hunt later completed; current probe green)
- **Phase C-2.5** — T9-audio.js audio system (D77)
- **Phase C-4** — Custom-battle builder single-phase V1 complete (D84)
- **D85** — Uncommitted D77-D84 leftover gate closed; tactical 3D objective beacon + visual probe 8/8
