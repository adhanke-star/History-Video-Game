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

### LANE-002 · phase-i-named-army — **CONTRACT** (opened ahead of the M5 drive)

- **Owning tool:** Claude Code (this session).
- **State:** CONTRACT → DRIVE as each slice starts.
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
- **Resume pointer:** **5a SHIPPED (D357) · 5b batch 1 SHIPPED (D358: 8 Bull Run cmd rows; probe
  pins 31→39, 912 pin HELD — replacement batches preserve registry length, only new battle units
  move 912) · 5c SHIPPED (D360: 11-rung promotion lattice + Career Trajectory read-out; nothing
  new rides the save).** The lane's PLANNED slices are complete; it stays OPEN for further 5b
  batches — size each from the 840-row count above and log the number in DECISIONS before the
  first record. NOTE for future batches: a new battle shipping (LANE-003) adds units ×3 slots to
  the universe AND moves the 912 registry pin — whoever ships a battle bumps that pin with a
  documented-history comment (the D355 idiom); replacement batches never do.
- **Last-touched commit:** D360 (5c).
- **History:** lane opened by Claude Code 2026-07-10 under Aaron's Contract Relay kickoff;
  5b inventory attached 2026-07-10; 5a shipped D357 2026-07-10; 5b batch 1 (8 records) shipped
  D358 2026-07-10; 5c shipped D360 2026-07-10.

### LANE-003 · battle-ladder — **DRIVE** (Claude/Fable owns the D363+ ladder)

- **Owning tool:** Claude Code, with Fable 5 at xhigh as the TOP LOOP.
- **State:** DRIVE — Fable verified the clean `b1d828b` boundary (HEAD == origin/main, worktree clean) and took the lock on 2026-07-10 for the D363 New Market Heights planning/spec commit; D363 and D364 (playable New Market Heights) are now shipped and the lane continues toward Stones River.
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
  `stonesriver` id + rail route guarded as a separate layer. **NEXT — D366 playable Stones
  River** from the committed D365 boundary: data/stones-river.json + registry/menu + schema 46
  + loot 990 + units×3 + flags/Intel/media 16 + suite 121 + the largest-scene check vs
  Kennesaw's 17 + focused probe with the near-parity battery + negative binds + honest A/B +
  docs. Stretch in order only if both mandatory battles are shipped and the release battery is
  green: Cedar Creek · Cross Keys/Port Republic · Five Forks · Fort Donelson · Elkhorn Tavern.
  2-3 battles at FULL depth beat 6 shallow ones. After the final lane battle: full serialized
  `npm run vet:noreg`, inspect every artifact, sync docs, push, and move this lane toward
  release.
- **Last-touched commit:** D362 (Gaines' Mill playable slice + Fable transfer) · D363 (New
  Market Heights spec + plan probe, Fable/Claude) · D364 (playable New Market Heights,
  Fable/Claude) · D365 (Stones River spec + plan probe, Fable/Claude — this commit).
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
  tooth — Fable/Claude).

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
