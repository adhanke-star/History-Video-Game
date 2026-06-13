# DEPLOY — put the game on the web (Mac + iPad/phone + a shareable URL)

**Status (2026-06-14):** scaffold DONE, **nothing published**. Local git repo initialized + all files staged (node_modules ignored). `index.html` redirects to `civil_war_generals.html`. `gh` CLI is installed (v2.91.0). Helper: `tools/deploy.sh`.

> ⚠ **HALT — your call (account-level / outward-facing).** Creating a public GitHub repo and turning on Pages publishes the game to the open web. I did **not** do that. The two steps below are yours to run. See `PHASE4_HALT.md`.

## Why GitHub Pages fits
The game is a static HTML file + relative assets + Three.js from a CDN — exactly what Pages serves for free over HTTPS, and HTTPS is what makes `.glb`/HDRI load everywhere (incl. iPad/iPhone Safari), not just localhost. Asset paths are **relative** (`assets/3d/...`, `assets/terrain/...`) and Three is an absolute CDN URL, so it works at the Pages subpath `https://<user>.github.io/<repo>/` with no rewrites.

## One-command path (you have `gh`)
```bash
cd "~/Desktop/Video Game"
bash tools/deploy.sh check          # sanity (safe)
bash tools/deploy.sh init           # git init + stage (safe; already done, harmless to repeat)
git commit -m "Civil War saga — initial Pages build"   # local commit (review first: git status)
bash tools/deploy.sh remote         # ⚠ PUBLISHES: type PUBLISH to confirm; creates public repo + push + Pages
```
`remote` prompts before doing anything and aborts unless you type `PUBLISH`. Default repo name `civil-war-saga` (override: `bash tools/deploy.sh remote my-name`). Live URL after ~1 min: `https://<your-gh-username>.github.io/<repo>/`.

## Web-UI path (no gh, or you prefer clicking)
1. `git commit -m "..."` locally.
2. github.com → New repository (public) → don't add README/license.
3. `git remote add origin https://github.com/<you>/<repo>.git && git branch -M main && git push -u origin main`
4. Repo → Settings → Pages → Source: **Deploy from a branch**, Branch: **main**, Folder: **/ (root)** → Save.
5. Wait ~1 min → visit the URL it shows. Add to iPad/iPhone Home Screen for an app-like launch.

## After it's live (verify on the real URL)
- Loads on Mac + iPad + iPhone Safari; **Modern** (Settings → Graphics) initializes (Three from CDN over HTTPS).
- On a phone, **3D Quality** auto-drops to **Low** (no shadows, fewer figures) — confirm it's smooth; flip to High to compare.
- When you drop real assets into `assets/3d/` (per `3D-ASSET-PLAN.md`) + push, they light up live (the loaders already probe for them).

## Private instead of public?
Pages on private repos needs a paid plan. For free + shareable, public is simplest (it's a game, no secrets — though note the repo would expose the source). If you want it unlisted-ish, a public repo with an obscure name is the pragmatic free option. Your call.

## Notes
- `.gitignore` keeps `node_modules/`, logs, and non-milestone screenshots out of the repo; the `tools/shots/milestone-*.png` + `baseline-*`/`after-*` before/after record ships.
- `playwright-core` is a **dev** dependency (for `tools/shot.mjs`); it isn't needed at runtime and isn't loaded by the page.
