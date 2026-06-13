# REVIEW QUEUE — The Civil War (Vol. I)
Updated 2026-06-13 (run f). Everything undone, priority-ordered, queued for review. **Canonical folder: ~/Desktop/Video Game** (Documents/Claude/Projects copy = archive, do not write).

## ⚑⚑⚑ MODERN MUST PLAY LIKE *ULTIMATE GENERAL: GETTYSBURG* (locked 2026-06-13, run h) — #1 PRIORITY, SUPERSEDES ALL
Aaron (PS4 UG:G muscle memory): **Modern's primary play must be real-time, gridless, drag-to-move + facing, line/column formations, morale/rout/flanking, active pause — NOT hex turn-by-turn** (hexes are CLASSIC only; Classic stays untouched). The shipped "Modern" is only a 3D RE-SKIN of the hex-turn engine → it does NOT satisfy this; the hex/turn screenshots are exactly what Aaron rejected. Building a real-time tactical "field" engine for Modern is now the #1 build, **bigger than all graphics work combined.** All 4 UG:G pillars are must-haves. Aaron chose **"discuss design first"** before any code. The cinematic 3D foundation + run-h portraits/UI all carry over; the GAMEPLAY layer is the gap. Architecture proposed (run h): two engines/one dataset; brigades grain; ratings→combat modifiers; Gettysburg vertical-slice first. Awaiting Aaron's design confirms.
**DESIGN LOCKED (run h popup Q&A):** mixed/zoom grain (brigades + drill to regiments) · RPG ratings/veterans/traits→combat modifiers · marquee-first coverage · **First Bull Run** vertical slice "one sector to a morale break" · fog of war · officers w/ command range + casualties · ammo + fatigue · distinct inf/art/cav · reactive AI in the slice. Full spec → `MODERN-UGG-PLAN.md`; new-chat prompt → `MODERN-UGG-KICKOFF.md`.
**EDUCATIONAL MISSION ADDED (run h, Aaron):** the game must also teach **PhD-level history + criticism** — maximal accuracy: real **OOBs** (real brigades/commanders/regiments/strengths, no auto-group), real **weapons** (types/calibers/**ranges**/RoF driving combat), real **pictures/flags**, and honest **historiography** (slavery-as-cause vs Lost Cause; the **USCT** story + its criticism — flagship teachable arch in the 1863–65 battles, NOT anachronistically at 1861 Bull Run). Citation-grade research workflow run (run h): Bull Run OOB, USCT, weapons/ballistics, pedagogy, PD image sources → banked to `HISTORICAL-DATA.md`. Plan §0/§1(11)/§4/§5 updated.
**FULL DESIGN SESSION COMPLETE (run h): 35 popup rounds, 63 decisions LOCKED** → `GRAND-STRATEGY-PLAN.md` Parts I–III. The game = three-in-one: **UG:G real-time combat + Paradox-depth owner-mode (you are President Lincoln/Davis) + PhD history/alt-history teaching.** Central tension RESOLVED (rounds 21–33, §27 balance principle): simple low-micro UG:G battle is the always-fun core that stands alone; ALL depth is optional (auto-managed by cabinet advisors who also TEACH, per-domain delegation, play-style presets, fluid mid-campaign dialing); education is ambient/never-blocks/confers-mastery (learning + fun pull the same way). Win paths asymmetric incl. **negotiated peace (both sides)**; hard-loss military-only. Build order = **STRATEGIC-FIRST** (S0–S5 owner-mode wrapping existing battles, then tactical P0–P5). **ARCHITECTURE: modularize via a zero-dep node concat build step → one shippable HTML** (set up in S0); Classic FROZEN. **NEW CHAT ENTRY POINT = `HANDOFF.md` §PASTE** (master handoff; cites all specs). Scope ambition = "protect everything (no cuts)," build ship-quality iteratively.

