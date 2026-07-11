# COORDINATION.md — the Contract Relay (cross-tool lane locks)

**What this is:** the standing handoff ledger between AI tools (Claude Code, ChatGPT/Codex, or
any future implementer) for work that spans sessions or tools. A **lane** is one bounded piece of
work with a single owner at a time. This file carries the lane's **contract** — enough committed
prose that either tool can pick the lane up cold and rewrite its acceptance teeth from scratch.
Shipped by D356 (2026-07-10) under Aaron's Contract Relay kickoff; the E50 lane below is the
retroactive worked example that motivated it.

Linked from `START-HERE.md`, `AGENTS.md`, and `CLAUDE.md`. Update the lane ledger in the same
commit as the work it describes, exactly like `DECISIONS.md`.

---

## 1 · THE HARD RULE — the lock never carries red teeth in git

Non-negotiable #3 forbids pushing red. The relay exists to hand off unfinished work. These
reconcile only one way:

> **Red probe teeth NEVER land in git.** The lane lock carries the CONTRACT — the acceptance
> criteria and probe design in full, as committed prose — and the teeth themselves land **in the
> same commit as the fix that greens them.**

If a session dies mid-lane (usage cap, crash, context boundary), the uncommitted red teeth in its
working tree are a bonus for the next session, not the record. The record is this file. A next
session that finds working-tree probe edits should treat them as a candidate rendering of the
lane's contract: read them against the lane entry, adopt or deliberately amend them (log why in
`DECISIONS.md`), and commit them with the fix.

**Why this exists (the E50 near-miss, 2026-07-10):** a Codex session diagnosed E50, authored
five acceptance teeth as uncommitted edits to `tools/probe-command.mjs` + `tools/probe-save-slots.mjs`,
and ran out of usage before writing the fix. The teeth survived only because nobody cleaned the
working tree — one `git checkout -- .` and the acceptance criteria would have died with the
session, leaving only a one-line ledger entry. The relay makes that impossible: the contract
would have been committed prose before the teeth were ever authored.

## 2 · Lane states

`LAW-DRAFT → CONTRACT → DRIVE → VERIFY → SHIPPED`

- **LAW-DRAFT** — design law being written (a `docs/design/*.md` packet, a DECISIONS entry, or a
  spec section). No acceptance criteria yet. Safe to commit at any point (docs-only).
- **CONTRACT** — the lane entry below is complete: acceptance criteria in full + the probe design
  (files, what each tooth asserts, how to run it). From here, ANY tool can drive. This is the
  minimum state before a session may start implementation it might not finish.
- **DRIVE** — an owner is implementing. The owner keeps the resume pointer current at every safe
  boundary (committed docs edit or handoff prompt), so a death mid-DRIVE loses work, not context.
- **VERIFY** — code + teeth green locally; the D160/D176 focused gate, negative tests, doc sync,
  and (at release boundaries) the full battery are running or queued.
- **SHIPPED** — committed + pushed with teeth green in the same commit; the lane records the
  final commit SHA and flips its REVIEW-QUEUE/`V1-CHECKLIST` lines.

## 3 · What every lane must record

| Field | Meaning |
|---|---|
| Lane id | `LANE-###` + a short slug |
| Owning tool | who holds the lock NOW (Claude Code / Codex / unowned) |
| State | one of the five states above |
| Design law | path(s) to the binding law/spec/decision |
| Acceptance criteria | IN FULL — the contract a cold session rebuilds teeth from |
| Probe design | files · what each tooth asserts · how to run |
| Resume pointer | the exact next action for whoever picks the lane up |
| Last-touched commit | SHA of the newest commit that advanced this lane |

