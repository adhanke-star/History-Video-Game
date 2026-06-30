3D ASSETS - drop files here by EXACT name. See ../../3D-ASSET-PLAN.md for the older playbook.

materials/terrain/  PBR terrain textures (PNG, 2K, seamless). Names: <terrainkey>_albedo.png / _normal.png / _rough.png
                    terrain keys: clear field woods hills ridge town road swamp fort
env/                HDRI skies (.hdr): sky_day.hdr  sky_overcast.hdr  sky_dusk.hdr   (Poly Haven, CC0)
models/units/       Optimized runtime .glb/.gltf unit models. Current Tripo-compatible slots live in
                    data/tripo-unit-assets.json:
                    tripo_infantry_us/cs, tripo_artillery_us/cs, tripo_cavalry_us/cs, tripo_hq_us/cs.
                    Keep runtime files low-poly; detailed/Ultra meshes are source art only.
models/props/       .glb: church_dunker, farmhouse, fence_snake, wall_stone, tree_oak, tree_pine, orchard_tree

Formats are LOCKED: models = glTF 2.0 (.glb preferred, .gltf accepted by the tactical runtime),
materials = seamless PNG, sky = .hdr.

Tripo/AI-output rule:
- The game never calls Tripo at runtime and never depends on an account, API key, credit balance, or live network generation.
- Do not enable a record in data/tripo-unit-assets.json until the optimized runtime file exists, its license/attribution fields are clear, and `node tools/import-tripo-unit-assets.mjs` passes.
- Free Tripo outputs can carry public/attribution limits; paid/Ultra availability can change. Verify current terms before using any generated asset.
- After dropping files, run the importer, `node tools/build.mjs`, `node tools/probe-tripo-unit-assets.mjs`, and the relevant render probes.
