# LLM-OPPONENT DESIGN LAW — the live LLM field commander (Q-D270-5 · D283)

**Status: AARON-LOCKED design law, 2026-07-06. Docs-only planning slice — BUILD NOT STARTED.** This document is the single source of truth for the LLM-opponent milestone. Honor it verbatim; append amendments to `DECISIONS.md`, never relitigate here.

---

## §0 Provenance + the four Aaron locks

- **Directive:** D270 carry-forward item 4 — Aaron's mid-session directive "LLM-opponent feature", queued as Q-D270-5.
- **Process (the D280 planning-slice pattern):** planning workflow `wf_888c5559-785` (10 agents: 4 Sonnet repo readers → 3 independent Opus design candidates → 3 adversarial Opus judge lenses), Fable main-loop synthesis with every load-bearing seam re-verified first-hand, then Aaron popups. Judge scores: offline-doctrine-engine 22/30 · advisor-narrator 21/30 · live-commander 14/30. **Aaron chose the live commander over the judged hybrid, informed of the kill shots.** The provider-reach kill shot ("~0% of players") was subsequently REFUTED for this architecture by web-verified free rungs (§2); the nondeterminism objection is embraced as opt-in variety, not repaired (§4.4); the containment engineering that made the judges' live-commander candidate survivable is adopted wholesale (§3–§5).
- **Aaron's four locks (popups, 2026-07-06):**
  1. **IDENTITY = the live LLM field commander.** A real LLM, configured by the player, commands the AI-led army at operational cadence. Not the authoring-time doctrine engine, not the narrator layer (both recorded as future candidates, §7.3).
  2. **PROVIDERS = the universal connector.** One OpenAI-compatible adapter (OpenRouter / Groq / localhost Ollama / LM Studio / anything-compatible) + one Anthropic adapter. Genuine $0 rungs required and verified (§2).
  3. **VOICE = guarded live generation.** Live LLM dispatch prose is permitted under the §5 containment stack (Aaron declined authored-only).
  4. **DEFAULTS = opt-in, OFF by default, PM3 strictly neutral.** Zero behavior change until the player explicitly configures AND enables the commander; the D277 sim-backed auto-resolve never touches an LLM; flip-the-default is a separate future fork.
- **Constraints this law binds itself to (verified first-hand this session):** D74 no-fudge · the T26 seam idiom ([T26-attacker-parity.js:1-29](../../src/tactical/T26-attacker-parity.js)) · the fldAiUnit dispatch chain ([T0-field-sandbox.js:753-778](../../src/tactical/T0-field-sandbox.js)) · the order vocabulary (§3.2) · PM3 headless determinism ([87-auto-resolve.js:98-100](../../src/87-auto-resolve.js)) · the runtime is fully offline today (the single `fetch(` in the deliverable is a comment at ~L5833) — this feature introduces the deliverable's FIRST runtime network call class · §27 optional-depth law · citation-grade anti-Lost-Cause law · WCAG 2.2 AA.

## §1 The design (what the player experiences)

An opt-in **"Field Commander: Connected AI"** mode. The player opens the connector settings, picks a provider preset (or a custom endpoint), supplies a model name and (if needed) their own key, and enables it for a battle. From then on, the enemy army is commanded by that LLM: every ~25 sim-seconds (and at phase boundaries) it receives a fog-respecting battlefield digest of what ITS side can see, and returns a bounded JSON operational plan — per-brigade objectives, postures, formations — that a new T27 seam executes through the exact same order fields the engine AI and the human player already write. Between plans, and for every brigade the plan doesn't legally cover, the shipped D64+T26+doctrine engine commands as it always has. Disable it, lose the network, hit a rate limit, get a refusal — the engine takes back the field mid-battle with zero interruption. The feature is labeled **experimental**, and the UI says plainly that the built-in commander is often stronger than small free models. The teaching core (deterministic, replayable, masterable) remains the engine; the connected commander is a different pleasure: an opponent that can genuinely surprise you, be feinted (it only sees what its side sees), and be out-generaled live.

