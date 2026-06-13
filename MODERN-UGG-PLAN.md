# MODERN = ULTIMATE GENERAL: GETTYSBURG-STYLE — BUILD SPEC (authoritative)

**Written 2026-06-13 (run h, Opus 4.8), planning session. Personal project — NOT MJI.**
**This doc is the LAW for the Modern real-time engine. The actual coding happens in a NEW chat** — paste `MODERN-UGG-KICKOFF.md` §PASTE there. Decisions below are LOCKED by Aaron via popup Q&A; honor them verbatim.

---

## 0 · THE VISION (two lines)
**Play:** Modern's **primary** play must FEEL like **Ultimate General: Gettysburg** (Aaron's PS4 muscle memory): **real-time, gridless, drag-to-move + facing, line/column formations, morale/rout/flanking, active pause.** The hex turn-by-turn game is **CLASSIC ONLY** and is FROZEN/finished as of run h — never regress it. The shipped "Modern" today is just a **3D re-skin of the hex-turn engine** — it does NOT satisfy this and must be replaced by a real-time tactical sim.
**Mission (run h, Aaron):** the game is also an **interactive, PhD-level history of the war** — teach graduate-level facts AND historiographical *criticism*. Maximal historical accuracy: real **OOBs** (army→corps→division→brigade→regiment with real commanders, designations, strengths), real **weapons** (types, calibers, **ranges**, rates of fire), real **portraits/pictures/flags** (PD), and honest engagement with the debates (slavery as the cause vs the **Lost Cause** myth, the **USCT** story, command controversies, total war, memory). Provenance discipline: every historical claim tagged **Verified vs Inferred**; criticism surfaced, not buried. See `HISTORICAL-DATA.md` (research dossiers, citation-grade).

## 1 · LOCKED DECISIONS (Aaron, run h — do not re-litigate)
1. **Two play modes, separate engines:** Classic = hex/turn (frozen). Modern = new real-time field sim.
2. **Unit grain = FULL MIXED/ZOOM from the start** — command **brigades** by default AND **drill/detach to regiments**. (Perf is NOT the blocker — LOD handles figure count regardless of grain; the cost is code/design complexity, which Aaron accepted.)
3. **RPG depth = KEEP as combat modifiers** — the derived ratings (FIR/DIS/MOB/ÉLA/STA), veterans, traits, and loot become each unit's combat stats (fire rate, morale, march speed, charge power, fatigue). Loot stays a campaign-layer reward, not in-battle micro.
4. **Coverage = MARQUEE-FIRST, then roll out** — build/tune on the pantheon battles; the engine is data-driven so all 80+ inherit Modern as authoring rolls forward.
5. **First build (new chat) = FIRST BULL RUN vertical slice**, scope "**one sector to a morale break**" (~4–6 brigades a side fighting over one objective until one side routs) — BUT with the full systems below (mixed/zoom + reactive AI), so the slice is a small scene exercising the real engine. (Trade-off accepted: first-playable takes longer than a minimal feel-test.)
6. **Fog of war = YES** — line-of-sight reveal + scouting; woods/ridges conceal.
7. **Officers = command range + bonuses + casualties** — leaders (the 131 PD portraits) buff nearby units' morale/command, command range matters, and they can be wounded/killed (a real loss).
8. **Logistics = ammo + fatigue, BOTH.**
9. **Arm roles = DISTINCT** (combined arms): artillery long-range + canister + melee-weak; cavalry fast flank/charge/screen/scout + line-weak; infantry the backbone.
10. **All 4 UG:G pillars are must-haves:** drag-move+facing · real-time+active-pause · morale/rout/flank · line/column.
11. **EDUCATIONAL MISSION (PhD-level + criticism):** maximal historical accuracy and a teaching layer are first-class, not flavor. (a) **Real historical OOBs** replace auto-grouping — units organized into their actual brigades/divisions with real commanders + regimental designations + strengths (rolling, marquee-first; see HISTORICAL-DATA.md). (b) **Weapons drive combat** — each unit's arm type (Springfield/Enfield/smoothbore/Sharps/Spencer; Napoleon/Parrott/3-inch; carbines) sets its real **range / RoF / lethality** (decision #3 ratings layer on top). (c) **USCT** (United States Colored Troops) included as a flagship teachable arch in the 1863–65 battles (the Crater, New Market Heights, Olustee, Nashville) — NOT at 1861 Bull Run (anachronism); teach their valor AND the criticism (unequal pay, white officers, POW non-treatment, Fort Pillow, Lost Cause erasure). (d) **Pictures** — PD portraits (have 131), plus weapons/flags/USCT images via the same fetch pipeline. (e) **Teaching surface** — optional deep-dive panels per battle/unit/weapon with Verified/Inferred provenance + multiple-interpretation framing; never hagiography, never Lost Cause apologia.

