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
2. **Clear-then-continuous inside the current group.** I clear a scope's designs with you upfront, then execute the
   bounded slice continuously, stopping at the clean committed+pushed boundary before a new execution group unless
   Aaron explicitly orders same-chat continuation.
3. **Per-milestone vetting + push** uses the D160 tiered gate: always GATE OK, relevant importer/schema gate,
   focused probe, output/JSON readback, 0 pageerrors, and `git diff --check`; JS/runtime changes also require
   `node --check` on touched JS/probe files plus 1-3 adjacent probes. Full `npm run vet:noreg` is mandatory for
   shared lifecycle/manifest/build/save/bridge/tactical/render/accessibility, suite-probe changes, or large
   milestone/release-batch pushes. Repeated narrow content slices use focused + importer/schema gates, with a full
   suite every 3-5 slices or before the release batch. Balance auto-tuned + logged.
4. **Content standard:** ≥2-source Verified (else Inferred), anti-Lost-Cause, period-but-tight voice.

## FRESH-CHAT EXECUTION GROUPS (LOCKED 2026-06-30 — D171)
Use this grouping to avoid carrying new work across auto-condense. A single chat may finish one bounded milestone and its red/green repair loop, but after a clean committed+pushed milestone the agent should stop and return a paste-ready next-chat prompt unless Aaron explicitly orders same-chat continuation.

1. **Group 1 — Phase I Soldier's Story scale-out (first slice shipped D172):** citation-grade named bios, portrait/provenance where already public-domain and verified, unit detail at scale, richer start-anywhere career trajectory, then later interpersonal hooks. Preserve D152-D158 replacement honesty: no fabricated people/ranks/units, no unsourced portrait/license claim, no women-in-war lane collapse into `ss:` replacements, and no save/journey/report contract break. First slice shipped Strong Vincent as the sixth `Verified` replacement; broad scale-out remains open for a later content pass.
2. **Group 2 — GM follow-up leftovers (NEXT):** symmetric AI-GM, cross-theater Transfer only after `theater` fields are honest, and any remaining political-general/election relief/readout gap only if current code/docs prove it is not already shipped. These are inputs/readouts only; never force scoreboard outputs or break the no-fudge wall.
3. **Group 3 — H0 batch/release gate:** run the completed-H0 batch/release verification checkpoint as its own long-grace browser-gate chat. Do not weaken probes. Inspect JSON/stdout for `ok=false`, `FATAL`, `pageerrors`, filtered errors, and real errors.
4. **Group 4 — remaining Phase F/G non-battle content systems:** hard war, irregular war, under-told perspectives still not covered by the D153 women lane, flagship named units, CS finance toolkit, war-finance civics, real diplomacy, human-cost-with-gravity, and Western-theater strategic readouts that do not create playable battles. Keep War Effort/bridge/save contracts bounded and anti-Lost-Cause.
5. **Group 5 — Phase H polish/media/perf:** surviving-colours/PD asset polish, H2 real footage only after per-asset PD provenance and anachronism review, render/readability polish, audio polish, Intel UHD-617 profiling, and heavy embedded-media budget planning. No unclear-license assets, accounts/trials/download dependencies, runtime web dependencies, or Tripo actions without explicit approval.
6. **Group 6 — meta/deferred tooling:** reusable historical-data layer, source organization, hotpath profiling, and embedded-media budget tooling. No broad refactor unless the slice has a clear gate and small blast radius.
7. **Group 7 — last battle-build queue:** Chattanooga and USCT playable battles remain last, with Atlanta/March and Franklin/Nashville still blocked unless Aaron explicitly reorders. Phase D full hex remains v2/deferred.

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
- [x] **C4 Custom-battle builder** (D54/D84/D147): single-phase V1 tactical scenario authoring UI, validation, export/shareable JSON, import/round-trip, six local slots, explicit `custom_...` launch contract through `fldScenarioInit`, documented template/pack share format, and focused/no-regression probes. Phase authoring remains deferred until a phase editor can be proven safely.

### Phase D — FULL HEX TACTICAL ENGINE  ‹⏸ DEFERRED TO v2 — D91 (the real-time engine is mature; a parallel hex engine is no longer a v1 requirement)›
- [ ] **D1** A complete parallel hex/turn-based tactical mode on the modern OOB/scenario data, selectable per
      battle alongside real-time. (Legacy "Classic" hex battles stay frozen; this is a NEW, data-driven hex layer.)
      ‹LOCKED: sits here, after tactical depth, so it duplicates onto a mature engine.›

### Phase E — STRATEGIC ARC COMPLETION  (S3–S5)  ‹▶ NEXT after C breadth — D91 (pulled ahead of the hex engine; the biggest content-thin pillar)›
- [x] **E1 S3 alt-history:** tiered divergence + hinge forks + emergent toggle + the player-driven "your war
      vs history" tracker + divergence log (no thumb on the scale — D54). ‹✅ COMPLETE through D118.›
      ‹✅ increment 1 (D111): the flagship **"Your War vs History"** desk tab — a tiered (minor/major/radical),
      dated DIVERGENCE LEDGER with the historical counterfactual per entry + a 0..100 divergence INDEX + the
      EMERGENT-ONLY toggle (withholds the wild-card gambits). Pure read-out over the S1e `C.strategy` seeds
      (`src/81-divergence.js`; no tactical file touched → combat byte-identical). Detects emancipation timing
      [declined/early/1862/late], CS arm-the-enslaved, foreign recognition, the 1864 election (US) / CS
      home-front break, the CS trajectory, each wild card. probe-divergence 14/14; bug-hunt invariantsHold=TRUE.
      ‹✅ increment 2 (D115): **ALTERNATE ENDINGS — the fantastical tier** (Aaron's D114 catalog, build-order
      pick). 8 fantastical alt-history end-states (4/side: A British war · Maximilian's legions · Stonewall lives ·
      the Golden Circle; the rapid-fire war · a Russo-American century · Lincoln lives Reconstruction · the 13th
      early), each EARNED (a gambit/emancipation/victory `precond` OPENS it, a `vicMomentum`/recognition/election
      `gate` SECURES it → ★ Reached / ◇ Within reach + a secure-hint). New `src/83-endings.js`
      (`_END_CATALOG`/`endScan`/`endRenderSection`); surfaced in the "Your War vs History" tab + the after-action
      report via guarded embeds; pure read-out, no tactical file → combat byte-identical. probe-endings 9/9;
      bug-hunt invariantsHold=TRUE (all 8 counterfactuals verified; 2 fixed). The Golden Circle named honestly,
      anti-Lost-Cause.›
      ‹✅ increment 3 (D116): **the GROUNDED tier — CS-half** (8 plausible/long-shot Confederate end-states, the
      D114 catalog: Recognized independence · Negotiated peace · Emancipated Confederacy [slavery named plainly] ·
      Stalemate/two-Americas · Fabian survival · Trans-Miss redoubt · King Cotton coerces Europe · Northwest
      secedes), authored the same way in `_END_CATALOG` + the new `_endEnemyWill`/`_endYear`/`_endLever` accessors;
      `endRenderSection` rewritten into a CVD-safe LABELED SPECTRUM (Plausible → Long shot → Fantastical bands).
      Pure read-out → battles byte-identical. probe-endings 16/16; bug-hunt invariantsHold=TRUE (4 confirmed + 2
      critic-LOW fixed: the trans-miss passage-of-time open, the US teaser over-promise, the Fabian fortify-ports
      opener, the negotiated-peace hint, + reachability/coverage).›
      ‹✅ increment 4 (D117): **the GROUNDED tier — US-half** (the 8 Union end-states, the D114 catalog:
      Reconstruction-that-holds · Early abolition [the `us-radical-emanc` WILD, not the auto-tripping usctUnlocked] ·
      Hard-war collapse · Reunion-without-emancipation [named as the moral failure it would have been, NOT a triumph] ·
      1862 knockout [year≤1862 & won≥5] · Forty-acres [Foner/Du Bois] · Compensated-bloodless [em.year≤1862; Lincoln] ·
      the general strike [Du Bois]), authored the same way in `_END_CATALOG`; the US teaser flipped so BOTH sides now
      advertise the full labeled spectrum. **The labeled grounded→fantastical spectrum is now complete on both sides —
      24/24 of the D114 catalog's end-states live (12 CS + 12 US).** Pure read-out → battles byte-identical.
      probe-endings 24/24 (+8 D117 steps); bug-hunt invariantsHold=TRUE (8 agents; 1 confirmed MED fixed — the
      general-strike USCT count corrected from "tens of thousands" to ~180,000, matching the game's own after-action
      figure). wcag-auditor AA (data-only, no edits).›
      ‹✅ increment 5 (D118): **interactive HINGE-FORK decision cards** on the proven `decResolve`/`_decApply`
      engine (pure data → byte-identical by construction). 4 citation-grade strategic forks (2 US, 2 CS) that
      STEER the war's trajectory toward the ending spectrum: us-hard-war (total war/conciliation/grind → hard-war
      collapse) · us-reconstruction-terms (10% Plan/Wade-Davis/forty-acres → Reconstruction-that-holds) ·
      cs-king-cotton (embargo/export/burn → recognized independence/King Cotton) · cs-peace-feelers
      (negotiate/fight-on/husband → negotiated peace/Fabian). All `trigger.hinge` with the rich multi-voice `card`
      block + a named-and-countered Lost-Cause myth voice; deck 8 → 12. Cards use only the existing `_decApply`
      vocabulary (move momentum [the dominant ending gate] + foreign/blockade/manpower); each option's prose names
      the ending it steers toward. probe-decisions 19/19 (+5 D118 steps); research+verify (8 agents) + bug-hunt
      (6 agents) invariantsHold=TRUE, 0 confirmed; wcag-auditor auto-fixed 2 PRE-EXISTING AA contrast failures in
      the decision render. (The wild/lever/recognition openers stay on the Paths-to-Victory surface, by design.)›
      ‹✅ the divergence-log read-back landed in the E4 graded after-action report (D112).››