## RUN h (2026-06-13, Opus 4.8) — 3 queued polish items DONE before the UG:G pivot (all gated, parse-valid, Classic intact)
- **Item 1 units:** free Rodin trial drained ($0 lock) → billboards stay; shipped `_m3dMixerUpdate` procedural motion (idle bob, cavalry sway, cannon recoil+muzzle smoke on `u.fired` edge). GPU probe PASS. `M3D_UNITS_MOTION.js`.
- **Item 2 portraits:** **131 PD photos** (Wikipedia REST → Commons PD-license gate → resize) keyed by surname, side-split for Anderson/Gregg; canonical IIFE refactor (photo lookup inside the portrait closure + `portraitFor` photo-check + warm + upgraded engraving frame). 12-name montage verified real faces in period frames; 2 CC-BY-SA cases fall back to engraving. `assets/portraits/*.jpg` + `.scratch/portraits_manifest.json`.
- **Item 3 UI:** `M3D_UI_SKIN2.js` — drawn engraved order-icons (March/Fire/Charge/Entrench/Stand-Down), richer panel frames, small-caps period type, brass portrait mat. GPU-verified.
- New tools: `tools/probe-motion.mjs`, `tools/probe-portraits.mjs`, `tools/shot-ui.mjs`. NOTE: these polish items now serve the future UG:G Modern (reusable), per the pivot above.

