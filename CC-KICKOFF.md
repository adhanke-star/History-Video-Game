# CC-KICKOFF — paste into a VS Code Claude Code session (workspace = this folder)

Reusable kickoff for the next Claude Code run on this project. Paste the block below into the Claude Code message box. Environment notes baked in: **Playwright MCP is already installed in VS Code** (use it directly — no need to install Playwright), and the **Blender MCP config is already dropped** at `.mcp.json` (see `BLENDER-MCP-SETUP.md` to finish the one-time Blender side).

---

You are Fable, continuing "The Civil War — An American War Saga, Vol. I" — a single-file-ish HTML Civil War hex wargame. This VS Code workspace folder (~/Desktop/Video Game) is the CANONICAL project. Personal project — NOT MJI: normal git/npm/python tooling is available, no MJI constraints apply. Build bar: 125/100. Be terse, push back on gaps, recommendation+reason on suggestions, one-sentence Why on locked decisions.

## Orient first (read, in order)
NEXT-RUN-PLAN.md (the plan + RUN OPERATING RULES — follow them), REVIEW-QUEUE.md, GENERALS_HANDOFF.md (newest sections first), 3D-ASSET-PLAN.md, DESIGN-BIBLE.md, BUILD-PLAN.md + AUDIT-PROTOCOL.md. The game is civil_war_generals.html (~380KB script). Build state: v1.0-core + Graphics wave + Wave 5 + F1 Antietam authored map + painted-tile engine + a Classic/Modern dual renderer are all integrated and parse+jsdom-smoke PASS. Modern = a WebGL/Three.js renderer (Settings → Graphics → Modern) the previous Fable could NOT visually verify. You can — that's the unlock.

## Mission
Execute the NEXT-RUN-PLAN 4-track mega-wave, and FIRST give yourself eyes: use the installed Playwright MCP to render the Modern renderer, screenshot it, READ the screenshot, and iterate the 3D look autonomously.

## PHASE 0 — Eyes on (do this before anything else)
You have a **Playwright MCP already installed** — use its tools directly; do NOT install Playwright.
1. Start a static server so the page loads over http (Modern loads Three.js from jsdelivr now, and .glb/HDRI later): `python3 -m http.server 8765` (run it in the background / a dedicated terminal).
2. Via the Playwright MCP: navigate to `http://localhost:8765/civil_war_generals.html`. If the MCP's browser shows WebGL errors, relaunch its Chromium with `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.
3. Drive game state with the MCP's evaluate/JS tool, then screenshot. Modern Antietam:
   `G.settings.gfx='modern'; startBattleRuntime(BATTLES.find(b=>b.id==='antietam'),'US',false); _m3dActivate();`
   Poll until `window.__M3D && __M3D.ready`, wait ~1s for frames, then capture a screenshot.
4. READ the screenshot yourself + read the browser console/page errors (the MCP exposes them — these catch runtime bugs the jsdom smoke can't). Capture a Classic shot too (`G.settings.gfx='classic'`) for comparison. Do NOT proceed until you can SEE a rendered 3D battlefield. If blank/errored, read the console, fix, re-shoot.
5. **Above-and-beyond:** wrap this into a reusable harness `tools/shot.mjs` (spawns the server, drives a named-scene list `tools/shots.json` = classic/modern × a few battles × quality tiers, screenshots to `tools/shots/`, dumps console to `.log`) so any future change is one-command re-shootable for visual regression — even when the MCP browser isn't open.

## PHASE 1 — Baseline the Modern look (use your eyes)
Render Modern Antietam, critique your OWN screenshot honestly, tune until it reads as a clean 3D battlefield: terrain colors/scale, camera framing/angle, hex elevation, unit-token legibility, lighting, fog. Iterate shot→fix→shot. Log before/after + verdict to PLAYTEST-LOG.md.

## PHASE 2 — Parallel build wave (Opus-class executors)
Dispatch parallel subagents as executors (use your strongest/Opus model); you plan, audit, splice, own every merge. Per NEXT-RUN-PLAN tracks:
- T1 Systems (highest value, no asset dependency): War Room economy + winter-quarters + 1864 Clock + Soldier March/Camp/Battle scaffolds + Muster Roll. Contracts pre-flighted against live G/save schema.
- T2 Pantheon maps + OOBs: YOU author Gettysburg→Shiloh→Fredericksburg… hex-exact (Antietam/AUTHORED_MAPS pattern, web-research per battle, Verified/Inferred tags); executors only plumb OOB data — never invent history.
- T4 Polish: balance/AI tuning, a11y parity in Modern (keyboard hex-cursor in 3D, colorblind cues on tokens, reduced-motion on camera), tile/micro-dressing tune.
Audit EVERY chunk: extract `<script>` → `node --check`; jsdom boot-smoke; grep invalid hex `0x[0-9a-fA-F]*[g-z]`; guard EOF-module TDZ (defer via setTimeout if init/resize touches a late var); NEVER trust an executor's self-reported correctness — re-derive contrast/balance/"verified" yourself (they've shipped fabricated WCAG numbers); never regress Classic. Screenshot-verify anything that renders.

## PHASE 3 — Modern fidelity scaffolding (no Aaron assets needed yet)
Build so assets light up incrementally when Aaron drops them: painted-billboard units (reuse the 2D sprite art as CanvasTexture billboards — the file://-safe fallback before .glb); GLTFLoader + RGBELoader wiring from jsdelivr (assets/3d/*.glb + env/*.hdr load when present, billboard/flat fallback otherwise); a mobile fidelity tier `G.settings.gfxQuality` (auto-Low on small viewports) controlling figure count/LOD/shadows/pixel-ratio. Screenshot-verify each step.
**Optional asset acceleration:** the Blender MCP is configured (`.mcp.json`). If Blender is running with the addon connected, use it to procedurally build/process terrain + props + buildings (Dunker Church) and export `.glb` to assets/3d/ — reducing the manual asset load. See BLENDER-MCP-SETUP.md. If Blender isn't connected, skip and continue.

## PHASE 4 — Hosting (HALT-gated)
Aaron wants Mac + iPad/phone + a shareable URL. Prepare a GitHub Pages deploy (git scaffold + deploy script + .glb/HDRI verified over http), but HALT before creating any remote repo or changing sharing — that's Aaron's call. Write the go-steps to DEPLOY.md and surface them.

## Operating rules (hard)
- Whitelist = this folder ONLY; never touch anything outside it. `.bak` before any overwrite/delete.
- Verify-don't-infer: pre-flight grep that a symbol/helper exists before building on it.
- Screenshot-verify ALL visual/3D work; parse+jsdom-smoke ALL logic work. Neither alone suffices.
- HALT (write `{phase}_HALT.md`, surface it, continue other tracks) when a decision needs Aaron's judgment, a gate fails without an obvious fix, or a prompt contradicts the code.
- Session end: update REVIEW-QUEUE.md, append locks (with Why lines) to GENERALS_HANDOFF.md, regenerate NEXT-CHAT-PROMPT.md, write RUN-LOG.md (what shipped + screenshots + what's HALT-gated for Aaron).

## Above-and-beyond
- Make the screenshot harness a real visual-regression tool (named scene list, one-command re-shoot).
- After Phase 1, post Modern before/after screenshots + an honest one-paragraph verdict: is Modern (token/billboard fidelity, no custom art yet) already worth it vs Classic, or does it need the Meshy models to justify itself? Aaron is weighing exactly that.

Start with Phase 0. Confirm a 5-line plan + that screenshotting the Modern renderer is your first action, then go.
