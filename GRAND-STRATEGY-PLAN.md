# GRAND-STRATEGY-PLAN.md — Owner-Mode War + Alternate-History Teaching Engine (authoritative)

**Written 2026-06-13 (run h, Opus 4.8) from a 10-round / 30-question popup design session with Aaron. Personal project — NOT MJI.**
**This is the LAW for the STRATEGIC layer** (economy · politics · morale · decisions · alt-history · victory · §27 the balance principle). Companion design docs: `MODERN-UGG-PLAN.md` (the real-time tactical engine LAW) + `HISTORICAL-DATA.md` (citation-grade content). Decisions below are LOCKED by Aaron via popup Q&A — honor verbatim. *(Process note, 2026-06-21: work ships directly each session per `AUTONOMOUS-RUN.md`; the old "coding happens in a new chat / `MODERN-UGG-KICKOFF.md`" workflow is legacy. The entrypoint for any AI tool is `START-HERE.md`.)*

---

## 0 · VISION
The game is THREE things at once:
1. **Owner-mode grand strategy** — you are the **President** (Lincoln or Davis) running the entire war: economy, manpower, industry, leaders, diplomacy, the home front. (Madden "owner mode," for a nation at war.)
2. **Real-time UG:G tactical battles** — the wars you wage are fought in the gridless real-time engine (see `MODERN-UGG-PLAN.md`).
3. **An interactive PhD-level history + alternate-history seminar** — maximal accuracy, scholarly consensus AND disagreement taught honestly, and a "what if only X" divergence engine where consensus is the *favored-but-not-guaranteed* path.
**Spine principle (Aaron's through-line across the session): MODES & TOGGLES — ALL PLAY STYLES.** A rigorous-historical default, with opt-in toggles, separate modes, and difficulty/realism sliders, so one engine serves the casual player, the grognard, and the PhD-curious.

## 1 · PLAYER & STRUCTURE (round 1)
- **You are the President of the Union OR Confederacy**, with **owner levers** over the whole war effort, AND you can **take the field as army commander** in battles.
- **Build by EXPANDING the existing War Department** (`G.campaign.{clock,muster,warroom}` — 1864 Clock = weariness/political-capital/foreign-intervention; Muster Roll = unit ledger; War Room = 5 economic nodes). Deepen it into the full executive layer; do NOT build a parallel system (no duplication).
- **Cadence: strategic turns between real-time battles.** The war advances in strategic turns (weeks/months): make executive + economic + alt-history decisions → fight the battles those decisions produce → results feed back.

## 2 · ECONOMY (round 2) — full historical model, strongly asymmetric, full finance
Model all of, interlinked: **manpower/conscription, industry & manufacturing, railroads/logistics, agriculture/provisions, finance (funds, war bonds, currency & inflation, taxation), King Cotton & the blockade, foreign trade/loans.**
- **Strongly asymmetric, historically grounded.** UNION: industrial base, dense railroads, immigration manpower, sound finance, naval/blockade dominance. CONFEDERACY: cotton leverage (declining), agrarian base, blockade strangulation, runaway inflation, chronic manpower & matériel shortage, states'-rights friction (governors hoarding troops/supplies). **Different win paths fall out of this asymmetry** (see §8).
- **Finance is real:** how you fund the war (taxes vs bonds vs printing money) has consequences — inflation, public morale, foreign credit. The CSA's inflation spiral and the USA's bond/greenback finance are core teachable dynamics. (See HISTORICAL-DATA.md weapons/economy facts; expand economy research in a later pass.)

## 3 · EXECUTIVE DECISIONS (round 3)
- **Full slate:** appoint/relieve generals; set war aims & grand strategy; allocate budget (army/navy/industry/railroads); conscription & recruitment policy (incl. **emancipation/USCT timing** for the Union); diplomacy (Britain/France recognition); home front (habeas corpus, dissent, the 1864 election); provisioning priorities.
- **Reaches battle via PRE-BATTLE CONDITIONING ONLY.** Strategic choices fully determine the army you field (strength, weapons, morale, fatigue, command, training); once a battle starts it is **pure tactics** (no in-battle executive interventions). Clean separation.
- **Pace: curated by default, optional deep management.** Each turn surfaces a few consequential choices (budget, a crisis, appointments, a diplomatic/home-front event, procurement); players who WANT to can dive into deep management for extra advantage (or court disadvantage). Accessible default + grand-strategy depth on tap.

## 4 · MORALE (round 4) — three interacting layers
- **Troop morale** (battle-level; drives waver/rout; seeded by training/veteran/leader/supply).
- **Leader morale/reputation** — generals carry **reputation, loyalty, and ambition**: appointing/relieving costs political capital; stars lift troops AND the home front but may have ambitions (McClellan running in 1864!); failures tank morale and force hard firing calls; reputation governs whether you *can* relieve them.
- **Public/home-front morale** — driven by the **full historical web**: battlefield wins/losses, casualty lists, economy/inflation/provisions, emancipation politics, newspapers & propaganda, the draft, foreign news. Consequences: low morale cuts recruitment, raises desertion, pressures policy, **risks the 1864 election**, and can spark riots (NYC draft riots; Southern bread riots).
- The three feed each other (a rout dents public morale; a beloved general lifts both; inflation erodes the home front).

## 5 · ALTERNATE-HISTORY ENGINE (rounds 5–6)
- **Tiered divergence, all available, each with an honesty card** ("what actually happened / scholarly view / plausibility"):
  - **Plausible (actively debated):** emancipation in 1861 vs 1863; the CSA arms & frees slaves early (Cleburne's real 1864 proposal); British/French recognition after Antietam; Lincoln loses 1864 → negotiated peace; KY/MD secede; the Trent Affair → war with Britain.
  - **Long-shot (documented but improbable):** mass-issue Spencer/Henry repeaters in 1862; accelerated ironclad fleets break the blockade; sustained CSA guerrilla war past 1865; **Lee accepts command of the *Union* army** (Lincoln's real April-1861 offer).
  - **Flagged-fantastical (video-game wild, clearly labeled):** Gatling/railroad-artillery in quantity; scaled Hunley submarine arm; balloon recon corps; European expeditionary troops; great-man swaps (any general → any army/era); 1870s-tech rush; war-drags-to-1870 endings.
- **Mechanism:** **emergent + curated hinge-point forks by DEFAULT**, with an **emergent-only toggle**, AND **separate Civ-Revolution-style curated scenarios** to play. (The sim tracks how far you've strayed from the real timeline — see §10.)
- **Outcome weighting: DETERMINISTIC by player performance.** No dice tilting outcomes toward history. The scholarly **consensus is TAUGHT as the "par"** (what historically happened and why it was likely), but you EARN your result through play. Agency + honest framing coexist.

## 6 · UPGRADES / TECH / PROVISIONING (round 6)
- **Offered as toggleable modes + separate gameplay** (Aaron: "toggle option and separate gameplay for all of the above"):
  - **Strict-historical:** only real, period-available weapons in their real rollout windows.
  - **Historical + opt-in what-if:** procure/issue real arms via the economy (Springfield M1861, Enfield P1853, Sharps, Spencer/Henry repeaters, 12-pdr Napoleon, Parrotts, 3-inch Ordnance) limited by industry/cost/supply — AND pursue ahistorical accelerations at steep flagged cost.
  - **Free-tech sandbox:** unlock anything, detached from history.
- **Full logistics to provision/upgrade:** arms + ammunition, rations/shoes/uniforms (the CSA's real shortages), training quality (green↔veteran), rail & wagon transport, medical/hospital care — each affecting troop morale, fatigue, combat, casualties. (Weapon stats/ranges = HISTORICAL-DATA.md weapons tables; these feed the tactical engine's combat per `MODERN-UGG-PLAN.md`.)

## 7 · EDUCATION / HISTORIOGRAPHY (round 7)
- **Multi-voice debate cards:** every topic/what-if shows the **mainstream consensus + notable dissent + fringe/outlandish claims**, each **labeled by scholarly support** and **cited**. Teach the *debate*, not just the fact.
- **Deep sourcing:** name specific **historians & works** (McPherson, Foner, Gallagher, Foote, Blight, …) and **primary sources** (OR records, secession declarations, letters); PhD-level + deep single-subject depth; **Verified vs Inferred** discipline throughout.
- **Layered & optional surface:** inline tips → on-demand deep-dive panels → a growing **codex/encyclopedia** of everything encountered, plus contextual prompts at hinge-points. Serves casual and PhD-curious alike; never nags, never hagiography, never Lost-Cause apologia.
- Content lives in **HISTORICAL-DATA.md** (rolling, marquee-first); the engine surfaces it.

## 8 · VICTORY & DEFEAT (round 8 + Aaron's negotiated-peace clarification)
- **Multiple ASYMMETRIC victory paths:** military conquest; breaking enemy public/political will; economic strangulation (Union blockade/attrition); foreign intervention (the CSA's hope); and **NEGOTIATED PEACE** — **a first-class win path for BOTH sides** (Aaron, explicit): the **CSA wins by negotiated peace → recognized independence** (driven by Northern war-weariness / a lost 1864 election), and the USA can reach a restored-Union settlement. The South wins by **NOT losing** (outlast Northern will); the North must conquer OR hold the political will to keep conquering.
- **The 1864 election is a major hinge:** for the Union, sustaining public will to November 1864 is a real victory condition — lose it and a peace platform may concede independence (the CSA's negotiated-peace victory). For the CSA, dragging the war out to break Northern resolve is THE strategy.
- **Hard defeat = military only** (round 8): the explicit game-over trigger is military collapse (armies/capital fall). Economy, morale, inflation, and the election are **pressures that shape your military capacity, the negotiated-peace path, and the ending** — they don't pop a separate loss screen, but losing the election / economic collapse can hand the *other* side its negotiated-peace or military victory. (This reconciles "military-only loss" with the rich win paths: your political/economic failure becomes the enemy's victory condition.)

## 9 · MODES, COUPLING, DIFFICULTY (round 9)
- **Build order: STRATEGIC layer FIRST.** Extend the War Department into the full owner-mode (it builds on working code and wraps the EXISTING battles), then the UG:G real-time tactical engine swaps in as the battle layer later. (NOTE: this REVERSES the earlier tactical-first plan — see §12 + the updated kickoff.)
- **All gameplay styles via toggles** (Aaron: "I like ability for all gameplay styles"): standalone **skirmish** (one battle), standalone **owner-game** (run the war), and **fully-coupled campaign** — the player chooses how tightly strategy and tactics are coupled.
- **Separate difficulty + realism sliders:** decouple CHALLENGE (AI skill, economic harshness, supply scarcity) from HISTORICAL STRICTNESS (grounded ↔ sandbox). "Historical & brutal," "casual & wild," or anything between.

## 10 · FIRST BUILD, DIVERGENCE TRACKING, SCOPE (round 10)
- **First strategic deliverable: the FULL strategic layer before any battles** (round 10) — i.e., build the complete economy/political/morale/decision/alt-history owner-mode (wrapping existing battles for now) before the UG:G tactical engine. Combined with §9 strategic-first: the new chat's whole first arc is the grand-strategy layer.
- **Divergence tracking: a living "your war vs history" timeline + end report card** — a running comparison of your decisions/outcomes against the real timeline, plus a closing report grading your alternate history's plausibility and teaching what actually happened + which scholars argued what. Every playthrough becomes a history lesson.
- **Campaign scope: ALL of it** (Aaron: "all of the above") — a full-war 1861–1865 all-theaters campaign, focused single-theater/single-year campaigns, AND curated battle/scenario packs — all available (modes & toggles).

## 11 · ARCHITECTURE & REUSE
- **Extend, don't duplicate:** grow `G.campaign.{clock,muster,warroom}` into the economy/decision/morale/alt-history state. Namespace new systems (suggest `__GS` / `gs*` chunks, append-only). Keep Classic + the future `__FIELD` tactical engine decoupled.
- **Strategy↔battle bridge:** strategic state → a battle's pre-conditions (army composition from real OOB + your provisioning/morale/weapons/training); battle result → casualties/ground/win-loss back into the campaign + the 3 morale layers + the economy. Initially battles use the EXISTING engine; the UG:G `__FIELD` engine swaps in behind the same bridge.
- **Save:** the grand campaign serializes under `G.campaign` (rides the existing save); keep `_SAVE_VER` discipline + back-compat for old saves.
- **Content pipeline:** HISTORICAL-DATA.md → OOBs, weapons, debate cards, codex entries (rolling, marquee-first). PD pictures via the run-h portrait fetch pipeline (Wikipedia REST + Commons PD gate), extended to weapons/flags/USCT.

## 12 · BUILD PHASES (new chat — strategic-first)
- **S0 — scaffold the owner shell:** expand the War Department UI into the President's desk (economy / war room / cabinet / map), strategic-turn loop, save. Reuse the period UI (`M3D_UI_SKIN`/`SKIN2`) + 131 portraits.
- **S1 — economy:** the full asymmetric model (manpower/industry/rail/agriculture/finance/blockade/foreign), funding choices + inflation.
- **S2 — executive decisions + 3-layer morale:** full decision slate, leader reputation/ambition, public-morale web, the 1864 election hinge.
- **S3 — alt-history engine:** tiered divergence + hinge-point forks + emergent toggle + curated scenarios; deterministic outcomes with consensus framing; the "your war vs history" tracker.
- **S4 — education layer:** multi-voice debate cards + deep-dives + codex, sourced from HISTORICAL-DATA.md; difficulty/realism sliders; modes & toggles.
- **S5 — victory/defeat resolution** incl. negotiated peace, all campaign scopes; wire battles (existing engine) through the bridge → **playable full owner-mode war.**
- **THEN** the UG:G real-time tactical engine (`MODERN-UGG-PLAN.md`, phases P0–P5) swaps in as the battle layer behind the bridge.
- Each phase: `.bak` + parse/hex/collision gate + self-verify (probes you READ); NEVER regress Classic.

## 13 · LOCKED-DECISION INDEX (quick reference — all 30)
R1 President + owner levers + field command · expand War Department · strategic turns→battles.
R2 full historical economy · strongly asymmetric · full finance.
R3 full executive slate · pre-battle conditioning only · curated default + optional deep mgmt.
R4 three morale layers · full public-morale drivers · leader reputation/loyalty/ambition.
R5 tiered divergence · emergent+hinge default (+emergent-only toggle, +curated scenarios) · deterministic-by-performance w/ consensus framing.
R6 tiered sandbox confirmed · upgrades as toggleable modes + separate gameplay · full logistics.
R7 multi-voice debate cards · named scholars + primary sources · layered optional teaching.
R8 multiple asymmetric victory paths · 1864 election hinge · hard-loss military-only · **negotiated peace = CSA (and USA) win path**.
R9 strategic-layer FIRST · all gameplay styles via toggles · separate difficulty+realism sliders.
R10 full strategic layer before battles · living "your war vs history" timeline+report · all campaign scopes.

---

# PART II — SYSTEMS DEEP-DIVE (rounds 11–20, second design session)

## 14 · DIPLOMACY & FOREIGN INTERVENTION (round 11)
- **Full diplomatic game:** Britain & France courtable; King Cotton diplomacy; the blockade's squeeze on European textile mills; the Trent Affair crisis; foreign-built commerce raiders (CSS Alabama) & the Laird rams; the Erlanger cotton loan. Recognition odds driven by **battlefield success + cotton leverage + standing European antislavery sentiment**.
- **Tiered intervention effects** (each historically weighted): recognition → offered mediation → blockade-breaking (long-shot) → matériel/expeditionary troops (fantastical). Intervention/recognition is a real CSA route toward its negotiated-peace victory (§8).
- **Emancipation = HOME-FRONT lever, NOT a diplomacy toggle** (Aaron, round 11): the Emancipation Proclamation moves home-front morale/recruitment (and USCT) but is decoupled from the recognition mechanic; the slavery *question* still factors into diplomacy as standing European sentiment.

## 15 · SLAVERY & EMANCIPATION (round 12) — the moral & causal core
- **Slavery FRONT-AND-CENTER as THE cause**, taught explicitly with the secession declarations as primary evidence; the **Lost Cause myth is named and countered** (no false-balance "states' rights").
- **Slave economy modeled** as the CSA's agrarian base, with **contraband/self-emancipation dynamics**: as Union armies advance, the enslaved escape to Union lines — draining the Confederate economy and feeding USCT recruitment + Union labor (Du Bois's "general strike"; the enslaved as actors in their liberation).
- **Black Americans as full historical agents:** self-emancipation, labor & teamsters, scouts & spies (Tubman's Combahee raid), abolitionist pressure, and the ~200,000 who served (USCT + Navy). Counters Lost Cause erasure.

## 16 · HOME FRONT & POLITICS (round 13)
- **Full political game:** a cabinet (Seward/Stanton/Chase · Benjamin/Memminger), Congress (war funding, conscription acts, the Radical Republicans), party factions (War Democrats, Copperheads · CSA states'-rights governors like Brown & Vance who hoarded troops/supplies). Governing is half the war.
- **Civil liberties & dissent as decision trade-offs:** Copperhead/peace movements, draft resistance (NYC riots), suspending habeas corpus, press censorship — the genuine Lincoln/Davis dilemmas, each with morale/political costs.
- **Recurring elections:** 1862 midterms pressure policy; the **1864 presidential election** is the grand hinge (and the CSA's path to negotiated-peace victory); CSA congressional/gubernatorial politics too.

## 17 · NAVAL WAR (round 14)
- **Full naval game:** the blockade (the Anaconda), ironclads (Monitor/Virginia, river ironclads), the river war (Mississippi/Tennessee forts & gunboats, Vicksburg), commerce raiders, blockade runners (CSA lifeline), coastal forts (Sumter/Fisher/Mobile Bay). Sea power is a strategic war-winner.
- **Naval battles get their OWN tactical mode** (a simpler real-time naval layer): Hampton Roads, Mobile Bay, ironclad duels, fort actions.
- **Blockade economic depth is a TOGGLE** (Aaron, round 14): full economic strangulation (with the runner counter-game) ↔ flat modifier ↔ off — under the realism settings.

## 18 · STRATEGIC MAP & LOGISTICS (round 15)
- **Full strategic map:** Eastern/Western/Trans-Mississippi theaters, key cities (Richmond/Washington/Vicksburg/Atlanta), railroads & rivers as logistics arteries, cuttable supply lines.
- **Armies maneuver; territory + supply control matter** — controlling rail/river/cities feeds the economy and sets up battles; **where/when battles occur EMERGES from maneuver** (Grant at Vicksburg, Sherman's March).
- **Full map logistics:** supply lines, depots, cavalry raids & marches that sever enemy supply, foraging/living-off-the-land (Sherman) with consequences. Teaches that logistics won the war as much as battles.

## 19 · GENERALS (round 16)
- **Full historical roster with real, character-grounded traits** (Jackson's speed, Grant's tenacity, McClellan's caution + ambition, Forrest's genius, Bragg's quarrelsomeness) — the 131 portraits + more; promote/assign/bench/relieve.
- **FULL RPG skill trees** for progression (Aaron chose this over historically-bounded) — deep unlockable ability trees per general. **Reconciliation w/ the education mission:** the realism slider can history-BOUND the trees (strict = grounded ceilings; relaxed = full power-fantasy); abilities map to real doctrines/traits.
- **Rivalries, loyalty & command friction:** Grant–Sherman partnership, Confederate command feuds, prima-donna subordinates, un-fireable political generals. Managing personalities is the art of high command (and teaches why armies under-performed).

## 20 · SOLDIERS & THE HUMAN DIMENSION (round 17)
- **Muster Roll expands** into named soldier/regiment histories, period-voice **letters home**, and fates (killed/wounded/deserted/discharged/veteran) — "your men," remembered.
- **Medicine, disease & the true cost:** disease killed ~2× battle (a defining under-taught fact); model field hospitals, the wounded (recover/die/discharge), medical-care quality as a provisioning lever; surface the ~750k toll honestly (the birth of modern military medicine).
- **Veteran progression** (units harden with experience). NOTE: unit-level **desertion/war-weariness was NOT taken** (round 17) — late-war collapse is handled at the strategic public-morale layer (§4), not per-unit.

## 21 · INTELLIGENCE & ESPIONAGE (round 18)
- **Full-information strategic map** (Aaron, round 18): enemy army *positions* are visible on the map (no strategic fog). [Tactical battles still HAVE fog of war — §MODERN-UGG-PLAN.]
- **Real intelligence game** layered on top: espionage reveals enemy *composition, strength, intentions, and pre-battle detail* — spy networks (Elizabeth Van Lew), counterintelligence, deception, and the **Black Dispatches** (enslaved informants as the Union's best source — ties to §15 Black agency). Investable strategic lever + major teaching surface.
- **Intel quality shapes pre-battle knowledge + strategic foresight:** good intel reveals the enemy OOB/plan before a fight (the Lost Order / Special Order 191 at Antietam) and warns of moves; bad intel blinds you. Feeds the pre-battle conditioning (§3).

## 22 · EVENTS, PACING & TIMELINE (round 19)
- **Rich historical + dynamic events:** historical milestones (Sumter, Emancipation, Atlanta→reelection) fire at their real moments or shift with divergence; PLUS emergent sim events (a general killed, inflation crisis, mutiny, foreign incident). Each = a choice-card with a teaching note.
- **Variable pacing:** granular weekly turns in campaign season; winters/quiet stretches compress — the full 1861–65 arc satisfying at session scale.
- **Timeline anchored to real dates, drifting with divergence:** real dates by default; your choices shift the timeline; the "your war vs history" tracker (§10) shows the drift.

## 23 · REPLAYABILITY, SCORING & ONBOARDING (round 20)
- **Rich replayability + meta-progression:** both sides, multiple start points/scenarios, branching alternate histories, unlockables (codex/scenarios/hard modes), **New Game+** carrying historical knowledge.
- **Dual scoring:** strategic performance (military/political/economic outcome) **+** a **historical-learning report card** (your war vs real history, alternate-history plausibility, codex completion). Every run is graded as a game AND a history lesson.
- **Layered onboarding:** early scenarios with a limited toolset introduce mechanics a few at a time; complexity unlocks as the war grows; tutorials woven INTO the chronology (learn the draft when the draft historically arrived). Teaches the game and the war at once — essential for a sim this deep.

## 24 · LOCKED-DECISION INDEX — rounds 11–20
R11 full diplomatic game · tiered intervention effects · emancipation = home-front lever (not diplomacy).
R12 slavery front-and-center as THE cause (Lost Cause countered) · slave economy + contraband/self-emancipation · Black Americans as full agents.
R13 full political game (cabinet/Congress/factions/governors) · civil liberties & dissent trade-offs · recurring elections (1862→1864).
R14 full naval game · own naval tactical mode · blockade depth = toggle.
R15 full strategic map (theaters/cities/rail/rivers/supply) · army maneuver + territory · full map logistics (depots/raids/foraging).
R16 full roster + real traits · FULL RPG skill trees (realism slider can bound) · rivalries/loyalty/friction.
R17 Muster Roll → soldier stories/letters/fates · medicine/disease/~750k toll · veteran progression (no unit desertion).
R18 full-info strategic map · real espionage game (Black Dispatches/Van Lew/Lost Order) · intel shapes pre-battle knowledge.
R19 rich historical+dynamic events · variable pacing · timeline anchored-but-drifting.
R20 rich replay + New Game+ · dual scoring (strategic + historical report) · layered scenario onboarding.

---

# PART III — THE DEPTH↔SIMPLICITY BALANCE & PRESENTATION (rounds 21–33, third session)

## 25 · THE DEPTH↔SIMPLICITY RESOLUTION (rounds 21–29) — Aaron's central tension, solved
**The problem:** Aaron wants BOTH a rich PhD-level educational/strategic experience AND simple, satisfying low-micro UG:G "command-the-line" combat. The resolution (locked across rounds 21–29):
- **R21 — the principle:** the **simple UG:G battle is the always-fun CORE that stands alone**; ALL depth is **optional layers** on top (opt-in / auto-managed / preset-gated); **sensible auto-defaults + advisors** by default; the **core loop = fight a great real-time battle, result echoes into a light campaign.** You never HAVE to touch grand strategy to have fun.
- **R22 — default experience:** new player drops into a **guided campaign of great battles with strategy auto-managed**; **ALL systems are VISIBLE always** (Aaron) BUT auto-managed + non-blocking — visibility is for immersion + passive learning, never obligation; a **pure battle/skirmish path with zero strategy obligation** exists.
- **R23 — combat feel (the UG:G heart):** **low micro / command-the-line** (issue intent: move/face/charge/hold; units self-manage firing & local maneuver); **smart auto-behaving units**; satisfaction from **readable, weighty firefights + dramatic morale breaks**, not clicking.
- **R24 — light strategy & the inverse:** light-strategy = **headline decisions only + advisors handle the rest**; **optional auto-resolve / quick-battle** for strategy-first players (mirror of the battle-only player); a **detailed pre-battle planning screen** — implement as EXPANDABLE from a one-glance briefing with a quick-start/auto-deploy button (so planners get depth, battle-first players skip it).
- **R25 — the linchpin: ADVISORS.** Named historical **cabinet advisors** (Stanton/Chase/Welles/Seward · CSA equiv) **auto-manage their domains, recommend, AND explain the WHY** (history + trade-off + scholarly debate); **per-domain delegation** (run what interests you, delegate the rest). Auto-management *becomes passive learning* — this is what makes depth optional AND educational at once.
- **R26 — frictionless teaching:** **ambient** (briefings, advisor asides, post-battle 'what really happened' cards, loading facts); **never blocks/gates play**; **layered on-demand** deep content (one-line → deep-dive → codex).
- **R27 — play-style presets:** named presets ('General' = pure battles · 'Commander' = battles + light strategy · 'President' = full owner-mode · 'Historian' = max teaching/auto-resolve battles) that configure all toggles; **depth is fluid — change it mid-campaign**; presets bundle depth + difficulty + realism coherently, **every slider still tweakable**.
- **R28 — pacing/time-respect:** battle length **toggle (default punchy ~10–25 min)**; **scalable** skirmish → full historical battle; **pause/save/resume mid-battle**.
- **R29 — history & fun pull the SAME direction (the deepest resolution):** battles are a **fair SANDBOX** (history flavors but never thumbs the scale — you CAN win Pickett's Charge); the **reward is WINNING** (the 'your war vs history' report is an informational mirror, NOT a competing score); and crucially **HISTORICAL KNOWLEDGE CONFERS A REAL IN-GAME EDGE** (know the terrain/ranges/general-tendencies/plan → win more). Learning = mastery, so education and fun reinforce instead of compete.

## 26 · PRESENTATION (rounds 30–33)
- **R30 — art:** **period war-room aesthetic** for strategy (parchment maps, brass, engravings, newspapers); **stylized-realistic cinematic 3D** battles (the shipped, GPU-verified direction); **real PD photography + period art throughout** (authentic archive = teaching).
- **R31 — audio:** **expand the existing adaptive period score** (fife-and-drum, scaling battle din, bugles, new war-room/home-front themes, all procedural/$0); **immersive battle soundscape** that scales with the fight; **Ken Burns-style primary-source quotes + ambient** (actual voice-over a later enhancement).
- **R32 — narrative:** **historical-chronicle framing** of your presidency (newspapers/dispatches/letters; emergent, not scripted); **living cast** (figures speak via real quotes + characterization, tied to the advisor system); play the **real president (Lincoln/Davis) + optional custom leader** (sandbox).
- **R33 — moments/a11y/order:** **cinematic signature set-pieces** (Sumter, Jackson's flank march, Pickett's Charge, Emancipation, Sherman's March, Appomattox); **full accessibility** extended across all layers (colorblind/reduced-motion/keyboard/scalable text; the depth & difficulty sliders ARE accessibility); **BUILD ORDER CONFIRMED = strategic layer first** (the 'fusion slice' alternative was rejected; rounds 9–10 hold).

## 27 · THE BALANCE PRINCIPLE (design law for every system the new chat builds)
The **simple, low-micro UG:G battle is the always-fun core that works on its own.** Every deep system (economy, politics, diplomacy, logistics, intelligence, the PhD historiography) is **optional** — auto-managed by characterful advisors, delegable per-domain, preset-gated, and fluidly dial-able mid-campaign. **Education is ambient, never blocks play, and confers real mastery** (so learning is rewarded by winning, not by a separate chore-score). **Presets + sliders let each player set their own balance.** One engine must serve the pure-battle player, the grand-strategist, and the PhD-historian — simultaneously, without compromise to any. If a feature ever forces depth on a battle-first player, it's wrong; if it ever denies depth to a strategist/historian, it's wrong.

## 28 · LOCKED-DECISION INDEX — rounds 21–33
R21 simple core stands alone + optional depth · auto-defaults + advisors · core loop = battle + light campaign echo.
R22 default guided-campaign w/ auto-managed strategy · all systems visible but non-blocking · pure battle path exists.
R23 low micro/command-the-line · smart auto-behaving units · readable weighty firefights + morale breaks.
R24 light strategy = headline decisions + advisors · optional auto-resolve battles · detailed-but-skippable pre-battle planning.
R25 named cabinet advisors auto-manage + recommend + TEACH · per-domain delegation · advisors-as-teaching.
R26 ambient teaching · never blocks · layered on-demand deep content.
R27 play-style presets (General/Commander/President/Historian) · fluid mid-campaign depth · presets bundle all axes, sliders tweakable.
R28 battle-length toggle (default punchy) · scalable skirmish→full · pause/save/resume battles.
R29 battles = fair sandbox · reward = winning (report is a mirror) · HISTORICAL KNOWLEDGE = real in-game edge.
R30 period war-room art · cinematic 3D battles · real PD photography + period art.
R31 expand adaptive period score · scaling battle soundscape · Ken Burns quotes+ambient (voice future).
R32 historical-chronicle narrative · living cast (real quotes) · real president + optional custom leader.
R33 cinematic signature moments · full accessibility all layers · build order = strategic-first (confirmed).
