3D ASSETS - drop files here by EXACT name. See legacy/3D-ASSET-PLAN.md for the older playbook.

PROVENANCE LAW (LANE-014 slice 1): every asset file in this tree must have a verified row in
provenance.json BEFORE it lands - source URL, asset id, authors, license, md5. The media-budget
probe enumerates this tree 1:1 against the ledger, re-hashes every file, and enforces the
hd-terrain-models ledgerClasses caps in data/media-budget.json. An unledgered or unverifiable
file fails the gate. Current inventory: 30/30 files verified byte-identical to Poly Haven CC0
originals (27 terrain maps via tools/fetch_polyhaven_terrain.mjs's asset map; the 3 skies
identified by md5 as syferfontein_18d_clear_puresky / belfast_sunset_puresky /
overcast_soil_puresky at 2k).

materials/terrain/  PBR terrain textures (PNG, 1k, seamless - fetched by
                    tools/fetch_polyhaven_terrain.mjs). Names: <terrainkey>_albedo.png /
                    _normal.png / _rough.png
                    terrain keys: clear field woods hills ridge town road swamp fort
env/                HDRI skies (.hdr, 2k): sky_day.hdr  sky_overcast.hdr  sky_dusk.hdr   (Poly Haven, CC0)
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

MODEL SOURCING PLAN (LANE-014 adjudication 10 - the ARC 3 slice-5 workflow):
- The 8 chartered slots: tripo_unit_{infantry,artillery,cavalry,hq}_{us,cs} (data/tripo-unit-assets.json).
- Production is Aaron-gated: generating/downloading a Tripo Ultra mesh is a human or
  explicitly-authorized browser step under the D398 authorization (free/public outputs,
  CC BY 4.0, verify current terms at use time, no paid credits).
- Per slot, in order: Ultra source -> hand-optimized runtime GLB (<= 1,500,000 bytes /
  20,000 verts / 12,000 tris) -> provenance.json row (Verified) -> ledgerClasses cap chain
  in data/media-budget.json -> license fields clear in data/tripo-unit-assets.json ->
  enabled:true -> importer + probe-tripo-unit-assets + probe-intel-uhd617-profile green.
- The lane never blocks on asset arrival: the workflow is fixture-proven; slots enable
  one at a time as audited files land.
