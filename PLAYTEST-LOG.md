# PLAYTEST LOG — The Civil War (Vol. I)

Aaron's Safari playtest verdicts. Fable logs every finding here, tagged and prioritized, then folds fixes into the build. **Canonical folder: ~/Desktop/Video Game.**

## Format
`[DATE] #N · SEVERITY (blocker/major/minor/polish) · AREA · finding → disposition`

---

## C9 — pre-graphics findings
- 2026-06-13 #1 · major · GRAPHICS · "graphics weren't up to snuff at all… go above and beyond." → triggered the full G-wave overhaul (now built + integrated). Awaiting re-judgment under the new renderer (eyeball gate below).
- Mechanics / balance / AI feel: UNREVIEWED (deferred until graphics pass the gate).

## G-WAVE EYEBALL GATE (open — awaiting Aaron's verdicts under the new painterly renderer)
Judge in Safari, log verdicts here. Suggested look-fors:
- Terrain: does sunlit painterly read? fields green-gold, drama from shadow not gloom?
- Sprites: do 20+-figure ranks read as human regiments? silhouettes legible at zoom?
- Axonometric tilt: hills/ridges rise convincingly? units upright + clickable?
- UI frame: dark map-room contrast against the bright field?
- Newspaper menu: side-specific masthead land?
- FX: transient smoke puffs, muzzle flash, floating casualty numbers feel right?
- (verdicts go here)

