# Blender MCP — finish the connection (Aaron, ~5 min, one time)

**Status (2026-06-14):** `uv`/`uvx` are now installed (`~/.local/bin/uvx`, v0.11.21). The addon is downloaded to `tools/blender_mcp_addon.py`. **Blender itself is NOT installed** — that's the only blocker. Until Blender is installed + the bridge started, the `blender` server in `.mcp.json` has nothing to connect to, so this session skipped all Blender-driven asset work and used billboard/procedural fallbacks instead. Nothing else is blocked.

## What's left (GUI-only — Claude can't click inside Blender)
1. **Install Blender 4.0+** — https://www.blender.org/download/ (or `brew install --cask blender`). Drag to `/Applications`.
2. **Install the addon:** Blender → **Edit → Preferences → Add-ons → Install…** → pick `tools/blender_mcp_addon.py` (in this project folder) → enable the **"Blender MCP"** checkbox.
3. **Open the panel:** in the 3D viewport press **N** → a sidebar opens → click the **BlenderMCP** tab.
4. **(Optional) tick** "Use Poly Haven" and "Use Hyper3D Rodin" for CC0 asset import + AI model generation.
5. **Click "Connect to Claude" / "Start MCP Server."** Leave Blender running.
6. **Restart this Claude Code session** so the `blender` server in `.mcp.json` (`uvx blender-mcp`) connects to the running Blender. If `uvx` isn't found on restart, open a fresh terminal first so `~/.local/bin` is on PATH (the uv installer added it to your shell profile).

## Verify
Ask me: *"List the Blender MCP tools and make a test cube, export to assets/3d/test.glb."* If `test.glb` appears, the path is live.

## What I'll use it for (once connected)
Procedural terrain blocking, fences/walls, period buildings (Dunker Church, farmhouses), Poly Haven CC0 imports, kitbash/cleanup, and **batch `.glb` export straight into `assets/3d/`** — cutting the manual asset shuffle. NOT for rigged/animated soldiers — those still come from **Meshy** per `3D-ASSET-PLAN.md`. Exports stay inside `assets/3d/` (safety).