## §2 The connector law (providers · keys · network)

**§2.1 Two adapters, one settings surface.**
- **Adapter A — OpenAI-compatible chat-completions:** `POST {baseUrl}/chat/completions`, optional `Authorization: Bearer <key>`. Covers OpenRouter, Groq, localhost Ollama (`http://localhost:11434/v1`), LM Studio, and any compatible endpoint. JSON output requested via `response_format` where supported, but the §3.4 validation wall is the only trusted guarantee.
- **Adapter B — Anthropic Messages:** `POST https://api.anthropic.com/v1/messages` with `x-api-key`, `anthropic-version: 2023-06-01`, and the documented browser opt-in header `anthropic-dangerous-direct-browser-access: true`. Orders requested via `output_config.format` json_schema (guaranteed-parseable). Default model class `claude-haiku-4-5` (≈$0.20–0.30 per battle on the player's key); the UI never auto-selects Opus/Fable-class models (cost).

**§2.2 Presets (facts verified 2026-07-06 — free tiers drift; RE-VERIFY endpoints/limits at build time):**
| Preset | Adapter | Cost rung | Notes for the UI |
|---|---|---|---|
| OpenRouter | A | **$0 rung** — `:free` models (DeepSeek/Llama/Mistral), no card | browser-CORS OK; one key, many models |
| Groq | A | **$0 rung** — free tier ~30 req/min | verify browser CORS at build; very fast |
| Ollama (local) | A | **$0, private, offline** | help note: requires `OLLAMA_ORIGINS` to allow the game's origin; ~3B models fit an 8GB Mac but play weakly |
| LM Studio (local) | A | $0, private | local server, CORS toggle in-app |
| Anthropic | B | Paid only | UI carries the honesty note: **a Claude Max subscription is NOT an API key** — Console credits required |
| Custom | A | — | raw baseUrl + model + optional key |

**Excluded by law (recorded so nobody relitigates):** Google Gemini direct (free tier exists but browser CORS is unreliable; the official answer is a backend proxy, which violates $0/no-backend/single-file) and OpenAI direct (no browser CORS; reachable via OpenRouter anyway). Any future proxy/backend is a NEW Aaron fork.

**§2.3 Key + config handling.** Connector config (provider, baseUrl, model) and the key live in `localStorage` under a dedicated `cw_llm_*` key (the T6 `cw_tactical_preset` precedent) — **device-only**, with a visible "stored on this device only" note and a one-click clear-key button. Keys are NEVER written to save slots (`gor_save`), never enter the C4 scenario-share format, never appear in any export, never sent anywhere but the configured endpoint. No key material may ever be committed to the repo or baked into the deliverable.

**§2.4 The network law.** This is the deliverable's first runtime network call class. Calls fire ONLY while a battle is live AND the player has explicitly configured and enabled the commander for it. With the feature off, unconfigured, or in any headless/probe context: **zero network** — probe-pinned (§4.3d). The game must remain fully playable offline forever; the connector is strictly additive.

## §3 The order seam law (T27)

**§3.1 The module.** New `src/tactical/T27-llm-commander.js`, registered in `src/00-manifest.json` after T26, header discipline copied from T26 verbatim: writes ONLY `u.order` / `u.formation` and its own diagnostics bag `__FIELD._t27`; never men/morale/casualties/captured/victory/score; **no `fldRng` use, ever** (the sim's seeded stream must not be perturbed — LLM nondeterminism lives entirely outside it); bare-name globals; per-launch/per-phase state reset keyed on `__FIELD._gen`/`phaseIdx` (the `fldParityState` pattern).

**§3.2 Dispatch point + order vocabulary.** In `fldAiUnit`, inside the asymmetric gate, ABOVE the defender/parity/attacker doctrines (logistics T4 and arms T5 overrides keep their existing priority above it):
```js
// T0-field-sandbox.js, inside the L769 asymmetric block, before fldAiDefender (L770):
if (__FIELD.llmCommander && typeof fldLlmAiUnit === "function" && fldLlmAiUnit(u)) return;
```
`fldLlmAiUnit(u)` returns true only when the unit is on the LLM-commanded side AND the current validated plan carries a legal order for it; otherwise false → defender/T26/D64 run verbatim (per-brigade fallback to the REAL engine, never a stub). Orders map ONLY to the existing vocabulary the engine and the player already share: `u.order = {type:"move"|"hold"|"charge", tx, tz, tface}` + `u.formation = "line"|"column"`. **Never `playerCharge:true`** (that flag is the human-gesture marker; AI paths must stay byte-identical without it). No new order types in this milestone.

**§3.3 Cadence + latency masking.** Plan requests at operational cadence: every `LLM_PLAN_INTERVAL` sim-seconds (default ~25, `FLD`-constant) and on phase change — NEVER per-AI-tick (AI_HZ 2.5 stays engine-only). Requests are async; the current plan (or the engine) commands while the next is in flight; a returned plan applies at the next AI pass. One in-flight request max; a late/failed response is dropped, never blocks the sim, never pauses the battle.

**§3.4 The fog-respecting digest + the validation wall.**
- **Digest (input):** built by a PURE function of `__FIELD` state — own-side brigades (id, arm, strength BAND, morale state, position, facing, current order), **visible enemy contacts only** (filtered through the same `fldVisible` the engine AI uses — the D58/D64 fog law binds the LLM too; unseen enemies are simply absent), objective, coarse terrain/elevation summary, phase + clock. Numbers are band-quantized — the model never handles an exact, citable figure.
- **Wall (output):** schema-validate the whole response → per-order legality (brgId exists, is alive, is on the commanded side; tx/tz on-map; posture/formation in vocabulary) → illegal or missing orders drop THAT brigade to the engine; malformed JSON / timeout / HTTP error / refusal drops the WHOLE cycle to the engine and keeps the last good plan. The wall is deterministic and probe-pinned via the `__FIELD._t27MockPlan` test hook (§4.3).
- **System prompt (static, cacheable):** rules of engagement, the order schema, the fog contract, the §5 voice/tone charter. Per-general persona texture is slice-3 scope and is INPUT texture only — a persona prompt must never encode a target outcome ("ensure the Confederates hold" is a D74 violation in prompt form).

## §4 Determinism & probe law

1. **OFF-state byte identity by construction.** `__FIELD.llmCommander` is set at launch only from explicit opts + live config; default absent/false. Three independent gates each force it off: the sticky `_llmOff` test hook (the `_parityOff` idiom) · no connector config/enable · headless context. Every existing probe and the whole vet:noreg battery run with the seam unreachable — byte-identical by construction, no re-pins.
2. **The PM3 double lock.** `fldLaunchAutoResolve` passes `renderer:"none", autoBoth:true, neutralPreset:true` (87-auto-resolve.js:98); T27 hard-refuses whenever `autoBoth` or headless renderer is set. The LLM can NEVER enter the PL-6 war-state-pure-seed replay-×2 path. D277's contract is untouched.
3. **`tools/probe-llm-commander.mjs` pins (all offline, network NEVER in a probe):** (a) digest purity — same `__FIELD` state → identical digest hash ×2; fog-masking (hidden enemy absent from the digest); band quantization asserted; (b) the validation wall via `_t27MockPlan` — a legal mock plan lands as exact `u.order`/`u.formation` writes; illegal brgId/off-map/unknown-enum orders fall to the engine field-for-field; malformed input → whole-cycle fallback; (c) inertness teeth — `_llmOff`, no-config, and autoBoth each independently yield zero `_t27` state + byte-identical outcome vs baseline; (d) the zero-network tooth — a fetch spy on the probe page asserts 0 network calls with the feature off. Enroll in `vet:noreg`.
4. **Nondeterminism is disclosed, not hidden.** A live-LLM battle is explicitly non-reproducible — that IS the feature. The UI says so; replay/mastery teaching remains the engine's domain; no probe ever asserts on live-LLM content.

## §5 The voice & gravity law (Aaron: guarded live generation)

The plan response may include a ≤160-char in-character `dispatch` string, and it MAY be live-generated (Aaron's lock 3). The containment stack is law:
1. **One-way facts:** the model may only phrase what the digest asserts; the schema carries NO field for casualty figures, dates, citations, ranks, or unit-history claims; historical claims never come from the LLM — the cited teaching layer (codex/primary-sources/realism-teaching) is untouched.
2. **Register:** grim-professional, period voice; no gloating, banter, or joking — bound into the static system prompt together with the anti-Lost-Cause charter (no valorizing secession/slavery, no Lost-Cause tropes) for any CS persona.
3. **Labeling:** every rendered dispatch is captioned **"Dramatization"** — never Verified/Inferred, visually distinct from the cited layer.
4. **Somber suppression:** on the D280/D282 somber battle set (`H0_SOMBER_SCENES` — currently antietam/gettysburg/chancellorsville), live dispatch TEXT is not rendered (orders still execute); a grave canned line or silence stands in. No live-generated text over the dead, ever.
5. **Failure = silence:** refusal/error/timeout renders nothing (or a neutral canned line) — never an apology, never meta-text about being an AI.
6. **Grounding null-guard:** `__FIELD._e53` diagnostics exist only while T26 parity is active (T26:115 gate) — any state read used for voice grounding must null-guard (the judged kill on the narrator candidate).

## §6 Settings & persistence law

The connector is NOT a T6 `aiSkill` axis (it replaces the commander, not the sharpness of the engine's). It gets its own settings surface (connector panel + per-battle enable), WCAG 2.2 AA and reduceMotion-clean like every H0 surface. All `cw_llm_*` state is pure-UI/localStorage; the sim reads only `__FIELD.llmCommander` stamped at launch. **`_SAVE_VER` is not bumped** (additive no-bump convention; nothing LLM-related enters save state). Mid-battle saves of an LLM-commanded battle resume under the ENGINE commander until the player re-enables (no plan state is persisted — simplest honest semantics, disclosed in the UI).

## §7 Scope boundary + slices

**§7.1 In scope (this milestone):** `src/tactical/T27-llm-commander.js` · the T0 dispatch line · the connector adapters + settings/enable UI · `tools/probe-llm-commander.mjs` + vet:noreg enrollment · docs. **The D278-owed T0 stale-comment fix (T0:351 badges-layer "CS 5/8" example — stale, honest value 7/8 per the D278 A/B) RIDES slice 1** — it is the next T0-touching slice.

**§7.2 Out of scope (any of these = new fork):** `build/base.html` edits · `data/*.json` changes · any PM3/auto-resolve change · any combat-model/damage change (D74) · flip-the-default · a backend/proxy · per-battle outcome-tuning prompts · E59/E61 (their own ledgers) · M8/Q5/Q6 (locked) · Phase H media (parked).

**§7.3 Recorded future candidates (NOT folded in, salvage preserved):** the authoring-time per-general doctrine engine (judged 22/30 — its doctrine-as-INPUT vocabulary and damage-invariance probe leg are the strongest D74-safe upgrade path for the ENGINE commander) and the character/narrator layer (canned dispatches from the D173 `cmdEnemyShadow` surface, after-action interview, staff advisor, seminar Q&A). Either may become its own milestone later; both compose with this connector.

**§7.4 Slices (each with its own D160/D176 focused gate):**
- **SLICE 1 — the engine seam (ZERO network):** T27 module (state, digest builder, validation wall, order application, all inertness gates + hooks) + the T0 dispatch line + the owed T0 comment fix + probe-llm-commander + manifest/vet enrollment. Fully testable via `_t27MockPlan`. No adapter, no UI beyond nothing-visible.
- **SLICE 2 — the connector:** adapters A+B, presets, settings panel + per-battle enable, key handling + honesty notes, zero-network tooth extended to the UI paths. Live smoke vs an OpenRouter `:free` model runs MANUALLY (never a gate — no network in gates).
- **SLICE 3 — voice + persona texture:** the dispatch render surface (§5 stack), persona/difficulty prompt presets (INPUT texture only), optional per-general system-prompt seasoning from `generals.json` temperament fields.

## §8 Gates (per slice)

`node tools/build.mjs` → GATE OK · `node --check` on every touched JS/probe · focused `probe-llm-commander` ×2 green 0 pageerrors · adjacents: `probe-ai`, `probe-attacker-parity`, `probe-presets`, `probe-field` + bullrun/fredericksburg direction spot-checks (byte-identity expected — the seam is off in all of them) · `probe-auto-resolve` 10/10 + `probe-campaign-link` (the PM3 lock) · screenshot readback on any UI slice (the D282 lesson — geometry teeth miss real paint bugs) · WCAG arithmetic on new UI text · `git diff --check` · read-only default-refute Opus panel (read-only lenses only — the D281 panel-race lesson) before any shipped-code commit · docs trail (DECISIONS/RUN-LOG/HANDOFF/WAKE-UP/V1-CHECKLIST/REVIEW-QUEUE). Probes run foreground `2>/dev/null`, `export TMPDIR="$PWD/.tmp"`, one shared `python3 -m http.server 8765`, batteries sequential. Never push red; never weaken a probe.

## §9 THE PASTE-READY BUILD PROMPT (slice 1)

> **ultracode — xhigh.** You are Claude Opus 4.8 (`claude-opus-4-8` / `opus[1m]`) in `~/Desktop/Video Game`. Run `git fetch origin && git status --short --branch && git pull --ff-only origin main`; confirm HEAD ≥ D283. **THE ASSIGNED SLICE: LLM-OPPONENT BUILD, SLICE 1 (Q-D270-5 / D283) — the T27 engine seam, ZERO network.** The Aaron-locked law is `docs/design/llm-opponent-design.md` — read it in full and honor it verbatim (§3 the seam · §4 determinism/probe law · §7.4 slice-1 scope). Read order: START-HERE.md → HANDOFF.md top → WAKE-UP.md top → the law → DECISIONS D283/D282/D281/D277/D74/D64 → src/tactical/T26-attacker-parity.js (the idiom) → src/tactical/T0-field-sandbox.js:750-790 (the dispatch chain) → src/87-auto-resolve.js (the PM3 lock you must never break) → tools/probe-attacker-parity.mjs (the probe idiom).
> Build: `src/tactical/T27-llm-commander.js` (per-launch state · fog-respecting band-quantized digest builder as a pure function · the validation wall · order application writing ONLY `u.order`/`u.formation`+`_t27`, no fldRng, never playerCharge · gates: `llmCommander` default-off, sticky `_llmOff`, hard-refuse on `autoBoth`/headless · `_t27MockPlan` hook) + the one T0 dispatch line inside the asymmetric block above fldAiDefender + **the owed T0:351 stale-comment fix (D278: "CS 5/8" → the honest 7/8 example)** + manifest registration + `tools/probe-llm-commander.mjs` (§4.3 teeth a–d) + vet:noreg enrollment. NO network code, NO UI, NO adapters in this slice.
> Gates (§8): GATE OK · node --check · probe-llm-commander ×2 0 pe · adjacents probe-ai/attacker-parity/presets/field + bullrun/fredericksburg spots (byte-identity) · auto-resolve 10/10 + campaign-link · diff-check · read-only Opus refute panel · commit/push · full docs trail. Then STOP at the D171 boundary with the slice-2 prompt. Queue after this milestone: E59 → Priority-1 Soldier's Story. M8/Q5/Q6 locked; Phase H parked; Phase D deferred. Helper routing D145/D286: readers Sonnet low-medium, panel lenses Opus high; every call sets model+effort explicitly; the Opus 4.8 main loop is the final verifier.