- [x] **E2 S4 education:** multi-axis codex + inline glossary + the full guided tutorial + play-style presets
      (President / General-Commander, + the Historian settings overlay — D39) + difficulty/realism sliders. **COMPLETE (i1–i5).**
      ‹build order (D120): i1 codex DATA+tab ✅ → i2 inline glossary ✅ → i3 tutorial ✅ → i4 presets+Historian overlay ✅ (D123) → i5 ✅ (D124) — NOTE: the difficulty/realism SLIDERS already shipped (B5/D69, `src/tactical/T6-presets.js`); i5 (D124) added the citation-grade "what this costs in real life" HISTORICAL TEACHING layer over those dials (`src/96-realism-teaching.js`), the education-focused reading of "i5 sliders" (scope decision D124.1, Option B).›
      ‹✅ increment 1 (D120): the multi-axis **CODEX/glossary** — `data/codex.json` (60 citation-grade, anti-Lost-Cause
      entries across 4 axes: people 24 · units 11 · terms 19 · systems 6; all Verified, ≥2 real sources) + a searchable,
      axis-filterable, cross-linked **Codex** President's-Desk tab (`src/84-codex.js`, pure read-out → battles byte-identical)
      + `cxLookupShort`/`cxGlossaryIndex` for the i2 inline glossary. Content via a 14-agent research+verify Workflow (the
      verify pass caught + fixed a fabricated artillery cite and the Forrest-founded-the-Klan error → "first Grand Wizard").
      probe-codex 18/18 (incl. a static-scan that no combat path reads the codex); 26-agent bug-hunt invariantsHold=TRUE,
      16 LOW/MED findings all fixed + probe-locked; wcag-auditor AA (2 contrast spans fixed).›
      ‹✅ increment 2 (D121): the **INLINE GLOSSARY** — `src/93-glossary.js` DOM-decorates the teaching prose of the
      After-Action + Your-War-vs-History tabs, wrapping codex terms in accessible inline `<button>` triggers (dotted brass
      underline) + a shared tooltip; reads the SAME codex data (`cxGlossaryIndex`/`cxLookupShort`). Matchers built from
      DERIVED SURFACES (strip "The"/"(...)", extract acronyms like USCT, + 3 bare-form aliases) so prose forms match; the
      def rides each trigger's aria-label (SR on focus; tooltip aria-hidden). Pure read-out, guarded `_wdRefresh` hook →
      battles byte-identical. probe-glossary 12/12 (+static-scan); OFFLINE 26-agent bug-hunt fixed a real word-boundary bug
      (parenthetical terms were dead matchers) + 15 more, all probe-locked; wcag AA.›
      ‹✅ increment 3 (D122): the **GUIDED TUTORIAL** — `src/94-tutorial.js`, a self-contained 7-step modal tour
      (the three layers · the Desk · Decisions · Battles · the Codex & glossary · Winning · Play Your Way) with
      Back/Next/Skip, a focus trap, ARIA dialog semantics, reduce-motion-safe fade; launched from the welcome card,
      the How-to-Play panel, and a main-menu "GUIDED TOUR" button (3 guarded hooks in `src/92-help-overlay.js`). Pure
      UI/help layer → battles byte-identical. probe-tutorial 15/15 (+static-scan); 14-agent bug-hunt invariantsHold
      =FALSE→fixed (a real forward-Tab focus-trap defect + the "?"-behind-modal leak + 4 more), all probe-locked; wcag AA.›
- [x] **E3 S4 accessibility:** the dedicated FULL WCAG 2.2 AA pass + the 4 a11y modes (high-contrast, CVD-safe,
      SR turn/battle narration, dyslexia font) — your professional bar. ‹✅ COMPLETE (i1+i2).›
      ‹✅ **i2 (D126): THE FULL WCAG 2.2 AA AUDIT SWEEP** — exhaustive per-surface contrast/ARIA/focus/keyboard
      audit + root fixes across every shipped surface. Keystone: always-on `:root{--rule:#a89066;--blood-lt:#d8745c}`
      (both TEXT-ONLY tokens failed AA on dark; the redefine fixes ~40 frozen-base-class + module-inline text uses
      at once, light-menu-safe) + a universal focus-ring fallback + a pressed-toggle focus override + a `#toast`
      status region + HC per-surface extensions (desk/HUD/dialogs/control borders). ~50 inline-colour fixes
      (canonical green/red status palette + rarity) + ~16 ARIA/focus/keyboard fixes (aria-pressed/expanded, the
      help modal inert+focus-return, the T0 2D glyph dark-halo, save-slot target-size). Fixed a CSS group-opacity
      compositing bug (the `.85` row dimmed the status word) in `_brgBar`/`_morMeter`/blockade-meter + the disabled
      arms cards. Verified by a 28-agent audit Workflow (127 findings) → an 11-agent bug-hunt (3 + a HIGH critic gap)
      → a wcag-auditor confirm + two whole-`src/` scans (7 more misses), all fixed. probe-accessibility 17→25/25;
      probe-presets 26/26 byte-identity; bootprobe/diag-classic/t1probe + ~30 UI/tactical probes GREEN; 0 pe.›
      ‹✅ **i1 (D125): THE 4 A11Y MODES + the hub** — new guarded
      `src/97-accessibility.js`: high-contrast (`:root` token override + universal focus ring), colour-blind-safe
      (drives base `cbAids`), SR narration (a NEW strategic `aria-live` region `#a11yLive` + per-turn summary;
      battles already narrated via `fldAnnounce`), dyslexia text (sans stack + relaxed spacing, no external font),
      + a reduced-motion mirror. Main-menu "♿ Accessibility" button + a Play Your Way hand-off; boot-load +
      `prefers-contrast` auto-detect. Pure settings/presentation → battles byte-identical (probe static-scan).
      probe-accessibility 17/17; 9-agent bug-hunt 10 findings ALL fixed (incl. a HIGH menu-readability regression
      + a HIGH/MED D123-class resurrection, both probe-locked); wcag AA. ⏳ **i2 NEXT: the dedicated FULL per-surface
      WCAG 2.2 AA audit sweep** (every desk tab/menu/HUD/overlay/tactical readout) — the box ticks when i2 lands.›
- [x] **E4 S5 victory:** multiple honest paths incl. negotiated peace + the rich graded after-action report +
      the Reconstruction coda. ‹✅ COMPLETE through D119.›
      ‹✅ increment 1 (D112): **the rich GRADED AFTER-ACTION REPORT** — an A–F report card (D94 scale, neutral
      64=C, CVD triple-encoded) across 6 domains (Battlefield · Treasury · Diplomacy/Blockade · Home Front & the
      1864 election · the war's PURPOSE [US=emancipation timing; CS=an honest NON-graded "Confederate Cause"
      panel, anti-Lost-Cause] · High Command) + a headline overall grade + a **read-back of the D111 divergence
      ledger** (`divScan`/`divIndex`) + the human cost vs the ~750k historical toll (Hacker 2011) + a forward
      **Reconstruction coda** keyed to the emancipation choice (Foner). Surfaced as a live **"After-Action"** desk
      tab (16th, pure read-out) AND the war-end final report (the authorized `warWonScreen` override). New
      `src/82-after-action.js`; no tactical file touched → combat byte-identical by construction. probe-afteraction
      10/10; bug-hunt invariantsHold=TRUE (1 LOW + 2 critic-LOW, one NaN root cause, fixed+probe-locked); wcag AA.
      ‹✅ the §12.3 ELECTION-SUPPORT RELIEF-BIND shipped (D113): a commissioned UNION political general costs extra
      political capital to relieve before the 1864 vote (rises 1862<1863<1864, relaxes once `resolved1864`); a
      teaching tell on the active-general card; UNION-only + byte-identical for the roster + the CS side;
      probe-command 76/76; bug-hunt 3 confirmed (2 MED + 1 LOW) all fixed.›
      ‹✅ increment 2 (D119): **E4-i2 — THE STRATEGIC WAR-END.** A reached `victoryReady` (a negotiated peace /
      a recognized independence) now CONCLUDES the war through the same D112 graded report, surfaced as a NON-FORCED
      offer on the between-battles interstitial ("The war can be concluded", or fight on) — the war-end fires for a
      non-chain-complete victory. New helpers in `src/82-after-action.js` (`aarStrategicEndAvailable`/`aarConcludeWar`
      + the `warWonScreen` framing); side-correct ("recognition" CS-only — the Union never wins by the South's
      recognition; "will" side-aware; a CS victory framed honestly, never valorized). Byte-identical interstitial when
      no offer; byte-identical D112 screen at chain completion; no tactical file → battles byte-identical. probe-
      afteraction 15/15 (+5 D119); bug-hunt invariantsHold=TRUE (1 LOW + 2 critic [1 MED side-aware-toast + 1 LOW]
      all fixed+probe-locked); wcag AA. The honest multi-path victory framing is the graded report (D112).›

### Phase F — CONTENT SYSTEMS  (folded into the phase each best fits)
- [~] **Logistics/rail network ✅ D159** (War Effort rail/supply readout + bounded opt-in railhead bridge) · **POW exchange-collapse ✅ D161 focused-gated** (War Effort prisoner/camp pressure + bounded opt-in relief bridge; full suite deferred to planned-work batch/release gate) · **disease/medical ✅ D169 focused-gated** (War Effort disease/army-medicine pressure + bounded opt-in medical relief bridge) · hard war · irregular war · the four
      under-told-perspective threads · flagship named units · CS finance toolkit · war-finance civics · a real
      diplomacy system · the human-cost-with-gravity treatment. (All from §8 D31–D41.)
