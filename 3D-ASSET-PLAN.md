# FULL 3D — asset production playbook + handoff spec

**Locked 2026-06-14:** Aaron chose **full 3D, as realistic as possible** (Total War / modern-console look). Then refined: **ship BOTH and let the user choose** — framed as **Classic** (the existing 2D hex board) vs **Modern** (the 3D battlefield), switchable in Settings → Graphics. And **initial build scope = canonical (pantheon) battles first**, built out to all 84 once the look is refined. This doc is the organized way to produce the assets in third-party tools and hand them back to Fable.

### STATUS — Modern engine FOUNDATION BUILT 2026-06-14 (parse + smoke PASS)
- **Settings → Graphics: Classic | Modern** toggle live (default Classic). Classic = untouched 2D renderer; Modern = WebGL/Three.js renderer.
- **Modern v1 (works once Three.js loads from jsdelivr):** heightmapped hex terrain (elevation + PALETTE colors), orbit/pan/zoom camera, sun+sky lighting, fog, **raycast hex-picking** (click hexes/units in 3D → same `onHexClick`), simple 3D **unit tokens** (colored pawn + flag + selection ring). Fully guarded: if Three fails to load it reverts to Classic with a toast; the 2D game is never affected. **Visual look is unverified by Fable (no WebGL in the build sandbox) — your browser is the QA loop; send screenshots and I iterate.**
- **`play.command` written** — double-click to launch the local server + open the game (needed for Modern's `.glb`/HDRI; also fine for everything else).
- **Next fidelity steps (as assets arrive):** unit tokens → painted billboards → `.glb` models; PALETTE-colored terrain → PBR-textured terrain; flat sky → HDRI. Each lights up incrementally.

---

## 0 · Honest expectations (read first)
- **Achievable:** a cohesive, good-looking real-3D battlefield — sculpted terrain with PBR materials, HDRI lighting + shadows, 3D soldier/cavalry/cannon models that march and fire, period buildings and fences. This is a genuine step up and very doable.
- **The ceiling:** AI text-to-3D is good, not AAA, for *niche period content* (1860s uniforms, specific cannon types). Expect "very good game model," not "scanned museum piece." Cohesion (one consistent style across all units) matters more than any single model's fidelity — so we generate all units in ONE tool with ONE style setting.
- **Sequencing that de-risks it:** **terrain + camera + lighting FIRST** (highest visual impact, and its assets — PBR textures + HDRI — are the easy ones). Units come second. The game stays fully playable in 3D with placeholder billboard units while real models trickle in — same incremental model as the terrain tiles.

---

## 1 · ⚠ The one decision that gates everything: how the game runs
Three.js loads `.glb` models and `.hdr` skies via `fetch`/XHR, which **browsers block on `file://`** (double-click-to-open). Textures load fine on `file://` (they use `Image()`), but models and HDRI do **not**. So full 3D needs ONE of:

- **(A) Run a tiny local web server — RECOMMENDED.** One command in the folder: `python3 -m http.server 8080`, then open `http://localhost:8080/civil_war_generals.html`. Everything loads, no bloat, normal dev workflow. Cost: you launch it with a command instead of double-clicking. **I can write you a one-double-click launcher** (`play.command`) that starts the server and opens the browser — so it stays one action.
- **(B) Embed assets as base64 in the HTML.** Keeps pure double-click, but 3D models are big — the file balloons to hundreds of MB and loads slowly. Not recommended for full 3D.

**My recommendation: (A) + I write you the one-click `play.command` launcher.** Tell me A or B before I build the engine; it changes how the loader is written. (Default I'll proceed with A unless you say otherwise.)

---

## 2 · Asset inventory + priority order
Build top-down; the engine renders whatever's present and falls back for what isn't.

| # | Asset class | What | Tool | Format | Priority |
|---|---|---|---|---|---|
| 1 | **Terrain materials** | PBR set (albedo+normal+roughness), seamless, per terrain type (13) | **Poly Haven** (CC0) → grab closest; generate gaps in Scenario/Leonardo | PNG, 2K, seamless | **P1 — do first** |
| 2 | **HDRI sky** | environment lighting + backdrop (day, dusk, overcast) | **Poly Haven** | `.hdr`, 4–8K | **P1** |
| 3 | **Infantry** | Union + CS soldier, rigged + march/fire/fall/idle | **Meshy** (auto-rig + animations) | `.glb` | P2 |
| 4 | **Cavalry** | horse + mounted rider, per side | **Meshy** | `.glb` | P2 |
| 5 | **Artillery** | field cannon + (optional) crew, per side | **Meshy** / Sketchfab CC0 | `.glb` | P2 |
| 6 | **Leader/HQ** | mounted general + flag bearer, per side | **Meshy** | `.glb` | P3 |
| 7 | **Warship/fort** | gunboat/ironclad; earthwork battery | **Meshy** / Sketchfab | `.glb` | P3 |
| 8 | **Props** | Dunker Church, farmhouse, snake-rail fence, stone wall, oak/pine tree, orchard | **Poly Haven + Sketchfab CC0**, generate gaps in Meshy | `.glb` | P3 |

---

## 3 · Tool-by-tool, with exact settings

### Units → **Meshy.ai** ([meshy.ai](https://www.meshy.ai/))
Why: the only tool with built-in **auto-rigging + animation library** + `.glb` export in one place — so soldiers come out animation-ready, no Blender step.
- **Per unit: Text-to-3D → generate → Auto-Rig → apply animations → export GLB.**
- **Generate all units with the SAME style setting** (Meshy "Realistic" style) so the army looks cohesive.
- Apply these animation clips to each unit and export them in the GLB: **idle, walk (march), attack (fire), and a death/fall**. (Meshy ships 100+ presets — pick the closest.)
- **Export: GLB, with skeleton + animations, Y-up, real-world-ish scale (a man ≈ 1.8 units).**
- Prompts (one per unit — keep style words identical for cohesion):
  - `soldier_us` → "American Civil War Union infantry soldier, dark blue wool coat and kepi, light blue trousers, leather belt, musket with bayonet, 1862, realistic game character, full body, neutral standing pose"
  - `soldier_cs` → same but "Confederate infantry, butternut-grey wool coat and slouch hat, grey trousers"
  - `cavalry_us` / `cavalry_cs` → "...cavalry trooper mounted on a horse, carbine and saber, [blue/grey] uniform, realistic game character"
  - `cannon_us` / `cannon_cs` → "American Civil War 12-pounder Napoleon field cannon on a wooden carriage with wheels, bronze barrel, realistic game prop" (crew optional, separate)
  - `general_us` / `general_cs` → "American Civil War [Union/Confederate] general, mounted officer on horseback, dress uniform, sword, realistic game character"

### Terrain materials + sky → **Poly Haven** ([polyhaven.com](https://polyhaven.com/)) — CC0, free
Why: free public-domain, real PBR sets + HDRIs, download as the maps we need.
- **Textures tab** → grab the closest natural material for each terrain, download **2K, PNG**: dry grass→`clear`, farmland/wheat→`field`, forest floor→`woods`, rocky grass→`hills`/`ridge`, dirt road→`road`, mud→`swamp`, packed earth→`fort`, cobble/ground→`town`; water from a shader (I'll handle), so skip river/water materials.
- Download **Diffuse/Albedo + Normal (GL) + Rough** for each. (If a map's missing, albedo alone is fine to start.)
- **HDRIs tab** → one clear-day, one overcast, one golden-hour/dusk; download **4K `.hdr`**.

### Props → **Poly Haven models + Sketchfab CC0**, generate gaps in Meshy
- Poly Haven Models / Sketchfab (filter license = CC0/downloadable) for trees, fences, generic farmhouse.
- Generate the period-specific ones (Dunker Church, snake-rail fence) in Meshy if not found. Export GLB.

---

## 4 · LOCKED formats (everything must come back this way to be engine-ready)
- **Models:** `.glb` (glTF 2.0 binary, single file, embeds mesh + PBR + skeleton + animations). NOT .fbx/.obj/.blend.
- **Materials:** `.png`, seamless, power-of-two (2048²). Suffix the map type: `_albedo` / `_normal` / `_rough`.
- **Sky:** `.hdr` (HDRI).
- **Scale:** metric-ish, Y-up (Meshy/Poly Haven default). A soldier ≈ 1.8, a cannon ≈ 1.5 tall.

---

## 5 · Folder + naming convention (drop files in EXACTLY these names)
The engine maps assets by path+name. Created for you under `assets/3d/`:

```
assets/3d/
  materials/terrain/   clear_albedo.png  clear_normal.png  clear_rough.png
                       field_albedo.png  ... (per terrain key: clear field woods hills ridge town road swamp fort)
  env/                 sky_day.hdr  sky_overcast.hdr  sky_dusk.hdr
  models/units/        soldier_us.glb  soldier_cs.glb  cavalry_us.glb  cavalry_cs.glb
                       cannon_us.glb   cannon_cs.glb   general_us.glb  general_cs.glb
                       warship_us.glb  warship_cs.glb  fort.glb
  models/props/        church_dunker.glb  farmhouse.glb  fence_snake.glb  wall_stone.glb
                       tree_oak.glb  tree_pine.glb  orchard_tree.glb
```
(Terrain keys match the engine's `TERRAIN` table. Unit names match `ARM` types × side.)

---

## 6 · HANDOFF — how you feed assets back to me
**Same incremental model as the tiles: drop a file in, refresh, it appears. No code change needed from you.**
1. Save each asset with the **exact filename** above into the right `assets/3d/...` folder.
2. In chat, tell me **what landed** ("soldier_us.glb + the 3 clear/ terrain maps are in"). I verify each loads, wire it to the right hook, and re-gate.
3. If a tool exports a different name or a `.zip`, just drop it in and tell me — I'll rename/unpack to spec.
4. I keep a **fallback** for everything not yet present (billboard units, flat-color terrain), so the game is always runnable as assets arrive.
5. If a model looks wrong in-engine (scale/orientation/origin), I'll tell you the exact fix to re-export (Meshy/Poly Haven settings), so we correct at the source.

---

## 7 · Engine plan (Fable builds; phased, gated on §1 decision)
- **P3D-1 — Terrain + camera + lighting (file://-safe assets, biggest impact):** Three.js (CDN r128) scene; build a terrain mesh from the hex grid with elevation from `tile.elev`; texture each hex region with the PBR terrain material (fallback = flat PALETTE color); HDRI sky + directional sun + shadows; **orbit/pan/zoom camera**; **raycast hex-picking** to replace `pixelToColrow` for clicks; fog. Units render as **billboards** (reuse current sprite art projected onto the 3D ground) so the game is fully playable in 3D before any model exists. A settings toggle keeps the 2D canvas renderer as fallback.
- **P3D-2 — Unit models:** load `.glb` per (type×side), place on hex centers, drive idle/march/fire/fall from the GLB's animation clips; instancing/LOD for 20+-figure regiments.
- **P3D-3 — Props, vegetation, water:** trees on woods hexes, buildings on towns (Dunker Church on its hex), fences/walls as micro-dressing, a water shader for river/ford/sea.
- **P3D-4 — Polish:** contact shadows, day-phase lighting from the dusk/overcast HDRIs, 3D smoke/muzzle FX, reduced-motion + a11y parity, perf pass.

**Existing work that carries over:** all game logic/state, AUTHORED_MAPS (heightmap + material per hex come straight from the authored grid + elev), the painted 2D tiles (become the fallback skin / can texture distant LOD). The 2D canvas renderer stays as a toggle.

## 8 · First moves for you (in order)
1. Tell me **§1: A (local server, I write the launcher) or B (embed)**. — *gates the engine build.*
2. Grab from **Poly Haven**: 3–4 terrain materials (start `clear`, `field`, `woods`, `hills`) + one **day HDRI**. Drop into `assets/3d/`. — *lets me build + show you real 3D terrain first.*
3. Then **Meshy**: generate `soldier_us` + `soldier_cs` (rigged, with march/fire/idle), export GLB, drop in.
4. Tell me what landed; I wire + re-gate after each drop.