## SHIPPED SINCE (2026-06-14 autonomous session — Aaron: "skip eyeball gate, execute all outstanding")
- G-wave remainder #1: `spriteBudgetCheck(_frameDt)` wired into `_gorDriver` (LOD tripwire live).
- F1 Antietam authored map: AUTHORED_MAPS format + `authoredMap()` plumbing + hooks (startBattleRuntime, deployForce zones, _drawFamousFeatures exact-hex, "The Ground" provenance panel). Antietam authored hex-exact (Cornfield/Dunker Church/West+East Woods/Sunken Road/Burnside's Bridge/Sharpsburg/creek), 9 Verified/Inferred-tagged features, 3 objectives, two-axis deploy zones. jsdom smoke PASS.
- C10 weapon loot cards (5 tiers, 10 makers + quirks, 6 named uniques, capture-on-rout) — wired into killUnit + upgrade "Captured Arms" section.
- C11 regiment ratings cards (OVR + 5 ratings + dev tiers + 15 X-Factor procs) — wired into unit info panel + upgrade roster rows.
- C12 a11y retrofit: full keyboard play (hex cursor + order hotkeys + aim reticle), objective ownership redundancy (glyph+word+aria, SR-safe), Reduced Motion + Colorblind Aids settings toggles, prefers-reduced-motion OS default, cbAids unit side-glyphs.
- Cleaned dead G6 tintype comparison (G.sel.side===G.battle object-vs-string; false-positive #3 from executors — verified harmless before removing).
- File ~365KB script / 8500+ lines. Parse PASS, jsdom smoke + regression PASS.
- STILL OPEN — Aaron's eyeball gate on the painterly look + the palette/sprite TUNE pass (genuinely needs his eyes; tuning blind is wasted motion).

## 2026-06-14 — MODERN 3D: FABLE NOW HAS EYES (the unlock) + Phase-1 baseline tune
**Mechanism:** built `tools/shot.mjs` (+ `tools/shots.json`) — drives the *installed* Google Chrome via `playwright-core` (no browser download) with SwiftShader software-WebGL flags, dismisses "The Ground" overlay, polls `__M3D.ready`, screenshots to `tools/shots/`, dumps console to `.log`. One command re-shoots any named scene → real visual-regression. (The Playwright **MCP** the kickoff assumed is NOT exposed to this session and no PW browsers were cached; driving Chrome directly is the equivalent + reusable.) Modern Antietam confirmed `ready=true`, clean console (only a benign SwiftShader ReadPixels perf warning).

**BEFORE** (`tools/shots/baseline-modern-antietam.png`) — honest read: pale hex "poker chips" with **visible gaps** between them, floating in a large blue void; camera too high/far (field filled ~40% of frame); units near-indistinguishable dark cylinders (US `#2b4d7e` vs CS `#8a7d66`, both midtone) and **floating above the tiles** (units placed at `elev*EH`, tiles topped at a different height). Read as a tech demo, not a battlefield. Classic read as the *more* coherent map.

**FIXES (engine core, modern-only `_m3d*`; Classic untouched & verified pixel-identical):**
1. **Gaps closed** — terrain cylinders used the hex *inradius* (`hexW/2`) as the radius; `CylinderGeometry` radius is the *circumradius* (`= HEX`). Switched to `HEX*S*1.015`. Terrain now contiguous.
2. **Units sit on the ground** — shared `_m3dTileH(elev)` used by both terrain top and unit base; fixed the float.
3. **Camera** — pulled in + lowered to a ¾ battlefield angle (`span*0.58` high, `+span*0.70` back); field now fills the frame.
4. **Token legibility** — taller/thinner figure-ish body + contrasting cap (US blue body + light cap, CS butternut body + dark cap) + side-colored base disc (reads ownership top-down) + bigger flag. Sides now instantly distinguishable.
5. **Elevation drama** up (`0.5 + elev*1.5`); subtle deterministic per-tile color variation + slight deepen so it reads as terrain not chips.
6. **Grounding shadows** — sun `castShadow` + PCFSoft, shadow frustum framed to the field; units cast, terrain casts+receives. Gated off when `gfxQuality==='low'` (mobile tier hook). Biggest "is-it-3D" win.

**AFTER** (`tools/shots/after-modern-antietam.png`): contiguous, shadowed 3D hex battlefield; visible central ridge; two-sided forces legible at a glance; camera framed. Parse PASS, `modern:ready`, Classic regression PASS.

**HONEST VERDICT — is Modern (tokens, no custom art) worth it vs Classic yet?**
*Partly.* Post-tune, Modern is a **credible 3D battlefield and a real foundation** — the elevation/immersion/"wow" Classic can't give. But it does **not yet clearly beat Classic for actual play**: Classic's labeled chits convey unit identity + strength + objective ownership far more densely and faster to read; Modern's terrain is still abstract colored hexes (not real ground) and its tokens carry no name/strength readout or named-feature labels. **Threshold to justify the switch = Phase-3 painted billboards** (reuse the existing 2D sprite art as CanvasTexture billboards — *zero* new Aaron assets), which should flip it from "neat demo" to "clearly better." Meshy rigged models + PBR terrain + HDRI are the *ceiling*, not the bar. Recommendation: ship Modern as opt-in now, prioritize billboards next, keep Classic the default until billboards land.

## 2026-06-14 — PHASE 3a SHIPPED: painted-billboard units (the threshold is crossed)
Wired the 2D sprite-theater regiment art into Modern: `_m3dUnitBillboard()` pulls `_buildSprite(u,tier,skin,rng).cv` (the cached offscreen canvas of the *actual* drawn regiment — figures thin with strength, regimental flags, pose variants) and mounts it as a camera-facing `THREE.Sprite` (transparent + alphaTest cutout) anchored at the hex top, over a side-colored ownership disc, selection ring preserved. **No new assets, file://-safe, falls back to the simple token on any failure.** Full-detail figures (tier 0) on high; tier 1 on `gfxQuality==='low'`.
- Iterated scale by screenshot: first pass figures read too small (transparent canvas padding) → bumped sprite height inf 4.2 / hq 4.8, anchor `center.y=0.18`, disc 1.0.
- Shots: `tools/shots/milestone-billboards-overview.png` (full field) + `milestone-billboards-hero.png` (dollied-in close-up via the new `postEval` scene hook). Close-up shows clear ranks of individual soldiers + flags on shadowed, elevated hexes.

**UPDATED VERDICT — Modern now clearly worth shipping vs Classic.** With billboards, Modern renders painted regiments (the same art Classic uses) on sculpted, shadowed, elevated terrain — it matches Classic's unit fidelity *and* adds 3D ground/immersion. It now **meets or beats** Classic on look. Remaining gaps (not blockers): live badges (morale/ammo/xp) + unit-name labels aren't on the billboards yet (they're 2D "live layers"); named-feature labels (Cornfield/Sunken Road) aren't drawn in 3D; far-zoom figures are small (orbit-in fixes it). Next ceiling = Meshy `.glb` models + PBR terrain + HDRI (Phase 3b loaders now wired to accept them). Recommendation: still default Classic for now (badges/labels parity), but Modern is demo-ready and the gap is small.

## 2026-06-14 — PHASE 3b/3c + TWO PANTHEON MAPS SHIPPED
- **3b loaders wired:** optional GLTFLoader (`.glb` unit models) + RGBELoader (HDRI sky) load from jsdelivr alongside Three core; their failure can't abort Modern. Per-asset probe → cache-absent → billboard/flat-sky fallback (the ~7× `404` in console at battle start is the *expected* one-time probe for `assets/3d/...` files that don't exist yet; cached after one try, never retried; no `pageerror`). Fidelity ladder per unit: loaded model → painted billboard → simple token. Drop a `soldier_us.glb` / `sky_day.hdr` in and it lights up, no code change.
- **3c mobile tier:** `_m3dLowTier()` (explicit `gfxQuality` 'low'/'high' wins; 'auto'/unset → Low on ≤720px viewport or coarse pointer). Low = pixelRatio 1, no antialias, **no shadows**, tier-1 figures (fewer soldiers). Settings → Graphics → **3D Quality (Auto/High/Low)** added + live-applies (`_m3dApplyQuality`). Verified `modern-antietam-low.png` (flat, shadowless, sparser) vs high.
- **MAPS authored (Fable, web-knowledge + Antietam pattern; Verified/Inferred tagged):**
  - **Gettysburg** (22×20): the fishhook — Culp's Hill barb, Cemetery Hill bend, Cemetery Ridge to the Round Tops; Seminary Ridge (CS) opposite; Peach Orchard/Wheatfield/Devil's Den SW; the Angle (Pickett's Charge); Emmitsburg Rd (Inferred). 4 objs, 12 features. `milestone-gettysburg-{classic,modern}.png`.
  - **Shiloh** (22×20): Tennessee River back (E), Owl/Lick Creeks flanks, Corinth Rd from SW, Hornet's Nest/Sunken Road center, Peach Orchard, Bloody Pond, Shiloh Church; Corinth Rd (Inferred). 4 objs, 11 features. `milestone-shiloh-{classic,modern}.png`.
  - Both render correctly in **Classic AND Modern**, deploy zones place forces right, "The Ground" panel shows. Parse + hex-grep + dual-render gated. Generators saved: `tools/build_gettysburg.mjs`, `tools/build_shiloh.mjs` (validate row widths; re-runnable for tuning).


## 2026-06-14 (run e) — PANTHEON MAPS BATCH 2 + WAR DEPARTMENT (Fable autonomous; READ every render)
**Six pantheon maps authored + dual-render verified** (bullrun1, bullrun2, chancellorsville, vicksburg, chickamauga, franklin). Pipeline: 6 parallel web-research briefs (NPS/ABT/LoC) → hand-authored grids via `tools/build_pantheon2.mjs` (self-validating) → splice → parse + hex gate → all 12 classic+modern scenes booted clean, READ each PNG. Verdicts: each renders to the real ground — Chickamauga's LaFayette-Road spine + Snodgrass NW, Vicksburg's Mississippi + fort arc, Franklin's Harpeth moat + killing-plain, Bull Runs' railroad cut / Henry Hill, Chancellorsville's Wilderness + crossroads. Classic-antietam/gettysburg re-shot = no regression.
**War Department (1864 Clock / Muster Roll / War Room) SHIPPED + verified.** Functional probe drove a real 3-battle campaign: 1864 election fires, ledger preserves period names + accumulates kills, War Room economy + Clock interlink work, all Wire paths mutate state, zero errors. Visual: fixed a dark-on-dark contrast bug (War Room panel) — all 3 tabs now legible parchment panels (`t1-{clock,muster,warroom}.png`). Reachable from the newspaper menu ("THE WAR DEPARTMENT CONVENES" → opens the tabbed sheet). See RUN-LOG run-e for design choices to course-correct.
**Still genuinely needs Aaron's eyes:** Classic skin palette/sprite tune; mechanics/balance/AI feel; whether the 1864 Clock numbers + War Room economy feel right in actual play.

## 2026-06-13 (run f) — MODERN IS NOW THE DEFAULT RENDERER + audio score (Opus 4.8, READ every shot)
**Modern 3D now beats Classic and is the default.** Closed the 3 gaps the prior handoff named: 3D feature-label plaques (Cornfield/Sunken Road/Dunker Church/Sharpsburg/Antietam Creek/Burnside's — Verified vs Inferred styled), live unit badges (name + green/amber/red strength bar + morale/ammo/xp glyphs), and 3D battle FX (muzzle flash, drifting powder smoke, rising −casualty numbers) off the shared `G.fx` queue. Confirmed in pixels (`tools/shots/modern-antietam{,-hero,-fx}.png`, `modern-probe-{badge,fx}.png`). Classic re-shot = unchanged; offline/no-WebGL still falls back to Classic.
**WHAT TO JUDGE (Aaron, in your browser via play.command):** (a) does the 3D battlefield read better than Classic now? badges legible at normal zoom or too busy? (b) labels placed well / not overlapping? (c) FX — smoke density, casualty-number size/timing feel right? (d) at full-field zoom are badges cluttered (candidate LOD: full badge only for selected/hovered, compact bar otherwise)?
**Audio (NEW — needs your EARS; I can't hear it):** procedural fife-and-drum on the menu, a martial drone + scaling battle-din in fights, harmonic-series bugle calls (charge when you charge; to-the-colors on victory, taps on defeat), lonely camp air. Settings → **Music** toggle. Judge: musicality, mix balance (din vs music vs SFX), whether the din intensity tracks the fight. Verified working/no-crash via probe; tuning is by ear.