- [x] **Women in the war — soldier & relief threads (Aaron, run-k idea, 2026-06-15).** Add **female leads in the
      soldier-story rotation**, not only male: the women who enlisted **disguised as men** (est. several hundred —
      e.g. Sarah Rosetta Wakeman / "Pvt. Lyons Wakeman", Jennie Hodgers / "Albert Cashier" [served the whole war,
      drew a pension], Loreta Janeta Velázquez / "Harry T. Buford" on the CS side — frame the contested memoir as
      contested), and a **Clara Barton arc** (the "Angel of the Battlefield" → the Missing Soldiers Office → the
      American Red Cross). Neighbors: **Dr. Mary Edwards Walker** (the only woman awarded the Medal of Honor) and
      **Harriet Tubman** (scout/spy; the Combahee River Raid, 1863). Verified/anti-Lost-Cause; ties USCT (C3) +
      the human-cost treatment. ‹✅ COMPLETE through D153 as a citation-grade Campaign Kit card lane beside Soldier's
      Story: 7 records, 6 Verified + 1 Disputed Velazquez, no `replacePid`, no `ss:` ids, no Soldier's Story registry
      leakage, `data/soldier-replacements.json` remained empty through D153, codex portraits reused only where already
      sourced, and no Wakeman wartime portrait asserted. D154 later added a separate Rhodes replacement record without
      mapping any women-in-war card into Soldier's Story.›
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
- [~] **H0 UI/UX redesign direction (D145/D163/D164/D165/D166/D167/D168):** move beyond the current broadsheet-as-app-shell interface into a research-backed, more video-game-like historical command UI. Build a reusable visual system (tokens, spacing, panel radius, icon controls, state chips, focus rings, animation/reduceMotion rules, CVD-safe patterns), then redesign target screens with Aaron's approved immediate order first: main menu, President's Desk overview, battle briefing/side choice, between-battle interstitial, tactical HUD/settings, and after-action/final report. Constraints: brighter/rounder/more dramatic, public-domain imagery centered where it clarifies people/place/stakes, no unclear-license assets, Civil War gravity/anti-Lost-Cause framing, WCAG 2.2 AA, keyboard support, and Intel UHD-617 performance. Acceptance: committed design law + concrete milestone plan, focused probes for responsive layout/no overlap/visible focus/0 pageerrors, screenshot checks across desktop/tablet/phone, and `diag-classic` unchanged. Research packet: `.tmp/ui-redesign-research.md`. **D163 (2026-06-29) completed the main-menu prototype slice:** dark modern command shell, no `.gn-paper`/broadsheet serif stack/old sword-glyph treatment, preserved menu ids and injected controls, focused `probe-h0-main-menu` desktop/tablet/phone coverage, saved-campaign path, new-campaign/free-battle action checks, and adjacent menu/a11y/boot/classic gates. **D164 (2026-06-30) completed the President's Desk overview slice:** dark command-center War Effort overview, preserved Desk tab ids and deep War Effort blocks, focused `probe-h0-president-desk` desktop/tablet/phone coverage, adjacent desk/menu/a11y/boot/t1/classic gates, and local harness hardening for slow Chrome. **D165 (2026-06-30) completed the battle briefing/side-choice slice:** dark command bridge briefing, preserved bridge launch ids and prep toggles, preserved `scene-img` integration and `data-brside` callbacks, focused `probe-h0-battle-briefing` desktop/tablet/phone coverage, adjacent bridge/campaign-link/roster/scenes/a11y/menu/desk/boot/t1/classic gates, and local harness hardening for slow Chrome. **D166 (2026-06-30) completed the between-battle interstitial slice:** dark Strategic Turn shell, preserved `pdGoDesk`/`pdGoBrief`/`pdGoOn`/`pdConcludeWar`, decision cards, army summary, strategic-end offer, and campaign-advance wiring, focused `probe-h0-between-battle` desktop/tablet/phone coverage, adjacent desk/afteraction/bridge/a11y/H0/boot/t1/classic gates, and a locked fix for literal `&mdash;` offer text. **D167 (2026-06-30) completed the tactical HUD/settings slice:** dark command field overlay, selected-unit meters, settings drawer, terrain-key styling, preserved tactical ids/hotkeys/drawer wiring/side-relative HUD path, focused `probe-h0-tactical-hud` desktop/tablet/phone coverage, adjacent field/presets/campaign-link/csplayer/a11y/briefing/boot/t1/classic gates, and locked overlap/phone-control guards. **D168 (2026-06-30) completed the after-action/final-report slice:** dark command report shell around the existing pure report body, preserved grade/final-screen/endings/Soldier's Story/glossary contracts, focused `probe-h0-after-action` desktop/tablet/phone coverage for live and final reports, adjacent afteraction/endings/a11y/glossary/boot/t1/classic gates, and longer local Chrome grace for the 8 GB CPU. **H0 ordered surfaces are complete.** Full no-regression remains deferred to planned-work batch/release gates, not repeated after every focused slice.
- [~] **H1 PD images:** weapons / flags / USCT / scenes (have 131 portraits) via LoC + Internet Archive +
      Wikimedia, linked-assets + offline fallback. **Asset-ingestion (D71):** extend `tools/build.mjs` (Node, not a
      separate script) to Base64-embed + TIER/COMPRESS media w/ offline fallback so the single file stays portable as
      it grows (D68 #7). **Guardrail (D71):** no Phase-H media lib may require `SharedArrayBuffer` (COOP/COEP headers
      can't be set on GitHub Pages; `coi-serviceworker` is the shim if ever needed). PD imagery > AI art (aesthetic / IP / anachronism).
      ‹increment 1 ✅ (D133, 2026-06-25): **THE OFFLINE PORTRAIT TIER + THE D71 INGESTION PIPELINE** — Aaron chose
      "Go on H1/H2 now" (AskUserQuestion). The pipeline built + proven on the ALREADY-PD-vetted in-repo portraits (no
      NEW external fetch this increment): `tools/prep-embed-assets.mjs` (sips ≤128px/q64 → `assets/embed/portraits/`,
      155 files/953KB) + `tools/build.mjs` Base64-inlines `assets/embed/**` into a bare-name `__ASSETS` global (HARD/SOFT
      byte budget + dup-key gate + non-file skip + a data:-URL mask before the HEX_BOMB scan) + `src/21-photo-embed.js`
      overrides `window.portraitFor` so a real PD photo shows even with NO `assets/` folder beside the file (base hi-res
      → embedded 128px tier → engraving; LAZY framing, eager-warm only when an offline probe-image 404s; + a lead-badge
      upgrade). File 3.1MB→4.3MB. Combat byte-identical by construction (touches no combat/data/save; never `fldRng`) —
      `probe-photo-embed` 22/22 (offline portability proven by route-blocking `assets/portraits/`) + `probe-presets` 26/26
      + `probe-phased-ab` 20/20-0diff + the full atmospherics/weather/render-richness/audio/flags/tactical-visuals suite
      coexist. Bug-hunt 6 Opus finders (D74-purity 0 findings): fixed a hi-res-DOWNGRADE on late-built lead badges + the
      eager-warm waste + 3 build-robustness LOWs; critic SAFE TO COMMIT. **REMAINING H1: weapons / flags / USCT / scenes
      imagery + H2 footage (each a NEW external-asset fetch → surface for per-asset licence + anachronism sign-off); the
      3D terrain/HDRI/GLB are separate relative-path categories — "offline-portable" currently means PORTRAITS.**›
      ‹increment 2 ✅ (D134, 2026-06-25): **PD ARMS IMAGERY on the Armory/Cannon-Corps cards.** Aaron set
      asset review to "fully hands-off, edge-cases only" (AskUserQuestion). `tools/source-arms-imagery.mjs`
      (Commons API → PD-only rasters + provenance) + `tools/prep-embed-assets.mjs` weapons(`format:'keep'` for
      PNG alpha)/artillery categories + `src/54-arms-imagery.js` (`armsImageHtml` → parchment-framed `<img>` or
      `""`) called from 55/56 card renders (1 line each). **10 of 14 imaged** (8 weapon Smithsonian cutouts +
      napoleon[Forbes sketch] + whitworth[period photo]); 4 IMAGELESS+documented (richmond, howitzer12, parrott10,
      ordnance3in). Combat byte-identical (helper reads only __ASSETS, never fldRng; probe-presets 26/26 + weapons
      8/8 + cannon 9/9). Bug-hunt ANACHRONISM lens caught + fixed a wrong-class siege Parrott + a modern monument
      photo (→ imageless) + a henry opaque-box (→ cutout) + a prep footgun + alt-redundancy; critic SAFE TO COMMIT;
      wcag AA. probe-arms-imagery 17/17.›
      ‹increment 3 ✅ (D135, 2026-06-25): **PD USCT IMAGERY on the Codex cards + "The Ranks" manpower block.** Same
      "fully hands-off, edge-cases only" mode. `tools/source-usct-imagery.mjs` (Commons API → PD-only rasters +
      provenance, keyed by codex entry id) + `tools/prep-embed-assets.mjs` `usct` category (maxPx 420/q78/JPEG) +
      `src/53-usct-imagery.js` (`usctImageHtml(id)` → a period-framed **captioned `<figure>`** [img + figcaption =
      caption + holding-institution credit] or `""`) called from `84-codex.js` (`_cxEntryHTML`, by `en.id`) +
      `70-manpower.js` (`presManpowerBlock`, US side when usctUnlocked) — 1 guarded line each. **7 images, all PD +
      VIEW-verified period-accurate:** Company E/4th USCI, Sgt. Carney, Col. Shaw, Frederick Douglass, Harriet Tubman,
      the 1864 Harper's Weekly Fort Pillow-massacre engraving (the dignity/anti-Lost-Cause choice on the Forrest
      entry — centers the USCT victims, not a Forrest portrait), the 1863 "Come and Join Us Brothers" broadside.
      **INFORMATIVE not decorative** (the inverse of D134's arms cutouts): real descriptive alt + a visible figcaption
      (these photos ARE the teaching). The VIEW discipline caught a wrong "Robert Gould Shaw 2d" namesake during
      sourcing → re-sourced before embed. Combat byte-identical (probe-presets 26/26). Bug-hunt 6 Opus finders
      (PD-licence-re-verify [live] + anachronism-VIEW + caption/credit + D74-purity + render + a11y/dignity, ×3-skeptic +
      critic → SAFE TO COMMIT, 0 blocking): 3 fixed — a MED credit-line WCAG contrast (opacity .72 → solid #5a4a2c,
      5.31:1) + 2 LOW Tubman provenance accuracy nits (postwar CDV date, seated-not-standing). probe-usct-imagery
      17/17; photo-embed 22/22 + arms-imagery 17/17 coexist; wcag AA. __ASSETS=172; file 4.6MB→5.0MB. **NEXT H1 =
      battle-scenes/leaders (Brady/Gardner) or flags-as-surviving-colours, or H2 footage — same hands-off mode.**›
      ‹increment 4 ✅ (D136, 2026-06-25): **PD LEADERS-IN-THE-FIELD IMAGERY on the Codex People cards.** Same
      "fully hands-off, edge-cases only" mode. The 24 Codex People entries had no image but the 4 USCT ones (D135);
      this gives the other **20 leaders** a famous Brady/Gardner/LoC/NARA/NPG WARTIME / in-the-field photograph
      (Lincoln@Antietam, Grant@Cold Harbor, Lee, Davis, Sherman, Jackson, Longstreet, McClellan, Meade, Thomas,
      Sheridan, Bragg, Cleburne, Farragut, Stanton, Seward, Stephens, Barton, Dix, Walker). `tools/source-leaders-imagery.mjs`
      + `tools/recon-commons.mjs` (NEW) + `tools/prep-embed-assets.mjs` `leaders` category (maxPx 400/q74/JPEG) +
      `src/52-leaders-imagery.js` (`leaderImageHtml(id)` → a captioned `<figure class="leader-img">` or `""`) wired
      into `84-codex.js` `_cxEntryHTML` as `usctImageHtml(en.id) || leaderImageHtml(en.id)` (USCT wins; at-most-one
      figure; "" when neither → byte-identical). DELIBERATELY COMPLEMENTARY to the 128px badge `portraits` tier (this
      is a 400px codex-resolution tier keyed by codex id). INFORMATIVE (descriptive alt + figcaption); captions
      citation-grade + anti-Lost-Cause (Stephens' Cornerstone Speech, Cleburne's emancipation proposal, Longstreet's
      vilification, Thomas the loyal Virginian, slavery named). **The VIEW discipline corrected 11 of 20 wrong pulls**
      (a "Jefferson Davis" = the UNION Gen. Jefferson C. Davis; a Stanton = a USCT family; a Seward = his daughter
      Fanny; group/montage photos; engravings). Combat byte-identical (probe-presets 26/26 + phased-ab 20/0-diff; no
      tactical/combat file touched per git-diff). A latent D135 probe-brittleness fixed (probe-codex XSS test asserted
      no `<img>` anywhere → corrected to assert the payload is neutralized; 18/18). Bug-hunt (env-throttled Workflow →
      salvaged PD-licence [all 20 PD] + anachronism-VIEW [all identities cleared] lenses + a standalone completeness
      critic → SAFE TO COMMIT, 0 must-fix). probe-leaders-imagery 15/15; flags 36/36 + weather 30/30 + render-richness
      30/30 + audio 22/22 prove 3D health; wcag AA (caption 6.86:1 / credit 5.35:1). __ASSETS=192; file 5.0MB→5.9MB.
      **NEXT H1 = battle-scene photographs on the pre-battle briefings (`bridgeBriefingHTML`, the dignity-sensitive
      Gardner/Brady field photos), or flags-as-surviving-colours, or H2 footage — same hands-off mode.**›
      ‹increment 5 ✅ (D137, 2026-06-25): **PD BATTLE-SCENE IMAGERY on the pre-battle briefing.** Same "fully
      hands-off, edge-cases only" mode. `tools/source-scenes-imagery.mjs` (Commons API → PD-only rasters +
      provenance, keyed by campaign BATTLE id, scorer penalizes maps/engravings/monuments/reenactments) +
      `tools/prep-embed-assets.mjs` `scenes` category (480px/q72/JPEG) + `src/51-scenes-imagery.js`
      (`sceneImageHtml(battleId)` → a parchment-framed **captioned `<figure class="scene-img">`** banner or `""`)
      wired into `85-battle-bridge.js` `bridgeBriefingHTML` as ONE guarded line at the head of the briefing (before
      the army columns). **6 of 9 marquee battles imaged:** bullrun1 (Sudley Ford), antietam (Gardner's "Bloody
      Lane" dead), fredericksburg (Rappahannock pontoons), chancellorsville (Russell's Marye's-Heights stone-wall
      dead), vicksburg (Shirley House siege lines), gettysburg (O'Sullivan's "A Harvest of Death"). **3 IMAGELESS +
      documented** (no clean PD wartime photo exists): malvern, shiloh, chickamauga. **DIGNITY-SENSITIVE** (the D135
      Fort-Pillow precedent): three plates are photographs of the dead, framed honestly + anti-Lost-Cause. The VIEW
      discipline caught + rejected 3 non-photographs (a 1917 birdseye panorama, the McElroy battle map, a book
      engraving). Combat byte-identical by construction (helper reads only __ASSETS + a static table, never fldRng;
      the briefing is a strategy-layer screen): `probe-presets` 26/26 + `probe-phased-ab` 20/0-diff. Bug-hunt 27
      agents (PD-licence + anachronism/dignity-VIEW + D74-purity + a11y + robustness × refute + completeness critic →
      SAFE TO COMMIT): 1 MED fixed (the gettysburg credit → "Smithsonian American Art Museum", matching the embedded
      plate). `probe-scenes-imagery` 16/16; wcag AA (caption 7.59:1 / credit 5.93:1). __ASSETS=198; embed 2.36MB raw.
      **NEXT = the H5 UG:G-fidelity modern-engine push (movement feel first), or flags-as-surviving-colours, or H2
      footage.**›
