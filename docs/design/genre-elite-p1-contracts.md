# Genre-Elite P1 Design Contracts — GEA-07..GEA-14 (D441)

**Status:** D441 durable design contracts (LANE-010 queue item 9, docs only — NO runtime in
this slice). Source law: the D369 genre-elite audit (`docs/design/genre-elite-audit-2026-07.md`
+ the REVIEW-QUEUE GENRE-ELITE ledger). Each contract below is written to the LANE standard: a
future session can take any one as a bounded slice, rebuild its teeth from this prose, and ship
against it without re-adjudicating scope. Shipping order is NOT fixed here; each slice takes
its own D### and lane lock. GEA-05/06 shipped in D440 and are not restated.

---

## GEA-07 · Learn-the-Battle metadata + the non-binding recommendation card

**Intent:** the game exposes deep presets but no learning route or session-length honesty.
**Contract:** (1) every registered scenario gains OPTIONAL presentation metadata — 
`learnMeta: { phases, approxMinutes: [lo, hi], skills: ["facing", "columns", ...], recommendedAfter: "<scenarioId>|null" }`
— derived at authoring time, validated by schema (bounded arrays, known skill ids, a real
scenario id or null), NEVER read by combat, scoring, or AI. (2) One read-only "Learn the
Battle" card on the scenario picker renders it (duration band, skills taught, the recommended
predecessor) with an explicit "recommendation, never a gate" line. (3) NO automatic settings
change, no locked content, no difficulty mutation — the card informs, the player decides.
**Seams:** scenario data files (additive optional key), the T1 picker render, schema validator
(optional-key family), one focused probe.
**Teeth:** schema validates the closed shape; a scenario WITHOUT learnMeta renders no card
(byte-identical picker row); the card text derives from data (no hardcoded copy); grep-guard:
no combat/AI file reads `learnMeta`.
**Exclusions:** no preset auto-selection, no telemetry, no per-player skill model.

## GEA-08 · The Chief of Staff morning brief (strategic legibility)

**Intent:** ~20 President's Desk tabs expose deep systems without a turn-level priority brief.
**Contract:** one read-only "Chief of Staff" panel at the top of the desk composing AT MOST
three priority lines per turn, each derived from EXISTING snapshot readers (treasury trend,
manpower pool, blockade/recognition drift, morale, rail, pending decisions) by a deterministic
severity ordering declared in data (`data/chief-of-staff.json`: rule id → reader id →
threshold → copy template → target tab). Each line deep-links to its owning tab. The panel
WRITES NOTHING, computes NO new aggregates (readers are the same functions the tabs already
call), and renders at most three lines plus an honest "all quiet" state.
**Seams:** a new small src module + one guarded call in the desk shell render; the data file;
schema enrollment; one focused probe.
**Teeth:** determinism (same campaign state → same three lines); purity snapshot; every rule's
reader exists (fail-closed: an unknown reader id drops the rule, never throws); the
three-line cap; deep-link targets are real tab ids.
**Exclusions:** no advice engine, no LLM, no new aggregate computation, no auto-action.

## GEA-09 · The audio-bus contract, then the action-map seam (game accessibility)

