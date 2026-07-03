# OVERNIGHT-RUN-PROMPT.md

**How to use:** open a fresh Claude Code session in this repo and paste the block below (everything under the line). It is self-contained. It is written for an ultracode `/loop` run — it tells the session to build the queue top-down, vet + commit + push each milestone, and keep looping through the night. (You can prefix it with `/loop ` to let the model self-pace, or just paste it and say "run this overnight, no pauses.")

*Generated 2026-06-21 from a brain-hub feature-inventory workflow (5 readers + Opus synthesis). The 17-item build queue (Q0→Q16) is the full remaining v1 roadmap, dependency-ordered. Q0 (commit the R-0 rating spine) is already done — this session committed + pushed it — so the run starts at R-1.*

---

# OVERNIGHT AUTONOMOUS RUN — "The Civil War" teaching wargame

You are the lead engineer running an all-night autonomous build session via `/loop`. Build as many planned milestones as possible, to the highest bar, with FULL vetting + commit + push per milestone. Go beyond the basics — impress Aaron by morning.

## 0. READ THIS FIRST (the exact read-order — do not skip)

1. `START-HERE.md` — master index (canonical vs legacy · read-order · implementer standards · priority picker + model routing).
2. `AUTONOMOUS-RUN.md` — THE operating manual (live state · the build loop · the phase roadmap · guardrails · the backlog · the §8 charter).
3. `HANDOFF.md` top block + `WAKE-UP.md` top block — the live head (what shipped last + what's playable).
4. `V1-CHECKLIST.md` — the approved, ordered v1 roadmap (the build target).
5. `DECISIONS.md` — newest first; **read D94 (the Rating System), D94-elicitation, D94-softcap, D93 (the Soldier's Story), D92, D91 (the locked phase order) before touching code.** Append, never relitigate.
6. `RATING-SYSTEM-DESIGN.md` — the D94 OVR/"Madden layer" design LAW (§9 increment plan R-0→R-6, §15 the 30 locked elicitation answers, the GM layer + camp loop + matchups + all-layers integration). Honor it verbatim; pull the section a task needs.
7. Then per task: `src/00-manifest.json` + the `src/*.js` you'll touch + `tools/build.mjs` + the relevant `tools/probe-*.mjs`. For battles: `.tmp/chattanooga-design.md`, `data/chickamauga.json` (template), `src/tactical/T1-bull-run.js` (registry/rank), `src/tactical/T8-phases.js` (multi-phase engine). For ratings: `src/tactical/T14-ratings.js`, `data/ratings.json`, `tools/probe-ratings.mjs`, and the existing strategic spine `src/35-command.js` (`_cmdGenRating` / `commandLeadership` / `_cmdLeadWord` / `_cmdTraitBar` / `cmdAppoint` / `_cmdReliefCost`) + `src/tactical/T3-officers.js` (`fldMakeOfficer`).

## 1. LIVE STATE (verified at run start)

- **D94 R-0 (the rating data spine) is COMMITTED + pushed.** `data/ratings.json` (15 attributes, 25 badges incl. 5 named negatives + 6 X-Factors, the Bull Run roster), `src/tactical/T14-ratings.js` (pure OVR / dual Attack-Defend OVR / A–F grade / persona-derivation / realism-scaled-cap functions — NO combat seam yet), and `tools/probe-ratings.mjs` (10/10; calibration oracle reproduces the authored leader qualities within 0.005). **Start at R-1 (Q1).**
- Shipped & green: all 9 battle probes (Bull Run, Malvern Hill, Antietam, Fredericksburg, Chancellorsville, Gettysburg, Shiloh, Vicksburg, Chickamauga), the full tactical-systems suite (field/officers/logistics/arms/presets/csplayer/campaign-link/fog/ai/autopause), engineering-corps 22/22, custom-builder 9/9, tactical-visuals (texWarn 0), Classic paints `nonBlank:346`, 0 pageerrors. Newest commit before the run = D94 R-0; before that D92 roster hardening (`451068c`).
- **Next battle milestone = Chattanooga** (the US-offensive reversal mirror of Chickamauga), then C3 USCT — but per Aaron the **battles are LAST in the queue** (see §2).

## 1.5 AARON'S RESOLVED FORKS — apply these (DECISIONS D94-forks)

Decided by Aaron; do NOT re-litigate or halt on them:
1. **Soft-cap = realism-slider-scaled** (Arcade generous / Balanced moderate / Historian = the tight D74 wall). The OUTPUT wall is absolute everywhere; only the INPUT caps scale.
2. **Legendary A+ (≥90) = pure merit, NO club cap.** Whoever's Verified attributes earn ≥90 is A+. Anti-Lost-Cause is guarded by the citation-grade *sourcing* of attributes, never by capping the club size. (Do NOT build a "≤X A+ per side" gate.)
3. **Political-general bind = softer flavor cost** — a political-capital surcharge + a flavor note when relieving a Banks/Butler/Sigel; **no** election-support mechanic.
4. **`cohesion` = a new REQUIRED authored field** — author it on units across the scenarios; the engine keeps a derive-from-`xp` fallback ONLY as a safety net (so un-migrated units stay byte-identical).
5. **Reputation→OVR dev-traits = LIVE in-campaign now** — wins/losses visibly move a general's OVR via `cmdOnResolve` (build it in R-6/Q8, surfaced in the desk).
6. **GM transfers/commissions (war-wide free-agency pool) = available from the START** (full depth-chart control from turn 1; balanced by the multi-currency cost + symmetric AI GM + difficulty scaling).
7. **The 2 rank disputes → resolve by the PREVAILING source + annotate the dispute** (quick ≥2-source verify): Heintzelman was appointed **Brig. Gen.** of vols May 17 1861, so the prevailing grade at First Bull Run is **Brig. Gen.**; Mansfield's Maj. Gen. of vols dated Jul 18 1862 predates Antietam, so **Maj. Gen.** stands. Confirm 2+ sources, apply, annotate the contest in-file.
8. **Night bar = balance breadth + polish** — ship many milestones, each above-and-beyond (best appearance AND function), but don't gold-plate one at the cost of three.

## 2. THE BUILD QUEUE (build top-down; commit + push each; keep looping)

Work these in order. Each is one milestone = one full vetting gate = one commit + push. *(Q0 — commit the R-0 spine — is already done.)*

| # | Milestone |
|---|---|
| **Q1** | **R-1 officer derivation → existing pipe** (persona → `gen.skill`; quality/radius/fate → `fldMakeOfficer`) for the 9 D92-hardened commanders; unrated units byte-identical |
| Q2 | R-2 OVR read-out UI (OVR + word + **A–F report-card grade**; A+ ≥90 Legendary, neutral 64 = C; pure display, WCAG/CVD triple-encode) |
| Q3 | R-3 **badge engine** (guarded `fldBadgeFactor(u,lever)` identity-when-absent + `_spdMul` + cohesion seams) + **global per-lever stacking cap** + **the no-fudge build-gate assertion**; ship Star/Superstar + the Verified negatives (Bragg/McClellan/Burnside/Green/Powder-Shy) |
| Q4 | R-4 **X-Factor surge** (in-the-zone activation, scales the summed `cmdBonus` capped at `CMD_BONUS_CAP`, abZap/`fldAnnounce` + HUD glow) + deterministic seed-replay no-fudge gate; ship Foot Cavalry, Rock of Chickamauga, Bayonet!, First with the Most, Earned in Blood, The Slows |
| Q7 | **GM franchise layer** — depth-chart roster on the Command tab + roster moves (Appoint/Relieve/Promote/Transfer/Commission, spending political capital) + **dual Attack/Defend OVR** + pre-battle matchup screen (corps board · players-to-watch · predicted-edge bar · terrain advisories; counters = advice, not RPS) |
| Q8 | **Camp loop** (drill-as-practice focus-or-delegate · cavalry-tiered simmable scouting · XP+drill progression to a hidden potential ceiling, attrition decline, reputation→OVR live) + R-5 lazy per-person materialization + R-6 negative-badge sweep across all 9 battles + Legendary anti-inflation review |
| Q9 | E1 — S3 alt-history engine (divergence tiers, hinge forks, "your war vs history" tracker, emergent-only toggle; no thumb on the scale, D54) |
| Q10 | E2 — S4 education (multi-axis codex: timeline/topic/person/battle + inline glossary + guided 1861 tutorial + President/General/Historian modes) |
| Q11 | E3 — S4 accessibility (dedicated full WCAG 2.2 AA pass + high-contrast / CVD / SR-narration / dyslexia modes) |
| Q12 | E4 — S5 victory (multiple honest paths incl. negotiated peace + graded after-action + Reconstruction coda) |
| Q13 | Phase F content systems (rail/logistics, POW cartel, disease/medical, hard war, irregular war, the 4 perspective threads, CS finance, real diplomacy, human-cost-with-gravity) — **one committed milestone per sub-system** |
| Q14 | Phase I — loot/survival pillar + **The Soldier's Story** (prosopography DB + play-as-anyone whole-war journey mode on the rating substrate) |
| Q15 | Phase H — make-it-come-to-life (PD images + `build.mjs` Base64-embed pipeline w/ offline fallback, brigade flags + corps badges, skippable reenactment cutaways, richer 3D/animation, richer captioned audio) |
| Q16 | Phase J — saves (named slots + export/import + undo-last-turn) + full-campaign 1861→1865 playthrough probe + mod-friendly data. **Hosting (Pages/itch.io) = HARD HALT — do NOT publish without Aaron.** |
| Q5 | **Chattanooga** — 3-phase US-offensive reversal (Orchard Knob → Lookout Mountain "Battle Above the Clouds" → Missionary Ridge); data + one registry line on T8, no new combat code, no fudge |
| Q6 | **C3 USCT arc** — the Crater · New Market Heights · Olustee · Nashville; citation-grade ≥2-source, Black-agency / anti-Lost-Cause, USCT manpower pool wired |

Build top-down in the row order above. **The new battles (Q5 Chattanooga, Q6 USCT) are at the BOTTOM by Aaron's direction** — build the rating system, the franchise/camp layer, the E strategic arc, and the Phase F/I/H/J pillars FIRST, then the battles. The battles have no hard dependency on the earlier waves (they ride the mature T8 engine + the D92-hardened roster), so they also serve as the **fallback work** if an earlier milestone is genuinely blocked — never idle. (Q14 Soldier's Story builds its prosopography on the existing 9 battles; the USCT battles enrich it when they land.) If a milestone is blocked, log why, drop to the next buildable one, and surface it in the morning note.

## 3. NON-NEGOTIABLES (never violate, even for a one-line change)

1. **Edit `src/` (code) + `data/` (data); NEVER edit `build/base.html` (frozen) and never hand-edit the generated `civil_war_generals.html`.** Change source, then `node tools/build.mjs` (must print `GATE OK`).
2. **ONE universal combat model — NO per-battle damage/firepower fudge (D74).** Outcomes emerge from OOB / terrain / timing / doctrine / scoreWeight. New tactical work = guarded no-op-when-inactive seams; bare-name globals (`G`/`GAME_DATA`/`__FIELD`/`FLD`, not `window.*`); no literal comment-closer inside a block comment.
3. **The D92 accurate-inputs principle:** history enters ONLY as the accurate DEFAULT EQUIPMENT (true counts/guns/weapons/terrain/doctrine) so the *probable* result lands near history *because the inputs are true* — **NEVER an output gate forcing a casualty direction or winner.** Kept probe guards are *system validations* (cover↓casualties, rifled out-ranges smoothbore, more guns = more fire), never historical-direction force-gates.
4. **The Rating System invariant (D94 + D94-softcap) — read this twice:** a rating/OVR/badge/X-Factor **fully decides casualties + winners, but ONLY through the inputs.** It seeds the levers the engine already reads (`xp`, `quality`→`cmdBonus`, `weapon`, `radius`, `fate`, `cohesion`, bounded `sev.*`) ONCE at build/preset-apply, then the normal combat model runs on them → the strong unit dominates *emergently* (and can still be out-played). The ONE forbidden act (the **OUTPUT wall**, build-gate-asserted): a handler that writes `cas`/`aCas`/`bCas`/`victory`/`tgt.men` or writes `sev.*` out of band **directly at resolution time** (the scripted "higher rating ⇒ auto-win" hack). The **INPUT caps soften and scale with the B-5 realism slider** — **Arcade = generous/dramatic, Balanced = moderate, Historian = the tight D74 wall.** X-Factor amplification routes through the capped `cmdBonus`/`sev.*` path and never breaches `CMD_BONUS_CAP (0.9)`. The drama comes from a generous *input* cap, never an absent *output* wall.
5. **PROPER VETTING before EVERY commit:** `node tools/build.mjs` **GATE OK** → focused probe + **FULL no-regression suite** + `diag-classic` (Classic still paints, **`nonBlank:346`**) + **0 pageerrors** → **adversarial bug-hunt, every confirmed finding fixed** → THEN commit → `git push origin main` (`adhanke-star/History-Video-Game`). **Never push red.** Fix the root cause; never weaken a probe. Update the `probe-custom-battle-builder` EXPECTED baseline whenever you add a registry battle (the D86/D88 gotcha).
6. **Citation-grade, anti-Lost-Cause history:** ≥2 sources = Verified, else Inferred/Disputed; no fabricated citations / units / ranks. The recurring trap is **rank-at-the-battle** (a promotion dated *after* the battle, applied early) — verify every officer's grade AT the battle date. Surface, don't silently flip, a genuine source conflict.
7. **Record lessons in the repo** (`DECISIONS.md` / `RUN-LOG.md` / `HANDOFF.md` / `WAKE-UP.md` / `V1-CHECKLIST.md`) — never hidden memory.

## 4. THE §8 OVERNIGHT CHARTER + HALT RULE

You hold Aaron's **20-point all-night authorization** (DECISIONS D30 / AUTONOMOUS-RUN §8): engine-overrides OK; build continuously within the cleared scope; **commit + `git push origin main` per milestone AFTER the proper vetting gate.**

**HALT (stop, write a short note of what's queued / the options / a recommendation + reason, exit cleanly, surface it) ONLY for:**
- An **irreversible / destructive** action, or one that **costs money or touches an external account** — e.g. **publishing to GitHub Pages / itch.io (Q16 hosting is a hard HALT; do NOT publish without Aaron).**
- A **NEW fork that contradicts a shipped decision** (especially one that would reverse a prior teaching), is irreversible, or would waste a milestone.

Otherwise: **decide-&-log and keep going.** Note incidental bugs; do not silently fix out-of-scope things or push through a contradiction. Two open forks are already surfaced-not-fixed (Bull Run **Heintzelman** rank, Antietam **Mansfield** rank) — leave them flagged unless you have ≥2 sources that adjudicate.

## 5. MODEL ROUTING (token discipline — set model + effort EXPLICITLY on EVERY Agent / Workflow `agent()` call)

- **Main loop:** Claude Fable 5 (`claude-fable-5[1m]`) + xhigh (D223; the deliberate ultracode trigger — never downgrade it; if Fable is unavailable, Opus + xhigh).
- **Helpers inherit xhigh + the main-loop model (now Fable — the most expensive possible inheritance) unless you set otherwise — that inheritance is the budget burn.** So set `model` AND `effort` on every subagent / Workflow `agent()` call, and **never set a helper to Fable**:
  - **Sonnet, low/medium** — the helper default: Explore/search, file & log summarization, spec'd mechanical transforms, data-file authoring, WCAG sweeps, first-pass gathering, probe runs.
  - **Haiku** — purely mechanical reads / greps / sizing / log-scraping.
  - **Opus + high/xhigh** — ONLY synthesis / design / adversarial judgment / final quality-critical verify: bug-hunt finders + verifiers + critic, design/judge panels, citation-grade research-verify, the no-fudge correctness audits.
- Sonnet drains a separate, underused weekly bucket at ~1/5 the cost — route mechanical legs there. Efficiency only where it can't move the standard.
- Fable 5 behavioral deltas (longer turns, refusal handling, D171 interplay) + the run-prompt snippets to embed: `FABLE-5-PLAYBOOK.md` (D223).

## 6. ULTRACODE ON — use Workflows

- **Citation-grade content (every battle / teaching card / persona roster):** a research+verify Workflow — Opus historians + an adversarial verify pass + a critic. The verify pass exists to catch a "fix" that is itself wrong (it caught 4 in D92). Rank-at-the-battle is the standing trap.
- **Every milestone before commit:** an adversarial bug-hunt Workflow — Opus finders + verifiers + a critic; fix every confirmed finding; re-vet green before pushing.

## 7. PROBE GOTCHAS (this machine)

- The task tmpfs throws a spurious "0MB free" ENOSPC → **run probes FOREGROUND with `2>/dev/null` and `export TMPDIR="$PWD/.tmp"`** (`mkdir -p .tmp` first).
- Run probe batteries **sequentially over ONE shared** `python3 -m http.server 8765` (don't spin a server per probe).
- **READ `tools/shots/*.json`** for probe results (don't eyeball the console).
- Chrome works here (`CODEX_SANDBOX` unset → `tools/guard-probe-browser.mjs` does not block). The base chain is `node tools/build.mjs && node tools/bootprobe.mjs && node tools/t1probe.mjs && node tools/diag-classic.mjs` then the focused + full no-regression probes.
- Verify a push landed via `.git/logs/HEAD` if a task `.output` looks truncated.

## 8. THE BAR — go beyond, impress

**Above-and-beyond on every milestone: best APPEARANCE and best FUNCTION.** Not "it passes the probe" — it should look and feel finished. CVD-safe + WCAG-AA on every new surface (shape + label, never color alone; reduceMotion honored). The Madden layer should feel DRAMATIC (visible X-Factor glow + announcement + a real swing) while staying inside the capped, no-fudge wall. Teaching stays citation-grade and anti-Lost-Cause. When you finish a milestone, push it, then immediately start the next — leave a morning trail in `WAKE-UP.md` / `HANDOFF.md` that reads like real progress.

## 9. /loop SELF-PACING

Work **continuously**. After each committed+pushed milestone, immediately pick up the next queue item — **do not idle, do not wait to be asked.** Schedule the next wake-up so the loop keeps advancing through the night. If you hit a HALT condition, write the morning note (what shipped, what's queued, the fork + your recommendation + reason) and exit cleanly. Otherwise keep building until the queue is done or the night ends.

**Begin now with Q1: R-1 officer derivation into the existing command pipe. Then keep going.**
