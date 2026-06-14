# ☀️ WAKE-UP — overnight run j (2026-06-14, Opus 4.8)

**Good morning. ⚑ THE BATTLE LAYER (A1–A6) IS COMPLETE — the owner-mode war is PLAYABLE END-TO-END — shipped, verified, and backed up to GitHub.** Seven milestones, each gated + empirically probed + **adversarially bug-hunted** before commit (≈40 confirmed findings caught & fixed across the night, incl. a HIGH Free-Battle arsenal-leak, a rail-repair equilibrium bug, a §27 conditioning mis-anchor, and an auto-resolve "could-never-lose" balance flaw), full no-regression suite green throughout (16 probe suites), **0 pageerrors**, and **Classic never regressed** (diag-classic paints on every change). Everything is committed **and pushed** to `adhanke-star/History-Video-Game` (private).

**You can play the whole war now:** pick a side → run the President's Desk (economy/production/blockade/diplomacy/manpower + three buildable corps: small arms, the Cannon Corps, the Engineering Works) → field a *conditioned* army → at each battle **Auto-resolve OR Fight** (the weapons you bought, the terrain cover, and your war's condition are all real on the day) → the result feeds manpower/clock/strategy/enemy-will/victory → win via the chain or a path-to-victory.

---

## What shipped (newest → oldest)
| Commit | Milestone | What it does | Verify |
|---|---|---|---|
| `149d07e` | **A6b Bridge auto-resolve** | Resolve a battle from the army your war fielded (vs Fight it) → drives `campaignAdvance` so the war feeds back identically. **Makes the war playable end-to-end.** | probe-auto-resolve 7/7 |
| `88f878c` | **A6a Battle-day conditioning** | The strategic war scales the army you field (strength/morale/prep) + Field-Fortifications dig trench cover. `startBattleRuntime` override | probe-conditioning 6/6 |
| `3959b65` | **A5 Targeting** | Verified the engine already lets the player pick specific fire targets (no engine change — §27, avoided gratuitous override risk) | probe-targeting 5/5 |
| `47ae217` | **A4 Armory → battlefield** | Weapons you buy (`C.armory.loadout`) become what your brigades carry & fire (Spencers → +105% fire). Frozen-engine override of `genForce` | probe-armory-field 9/9 |
| `b21b5d7` | **A3 Terrain cover** | 6 named cover types (stone wall, entrenchments, sunken road, boulders, forest, rail fence) stamped onto historical features (Sunken Road, Marye's Heights, Devil's Den, the woods, the redans). First frozen-engine override | probe-cover 8/8 |
| `efad4c6` | **A2 Engineering Works Corps** | Buildable engineer arm (Construction/Fortifications/Pontoons/Siege) → bridge engineering facet + supply/fatigue + slows CS rail decay | probe-engineering 9/9 |
| `da74ad9` | **A1 Cannon Corps** | Buy real field batteries → bridge artillery facet; the CS 4-vs-6 + fuze/horse/mixed-caliber + 1863 massing asymmetry is now mechanical | probe-cannon 9/9 |
| (earlier) | **GitHub backup** | Private repo `adhanke-star/History-Video-Game` created; pushed after every milestone | `git remote -v` |

**Content shipped:** A1 = 5 guns + 4 Verified teaching cards (pre-researched). A2 = 4 Verified multi-voice teaching cards (Haupt/USMRR, the spade, pontoons, siege — anti-Lost-Cause, myth-correcting: Solonick "dug out not starved out", the Cold Harbor "7,000 in minutes" myth corrected via Rhea). A3 = 1 Verified cover-as-killing-ground card.

---

## What's playable now
Open **`civil_war_generals.html`** (open-and-play, ~970KB).

**Demo click-through:**
1. **New Campaign → pick the Union (US).**
2. Between battles the **President's Desk** auto-surfaces → open **The Armory** tab. It's now the "build your forces" hub with **three buildables**:
   - **The Armory** (small arms) — buy Spencers/Sharps/Springfields with funds.
   - **The Cannon Corps** — raise Napoleon / 3-inch Ordnance / Parrott / Whitworth batteries.
   - **The Engineering Works Corps** — raise Construction / Fortifications / Pontoon / Siege capability (levels 0–3).
