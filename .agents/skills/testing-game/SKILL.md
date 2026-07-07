---
name: testing-history-video-game
description: End-to-end testing workflow for the Civil War grand-strategy game. Use when verifying UI rendering, module loading, or strategic-turn features.
---

# Testing the History-Video-Game

## Build

```bash
cd /home/ubuntu/repos/History-Video-Game
node tools/build.mjs
```

This concatenates all `src/*.js` modules (ordered by `src/00-manifest.json`) into a single `civil_war_generals.html`. The build runs three gates:
- **Parse gate**: `node --check` on every source file
- **Hex bomb detection**: scans for invalid hex literals
- **Collision gate**: verifies function declarations appear the expected number of times (once for unique, twice for intentional overrides)

## Serve Locally

```bash
cd /home/ubuntu/repos/History-Video-Game
python3 -m http.server 8080
```

Then open `http://localhost:8080/civil_war_generals.html` in Chrome.

## Automated Probes

Three Playwright-based probes exist in `tools/`:

```bash
# Boot probe — checks the game loads without fatal errors
node tools/bootprobe.mjs

# Turn-1 probe — verifies a campaign can start and advance one turn
node tools/t1probe.mjs

# Diagnostic probe — runs broader checks
node tools/diag-classic.mjs
```

If Playwright/Chrome is not installed, run `yes | npx playwright install chrome` first.

## Manual E2E Testing — Reaching the Strategic Turn UI

The strategic turn desk ("The President's Desk") is where most module rendering happens. To reach it quickly:

1. Click **"Federal Armies Muster for War"** (Union campaign)
2. Select **"Standard Campaign"**
3. A battle loads (Fort Sumter). Click **Menu → Abandon Battle → Abandon** to skip it
4. The **strategic turn interstitial** appears ("To the Executive Mansion")
5. Click **"Review the War Effort"** to open the War Department desk

The desk has 13 tabs, each exercising different modules:

| Tab | Key Modules Exercised |
|-----|----------------------|
| The War Effort | Economy overview, logPush, gameData |
| The Treasury | Economy finance, logPush, gameData |
| Diplomacy | Blockade, logPush, gameData |
| Paths to Victory | Victory paths, logPush |
| The Armory | Weapons + Artillery + Engineering, campaignYear, htmlEsc, gameData |
| Cabinet | Advisors, htmlEsc, gameData, dateToNum, tenureToNum |
| Command | Generals, htmlEsc, gameData, dateToNum, tenureToNum |
| Decisions | Decision cards, htmlEsc, gameData |
| The Press | Newspapers, htmlEsc, gameData |
| War Room / 1864 Clock / Muster Roll / Theater Map | Base modules |

## What to Check

- **Tab content renders** — not blank, no "[object Object]" text
- **HTML escaping** — apostrophes and quotes display correctly (not as `&amp;` etc.)
- **Year-gating** — weapons/artillery show "Not yet available (1862/1863)" in 1861
- **Console errors** — open DevTools (F12 → Console) and check for TypeError/ReferenceError from game code. Pre-existing 404s for 3D assets and WebGL GPU warnings are expected and unrelated.

## Architecture Notes

- The game uses a **manifest-driven module loading** system (`src/00-manifest.json`)
- Functions use a **last-declaration-wins override** pattern — later modules can redefine functions from earlier ones
- Module-specific naming prefixes (`_cab*`, `_dec*`, `_prs*`, `_cmd*`, etc.) avoid collisions
- Shared utilities live in `src/01-utils.js` (loaded first via manifest)
- The build output is a single self-contained HTML file with all JS inlined

## Devin Secrets Needed

None — the game runs entirely client-side with no authentication required.
