# V1 FEATURE-COMPLETE CHECKLIST — "The Civil War"  (APPROVED — run-k Q&A, 2026-06-15)

**Purpose:** give "complete all project goals" a concrete, ordered target so autonomous runs can drive to a
content-complete v1 (still a perpetual project after — D54). Built from `MODERN-UGG-PLAN.md` (P0–P5),
`GRAND-STRATEGY-PLAN.md` (S2–S5), and the §8 charter systems. **Status: APPROVED** — all 12 forks across a
3-round Q&A are locked (recorded as DECISIONS **D61**). The phase order below is the roadmap for autonomous runs.

---

## OPERATING MODEL (LOCKED — run-k Q&A, 2026-06-15)
1. **Surface judgment calls.** Design/balance forks are surfaced for your approval BEFORE building; only
   mechanical/obvious continuations + the build-and-vet itself run autonomously. (Refines charter §8.3
   "decide & ship" — that applied to the all-night charter; you've now opted for design oversight.)
2. **Clear-then-continuous.** I clear a SCOPE's designs with you upfront, then execute the whole scope
   continuously (all-night style), pausing only at scope-end or when a NEW unforeseen fork appears.
3. **Per-milestone vetting + push** stays the same: GATE OK → focused probe + full no-regression + diag-classic
   + 0 pageerrors → adversarial bug-hunt (all fixed) → commit → `git push origin main`. Balance auto-tuned + logged.
4. **Content standard:** ≥2-source Verified (else Inferred), anti-Lost-Cause, period-but-tight voice.

---

## DONE SO FAR (shipped + pushed)
S0–S1 economy/production/blockade/manpower/victory · Battle layer A1–A6 (owner-mode war playable end-to-end) ·
S2 m1–m5 (cabinet, decisions, 3-layer morale + 1864 election, press, command/named-generals) · **Tactical
P0 sandbox · P1a First Bull Run · P1b-i fog · P1b-ii auto-pause · P1b-iii role-aware DEFENDER AI · PHASE A
connect-the-layers (A1 conditioning · A2 fight-from-bridge + FREE skirmish · A3 result feedback).**

---

## THE V1 CHECKLIST (proposed order — edit freely)

### Phase A — CONNECT THE TWO LAYERS  ‹✅ DONE — run k, 2026-06-15, DECISIONS D62›
- [x] **A1 Bridge conditioning into tactical:** the strategic-desk army (weapons bought, the 3 corps,
      general/leadership, morale, manpower strength) conditions the tactical battle's forces (strength /
      firepower / quality / morale / fatigue) — the owner-mode army you built actually fields in the real-time fight.
      *(`src/tactical/T2-campaign-link.js` `fldCampaignCondition`; 74-anchor ±12% identical to Classic/auto-resolve; re-arms from the loadout incl. reinforcements.)*
- [x] **A2 Tactical FREE mode:** a menu entry to launch a custom skirmish (pick side / forces / terrain) and
      to fight the Bull Run scenario from the bridge (not just the standalone demo).
      *("Fight in real time ⚔" on the bridge briefing; First Bull Run [US]→bullrun1 else a conditioned procedural fight; a "⚔ SKIRMISH" main-menu setup [side/size/ground/year/fog].)*
- [x] **A3 Result feedback loop:** the real-time battle outcome flows back into the campaign (casualties,
      ground, `enemyWill`) — substitutable for the existing Classic / auto-resolve result (MODERN-UGG §2).
      *(REAL casualty fractions from the fight → `startBattleRuntime`+`_arApplyCasualties`+`campaignAdvance`→`_t1Resolve`; win advances, loss recovers; deterministic. probe-campaign-link 16/16.)*

### Phase B — TACTICAL DEPTH  (P2–P5, real-time engine)  ‹B1 ✅ — run k, 2026-06-15, DECISIONS D64›
- [x] **B1 Smarter ATTACKER AI** — defender-favored, fog aids the defender (LOCKED); attacker doctrinally
      sound (concentrate / assault) but the fog inversion tuned out. (Prototype exists: `ATTACKER-AI-PROPOSAL.md`.)
      *(`fldAiAttacker`: concentrate-on-weaker-flank / close / assault, GRADUAL per-unit commit [no knife-edge] + CAUTIOUS-WHEN-BLIND. Sweep: both-doctrines Bull Run fog-OFF CS 6/8, fog-ON 8/8 — fog aids the defender; def-cas 4592 vs the passive 1276. probe-ai 15/15.)*
- [ ] **B2 Officers / command** — leaders with command radius + morale bonus, can be hit (ties named-generals).
- [ ] **B3 In-battle logistics** — ammo + fatigue depth (seeded; deepen) + supply.
- [ ] **B4 Distinct arm roles** — artillery (canister / long-range), cavalry (scout / flank / screen / raid).
- [ ] **B5 Difficulty/realism presets** for the AI + sim depth.
- [ ] **B6 CS-player tactical mode** ‹LOCKED: yes, Phase B› — command EITHER side in a battle (you defend as
      the CS, AI attacks). Makes the attacker AI (B1) player-facing. Doubles tactical replayability.

