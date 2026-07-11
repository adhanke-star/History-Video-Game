# Genre-Elite Audit: July 2026

**Status:** ratified design law for the D367 / LANE-004 session.  
**Repository evidence boundary:** `a55700f` plus focused runtime probes run on 2026-07-10.  
**Web evidence access date:** 2026-07-10.  
**Product constraint:** personal project, zero-dollar budget, one generated HTML deliverable, 8 GB local development floor.

## Verdict

The game is already unusually broad for a personal web wargame. Its tactical simulation has a real morale, frontage, terrain, command, phase, and AI model. Its strategic layer covers more of the political economy of the Civil War than most battle-first competitors. Its teaching stack is the clearest competitive advantage: sourced Codex entries, primary-source criticism, divergence readback, human-cost accounting, and Reconstruction consequences are part of play rather than a detached encyclopedia.

The largest quality gap is not another combat subsystem. It is the connective tissue that elite strategy games use to help a player understand, control, pause, resume, and retell a complex session. The highest-return work is reactive onboarding, better camera recovery and overview, explicit cause-and-effect feedback, accessible audio/input controls, and exportable after-action material. A living operational campaign map is the largest genre gap, but it is not a quick win. Building it before the existing systems become easier to read would add navigation cost faster than meaningful agency.

The design direction is therefore:

1. make the existing depth legible;
2. make every session easier to enter, interrupt, and share;
3. finish the named-person layer that turns units into human stories;
4. design an operational map only after those seams are stable.

## Method and scoring

This audit treats shipped runtime behavior as evidence and roadmap prose only as intent. A feature counts as present when it is enrolled in `src/00-manifest.json`, wired into a reachable surface, and covered by a focused probe or a direct runtime check. Absence claims use both repository search and the live interface contract where possible.

Each feature receives a 100-point implementation-priority score:

| Factor | Weight | Meaning |
|---|---:|---|
| Player impact | 30 | How much the feature improves comprehension, agency, accessibility, or emotional payoff. |
| Competitive gap | 25 | How far the current experience sits below the demonstrated genre bar. |
| Delivery leverage | 20 | How much existing code and content the slice improves. |
| Evidence confidence | 10 | Strength of runtime and external evidence. |
| Low-risk feasibility | 15 | Fit with D74, citation law, single-file delivery, and the performance floor. |

Priority bands are: **P0 80-100**, clear and bounded now; **P1 65-79**, next design packet or medium slice; **P2 50-64**, valuable but dependent; **P3 below 50**, defer. The score ranks implementation order, not artistic worth. A major operational map can matter greatly and still score below a small AAR-export slice because its cost and regression surface are much larger.

### Benchmark source register

