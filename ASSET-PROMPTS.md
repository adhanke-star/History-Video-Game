# PAINTED TERRAIN TILES — generation prompts

Graphics pivot 2026-06-14: realism comes from painted art, not procedural code. The engine now loads a painted PNG per terrain type from `assets/terrain/<key>.png` and tiles it across the hex grid (with the axonometric tilt + seeded flip to break repetition). Any tile that's missing falls back to the old procedural look — so you can drop tiles in one at a time and watch each terrain turn painterly.

**There are placeholder tiles in `assets/terrain/` right now** (programmatic noise, not art) so you can confirm the pipeline works in Safari today. Replace each with real generated art below.

## RECOMMENDED TOOL — Leonardo.Ai (with Tiling ON)
For seamless terrain tiles, the tool matters more than the prompt. **Leonardo.Ai** is the pick: production-favorite for 2D game art, consumer-accessible, and — critically — it has a **Tiling** toggle that forces seamless edges and keeps a consistent look across all 13 tiles. (Midjourney is prettier but has no real tiling mode → visible seams → wrong tool for repeating tiles. Scenario.gg is the heavier studio-grade alternative.)

**Leonardo settings (set these once, reuse for all 13):**
- **Tiling: ON** ← the make-or-break switch. Without it the hexes show an obvious repeating grid.
- Model: any painterly/illustration model (e.g. Leonardo Phoenix / Lucid Realism / Diffusion XL) — *not* a photoreal portrait model.
- Aspect: **1:1 (square)**. Resolution 1024×1024+. Alchemy/quality ON if available.
- **Negative prompt** (paste every time): `text, words, labels, letters, numbers, grid, hexagon, border, frame, ui, watermark, signature, people, vignette, drop shadow, isometric`
- After generating, use Leonardo's **seamless/tile preview** (or eyeball a 2×2 of the result) to confirm edges wrap before saving.

## How to use
1. Open **Leonardo.Ai**, set the options above (Tiling ON). (ChatGPT/Gemini/Grok also work but don't guarantee seamless edges — Leonardo is the recommendation.)
2. Paste the **Shared style** block + one **per-tile** line. Generate.
3. Save the result as **exactly** `assets/terrain/<key>.png` (overwrite the placeholder). Filenames are fixed — the engine maps them by name.
4. Reopen `civil_war_generals.html` (or just refresh) — that terrain is now painted. No code change needed.

## Technical requirements (include in every prompt)
- **Square, seamless/tileable** texture (edges wrap — no seams when repeated).
- **Top-down / slight bird's-eye**, flat lighting (the engine adds its own tilt + shadow).
- **No text, no labels, no grid lines, no borders, no frame, no hexagon outline** — just the ground texture filling the whole square.
- Output **512×512 or 1024×1024 PNG** (the engine downsamples cleanly; bigger = crisper).
- **Muted, natural, period palette** — 1862 American countryside in warm daylight. Painterly, like a hand-painted wargame map (reference: *Ultimate General: Gettysburg*). Not cartoonish, not photoreal, not modern.

## Shared style (prepend to every tile prompt)
> A seamless, tileable top-down texture of [TERRAIN] for a hand-painted Civil War strategy wargame battlefield, in the painterly cartographic style of Ultimate General: Gettysburg. Warm sunlit daylight, muted natural 1860s palette, soft brushwork, no text, no labels, no grid, no border, fills the entire square, edges tile seamlessly. 1024×1024.

## Per-tile prompts (the [TERRAIN] slot)

- **clear.png** — open dry grassland field, pale gold-green summer grass, faint bare patches and trampled tracks.
- **field.png** — cultivated cropland, rows of ripe corn/wheat in gold and green, furrow lines, a farm field in late summer.
- **woods.png** — dense deciduous forest canopy seen from above, rounded treetops in deep and mid greens with shadowed gaps, late-summer foliage.
- **hills.png** — grassy rolling rise, sunlit gold-green turf with gentle relief, lighter on one slope and shadowed on the other.
- **ridge.png** — a higher rocky-grassy crest, exposed tan stone outcrops among dry grass, stronger light-and-shadow relief than hills.
- **town.png** — a small 1860s village seen from above: a few clustered gabled rooftops (grey/red), dirt yards, a church, garden plots.
- **road.png** — a packed-dirt country road / wagon track running through dry grass, pale tan rutted earth, wheel ruts, grassy verges.
- **river.png** — a flowing creek/river seen from above, blue-green water with current highlights, muddy banks and reeds at the edges.
- **ford.png** — a shallow river crossing, paler turquoise shallow water over a stony bed, gravel bars, faint track entering the water.
- **swamp.png** — boggy lowland, dull green-brown standing water, reeds and tufts, scattered dead snags, marshy ground.
- **fort.png** — earthwork fortification seen from above: raised packed-earth parapet and ditch, bare brown soil, gabion baskets, trampled ground.
- **water.png** — deep open water (harbor/sea), darker blue with gentle wave texture and sun glints, for naval battles.
- **shoal.png** — shallow coastal water over a sandy bottom, lighter teal with submerged sandbars and ripples.

## Later (Phase 2 — sprite sheets, separate spec)
Once terrain looks right, the same approach extends to painted soldier/cannon/cavalry **sprite sheets** per side (`assets/sprites/`). I'll write that spec after you've judged the painted terrain — the engine seam (`drawUnitSprite`) is already the place it plugs in.

## Notes
- **Seamlessness matters most.** A tile that doesn't wrap will show a visible grid of repeats. If your generator can't do "seamless," generate larger and I can make it tileable in-pipeline — tell me.
- **One file at a time is fine.** Start with `clear`, `field`, `woods`, `river` (the most common hexes) for the biggest immediate payoff.
- Keep each PNG ideally under ~1–2 MB; the assets folder ships alongside the HTML.