- [x] **H1b Brigade BADGES & INSIGNIA — the battle flags (Aaron, run-k idea, 2026-06-15).** Render each brigade's
      identity with its **battle flag / colors** on the unit badge: the various Confederate battle flags (ANV
      Southern Cross, Hardee/Polk Western patterns, the national flags), the U.S. national & regimental colors,
      and the **Army of the Potomac corps badges** (Kearny patch, the corps shapes/colors). Tasteful period
      engraving on the 2D/3D unit markers + the selected-brigade HUD; CVD-safe (shape + label, not flag-color
      alone); honor reduceMotion. Pairs with the B-4 arm markers (gun/limber + trooper) already shipped.
      ‹partial: `src/tactical/T10-flags.js` shipped unit flags/insignia; 2026-06-18 follow-up replaced the 3D SVG TextureLoader warning path with cached canvas-backed `CanvasTexture` maps and disposal hooks. `tools/probe-tactical-visuals.mjs` now fails on the known Three.js texture warning and passes with `textureWarnings:0`. Broader Phase-H visual polish remains open.›
      ‹✅ DONE (D131, 2026-06-25): **FLAGS & INSIGNIA DEEPENING** — DEEPENED `src/tactical/T10-flags.js` (D91 deepen-not-replace), fixing three real defects in the prior code (2D drew blank rectangles; corps-badge SHAPES never rendered + a wrong map [II=circle, V/VI both "cross"]; badges shown regardless of date + a roman-numeral substring bug reading "II Corps"→"I Corps"). Now: **battle-AWARE flag selection** (`_FLD_BATTLE_META`: First National "Stars and Bars" at Bull Run — the ANV battle flag didn't exist 21 Jul 1861, its creation was prompted by the flag confusion at Manassas — + early West; ANV Southern Cross mid-war East; Hardee disc / Polk cross in the Army of Tennessee; Longstreet's transferred Eastern brigades [Hood/Kershaw/Law] flying the ANV flag even at Chickamauga); **corrected Kearny-patch corps-badge SHAPES drawn as glyphs** (I=disc, II=trefoil, III=diamond, V=Maltese cross-pattée, VI=Greek cross [distinct], XI=crescent, XII=star) division-coloured (1st red/2nd white/3rd blue) with a legibility halo, always shape+label (CVD-safe); the **anachronism GATE** (badges only at the Eastern post-21-Mar-1863 fields Chancellorsville + Gettysburg; earlier fields name the adoption date as a teaching beat); a working 2D draw (cached canvas blit, fog-gated) + a deepened HUD (flag thumbnail + badge swatch + provenance caption). PURE presentation — reached via the existing T0 typeof seams, reads sim read-only, never `fldRng`, no save-version bump → combat byte-identical by construction (`probe-presets` 26/26; the install block wraps only `fld3dBuildUnits`/`fld3dDispose` via the `_fldFlagKeep` marker-propagation helper). Citation-grade content (research+verify Workflow, 25 agents, ≥2 sources each, anti-Lost-Cause; added the Chickamauga ANV-transplant split + the Vicksburg Western-flag default; softened "G.O. 53"→"Hooker's Circular of 21 Mar 1863"). Bug-hunt 46 agents (critic HIGH): 1 confirmed (a PRE-EXISTING base T0/T8 phased-3D rebuild bug — SURFACED for a dedicated fix, NOT introduced by H1b) + 3 in-scope fixes (reinforcement re-skin, badge halo, fog-gate probe coverage); wcag AA no-changes. `probe-flags` 36/36; `probe-presets` 26/26 byte-identity; `probe-atmospherics` 18/18 · `probe-weather` 30/30 · `probe-render-richness` 30/30 · `probe-audio-ambience` 22/22 (all coexist); `probe-tactical-visuals` 10/10; `diag-classic` 346; `bootprobe` realErrors:[]; `t1probe` 14/14. **NEXT in H = H1/H2 PD imagery + footage (SURFACE first — external assets).**›
- [~] **H2 Reenactment footage** cutaways at key beats (skippable, offline→procedural fallback). **D170 (2026-06-30) completed the provenance-gated fallback shell:** `data/footage-cutaways.json` + `src/104-h2-cutaways.js` add an optional/skippable Field cutaway on the H0 battle briefing, reusing existing embedded PD scene stills where already vetted and procedural map art for imageless battles. Actual moving-image slots remain disabled with no source path, no external URL, and pending PD provenance; no external asset fetch/runtime web dependency was added. Focused `probe-h2-cutaways` plus scenes/bridge/H0-briefing/a11y adjacent probes passed; full footage ingestion remains a future per-asset provenance task.
- [~] **H3 Richer 3D/animation** on the tactical engine (reuse run-h PBR/HDRI/post-FX); D145 UI law supersedes broadsheet-everywhere, reserving broadsheet for press/dispatch/provenance surfaces.
      ‹partial: 2026-06-19 D85 adds a procedural 3D objective beacon to the live tactical engine and extends `tools/probe-tactical-visuals.mjs` to 8 captures with beacon-coordinate assertions. Broader H3 rendering/animation/readability work remains open.›
      ‹H3-i1 ✅ (D127, 2026-06-24): **BATTLEFIELD GUNSMOKE ATMOSPHERICS** — `src/tactical/T16-atmospherics.js`, procedural black-powder smoke / artillery muzzle-belch / impact dust on the real-time engine (2D canvas sprite stamps + a 3D `THREE.Points` cloud + a tiny per-particle shader); the period "fog of war." PURE presentation — touches NO combat file (wraps `fld2dDraw`/`fld3dRender`/`fldExit` by assignment, own LCG, never `fldRng`) → combat byte-identical by construction; reduceMotion/`atmospherics="off"`-gated, `fldLow()` perf-budgeted + a driver `gl_PointSize` clamp, fog-aware (no smoke betrays a hidden enemy), CVD-safe. `probe-atmospherics` 18/18; `probe-presets` 26/26 byte-identity; `probe-tactical-visuals` 10/10; bug-hunt 14-agent invariantsHold=TRUE (2 LOW fixed).›
      ‹H3-i2 ✅ (D128, 2026-06-24): **WEATHER + TIME-OF-DAY ATMOSPHERE** — `src/tactical/T17-weather.js`, re-tints the 3D background/fog/sun/hemisphere + washes the 2D canvas per a citation-grade per-battle `weather` hint (sky clear/overcast/rain/fog/haze/snow × time dawn/morning/midday/afternoon/dusk) + procedural rain/snow `THREE.Points` precipitation + a one-time accessible weather note. **Marquee: Antietam's dawn Cornfield ground-fog**; the rest get faithful time-of-day light (the honest finding: the "fog of war" at most battles was POWDER-SMOKE/T16, not weather → only Antietam is non-clear). Data from an 18-agent research+verify Workflow (≥2 sources, anti-fabrication; Gettysburg haze→clear, Fredericksburg fog→clear-with-note, Shiloh rain-was-overnight). PURE presentation — wraps `fld3dInit`/`fld3dRender`/`fld2dDraw`/`fldExit` by assignment, own LCG, never `fldRng` → combat byte-identical by construction (a missing/`clear`-`midday` hint → null → ZERO change). reduceMotion suppresses precip keeps tint; `weather="off"` opt-out; fog far ≥1500 (objective readable); `fldLow()` budget + `gl_PointSize` clamp; CVD-safe. `probe-weather` 30/30; `probe-presets` 26/26 byte-identity; `probe-atmospherics` 18/18; `probe-tactical-visuals` 10/10; bug-hunt 1 HIGH (note re-fire, keyed on mutating seed) + 1 LOW (inherited-property sky) fixed. **NEXT in H3 = i3 terrain/unit render richness** (+ per-phase weather candidate). Design at `.tmp/phase-h-design.md`.›
      ‹H3-i3 ✅ (D129, 2026-06-24): **TERRAIN & UNIT RENDER RICHNESS** — `src/tactical/T18-render-richness.js`, the battlefield made to feel alive: (1) 3D ground vertex-colour enrichment (grass mottle + dry-ochre/damp-lush/bare-earth patches + tilled crop-row corduroy, positions untouched → units never float); (2) woods wind-sway (per-cone tilt-about-base on the InstancedMesh); (3) banner cloth ripple (per-unit flag twist/dip); (4) selection-ring pulse + a march bob for moving brigades; (5) a casualty fade-out on death; + 2D equivalents (a CACHED soft field-grain, a selection halo, the same fade). PURE presentation — wraps `fld3dBuildTerrain`/`fld3dRender`/`fld3dSyncUnit`/`fld2dDraw`/`fldExit` by assignment, analytic noise (never `fldRng`), reads `u.*` read-only writes no sim field → combat byte-identical by construction (proven by `probe-presets` 26/26 AND a new per-burst sim-field-invariance assertion). reduceMotion suppresses all motion keeps the static texture; `renderRich="off"` opt-out; `fldLow()` budget; the 2D grain blits a cached offscreen canvas (no per-frame fillrate); CVD-safe; no new DOM → wcag N/A. Bug-hunt 37-agent (6 diverse-lens finders × 3-skeptic default-refute + critic, confidence HIGH): 1 substantive (the cumulative casualty-fade sink ~125yd → fixed ABSOLUTE ~5yd) + 7 real LOWs (fog-ghost guard, selected-ring fades, T10 flag transparent-flip, 2D grain cache, renderRich-off mid-battle revert, probe sim-field invariance, swallowed-exception counter) ALL FIXED; probe 24→30. `probe-render-richness` 30/30; `probe-presets` 26/26 byte-identity; `probe-atmospherics` 18/18; `probe-weather` 30/30; `probe-tactical-visuals` 10/10. **NEXT = H4 audio → H1b flags → H1/H2 PD imagery (SURFACE first).**›