## SESSION 2026-06-13 (run g, Opus 4.8 autonomous) — CINEMATIC GRAPHICS RUN
**DONE (6 chunks spliced + real-GPU-verified on the Mac's Intel UHD 617; Classic proven no-regression; 0 real pageerrors):**
- **G1 post-FX** (`M3D_POSTFX.js`): EffectComposer — ACES tone-map + UnrealBloom + period wet-plate grade + SMAA + film-grain+vignette, **perf-tiered** (Low=direct ACES, Auto=bloom+grade+SMAA+vignette, High=+SSAO+grain; DOF opt-in). Load order adversarially verified.
- **G2 HDRI skies** (`M3D_HDRI_SELECT.js` + 3 CC0 2k HDRIs): day/overcast/dusk auto-selected by weather/tod.
- **G3 PBR terrain** (`M3D_TERRAIN_PBR.js` + 27 CC0 1k maps): MeshStandard albedo/normal/rough per terrain key, vertex-color fallback intact.
- **G5 particles** (`M3D_PARTICLES.js`): rain/snow weather + lingering drifting powder-smoke banks.
- **G6 props** (`M3D_PROPS.js`): instanced procedural forests on woods hexes + buildings on towns + named-feature churches/farms.
- **G8 UI skin** (`M3D_UI_SKIN.js`): conservative additive period-engraving HUD polish.
- Fixed a shot-harness bug (modern-default left Classic `#map` hidden) → Classic shots valid again; proved Classic intact.
**FLAGGED for Aaron (decisions):** (1) **Tripo credits = 0** — top up for rigged+animated 3D units, else billboards stay (free + perf-safe; mixer/GLB hooks wired); fal.ai is paid → not used ($0 lock). (2) **Portrait PD Brady photos** + **full UI taste-pass** = deliberate follow-ups (taste territory; procedural tintype fallback already ships). (3) **Eyeball/perf check** on the UHD 617 — open Modern/High (Gettysburg, Antietam), drop to Auto if it stutters.
**Shots:** `tools/shots/postfx-*`, `gpu-classic-antietam.png`. Details in RUN-LOG run-g.

## SESSION 2026-06-13 (run f, Opus 4.8 autonomous) — MODERN IS THE DEFAULT + ADAPTIVE PERIOD SCORE
**DONE (all gated: full parse + hex + headless Chrome probes I READ; Classic no-regression):**
- **Modern 3D flipped to DEFAULT** — closed the 3 parity gaps (`chunks/out/M3D_PARITY.js`): (1) named-feature labels as 3D parchment plaques (Verified/Inferred styled), (2) live unit badges (name + strength bar + morale/ammo/xp glyphs, same data as Classic), (3) 3D battle FX from the shared `G.fx` queue (muzzle flash, drifting smoke, floating −casualty numbers). `G.settings.gfx` default `classic→modern`; saved "classic" still wins; offline/no-WebGL still reverts to Classic. VISUALLY VERIFIED (Cornfield/Sunken Road/etc. labels, "1st Infantry" green-bar badge, "−73" casualty number). Classic pixel-unchanged.
- **Adaptive period score SHIPPED** (`AUDIO_SCORE.js` + `AUDIO_WIRE.js`) — procedural fife-and-drum (menu/march) + battle drone/din + camp air + harmonic-series bugle calls; din scales with combat intensity; Settings **Music** toggle; charge/victory/defeat bugles; fixed latent "ambient never started in battle". Verified by `tools/audioprobe.mjs` (API runs, din responds to real casualties, zero pageerrors). **Aaron ear-test pending** (musicality is unverifiable by me — the audio analog of the screenshot loop).
**NEW TOOLS:** `tools/bootprobe.mjs` (default-path boot smoke), `tools/audioprobe.mjs` (WebAudio API smoke). New shot scenes: modern-antietam-fx, modern-probe-badge, modern-probe-fx.
**BLENDER PIPELINE NOW LIVE (done from the CC terminal):** Blender 4.5.10 installed via brew, MCP addon enabled headlessly + Poly Haven default on + auto-start patched, GUI launched, server listening on :9876, bridge verified (`get_scene_info` + test `.glb` export + PolyHaven enabled) — no session restart needed. The real-asset ceiling is OPEN. **Aaron's only standing requirement: keep Blender.app open while asset jobs run.** Hyper3D/Hunyuan/Sketchfab need API keys (not yet set) — PolyHaven (PBR + HDRIs, CC0, no key) is the immediate path.
**NEXT ARC = CINEMATIC GRAPHICS RUN (fresh VS Code session) — spec'd in `GRAPHICS-RUN-PROMPT.md`.** 5-round discovery locked it (§A): max three.js single-file, free/CC0, Tripo rig+animate units, PolyHaven PBR+HDRI, cinematic-max post-FX (perf-tiered for Intel UHD 617), particles, PD-tintype portraits, full art-directed UI, deep period research, full-blast + full-autonomy + continuous, real-GPU verify (`tools/shot-gpu.mjs`, built + confirmed on the Mac GPU). Keys in `secrets.local.json` (gitignored) + Blender prefs. **Aaron: keep Blender open, paste `GRAPHICS-RUN-PROMPT.md` §D into a new session.** Deferred to a later run: **Create-a-General + family founding**, systems depth.
**STILL OPEN:** Aaron ear-test (audio) + eyeball (Modern look in his browser); 3D-asset ceiling (Blender gate above); deepen War Dept + Soldier Campaign; rolling OOBs; publish.


## SESSION 2026-06-14c (run e, autonomous) — PANTHEON COMPLETE + WAR DEPARTMENT SHIPPED
**DONE (all gated: parse + hex + dual-render/functional probe; Classic+Modern regression clean):**
- **Pantheon authored maps COMPLETE** — final six (bullrun1, bullrun2, chancellorsville, vicksburg, chickamauga, franklin) authored into AUTHORED_MAPS, all 12 classic+modern renders READ + verified historically faithful. Generator `tools/build_pantheon2.mjs` + research briefs banked. (All 9 pantheon battles now hand-authored: Antietam, Gettysburg, Shiloh, Fredericksburg + these six.)
- **T1 War Department systems SHIPPED** — 1864 Clock + Muster Roll + War Room (namespaced chunks `clk`/`mr`/`wr` + `T1_SHELL` glue), state under `G.campaign.{clock,muster,warroom}`, ticks off campaignAdvance, reachable via newspaper-menu "THE WAR DEPARTMENT CONVENES". Adversarial audit caught + fixed 2 real mr bugs (vetName clobber, per-battle kills). Functional + visual probes PASS. **Aaron: design choices in RUN-LOG run-e — correct anything; the v1 War Room is campaign-economy only (no in-battle combat effect yet, deliberate).**
**STILL OPEN (priority):** (1) Aaron eyeball/playtest — Classic skin tune + mechanics/balance/AI feel + T1 economy/clock feel (genuinely needs his eyes); (2) full historical OOBs at brigade grain (rolling); (3) 3D fidelity climb — gated on Aaron dropping `.glb`/HDRI assets (loaders waiting); (4) publish to web (Aaron runs DEPLOY.md / PHASE4_HALT.md).


## ⚑⚑ FULL 3D PIVOT — TOP PRIORITY (locked 2026-06-14, supersedes the painted-2D pivot below)
Aaron chose **full 3D, as realistic as possible** (Total War / console look) over painted-2D/2.5D. Plan + handoff spec = **`3D-ASSET-PLAN.md`**; folders scaffolded at `assets/3d/`. Tools: **Meshy** (rigged+animated unit `.glb`), **Poly Haven** (CC0 terrain PBR + HDRI). Formats LOCKED: `.glb` / seamless PNG / `.hdr`.
**GATING DECISION (Aaron):** §1 of the plan — **A) local web server (rec; Fable writes a one-click `play.command`)** vs B) embed base64. `.glb`/HDRI can't load on `file://` (fetch blocked); textures can. Default A unless Aaron objects. **Engine build is gated on this + first assets arriving.**
**NEXT (Aaron):** pick A/B → grab Poly Haven terrain materials (clear/field/woods/hills) + a day HDRI → drop in `assets/3d/` → then Meshy soldier_us/cs. Tell Fable what landed.
**THEN (Fable):** P3D-1 Three.js terrain+camera+lighting (units as billboards, 2D canvas as toggle fallback) → P3D-2 unit models → P3D-3 props/veg/water → P3D-4 polish.
**Painted-2D tiles (below) DEMOTED to fallback/LOD skin** — the tile engine + ASSET-PROMPTS.md still valid as the 2D fallback the 3D toggle falls back to; not the primary path anymore.