## 2 · ARCHITECTURE — two engines, one dataset
- **Classic** (hex, turn-based) stays byte-for-byte as-is. Modern is a SIBLING, not a mutation of it. `G.settings.gfx` already gates renderer; extend the concept so Modern = the real-time field sim, Classic = the hex board. Offline/no-WebGL → Classic fallback (keep).
- **Modern reads the SAME battle data** (`BATTLES`, `AUTHORED_MAPS`, OOB unit placement) and renders into the SAME three.js scene (`__M3D`) + post-FX, but runs **continuous time, continuous positions, drag orders** — NOT hex centers, NOT turns.
- **New module** (suggest `__FIELD` namespace, append-only chunks like the M3D_* chunks): owns the sim state, control, AI, and the field renderer. Keep it OFF the Classic code path entirely.
- **Battle result must flow into the existing campaign plumbing unchanged** (casualties, ground held, win/loss → `endBattle`/`campaignAdvance`/Muster Roll/1864 Clock). A Modern battle and a Classic battle of the same fight must both produce a compatible result object.

## 3 · REUSE MAP (what exists vs what's new)
**Reuse directly (the visual + data foundation — already shipped, GPU-verified):**
- Cinematic 3D: `M3D_POSTFX` (ACES+bloom+SSAO+grade+SMAA+grain), `M3D_TERRAIN_PBR` (9 CC0 material sets), `M3D_HDRI_SELECT`, `M3D_PARTICLES` (weather + smoke banks), `M3D_PROPS`/`M3D_PROPS2` (forests/buildings/walls/fences/earthworks), `M3D_CAMERA`, `M3D_UI_SKIN`/`M3D_UI_SKIN2`.
- **131 PD portraits** (`assets/portraits/<lastname>.jpg`, side-split anderson/gregg) + `portraitFor()` closure → officer faces on the field + command cards.
- The **per-frame dispatcher** `_m3dFrameUpdate(dt,now)` + reserved sub-hooks (`_m3dMixerUpdate` etc.) — the sim's update can ride the same loop or its own fixed-timestep accumulator.
- The **derived rating fn** (`_OVR_WEIGHTS` line ~10126 + `unitRatings()` ~10140–10184) returns {OVR, fire, disc, mob, elan, stam, ...} from weapon/xp/kills — the source of truth for combat modifiers (decision #3). DO NOT re-invent stats; read these.
- Casualty/morale MATH to ADAPT (not copy): `resolveFire`/`resolveCharge`/`moraleCheck` (lines ~1041–1084) — port the formulas to continuous, positional resolution.
- Adaptive period score (`AUDIO_SCORE`/`AUDIO_WIRE`) — battle din/bugles; wire to the real-time fight intensity.

**Build new (the gap = the real-time GAMEPLAY layer):**
- The whole tactical SIM (continuous movement, fire/melee resolution, morale, fatigue, ammo, fog, command).
- Brigade STRUCTURE (see §4 — the data is flat regiments; brigades must be derived).
- Drag-order control + RTS camera + selection/zoom.
- Reactive tactical AI.
- The field RENDERER (formations of instanced soldiers with LOD; smooth gridless terrain).

## 4 · DATA MODEL — the brigade gap + terrain field
- **CRITICAL GAP:** the OOBs are **flat, regiment-level** — units are created at line ~667 as `{id, side, type, weapon, strength, maxStr, morale, maxMor, c, r, mp, ammo, xp, leader, fired, routed, ...}` placed on hexes. **There is NO brigade/division/corps structure in the data.** Mixed/zoom (decision #2) therefore requires the new engine to **IMPOSE a hierarchy**: group regiments → brigades (→ divisions for context). **DECISION (run h, Aaron — educational mission):** use the **REAL historical OOB**, not auto-grouping. Build the brigade/division hierarchy from `HISTORICAL-DATA.md` (researched, citation-grade): actual brigades, commanders, regimental designations, strengths, and **weapon type per unit**. Bull Run's full OOB is in HISTORICAL-DATA.md for the slice. Roll out marquee-first (decision #4); **auto-group is the FALLBACK only for not-yet-researched battles** so the game stays playable. Author the OOB as a data table (per battle: brigades[] → {name, commander (→portrait key), regiments[{designation, strength, arm, weapon}], side, division}). A **brigade** = {regiments[], side, arm-mix, facing, formation(line/column), posx/posy (continuous), state, leader, morale, ammo, fatigue}; a **regiment** is its visible sub-block.
- **Continuous terrain:** `AUTHORED_MAPS` give per-hex `{t: terrainType, elev}` via `G.battle.M.map[M.key(c,r)]`. Modern must derive: (1) a **smooth heightmap** (bilinear-interpolate hex elevations → no visible tiles), (2) a **terrain-type field** sampled at any (x,z) → drives **move speed** (woods/swamp slow, road fast, water impassable except `ford`), **cover** (woods/walls/earthworks reduce casualties), and **LoS blocking** (woods/ridge/town block sight). Terrain types: clear/field/woods/hills/ridge/town/road/swamp/fort/water/river/ford.
- **Coordinate system:** reuse `_m3dWorld(c,r,elev)` math as the basis, but positions are continuous floats, not hex indices. Picking = raycast against the terrain mesh (already in `_m3dPointerUp`), not hex lookup.

## 5 · SYSTEMS SPEC (each with the recommended technical approach)
**Time:** fixed-timestep sim (REC 20 Hz) via a dt accumulator, decoupled from render; speeds 1×/2×/4× (scale steps/frame); **active pause** (spacebar) — orders issuable + previewed while paused, applied on resume. Honor `reduceMotion`.
**Movement & orders:** click-select a brigade (or box-select; click a sub-block to drill to regiment); **drag** to draw a move arrow — tip = destination, drag direction = facing; the formation steers there (simple steering + terrain speed cost, NO heavy A*), men animate marching, block rotates to face. Modifier/hotkeys: line/column toggle, charge, hold/stop, fall back. Reuse the run-h drawn order-icons (`M3D_UI_SKIN2`) as the order language.
**Formations:** line (wide frontage, max fire, slow) vs column (narrow, fast, weak fire); frontage = f(men, spacing); facing defines the fire/charge arc and the vulnerable flank/rear. (Square/skirmish optional later.)
**Combat (continuous):** each sim tick, a brigade in line-of-sight + range + facing arc auto-fires at the best target; casualties/tick = f(**weapon effective range + falloff to max range + RoF** [from HISTORICAL-DATA.md weapons table] × shooter FIR + ammo + target cover + target frontage exposed + flank/rear multiplier). Melee when blocks contact (charge): quick resolution from ÉLA + numbers + morale + flank. Port the formulas from `resolveFire`/`resolveCharge`; make them positional + per-tick. **Weapon type is the primary range/lethality driver** — a Springfield rifle-musket reaches far with slow RoF; a Spencer repeater is short-fast; smoothbores are short + buck-and-ball deadly up close; artillery dominates at range and canister shreds at <400 yds. This is a core teaching mechanic (the player feels why rifled arms changed the war).
**Morale / rout / rally:** per-unit morale (seed from DIS + leader + veteran) decays from casualties, being flanked/charged, nearby friendly routs, low ammo, fatigue; thresholds steady → shaken → wavering → **routing** (flees toward friendly edge, uncontrollable) → can **rally** if it reaches safety + a leader is near. This is THE feel — tune hardest.
**Fog of war:** maintain a per-side visibility set; an enemy unit is hidden until within a friendly unit's sight radius + LoS (woods/ridge block). Cavalry = wide scout radius. Render hidden enemies absent (or as faded "last-known" markers — REC last-known ghosts).
**Officers/command:** each leader has a position (with their brigade), a **command radius**, and a morale/cohesion bonus to friendly units inside it; out-of-command units are sluggish/brittle. Leaders can be hit (small per-tick chance under fire / in melee) → wounded/killed removes the bonus and dents morale. Show the leader's PD portrait in the unit card + a casualty toast.
**Logistics:** **ammo** per brigade (depletes on fire; low → must conserve/cease fire; resupply near supply/edge); **fatigue** (rises from marching/fighting via inverse STA, lowers fire/melee/speed; recovers when idle). Both surface in the unit card.
**Arm roles:** infantry = backbone (line fire + bayonet). Artillery = long range + devastating canister close + near-helpless in melee + slow to limber/move. Cavalry = fast, strong flank/charge vs disordered/routing, screen + scout (fog), weak holding a line; can dismount (optional later).
**Reactive AI (decision: build now):** brigade-level tactical AI per side — assess threats in view, choose advance/hold/refuse-flank/reinforce/charge/retreat, concentrate on weak/flanked enemies, protect its own flanks, pull back broken units, respect objectives. REC: a lightweight utility/behavior model per brigade + a side-level "intent" (attack/defend the objective). Must run cheap (many brigades × 20 Hz → throttle AI to e.g. 2–4 Hz).
**Camera:** free RTS cam — pan (WASD/edge-scroll), zoom (wheel: strategic → over-the-shoulder), rotate; OrbitControls is a starting point but a custom RTS rig is better. Zoom level also drives the LOD + the mixed/zoom control affordance.
**Rendering / perf (Intel UHD 617 ceiling):** soldiers as **InstancedMesh** per (arm×side) with **LOD**: near = full figures (capped count, e.g. 1 sprite per ~40–60 men), mid = fewer/simpler, far = a flat "block" + flag + bayonet shimmer. Total on-screen figure budget is the hard limit — scale figures-per-man by zoom + a global cap; perf-tier by `gfxQuality` (Auto/High/Low). Reuse billboards or low-poly instanced models; the future `.glb` unit drop (`_m3dUnitModel` hooks) still applies.
**Sound:** drive the existing `AUDIO_SCORE` din from real-time fire intensity; bugles on charge/rout/rally.
**Save:** checkpoint/phase-based (UG:G saves between phases), NOT arbitrary mid-tick — serialize the brigade roster + positions + states at a pause/phase boundary. Keep the campaign save format compatible.
**Campaign integration:** on battle end, emit the same result the campaign consumes (per-side casualties, objective/ground outcome, win/loss) → `endBattle`/`campaignAdvance`/Muster Roll/1864 Clock. A Modern fight must be substitutable for a Classic one.
**Weapons data layer:** a `WEAPONS` table (from HISTORICAL-DATA.md) maps weapon → {effRange, maxRange, RoF, lethality, ammoType} and each OOB unit carries a weapon. Drives §combat ranges, the unit card ("2nd Wisconsin — Springfield M1861, eff. 200–300 yds"), and a teaching panel. Artillery uses per-ammo ranges (solid/shell/case/canister).
**Education / historiography layer (decision #11):** non-blocking, optional depth available everywhere. (a) **"The Ground" + "The Men"** pre-battle panels — terrain & OOB with Verified/Inferred tags (extend the existing provenance discipline). (b) **Unit/leader/weapon deep-dives** — click any unit/officer/gun for its history, the PD picture, and the stats it confers. (c) **"Why it mattered / The Debate"** cards — the historiography: slavery-as-cause vs Lost Cause, USCT valor + the criticism, command controversies, total war, the cost (~750k dead), memory/Reconstruction — multiple-interpretation framing, primary-source quotes, never apologia. (d) A **codex/encyclopedia** accumulating what the player has encountered. Content lives in HISTORICAL-DATA.md; the engine just surfaces it. This is a first-class feature, not flavor.

## 6 · BUILD PHASES (new chat)
- **P0 — scaffold:** `__FIELD` module + a guarded Modern-mode entry (Bull Run only), smooth terrain mesh + RTS camera + raycast picking, render static brigades (instanced, LOD) on continuous ground **from the REAL First Bull Run OOB** (HISTORICAL-DATA.md — real brigades/commanders/regiments/weapons), not auto-grouped. No sim yet. Gate + GPU shot.
- **P1 — control:** select/box-select/drill-to-regiment, drag-move + facing, line/column, steering + terrain speed. Brigades march; men animate. Pause/speed.
- **P2 — the fight:** continuous fire (range/LoS/cover/facing/flank) + casualties + melee/charge; morale → rout → rally. ← the feel-check core of the slice.
- **P3 — depth:** fog of war, officers/command range + casualties, ammo + fatigue, distinct arm roles.
- **P4 — reactive AI** (enemy side) → the slice is now playable to a morale break. **STOP, Aaron feels it, tune.**
- **P5 — expand + teach:** roll out real OOBs marquee-first (auto-group fallback for the rest), campaign result wiring, save, more battles, **USCT** in the 1863–65 battles, the **education/codex layer** (deep-dives + "The Debate" cards + Verified/Inferred), and PD **weapons/flags/USCT image** fetch (reuse the portrait pipeline).
Each phase: `.bak` + parse/hex/collision gate + real-GPU self-verify (you read the shots) + Classic no-regression. Aaron won't test until P4 — self-verify everything.

## 7 · ENGINE SEAMS (civil_war_generals.html)
- Single inline `<script>` (line ~299 → `</script>`); append-only splice before the unique `/*__ENGINE_END__*/` anchor (`node .scratch/splice.mjs chunks/out/<NAME>.js`).
- `G` global state; `G.battle.M` (hex map: `.map`, `.key(c,r)`, per-hex `{t,elev}`, `.GW/.GH`); `G.battle.units` (flat regiments, fields per line ~667); `G.settings.gfx` (modern/classic), `gfxQuality`, `reduceMotion`, battle speed.
- `__M3D` 3D scene (scene/camera/renderer/terrainGroup/unitGroup/raycaster) ~line 10336; `_m3dWorld`/`_m3dTileH` coord math ~10500; render loop + `_m3dFrameUpdate` dispatcher (in `M3D_POSTFX`/chunks).
- Ratings: `_OVR_WEIGHTS` ~10126, `unitRatings()` ~10140. Combat math: `resolveFire`/`resolveCharge`/`moraleCheck` ~1041–1084. Battle lifecycle: `startBattleRuntime`, `endBattle`, `campaignAdvance`.
- `BATTLES` ~374 (Bull Run = `bullrun1`); `AUTHORED_MAPS` (authored hex terrain incl. bullrun1 — Henry House Hill, Stone Bridge, Sudley Ford, Matthews Hill, Chinn Ridge).

## 8 · TOOLCHAIN / GATES / PERF
- **Splice + gate:** `.bak` before each overwrite → splice → extract `<script>` → `node --check` → invalid-hex grep `0x[0-9a-fA-F]*[g-z]` = 0 → collision-grep every new top-level `function` = 0.
- **Real-GPU verify (READ the PNGs):** `tools/shot-postfx.mjs`, `tools/shot-gpu.mjs`, `tools/shot-ui.mjs`, `tools/bootprobe.mjs`, `tools/diag-classic.mjs` (Classic no-regression). Real GPU = **Intel UHD 617** via headed Chrome `--use-angle=metal`. Kill stale server: `lsof -ti tcp:8765 | xargs kill`. Build NEW sim probes (e.g. `tools/probe-field.mjs`) that sample positions/morale/casualties over real frames to verify the sim empirically (a screenshot can't show real-time — see `tools/probe-motion.mjs` for the pattern).
- **Perf target:** smooth on the UHD 617 at Auto tier with a full slice (~10 brigades). Instancing + LOD mandatory; profile figure count.

## 9 · CRITICAL GOTCHAS (banked — violating these breaks the game)
- `G`, `HEX`, `PALETTE`, `THREE_BASE` are `const`/`let` **lexical globals — reference by BARE NAME, never `window.G`.** (Silently muted a whole subsystem in run f.)
- **THREE loads ASYNC** after the spliced script → NEVER `new THREE.*` at a chunk's top level; build in factory fns at runtime.
- **Override-by-redeclaration:** last top-level `function` def wins (hoisting). Extend by redeclaring (replicate prior body + add) OR define a guarded sub-hook the dispatcher already calls.
- NEVER put a literal `*/` (or the engine-end marker) inside a block comment — it closes the comment early → parse fail.
- Single `<script>` tag; one `/*__ENGINE_END__*/` anchor. Honor `reduceMotion` + `gfxQuality` Auto/High/Low.
- **NEVER regress Classic** — Modern is additive/parallel; verify Classic every splice (`diag-classic.mjs`).
- $0 / free-CC0 only; single-file / CDN three@0.128; no build step.

## 10 · OPEN QUESTIONS / RISKS for the new chat (surface to Aaron only at a genuine fork)
- Brigade grouping: auto vs authored for Bull Run (REC auto for the slice).
- Figure-to-man ratio + global figure cap that holds 60fps on the 617 (empirical — tune in P0).
- AI cost at 20 Hz × many brigades (throttle AI tick; profile).
- How faithful the morale/fire numbers must feel — this is iterative; that's why P2/P4 gate on Aaron feeling it.
- Mixed/zoom control affordance (when does a click select brigade vs regiment — REC zoom-level + modifier).