### Phase C — TACTICAL BREADTH  (more real-time battles, data-driven)
- [ ] **C1 Eastern marquee:** Antietam, Fredericksburg, Gettysburg, Chancellorsville, Malvern Hill.
- [ ] **C2 Western** ‹LOCKED: Phase C, with breadth›: Shiloh, Vicksburg, Chickamauga/Chattanooga, Atlanta/the March, Franklin.
- [ ] **C3 USCT battles (1863–65):** the Crater, New Market Heights, Olustee, Nashville (the flagship teachable arc).
- [ ] **C4 Custom-battle builder** (D54).

### Phase D — FULL HEX TACTICAL ENGINE  (co-equal, selectable — LOCKED "full engine", after depth)
- [ ] **D1** A complete parallel hex/turn-based tactical mode on the modern OOB/scenario data, selectable per
      battle alongside real-time. (Legacy "Classic" hex battles stay frozen; this is a NEW, data-driven hex layer.)
      ‹LOCKED: sits here, after tactical depth, so it duplicates onto a mature engine.›

### Phase E — STRATEGIC ARC COMPLETION  (S3–S5)
- [ ] **E1 S3 alt-history:** tiered divergence + hinge forks + emergent toggle + the player-driven "your war
      vs history" tracker + divergence log (no thumb on the scale — D54).
- [ ] **E2 S4 education:** multi-axis codex + inline glossary + the full guided tutorial + play-style presets
      (President / General-Commander, + the Historian settings overlay — D39) + difficulty/realism sliders.
- [ ] **E3 S4 accessibility:** the dedicated FULL WCAG 2.2 AA pass + the 4 a11y modes (high-contrast, CVD-safe,
      SR turn/battle narration, dyslexia font) — your professional bar.
- [ ] **E4 S5 victory:** multiple honest paths incl. negotiated peace + the rich graded after-action report +
      the Reconstruction coda.

### Phase F — CONTENT SYSTEMS  (folded into the phase each best fits)
- [ ] Logistics/rail network · POW exchange-collapse · disease/medical · hard war · irregular war · the four
      under-told-perspective threads · flagship named units · CS finance toolkit · war-finance civics · a real
      diplomacy system · the human-cost-with-gravity treatment. (All from §8 D31–D41.)

### Phase G — THEATERS
- [ ] Eastern (largely done) → **Western** (same mechanics, new content — D40/D54). Naval/riverine/trans-Miss DEFERRED.

### Phase H — "MAKE IT COME TO LIFE"  (graphics/footage — LOCKED: AFTER gameplay-complete)
- [ ] **H1 PD images:** weapons / flags / USCT / scenes (have 131 portraits) via LoC + Internet Archive +
      Wikimedia, linked-assets + offline fallback.
- [ ] **H2 Reenactment footage** cutaways at key beats (skippable, offline→procedural fallback).
- [ ] **H3 Richer 3D/animation** on the tactical engine (reuse run-h PBR/HDRI/post-FX); period broadsheet/engraving UI throughout.
- [ ] **H4 Richer audio** ‹LOCKED: Phase H›: PD period tunes + battlefield/camp soundscapes + UI cues, all
      accessible (toggles/captions/volume), default off.

### Phase I — LOOT / SURVIVAL  (LOCKED: DEFER to after core)
- [ ] Standalone rarity-tiered loot + inventory (all modes) · light survival (rations/weather/forage/disease,
      default off) · the Oregon-Trail journey mode. All preset-gated (§27).

### Phase J — POLISH / META
- [ ] **Saves** ‹PROPOSED per D54›: localStorage + named slots + export/import; undo-last-turn on the accessible preset.
- [ ] Mod-friendly data + shareable saves/scenarios. **Hosting DEFERRED** (GitHub Pages on request — D54).
- [ ] **Full-campaign playthrough probe** added to the no-regression suite (D54).

---

## ITEMS NEEDING YOUR CONFIRM (the last clarifications)
1. **Phase ORDER** — is A→B→C→D→E→…→H→I→J right? In particular: **strategic S3–S5 (E) vs tactical breadth/hex
   (C/D)** — which first? And does the **full hex engine (D)** really sit after tactical depth, or sooner?
2. **B6 CS-player tactical mode** — include in v1 (command either side)? Here in Phase B, or later?
3. **Western theater (C2)** — fold into tactical breadth as drafted, or its own later phase?
4. **Audio (H4)** — in the come-to-life pass as drafted, or sooner?
5. Anything **missing** from v1, or anything here you'd **cut** to v2?