- [~] **H4 Richer audio** ‹LOCKED: Phase H›: PD period tunes + battlefield/camp soundscapes + UI cues, all
      accessible (toggles/captions/volume), default off. ‹partial: `src/tactical/T9-audio.js` / audio work exists in recent repo history; full Phase-H polish still pending.›
      ‹BASE-ENGINE FIX ✅ (D132, 2026-06-25): **MULTI-PHASE 3D SCENE REBUILD** — the combat-path candidate Aaron chose (over the H1/H2 external-asset layer, deferred). Fixes a PRE-EXISTING base bug D131's bug-hunt surfaced (git-traced to predate T10/H1b): the 4 multi-phase battles (Antietam/Gettysburg/Chickamauga/Vicksburg — each phase has its own distinct sector terrain + objective) advanced their phase in 3D by swapping in a fresh unit cast + terrain + objective (T8 `_fldAdvancePhase`→`_fldBuildPhase`) but NEVER rebuilt the live 3D scene → new brigades invisible (no `_u3d` group), prior meshes orphaned, woods/walls/objective-beacon stranded at the old sector (2D + headless sim unaffected). New `fld3dRebuildPhaseScene()` (T0), called from `_fldAdvancePhase` when `mode3d`, re-runs the `fld3dInit` per-phase build sequence (terrain+units+officers/supply/arms/flags/eng) + re-aims the camera; per-phase terrain meshes tracked in `__FIELD._phaseScene` + disposed at the top of `fld3dBuildTerrain`. Combat byte-identical BY CONSTRUCTION (headless never enters it) — proven 3 ways: `probe-presets` 26/26 + a new `probe-phased-ab` headless A/B (4 battles × 5 seeds, 20 comparisons, **0 diffs**) + the 4 per-battle outcome probes. Confirmed empirically FIRST (`probe-phased-3d` FAILED pre-fix: coverage=0/orphans=6/beacon-stranded; PASSES 64/64 post-fix). Bug-hunt (6 Opus finders) → 4 findings, ALL one GPU-leak class the rebuild introduced, ALL FIXED: `fld3dBuildEng` + `fld3dBuildWater` (T13) made self-disposing (were leaking the prior phase's eng-works/river meshes) + the T8 catch made diagnosable; completeness self-check confirmed the leak surface fully closed. `probe-phased-3d` 64/64 · `probe-presets` 26/26 · `probe-phased-ab` 20/20 · atmospherics/weather/render-richness/audio/flags/tactical-visuals all coexist · `diag-classic` 346 · `bootprobe` realErrors:[] · wcag N/A (no new DOM). **NEXT = H1/H2 PD imagery (SURFACE first — external assets) → per-phase weather candidate.**›
      ‹H4 increment ✅ (D130, 2026-06-25): **BATTLE-AMBIENCE DEEPENING** — new `src/tactical/T19-battle-ambience.js`, a default-OFF, opt-in, stereo-SPATIALIZED procedural battle-soundscape bed layered UNDER the existing T9 din+SFX (the D91 deepen-not-replace path): a rolling-fire noise WASH (swell-LFO, intensity-tracked) + a gated cannonade sub-bass RUMBLE + located cannon/musket REPORTS panned by field-x and **fog-gated** (a hidden foe makes no located sound → pairs 1:1 with the T16 gunsmoke). PURE presentation — wraps `fld3dRender`/`fld2dDraw`/`fldExit`/`_fldAudioPanelRows` by assignment (generic marker-chain propagation), own AudioContext, reads sim read-only, never `fldRng`, no `_SAVE_VER` → combat byte-identical by construction (`probe-presets` 26/26 + a 240× pure-audio-tick sim-seed-invariance assertion). reduceMotion fully suppresses; `battleLoud` scales (off→silent) + master capped under the din; defers reports until ctx running (no first-gesture stampede); self-silences on 'over'; node-pool bounded + disposed on exit; accessible toggle row reuses T9's AA-vetted panel → wcag N/A. Bug-hunt 19-agent (6 lenses × 3-skeptic + critic, confidence HIGH): 1 confirmed (caption one-shot) + 2 critic edge-bugs (suspended-ctx stampede, 'over' idle drain) + 1 LOW (panner cap dilution) ALL FIXED; probe 19→22. `probe-audio-ambience` 22/22; `probe-atmospherics` 18/18 · `probe-weather` 30/30 · `probe-render-richness` 30/30 (all coexist); `probe-tactical-visuals` 10/10. **NEXT in H = H1b flags → H1/H2 PD imagery (SURFACE first).**›