3. Open the **pre-battle briefing** (from the between-battles interstitial): the **"army you field"** now shows live **Artillery (Cannon Corps)** and **Engineering (Works Corps)** facets that rise as you invest, plus Firepower from your small arms.
4. Open the **pre-battle briefing** → choose **Auto-resolve** (resolve from the army your war fielded — a real gamble that your strategic edge decides, not luck) **or To the Field** (fight it). Either way the result feeds the war forward and the next turn surfaces.
5. **If you fight** (e.g. Antietam): the army is **conditioned** by your whole war (a strong war fields more, steadier men), your infantry **carry the weapons you bought** (Spencers fire harder), and the **Sunken Road / Devil's Den / the woods are real cover** (a stone wall halves casualties; Field Fortifications dig trenches when you entrench). You pick exactly which enemy each unit fires at.

**The strategic systems (run i): economy/finance, war production, blockade/diplomacy, manpower/conscription, Paths-to-Victory + wild cards — all live and feed the bridge.** Pick a side, run the desk, win the war.

---

## ✅ The strategy↔battle loop is CLOSED (A6 done)
A6a (battle-day conditioning) + A6b (the bridge auto-resolve) closed it: the bridge computes the conditioned army, the battle (fought or auto-resolved) reflects it, and the result feeds manpower/clock/strategy/enemy-will/victory. **The whole owner-mode war is playable end-to-end.**

## What's NEXT: the STRATEGIC ARC (S2–S5)
- **S2 (next):** the FULL historical cabinet + advisor UX (one-line rec / delegate / "why") + 3-layer morale (troop/leader/public, public-will decides late) + the 1864 election + a press/public-opinion system + command (appoint/promote/relieve generals) + emancipation as a dated decision + civil-liberties dilemmas + named generals + a curated home-front event deck. (Cached S2 research workflow may be recoverable — `AUTONOMOUS-RUN.md` §7 item 7.)
- Then **S3** alt-history engine + gallery · **S4** education/codex/glossary/tutorial/WCAG-AA + difficulty presets · **S5** victory paths + the rich graded report + the Reconstruction coda · content systems · theaters (Western→Trans-Miss→naval) · tactical P0–P5.

---

## Decisions I made (decide-&-log) you may want to review
All in `DECISIONS.md` **D42–D48**. The ones worth a glance:
- **D42.3** — CS artillery maluses are designer calibration (fuze ×0.96, horse ×0.95/×0.88, mixed-caliber ×0.94, 1863 massing US ×1.08 / CS ×1.04). Tunable.
- **D43.1** — the Construction Corps **slows but never stops** CS rail decay (claws back a *fraction* of each turn's loss). A bug-hunt caught the original constant-repair pinning rail at 100 — fixed.
- **⚑ D45.2 (flag for you)** — A4 honors the **engine's `WEAPONS.era`**: a weapon you bought is fielded only once the engine's era allows (e.g. Sharps from 1863), so the player can't out-tech the era-locked AI. *Trade-off:* a player might buy Sharps in 1861 and not see them on the field until 1863. I judged consistency/fairness > instant gratification; **override if you'd rather the armory's own (looser) year-gates rule.**
- **D46** — A5 shipped **no engine change** (player targeting already works); declined to add redundant UI.

---

## Flags / housekeeping
- **Git hygiene:** four probe-output JSONs (`tools/shots/{bootprobe,t1probe,probe-bridge,probe-economy}.json`) are gitignored-by-intent but tracked by legacy, so they keep showing "modified" when probes run. I reverted them each commit to keep the tree clean; a one-time `git rm --cached` on them would stop the noise (left for you — touching tracked files).
- **Tooling:** the task-output tmpfs still throws spurious "0MB free" / auto-cleans output files; I ran probes foreground with `2>/dev/null` + `TMPDIR=$PWD/.tmp` and read `tools/shots/*.json` directly, per the run-i note. Worked all night.
- **No money/account actions** beyond the pre-authorized GitHub repo. No irreversible actions taken.

---

## To resume (fresh chat)
Paste the kickoff prompt from `START-HERE.md`. It will load `AUTONOMOUS-RUN.md` §2 (current state, A1–A5 ✅, A6 next), `DECISIONS.md` (D42–D46), and continue the §3 loop at **A6**. Everything needed is on disk and pushed; `git log --oneline` is the durable record.
