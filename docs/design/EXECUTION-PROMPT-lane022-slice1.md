# EXECUTION PROMPT — LANE-022 Slice 1 (authored D537; zero-context execution packet)

*Emitted by the D537 Aaron decision session at clean pushed `fb42899`. Paste the fenced block below
verbatim into a fresh session. It carries its own authority — do not require the reader to consult
this session.*

```
RELAY — "The Civil War" · EXECUTION SESSION · LANE-022 SLICE 1: THE READ-ONLY TRACED SUPPLY ROUTE

RECIPIENT + MODEL ROUTING. The TOP LOOP with the healthier usage window: ChatGPT/Codex 5.6 Sol at
Ultra (primary) or Claude Code at Opus 4.8 high/xhigh (secondary; Fable 5 only if on-plan). Must be a
full-access, non-Seatbelt session: CODEX_SANDBOX must be unset or != seatbelt — if it is seatbelt,
restart or reconfigure the session; NEVER weaken tools/guard-probe-browser.mjs. State your model
resolution once at the top of the run. Helpers: set model AND effort explicitly on EVERY helper call
— Sonnet low/medium for mechanical inventories, gate execution and artifact summaries; Haiku for pure
greps/reads/sizing; Opus high/xhigh (or the tier below Sol Ultra) only for reasoning legs. Helpers
produce evidence; the TOP LOOP verifies every packet and owns the architecture, the code, the D74
judgment, the historical claims, the final synthesis and the commit. This is an IMPLEMENTATION
session: build Slice 1, gate it, document it, commit it, push it, release the lane.

STARTUP (expect exactly this).
  git config user.name "Aaron Hanke" && git config user.email "adhanke@gmail.com"
  git fetch origin && git status --short --branch
Expect: worktree CLEAN, branch main, HEAD == origin/main == fb42899
("Ratify D537 decision ledger: ARC 7 to Mayhem, E57 second, ARC 9 complete").
Only if clean: git pull --ff-only origin main. If the worktree is DIRTY: STOP, inspect, stash or
commit deliberately, and never overwrite unreviewed local work. If HEAD != fb42899, reconcile against
origin before starting and say so in your first message. If the worktree looks phantom-dirty at
startup, run `git update-index --refresh` before concluding anything.

READ ORDER (the D412 trimmed mandate; a fresh chat has zero context).
  1. START-HERE.md
  2. COORDINATION.md §1-§4 + §4A, then LANE-022 IN FULL (the acceptance contract you are executing),
     then §6 S-05. Do NOT bulk-read the other lanes. LANE-019 is read-only context — you must not
     edit it (see DO-NOT-TOUCH).
  3. HANDOFF.md top ⚡ block (D537) — the one canonical live boundary.
  4. docs/design/conquest-supply-chain-design.md — the Aaron-ratified design law for this ladder.
     §2 (containment) and §3 (the seam) are binding on this slice.
  5. src/00-manifest.json, then src/61-logistics-rail.js, src/114-conquest-board.js,
     src/115-conquest-transport.js, src/116-conquest-state.js, src/33-morale.js (the supply weight),
     tools/build.mjs, tools/probe-conquest-transport-plan.mjs, tools/probe-conquest-layer-plan.mjs.
  6. DECISIONS.md entry D537 (the 14 ratified rulings), then D526, D528, D530, D532, D521, D523, D525.

OBJECTIVE + TERMINAL CONDITION. Ship LANE-022 Slice 1: replace `_lgRoute`'s static per-battle lookup
with a REAL TRACED PATH over the 36-territory conquest board, for conquest campaigns only, changing
NO outcome. The session is DONE when Slice 1 is focused-gate green, the sim is proven byte-identical,
the containment tooth passes in BOTH directions, the negative bind has redded exactly its own tooth
and restored bytes exactly, docs and ledgers are synced, and the work is committed and pushed with
LANE-022 released to CONTRACT/none. Then, under D514, reload the ledger and either contract Slice 2
in LANE-022 or issue the capacity relay.

WHY THIS SLICE IS SHAPED THIS WAY (do not re-litigate; Aaron ruled it in D537).
Three citation-grade research passes closed at ZERO established physical windows — D528 rail
(0 established / 19 snapshot-only / 7 unresolved / 1 disputed), D530 water+sea (0/11/6/0), D532 roads
(2 cured / 4 unresolved). D526 is why: a service's verbatim `dateText` is source evidence, not a
machine-readable physical window, and the CTS-S-02 / WE-26 Fort Fisher row proves a generic parser
REVERSES the source meaning. Historical movement is therefore blocked by exhausted sources. Mayhem —
public and separately ruled since D420 — carries no such obligation and may author its own content, so
the ladder builds there. Aaron ratified read-only-first explicitly so the trace's correctness proof is
never mixed with a sim-affecting A/B.

THE SEAM — EXACTLY WHAT CHANGES.
`_lgRoute(C, bd)` at src/61-logistics-rail.js:51 today reads `D.routes[bd.id]` / `D.theaters[...]` and
returns a STATIC object {id, label, theater, theaterName, friction, note} over a fixed battle chain.
That is the exact GEA-11 defect ("readout-only theater map and fixed battle chain").
In a CONQUEST campaign it must instead return the same shaped object with `friction` (and label/theater)
derived from a traced path across the board: source depot -> rail / inland-water / road segments ->
the army's territory.
EVERYTHING DOWNSTREAM IS UNTOUCHED. `logisticsSnapshot` (:102), `logisticsBridgeBonus` (:154) and its
caps (supply <= 7, fatigueRelief <= 5, overall <= 2 from `_lgCfg().bridgeCaps`), `logisticsSetPriority`
(:185), `logisticsOnResolve` (:200), `presLogisticsBlock` (:209) and `logisticsWireOverview` (:262)
keep their current behavior and signatures. `wr.supply` keeps its 0.15 morale weight at
src/33-morale.js:95. Camp (src/36-camp.js) and loot (src/37-loot-survival.js) keep the same bounded
lever. The supply->battle channel is therefore ALREADY bounded and ALREADY D74-legal: this slice
creates NO new combat channel.

SLICE 1 ACCEPTANCE INVARIANTS (all must hold; each is a probe tooth).
  A. READ-ONLY OUTCOME. In every non-conquest campaign the traced path is not consulted at all and
     `_lgRoute` returns byte-identical values to HEAD. In a conquest campaign the trace is computed
     and surfaced, but `logisticsBridgeBonus` returns the SAME {supply, fatigueRelief, overall} it
     returns at HEAD for the same state. Slice 1 changes no outcome anywhere.
  B. CONTAINMENT, BOTH DIRECTIONS. One tooth proves an authored Mayhem trace object is reachable
     under the Mayhem ruleset; a second proves the IDENTICAL query under the Historical ruleset
     returns the absent/unavailable result. The boundary fails CLOSED at the ruleset seam — a label
     or a filter is insufficient. A negative bind must red exactly these teeth.
  C. SUBSTRATE IMMUTABILITY. src/115-conquest-transport.js is READ-ONLY forever. The trace may READ
     it; it must never write into it, extend it, or share its namespace with authored content.
  D. NO SECOND OWNER. Extend `presLogisticsBlock` / `logisticsSetPriority` / `logisticsOnResolve`.
     Do NOT create a parallel logistics store, second settings owner, second save owner, second
     resolver, second clock, or new notification bus.
  E. NO HISTORICAL AUTHORITY CREATED. This slice creates no Historical service, road service,
     interchange, physical window, eligibility, capacity, topology or movement authority. D511/D532's
     zero-road-service negative stays exact for Historical; New Orleans-origin, CT-36, the D503
     endpoint quarantine, the Potomac / operation-composition / Sherman-chain negatives, and the
     permanent unassignment of Boonville, Arrow Rock and Glasgow all remain binding. CTI-01..CTI-04
     stay INTERCHANGE_WINDOW_UNADJUDICATED for Historical.
  F. SAVE SHAPE. If Slice 1 adds any field to `C.conquest`, legacy-save byte identity is the GATING
     tooth (the GEA-12 / D447 precedent). Prefer adding nothing: a pure derivation needs no state.
  G. D74. No write to men, morale, casualties, captured, victory, score, or RNG state from any new
     code path. The build's no-fudge OUTPUT WALL must stay green without being relaxed.

EXPECTED STATE TRANSITIONS.
  LANE-022: CONTRACT/none -> DRIVE/<your tool> (committed ledger edit, BEFORE any runtime edit) ->
  VERIFY -> SHIPPED-slice, then released back to CONTRACT/none for Slice 2.
  Product head: D525 -> your slice's D### once Slice 1 ships.
  V1-CHECKLIST: the LANE-022 line gains a checked Slice 1 sub-item.

TARGET FILES / SEAMS (the allowlist — nothing else may change).
  src/61-logistics-rail.js            — the `_lgRoute` seam and any new pure trace helpers
  src/00-manifest.json                — ONLY if you add a module (prefer not to; 112 modules today,
                                        116-conquest-state.js last)
  tools/probe-conquest-supply.mjs     — NEW focused probe (name it exactly this)
  tools/probe-conquest-supply-plan.mjs— NEW filesystem-first plan probe (contract/law/boundary tokens)
  tools/vet-no-regression.mjs         — suite enrollment for the new probes (140 rows today)
  COORDINATION.md (LANE-022 only) · DECISIONS.md · RUN-LOG.md · HANDOFF.md · V1-CHECKLIST.md ·
  START-HERE.md · WAKE-UP.md · AUTONOMOUS-RUN.md · REVIEW-QUEUE.md · legacy/HANDOFF-ARCHIVE.md ·
  docs/design/conquest-supply-chain-design.md (build-status note only)
  civil_war_generals.html             — GENERATED ONLY, by `node tools/build.mjs`. Never hand-edited.

DO-NOT-TOUCH (hard bars).
  build/base.html (FROZEN; md5 c9db83fa99230ffb95bdfdfe059f3fb9)
  src/115-conquest-transport.js (immutable read-only substrate)
  src/114-conquest-board.js and src/116-conquest-state.js (unless the contract you write for a LATER
    slice authorizes it; Slice 1 reads them, never writes them)
  data/*.json (65 files — Slice 1 needs no data change; if you believe it does, HALT and say why)
  COORDINATION.md LANE-019 — DELIBERATELY UNTOUCHED. tools/probe-conquest-transport-plan.mjs pins its
    segment tooth-for-tooth (D505/D506/D521-D525/D527-D530 tokens, the "roads remain absent" and
    "no endpoint-pair projection, topology, adjacency, path" sentences, and the exact 15+2 WE-* array).
    Rewriting it WILL red the transport plan. If you think LANE-019 must change, HALT.
  The suite-excluded D528/D530/D532 research guards (probe-conquest-rail-window-research.mjs,
    -water-window-research.mjs, -road-gap-research.mjs) — point-in-time proofs pinned to their own
    heads. NEVER rerun or edit them.
  tools/probe-desk-pacing-plan.mjs — pre-existing red at 6/9 at this head, NOT suite-enrolled; a
    point-in-time LANE-020 DRIVE-era contract probe superseded by that lane's own D519 release. Leave
    it alone; it is not your gate and it is not a regression you caused.

BASELINE PINS AT fb42899 (read these back before and after).
  generated game md5 859637edd920e386dd9008d5dfc647bb   frozen base md5 c9db83fa99230ffb95bdfdfe059f3fb9
  manifest modules 112, last = 116-conquest-state.js    data files 65    suite rows 140
  plan probes: Mayhem 13/13 · War Career 24/24 · transport 12/12 · conquest 8/8 · doc coherence 5/5
  If your slice moves the generated game (it will — you are editing src/61), you MUST re-pin the game
  hash with chained D### comments at every site that pins it, and grep the OLD value across tools/
  before pushing (the pin-bump idiom found ELEVEN whole-registry sites at D391 — grep, do not assume).

ORDER OF WORK.
  Phase 0 — TAKE THE LOCK. Commit a ledger-only edit setting LANE-022 Owning tool = <your tool> and
    State = DRIVE, and write the Slice 1 acceptance contract into the lane in full (criteria + probe
    design + resume pointer) BEFORE any runtime edit. This is the Contract Relay's hard rule: red
    teeth never land in git; the lane carries the committed contract and the teeth ship in the same
    commit as the fix that greens them.
  Phase 1 — BUILD. Implement the traced `_lgRoute` for conquest campaigns plus the containment seam.
    Bare-name globals (G / GAME_DATA / __FIELD / FLD — never window.*). No literal comment-closer
    inside a block comment. Do not name any scanned token in a comment (the D484 comment-token scan
    class bit five times).
  Phase 2 — TEETH. Author the two new probes. Author every tooth on DURABLE law/history anchors, never
    on the current lock holder — a future lane release must not red them (the D391/lane-transfer
    lesson). Enroll both in tools/vet-no-regression.mjs.
  Phase 3 — GATES (below). Phase 4 — NEGATIVE BIND (below). Phase 5 — DOCS + COMMIT + PUSH + RELEASE.

GATE SEQUENCE — run each, capture the REAL exit code (use ${PIPESTATUS[0]}; NEVER `cmd | tail; $?`),
and READ the artifact rather than trusting the exit code alone.
  export TMPDIR="$PWD/.tmp"
  node --check src/61-logistics-rail.js && node --check tools/probe-conquest-supply.mjs && \
    node --check tools/probe-conquest-supply-plan.mjs
      EXPECT: silent, exit 0 on each.
  node tools/build.mjs
      EXPECT stdout containing exactly:
      "GATE OK · doc-coherence ✓ · parse ✓ · hex ✓ · collision ✓ · no-fudge ✓ · citations ✓ ·
       women-in-war ✓ · save-shape ✓", exit 0.
      Run the session's FIRST build SOLO with a long timeout — cold start can stall past 2 minutes on
      the 8 GB Mac. If it appears to hang, wait; do not kill and retry in parallel.
  ARTIFACT READBACK: grep the generated civil_war_generals.html for the new trace symbols and confirm
      they appear in the 61 module's region; record the new game md5 and the old one.
  node tools/probe-conquest-supply.mjs        EXPECT: N/N steps ok, 0 fail, exit 0.
  node tools/probe-conquest-supply-plan.mjs   EXPECT: N/N steps ok, 0 fail, exit 0.
  ADJACENT PROBES (all must stay green): probe-logistics (15/15) · probe-bridge · probe-conditioning
      (9 steps) · probe-conquest-board (13/13) · probe-campaign-link · probe-full-campaign ·
      probe-auto-resolve · probe-save-slots · probe-command.
  PLAN PROBES (they grep COORDINATION lanes — a lane rewrite MUST rerun them green before push):
      node tools/probe-open-history-mayhem-plan.mjs   EXPECT 13/13, exit 0
      node tools/probe-war-career-loop-plan.mjs       EXPECT 24/24, exit 0
      node tools/probe-conquest-transport-plan.mjs    EXPECT 12/12, exit 0
      node tools/probe-conquest-layer-plan.mjs        EXPECT  8/8, exit 0
      node tools/probe-doc-coherence.mjs              EXPECT  5/5, "ALL OK", exit 0
  JSON READBACK: for every browser probe, open tools/shots/<probe>.json and confirm ok:true,
      failed:[] , pageerrors:[] , realErrors:[]. CHECK ARTIFACT FRESHNESS (mtime + a content marker)
      — after an exit-1 with empty stdout, a STALE green artifact will mislead you.
  git diff --check     EXPECT: no output, exit 0.
  Run probes FOREGROUND with 2>/dev/null and ONE shared `python3 -m http.server 8765` if a probe needs
  a server. Nothing else runs on the machine during a probe batch (S-03 item 5). Serialize.

BYTE-IDENTITY A/B — THE LOAD-BEARING PROOF FOR THIS SLICE.
  Leg 1 (conquest OFF): run the standing direction battery / sweep on a NON-conquest campaign at your
    build and at fb42899. EXPECT byte-identical results, 0 diffs. Log both columns.
  Leg 2 (fresh campaign): fresh-start byte identity — a fresh campaign must field a byte-identical
    enemy and produce byte-identical outcomes vs fb42899. EXPECT 0/N diffs. Log both columns.
  If EITHER leg moves by a single byte, you have created an outcome channel. HALT — do not tune
  toward zero, do not weaken a tooth. Report the exact diverging row.

NEGATIVE BIND (mandatory; exactly one declared bind).
  Declare the bind BEFORE running it. Mutate ONE value in the containment seam so the Historical side
  would leak an authored Mayhem object. Run the focused probe WITHOUT rebuilding. EXPECT: ONLY the
  declared containment tooth reds, exit 1, and NO other tooth moves. Then restore the file
  BYTE-IDENTICALLY (prove it: md5 pre == md5 post, print both), rebuild, and rerun to clean green.
  A bind that reds more than its declared scope means the tooth is too broad — reshape it and rerun.

HALT CRITERIA — stop, write the state, surface, do not push.
  · Either A/B leg shows a nonzero diff.
  · The bind reds more or fewer teeth than declared, or the restore is not byte-identical.
  · Any gate is red and the root cause would require weakening a probe.
  · You conclude LANE-019, build/base.html, src/115, or a suite-excluded research guard must change.
  · The trace would need to invent a Historical service, window, road, interchange or endpoint, or
    would need to parse a service's qualitative `dateText` into a machine-readable window (D526 bars
    this absolutely — the Fort Fisher row proves a generic parser reverses the source meaning).
  · A source/design contradiction between this prompt and live disk: TRUST DISK, say so explicitly,
    and stop rather than guessing (D537 floor item 11 — a session seed is not authority).
  · Anything irreversible, paid, account- or licence-bound.

DOCS + LEDGER SYNC (same commit as the code that greens the teeth).
  DECISIONS.md — a new D### entry at the TOP: verdict slug, what shipped, the seam, both A/B legs with
    BOTH columns logged, the bind red/restore with md5s, every gate with its real result, reversibility.
  COORDINATION.md — LANE-022 records the delivery and RELEASES to CONTRACT / none (or contracts Slice 2).
  V1-CHECKLIST.md — check the Slice 1 sub-item under the LANE-022 line.
  REVIEW-QUEUE.md — only if your slice touches a ledger id.
  HANDOFF.md — new first ⚡ amendment; the OLDEST of the three then moves BYTE-VERBATIM into
    legacy/HANDOFF-ARCHIVE.md under a `<!-- D### SUPERSEDED HANDOFF HEAD D### (BYTE-VERBATIM):BEGIN -->`
    / `:END` marker pair, newest at top. HANDOFF must end with EXACTLY TWO amendment blocks.
  LIVE-HEAD MIRRORS — the delimited live-summary block must be BYTE-IDENTICAL across HANDOFF.md,
    START-HERE.md, WAKE-UP.md, AUTONOMOUS-RUN.md, V1-CHECKLIST.md and RUN-LOG.md. Stamp it
    programmatically, then verify with md5 per file. The marker line form is exact:
    `<!-- LIVE-HEAD decision=D### next-lane=LANE-0## state=<STATE> owner=<owner> -->`, its decision
    must equal BOTH the first HANDOFF amendment and the first DECISIONS heading, and the named lane's
    FIRST declared State and Owning tool must match the marker. probe-doc-coherence enforces all of it.
  RUN-LOG.md — a dated entry at the top of the current month.