| Benchmark | Elite bar used here | Primary or official sources |
|---|---|---|
| Ultimate General: Gettysburg / Civil War | Freehand and delegated orders, autonomous subordinates, readable morale and flanking, terrain as a tactical input, persistent officers and army losses. | [Ultimate General: Civil War feature page](https://www.ultimategeneral.com/ultimate-general-civil-war), [Ultimate General: Gettysburg Steam page](https://store.steampowered.com/app/306660/Ultimate_General_Gettysburg/) |
| Total War | Radar and tactical overview maps, visible paths and unit states, layered camera controls, advisor/help links, time controls, saves, replays and refights, separated audio/settings. | [Battle UI](https://academy.totalwar.com/battle-what-the-ui-is-and-does/), [battle controls](https://academy.totalwar.com/battle-keyboard-and-mouse-controls/), [campaign UI](https://academy.totalwar.com/campaign-what-the-ui-is-and-does/), [turns and saves](https://academy.totalwar.com/campaign-how-turns-work/), [ROME II main-menu manual](https://r2encv2.totalwar.com/en/manual/single-player/0006_enc_page_frontend_main_menu/index.html) |
| Grand Tactician: The Civil War | Continuous operational campaign, high-level national management, supply and infrastructure, uncertain intelligence, order delay, visible cause summaries. | [Game features](https://www.grandtactician.com/thecivilwar/), [economy design](https://www.grandtactician.com/thecivilwar/blog/index.php?id=22), [operations and intelligence](https://www.grandtactician.com/thecivilwar/blog/articles/operations), [FAQ](https://www.grandtactician.com/thecivilwar/blog/articles/faq-frequently-asked-questions) |
| Scourge of War | Command-level camera constraints, couriers and command delay, progressive tutorials, broad difficulty presets, configurable map intelligence, manual and interval saves, replay from multiple viewpoints. | [Official Gettysburg manual](https://shared.steamstatic.com/store_item_assets/steam/apps/3136610/manuals/71098d1b4813f3642baca457694dd14819c87f1e/SoW_Gettysburg_Manual.pdf?t=1746575587), [official game details](https://www.scourgeofwar.com/gburg.shtml) |
| Field of Glory II | Tutorial progression from mechanics to Quick Battles and larger scenarios, highly visible cohesion states, detailed or simple reports/tooltips, difficulty and speed controls, save/load, and an official AAR community surface. | [Official manual](https://cdn.cloudflare.steamstatic.com/steam/apps/660160/manuals/FOG2_manual_EBOOK.pdf?t=1614686424), [publisher feature page](https://www.slitherine.com/product/field-of-glory-ii), [official AAR forum](https://forum.slitherine.com/viewforum.php?f=477) |
| Paradox, especially CK3, HOI4, and Victoria 3 | Stable context controls, nested or advanced tooltips, reactive tutorial triggers, separate “how” and “why” walkthroughs, suggested starts, optional automation, and legible high-density strategic systems. | [CK3 UI/UX controls](https://www.paradoxinteractive.com/games/crusader-kings-iii/news/ck3-console-dev-diary-3-uiux-and-controls), [CK3 onboarding and tooltips](https://www.paradoxinteractive.com/games/crusader-kings-iii/news/console-dev-diary-4-tech-optimization-ps-exclusive-features), [Victoria 3 reactive tutorials](https://www.paradoxinteractive.com/games/victoria-3/news/dev-diary-51-tutorials), [HOI4 scope](https://www.paradoxinteractive.com/games/hearts-of-iron-iv/about) |
| Old World | Events that create memories, traits, relationships, and later triggers; layered help; event-causality disclosure; undo and reproducible setup strings. | [Old World gameplay](https://mohawkgames.com/oldworld/gameplay/), [Update 137 advanced help and event triggers](https://mohawkgames.com/2025/07/23/old-world-update-137/), [Update 132 one-click centering and reproducible setup strings](https://mohawkgames.com/2025/02/19/old-world-update-132/) |
| Game accessibility bar | Text scaling, redundant cues, narration, remapping, difficulty assists, time-limit controls, separate audio categories, and mono audio. | [Xbox Accessibility Guidelines](https://learn.microsoft.com/en-us/xbox/accessibility/guidelines), [XAG 105 audio accessibility](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/105), [accessibility feature tags](https://learn.microsoft.com/en-us/xbox/accessibility/accessibility-feature-tags) |

Promotional pages establish the developer-published feature bar, not a claim that every named control is unchanged in a 2026 build. Official manuals and current Microsoft guidance carry the strongest implementation confidence.

## Current readiness by pillar

| Pillar | Current strength | Elite shortfall | Audit judgment |
|---|---|---|---|
| Tactical battle feel | Universal fixed-step combat; morale/rout/rally; facing and flank exposure; terrain; direct pointer and keyboard orders; phases; 3D orbit camera; auto-pause; spatial ambience. | No tactical overview or radar; weak camera recovery; no player-facing AI intent; no formation-preserving group path; battle-state causes are spread across the HUD. | Mechanically credible, presentation one tier short of genre-elite. |
| Strategic/campaign depth | Coupled economy, production, blockade, rail, manpower, diplomacy, cabinet, press, election, command, divergence, victory, and endings. | Fixed historical battle chain; no player-directed operational map; causal feedback is distributed over many tabs; events rarely remember prior character relationships. | Broad national simulation, limited operational agency. |
| Elite basics and QoL | Static tutorial/help, three named save slots, import/export and undo, 12 difficulty combinations, auto-pause, speed control, four accessibility modes, reduced motion, captions. | Static rather than reactive onboarding; no explicit learning ladder; no battle checkpoint; limited audio mix; no mono/remap/controller path; no replay capsule or AAR export. | Strong compliance and safeguards, uneven first-hour and return-session experience. |
| Teaching/history | 73 sourced Codex entries, 20 primary-source records, inline glossary, 80 scenario teaching cards, graded AAR, divergence, human cost, Reconstruction, under-told perspectives. | Few in-context “why” walkthroughs; no exportable seminar/AAR packet; no learning objectives or lightweight assessment; source evidence is not always one click from the moment it explains. | Category-leading content architecture with weak portability and classroom handoff. |

## Pillar 1: tactical battle feel

### T-01: responsive orders and formation control

- **Elite bar:** Ultimate General lets a player draw lines and arrows, choose direct or delegated control, and rely on division commanders. Total War combines multi-selection, visible paths, facing, formation, and camera shortcuts. Scourge of War deliberately adds courier delay when the selected realism level calls for it.
- **This repository:** `src/tactical/T20-order-feel.js:321-361` resolves direct orders, facing, charges, waypoint queues, and group spread. `src/tactical/T0-field-sandbox.js:1421-1537` wires pointer and keyboard controls. `tools/probe-order-feel.mjs` asserts pointer parity, real-key commit/cancel, facing, queues, charge targeting, fog-safe targeting, and input-focus guards.
- **Gap:** group spread avoids stacking but does not preserve an authored line or show the whole formation before commit. There is no division-level “take and hold this area” delegation. Adding historical command delay would change the game’s control contract and should not be copied merely because Scourge uses it.
- **Recommended slice:** add a presentation-first group-order preview that displays each selected unit’s resolved destination and facing before commit. A later design packet may consider a bounded area objective for AI-controlled subordinates.
- **Risks:** the preview must call the existing T20 resolver and must never introduce a second movement model. No speed, firepower, morale, or outcome modifiers. Avoid quadratic collision work with large selections.
- **Priority:** **73, P1**.

### T-02: morale, flanking, terrain, and collapse legibility

- **Elite bar:** Ultimate General and Field of Glory II make cohesion or morale states prominent and tie flank/rear shock to visible state changes. Total War exposes unit state on cards and pairs it with a radar and balance-of-power view.
- **This repository:** `src/tactical/T0-field-sandbox.js:398-579` implements frontage exposure, fire, morale, rout, and rally. The tactical HUD at `:1599-1633` exposes men, morale, fatigue, ammo, and current state. `src/tactical/T22-terrain-readability.js:83-104,533-603` adds hillshade, contours, color-by-height, a terrain key, and hover elevation/type. `tools/probe-field.mjs` proves deterministic casualties, rout, terminal victory, and finite state; `tools/probe-terrain-readability.mjs` covers all three terrain modes and CVD-safe luminance.
- **Gap:** the player sees that morale fell but not a compact causal explanation of why it fell at that moment. Nearby rout pressure, flank exposure, fatigue, support, and terrain are mechanically present yet must be inferred across surfaces.
- **Recommended slice:** a read-only “Why this changed” line for the selected unit, sourced from values already computed by the universal model. Retain the last three material state changes and use redundant icon plus text cues.
- **Risks:** presentation may summarize only inputs the player is allowed to know under fog. It must not recompute morale, reveal hidden enemies, or become a second rules engine. Bound the event ring to avoid per-tick allocation churn.
- **Priority:** **84, P0** for a small causal-summary seam; richer battle analytics remain P1.

### T-03: camera recovery and battlefield overview

- **Elite bar:** Total War provides a radar map, a tactical bird’s-eye view, direct map-to-camera navigation, and layered mouse/keyboard camera controls. Scourge of War turns camera freedom into an explicit realism setting. Ultimate General treats pan, zoom, and the hand-drawn field as primary tactical instruments.
- **This repository:** 3D play uses a side-aware `PerspectiveCamera` and `OrbitControls` at `src/tactical/T0-field-sandbox.js:2024-2044`. The 2D renderer is a full-field fallback at `:1713-1739`, and current modern launch paths select 3D. The Classic hex surface has a display-only minimap at `build/base.html:7909-8013`, but no click-to-pan listener was found. The modern real-time surface exposes no minimap, radar, player-selectable 2D overview, selected-unit follow, or one-action home reset.
- **Gap:** the player can orbit but cannot recover quickly after losing the action, jump to a selected unit, or glance at a simplified whole-field picture. This is an ergonomics defect before it is a graphics feature.
- **Recommended slice:** first ship `Home: reset to side-aware overview` and `Shift+Home: frame selected unit`, with help text and keyboard/focus teeth. `F` already commands a charge and is not available. Design a low-cost 2D overview inset only after the reset/frame path proves useful.
- **Risks:** camera work must not alter simulation timing, pointer raycasting, terrain mode, or low-tier rendering. A live minimap could duplicate rendering work on the 8 GB floor; use cached unit markers if that later slice proceeds.
- **Priority:** **88, P0** for reset/follow; **67, P1** for an overview inset.

### T-04: pacing, drama, and session rhythm

- **Elite bar:** Ultimate General structures engagements into discrete phases with post-battle unit and order-of-battle readback. Total War combines pause, multiple speeds, visible timers, state alerts, and battle replays. Scourge of War documents manual saves and configurable autosave intervals. Grand Tactician makes a slower decision cadence part of its command fantasy.
- **This repository:** `src/tactical/T0-field-sandbox.js:1303-1370` supplies event auto-pause, fixed-step simulation, pause, and 1x/2x/4x time. `src/tactical/T8-phases.js:48-257` manages sequential sectors, transition cards, tallies, and end summaries. `src/tactical/T19-battle-ambience.js:67-121,352-425` adds gated intensity, spatial pan, a user toggle, and accessible state. Focused probes cover auto-pause, phased scenes, and ambience lifecycle.
- **Gap:** phase pacing is controllable but not forecast. The player is not told an estimated scenario length or whether a multi-phase battle is a short lesson or a long session. Landmark moments have teaching cards, but the interface does not consistently connect a dramatic event to the unit or place that caused it.
- **Recommended slice:** add compact “2 phases, about 20-35 minutes at 1x” briefing metadata derived from time limits, plus a phase-progress readout. Treat exact real-world minutes as a range and disclose the basis.
- **Risks:** do not promise a duration the engine cannot guarantee. No forced camera cuts while the player is issuing orders. Reuse existing phase events rather than adding new timers.
- **Priority:** **76, P1**.

### T-05: AI legibility and bounded delegation

- **Elite bar:** Ultimate General exposes subordinate autonomy; Grand Tactician reports engagements, movement, reinforcements, supply, and uncertain intelligence; Paradox uses context prompts and alerts to reduce unexplained state changes.
- **This repository:** attacker and defender roles, targeting, flanking, objective pressure, and fallback behavior live in `src/tactical/T0-field-sandbox.js:755-980`. T27/T28 add an optional connected field-commander voice without allowing it to own outcomes. The HUD reports unit state, but it does not present a stable, player-facing account of friendly AI intent or why a subordinate changed posture.
- **Gap:** players can mistake deliberate AI behavior for random drift. The optional LLM dispatch adds flavor, not reliable causal telemetry.
- **Recommended slice:** expose a deterministic friendly-intent strip from existing role and order state: objective, posture, current obstacle, and last order reason. Keep enemy intent hidden unless already observed.
- **Risks:** never let generated prose become the authoritative explanation. Do not expose fogged targets or turn the display into an AI control input. Cap update frequency and string allocation.
- **Priority:** **78, P1**.

## Pillar 2: strategic and campaign depth

### S-01: national systems breadth

- **Elite bar:** Grand Tactician couples finance, trade, production, infrastructure, supply, recruitment, public morale, policy, and foreign intervention while automating routine economic behavior. HOI4’s published scope similarly combines industry, diplomacy, politics, research, production, and army design.
- **This repository:** finance, production, blockade, logistics/rail, manpower, diplomacy, cabinet, decisions, press, morale/election, victory, divergence, and endings are initialized and resolved through `src/90-president-register.js:19-84`. Focused probes assert capped bridges, deterministic ticks, UI reachability, and no tactical contamination. The strategic layer already exceeds the economic and political breadth of battle-only comparators.
- **Gap:** breadth is not the primary problem. Each system has its own tab and teaching block, so the player must assemble the causal chain from several reports. More variables would deepen opacity.
- **Recommended slice:** pause new macro systems. Add a cross-system turn explanation that names the three largest changes, their causes, and the surfaces where the player can act.
- **Risks:** explanation must consume saved snapshots and existing deltas, not create new calculations or effects. Historical language must use already sourced content.
- **Priority:** **79, P1**.

### S-02: operational campaign agency

- **Elite bar:** Grand Tactician’s defining layer is a continuous campaign map with army and fleet movement, telegraph-linked orders, delayed intelligence, stances, supply, raids, and reinforcements. Total War likewise ties economic and political choices to spatial armies and provinces.
- **This repository:** `src/20-president-render.js:163-184` labels the theater map a placeholder and preserves the fixed battle chain. `src/61-logistics-rail.js:227` states “No campaign map yet.” `tools/probe-western-theater.mjs` currently asserts that this readout cannot launch battles.
- **Gap:** strategic choices influence a prescribed sequence rather than selecting where and when armies move. This is the clearest genre-level gap.
- **Recommended slice:** design first. The smallest honest prototype is a node-and-edge theater graph with army locations, uncertain enemy contacts, and a single movement/stance decision between historical battle windows. It must consume existing logistics and command data rather than introducing a parallel economy.
- **Risks:** very high. This touches state persistence, scenario routing, AI strategy, history divergence, save migration, and performance. It can easily become a second game. No Phase C implementation is authorized.
- **Priority:** **68, P1 design packet**; runtime implementation is P2 until the packet proves a bounded seam.

### S-03: command persistence and human-scale army continuity

- **Elite bar:** Ultimate General persists officers, experience, weapons, casualties, reputation, and army organization. Scourge of War builds play around chain of command. The best result is not merely a roster but remembered consequences attached to people and units.
- **This repository:** `src/35-command.js` contains date-aware appointments, promotions, relief, corps/division billets, political commissions, theater fit, and a bounded readiness consumer. The Army Register and career trajectory surfaces are shipped. The current registry contains 957 generated person slots, but only 39 citation-grade replacement records were present at the audit boundary, leaving 918 unresearched rows after Stones River.
- **Gap:** the machinery is stronger than the named-person coverage. Most generated soldiers cannot yet carry the historical specificity that makes a campaign feel continuous and teachable.
- **Recommended slice:** continue LANE-002 5b in small, battle-coherent batches. Prefer units with banked source coverage, verify rank and sector at the battle date, and stop at Inferred or Disputed when two independent sources do not support Verified.
- **Risks:** citation and identity risk dominate. Never collapse women or support figures into combatant `ss:` replacements. Replacement batches do not change combat values or registry length.
- **Priority:** **87, P0** under its existing per-record contract.

### S-04: events that remember people and choices

- **Elite bar:** Old World events create memories, traits, relationships, ambitions, and later triggers. The key bar is persistence: a decision changes who a person is and what can happen later, rather than applying a one-time modifier.
- **This repository:** `data/decisions.json` contains 12 executive cards across seven categories. `src/32-decisions.js` queues, resolves, bounds, and persists their effects; cabinet, press, election, divergence, and endings read related campaign state. There is no general memory/relationship/event-chain layer comparable to Old World.
- **Gap:** consequences are systemic but rarely personal. The game can tell that emancipation timing diverged, but a cabinet member or commander does not remember the argument and change a later event because of it.
- **Recommended slice:** write a design packet for one three-beat, historically bounded memory chain using existing decision and cabinet ids. The first proof should be presentation and eligibility only; no new combat modifier.
- **Risks:** persistent event state implicates the save contract and citation law. Avoid fictional private dialogue presented as fact. Label dramatization and inference explicitly.
- **Priority:** **66, P1 design packet**.

### S-05: cause, delegation, and decision load

- **Elite bar:** Grand Tactician automates routine economic behavior while exposing the consequences of the player’s high-level policies. Paradox layers tooltips, alerts, predicted effects, and automation so that complexity remains playable.
- **This repository:** many strategic subsystems have bounded automated ticks and preview/readout surfaces. The player still faces roughly twenty President’s Desk tabs and must infer which three matter this turn.
- **Gap:** the strategic layer asks for expert synthesis before it teaches expert synthesis. There is no turn-level priority digest, “why did this change” trace, or optional delegation summary.
- **Recommended slice:** a read-only Chief of Staff brief that ranks three actionable issues from existing snapshots and links to their tabs. It may recommend attention but must not make decisions or invent causality.
- **Risks:** ranking must be deterministic, explainable, and side-aware. No LLM dependency. Do not create a hidden score that becomes a balance input.
- **Priority:** **82, P0/P1 boundary**; first ship only after a narrow contract and probe.

## Pillar 3: elite basics and quality of life

### Q-01: reactive onboarding and first-session flow

- **Elite bar:** Victoria 3 and CK3 trigger tutorials when the player first meets a mechanic, separate “tell me how” from “tell me why,” offer on-demand walkthroughs from concept tooltips, and recommend suitable starting positions. Field of Glory II moves from tutorials to Quick Battles before larger engagements.
- **This repository:** `src/94-tutorial.js:1-43` provides a seven-step static tour across three layers. `src/92-help-overlay.js` supplies first-launch and on-demand help. Both are keyboard accessible and reduced-motion aware. The Quick Start battle copy at `src/92-help-overlay.js:49-54` names only a legacy subset while the runtime registry now contains 16 scenarios.
- **Gap:** the tour explains surfaces in a fixed order rather than reacting to the player’s first save, first order, first rout, first executive choice, or first post-battle report. It also lacks a recommended low-complexity entry route.
- **Recommended slice:** first remove the brittle hard-coded battle roster and point to the live Historic Scenarios list. Then design four optional reactive lessons: issue and face an order, read a morale collapse, act on one President’s Desk warning, and interpret the AAR. Each needs separate “how” and “why” text and a persistent dismiss state outside the campaign save.
- **Risks:** the first slice is presentation-only. Reactive lessons must never trap focus, interrupt combat without consent, or make scenario-specific historical claims.
- **Priority:** **94, P0** for roster drift; **86, P0** for a bounded reactive lesson framework.

### Q-02: difficulty curve and assists

- **Elite bar:** Scourge of War offers seven presets plus custom settings that alter AI, morale, map intelligence, courier requirements, and camera freedom. Field of Glory II recommends a progression from tutorials to Quick Battles. Victoria 3 pairs its learning objective with recommended starts and reduced AI aggression.
- **This repository:** `src/tactical/T6-presets.js` exposes four AI levels, three realism bundles, custom levers, historical teaching for realism settings, and an advanced picker. Auto-pause, speed controls, fog, and keyboard order entry provide additional assists. `tools/probe-presets.mjs` and `tools/probe-realism-teaching.mjs` guard these seams.
- **Gap:** configuration breadth is high, but the product does not tell a new player which scenario and preset teach one concept at a time. “Easy” is a parameter bundle, not a learning journey.
- **Recommended slice:** add a non-binding “Learn the Battle” card that recommends one short scenario, one preset, an estimated session range, and three skills to practice. Later wins unlock suggested next lessons only in device-local presentation state.
- **Risks:** never describe easier AI as more historically accurate. Recommendations must derive from registered scenario metadata and cannot change combat settings without explicit confirmation.
- **Priority:** **84, P0** once scenario-length metadata is defined.

### Q-03: save/load and session-length respect

- **Elite bar:** Total War provides autosave, manual save, quick-save, and quick-load. Ultimate General and Scourge allow battle or phase interruption; Scourge exposes autosave intervals. Old World adds undo/redo and reproducible setup strings.
- **This repository:** `src/91-save-slots.js` implements three named slots, metadata, JSON export/import, corruption guards, overwrite confirmation, and undo. Strategic undo and seed-stable rematches are present. Save guards were hardened in D353. There is no supported mid-battle checkpoint, and briefings do not estimate session length.
- **Gap:** campaign state is well protected, but a long tactical phase must be finished or abandoned. The player cannot judge that commitment before launch.
- **Recommended slice:** ship duration and phase-count guidance first. Treat a tactical checkpoint as a separate design problem requiring deterministic serialization of unit, order, event, AI, and phase state.
- **Risks:** LANE-004 explicitly forbids save-envelope and `_SAVE_VER` changes in this session. A partial tactical snapshot that looks reliable but cannot reproduce the same continuation is worse than no checkpoint.
- **Priority:** **80, P0** for honest duration metadata; **57, P2** for tactical checkpoint design.

### Q-04: audio, input, and accessibility beyond WCAG

- **Elite bar:** XAG 105 calls for independent audio-category controls and mono output. The broader Xbox guidelines cover text scaling, redundant cues, narration, remapping, difficulty, focus, time limits, motion, and photosensitivity. Total War manuals expose separate speech, effects, and music controls. Controller-oriented CK3 uses stable context prompts and quick-access navigation.
- **This repository:** `src/97-accessibility.js:1-165` provides high contrast, dyslexia, color-vision-safe, screen-reader narration, and reduced-motion modes. Battle ambience supports captions, positional pan, and a toggle. The game has keyboard equivalents for core tactical orders. Repository search found no gamepad connection path, full remapping system, mono option, or player text-scale control.
- **Gap:** the project meets many web-accessibility obligations but does not yet meet a game-accessibility bar. Critical and ambient effects share too much of the mix; spatial pan can disadvantage one-sided hearing; fixed shortcuts and text sizes limit adaptation.
- **Recommended slice:** design an audio bus contract for master, music, critical effects, ambient effects, UI, and narration, plus mono. Follow with a command-action map that can support remapping and gamepad without rewriting handlers.
- **Risks:** Web Audio graph changes can leak nodes or change the battle-mix baseline. Mono cannot merely mute one channel. Remapping needs conflict detection, defaults, focus safety, and a keyboard escape path.
- **Priority:** **79, P1** for audio; **70, P1** for action-map/remapping design.

### Q-05: game feel and meaningful feedback

- **Elite bar:** Total War combines flashing unit cards, route states, paths, balance of power, radar, strong event feedback, and audio separation. CK3 uses haptic or audio responses for major events on supported platforms. The elite standard is redundant, proportionate feedback, not constant spectacle.
- **This repository:** tactical labels, order ghosts, phase cards, terrain modes, objective beacons, route states, casualty visuals, ambience, and teaching transitions already create more feedback than the earlier baseline. Focused visual and audio probes protect rendering and lifecycle behavior.
- **Gap:** moment-to-moment effects are present, but the hierarchy between routine fire, a flank collapse, a captured objective, and a terminal phase is inconsistent. Some important changes rely on the player noticing a HUD value.
- **Recommended slice:** define three feedback tiers and route existing events through them: routine, urgent, decisive. Each tier gets a bounded visual, text, and optional audio cue. Start with rout, reinforcement, and objective state because those events already drive auto-pause.
- **Risks:** no extra casualty or morale effects. Respect reduced motion, captions, audio preferences, and auto-pause settings. Avoid notification floods by coalescing repeated events.
- **Priority:** **74, P1**.

### Q-06: replay, AAR export, and session sharing

- **Elite bar:** Total War saves battle replays for viewing and refighting; Scourge replays an engagement from different command viewpoints; Field of Glory II supports an official AAR community surface. Old World exposes reproducible setup strings and save sharing.
- **This repository:** tactical end state supports “Fight Again” with a bumped seed. `src/82-after-action.js:282-357` renders grades, divergence, Soldier’s Story, human cost, Reconstruction, and sources. `src/103-h0-after-action.js` presents the report. The final report has no copy, text export, replay record, or shareable run capsule.
- **Gap:** the project’s richest teaching artifact disappears when the session ends. Players cannot paste it into a class discussion, compare decisions, file a reproducible bug, or share a compact outcome.
- **Recommended slice:** first add accessible Copy Report and Download Text actions that export only the rendered AAR’s existing text plus campaign context already present: side, live/final status, completed-battle count, and Ironman status. Use the rendered surface as the text authority. Next design a deterministic replay capsule of inputs and orders; do not begin with video capture.
- **Risks:** exported content must preserve user-controlled names as plain text, omit device secrets and API keys, disclose that it is a report rather than a replay, and never claim deterministic reproduction before it is proven. Clipboard failure needs an honest fallback.
- **Priority:** **96, P0** for text export; **63, P2** for replay capsule.

## Pillar 4: teaching and history presentation

### H-01: Codex, glossary, and source reader

- **Elite bar:** Paradox and Old World reduce information cost with nested tooltips, advanced-help levels, encyclopedia links, and on-demand concept walkthroughs. An educational surface also needs provenance and source criticism, which the commercial comparators do not consistently foreground.
- **This repository:** `data/codex.json` contains 73 Verified entries across people, units, terms, and systems. `src/84-codex.js:80-210` supplies search, filters, cross-links, provenance, and sources. `data/primary-sources.json` contains 20 Verified records across seven categories; `src/68-primary-sources.js:71-118` renders excerpts, attribution, critique, and “why it matters.” `src/93-glossary.js` decorates teaching prose inline. Focused probes enforce source counts, anti-Lost-Cause locks, XSS safety, and reachability.
- **Gap:** the repository beats most genre peers on source criticism, but the path from a live decision or tactical event to the exact relevant evidence is inconsistent. Help depth is not user-adjustable.
- **Recommended slice:** add stable deep links from selected AAR and teaching-card concepts into existing Codex or primary-source ids. Then add simple/advanced help depth using existing short/full content rather than duplicating facts.
- **Risks:** links must resolve by stable ids, preserve focus and back navigation, and never promote an Inferred record to Verified through UI placement.
- **Priority:** **77, P1**.

### H-02: contextual “how” and “why” teaching

- **Elite bar:** Victoria 3 makes “Tell me How” and “Tell me Why” separate, short, on-demand lessons tied to the mechanic the player has encountered. Total War links advisor text and highlighted concepts to help pages.
- **This repository:** tutorial, help, glossary, realism teaching, battle cards, Codex, and primary sources all exist, but they are separate entry points. The tactical and executive interfaces rarely offer a context link at the exact moment a player asks why an outcome occurred.
- **Gap:** content coverage is broad while instruction timing remains static. A novice can read everything and still miss the one explanation needed after a rout or inflation spike.
- **Recommended slice:** one reusable context-help hook keyed by stable concept id. Prove it on morale collapse, rail supply, and emancipation timing. Each hook opens an existing explanation and returns focus to the invoking control.
- **Risks:** no new historical prose until the linked records pass citation law. The hook must not interrupt active play or expose hidden information.
- **Priority:** **85, P0/P1 boundary**.

### H-03: after-action learning and counterfactual explanation

- **Elite bar:** commercial wargames show losses, unit performance, results, and replay. This project’s educational obligation is higher: distinguish player-caused divergence from historical contingency and explain human consequences without turning suffering into a score bonus.
- **This repository:** `src/82-after-action.js:54-357` produces domain grades, divergence, death-scale context, Reconstruction coda, and a full report. Focused probes distinguish strong and weak play, side-correct endings, emancipation timing, human toll, and non-graded Confederate-cause accounting.
- **Gap:** the AAR is rich but not portable and does not yet identify the three decisions that most changed the campaign. Grade evidence is visible by domain rather than synthesized into a concise causal review.
- **Recommended slice:** export the current report first. Later add a deterministic “three decisions that mattered” section using logged decision ids and existing divergence facts, with direct links back to the relevant source or system.
- **Risks:** never grade slavery, emancipation, or human cost as a player reward. Separate counterfactual inference from verified historical fact. Avoid hindsight certainty.
- **Priority:** **91, P0** for export; **78, P1** for causal synthesis.

### H-04: primary sources as playable evidence

- **Elite bar:** most benchmark titles provide historical notes, manuals, or flavor. Few make source criticism a first-class interaction. The applicable elite bar is therefore a teaching product: evidence must be reachable, contextualized, comparable, and exportable.
- **This repository:** the Primary Source Reader already includes excerpt, attribution, critique, context, and why-it-matters framing. Under-told perspectives, the human-cost ledger, Soldier’s Story, and battle teaching cards link historical interpretation to play.
- **Gap:** there is no side-by-side evidence packet for a battle or decision, and no way to carry a source set into a classroom or discussion. Source titles and links can be separated from the specific claim they support.
- **Recommended slice:** define a read-only “evidence packet” that collects existing source ids for the current battle, one strategic decision, and the AAR. Export plain text or print-safe HTML only after provenance and deduplication are probeable.
- **Risks:** avoid excerpt-length copyright problems, dead-link certainty, and claim/source mismatch. Export provenance labels exactly as stored.
- **Priority:** **72, P1**.

### H-05: remembered people, contested interpretation, and uncertainty

- **Elite bar:** Old World’s character memories and event triggers make earlier choices legible in later relationships. A history game also needs an explicit way to keep disputed evidence visible rather than flattening it into one canonical answer.
- **This repository:** Verified/Inferred/Disputed provenance is part of the data law; alternate outcomes and divergences are tracked. Named commanders and Soldier’s Story can connect strategic consequences to people. The UI does not yet offer a campaign-wide view of unresolved or disputed claims encountered by the player.
- **Gap:** uncertainty is stored record by record but not taught as a pattern. Personal continuity remains sparse until 5b coverage grows.
- **Recommended slice:** after the prosopography base is larger, add an “Evidence and uncertainty” AAR appendix listing the Inferred/Disputed records actually encountered. Pair it with one source-criticism prompt, not a quiz score.
- **Risks:** never imply that all historical interpretations are equally supported. The display must preserve the project’s anti-Lost-Cause framing and distinguish dispute over evidence from denial of documented causes.
- **Priority:** **67, P1** after more 5b coverage.

### H-06: classroom and discussion handoff

- **Elite bar:** no benchmark supplies a complete instructor workflow. Field of Glory II’s official AAR forum and the share/replay systems in other titles show the practical minimum: a session can leave the game and become discussable evidence.
- **This repository:** searches across `src/`, `data/`, and probes find no learning-objective, instructor-mode, assessment, or classroom-dashboard feature. The AAR and source reader already contain most of the substance needed for a lightweight handoff.
- **Gap:** a teacher or learner must manually reconstruct objectives, settings, results, sources, and discussion questions.
- **Recommended slice:** do not build an LMS. Add an optional one-page session packet with scenario, settings, objectives, outcome, two source links, and three open-ended discussion prompts. Start as a print-safe/export format generated from existing records.
- **Risks:** prompts must not grade political or moral conformity. No student tracking, accounts, telemetry, or cloud service. New historical prompts require the normal citation pipeline.
- **Priority:** **59, P2**.

## Features Aaron did not know to ask for

These are not random additions. Each closes a repeated failure mode in complex strategy games while reusing shipped systems.

| Feature | Why it matters here | Smallest honest slice | Disposition |
|---|---|---|---|
| Camera home and frame-selected commands | Orbit cameras make it easy to lose the battle, especially for new players and keyboard users. | Side-aware Home reset and Shift+Home selected-unit frame with no simulation writes. | **P0 cleared quick win.** |
| Causal state-change ribbon | The model already knows flank, fatigue, support, terrain, rout, and supply causes, but the player must infer them. | Last three material changes for the selected unit or strategic turn, read-only and fog-safe. | **P0 design-bounded.** |
| Learning route, not just an Easy setting | Difficulty parameters do not tell a novice what to learn next. | One recommended short battle, preset, expected time, and three skills. | **P0 after metadata contract.** |
| Shareable AAR text | The game’s best teaching surface currently vanishes at exit. | Copy and download the rendered report with side, live/final status, completed-battle count, and Ironman status. | **P0 cleared quick win.** |
| Replay capsule before video replay | A compact input/order log helps bug reproduction, comparison, and teaching at far lower cost than capture. | Design a versioned, secret-free seed/settings/order envelope; prove deterministic playback before labeling it replay. | **P2 design only.** |
| Accessible audio bus and mono | Spatial ambience is expressive but can hide information from players with one-sided hearing or cognitive load. | Separate critical and ambient effects, add mono, preserve captions and mute. | **P1 contract first.** |
| Evidence packet | A battle, a strategic choice, and an AAR should produce a portable set of sources and questions. | Collect existing ids into a print-safe packet; no account or cloud service. | **P1 after AAR export.** |
| Battle commitment forecast | The absence of a tactical checkpoint makes launch-time time cost important. | Phase count plus a disclosed duration range derived from scenario time limits. | **P0 metadata slice.** |
| Friendly intent display | A player should know whether a subordinate is holding, advancing, recovering, or blocked without treating AI motion as arbitrary. | Deterministic friendly-only objective/posture/obstacle strip. | **P1.** |
| One-click accessibility preview | Accessibility settings are hard to choose without seeing their effect. | Preview typography, contrast, motion, captions, and mono before campaign launch. | **P1.** |

## Ratified priority ladder

This ladder is binding for work that cites this audit. A lower row does not jump a higher row without a new decision entry or a genuine blocking dependency.

| Rank | Queue id | Slice | Score | Decision |
|---:|---|---|---:|---|
| 1 | GEA-01 | Replace the brittle Quick Start battle-name subset with registry-stable guidance and add a focused help/tutorial tooth. | 94 | **FIX-NOW, cleared for Phase C.** |
| 2 | GEA-02 | Add accessible Copy Report and Download Text actions to the existing AAR, including safe existing campaign context and honest failure feedback. | 96 | **CLEARED QUICK WIN for Phase C.** Score is higher than GEA-01, but the confirmed stale copy defect goes first. |
| 3 | GEA-03 | Add side-aware Home reset and Shift+Home frame-selected commands, with pointer/keyboard/help/probe coverage. | 88 | **CLEARED QUICK WIN only if Phase B finds no higher-severity blocker and the slice stays presentation-only.** |
| 4 | GEA-04 | Continue LANE-002 5b citation-grade prosopography batches from the live 918-row remainder. | 87 | **ACTIVE CONTRACT.** Phase D owns this work. |
| 5 | GEA-05 | Design and ship one reactive “how/why” lesson on issuing and facing an order, then extend by stable concept id. | 86 | **P1 contract required.** |
| 6 | GEA-06 | Add a read-only causal state-change ribbon for morale and one strategic system. | 84 | **P1 contract required; fog and D74 are acceptance teeth.** |
| 7 | GEA-07 | Define scenario duration metadata and a “Learn the Battle” route with a recommended preset and skills. | 84 | **P1 metadata contract required.** |
| 8 | GEA-08 | Create a deterministic Chief of Staff turn brief from existing snapshots and tab links. | 82 | **P1 design packet.** |
| 9 | GEA-09 | Design separate audio buses, mono output, and an action-map seam for future remapping/gamepad. | 79 | **P1 accessibility contract.** |
| 10 | GEA-10 | Deep-link live teaching moments and AAR claims into existing Codex and Primary Source ids. | 77 | **P1 after stable concept-link contract.** |
| 11 | GEA-11 | Write the bounded node-and-edge operational-map design packet. | 68 | **P1 design only; runtime remains P2.** |
| 12 | GEA-12 | Write one historically bounded three-beat event-memory proof. | 66 | **P1 design only; save implications block this session.** |
| 13 | GEA-13 | Design a deterministic replay capsule from seed, settings, and issued orders. | 63 | **P2 after AAR export.** |
| 14 | GEA-14 | Generate a print-safe classroom/evidence packet from existing ids and AAR content. | 59 | **P2 after deep links and export.** |

## Guardrails carried into implementation

- D74 remains absolute. Presentation may explain the universal model; it may not add battle-specific damage, morale, firepower, timing, or outcome keys.
- No feature may reveal hidden enemy state under fog merely to improve legibility.
- New historical prose or identity claims still require two independent reputable sources for Verified. Inferred and Disputed remain honest outcomes.
- The operational map, event memory, tactical checkpoint, and replay capsule require separate contracts before runtime work.
- Audio, camera, and overview features must stay inside the Intel UHD-617 and 8 GB development floor. A second live battlefield renderer is presumed too expensive until measured otherwise.
- Exported artifacts must omit credentials, connected-AI keys, device-local secrets, and unescaped user strings.
- Accessibility is a game-system concern, not a final WCAG pass. New controls need keyboard access, visible focus, reduced-motion behavior, redundant cues, and honest narration from the first slice.

## Phase A evidence gate

The audit’s repository claims were checked against manifest enrollment, runtime call sites, focused-probe contracts, and live data counts. The focused runtime subset covers tutorial/help, accessibility, order feel, ambience, save slots, Codex, primary sources, main menu, and presets. Its exact command and JSON readback are recorded in D369 and the LANE-004 resume pointer. No runtime source or generated deliverable was edited in Phase A.