**Intent:** no independent audio buses, mono option, remapping, or gamepad support exists.
**Contract, phase 1 (audio buses):** define bus ids `critical | ambient | ui | narration`
with independent 0-100 volumes plus a mono-downmix flag in `G.settings.audio` (device-scoped
presentation state; defaults preserve today's output exactly). Every EXISTING sound call is
tagged with one bus at its call site; an untagged call defaults `ui` (fail-open to audible,
never silent). Settings UI: four labeled sliders + mono toggle in the existing a11y panel.
**Contract, phase 2 (action map, separate slice):** one declarative table of action ids →
default keys (the current bindings verbatim) consumed by `fldKey`/global handlers; remapping
UI writes device-local `cw_keymap_v1` (closed shape, sanitized, collision-checked, reset
button); gamepad remains OUT of scope until the map ships.
**Teeth:** default-state byte-equivalence (no settings → today's behavior); bus volumes
multiply only their bus; mono flag downmixes without silencing; keymap sanitation (unknown
action ids dropped, duplicate keys refused); `_SAVE_VER` untouched (device-local only).
**Exclusions:** no new audio assets, no spatializer, no gamepad in phase 1-2.

## GEA-10 · Stable concept ids + deep links at the moment of need (contextual teaching)

**Intent:** Codex/glossary/Primary Sources/battle cards/AAR are strong but inconsistently
linked.
**Contract:** (1) a REGISTRY of stable concept ids (`concept:<kebab>`) declared in data,
each mapping to exactly one canonical surface anchor (codex entry id, glossary term,
primary-source id, teaching-card id). (2) Surfaces opt in by annotating EXISTING copy spans
with `data-concept="<id>"`; a shared delegated handler opens the canonical surface and
RETURNS FOCUS to the invoking element on close (the S12/S22 focus law). (3) Provenance
travels: a deep link into a sourced card always lands where its sources are visible.
(4) Unknown ids fail closed (the span renders as plain text, no dead link).
**Teeth:** registry closed-shape validation; every declared anchor resolves to a real
entry (registry-truth, live-derived); focus-return round trip; unknown-id inertness.
**Exclusions:** no prose expansion, no new content — wiring only.

## GEA-11 · The theater graph (operational campaign) — DESIGN ONLY, runtime P2

**Contract:** a node-and-edge theater graph (nodes = the existing strategic locations;
edges = the existing rail/river links in `data/logistics-rail.json`) rendered as a READ-ONLY
overlay on the theater map readout, consuming existing logistics/command data. The P2 runtime
question (movement, AI, divergence, saves) is explicitly NOT contracted here; this slice ships
the data shape + the readout only. Any interactive campaign layer requires its own future
contract with save implications adjudicated first (`_SAVE_VER` law).
**Teeth (readout slice):** graph derives 1:1 from existing data (no invented geography);
readout purity; the D423 registry-truth idiom applied to node ids.

## GEA-12 · One historically bounded three-beat memory chain (event memory) — DESIGN ONLY

**Contract:** exactly ONE proof chain using EXISTING decision/cabinet ids: beat 1 (a decision
resolves) → beat 2 (a bounded later eligibility flips: one new decision card becomes offerable,
keyed to the beat-1 receipt) → beat 3 (one AAR/Chronicle line names the chain). The memory
lives in a bounded keyed map on the campaign (cap 8 chains), never free text, never a new
political engine. Save implications are the gating question: the map rides INSIDE the existing
envelope only if `serializeSave` byte-compatibility is proven for legacy saves (no version
bump); otherwise the chain is deferred, recorded, and NOT shimmed.
**Teeth:** chain determinism; legacy-save byte identity; the cap; the beat-2 card is
offerable-not-forced; Historical/Mayhem parity per the D416 law.

## GEA-13 · Deterministic replay capsule (P2, after AAR export)

**Contract:** a versioned, secret-free capsule `{ capsuleVersion, scenarioId, seed, settings
subset, playerSide, ordered order-log }` captured during a tactical battle behind a default-off
recording flag; playback drives the SAME engine with input injection and asserts end-state
hash equality before anything is called a "replay." Divergence = honest failure ("this build
cannot replay that battle"), never a silent approximation. Export/import rides the GEA-02
plain-text/download idiom. No save-envelope movement (capsules are device-local files).
**Teeth:** determinism round-trip on 3 seeds; version refusal (an unknown capsuleVersion
fails closed); secret-free grep; the recording flag defaults OFF with zero sim-path cost.

## GEA-14 · The classroom session packet (P2, after export + deep links)

**Contract:** a print-safe, single-file session/evidence packet composed from EXISTING ids:
scenario + settings summary, the AAR plain-text export (GEA-02), the divergence ledger, the
teaching cards the session actually surfaced (by concept id, GEA-10), and every cited source
list verbatim. NO LMS, no accounts, no grading of students — the packet is evidence a teacher
prints. One "Session Packet" button on the AAR export bar; generation is pure read.
**Teeth:** packet composes only from existing surfaces (no new prose); sources render
verbatim; the button rides the GEA-02 bar without changing its existing teeth; print CSS
sanity (no dark-background ink traps).

---

**Standing exclusions for every slice above:** D74 no-fudge; the frozen base; `_SAVE_VER=1`
unless a slice's contract explicitly adjudicates otherwise BEFORE runtime; citation law for
any new historical claim; bare-name globals; the D412 docs law; each slice appends its own
AUDIT-DEBT row while D431-class deferral remains in force.