COMMIT + PUSH + RELEASE.
  git add -A, then commit. If the message contains { } $() ` or ~, use `git commit -F <file>` with a
  heredoc message file (bash brace-expands an inline -m message); create the heredoc as its OWN
  command, never inside an && chain. End the message with:
    Co-Authored-By: <your model> <noreply@anthropic.com>
  git push origin main. Then `git fetch origin && git status --short --branch` and prove
  HEAD == origin/main with a clean worktree. NEVER push red, regressed, or pageerror-carrying work.

FINAL REPORT CONTRACT — report all of it, honestly.
  1. Files changed, with the seam described in one sentence.
  2. Every command run with its REAL pass/fail and exit code.
  3. Both A/B legs with BOTH columns printed, and the diff count for each.
  4. The bind: which tooth redded, its exit code, and the pre/post md5s proving byte-identical restore.
  5. Every probe count (focused, adjacent, all four plan probes, doc coherence) and every artifact you
     actually READ, with ok/failed/pageerrors/realErrors.
  6. Old and new generated-game md5, plus every pin site you re-anchored and the grep proving no stale
     value survives in tools/.
  7. HEAD/origin parity and the pushed SHA.
  8. Unverified areas, residual risks, and anything you deliberately did not do.
  9. LANE-022's ending state and the exact next action.
  Do not claim completion for anything you did not run and inspect.

BANNED PHRASES: "as discussed", "per the plan", "run the gates in the spec", "follow the earlier
prompt". Every instruction you need is in this packet. If something is genuinely absent, HALT and ask
rather than inferring it.

THE RATIFIED BUILD ORDER AFTER THIS SLICE (Aaron, D537 — your authority for what comes next):
  LANE-022 slices 2-7 (receipts/cuts -> repair + Engineering Corps capacity -> blockade/sea edge ->
  the authored Mayhem road layer seeded on RD-SI06/RD-SI13 -> legal-order AI -> the 140-row release
  checkpoint) -> E57 phase-clock audit -> E46 re-attempt -> R-7/E33 -> E61 war-weariness terminal ->
  ARC 8 soldier POV in battle receipts -> D460 Leetown -> the NEAR-tier directives. E54 is parked on a
  new trigger. ARC 9 is COMPLETE. Historical transport movement, Historical roads and the four CTI
  interchange faces stay blocked/quarantined permanently on the Historical side.
```