- [x] **H5 — THE UG:G-FIDELITY MODERN-ENGINE PUSH** ‹⭐ Aaron, 2026-06-25 — LOCKED direction; memory `civilwar-modern-engine-ugg-fidelity` + `civilwar-terrain-readability`›: **the modern (non-hex) battle engine must look AND play better than Ultimate General: Gettysburg (UG:G) on PS4.** Two engines, two jobs (do NOT conflate): the **hex/box map IS Classic** — keep as-is; the **modern engine has NO hex boxes** — fluid UG:G-style motion with **drag-click-and-direct** movement & charge orders, formation facing, and a **fortify/entrench option**. Build order (AskUserQuestion 2026-06-25):
      - **H5-i1 — MOVEMENT & ORDERING FEEL (FIRST) ✅ DONE (D139, 2026-06-25):** the modern engine now moves & obeys like UG:G — **point + facing-handle** move (tap keeps facing; drag swings a visible handle arrow; a moving unit's handle re-aims), **drag-onto-enemy charges THAT brigade**, **immediate + shift-queue** waypoint routes, a live ORDER GHOST in 2D + 3D, and **faster digging** (T13 `DIG_TIME_BASE` 70→42). NEW `src/tactical/T20-order-feel.js` is the PLAYER CONTROL SURFACE only — the AI/headless sim is untouched, so `probe-presets` 26/26 + `probe-phased-ab` 20/0-diff prove the per-battle outcomes stay byte-identical even though this is the D74 carve-out. Gameplay-vetted by NEW `tools/probe-order-feel.mjs` (12/12). Aaron's 4 forks locked via AskUserQuestion; bug-hunt 31-agent SAFE, 4 render/a11y fixes bundled (CVD-by-shape ghost + 3D depthWrite/renderOrder). (Orig scope: smooth drag-to-move/charge, click-direct orders, formation facing, fortify/entrench — zero grid snap; base = `fldLaunch*` / `tactical/T*`; vetted as gameplay, not under D74.)
      - **H5-i2 — VISUAL FIDELITY ✅ DONE (D140, 2026-06-25):** the **polished HYBRID** look — the modern engine now LOOKS better than UG:G, ADDITIVELY (keeping the period palette; NO global tone-map flip). NEW `src/tactical/T21-visual-fidelity.js` wraps the render seams BY ASSIGNMENT with 5 layers: ground RELIEF (slope-AO vertex recolour — low ground darkens / crests lift, normalized to the battle's height range, + steep-slope soil tint), per-brigade soft CONTACT SHADOWS (a glued ground pool), a gradient SKY DOME (horizon tracks the live fog colour) + a CSS VIGNETTE, a stylized rank MAP on each slab (massed-infantry read, CVD-safe), and Max-tier 3D PEG RANKS (`!fldLow()`, bounding-sphere-cullable). **PRESENTATION-ONLY → the FULL D74 byte-identity law** (the inverse of i1's gameplay carve-out): writes vertex COLOUR only, never sim/`fldRng`/`_SAVE_VER` → proven `probe-presets` 26/26 + `probe-phased-ab` 20/0-diff. Aaron's 3 forks (AskUserQuestion): scope=Max · colour=stay-linear · relief=Moderate. The r128 tone-map/sRGB flip + real shadow maps + MeshStandard terrain were all EXCLUDED by a 5-agent recon (split-pipeline seam / InstancedMesh depth bug / darker-without-envMap). NEW `tools/probe-visual-fidelity.mjs` 26/26 + screenshot VISUALLY CONFIRMED; bug-hunt 19-agent SAFE (0 confirmed). *(Note: earlier checklist drafts mislabeled this "i3" — the locked D138 build order is movement→VISUAL→terrain→forts; corrected here.)*
      - **H5-i3 — TERRAIN READABILITY ✅ DONE (D141, 2026-06-26):** the modern engine now makes high/low ground (+ every topography type) EXPLICIT. NEW `src/tactical/T22-terrain-readability.js` wraps the render seams BY ASSIGNMENT: **3 elevation modes** on `G.settings.fldElevMode` (default **HILLSHADE** = T21's relief, no double-count / **CONTOURS** = iso-lines+labels / **COLOR-BY-HEIGHT** = a CVD-safe **Viridis** hypsometric tint), cycled from the T6 settings drawer + an **R** hotkey + the legend's mode chip; an **always-on compact LEGEND** (mode chip + viridis gradient + a live on-hover **elevation+type READOUT** from `__FIELD.hover`+`fldTerrainH` + a topography key of the types present); **all topography distinct** incl. NEW **swamp/town/fort** render types (`terrain.swamps/towns/forts[]`, visual-only this increment). The 2D top-down (which had NO relief) gets cached hillshade/hypso/contour layers; the 3D hypso+contour are prebuilt overlays `.visible`-toggled per mode. **PRESENTATION-ONLY → the FULL D74 byte-identity law** (the swamp/town/fort arrays are combat-INERT — read by no sim fn; the mode is a sim-unread `G.settings` key): proven `probe-presets` 26/26 + `probe-phased-ab` 20/0-diff + `probe-bullrun` 15/15 (golden snapshot + a new combat-inert guard). Aaron's 3 forks (AskUserQuestion): palette=Viridis · legend=always-on-compact · scope=add-swamp/town/fort. NEW `tools/probe-terrain-readability.mjs` 26/26 + screenshot VISUALLY CONFIRMED; **43-agent bug-hunt** → 4 confirmed + 2 critic-new, ALL FIXED (2D-contour offscreen-cache perf · legend focus-restore · phase-advance key-refresh · localStorage drop · double-dispose · hover coarse-cell). `wcag-auditor` AA. (Base used: `fldBuildTerrain`/`fld3dBuildTerrain` + `fldTerrainH` + T18-render-richness + the T21 relief; `tcDecorateMap` is the Classic-hex cover system, not the modern engine — swamp/town/fort are NEW modern-engine render types here.)
      ‹D142 note: swamp/town/fort were visual-only in D141; H5-i4 now wires those same arrays into universal T0 cover/move hooks while T22 remains presentation-only.›
      - **H5-i4 — FORTIFICATIONS DEPTH ✅ DONE (D142, 2026-06-26):** the modern engine now treats fortifications as staged works, not a flat bonus: rifle pits / hasty cover → full parapet → redoubt/earthwork, with stage-aware HUD and visible 2D/3D earthworks. `fldEngCover` is facing-aware (front strongest, flank reduced, rear bypass still matters), abandoned works stop sheltering the unit, and prepared abatis tied to own parapets/redoubts is stronger, slower, clearer, and harder to clear. This increment also completes the deferred H5-i1 charge-impetus lock (1.2s correction grace, then committed player charges resist move/hold/queue/re-aim until contact, target/fog loss, own rout, or death) and wires D141 swamp/town/fort into the universal T0 cover/move hooks (fort/town hard cover/friction, swamp soft concealment + major slow). **D74 gameplay carve-out:** one universal combat model, no per-battle damage fudge; AI inline charges unchanged. Vetted by `probe-engineering-corps` 23/23, `probe-terrain-readability` 29/29, `probe-order-feel` 13/13, `probe-bullrun` 15/15, presets 26/26, phased A/B 20/0-diff, full no-regression, and `diag-classic` nonBlank:346. Bug-hunt found/fixed own-rout/death charge-lock release.
      - **H5-i5 / asset bridge + formation figures ✅ FOCUSED-GATED (D162, 2026-06-29):** modern units now have optional local Tripo-compatible GLB/GLTF slots (`data/tripo-unit-assets.json`, `src/tactical/T23-tripo-unit-assets.js`) and procedural infantry formation figures (`src/tactical/T24-formation-figures.js`). No runtime Tripo/API/account/credit calls; canonical slots disabled until optimized local files, license/provenance proof, and detailed/Ultra source metadata exist. Formation figures are rich/high-tier only; low tier and `renderRich="off"` restore markers. Focused probes: importer OK (`records=8 enabled=0 detailedSlots=8 pendingLicense=8`), build GATE OK, `probe-formation-figures` 16/16, `probe-tripo-unit-assets` 15/15, 0 pageerrors. Full battery deferred to planned-work batch/release gate.
      - **ASSET BUDGET (locked):** **self-contained core + optional HD pack** — ship the ONE file looking great on its own (procedural/Three.js, opens offline anywhere) AND offer an OPTIONAL downloadable HD texture/model pack for max fidelity (extends the run-k linked-assets relaxation). No Phase-H media lib may require `SharedArrayBuffer` (D71 guardrail).

### Phase I — LOOT / SURVIVAL + "THE SOLDIER'S STORY"  ‹⭐ CORE PILLAR — D91 (loot) + D93 (the character/journey layer)›
- [x] Standalone rarity-tiered loot + inventory (all modes) · light survival (rations/weather/forage/disease,
      default off) · the Oregon-Trail journey mode. All preset-gated (§27). **D148 shipped the first playable
      Campaign Kit:** rarity-tiered drops, bounded inventory, use/equip/forage controls, default-off survival,
      gated bridge deltas, and `probe-loot-survival`.
- [~] **"The Soldier's Story" (D93, Aaron) — build AFTER the C+E roadmap; unified with the journey mode above.**
      An EA-Sports-style **prosopography DB** — *every identifiable individual* (granularity = exhaustive) with
      **bio, stats/ratings, character history, portrait, team (army→corps→division→brigade→regiment→company)** — +
      a **play-as-anyone whole-war mode**: pick any person, choose when+where to start, proceed from their **REAL
      rank/position**, then play forward into alt-history. Bottom-up build: (1) granular OOB + per-person/regiment
      **detail cards** (DATA, reuses teaching cards, NO engine change — brigades stay one marker per the D68
      zoom-deferral) → (2) codex **person/unit axis** (Phase E/S4) → (3) the **playthrough mode** (career/trajectory
      model + start-anywhere engine) → (4) **interpersonal/romance** (women-in-the-war / USCT / immigrant hooks;
      period-honest, anti-Lost-Cause). **Hard prereq: accurate rank+position+unit per person — the D92 roster
      hardening is its first roster data.** **D148 shipped the playable spine:** `ssPersonRegistry` enumerates the
      current modeled roster (authored personas + generals/commission pool + representative rows for every current
      tactical brigade token), the Campaign Kit exposes all current registry people for play-as-anyone journey starts
      (603 selectable people in the current build), and generated rows remain `Inferred`. **D150/D151 shipped the first
      player-facing depth pass:** searchable Army Register cards, detail/provenance/team display, selected-person career
      persistence, battle association, status history, promotion count, and after-action report tie-in. **D154-D158 plus D172 shipped
      six narrow citation-grade named-person slices:** Elisha Hunt Rhodes replaces one generated Bull Run private
      row with a sourced Verified record and portrait; William McCarter replaces one generated Fredericksburg Irish Brigade
      private row with a sourced Verified record and no unsupported company/portrait claim; Sam R. Watkins replaces one
      generated Chickamauga Confederate private row with a sourced Verified record, 1st/27th Tennessee / Company H honesty,
      and no unsupported portrait claim; Joshua L. Chamberlain replaces one generated Gettysburg 20th Maine command row with
      a sourced Verified record and no unsupported company/portrait claim; Alonzo H. Cushing replaces one generated Gettysburg
      Battery A command row with a sourced Verified record and no unsupported portrait claim; Strong Vincent replaces one generated
      Gettysburg Vincent's Brigade command row with a sourced Verified record and no unsupported portrait, company, regiment-command,
      or brigadier-rank-at-battle claim. **Still open:** citation-grade named bios/portraits/unit detail
      at scale for every identifiable person, richer start-anywhere career trajectory, and later interpersonal hooks.
      (Memory `civilwar-soldiers-story-pillar`; DECISIONS D93/D148/D150/D151/D154/D155/D156/D157/D158/D172.)
- [~] **CONSOLIDATED PHASE-I CONTINUATION QUEUE — execute in this order; Codex/Claude should treat this as the
      next task queue, not split it into disconnected tasks.** Stop only at a clean committed/pushed milestone if
      context is nearing compaction; keep Q5 Chattanooga + Q6 USCT playable battles LAST.
      1. ~~**D149 — Loot/survival hardening + gate expansion:** adversarially probe save/load tampering, duplicate and
         stack exploits, inventory overflow, journey restart abuse, survival tick timing, inactive bridge leakage, and
         Campaign Kit screenshot/UI assertions. Likely files: `src/37-loot-survival.js`,
         `tools/probe-loot-survival.mjs`, targeted save-slot assertions. Gate: focused probe + save-slots + bridge +
         full-campaign/Classic slice.~~ ✅ **Shipped 2026-06-28:** hardened restored Campaign Kit state, strict active
         gates, stack/overflow/restart guards, screenshot/UI assertions, and full `npm run vet:noreg` 79-command gate.
      2. ~~**D150 — Army Register / person-unit axis:** turn the 603-person current registry into a searchable/filterable
         register with person detail cards, side/rank/provenance/unit filters, generated-vs-Verified display, team
         hierarchy, and journey start from card. Likely file: `src/37-loot-survival.js` unless size/ownership argues for
         a new adjacent module. Gate: focused UI probe with full-registry, search/filter, detail-card, provenance, and
         journey-start assertions.~~ ✅ **Shipped 2026-06-28:** full 603-person Army Register cards, live search/filter,
         detail cards, generated/Authored + Inferred/Verified display, full team hierarchy preservation, card journey
         start, and locked active-journey restart UI; focused probe + full `npm run vet:noreg` 79-command gate.
      3. ~~**D151 — Soldier's Story journey persistence:** selected-person career log, battle association, status changes
         (wounded/captured/alive where low-risk), promotion hook through `fldPromotePerson`, survival consequences,
         save/load safety, and a small after-action/end-report tie-in if it stays bounded. No tactical/combat effect
         unless explicitly active and gated. Gate: focused journey probe + campaign-link/save-slots/full-campaign slice.~~
         ✅ **Shipped 2026-06-28:** bounded selected-person career log, battle association, alive/wounded/captured status
         persistence, survival consequences, generated-row promotion through `fldPromotePerson`, active-only bridge
         deltas, after-action/final-report tie-in, save/load/tamper sanitation, and full `npm run vet:noreg` 79-command
         gate.
      4. ~~**D152 — Citation-grade replacement tooling:** schema/probe/import tooling for replacing generated representative
         rows with sourced named people later. Do not fabricate historical people; build validation/provenance gates and
         templates, not bulk unsourced content.~~ ✅ **Shipped 2026-06-28:** empty canonical replacement pack,
         documented format, CLI validator/importer, runtime overlay seam, build-gate 4f, no-regression importer hook,
         focused hostile-pack/replacement-overlay probe, and full `npm run vet:noreg` 80-command gate. No sourced
         historical people were added.
      5. ~~**D154 — First citation-grade named-person replacement slice:** add one small, source-verified Soldier's Story
         replacement only if the provenance survives validation.~~ ✅ **Shipped 2026-06-28:** Elisha Hunt Rhodes replaces
         `ss:bullrun1:US:us_burnside:pvt`; source trail corrected to RIHS `Mss1089` + Rhode Island Heritage + NPS + LoC;
         optional portrait metadata, Soldier detail source/bio rendering, non-empty canonical replacement-pack probes, and
         the 156-portrait embed baseline are locked. Broad replacement scale-out remains open.
      6. ~~**D155 — Second citation-grade named-person replacement slice:** add one more small, source-verified Soldier's Story
         replacement only if the current modeled registry honestly fits.~~ ✅ **Shipped 2026-06-29:** William McCarter replaces
         `ss:fredericksburg:US:us_irish:pvt`; HSP/NMCWM/NPS source trail verifies private / 116th Pennsylvania / Irish Brigade /
         Fredericksburg fit; no company or portrait is asserted; canonical replacement pack now has 2 `Verified` records.
         Broad replacement scale-out remains open.
      7. ~~**D156 — Third citation-grade named-person replacement slice:** add one more small, source-verified Soldier's Story
         replacement only if the current modeled registry honestly fits.~~ ✅ **Shipped 2026-06-29:** Sam R. Watkins replaces
         `ss:chickamauga:CS:cs_cheatham_woods:pvt`; NPS/Project Gutenberg/NPS unit-detail source trail verifies private /
         Company H / First Tennessee / Chickamauga fit and the 1st/27th Tennessee / Maney's Brigade battlefield context;
         no portrait is asserted; canonical replacement pack now has 3 `Verified` records. Broad replacement scale-out remains open.
      8. ~~**D157 — Fourth citation-grade named-person replacement slice:** add one more small, source-verified Soldier's Story
         replacement only if the current modeled registry honestly fits.~~ ✅ **Shipped 2026-06-29:** Joshua L. Chamberlain replaces
         `ss:gettysburg:US:us_20th_maine:cmd`; NPS OOB / NPS Little Round Top / NPS unit-detail / ABT source trail verifies
         colonel / 20th Maine / Vincent's Brigade / V Corps / Gettysburg fit; no company or portrait is asserted; canonical
         replacement pack now has 4 `Verified` records. Broad replacement scale-out remains open.
      9. ~~**D158 — Fifth citation-grade named-person replacement slice:** add one more small, source-verified Soldier's Story
         replacement only if the current modeled registry honestly fits.~~ ✅ **Shipped 2026-06-29:** Alonzo H. Cushing replaces
         `ss:gettysburg:US:us_cushing_battery:cmd`; NPS / Army.mil / Congressional Medal of Honor Society source trail verifies
         1st lieutenant / Battery A, 4th U.S. Artillery / II Corps / Gettysburg fit; no portrait is asserted; canonical
         replacement pack now has 5 `Verified` records. Broad replacement scale-out remains open.
      10. ~~**D172 — Sixth citation-grade named-person replacement slice:** add one more small, source-verified Soldier's Story
         replacement only if the current modeled registry honestly fits.~~ ✅ **Shipped 2026-06-30:** Strong Vincent replaces
         `ss:gettysburg:US:us_vincent_bde:cmd`; NPS Gettysburg order of battle / NPS Gettysburg feature / American Battlefield Trust
         source trail verifies colonel / Army of the Potomac / V Corps / First Division / Vincent's Brigade / Little Round Top fit;
         no company, regiment-command claim, brigadier-rank-at-battle upgrade, or portrait is asserted; canonical replacement pack
         now has 6 `Verified` records. Broad replacement scale-out remains open.
- [~] **The RATING SYSTEM / "Madden layer" (D94) — the cross-cutting substrate this pillar is built on.** Design law: `RATING-SYSTEM-DESIGN.md`; increments R-0→R-6 (§9). Pulled AHEAD of Chattanooga (D94 fork 1). Shipped: **R-0** the data spine (`data/ratings.json` + `src/tactical/T14-ratings.js` pure fns + `tools/probe-ratings.mjs`; byte-identical) ✅; **R-1** officer derivation into the command + field pipes — persona→`gen.skill` (9 strategic-general personas, exact calibration) + persona→officer `quality`/`radius`/`fate` (explicit-`pid` opt-in, Bull Run cast) ✅ (D95); **R-2** the OVR read-out UI — A–F report-card grade on the Command desk (active card + appoint pool) + a tactical-HUD brigade-OVR line; pure display, byte-identical, WCAG-AA + CVD triple-encode ✅ (D96); **R-3** the badge engine (the first rating→combat seam) — guarded `fldBadgeFactor(u,lever)` (fire/rally/speed/melee) + the cohesion rally term + the realism-scaled per-lever stacking cap + the no-fudge OUTPUT-WALL build-gate (dot+bracket); ships the Star/Superstar positives + the Verified negatives (Slows/Piecemeal/Rigid/Green/Powder-Shy); badges-off byte-identical (proven across sandbox + 9 battles) ✅ (D97; vetted via a domcontentloaded byte-identity harness — the standard `load` suite was env-blocked by the THREE-CDN headless stall, see D97/HANDOFF); **R-4** the X-FACTORS (the dramatic "in the zone" surge, inside the no-fudge wall) — `fldXFactorStep`/`fldXFactorApplyCmd` (one-channel surge per badge: NON-speed→capped cmdBonus toward the 0.9 wall, SPEED→`_spdMul` [0.85,1.15]) + the combined-speed clamp [0.75,1.30] + a CVD-safe vector-bolt `_xfGlow` + a one-shot ⚡ announce; realism-scaled (arcade 1.45/balanced 1.20/historian 1.08); added Forrest's `first_with_the_most` (7 X-Factors); X-Factor-off byte-identical (proven 10/10 vs committed R-3); the no-fudge REPLAY GATE shows the surge BITES (flipped a US→CS win) yet bounded (17.2% delta) + capped (maxCmd 0.47); bug-hunt 23 agents → 7 latent findings all fixed ✅ (D98; vetted via the byte-identity harness, `load` still intermittently env-blocked); **Q7** the GM MATCHUP layer (the read-out payoff, §13/§14) — the **dual Attack/Defend OVR** on the Command desk (`_cmdGenDualOVR`: headline + ATK/DEF split, persona-tilt when rated / generals.json aggression-caution else; pills on the active card + appoint pool) + the **pre-battle matchup screen** on the side-choice card (`fldMatchupHtml`/`fldMatchupBoard`/`fldOOBSideOVR`: each army's force OVR + strength + commander + a labeled predicted-edge bar from the OOB); pure display, byte-identical (10/10 vs committed R-4), WCAG-AA 0 failures; multi-phase battles scoped to the **OPENING engagement** (anti-Lost-Cause fix — the all-phase sum had falsely favoured the CS at Gettysburg); bug-hunt 21 agents → 3 confirmed + 1 HIGH critic all fixed ✅ (D99); **Q8** the between-battle CAMP LOOP (§15) — a new "Camp" desk tab: DRILL the army (4 foci toward a ceiling, fatigue-limited; or DELEGATE) + PROGRESSION read-out (the general's reputation→OVR growth); `src/36-camp.js` (campInit/campDrill/campSetDelegate/campTrainingBonus[the bridge seam]/campOnResolve) feeds `bridgeArmy` a guarded bounded lift (musketry→firepower/maneuver→morale/entrenching→supply/endurance→fatigue + overall sharpness, ≤~8 overall); **byte-identical until the player ENGAGES the camp** (the `engaged` gate — proven: probe-camp keystone + bridge/conditioning 6/6 unchanged + byte-identity 10/10 vs Q7); combat seasons by casualty SHARE (win-up / bled-lion's-share-down); rides the save, no _SAVE_VER bump; bug-hunt 21 agents → 1 MED (the bloody dimensional bug — win-seasoning was dead) + 4 critic all fixed; wcag 0 ✅ (D100); **R-5** the PROSOPOGRAPHY SCALE-OUT (§5/§8/§9 — the D93 substrate) — a brigade carries ONE recomputable `fldMenMeanOVR` (O(1), no N-row build); `fldMaterializePerson` builds exactly one person row on demand + `fldBrigadeMuster` a HARD-CAPPED (≤6) muster sample (a 100,000-man brigade → 3 rows — the lazy-materialization invariant); generated rows get a deterministic synth period name + Inferred provenance + a `latentCommand` seed; `fldPromotePerson` is the latent-command **play-as-anyone** promotion (pure); `fldPersonTeam` the EA-style journey hook; `fldProvenanceStyle` makes Inferred (HATCHED) visually distinct from Verified (SOLID), CVD-safe; live-wired as a guarded **MEN OVR** HUD line beside the R-2 combat OVR; byte-identical (10/10 vs committed HEAD), probe-ratings 19/19, wcag 0; bug-hunt 11 agents → 2 confirmed + 2 critic (all LOW/latent) all fixed (defensive copies vs future career-write aliasing) ✅ (D101); **Q9** the GM PROMOTION economy (the first depth-chart MOVE, §12.2/§14.3) — a Command-desk "officer corps — promotions" section: `cmdPromote` raises a general one grade up a clean ladder (Brig.→Maj.→Lt. Gen.→General, parsed from the verbose `generals.json` rank by `_cmdBaseGrade`) spending a **multi-currency** budget (political capital `C.clock.capital` + a NEW `cmd.seniority` pool that accrues over the campaign, capped) gated on BOTH, **merit-gated** by reputation (EARNED → +confidence; ABOVE-merit → ×1.8 capital + a jealousy rep HIT that can LOWER his OVR — rank ≠ competence, anti-Lost-Cause) with a leapfrog seniority surcharge; reaches the fight ONLY via a small BOUNDED skill lift (`_cmdPromoteSkillLift` ≤6 → the EDITED `_cmdEffectiveSkill(gen,C)` → `_cmdGenRating` → `commandLeadership` → the bridge — an INPUT, never the scoreboard); **byte-identical until the player promotes** (0 lift un-promoted; proven 10/10 vs committed HEAD `fc1d251` + a live sanity: promotes "Lt. Gen.", lead 79→80, un-promoted identical); all in `src/35-command.js` + a `promotion` config in `data/ratings.json`, rides the save (no `_SAVE_VER` bump); `probe-command` 25/25, wcag 0 AA failures; bug-hunt 7 Opus agents → 2 confirmed + 1 critic (ALL LOW/latent, 0 HIGH/MED; critic "SOUND, may commit") all fixed (capital gate/spend one-lens; unrecognized-rank fallback → lowest grade; load-clamp a tampered seniority) ✅ (D102); **R-6 (citation-provenance portion)** the CATALOG-WIDE citation hardening — an audit found **47 records across 6 data files** stamped `Verified` with <2 sources (badges 13 · personas 2 · weapons 9 · artillery 9 · engineering 8 · terrain 1 · cabinet 5); a 15-agent research+verify Workflow (web-checked, 0 fabrication) gave each ≥2 independent real sources, and a permanent build-gate (`tools/build.mjs` 4e, trim/case-normalized on either prov key, masking-proof) now FAILS the build on any `Verified`-with-<2; `beloved` held Inferred (Freeman held out as Lost-Cause-tinged), `grand_charge` upgraded Verified, `feared` de-Lost-Caused (Wyeth 1899→Hurst 1993); byte-identical sim (10/10 vs HEAD `5b12916`, no combat field touched), `probe-ratings` 20/20 + the catalog-invariant step, bug-hunt 34 agents → 1 MED + 15 LOW (all latent), the MED [gate strict-equality evasion] + key LOWs fixed, critic "SAFE TO COMMIT" ✅ (D103); **R-6 roster badge ASSIGNMENT** — 43 documented +/− commander/unit traits stamped onto the 9 battles' brigades via a central `data/ratings.json` `rosterBadges` map (`fldBrSpec`→`fldMakeUnit`, byte-identical when off; byte-identity 30/30 off==HEAD + 0 winner-flips-against-history; all 9 per-battle probes green WITH badges on — Pickett repulsed, Burnside breaks, the Rock holds; anti-Lost-Cause CS 12:6:4 / US 11:10; a badge-chip HUD; bug-hunt 16-agent SAFE) ✅ (D104); **R-6 LIVE DEV-TRAITS** — the Madden development arc: a hidden potential ceiling/floor + a development rate + an attrition drag per general (`data/ratings.json` `devTraits`: 12 archetypes × 20 Inferred+sourced assignments) SHAPES the `cmdOnResolve` reputation evolution → `_cmdGenRating` → the displayed OVR, so a general's rating develops over the war on his historical arc; **byte-identical for an unassigned general** (the literal pre-D105 clamp [5,98], proven across all 5 outcome quadrants + both rails); accurate-inputs never an output gate (build-gate 4d now scans `35-command.js`); anti-Lost-Cause (the Union elite are RISERS rated as high as Lee/Jackson — Grant/Sherman/Sheridan/Thomas; failures named both sides — McClellan plateau, Burnside/Hooker overpromoted, Bragg quarrelsome, Hood volatile); a Command-desk "Career Arc" read-out; `probe-command` 34/34, `probe-ratings` 21/21 (tactical untouched, byte-identical by construction), bug-hunt 29-agent SAFE (1 HIGH citation + 10 lower all fixed), wcag AA ✅ (D105) — **R-6 is now feature-complete**. **[OOB-MAPPING SUBSTRATE DONE — D106]** the shared blocker for the GM depth-chart MOVES + Q8b scouting: `src/tactical/T15-oob.js` (`fldCampaignOOB`/`fldOOBForSide`/`fldCampaignOOBHtml`) maps the strategic next-battle → a structured **commander→corps→brigade** OOB tree for both sides (authored real OOB where a scenario exists, else a deterministic Inferred derivation with **no fabricated officers**, D92/#4); a read-only **"Order of Battle"** roster board on the Command desk (player EXACT, enemy FUZZY — scouting deepens via a `reveal` tier); byte-identical (pure read, **0 removed lines vs HEAD `7df4372`**; build-gate 4d scans T15); bug-hunt 15-agent (1 HIGH phase-framing anti-Lost-Cause [the Q7 failure resurfacing at the display layer] + 4 MED, ALL fixed); `probe-oob` 14/14; full no-regression GREEN ✅ (D106); **Q8b** the between-battle cavalry **RECONNAISSANCE** (§15) — an "Order a reconnaissance" control on the D106 Order-of-Battle board spends political capital (`C.clock.capital`) to tier-reveal the **enemy** OOB via `fldCampaignOOBHtml`'s `reveal` param, scaled by the **appointed general's persona `cavalry`** (light unscouted → better [named commander + per-corps grade + posture, cav < 65] → full [the complete enemy OOB, cav ≥ 65]); the WRITE `cmdScout` (`35-command.js`) writes ONLY `cmd.scout` + capital (keyed to the next-battle id, fresh per engagement, save-sanitized, no `_SAVE_VER` bump), T15 stays a pure read-out (`_fldOOBSideScouted` "better"-tier renderer + `_fldScoutPosture`, honoring `C.flipAtk`); **byte-identical combat** (no combat path reads `cmd.scout`; all 10 battle probes unchanged); teaches cavalry-as-eyes (Stuart's rides; the Gettysburg intelligence vacuum); `probe-oob` 15/15 + `probe-command` 40/40, bug-hunt 9-agent invariantsHold (1 LOW rounding + 1 LOW flipAtk-posture fixed), wcag AA (1 contrast fix) ✅ (D107); **Q10** the CORPS DEPTH-CHART (the GM depth-chart MOVE, §12.1/§12.2/§12.4) — a Command-desk "The Corps Command — Depth Chart" section: `cmdSeatCorps`/`cmdVacateCorps` seat pool generals into the army's I–IV Corps billets (`cmd.corps`) spending `seatCost` political capital; each seated corps commander adds a small BOUNDED lift to `commandLeadership` (`_cmdCorpsLift` = clamp(Σ(effRating−64)×0.05, ±4)) — an INPUT, never the scoreboard (build-gate 4d scans 35-command.js + T15); **byte-identical until a corps is seated** (lift 0; a vacant billet = 0, NOT a penalty; proven by a 132-cell A/B vs HEAD `2d11bd7`); the grade-fit is **side-aware** (US corps = Maj. Gen., CS corps = Lt. Gen. — the CS Sept-1862 Lt. Gen. grade for Longstreet/Jackson) so only CS Stuart seats below grade until Promoted (the Q9 synergy); one corps per general, the army commander can't double-hold, `cmdInit` sanitizes on load; seated commanders NAME the player's derived corps on the OOB board (pure display, edge unchanged, enemy + Garrison node never named); `data/ratings.json` `corpsCommand` (Inferred + 2 sources); `probe-command` 49/49 + `probe-oob` 16/16, bug-hunt 11-agent invariantsHold (3 confirmed [1 MED seat-log wording + 2 LOW Garrison-guard/citation-date] all fixed), wcag AA (3 contrast fixes) ✅ (D108); **Q11** the COMMISSION move (the GM "bring a new officer into the pool" row, §12.2/§12.3) — the President COMMISSIONS the documented POLITICAL GENERALS (US Banks/Butler/Sigel/McClernand, CS Floyd/Pillow — a SEPARATE `data/generals.json` `sides[side].commissionPool`, never the starting roster) into his pool for `costPolitical` political capital, after which they're appointable/promotable/seatable like any general; LOW combat OVR / HIGH political value teaches that rank ≠ competence (a commissioned Banks fields leadership 49 vs Grant 87 — the §12.3 command-politics bind made playable, capped by `maxCommissions` 3); `cmdCommission` writes ONLY `cmd.commissioned`+capital+reputation, **byte-identical until you commission** (`_cmdRosterPlusCommissioned`===the bare roster when empty — proven by a 132-cell A/B vs HEAD `8eb913a`; the 3 GM moves gate on the commissioned set so an un-commissioned officer can't sneak in); 6 citation-grade figures via a 12-agent research+verify Workflow (records honest both sides, Pillow corrected to Brig. Gen., ratings Inferred + bios ≥2 real sources, gate-4e clean); `probe-command` 58/58, bug-hunt 12-agent invariantsHold (2 MED [function-level gate bypass + corps-label parse] + 3 LOW all fixed + probe-locked), wcag AA (no changes) ✅ (D109); **Q12** the DIVISION SUB-TIER (the next rung, §12.1 — Army→Corps→DIVISION→Brigade) — `cmdSeatDivision`/`cmdVacateDivision` seat pool generals into each seated corps's 3 division billets (`cmd.divisions = {corpsIdx:{divIdx:id}}`, a tree built on the Q10 corps chart) spending `seatCost` 2 political capital; each adds a small BOUNDED lift to `commandLeadership` (`_cmdDivLift` = clamp(Σ(effRating−64)×0.03, ±2)) deliberately smaller than the corps lift (cap 2 vs 4 → army ±17 > corps ±4 > div ±2); a division was a **Maj. Gen.'s** billet in BOTH armies (any Brig. Gen. seated leads belowGrade until promoted — the Q9 synergy); **byte-identical until a division is seated** (lift 0 via the fast-path; pre-Q12 saves read identically); one billet per man, vacating a corps cascades at the READ layer (`_cmdDivClean`:795), `cmdInit` sanitizes on load, no `_SAVE_VER` bump, NO RNG; `data/ratings.json` `divisionCommand` (Inferred + 2 sources Glatthaar/Weigley); **[CODEX code + CLAUDE close-out]** — Codex finished+committed (`7b64d2e`)+pushed the sound code but ran NO bug-hunt + wrote NO docs, so the close-out ran the bug-hunt (5 finders × default-refute verify + critic invariantsHold=TRUE; 1 LOW anti-Lost-Cause-balance in the teaching copy fixed copy-only — added the Union's Hancock-II-Corps divisions) + wrote the full doc trail; `probe-command` 69/69 0 pe, `diag-classic` 346, GATE OK, HTML byte-identical to source, **no tactical file touched → 9 battles byte-identical by construction**; the strategic `load` no-regression battery env-blocked by the THREE-CDN headless stall (shares no Q12 code, all green at Q11) ✅ (D110) — **the GM moves Appoint/Relieve · Promote · Corps · Commission · Division are now all shipped**. **DEFERRED:** the full muster-roll inspect-expand / "Army Register" UI → a later UI pass (`fldMusterRollHtml` ships probe-vetted + ready); **the rest of the GM §12** — the **symmetric AI-GM** (still needs an enemy-command shadow wired to combat without breaking byte-identity / the no-fudge wall — [hard]; T15 gives it a roster to draft over), cross-theater **Transfer** (still needs authored `theater` fields — `generals.json` has none), and the §12.3 **ELECTION-SUPPORT relief-bind** for the political generals (needs the 1864-election state — pairs with the E victory/election work). Next: **the GM follow-up increment** (AI-GM + Transfer/election-bind) → the **E strategic arc** → Phase F/I/H/J → **Q5 Chattanooga + Q6 USCT battles LAST**. (DECISIONS D94–D110.) **[Context-budget rule: at ≤25% context, stop at a clean milestone + hand off — START-HERE standards / AUTONOMOUS-RUN §3 / memory.]**

### Phase J — POLISH / META
- [x] **Saves** ‹D146 complete›: localStorage + named slots + export/import hardening; one-turn undo on the accessible non-Ironman preset. `src/91-save-slots.js` now validates/clones saves, rejects stale/corrupt/tampered payloads (including `settings.hasOwnProperty` shadow), hardens named slot load/delete/rename, routes pasted JSON and file import through the same validator, dedupes/reinjects the Save Manager after menu rebuilds, and is locked by `tools/probe-save-slots.mjs` 9/9 plus the normal no-regression gate.
- [x] Mod-friendly data + shareable scenarios ‹D147 complete›. Custom battles now have a documented `cw_custom_battle_v1` / `cw_custom_battle_pack_v1` format, template export, pack export/import, empty-slot install, duplicate/tamper/per-battle-fudge rejection, and a focused probe extending `tools/probe-custom-battle-builder.mjs`. Save-file share/import hardening is complete (D146). **Hosting DEFERRED** (GitHub Pages on request — D54).
      **Publish options when wanted (D71):** GitHub Pages (simplest for one file) OR itch.io + Butler (best indie
      discovery + in-browser play + auto-deploy); Vercel unnecessary. **$0 nuance:** Pages on a PRIVATE repo needs
      GitHub Pro — for true $0 use a public deploy repo or itch.io; rename `civil_war_generals.html`→`index.html` at publish.
- [x] **Full-campaign playthrough probe** added as a dedicated no-regression gate (D54/D143/D145): `tools/probe-full-campaign.mjs` drives Union 31/31 and Confederate 28/28 campaign chains through bridge auto-resolve to the final graded report, plus recovery/rematch and negotiated-peace branches, with 0 pageerrors. It is now wired into the normal gate via `npm run vet:noreg`.

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