## ⚑ PAINTED-2D PIVOT (locked 2026-06-14 — now the FALLBACK layer under full-3D)
Aaron: procedural look isn't realistic enough — wanted **UG:G**-level painted terrain. LOCKED then: single-file zero-asset relaxed → `assets/` folder; **painted hex-tile set**. **Tile-loading engine BUILT + smoke PASS** (`Image()`-based, file://-safe, procedural fallback). Placeholder tiles in `assets/terrain/`; prompts in `ASSET-PROMPTS.md`. Now serves as the 2D fallback skin beneath the 3D renderer.

## SESSION 2026-06-14 (autonomous; Aaron: "skip eyeball gate, execute all outstanding")
**DONE this session (all parse-gated + jsdom smoke + regression PASS):**
- G-wave remainder #1 — `spriteBudgetCheck` wired into `_gorDriver`.
- **F1 Antietam authored map COMPLETE** — AUTHORED_MAPS format + `authoredMap()` plumbing + 4 engine hooks (startBattleRuntime, deployForce deploy-zones, _drawFamousFeatures exact-hex, "The Ground" panel). Antietam authored hex-exact, 9 Verified/Inferred features, two-axis deploy zones.
- **Wave 5 COMPLETE** — C10 loot cards (executor) + C11 ratings cards (executor) + C12 a11y retrofit (Fable: full keyboard play, colorblind redundancy, reduced-motion, settings toggles). All wired + audited.
- Cleaned dead G6 tintype code (executor false-positive #3 — verified before removing).
**STILL OPEN (needs Aaron):** the eyeball gate + palette/sprite tune pass — genuinely gated on his eyes; everything else in P0/P1 is shipped.
**NEXT BATCH (F-program):** F2+ pantheon authored maps — Gettysburg, Shiloh, Fredericksburg, Chickamauga, Bull Runs, Franklin, Vicksburg, Chancellorsville (order locked R46). Format + plumbing now exist; each is a Fable authoring job (web research per standing auth) reusing the Antietam pattern. Plus full historical OOBs (rolling).

## SESSION 2026-06-14b (autonomous overnight; Aaron: "pre-approve all bash", went to bed)
**THE UNLOCK:** Fable can now SEE the Modern/WebGL renderer — `tools/shot.mjs` drives the installed Chrome via `playwright-core` + SwiftShader (no MCP, no browser download), screenshots + reads console. The 3D-look loop is no longer Aaron-gated.
**SHIPPED (all parse + hex-grep + screenshot gated; Classic never regressed):**
- **Modern 3D tuned** — closed terrain gaps (circumradius bug), units stand on terrain, ¾ camera, legible two-sided tokens, grounding sun-shadows, elevation. Before/after in `tools/shots/`, verdict in PLAYTEST-LOG.
- **Painted billboards** — reuse the 2D regiment sprite art as `THREE.Sprite`s; **this is what makes Modern worth it**. Ladder: `.glb` → billboard → token.
- **GLB + HDRI loaders wired** — `assets/3d/**` lights up on drop (per-asset fallback); **mobile `gfxQuality` tier** (Auto/High/Low, Settings → Graphics).
- **3 pantheon maps authored + dual-render verified:** Gettysburg, Shiloh, Fredericksburg (each 22×20, Verified/Inferred tagged; generators in `tools/build_*.mjs`).
- **Hosting scaffolded** (local git + `index.html` + `tools/deploy.sh`), **HALT-gated** — see `PHASE4_HALT.md` / `DEPLOY.md`.
**EYEBALL GATE (below) — PARTIALLY RESOLVED:** Fable now self-verifies the Modern look; the painterly-2D/Classic skin tune still genuinely wants Aaron's eyes, but it's no longer the sole 3D-progress blocker.
**STILL OPEN (priority):** (1) author remaining pantheon maps (Chickamauga, Bull Runs, Franklin, Vicksburg, Chancellorsville) — same proven pipeline; (2) T1 systems executor wave — DEFERRED this run (don't splice new systems unattended; pre-flight contracts vs G/save/menu then dispatch); (3) full historical OOBs (rolling); (4) put live (Aaron runs DEPLOY.md); (5) drop 3D assets (Meshy/Poly Haven) → loaders waiting.

## LOCK UPDATES (supersede earlier records — fold into DESIGN-BIBLE/HANDOFF next session)
1. **Canonical folder = ~/Desktop/Video Game.** All future waves write here. Why: two copies existed after the Desktop move; Aaron designated Desktop.
2. **GRAPHICS WAVE = TOP PRIORITY, pulled from v3 to NOW.** Aaron's playtest verdict 2026-06-13: "graphics weren't up to snuff at all… go above and beyond." This supersedes the Round-36 "theater or nothing / static until v3" sequencing — the THEATER half stands (full sprite theater, no tween half-measure), the WAITING half is dead. Scope = G-wave below.

## P0 — GRAPHICS WAVE (G-chunks; scope LOCKED rounds 39–42, 2026-06-13)
**Locked scope decisions:** diagnosis = ALL FOUR failures (units lifeless, terrain flat, UI plain, dark+muddy → total overhaul). North star = **painterly battlefield** (UG table). Dispatch = **ONE MEGA-WAVE** (all G-chunks at once; non-rec, Fable audit absorbs). Light = **sunlit field** (warm daylight baseline, green-gold fields; dark map-room UI frame for contrast; weather/day-phase tints from bright base). Sprites = **20+ dense ranks** per regiment (non-rec; LOD assumed as engineering default — full detail close, ~10 mid, massed-block far, 45fps tripwire — Aaron may override). Camera = **subtle axonometric tilt** (FINAL — supersedes the brief full-oblique pick; art leans, hills rise, units billboard upright, hex grid/click unchanged). Smoke = **transient puffs only** (non-rec; no accumulating banks). **Signature features locked:** generic micro-dressing (snake-rail fences, stone walls, orchards, farmsteads, churches, graveyards) + named famous ground on marquee maps (the Cornfield + Sunken Road at Antietam, Peach Orchard + Little Round Top at Gettysburg, Hornet's Nest at Shiloh) with period-hand labels. **Portraits = procedural engravings** (hatched period style, unique + consistent across cards/letters/papers/Muster Roll; Brady tintype variants for the player's line).

**Round 43 locks:** battle speed slider 1×/2×/4× (animations + AI phase, remembered per session) · AI-phase camera auto-follows the action (toggle to lock) · hit feedback = brief floating casualty numbers (period type, reduced-motion compliant) + dispatch log.

**HISTORICAL ACCURACY PROGRAM (locked rounds 44–45, 2026-06-13 — Aaron picked maximal):**
- **ALL 84 battlefields hex-authored to the real ground** (destination lock). Delivery = ROLLING: authored in batches, marquee first; un-authored battles run the truth-informed generator (real river orientation/town position/terrain character encoded per battle) until they graduate. The game stays playable at every moment.
- **FULL historical OOBs for all 84** (destination lock): real armies at brigade grain, rolling alongside the maps; campaign veterans always override; storied units carry their trait procs.
- **Provenance: map notes in-game** ("The Ground" panel pre-battle: the real terrain and why it mattered) + every authored map tags features **Verified vs Inferred** (cite-confidence discipline applied to terrain). Fable authors from historical knowledge + per-battle web research during authoring sessions; executors NEVER invent history — they build the rendering/data plumbing only.
- **Bigger marquee grids** locked (authored maps may exceed current caps; pan/zoom + LOD carry it; procedural battles keep current sizing).
- **Round 43 UX locks:** speed slider 1×/2×/4× (anims + AI phase) · AI-phase camera auto-follow w/ lock toggle · floating casualty numbers + dispatch log.

**Round 46 locks:** standing web-research authorization per battlefield during authoring · pantheon-first batch order (Gettysburg, Antietam, Shiloh, Fredericksburg, Chickamauga, Bull Runs, Franklin, Vicksburg, Chancellorsville first) · source conflicts: Fable decides + provenance notes, only MATERIAL conflicts surface to Aaron.

**G-WAVE INTEGRATED 2026-06-13 ✅ (autonomous session):** all six chunks executed (G1 needed a respawn after a socket death + a Fable-ordered world-space cache refactor with alignment proof), audited, spliced, Fable-patched (aiDelay into AI stagger ×5, emitFX smoke+casualty numbers into fire/return-volley/charge, followAction hook, reduceMotion+follow settings fields), parse-gated, jsdom-smoke PASS (newspaper menu boots → muster → Fort Sumter → AI phase → turn 2 under the new renderer). File ~326KB. **Caught at gate:** G6 shipped invalid hex `0xBACKG001` (same disease as the engine's original `0x5C1V1L`) — fixed; ADD `0x[0-9a-fA-F]*[g-z]` GREP TO AUDIT-PROTOCOL Gate 1.
**G-wave remainders (small):** (1) ✅ DONE 2026-06-14 — `spriteBudgetCheck(_frameDt)` now wired into `_gorDriver` (measures frame interval pre-throttle, feeds lodBias tripwire; parse-gated PASS); (2) **AARON EYEBALL GATE: open the game in Safari and judge the new look** — log verdicts to PLAYTEST-LOG.md; (3) tune pass on G1 palette/G2 silhouettes per verdict; (4) screenshots for the before/after record. Then F1: Antietam authored map (format + flagship, Fable-authored with web research per standing authorization).

Chunk scope (G1–G6):
- **G1 Terrain painterly pass:** multi-tone parchment fields w/ noise grain, drawn tree canopies for woods, hatched/shaded ridgelines + elevation shadows, rivers with banks/fords/flow highlights, worn-path roads, drawn town buildings, fort earthworks, subtle ink hex grid, map-edge compass rose + scale bar + battle-name cartouche.
- **G2 Sprite theater:** regiments as ranks of tiny drawn soldiers (march / kneel / present / fire / fall / rout-scatter), per arm × side; cavalry at the gallop; gun crews serving pieces; ships with wakes; leaders mounted w/ standard bearer. Strength visibly thins ranks. (Round-36 lock: theater, no tween interim.)
- **G3 Weather & light:** rain streaks + mud sheen, fog banks rolling, snowfall + accumulation tint, hot-haze shimmer; day-phase light (dawn gold / noon flat / dusk red / night-interlude dark w/ torchlight).
- **G4 Battle FX:** powder-smoke volleys that drift with weather, cannon muzzle flash + bounding shot trace, melee dust, rout banners dropping, objective flags rippling.
- **G5 UI & typography pass:** engraved panel frames, period display faces for headings, drawn order-button icons, ratings-card and weapon-card visual language, drawn minimap (FIX dead viewport rect), toast/coach restyle.
- **G6 Newspaper menu rendered:** the locked side-specific broadsheet menu as an actual drawn front page (masthead, columns, woodcut-style art slots, classifieds-as-settings).
- Acceptance: side-by-side screenshots vs current build; Aaron eyeball gate; reduced-motion + a11y compliance baked into every G-contract.

## P0 — C9 PLAYTEST
- Aaron full Safari playtest log → PLAYTEST-LOG.md (findings so far: #1 graphics). Mechanics/balance/AI feel still unreviewed.

## P1 — WAVE 5 ✅ COMPLETE 2026-06-14
- C10 weapon-loot cards ✅ (5 tiers, 10 makers+quirks, 6 named uniques, capture-on-rout → upgrade "Captured Arms").
- C11 regiment ratings cards ✅ (OVR + 5 ratings + dev N/S/SS/XF + 15 X-Factor procs → info panel + roster rows).
- C12 a11y retrofit ✅ (full keyboard play w/ hex cursor + order hotkeys + aim reticle; objective ownership glyph+word+aria; Reduced Motion + Colorblind Aids toggles; prefers-reduced-motion default; cbAids unit glyphs). Balance numbers taken from live WEAPONS/engine data (C9 playtest skipped per Aaron).

## P1 — v1.5 SYSTEMS
War Room economy map (brass table) · franchise winter quarters (draft class, enlistment contracts, training camps, trades, buildable camp) · 1864 Clock · press/Élan + embedded correspondent · asymmetric pay · seasons-gate calendar · skirmish preset · mid-battle save/resume (G.battle serialization).

## P2 — v2.0 SOLDIER CAMPAIGN
March/Camp/Battle triptych · needs+bonds · timing-volley hunt · rumor intel · knapsack · aspirations · origins (incl. USCT both doors) · trading web (mess/sutler/picket) · gambling both-by-context · vices & virtues (whiskey/Revival/pledge/tobacco-coffee) · romance + heat dial (Parlor/Barracks/Burn This Letter default) · sweetheart's own war · disease period-plain · hospital ward arc · POW chapter · desertion arc · Fight On · lineage/cousin · sergeant on the rolls · instrument skill · contraband items · Muster Roll.

## P2 — v2.5
What-If sandbox (corps stacks, full gonzo, war codes) · Home Town (3 archetypes, specialization, report card, museum) · Gauntlet (last stands + endless + procedural + daily seed) · hotseat + play-by-telegraph.

## P3 — v3.0
Life-sim depth (family/romance/literacy/epilogue) · The Executive (both seats) · political ascent + whistle-stop elections · Reconstruction coda + long walk home + annual encampments · Ken Burns replay · wet-plate photo mode · album export · records office · Grand Works · mapmaker/friction · nemesis letters+press · staff & surgeons · mascots in battle · Brady/photographers · saga file export · supersim · raids map-crawl · day-phase acts + night interludes · naval ram/boarding/wind · officer-capture doors · Grand Review finale · sober CS coda.

## DEFERRED DECISIONS
- Vol. II signature system (decide at Vol. II; candidates: enlistment-midnight, militia/Continental).
- Heat-dial visual asset ceiling detail (period-suggestive max; Claude's explicit-content line documented in handoff).

## KNOWN DEFECTS (cosmetic)
- drawMini viewport rect dead code (fix in G5). Stale §2 G.campaign comment. Unused `started` field.

## PIPELINE CRIB (for fresh sessions)
- Executors write chunks/out/*.js, NEVER the HTML; Fable audits (AUDIT-PROTOCOL.md), splices at `/*__ENGINE_END__*/`, parse-gates: extract `<script>` → `node --check`.
- Smoke harness: jsdom + `HTMLCanvasElement.prototype.getContext = () => proxy-noop`, AudioContext undefined, then boot → menu → muster → battle → endPlayerTurn → assert turn advances.
- Popup question protocol: sets of 3, (Rec) prefixed FIRST option, keep firing until Aaron says stop; bank locks to handoff every ~3 rounds; must-read text via send_user_message (between-tool prose gets summarized).
