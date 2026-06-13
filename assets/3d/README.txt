3D ASSETS — drop files here by EXACT name. See ../../3D-ASSET-PLAN.md for the full playbook.

materials/terrain/  PBR terrain textures (PNG, 2K, seamless). Names: <terrainkey>_albedo.png / _normal.png / _rough.png
                    terrain keys: clear field woods hills ridge town road swamp fort
env/                HDRI skies (.hdr): sky_day.hdr  sky_overcast.hdr  sky_dusk.hdr   (Poly Haven, CC0)
models/units/       .glb, rigged + animated (Meshy): soldier_us/cs, cavalry_us/cs, cannon_us/cs,
                    general_us/cs, warship_us/cs, fort
models/props/       .glb: church_dunker, farmhouse, fence_snake, wall_stone, tree_oak, tree_pine, orchard_tree

Formats are LOCKED: models = .glb (glTF 2.0), materials = seamless PNG, sky = .hdr.
The engine renders whatever is present and falls back for the rest — drop in one file, refresh, it appears.
After dropping files, tell Fable in chat what landed; Fable verifies + wires each.
