# NEXT RUN — Fable-5 plan + Opus-4.8 executor wave
Compiled 2026-06-14 from the graphics-arc chat + Aaron's popup answers. This is the planning doc AND the paste-in kickoff for the next session. **Personal project — NOT MJI.**

## Aaron's locked answers (this run is built on these)
- **Scope = ALL FOUR tracks** in one parallel mega-wave: Systems (War Room + Soldier), Pantheon maps + OOBs, Modern 3D fidelity, Polish (C9 playtest + balance + a11y).
- **Play target = ALL:** Mac (local server) + iPad/iPhone Safari + hosted shareable URL → **must set up hosting + a mobile fidelity tier.**
- **Modern units = rigged animated models** (Meshy) as the fidelity goal.
- **Asset labor = free CC0 + free tiers only** ($0; bounded volume → start with a minimal core asset set, expand).

## The two real bottlenecks (run is sequenced around them)
1. **Asset generation is Aaron-gated + free-tier-limited.** Modern-3D-fidelity can only move as fast as Aaron makes assets on free tiers. → That track ships **billboards first as the always-working fallback**, then upgrades per-asset as each `.glb`/texture lands. It NEVER blocks the other tracks.
2. **Fable cannot see WebGL output (no GPU in sandbox).** All 3D look-tuning is a **screenshot loop** (Aaron posts a shot → Fable iterates). Everything else is verified by parse-gate + jsdom smoke.

---

## RUN OPERATING RULES (apply to every chunk this run)
- **Pipeline:** Fable plans in detail → **Opus-4.8 executors** (Agent tool, `model:"opus"`) build one chunk each to `chunks/out/<NAME>.js` → Fable audits adversarially, splices at `/*__ENGINE_END__*/`, parse-gates + jsdom-smokes, owns every merge. Executors NEVER touch the HTML.
- **Trust nothing an executor *claims*.** Opus is stronger than the sonnet executors, but the lesson stands: re-derive every correctness assertion (WCAG contrast, balance numbers, "verified", "no bugs"). Sonnet executors fabricated contrast ratios that hid a real AA failure this session; audit the claims, not just the code.
- **Gates, every wave:** extract `<script>` → `node --check`; jsdom boot-smoke (canvas getContext stubbed, Three absent → Classic fallback) → assert boot + a turn advances + the wave's new symbols exist; grep invalid hex `0x[0-9a-fA-F]*[g-z]` on chunk + full splice.
- **EOF-module TDZ guard:** any appended-before-`__ENGINE_END__` module whose `var`s/consts (`__M3D`, `TILE_SRC`, …) are touched by the early `init()/resize()` path MUST guard for undefined / defer via `setTimeout(…,0)`. Static parse misses it; boot-smoke catches it.
- **Override-by-append:** redeclare functions to supersede (JS hoisting); never redeclare a `const`; new tables get new names.
- **Verify-don't-infer:** pre-flight grep that a helper/path exists before building on it; reconcile carry-forward claims against live code.
- **Two renderers stay intact:** Classic (2D canvas) is the safe default and must never regress; Modern (WebGL) is opt-in and fully guarded.
- **Content line:** romance/heat tops at "Burn This Letter" (suggestive, cutaway, never explicit — text + visuals).

---

## TRACK 0 — Hosting + mobile-fidelity prerequisite (Fable + Aaron; unblocks "all platforms")
**Why first:** "play on Mac + iPad/phone + shareable URL" requires hosting (so `.glb`/HDRI load everywhere, not just localhost) and a mobile perf tier.
- **Hosting:** push `~/Desktop/Video Game` to a GitHub repo + enable **GitHub Pages** → a shareable HTTPS URL that loads 3D assets normally and runs on iPad/phone Safari. *(Aaron action: confirm + authorize the repo, or Fable scaffolds the git push given the go-ahead — repo creation/sharing is account-level so Aaron triggers it.)*
- **Mobile fidelity tier (Fable, engine):** `G.settings.gfxQuality` (auto-detect mobile → Low) controlling figure count / LOD / shadow / pixel-ratio in Modern; respects the existing `reduceMotion`/a11y.
- Deliverable: live URL + a Quality setting. *Executor-suitable: the quality-tier plumbing; Fable does the hosting handshake.*

## TRACK 1 — Systems: War Room + Soldier Campaign (Opus executors; the game's soul, no asset dependency)
**Highest-value, fully parallelizable, zero art dependency** — runs at full speed regardless of the 3D track.
- **Fable:** design the chunk contracts (state shape, UI hooks, save fields) the way C1–C8 were spec'd; sequence v1.5 first (War Room economy, winter quarters, 1864 Clock, press/Élan) then v2 Soldier triptych slices.
- **Opus executors (parallel chunks):** War-Room economy map + build/flow; winter-quarters camp (draft class, contracts, training, trades); 1864 Clock; Soldier March/Camp/Battle triptych scaffolds; Muster Roll ledger. One chunk each, contracts pre-flighted against live `G`/save schema.
- Deliverable: playable v1.5 systems behind the existing menu, parse+smoke gated.