**Lock discipline:** one owner per lane. Take the lock by setting `Owning tool` + `State` in a
committed edit; release it the same way. A session that finds a lane locked by the other tool
does not drive it — it either works another lane or (if the lock is plainly stale, e.g. the
owning tool's session died) takes over and says so in the lane's history line.

## 4 · Model routing — the Contract Relay binds ROLES, not model names

Subscriptions churn (D223 put the main loop on Fable 5; D286 reverted to Opus 4.8 when Fable left
the plan; Fable returned 2026-07-10). So lanes and kickoffs name **roles**; each session resolves
the role to the best model its tool offers that day and states the resolution once at the top of
its run.

- **TOP LOOP** — Claude: Fable 5 if on the plan, else Opus 4.8, at xhigh. ChatGPT: 5.6 Sol at
  Ultra. Owns design law, acceptance criteria, historical judgment, combat balance,
  UX/accessibility judgment, adversarial adjudication, final integration, the commit. NEVER
  delegated.
- **REASONING HELPERS** — Claude: Opus at high/xhigh. ChatGPT: the next tier below Sol Ultra.
  Bug-hunt finders/verifiers/critics, design + judge panels, citation-grade research-verify.
- **MECHANICAL HELPERS** — Claude: Sonnet at low/medium; Haiku for pure greps/reads/sizing.
  ChatGPT: whatever lower tier the surface exposes. Search summaries, inventories, probe-log
  summaries, schema fills, probe scaffolding, mechanical doc syncs, first-pass source gathering.

Set model AND effort explicitly whenever the surface exposes those controls. An unset call can
inherit the top tier (~97% of the 2026-06-16 cost spike), so inheritance is never accidental.
**ChatGPT/Codex exception (Aaron, 2026-07-10):** a surface with no per-helper controls may use
inheriting helpers for bounded, output-insensitive evidence work: read-only inventories,
log/artifact summaries, gate execution, or independent mechanical audits. State the exception
once and assign by task-specific strength. Helpers produce evidence; the TOP LOOP verifies every
packet and retains architecture, code ownership, combat balance, historical claims,
UX/accessibility judgment, final synthesis, integration, and the commit.

---

## 5 · LANE LEDGER

### LANE-001 · e50-save-envelope-deep-guard — **SHIPPED** *(retroactive worked example)*

- **Owning tool:** Claude Code (drove + shipped); teeth authored by ChatGPT/Codex.
- **State:** SHIPPED (D353, commit `47f6f71`).
- **Design law:** `DECISIONS.md` D244 (E13 guard pattern) + D323 (Transfer sink) + the
  REVIEW-QUEUE run-2 E50 entry; fix record D353.
- **Acceptance criteria (as the relay would have carried them):**
  1. A save whose campaign envelope carries an own `hasOwnProperty` at ANY depth is rejected at
     `loadLocal` (reads as corrupt/null; `hasSave()` false; boot reaches the menu with 0 pageerrors).
  2. The same payload is rejected at EVERY import/slot-read accept lane (`_slImportText`,
     `_slRead`, undo — all via `_slValidSave`).
  3. `applySave` is ATOMIC: a rejected payload applies NOTHING — settings must not be partially
     applied before the campaign is rejected, and the live `G.campaign` object must survive.
  4. The D323 sink `_cmdTransferClean` cannot be crashed by an own non-callable `hasOwnProperty`
     in `transfer.ids`: iteration is tamper-proof, the poison key is dropped, legitimate sibling
     records survive, and the rebuilt `ids` inherits the callable prototype method.
  5. Every legitimate save (anything `serializeSave` ever wrote) is byte-identical through all
     lanes; the E41 save-shape hashes are updated consciously with NO `_SAVE_VER` bump.
  6. Negative test: remove the guard → exactly these teeth go red → restore.
- **Probe design:** `tools/probe-save-slots.mjs` — deep-poison import tooth, slot-read tooth, a
  third E50BOOT page-load with a settings-clean/campaign-poisoned autosave (rejected-at-boot +
  atomic-applySave steps); `tools/probe-command.mjs` — the raw.ids sink sanitization tooth.
  Run: `export TMPDIR="$PWD/.tmp"`, shared `:8765` server, foreground `2>/dev/null`, read
  `tools/shots/*.json`.
- **Resume pointer:** none — closed. Residual logged in D353 (remaining callable-form
  `raw.hasOwnProperty(k)` sites are unreachable from any save lane; a future slice may sweep them).
- **Last-touched commit:** `47f6f71`.
- **History:** teeth authored (uncommitted) by Codex 2026-07-09/10 · contract reconstructed from
  the working tree + REVIEW-QUEUE by Claude Code 2026-07-10 · shipped D353.

### LANE-002 · phase-i-named-army — **CONTRACT (5b)** (open, unowned)

- **Owning tool:** none after the D372 clean release; 5a and 5c remain shipped.
- **State:** CONTRACT on open 5b; no D367-session prosopography batch started.
- **Design law:** `V1-CHECKLIST.md` Phase I · `RATING-SYSTEM-DESIGN.md` (D94 OVR/ratings law) ·
  `SOLDIER-REPLACEMENT-FORMAT.md` (`cw_soldier_replacements_v1`, the citation-grade replacement
  lane) · DECISIONS D91/D93 (journey mode), D152 (lane tooling), D172-D298 (31 shipped records),
  D299 (row deferral, superseded for this lane by the D324 unlock + Aaron's 2026-07-10 kickoff) ·
  memory pillar: EA-Sports-style prosopography, play-as-anyone whole-war journey.
- **Slices + acceptance criteria:**
  - **5a · Army Register muster-roll UI:** wire the probe-vetted `fldMusterRollHtml(u)`
    (src/tactical/T14-ratings.js) to a player-reachable inspect/expand surface in the tactical
    UI. Criteria: reachable by pointer AND keyboard from a selected unit; renders the existing
    muster-roll HTML unmodified (no new historical claims); no sim/output writes (presentation
    only — D74 byte-identity on AI-vs-AI baselines); full WCAG 2.2 AA (name/role/value, focus
    order, visible focus, ≥4.5:1 text, reduceMotion-safe, aria-live only where state changes);
    wcag-auditor pass; probe teeth assert reachability, content fidelity vs `fldMusterRollHtml`,
    keyboard path, and zero pageerrors; existing probe-ratings rows stay green.
  - **5b · prosopography batch:** FIRST a mechanical-helper inventory of remaining
    generated/unresearched replacement rows (count · by side · by theater · candidate-source
    coverage in `HISTORICAL-DATA*.md`); the TOP LOOP sizes the batch from that count + remaining
    context and logs the number + reasoning in `DECISIONS.md` BEFORE the first record. Per
    record: ≥2 independent reputable sources = Verified else Inferred/Disputed; no fabricated
    people/ranks/units/citations; rank-and-sector verified AT THE BATTLE DATE; no women/support
    figures collapsed into `ss:` replacements; mechanical helpers gather, REASONING helpers
    default-refute, TOP LOOP adjudicates and owns final text; importer gate + focused
    replacement-overlay probe green per record; batch ships as its own slice with the remainder
    left HERE as an open count.
  - **5c · start-anywhere career trajectory:** richer whole-war journey per the pillar —
    save/journey/report contracts unbroken; `_SAVE_VER` bumps ONLY with an idempotent lazy
    migration (E41 gate updated consciously in the same commit); D74 byte-identity where the
    journey is inactive.
- **Probe design:** 5a — extend `tools/probe-ratings.mjs` (the `fldMusterRollHtml` teeth live at
  :451-458) or a focused `probe-muster-roll.mjs` with UI reachability/keyboard/pageerror teeth +
  wcag-auditor run; 5b — `tools/import-soldier-replacements.mjs` gate + the replacement-overlay
  probe per record; 5c — extend `tools/probe-camp.mjs`/`probe-loot-survival.mjs` journey teeth +
  save round-trip teeth. All: build GATE OK, `git diff --check`, JSON/pageerror readback.
- **5b inventory (mechanical helper, Sonnet, 2026-07-10 — size any batch FROM THIS COUNT, never
  from a prompt; decremented by D358):** universe **879** slots = 293 unique units × 3 types
  (`cmd`/`nco`/`pvt`), derived by `ssPersonRegistry()` (src/37-loot-survival.js:800,
  `_ssCollectScenarioUnits`:774, `_ssUnitSpecs`:553) over `fldScenarioRegistry()`;
  phases/reinforcements deduped by battle:side:uid. **Replaced 39 · remaining 840** (US 19 · CS 20
  shipped). Remaining by battle (total/replaced/remaining): bullrun1 54/10/44 · malvernHill
  60/0/60 · antietam 84/4/80 · fredericksburg 51/1/50 · chancellorsville 39/2/37 · gettysburg
  105/8/97 · shiloh 48/3/45 · vicksburg 81/3/78 · chickamauga 90/8/82 · chattanooga 81/0/81 ·
  kennesaw 54/0/54 · franklin 57/0/57 · nashville 75/0/75. **In-repo candidate sources:** only
  Bull Run has real banked OOB material (~560 lines, HISTORICAL-DATA.md:21-580; its 8 richest
  cmd rows are now spent — remaining Bull Run rows are nco/pvt diarists or thinner cmd slots
  like Keyes/Franklin/Willcox/Ricketts/Cocke/Stuart/Early/Elzey/Jackson); Nashville has a
  ~40-line USCT paragraph (Steedman's brigades, 13th USCT); Vicksburg a Milliken's Bend paragraph
  (related but distinct engagement); the other 10 battles have NO in-repo roster research —
  records there need fresh external NPS/CMOHS/primary-source work (~2 sources + default-refute +
  adjudication per record, the repo's most expensive work per shipped line).
- **Resume pointer:** **D372 CLEAN RELEASE:** the D367 Sol session ended at its 10% boundary before
  Phase D; no record was opened and the live remainder stays **918**. The next qualified TOP LOOP
  must take 5b DRIVE in a committed ledger edit and log its batch size/reason in `DECISIONS.md`
  before the first record. **5a SHIPPED (D357) · 5b batch 1 SHIPPED (D358: 8 Bull Run cmd rows; probe
  pins 31→39, 912 pin HELD — replacement batches preserve registry length, only new battle units
  move 912) · 5c SHIPPED (D360: 11-rung promotion lattice + Career Trajectory read-out; nothing
  new rides the save).** The lane's PLANNED slices are complete; it stays OPEN for further 5b
  batches — size each from the 840-row count above and log the number in DECISIONS before the
  first record. NOTE for future batches: a new battle shipping (LANE-003) adds units ×3 slots to
  the universe AND moves the 912 registry pin — whoever ships a battle bumps that pin with a
  documented-history comment (the D355 idiom); replacement batches never do. **D366 UPDATE:**
  Stones River adds 26 units × 3 = 78 generated slots (universe 293 → 319 units / 879 → 957
  slots; the whole-registry pin is now 1068; remaining unresearched rows 840 → **918**) — size
  future batches from 918. **D367 (Aaron): the chartered ChatGPT 5.6 Sol session MAY take 5b
  DRIVE** (Phase D of its LANE-004 charter): take the lock in a committed edit at session
  start, follow the per-record contract above (mechanical gather → default-refute → Sol
  adjudication owning final text; ≥2 sources; batch sized + logged in DECISIONS before the
  first record), and release the lock at session end.
- **Last-touched commit:** D372 clean release (latest shipped 5b content remains D358 and 5c
  remains D360).
- **History:** lane opened by Claude Code 2026-07-10 under Aaron's Contract Relay kickoff;
  5b inventory attached 2026-07-10; 5a shipped D357 2026-07-10; 5b batch 1 (8 records) shipped
  D358 2026-07-10; 5c shipped D360 2026-07-10; ChatGPT/Codex took 5b DRIVE for the D367
  chartered session in D368 and released it untouched at D372's 10% boundary, 2026-07-10.

### LANE-003 · battle-ladder — **DRIVE** (Claude/Fable owns the D363+ ladder)

- **Owning tool:** Claude Code, with Fable 5 at xhigh as the TOP LOOP.
- **State:** DRIVE — D363-D366 (New Market Heights spec+playable, Stones River spec+playable) are shipped, and **D373 (2026-07-11) discharged the lane's release obligation: the full serialized 121-command `npm run vet:noreg` battery is GREEN with every JSON artifact read**. The lane holds DRIVE for its ratified stretch order. ChatGPT/Codex must not drive this lane.
- **Design law:** `docs/design/battle-build-research/` packets (`eastern-1862` → Gaines' Mill ·
  `usct` → New Market Heights · `western-gaps` → Stones River · stretch: `shenandoah-1864` Cedar
  Creek · `shenandoah-1862` Cross Keys/Port Republic · `appomattox-campaign` Five Forks ·
  `naval-river` Fort Donelson land+river · `trans-mississippi` Pea Ridge ELKHORN-TAVERN AXIS
  ONLY) · the D330-D335 spec→playable→guard pattern · D74 universal combat (NO per-battle fudge) ·
  D92 accurate-inputs · **D359 (AARON): all phase locks cleared for this session, with two
  dignity carve-outs a blanket unlock does NOT reach — NO Leetown Native OOB (D178/D183), NO
  playable Fort Pillow (teaching-only). No ship-vs-ship engine exists.**
- **Acceptance criteria (per battle, the full D330-D335 pattern + extras per Aaron's popup):**
  1. Durable spec (`docs/design/<battle>-battle-build-spec.md`) + plan probe green BEFORE runtime.
  2. Playable slice: `data/<battle>.json`, registry/menu rank in `src/tactical/T1-bull-run.js`,
     schema-validator enrollment, generated HTML rebuilt from source.
  3. Focused runtime guard `tools/probe-<battle>.mjs` with HISTORICAL-DIRECTION teeth from the
     packet (⚠ Stones River / Perryville invert "the winner bleeds less" — near-parity guards,
     never assume US < CS), 8/8-style direction batteries, 0 pageerrors.
  4. Source honesty: engaged strengths not campaign totals; `Verified identity; Inferred
     strength` where exact numbers are unpinned; rank-at-battle-date traps from the packet
     (Polk/Hardee are Maj. Gens. at Perryville but Lt. Gens. at Stones River; New Market Heights
     USCT Medal of Honor men; no anachronistic ranks).
  5. Roster/custom-builder baselines updated; **probe-loot-survival registry pin 912 moves**
     (+units×3, documented-history comment — see LANE-002 note); teaching cards + codex axes;
     honest A/B whenever a sim input moves.
  6. Negative bind test per new guard; D160/D176 focused gate; docs sync; commit + push per
     green slice. Full battery only at a release boundary.
- **Probe design:** per battle — plan probe (spec invariants) + runtime probe (registry/menu/
  OOB sums by sector/direction battery/pageerrors), modeled on `tools/probe-nashville*.mjs`.
- **Resume pointer:** **D362 playable Gaines' Mill is the handoff boundary in the commit that
  carried this transfer.** D363 (SHIPPED) locked the New Market Heights contract (spec +
  10/10 plan probe). **D364 (SHIPPED, this commit) closes out playable New Market Heights** —
  the green WIP recorded at the 2026-07-10 session boundary was adopted per the relay rule and
  completed: bind 2 executed (fldEngSeedScenarioObstacles stubbed → rebuild GATE OK → EXACTLY
  the OBSTACLE BELTS tooth red, 13 others green, exit 1 → md5-identical restore of source AND
  generated HTML → 14/14; the direction battery stayed green beltless — the belts are friction,
  not the outcome carrier); the spec's Required D364 Runtime Gate ran serialized with every JSON
  artifact read (node --check 13/13 · GATE OK · schema 45/45 · plan 10/10 · runtime 14/14 with
  direction 8/8·7/8·7/8·8/8 · roster 8/8 · builder 15/15 · loot 12 with the 990 pin · flags 44 ·
  weather 30 · Intel 26 · media 13, known soft warning · vet --list 120 · gaines 13 · nashville
  12 · field 23 · diff clean · 0 pageerrors everywhere); a 3-packet Opus/high default-refute
  pass over the NEW teaching prose (Butler Medal, Fort Pillow proportions, MoH superlative)
  produced ONE AMEND, applied before ship — the MoH superlative is now scoped "the most awarded
  to Black soldiers for any single engagement of the war" — plus two stronger Butler-card
  sources; and one gate-caught root cause: probe-gaines-mill's whole-registry pin 957 → 990
  with the documented-history comment (the pin-bump idiom this ledger's LANE-002 note predicts —
  replacement batches never move it, new battles always do). The honest A/B, the 22nd-USCT
  spec amendment (phase-1 arrival ≤250, opening OOB 630-770 held, total ≤1,000), and both binds
  are logged in DECISIONS D364. **D365 (SHIPPED, this commit) locks the Stones River contract:**
  `docs/design/stones-river-battle-build-spec.md` + `tools/probe-stones-river-plan.mjs` (11/11,
  bind-tested — the bind's first pass exposed a substring weakness and the HISTORY tooth was
  anchored to the exact trap lines before the tamper bit exactly; the lesson is in D365). An
  11-agent research pass (5 Sonnet gather → 5 Opus default-refute → 1 Opus critic, 0 errors)
  confirmed all 23 battle-date ranks (Polk/Hardee LIEUTENANT generals from Oct 10 1862;
  Sheridan BRIGADIER, MG backdated; Hazen COLONEL) and REFUTED a claimed OR brigade-strength
  table — only Breckinridge's 7,053 / ~4,500 is OR-sourced; every other split ships Inferred
  inside the ABT anchors (41,400 / 35,000; casualties 12,906 / 11,739). Locked shape: two-phase
  T8 CS-attacker/US-defender — Dec 31 (w3 DECISIVE, US holds the Round Forest / Nashville Pike)
  → Jan 2 (w1, US holds sharply; Mendenhall's 45-58 guns as an OOB RANGE tooth); Jan 1 is a
  teaching interstitial (Emancipation Proclamation), never a scored phase; THE NEAR-PARITY LAW
  (aggregate max/min ≤ 1.6, forcing US < CS forbidden) with the one lopsided guard phase-2
  direction-only; menu rank stonesRiver:52; weather rain/dawn never snow; the Classic-layer
  `stonesriver` id + rail route guarded as a separate layer. **D366 (SHIPPED, this commit)
  closes out playable Stones River** exactly per that contract: scenario 16 at menu rank 52,
  26 units all `Verified identity; Inferred strength`, the Jan-1 Emancipation interstitial on
  the phase-2 transition card only, Breckinridge's Jan-2 4,500 in his OR report's two-line
  pairing vs Beatty + Mendenhall's 57 guns (0 CS guns fielded). THE NEAR-PARITY LAW ran green
  on the FIRST battery — all five 8-seed guards 8/8 (p1 US holds · p2 US holds · p2 CS>US
  direction-only · aggregate US · max/min ≤ 1.6 at observed 1.08-1.15 vs the historical 1.10)
  — NO input moved (the honest-A/B log in D366 records zero iterations) and no tooth anywhere
  asserts US < CS. A pre-authoring 6-packet citation-verify workflow adjudicated every card
  URL (Wheeler card dropped single-source; Garesché ships the à-Kempis correction; WHN scoped
  to repulse/guns/45-min with Breckinridge's OR controlling the pairing; quod.lib kept as the
  canonical primary beside Wikipedia's quote). Integration: schema 46/46 · loot pin 990→1068
  (+ the gaines/NMH whole-registry pins same-commit, the pin-bump idiom applied proactively) ·
  flags 45 with a Stones River W/hardee semantic tooth · Intel/media 16 with Kennesaw KEEPING
  the 17-unit largest-scene crown (Stones River opens at 16) · suite 121 · roster
  `stonesRiver:2` · builder · logistics-rail untouched and probe-asserted. Binds: the T1
  registry line removed → exactly the 7 registry-dependent focused teeth + the plan REGISTRY
  step red; `Lt. Gen. Leonidas Polk` → `Maj. Gen.` → exactly ONE focused tooth red; both
  md5-identical restores (source + data + generated HTML); final rerun plan 11/11 + focused
  13/13, 0 pageerrors. **D373 (SHIPPED, this commit) discharges the release boundary:** the full serialized
  121-command battery ran fail-fast in two segments (1-18 · `--from='hard war'` 103/103), final
  `VET NO-REGRESSION OK`; all 120 fresh shots-JSON artifacts read (ok:true · 0 pageerrors ·
  0 realErrors · no failed steps; sweep = 16 scenarios × 8 seeds, failures=[]; diag-classic
  green; bootprobe's 7 filtered 404s are the documented absent-optional-assets probe). The one
  red — hard-war's 360s timeout — was root-caused by artifact mtimes (all 8 steps green at 84s;
  hang was post-write `browser.close()` under a concurrently-running research workflow, Fable's
  own scheduling error) and re-ran green twice (idle focused 92s; in-battery 108.1s). No probe
  weakened, no blind retry. **Lesson: nothing runs concurrently with the release battery on the
  8 GB Mac.** **NEXT — the ratified stretch order at FULL depth (2-3 deep beat 6 shallow):
  Cedar Creek → Cross Keys/Port Republic → Five Forks → Fort Donelson → Elkhorn Tavern.**
  Cedar Creek research is COMPLETE (two workflows, 19 agents, 0 errors): approved-source CMH
  staff-ride strength table (US per-corps; CS per-division incl. Kershaw 3,071, with the
  31-Oct-reconstruction caveat), dawn/counterattack geometry, the fatal halt as an honest
  DISPUTE pinned to Early's and Gordon's own accounts ("glory enough" attributes ONLY to
  Gordon's Reminiscences), Sheridan's ~12-mile ride, and the substantive-grade rank table —
  including the C73-class correction that Emory was Brig. Gen. (Bvt. MG) on Oct 19 1864, which
  also fixes the packet's §4 line. The addendum SHIPPED as packet §12 (D374). Next slice:
  `docs/design/cedar-creek-battle-build-spec.md` + plan probe, then playable runtime — the
  D363-D366 pattern, direction-NEUTRAL casualty guards per the packet §7 (US bled MORE and won).
  At the next clean lane bundle boundary a fresh lock may take Sol's queue per D372
  (E71 → C72; GEA-01 + S44 fallback; LANE-002 5b sized from 918).
- **Last-touched commit:** D362 (Gaines' Mill playable slice + Fable transfer) · D363 (New
  Market Heights spec + plan probe, Fable/Claude) · D364 (playable New Market Heights,
  Fable/Claude) · D365 (Stones River spec + plan probe, Fable/Claude) · D366/D367 (playable
  Stones River + the Sol session charter, Fable/Claude) · D373 (release battery green 121/121,
  Fable/Claude — this commit).
- **History:** lane opened by Claude Code 2026-07-10 after Aaron's popup Q&A (D359) fixed scope,
  depth, and locks for the Codex session · ChatGPT/Codex took DRIVE in D361 and locked the
  Gaines' Mill source/strength/rank/direction contract before runtime · Aaron redirected D363+
  to Claude/Fable on 2026-07-10 so work can continue while the ChatGPT usage window resets;
  ChatGPT retains ownership only through the already-bounded D362 closeout and transfers on its
  green commit · Claude/Fable verified the `b1d828b` D362 boundary and took DRIVE 2026-07-10
  (D363 New Market Heights spec + plan probe first; runtime only after that commit is green and
  pushed; then Stones River) · D363 shipped 2026-07-10 (13-agent research pass → adjudicated
  two-phase USCT shape; spec + 10/10 plan gate; Fort Harrison teaching-only) · D364 shipped
  2026-07-10 (playable New Market Heights closeout: WIP adopted per the relay rule, bind 2,
  full serialized runtime gate, 3-packet Opus teaching-prose refute pass, gaines-pin 990 bump,
  docs sync — Fable/Claude) · D365 shipped 2026-07-10 (Stones River spec + 11/11 plan gate:
  11-agent research pass, the near-parity law, the rank-flip traps, a bind-hardened HISTORY
  tooth — Fable/Claude) · D366 shipped 2026-07-10 (playable Stones River: first-battery 8/8 on
  all five near-parity guards with zero A/B iterations, a pre-authoring citation-verify
  workflow, both binds exact with md5-identical restores — Fable/Claude) · D367 2026-07-10
  (Aaron popup: the release battery deferred one session; the ChatGPT 5.6 Sol session
  chartered as LANE-004 + LANE-002 5b) · D373 shipped 2026-07-11 (the deferred release battery
  green 121/121 with full artifact readback; one hard-war teardown flake root-caused to
  Fable's concurrent research workflow and re-run green; stale pre-D372 Sol sentence in this
  pointer reconciled per D372's relay order — Fable/Claude).

#### Fable takeover packet — read as the continuation prompt

**Role resolution:** You are Claude Fable 5 at xhigh, the quality-owning TOP LOOP for this lane.
Do not downgrade the interactive/main loop. Set both `model` and `effort` on every helper call:
Opus high/xhigh only for citation-grade default-refute verification, adversarial design/balance
review, and final critics; Sonnet low/medium for bounded source gathering, inventories, and
mechanical transforms; Haiku only for pure reads/greps/sizing/log extraction. Fable owns every
historical claim, dignity decision, battle shape, balance input, acceptance tooth, integration,
and commit.

**Why Aaron is routing this interval to Fable:** use the Claude workflow surface where it has a
real operational advantage while ChatGPT's usage window resets: explicit per-agent model/effort
routing; high-fan-out research → default-refute verifier → completeness-critic workflows; the
separate underused Sonnet allowance for evidence-heavy mechanical packets; and long-context
reconciliation across the research packet, spec, probes, and canonical docs. Spend those
advantages on the unresolved OOB/source/rank work and adversarial review—not on duplicating the
already-shipped Gaines' Mill slice or producing speculative polish. ChatGPT/Codex may consult by
reading this ledger when it returns, but it must not edit a Fable-owned DRIVE lane. Put every
durable answer, correction, failed hypothesis, A/B result, and resume pointer here or in the
canonical decision/spec/run docs; private chat context is not the relay.

**Cold start (run, do not assume):**

```bash
cd "/Users/aaronhanke/Desktop/Video Game"
git fetch origin
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
```

Require a clean tree and `HEAD == origin/main`. Do not `pull` across dirt. Read, in order:
`START-HERE.md` → this LANE-003 entry → `AUTONOMOUS-RUN.md` §1-§3 + §8 → `HANDOFF.md` and
`WAKE-UP.md` top blocks → `V1-CHECKLIST.md` → newest `DECISIONS.md` entries through D361/D362 →
`docs/design/battle-build-research/usct-battle-build-research.md` in full →
`docs/design/gaines-mill-battle-build-spec.md` + both Gaines probes as the immediate pattern →
the Nashville spec/probes for T8 → `src/tactical/T1-bull-run.js` + `T8-phases.js`.

**Priority 1 — D363 New Market Heights contract, where Fable's research workflow should lead:**

1. Resolve the USCT packet §9 unknowns before choosing runtime shape: exact 4th/5th/6th/22nd/
   36th/38th USCT brigade attachments and engaged strengths; Gregg's Texas Brigade plus Brig.
   Gen. Martin W. Gary's dismounted cavalry strength and withdrawal timing/reason; and a
   citation-grade Fort Harrison Phase 2 OOB. Use independent sources, then an Opus
   default-refute verifier and completeness critic. If Fort Harrison remains too thin, choose
   and explain the packet-authorized single-phase fallback; never bluff a two-phase OOB.
2. Write `docs/design/new-market-heights-battle-build-spec.md` and a filesystem-first plan probe.
   Default proposal is T8: Phase 1 New Market Heights `scoreWeight:3`, Phase 2 Fort Harrison
   `scoreWeight:1`, US attacker/CS defender, fog OFF, obstacle belt from terrain/engineering
   inputs, and timed defender thinning only if the historical withdrawal is actually sourced.
3. Lock battle-date ranks: Maj. Gen. Benjamin F. Butler; Brig. Gen. Charles J. Paine; Cols.
   Alonzo G. Draper, Samuel A. Duncan, and John H. Holman. Medal of Honor men require exact
   rank/unit/action verification before any named runtime claim. Never turn Black agency into
   white validation or a magical combat buff.
4. Land the Fort Pillow dignity guard in the contract and later focused probe: no playable Fort
   Pillow registry/menu/data scenario; teaching-only treatment may name the massacre plainly.
5. Build GATE OK, plan probe green, relevant current battle probes green, JSON readback,
   `git diff --check`; sync docs; commit and push D363. Only then start runtime.

**Priority 2 — playable New Market Heights:** implement from the committed D363 contract with
the same full-depth pattern as D362: data + registry/menu/schema + T8/runtime focused probe +
8-seed historical-direction guard + rank/OOB/strength/dignity/D74 teeth + roster/builder/flags/
weather/Intel/media baselines + Army Register current pin `957 + unique new units * 3` with a
history comment + teaching/codex + negative bind proof + honest A/B + docs. Commit and push at a
green boundary. Outcome must emerge from true strength, obstacle geometry, timing, formation,
experience, doctrine, and phase weights—never a USCT valor/damage/winner/score key.

**Priority 3 — Stones River:** after New Market Heights ships, repeat spec-first then playable.
Use the western-gaps packet and T8. Its casualty guard is deliberately near-parity: do not import
the common winner-bleeds-less assumption. Re-verify Polk/Hardee as lieutenant generals at Stones
River even though both were major generals at Perryville. Commit/push each green slice.

**Release boundary:** after the final mandatory battle you ship, run the full serialized
`npm run vet:noreg`, inspect every JSON/pageerror summary, repair root causes, sync all canonical
docs and this resume pointer, then push. Stop only at a clean committed boundary, a genuine HALT
condition, or exhausted context; if ChatGPT's usage returns mid-slice, keep the lock until the
next green commit and confer through this ledger instead of permitting simultaneous edits.

### LANE-004 · sol-genre-elite-session — **SHIPPED (D372 clean close)**

- **Owning tool:** none; ChatGPT/Codex drove D368-D371 and released the lane in D372.
- **State:** SHIPPED — Phase A audit, Phase B audit, and the E72 Phase C gate fix landed; Aaron's
  10% boundary ended the charter before further Phase C slices or Phase D records began.
- **Design law:** DECISIONS D367 (the charter) · D336 role routing (`OPUS-PLAYBOOK.md` carries
  the kickoff snippet) · `AUDIT-PROMPT.md` (Phase B verbatim) · `REVIEW-QUEUE.md` (the findings
  ledger both audit phases write) · D369 + `docs/design/genre-elite-audit-2026-07.md` (Phase A
  ratified ladder) · D74 no-fudge · citation law (≥2 sources = Verified) ·
  D171/D307 boundaries · the standing dignity carve-outs (no playable Fort Pillow; no Leetown
  Native OOB) · never push red.
- **Acceptance criteria (four usage-boxed phases; spend the WHOLE session limit):**
  1. **Phase A (~30%) — genre-elite audit → design law.** Web-grounded senior-game-engineer gap
     analysis producing `docs/design/genre-elite-audit-2026-07.md`. Benchmarks: Ultimate
     General Gettysburg/Civil War, Total War, Grand Tactician: The Civil War, Scourge of War,
     Field of Glory 2, Paradox UX patterns (CK3/HOI4), Old World (events/tooltips). Weight ALL
     FOUR pillars equally: tactical battle feel · strategic/campaign depth · elite basics + QoL
     · teaching/history presentation. Per feature: the elite bar (sourced), where this game
     stands (cite actual repo state), the gap, a recommended slice shape, D74/citation/perf
     risks, and a priority score. MUST include a "features Aaron didn't know to ask for"
     section (onboarding/tutorial flow, difficulty curve + assists, save/load UX, audio
     design/mixing, replay + AAR sharing, session-length respect, camera/map ergonomics, AI
     legibility, game-feel/juice, accessibility beyond WCAG). Ends with a ratified priority
     ladder + REVIEW-QUEUE entries. NO runtime edits in this phase.
  2. **Phase B (~20%) — the standing `AUDIT-PROMPT.md` full-spectrum second-model audit** (fresh-
     eyes bug hunt, historical spot-checks, UX/a11y) → REVIEW-QUEUE entries with severity and
     fix-now/fix-later disposition.
  3. **Phase C (~30%) — implement ONLY small cleared quick wins** from A+B (elite-basics/QoL).
     Per slice: focused D160/D176 gate (build GATE OK, focused + 1-3 adjacent probes,
     JSON/pageerror readback, `git diff --check`), docs sync, commit + push. FORBIDDEN in C:
     combat-model/balance inputs (D74), the save envelope/`_SAVE_VER`, LANE-003 files, and any
     new historical claim that has not been through the citation pipeline.
  4. **Phase D (remainder) — LANE-002 5b prosopography batches** per that lane's contract
     (918-row inventory; batch sized + logged in DECISIONS before the first record).
- **Probe design:** Phases A/B are docs/ledger phases — the gate is canonical-doc coherence +
  REVIEW-QUEUE format + `git diff --check`; Phase C uses each touched system's focused probes;
  Phase D uses `tools/import-soldier-replacements.mjs` + the replacement-overlay probe teeth.
- **Resume pointer:** none; lane closed. D369 ratified the 22-feature genre audit, D370 filed 12
  confirmed run-3 findings, and D371 fixed E72 with a biting negative diagnostic. The remaining
  ten pending run-3 findings, GEA-01/02/03, S44, and the untouched 918-row 5b contract remain in
  `REVIEW-QUEUE.md`/LANE-002 for a newly locked session. Fable's already-owned LANE-003 release
  battery remains the immediate cross-tool priority, followed by that lane's ratified stretch
  order if context remains. Its owned resume paragraph still contains one pre-D372 sentence
  about an active Sol charter; Fable, not this read-only session, must reconcile it at next touch.
- **Last-touched commit:** D372 clean close (this commit).
- **History:** chartered 2026-07-10 by Aaron mid-D366 via popup Q&A (boundary: commit D366 and
  defer the LANE-003 battery; scopes: all four; output mode: hybrid audit→quick-wins; pillars:
  all four); ChatGPT/Codex took DRIVE here and on LANE-002 5b together in D368 2026-07-10;
  Phase A ratified and gated in D369 with no runtime edits; Phase B audit run 3 ratified in D370
  with 12 confirmed findings; Phase C shipped only E72 in D371 before Aaron's 10% boundary;
  D372 released LANE-004 and the untouched LANE-002 lock. No LANE-003 touch.
