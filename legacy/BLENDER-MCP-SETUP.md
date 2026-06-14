# Blender MCP — one-time setup (so Claude Code can build/export 3D)

The MCP server config is already dropped at **`.mcp.json`** in this folder (project-scoped, so it loads when this workspace is open in VS Code / Claude Code). It uses `uvx blender-mcp` (the [ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp) server). You finish the Blender side once; after that, Claude Code can drive Blender via natural language to create/modify meshes + materials + lighting, pull **Poly Haven** CC0 assets, generate models via **Hyper3D Rodin**, and export **`.glb`** straight into `assets/3d/`.

> Note: Playwright MCP is already installed in VS Code — that's separate and stays as-is. This `.mcp.json` only adds the `blender` server. If you ALSO keep a project-level Playwright entry somewhere, leave it; this file is additive (and the Playwright MCP you have is configured at the VS Code/user level, so there's no conflict).

## Requirements
- **Blender 4.0+** installed.
- **uv** (the Python package runner that provides `uvx`). Install once:
  `curl -LsSf https://astral.sh/uv/install.sh | sh`  (then restart the terminal so `uvx` is on PATH).

## Steps (once)
1. **Install uv** (above) if `uvx --version` doesn't work.
2. **Get the Blender addon:** download `addon.py` from the blender-mcp repo
   (https://github.com/ahujasid/blender-mcp — the `addon.py` file).
3. **Install the addon in Blender:** Blender → Edit → Preferences → Add-ons → Install… → pick `addon.py` → enable **"Blender MCP"**.
4. **Start the bridge in Blender:** press `N` in the 3D viewport to open the sidebar → **BlenderMCP** tab → (optional) tick "Use Poly Haven" / "Use Hyper3D Rodin" → click **Connect to Claude / Start MCP Server**.
5. **Reload MCP in Claude Code:** the `blender` server in `.mcp.json` connects to that running Blender session. (Restart the Claude Code session if it doesn't pick it up.)

## Verify
Ask Claude Code: *"List the Blender MCP tools and create a test cube, then export it as assets/3d/test.glb."* If a `test.glb` appears, the path is live.

## What it's good for here (and not)
- **Good:** procedural terrain blocking, fences/walls, buildings (Dunker Church, farmhouses), kitbashing/cleanup, importing Poly Haven CC0 assets, batch-exporting `.glb` — i.e., reducing the manual asset shuffle.
- **Not:** hand-sculpted photoreal period soldiers — for rigged/animated infantry/cavalry, generate in **Meshy** (free tier) per `3D-ASSET-PLAN.md` and drop the `.glb` into `assets/3d/models/units/`. Blender MCP can still rig/clean/convert those if needed.

## Safety
Blender MCP can run arbitrary Python in Blender. Keep exports inside this project's `assets/3d/`; don't let it write outside the project folder.