## TRACK 2 — Pantheon authored maps + historical OOBs (Fable-authored + executor-plumbed)
- **Fable:** author Gettysburg → Shiloh → Fredericksburg → Chickamauga → Bull Runs → Franklin → Vicksburg → Chancellorsville hex-exact (Antietam pattern + AUTHORED_MAPS format proven), Verified/Inferred feature tags, deploy zones, "The Ground" prose — web research per battle (standing auth).
- **Opus executors:** the data-plumbing only (OOB tables at brigade grain per battle, loaders) — executors NEVER invent history; they wire Fable-authored data.
- Deliverable: marquee battles render to the real ground in BOTH Classic and Modern.

## TRACK 3 — Modern 3D fidelity (Aaron-gated assets + Fable engine + screenshot loop)
**Advances at asset-arrival pace; billboards keep it shippable meanwhile.**
- **Fable (engine, no assets needed):** painted-billboard units on the 3D terrain (reuse 2D sprite art → CanvasTexture, upright billboards) as the v1 fallback; `.glb` model loader (GLTFLoader from jsdelivr) + RGBELoader for HDRI; PBR terrain material loader; `assets/3d/` wired with per-asset fallback; LOD/instancing for 20+-figure regiments; day-phase lighting from HDRIs.
- **Aaron (free tiers, start small):** Meshy → rigged+animated **core unit set first** (`soldier_us/cs`, then `cavalry`, `cannon`, `general`) with idle/march/fire/fall, export `.glb`; Poly Haven → 3–4 terrain PBR sets + 1 day HDRI. Drop into `assets/3d/` per `3D-ASSET-PLAN.md` names; tell Fable what landed.
- **Loop:** Aaron screenshots Modern → Fable tunes camera/scale/materials/animation wiring. Don't chase all 84 battles' 3D until the core look is locked (Aaron's "refine then build out" call).
- Deliverable: Modern climbs tokens → billboards → animated models + textured terrain, incrementally.

## TRACK 4 — Polish: C9 playtest + balance + a11y (Fable + Opus executors)
- **Aaron:** the long-deferred full Safari playtest (Classic + Modern) → verdicts to `PLAYTEST-LOG.md`.
- **Fable + executors:** mechanics/AI/balance tuning from the log; C10 loot + C11 ratings balance numbers from live play; finish a11y parity in Modern (keyboard hex-cursor in 3D, colorblind cues on 3D tokens, reduced-motion on camera/animation); the micro-dressing-overdraw + tile-tuning items.
- Deliverable: a hardened, playtested build.

---

## DEPENDENCY / SEQUENCING (so nothing stalls)
- **Immediately, full parallel (no gates):** Track 1 (systems), Track 2 (Fable authoring), Track 3 *engine* (billboards + loaders), Track 0 mobile-quality plumbing.
- **Aaron-gated, runs alongside:** Track 0 hosting (Aaron authorizes repo), Track 3 *assets* (Aaron generates on free tiers), Track 4 playtest (Aaron plays).
- **Integration owner:** Fable serializes all merges (single committer); each track parse+smoke-gated before the next splice.

## AARON'S ACTION CHECKLIST (the human-only steps)
1. **Authorize hosting:** say go and I scaffold the GitHub repo + Pages push (or you create the repo and I push). Unlocks iPad/phone + sharing.
2. **Generate the core 3D unit set** in Meshy (free): `soldier_us`, `soldier_cs` first — rigged, idle/march/fire/fall, export `.glb` → `assets/3d/models/units/`. Then `cavalry`/`cannon`/`general`.
3. **Grab terrain + sky** from Poly Haven (CC0): clear/field/woods/hills PBR sets + one day HDRI → `assets/3d/`.
4. **Playtest** Classic + Modern via `play.command` → dump findings in `PLAYTEST-LOG.md`.
5. After each asset drop or screenshot, tell me what landed; I wire + re-gate.

---

## PASTE-IN KICKOFF (next session, fresh context)
> You are Fable in Cowork on Aaron's Mac, continuing **The Civil War — An American War Saga, Vol. I** (personal project — NOT MJI; universal Aaron rules only). Mount `~/Desktop/Video Game` (canonical; never write the Documents/Claude archive). Read in order: `NEXT-RUN-PLAN.md` (this run's plan + operating rules), `REVIEW-QUEUE.md`, `GENERALS_HANDOFF.md` (newest sections first), `3D-ASSET-PLAN.md`, `DESIGN-BIBLE.md`, `BUILD-PLAN.md` + `AUDIT-PROTOCOL.md`. Game = `civil_war_generals.html` (~380KB script). Build state: v1.0-core + Graphics wave + Wave 5 + F1 Antietam + painted-tile engine + **Classic/Modern dual renderer** all integrated, parse + jsdom-smoke PASS.
> **This run = a 4-track parallel mega-wave with Opus-4.8 executors** (Agent tool, `model:"opus"`): T1 Systems (War Room + Soldier), T2 Pantheon maps + OOBs, T3 Modern 3D fidelity (billboards→models; Aaron-gated assets), T4 Polish (playtest/balance/a11y) — plus T0 hosting + mobile quality tier. Follow the RUN OPERATING RULES in NEXT-RUN-PLAN.md: Opus executors build `chunks/out/*.js`, Fable audits (trust no executor *claim* — re-verify contrast/balance/"verified"), splices, parse-gates + jsdom-smokes, owns merges; grep invalid hex; guard EOF-module TDZ; never regress Classic; Modern look is a screenshot loop (Fable can't see WebGL). Surface a 5-line state summary, confirm which tracks to dispatch first, then go. Honor Aaron's popup answers: all tracks, all platforms, rigged-animated unit goal, free-tier assets. Continue from where we left off.
