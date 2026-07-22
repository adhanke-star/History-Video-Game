# RUN-LOG — 2026-06-14 onward (run k+ — the STRATEGIC ARC S2 through current v1 build)

<!-- LIVE-HEAD-SUMMARY:BEGIN -->
<!-- LIVE-HEAD decision=D518 next-lane=LANE-020 state=DRIVE owner=ChatGPT/Codex -->
> **Live status (D518, 2026-07-22):** ARC 9 Slice 4 ships at most three strict session-bookmark metadata pointers over the existing named-slot authority. Focused proof is 31/31, every stale, foreign, corrupt, Ironman, and malformed path fails before apply, and LANE-020 remains DRIVE only for its contracted Slice-5 blocker release.
>
> **Boundary:** Slice 5 has no authorized runtime owner at this head: production exposes no independent sequential strategic-turn entrypoint before the next real battle. Exact next is the standalone blocker-only relay commit that moves LANE-020 to `CONTRACT` / `none`, leaves Slice 5 unchecked and unenrolled, and then advances ARC 7 under D514.
>
> **Authority:** `HANDOFF.md`'s first ⚡ block owns D518's evidence and blocker boundary; D514's work-conserving completion loop remains binding. `V1-CHECKLIST.md` is the ledger and `COORDINATION.md` owns the release dependency.
<!-- LIVE-HEAD-SUMMARY:END -->

**Context:** Continues the §8 overnight charter (battle layer A1–A6 shipped in run j). S2 is large, so it's built one sub-system per gated + empirically-probed + adversarially-bug-hunted + committed + pushed milestone. Per the owner's directive, **web-search/fetch grounding is folded into the content-research workflows** (real public sources, then adversarially verified). Ultracode on.

**Chronology rule (D510):** older `next` and `exact next` sentences record only the boundary at that entry. They never override the marked summary, HANDOFF, V1-CHECKLIST, or the relevant COORDINATION lane.

## 2026-07-22 — D518: ARC 9 SLICE 4 STRICT SESSION BOOKMARKS SHIPPED

The existing named-slot owner now stores at most three strict six-field bookmark pointers
in `G.settings.arc9SessionBookmarks`: cleaned label, slot, string run id, side, ruleset,
and deterministic target fingerprint. No snapshot or storage key was added. Canonical JSON
sorts object keys, preserves arrays/scalars, excludes only own top-level `slotName`/`when`,
and uses the exact UTF-16-length plus dual `arc9-a|`/`arc9-b|` FNV-1a form. Creation/open
require the current run, side, ruleset, non-Ironman target, strict metadata, and a current
fingerprint; malformed bookmark settings inside the target also fail closed.

Ordinary and bookmark loads now share one atomic path. It reads and guards before the
existing replace-live prompt, then re-reads and re-guards before clone/validate/apply. A
slot deleted during confirmation, or any missing/changed/foreign/corrupt/malformed target,
produces zero apply/save/undo/partial mutation. The Save & Load manager adds native
Bookmark/Update/Open/Remove controls and status feedback. The WCAG audit corrected visible-
label-first accessible names and long-label wrapping; focus, contrast, keyboard parity,
200%-zoom reflow, and reduced motion pass.

An independent adversarial audit caught malformed target metadata, coercive numeric run ids,
an underlocked fingerprint formula, and an unproved post-confirmation reread. All four were
fixed before final evidence. Focused proof is 31/31 with fresh clean artifacts; Bind S4 is
the exact 30/31 expected red with only the changed-authority tooth. Restored source/game
SHA-256 is `8af9f69d…ba193` / `858ce484…a47a7`, MD5 `dec6e466` / `2249daa3`.
Adjacent save-slot, H0 menu, accessibility, play-style, and War Career gates are green
17/17, 5/5, 27/27, 14/14, and 47/47; plans are green 9/9, 13/13, and 24/24. Mechanical pins
move game `de2770b2`→`2249daa3` and source tree `6a385aa2`→`6950a862`; protected counts and
suite exclusion hold. LANE-020 remains DRIVE only for the standalone Slice-5 blocker release,
after which D514 advances ARC 7.

## 2026-07-22 — D517: ARC 9 SLICE 3 SAFE ONE-CLICK DESK RETURN SHIPPED

The live Desk now validates one optional `G.settings.arc9DeskTab` against its own
twenty-id `H0_DESK_TABS` registry. A changed valid tab persists only through existing
`saveLocal`; unchanged, absent, invalid, or removed values produce no write. The existing
main-menu and between-battle Desk controls now land directly on that safe remembered tab,
reducing both measured return paths from two clicks to one. Old saves retain the current
play-style default.

Pre-onboarded A/B proof preserves campaign/save authority and storage-owner identity.
No entity, pending action, focus node, campaign mutation, repair write, second key,
alternate registry, or save-version change exists. Pointer, Enter, and Space each save
and refresh once with matching target, focus, and pressed state. The WCAG audit found no
defect. Inspected normal and 200%-zoom PNGs show a stable Desk, wrapped tabs, zero horizontal
overflow, retained focus, and no reduced-motion dependency.

Focused proof is 21/21 with clean JSON and zero failed/page/real errors. The first post-fix
bind exposed an expected-red fixture cleanup leak; moving its sheet cleanup into `finally`
removed a collateral native-click timeout. Bind S3 then bypassed only the live-registry
predicate and isolated the invalid-preference tooth at 20/21 expected
red, then source/generated bytes restore exactly at SHA-256 `dcb3b734…b85295` /
`a0d1af09…fce139` before the clean rerun. Adjacent H0 Desk, between-battle, play-style,
accessibility, and save-slot gates are green 3/3, 3/3, 14/14, 27/27, and 17/17. H0 main
menu first exposed one parent-identical baseline red: D517 and untouched D516 `a0e4579`
both failed only `chainVisibleFirstViewport` at exact geometry 904/825. Diagnosis traced it
to injected Command Utilities cards outgrowing the desktop sheet. The amended narrow fix
caps only that desktop column at 520 pixels; a new tooth proves natural-Tab reachability in
the inner scroller while the original fold tooth remains unchanged. Fresh H0 main-menu proof
is green 5/5, pageerrors 0, with 636/520 content geometry, inner scrollTop 116, outer sheet
scrollTop 0, and an inspected rail fully above the fold. A second WCAG audit found no
violation or edit, and the fresh accessibility gate remains green 27/27.

Mechanical MD5 pins move game `593d03fe`→`de2770b2` and source tree
`899a4408`→`6a385aa2`; protected counts and suite exclusion hold. LANE-020 remains DRIVE;
exact next is Slice 4's at-most-three strict bookmark pointers over existing named slots,
growing the focused contract 21→31.

## 2026-07-22 — D516: ARC 9 SLICE 2 PURE LIVE NEXT ACTION SHIPPED

The existing Chief brief now derives at most one action from its existing ordered facts.
Only a structurally valid, uniquely highest-severity line qualifies; ties, missing facts,
and malformed candidates remain neutral. The private H0 tab registry was not copied.
Facts render inert, then the mounted `#wdTabs` row must prove the target native button
before one top fact is upgraded. Lower facts stay plain, and valid activation uses only
the existing `_wdTab/_wdRefresh` route.

No campaign, save, settings, storage, decision, resource, time, queue, hidden state, RNG,
receipt, domain renderer, or focus authority was added. The proactive WCAG audit fixed the
accessible-name order so it begins with the visible label/fact; focus/contrast/semantics
otherwise passed. The inspected 1366×850 PNG shows one clear focused action above two
plain facts without overlap or clipping.

Focused proof is 14/14 with clean JSON and zero failed/page/real errors. The stale tooth
now proves both an initially absent target and post-wiring removal: the latter demotes the
button to a plain fact and creates no forced replacement focus. Bind S2 weakens only
live-tab validation and isolates that stale-target tooth at 13/14 expected red. The
bind also hardened the probe: failing fixtures now clean in `finally`, and browser teardown
uses the established bounded-close pattern. Source/generated bytes restore exactly at
SHA-256 `352a3266…32b38` / `60452153…a507f`; the clean 14/14 rerun and build `GATE OK` pass.
Adjacent Chief, Desk, H0 Desk, and accessibility gates are green 10/10, 13/13, 3/3,
and 27/27 with fresh clean artifacts. Mechanical MD5 pins move game `09cc00e6`→`593d03fe` and source tree
`f6d83f59`→`899a4408`; protected counts and suite exclusion hold. LANE-020 remains DRIVE;
exact next is Slice 3's one-click return plus one validated settings preference in
`src/99-h0-president-desk.js`, growing the focused contract 14→21.

## 2026-07-22 — D515: ARC 9 SLICE 1 MEASURED STATUS SHIPPED

The untouched `dc16547` resolver baseline ran 60 fresh-campaign and 36 sequential
samples. Fresh p95 was 25.2 ms; sequential p95 was 15.4 ms. Both were below the 50 ms
long-work threshold and no isolated outlier repeated, so optimization closed as
`NOT_NEEDED` rather than earning speculative churn.

The sole `_t1Resolve` owner now records five monotonic, ephemeral timing groups around
the unchanged 30-hook order. A copy-safe reader exposes only the latest completed run;
unsupported/invalid clocks and new runs clear stale status. Enabled/disabled A/B paths
preserve campaign, settings, receipts, save bytes, `RND`, and `Math.random` tails. No
campaign, save, settings, receipt, RNG, schema, queue, resolver, module, manifest, or
release-suite authority was added.

The live H0 Desk renders one measured completion status only at or above 50 ms, below
the header and outside tab content. Short and invalid work remains silent. The final
semantic surface uses native `role=status` with atomic text, no duplicate live-region
label, percentage, animation, or focus move. The proactive WCAG audit caught and removed
the redundant label/live attribute; the 1366×850 screenshot was visually inspected with
clean reflow, contrast, focus, and non-color meaning.

Focused proof is 8/8 with clean JSON and zero failed/page/real errors. Bind S1 removed
one group mark and isolated only the five-group phase-order tooth at 2/3, then `cmp` and
SHA-256 proved source/generated restoration before a fresh 8/8 rerun. Planning, Mayhem,
and War Career gates pass 9/9, 13/13, and 24/24; adjacent Desk, H0 Desk, accessibility,
decisions, full-campaign, and campaign-link gates pass 13/13, 3/3, 27/27, 19/19, 4/4,
and 19/19 with fresh `ok:true` artifacts and no failed/page-error rows. The normal build
is `GATE OK`. Exact next
is Slice 2's pure Chief-of-Staff action, growing the focused probe 8→14 under the retained
LANE-020 DRIVE lock.

## 2026-07-22 — D514: WORK-CONSERVING COMPLETION LOOP AUTHORIZED

Aaron authorized autonomous completion of every remaining feature and issue. D514 supersedes
the D171/D307 2–4-slice stop cadence while retaining per-slice contracts, focused gates, artifact
readback, docs, commit, push, and clean parity. Healthy sessions now continue across milestone,
phase, browser, full-suite, and reversible design boundaries. A blocked item is recorded and
quarantined while independent work continues; only the terminal/hard-stop rules or capacity end
a run.

V1 is now the complete ledger, including formerly parked and deferred items; unresolved REVIEW
findings and open lanes remain inputs. LANE-020 contracts the five ARC 9 pacing slices as the first
build lane after D513's owed clean-pushed War Career rerun. D514 also resolves the ARC 7 global
blocker source-honestly: Verified rail/water/bounded-sea conquest may proceed under new slice
contracts while unsupported roads remain unavailable and every D511 classification/non-link holds.

The full-access D514 continuation discharged D513's owed browser proof from clean `6ca0fba`:
War Career passed 47/47 browser steps plus static 30/30 with `ok:true`, zero failed/page/real
errors, and a fresh decodable 390×700 PNG showing the report at 200% zoom without horizontal
overflow. LANE-020 then moved from CONTRACT/unowned to ChatGPT/Codex DRIVE in the standalone
routing transfer; runtime remains untouched pending the filesystem-first ARC 9 plan boundary.

Post-routing inventory found four existing owners rather than a missing architecture: `src/90`
for the ordered resolver, `src/99` for the live Desk, `src/109` for the pure Chief brief, and
`src/91` for named saves. The executable contract allowlists Slices 1-4 to those owners and
forbids a new module/store/queue/clock/resolver. It also records Slice 5's dependency honestly:
at this head every production `_t1Resolve` follows a real battle result through
`campaignAdvance`; batching now would require fabricated result data or hidden delegated combat.
ARC 7 must supply a separately gated standalone strategic-turn owner before the batch slice can
exist. The post-Slice-4 blocker boundary releases LANE-020 to `CONTRACT`/unowned—without a
SHIPPED claim, suite enrollment, or release battery—before the D514 loop takes ARC 7 under its
own lane. The exact Slice-3 proof also accounts for the existing Desk opener's idempotent
onboarding write, and the Slice-4 pointer now pins a canonical two-pass `hashStr` fingerprint
whose only exclusions are top-level display `slotName` and `when`.

## 2026-07-22 — D513: PURE WAR CAREER CARE CONTEXT SHIPPED

ChatGPT/Codex implemented D512 Future Slice 1 under the standalone LANE-005 take
`13fe2d9ab66a622054db1da9399b10cfe1125b45`. The existing War Career report now derives
one optional semantic care-context subsection from the newest uniquely matched and
independently revalidated current-person wounded event/credit pair. Invalid newer rows
do not mask an older valid pair; ambiguity, foreign/stale authority, pair or
participation mismatch, wrong person/fate, and malformed identity/service data fail
closed. With no qualifying authority, the old report remains byte-identical.

`Your Timeline` says only that this playthrough classified the selected person as
wounded. A separate generic `Historical context` paragraph requires US, 1862+, exact
canonical Army of the Potomac membership, and the unique Verified/two-distinct-source
`letterman-system` row; it discloses sources and explicitly says the context proves no
personal aid, ambulance, hospital, transfer, or treatment path. CS, pre-1862, and
non-AOP cases receive personal-only text. No state, persistence, medical mechanic,
diagnosis, named case, relationship, score, promotion, economy, combat, AI, or D74 path
moved.

The focused source table moved exactly 45→46 browser rows, static stayed 30/30, and the
harness passed 47/47 with fresh clean JSON. The D512 payload proves 4 personal cases,
1 historical case, 10 receipt rejects, 3 registry rejects, 8 data suppressions,
newest-valid selection, escaping, determinism, save identity, relationship identity,
and semantics. Adjacent After Action, disease-medical, and Command probes passed 19/19,
8/8, and 100/100. Bind A weakened pair participation equality and isolated only
`mismatched participation copies fabricated care context`; Bind B weakened the AOP
guard and isolated only `non-AOP Union did not render personal-only context`. Each was
46/47, each restored source/generated bytes at the recorded SHA-256 digests, and the
fresh focused rerun returned 47/47.

Syntax checks, normal build, the 24/24 plan, both importers (42/42/0 and 11/9/2), and
diff checks passed. Protected data/manifest/suite/base/save objects remained exact.
Aaron explicitly authorized the sole cross-plan exception: Mayhem-plan `PIN.game`
`d278c30f`→`4c775fd1` plus its adjacent D513 history comment, restoring 13/13 without
changing logic, another pin/count, Mayhem authority, runtime/data, or public readiness.
The final scope is exactly the 14 paths enumerated in the D513 HANDOFF amendment.
The source tree moved only for source 106, `6c7abffee1be95c41edbb52d292852df6b0651ac`→
`0bd64a21f359b78dbc6063e85e4b11cedb8e4546`; generated HTML moved only through the
build, `6f8558dd8afec6fab5ac87885ff714ce9559f091`→
`d6402c0c2fe1f78ebdd2c4b928ac61532fb54f53`. D511 was archived byte-verbatim at
SHA-256 `9010dd929168aee787bcdb573df9be49550dd7be35ec8871ac004ee5b25373eb`.
LANE-005 releases to CONTRACT/unowned. No deeper medicine or blocked road work starts
automatically; the next session must select and separately take an approved bounded lane.

## 2026-07-22 — LANE-005 DRIVE TAKE FOR D512 CARE CONTEXT

ChatGPT/Codex took LANE-005 DRIVE from clean D512 at `f255cc4fdbb09ccbc5a7e69ace1a0c74b373f5ed` for the contracted read-only War Career care-context slice. This standalone transfer changes only the seven routing documents; runtime, data, probes, generated output, law, save shape, and LANE-019 remain untouched. Implementation begins only after this transfer is committed, pushed, fetched, and confirmed clean with `HEAD == origin/main`.

## 2026-07-22 — D512: ARC 8 CARE-CONTEXT LAW CONTRACTED WITHOUT IMPLEMENTATION

The standalone LANE-005 DRIVE transfer shipped first at `d59cd351`. The architectural-
overlap check then selected existing §4f, existing LANE-005, and the existing pure
`warCareerReportHTML` After Action section; no ARC 8 plan, LANE-020, state owner, or UI
was created. D169, Human Cost, primary sources, canonical people, Women in War, D407,
LANE-002, and War Career retain their existing boundaries.

Future Slice 1 is read-only and nonpersistent. It admits only the newest byte-matching,
independently revalidated qualifying current-person wounded event/credit pair. The
personal sentence is `Your Timeline`. Separately labeled historical context may read
the existing Verified/two-source Letterman row only for a US Army of the Potomac receipt
dated 1862 or later, and must say that generic context proves no personal care path.
Missing identity, service, participation, pair, wound, source, or consumer authority
suppresses the new subsection and leaves the existing report intact.

The future allowlist is source 106, the focused War Career probe, mechanical War Career
plan-pin transitions, generated HTML through the build, and closeout docs. The focused
target is one new table-driven browser row (45→46), static 30/30, plan 24/24, with two
byte-restored binds for exact receipt equality and source admission. Personal medical
mechanics, treatment, probabilities, economy/capacity, recovery state, new UI, named
cases below the claim floor, relationship expansion, and LANE-002 work remain deferred.
LANE-005 releases to CONTRACT/unowned; no implementation byte moves in D512.

Docs release proof is green: both importers are exact at 42/42/0 and 11/9/2;
coherence 5/5; build `GATE OK` at 65 data, 36/36 territories, and transport
27/15/2/4/18; plans 13/13, 24/24, and 8/8; all fresh artifacts clean. D510's source
and archive bytes match at SHA-256 `96974613a002efdbb9b3673d738485e58258e33c3bff9a7b99f7f080aa36791a`.
All seven protected objects retain their D511 hashes, the dirty scope is exactly ten
authorized documentation/archive files, and `git diff --check` is clean. No browser
probe or full battery was run or owed.

## 2026-07-21 — D511: FINAL ROAD PASS RETAINS NEEDS_MORE_RESEARCH

The standalone routing transfer shipped first at `be54d4a`. The fourth and final
authorized LANE-019 pass then added six source records and mechanically rechecked the
whole packet. Final registers are 65 sources, 37 nodes, 18 candidates (14 Verified,
4 Inferred, 0 Disputed), six Potomac rows, 13 Sherman intervals (11 Verified,
2 Inferred), 11 non-links, and ten interchanges. All 12 sections, stable IDs, external
transport references, and the single `NEEDS_MORE_RESEARCH` verdict resolve.

RD-E17's missing-wagon-crossing premise was corrected: the teams approached Harpers
Ferry from Winchester on the Virginia-side road, so Breck's personal skiff passage
does not establish or require a team Potomac crossing. Loading-side handling and a
second family remain absent. RD-E18 now ends at unassigned Arrow Rock: the Army atlas
fixes Clark's detached force, crossing order, and Glasgow target, while Cooper County
history fixes the road and a separate 1861 Lamine bridge action; neither corroborates
the 1864 named-road passage. Glasgow is not an endpoint and no water interchange forms.

The Joint Committee starts the Red River column at Franklin/Berwick Bay rather than
New Orleans. Official Records keep the military Natchitoches-Mansfield-Keachi-
Shreveport approach distinct from the exact civilian Marshall-Shreveport road, and
keep CT-36's Galveston operations on railroad/railroad-bridge evidence. Howard's
independent report promotes only RD-SI10; RD-SI06 and RD-SI13 retain one-family
handling limits. The candidate split therefore does not move.

Release proof is green: doc coherence 5/5; build check `GATE OK` at 65 data,
36/36 territories, and transport 27/15/2/4/18; conquest layer 8/8; conquest
transport 11/11; Mayhem plan 13/13; and War Career plan 24/24. All five fresh
artifacts are `ok:true` with no failed/error rows or page/real errors. The D509
HANDOFF source and newest archive region compare byte-for-byte at SHA-256
`7428a5b01720b9895ef0b1fd2199c0fa2d3826593e7e599376306f7bd5538eff`.
All protected objects retain their D510 hashes; `git diff --check` is clean.

LANE-019 releases to CONTRACT/unowned. No road substrate, gameplay, or later ARC 7
rung is authorized to skip the failed prerequisite. The next independent approved
task is a fresh docs-only ARC 8 medicine-to-soldier-depth law adjudication against
D501/D169 and the existing person/narrative owners; it must stop before implementation.

## 2026-07-21 — D510: CANONICAL DOCS RECONCILED; DRIFT NOW FAILS CLOSED

D412 established a sensible policy but no executable enforcement. D468-D509 advanced
HANDOFF, DECISIONS, and the active lane while four routing docs and this log retained
older live heads; HANDOFF also grew to nineteen amendments. The product itself had not
forked: D509 and LANE-019 remained the newest consistent truth.

D510 restores one full boundary in HANDOFF, one byte-identical marked summary across six
routing docs, and one concise V1 task map. Superseded HANDOFF, WAKE-UP, START-HERE,
AUTONOMOUS-RUN, and V1 material is preserved byte-verbatim in the matching archives.
Stale current lane State/Owner fields are corrected without deleting acceptance history.
The old autonomous roadmaps and every historical `NEXT` are explicitly non-actionable.

The new zero-dependency doc-coherence probe checks mirror identity, the top D-number,
HANDOFF's exact two-amendment depth, lane header/first-State agreement, SHIPPED ownership,
and the declared next lane. The build runs it before any deliverable write. The D505/D506
conquest board and transport plans now prove their D503-D506 historical contracts without
freezing later manifest/count/lane state. The Mayhem and War Career plans likewise stop
policing unrelated current worktree files. Runtime, data, gameplay, UI, history claims, assets, save,
manifest, suite, frozen base, and generated deliverable remain outside this docs/tooling
repair.

Release gates passed: coherence 5/5; both declared negative binds failed for the named
reason and restored blob-identically; all 21 fresh plan artifacts were green at 224/224;
all touched tools passed syntax checks; build check and normal build both printed GATE OK.
The generated game remained `6f8558dd8afec6fab5ac87885ff714ce9559f091`; src, data,
manifest, suite, frozen base, and save-shape blobs/trees matched D509 exactly. Seven archived
regions compared byte-for-byte with their originals, and the final diff check was clean.
No browser battery was owed because no runtime or suite surface moved.

## 2026-07-21 — D494: ARC 5 RELEASED — LANE-018 SHIPPED

The 140-row serialized release battery is green at code SHA `fc8ccc2`. D492 root-fixed
the schema validator's missing politics enrollment (63/63); D493 root-fixed Mayhem's two
stale D491 baselines (24/24). The only environmental rerun was Antietam: the harness
timed out at 360 seconds without producing a fresh artifact, so no stale evidence was
credited; its isolated rerun passed 17/17 with zero pageerrors, then the battery resumed
at Gettysburg and completed. War-career passed 46/46 in 612.7s and visual-fidelity
49/49 in 363.7s. The fresh-artifact audit covered 140 JSON files and found `ok:true`,
zero failed steps, and zero pageerrors throughout. Schema 63, suite 140, frozen base,
`_SAVE_VER=1`, `MAYHEM_PUBLIC_READY=true`, and all AD-7 pins held. LANE-018 is SHIPPED;
next work is a fresh ledger charter for T4 brigade flag markers, not implementation.

## 2026-07-21 — D493: LANE-018 BATTERY ROOT-FIX 2 — MAYHEM BASELINE RE-PIN

The restarted battery passed every row through save-slots, then `mayhem mode` stopped
at its one frozen-baseline tooth (23/24): D491 had moved data count 62→63 and the enrolled
additive `applySave` signature `201fa746ea8e8755`→`820f02da7a3e6341`. The tooth now pins
those live D491 values while preserving every other exclusion, base, `_SAVE_VER`, roster,
suite-count, and placement conjunct. Mayhem reran 24/24 and save-slots 17/17 with zero
pageerrors; node check and build GATE OK passed. Exact next: resume the battery at mayhem
mode through row 140, serialized and alone.

## 2026-07-21 — D492: LANE-018 BATTERY ROOT-FIX 1 — POLITICS SCHEMA ENROLLMENT

The ARC 5 battery stopped at `data schemas`: `politics.json` parsed but correctly failed
closed as the only unclassified file (62/63). The validator's closed-world meta map now
requires its `_meta`, `cycles`, and `teaching` owners. The failed row reran 63/63; adjacent
importers passed; node check, build GATE OK, and diff check passed. Runtime/data remain
unchanged; suite 140, `_SAVE_VER=1`, and frozen base `c9db83fa` hold. Exact next: rerun the
complete battery alone; only a full green result may close LANE-018.

## 2026-07-21 — D491: LANE-018 SLICE 3 SHIPPED — THE 1864 ELECTION BIND

Codex 5.6 Sol Ultra took the Aaron-authorized provider transfer at clean `f53f32c` and
shipped the load-bearing politics slice. New `data/politics.json` + `src/74-politics.js`
add the source-stamped, side-gated teaching layer and one bounded press-to-clock interlink
(1864 pre-election weariness ±4; 1862 capital ±1; neutral/absent/wrong-side/window/resolved
exact zero; one-shot). Clock election ownership, D113, combat outputs, and press ownership
remain distinct. Five owners and three adjacents passed with zero pageerrors; both required
binds bit exactly and restored md5-identically. Schema moves 62→63; suite holds 140;
`_SAVE_VER=1`; frozen base holds. LANE-018 is VERIFY/unowned. Exact next: Slice 4 battery.

## 2026-07-20 — D490: LANE-018 SLICE 2 SHIPPED (`f43d1f0`): THE AI-GM PERSONA CHOICE AT SETUP + THE TRANSFER SYMMETRY RIDER

A fresh Fable 5 session resumed the HELD LANE-018 DRIVE at the clean pushed 11b1619
(D489 closeout) boundary and executed the committed slice-2 charter clause verbatim
(the §4 TOP-LOOP resolution stated at the top: Claude Code / Fable 5 xhigh; one
4-agent mechanical recon workflow — Sonnet med ×2 + Haiku ×2, model+effort explicit —
inventoried the picker-DOM teeth, the tenure data, the AD-7 pin sites with their hash
functions, and the preparse gate before any edit; all four packets verified at the top
loop against the live tree). The picker gained the labelled native Enemy-command-persona
select threaded fail-closed through the D486 token chain to `cmdSetAiGmPersona`;
`cmd.aiGmPersona` rides D149 additive; `cmdEnemyShadow` honors Historical (tenure
windows, zero friction) vs Competitive (role sort under `_cmdAiGmFriction` through the
one `_cmdTransferMalus` [0,6] clamp, the chosen cross-theater commander paying the same
malus on leadership); the readout discloses each persona honestly and is byte-identical
at default; the aiGm `_note` stale-blocker sentence was replaced (adjudication 2). A
CHARTER ERRATUM was recorded rather than silently rebuilt (the D489-adjudication-1
class): "Davis keeps Bragg through his documented tenure" is half-stale — cs-bragg
carries `commandFrom: null`; the shipped single-slot chains are the US chain→Grant
(March 1864) and CS Johnston→Lee (June 1862); the teaching copy cites what the data
records, no new sourced claim. Teeth probe-command 94→99 (99/99, 0 pageerrors);
adjacents oob 21/21 · save-slots 16/16 · accessibility 27/27 · mayhem-mode 24/24;
build GATE OK · schema 62/62 · cooked-SETUP preparse via the template-literal VM cook
(lesson: raw extraction false-alarms on template escapes — cook the literal first);
binds A/B bit EXACTLY at their teeth with md5-proven restores (src/35 a69d6249 · game
b2b23ed2), final 99/99; honest A/B: zero values moved at the absent choice. AD-7
re-pins (verbatim-extracted hash functions) game→b2b23ed2 · dataTree→fa4ce39d ·
srcTree→cfa7648d · command→a69d6249 · commandProbe→d861722c; both plan probes re-ran
green POST-COMMIT (24/24 · 13/13). Counts hold 29/62/1,710/140; `_SAVE_VER=1`; frozen
base untouched. Zero environment flakes this session. LANE-018 DRIVE remains HELD
mid-ladder; EXACT NEXT: SLICE 3, the 1864 election bind (the load-bearing slice, the
packet §3/§3.5 verbatim), routed to a fresh session per the D171 phase boundary.

## 2026-07-20 — D489: ARC 5 OPENED — LANE-018 `gm-completion` CHARTERED AT DRIVE (`358bf35`) + SLICE 1 SHIPPED (`32051dd`): THE MUSTER-ROLL DESK SURFACE

A fresh Fable 5 session opened at the clean pushed d8ca128 (D488 closeout) boundary and
ran the ARC 5 GM COMPLETION charter packet (the §4 TOP-LOOP resolution: Claude Code /
Fable 5 xhigh; no helper agents were spawned — the recon was direct targeted reads).
P1 (ledger-only, `358bf35`): LANE-018 authored in COORDINATION.md as the complete
acceptance contract with DRIVE taken in the charter commit — twelve adjudications
(headline recon findings: §4e.4's in-battle half was ALREADY DISCHARGED by T29/D357, so
the chartered half is the strategic-desk surface; the Transfer gap is CONFIRMED
AI-GM-side — `cmdEnemyShadow` is theater-blind while the player pays the D354 friction,
the aiGm `_note` blocker being stale since D322/D323; the election bind is chartered per
the D488 packet §3/§3.5 VERBATIM with the D113 collision tooth owed and NO new lever
class) + the four-slice ladder (muster desk → persona choice + Transfer symmetry → the
election bind → the release battery), each slice with owners and predeclared binds.
P2 (`32051dd`): SLICE 1 shipped — T35 renders the probe-vetted T14 muster panel as a
T29-idiom disclosure on the Command desk OOB board through the T15 player-flagged
guarded seam (the flag at exactly ONE call site; the enemy column renders zero
disclosure at every scout tier; fail-closed on malformed shapes; in-place toggle,
nothing rides the save). Teeth probe-oob 17→21 (21/21, 0 pageerrors); adjacents ratings
31/31 · command 94/94 · accessibility 27/27; binds A/B exact-red with md5-proven
restores; AD-7 re-pins game→7b83d48b · srcTree→3ce634af · manifest→a6699981 at all four
plan-probe sites; BOTH plan probes green post-commit (24/24 · 13/13) after BOTH commits.
Session lessons: one authored-tooth root-fix (the presence tooth's ≥2-button floor met
the 1-brigade Sumter default board — the tooth now walks to a real multi-brigade board,
strengthened); two environment flakes re-run green alone with zero tree changes (a
probe teardown hang AFTER a green artifact — the D398 readback applied; a wedged shared
:8765 http.server stalling page.goto — kill the server, not the probe); one
phantom-dirty episode cleared by `git update-index --refresh` + diff readback; and a
hash-replica trap — a hand-rolled dataTree md5 replica disagreed with the pin until the
probe's functions were extracted VERBATIM (replicate pins only by verbatim extraction,
never by paraphrase). Boundary: clean/pushed at `32051dd`; LANE-018 DRIVE held with
SLICE 2 (persona choice + Transfer symmetry) the exact next; the HANDOFF top ⚡ block's
D489 amendment carries the zero-context packet.

## 2026-07-20 — D488: THE ARC 6 POLITICS/ELECTION RESEARCH PACKET (T2, docs-only) — THE BANKED WORKFLOW ADJUDICATED, READY_FOR_SPEC, ARC 5 GM COMPLETION UNBLOCKED

A fresh Fable 5 session opened at the clean pushed c8d1e9c (D487 closeout) boundary and
ran the Aaron-ratified tail's T2 with NO lane lock (docs-only). P1 adjudication (the
D481/D482 banked-workflow practice): `wf_854e0760-ef2`'s journal was the sole record —
78 verdict rows across six default-refuted topics landed 57 CONFIRMED / 16 WEAK /
0 REFUTED; one gather row the refute layer never processed (the cs-politics
dissent-drivers synthesis) was adjudicated Inferred at the top loop; the two-source floor
was applied STRICTER than the refuters (Wikipedia = relay corroboration only, repo
registers corroborate but never count, the Lincoln Institute's sites = one family); NINE
drops/corrections logged (the Foote 1862→1864 quote weld, the McClellan-newspaper
misattribution, the 13th-Amendment switcher arithmetic, the unsupported six-state
soldier-vote margin attribution, et al.). Top-loop spot re-verification: 9 fetch
attempts, 6 landed (Miller Center · Wikipedia 1862-63 House · NARA 1864 Electoral
College · Wikipedia 1863 CS House · NPS Voting at Cedar Creek · APP National Union
platform), all faithful to the refuters' readings; ONE refuter overclaim caught and
closed (Miller Center never prints 212-21 or the LA/TN exclusion — re-anchored on the
NARA official record); two bot-403/404s logged honestly. P2: the packet authored at
`docs/design/politics-election-research-packet.md` (deliberately OUTSIDE the
probe-pinned battle-build-research/ folder) in the packet idiom — source register with
independence families · the adjudicated 1862/1864 + weariness + emancipation +
soldier-vote + CS-politics scope · the ARC 5 election bind's exact data needs from the
banked repo inventory (C.clock the ONE owner, press.sentiment the missing input via a
src/* post-clkOnResolve interlink byte-identical at neutral, the divergence US/CS
side-gate law, the D113 collision trap + lever template, the data/politics.json minimal
shape, NO new lever class) · D74/anti-Lost-Cause risk notes · ten probe-teeth
recommendations · READY_FOR_SPEC with 8 remaining traps (Dubin/Martis, Benton, Neely,
Mitchell pins et al.). Gates (docs-only tier): git diff --check clean · commit -F ·
push (`526b01f`) · BOTH plan probes re-run POST-COMMIT green (war-career 24/24 ·
mayhem 13/13, ALL OK). Counts hold 29/62/1,710/140; `_SAVE_VER=1`; frozen base
untouched; AD-7 head unmoved. T4 brigade flag markers was assessed and HANDED FORWARD
(the heaviest tail item — a serialized-browser-probe runtime slice is not "real room"
at this boundary; the half-vetted-milestone law controls). NEXT: charter ARC 5 GM
COMPLETION per the D455 ladder (ledger-only charter, DRIVE in the charter commit).

## 2026-07-20 — D486+D487: LANE-017 SLICES 8+9 — SETS/VARIETY/SALVAGE/ECONOMY/SETUP SHIPPED UNSPLIT, THE ARC 4 RELEASE BATTERY GREEN, LANE-017 SHIPPED, ARC 4 CLOSED

A fresh Fable 5 session continued the held DRIVE from the clean pushed d0e4490 (D485
closeout) boundary. P0 (Aaron's popup option (a) adopted): the recon sized every slice-8
sub-feature onto an existing seam — ship UNSPLIT, then the battery this session. **D486**
(594c6bb + the 4890fdb pin follow-up): four possession-derived set collections entering
ONLY via _lootEquippedEffect under the same bridge ±cap (pure, reversible, absent-set
byte-identical; a node set-cap wall enforces vocabulary + magnitudes on disk); nine
Inferred quartermaster/ordnance variety items (22 total; the honest-provenance card
stamp); once-per-turn costed battlefield salvage (CS Arms ×3); the CS captured-arms
VICTORY channel in lootOnResolve with the Union path replay-proven byte-identical;
read-only economy hooks (the sutler price line + requisition reading C.economy.inflation
only, snapshot-equality probed); the ruleset-picker Campaign Kit setup checkbox threading
a normalized token (absent ⇒ off, probed). Teeth loot-survival 28→35 (0 pageerrors);
adjacents save-slots 16/16 · ratings 31/31 · economy 8/8 · mayhem-mode 24/24 ·
accessibility 27/27; binds A (set bonus past the wall → the set-cap tooth EXACTLY) + B
(the setup default flipped at the REAL seam — the wrapper normalization; the first
candidate refused by the fail-closed normalization, logged honestly) md5-proven; the
weights tooth held 2/1/0 UNMOVED; AD-7 re-pins at all four sites, both plan probes green
post-commit. **D487** (fec05a3 root-fix + ece0328 flip): the full 140-row battery
serialized/ALONE across six documented legs — "VET NO-REGRESSION OK", the artifact sweep
168 JSONs all ok/0 pageerrors. ONE real red root-fixed at its exact label: probe-command's
four NaN/undefined render teeth tripped on the literal token INSIDE the D483 flag-card
canvas-PNG base64 payloads (image bytes, not rendered text — a D483-latent false-positive;
probe-command was not in D483's focused gates). The teeth now scrub opaque data-URI
payloads before scanning (precision-strengthened; bite proven both ways), the class swept
to probe-afteraction/divergence/endings, commandProbe re-pinned with its chain. FOUR
slow-Mac flakes re-run green ALONE (t1probe — CONCURRENT research-workflow contention, the
lesson logged: batteries get the machine ALONE even against browser-free helper
workflows · bridge 360s · weather frame-timing · fredericksburg 360s). **LANE-017 SHIPPED
IN FULL (D478-D487) — ARC 4 CLOSED AND FULLY RELEASED.** The T1 stale-docs sweep landed
(2e9e258): Mayhem Slice B/C72/GEA-01/S44 discharge notes (all shipped D419-D423). BANKED:
the ARC 6 politics research workflow wf_854e0760-ef2 (13/13 — six Opus-default-refuted
topics + the election-bind repo data-needs inventory) for next-session adjudication.
Counts 29/62/1,710/140; _SAVE_VER=1; frozen base untouched.

## 2026-07-20 — D485: LANE-017 SLICE 7 — NAMED LEGENDARY ARTIFACTS + MODE-SPLIT DROPS (§4c.1) SHIPPED

A fresh Fable 5 session continued the held DRIVE from the clean pushed d39105b (D484
closeout) boundary. **D485** (a52a5e5): the `artifact` tier ADOPTED into the canonical map
(glyph ❖ · reserved hex · contrast-proven; the D478 one-language wall and contrast teeth
auto-extend) + FOUR Verified named objects, each ≥2 distinct sources with sourced
provenance text and an artifact battle/unit lock: the 28th Virginia battle flag
(gettysburg — Marshall Sherman/1st Minnesota MoH, MNHS custody), the 4th USCT national
colors (newMarketHeights — Fleetwood's citation text), Cleburne's kepi (franklin —
Tennessee State Museum), the Jo Daviess County Grant sword (vicksburg — the 'Hero of the
Mississippi' counterguard tie, the March 1864 presentation stated plainly; slot weapon).
Research per adjudication 10: two workflows (5 Sonnet gathers → 5 Opus default-refuters +
a dedicated second-family hunt), the top loop re-verifying the anchor rows directly. THE
HONEST DROPS: the packet's Henry-rifle example DROPPED — the Franklin combat claim rests
on the single Jacobson family (the trust + encyclopedia relays both cite it; Cox 1897 and
Shellenberger are silent on repeaters AND are one family via verbatim-shared text; the one
independent find is an auction-house ownership provenance, not citation-grade) — the D387
single-scholar-collapse class caught at the item tier; the Cleburne presentation sword
RESHAPED to the death kepi; the Hilton/Veal vignette excluded (single family). Runtime:
src/37 `_lootItemEligible` + the C/B-aware weighted pick — Historical pool-eligibility
ONLY at the provenance battle, malformed ruleset flags fail closed, the D418 kernel the
ONLY mode authority; Mayhem general pool per D416; wrong-battle Historical pools
BYTE-IDENTICAL (the shipped deterministic-drop teeth held UNMOVED; weights 2/1/0 held);
effects ride the existing capped equip path (existing keys at existing magnitudes, probed
structurally); nothing stored, _SAVE_VER=1. Teeth: loot-survival 24→28; adjacents
mayhem-mode 24/24 + ratings 31/31 + save-slots 16/16; binds A (lock conjunct killed → the
lock tooth EXACTLY + the Mayhem twin-conjunct sibling) and B (second source dropped →
gate 4e exit-5 AND the source-floor tooth EXACTLY) md5-proven (src/37 73a817a8 · game
27e73f38). AD-7 game→27e73f38 · dataTree→dcf6da5b · srcTree→b7648a67 · journey→73a817a8
(focused holds); both plan probes green post-commit (24/24 · 13/13). Counts hold
29/62/1,710/140. MAYHEM_PUBLIC_READY untouched (the packet's 'stays false' phrasing was a
stale D418-era carry; the operative 'this lane never flips it' honored). LANE-017 stays
DRIVE mid-ladder; slice 8 (sets/variety §4c.2+§4c.5) is exact next; slice 9 (the ARC 4
release battery) alone flips the lane SHIPPED.

## 2026-07-20 — D484: LANE-017 SLICE 6 — SOLDIER-TIER BADGES (§4d.3) SHIPPED — §4d COMPLETE

A fresh Fable 5 session continued the held DRIVE from the clean pushed 850d533 (D483)
boundary. **D484** (4f2eec4 + the 9099a3a follow-up): the soldier-tier badge layer — 14
soldierBadgeDefs (8 historical + 6 career) + 48 soldierBadges rows on 39 of the 42 Verified
replacement records, every row ≥2 named sources verified against the record's OWN in-repo
source trail (the research substrate was the D152/D421 register itself — read and
adjudicated directly by the top loop; drops logged: Sherman/Howard/Griffin single-source,
Webb's MoH → command_at_the_crisis, Beaty's same-institution CMOHS caveat; the MoH cluster
is US-only = the record's asymmetry; memorial rows both sides; no soldier-tier flaw row —
none sourced). Runtime: the fldSoldierBadgeFactor capped gateway at the SAME badgeLever
wall as fldBadgeFactor (exact-clamp probed at 1.10; NO combat line consumes the keys — sim
inputs did not move); cwCareerBadges PURE-derived from the journey career log (nothing
stored, _SAVE_VER=1, D149 shape untouched); the §10 solid/hatched distinction in the
register detail + journey panel (SOLID requires row AND carrier Verified). Teeth:
loot-survival 20→24 · war-career 45→46 (suite 140/140) · adjacents ratings 31/31 +
save-slots 16/16; binds A/B bit EXACTLY their teeth, restores md5-proven (src/37 9655bfff ·
game e99e6ac5). TWO rides: the D478 one-language wall caught the D483 src/22 COMMENT
carrying all four reserved tier hexes (the comment-token class, FIFTH instance — reworded,
scan untouched), and the plan probe's focused step-count structural tooth re-pinned 44→45
with its chain after biting exactly at the post-commit re-run. AD-7 game→e99e6ac5 ·
dataTree→c3c28fd6 · srcTree→d79696ce · journey→9655bfff · focused→e2acf99a; both plan
probes green post-commit. Counts hold 29/62/1,710/140. LANE-017 stays DRIVE mid-ladder;
slice 7 (named legendary artifacts §4c.1) is exact next; slices 8-9 remain.

## 2026-07-20 — D481-D483: THE INTERRUPTED MEGA-LADDER RESUMED — §4d.2 COMPLETE (all 29 battles badged, citation-grade) · R-7 SHIPPED · THE P-END BATTERY GREEN · the Aaron-directed flag-card portrait default

A fresh Fable 5 session resumed the cut-off leg-2 ladder from the clean pushed 6518764
boundary (Aaron's VSCode-workspace backup audit opened the session: 217 commits verified
integrated + pushed, zero loss). **D481** (30e181c): the eastern coverage sweep (rosterBadges
9→19, +26 rows) + the per-row citation law made data (rosterBadgeProv, card provenance line)
+ R-7 situational trigger gating (engine-observable predicates, the absent-state law, ONE
adjudication-9 exception logged on last_stand_defend). Research: 20 agents (Sonnet gather →
Opus default-refute), 9 refute-drops + empirical bisects (Cold Harbor rejects ANY mechanical
badge — display-only; the Crater drops disciplined). The touched battles' own probes became
the direction authority after the new A/B instrument's OFF-majority heuristic self-refuted
(the Wilderness proof — recorded in ab-badge-direction.mjs). **D482** (a1b2279): the western
batch completes the roster (19→29; Stones River display-only per the inverted-parity law;
the Forrest horseman empirical drop at Fort Donelson). **The P-END battery**: leg 1 + one
exact-label root-fix (a comment token tripping the terrain decor-leak scan — 7e399a6) +
leg 2 green to row 140; 142 artifacts swept clean — slices 4+5 release-grade at battery SHA
7e399a6. **D483** (Aaron-directed): no-photo people now get side-themed flag cards (US
34-star · CS First National — the logged battle-flag adjudication) instead of the egg
engraving; both portrait probes green; binds md5-proven. LANE-017 rests at DRIVE mid-ladder;
slice 6 (soldier-tier badges) is exact next.

## 2026-07-20 — D476-D478 the MEGA-LADDER: ARC 3 SHIPPED AND CLOSED (slice 5 + the release battery) · ARC 4 CHARTERED · slice 1 SHIPPED

The post-D475 continuation (Fable 5, Aaron's 24-hour mega-ladder authorization): **D476**
LANE-014 slice 5 — T24 distance-LOD (the near set in its own `ffNearLayer` scene group, 7
richer instanced meshes + knapsack/bedroll, NEAR_CAP 66 vs far 42 unchanged, hysteresis
430/490, fldLow() always far — the low tier byte-current; E19/E20/fldExit extended; +7
high-tier draws only) + the T23 runtime license wall (fixture-proven; canonical pack
untouched, 0 slots enabled); ff teeth 19→23 · tripo 14→17; binds near-at-low/
license-pending bit EXACTLY; AD-7 game→a234c52a · srcTree→7cc295df. **D477** the ARC 3
release battery: 140/140 at SHA `7ac44aa` across THREE legs (two environment flakes —
tactical-roster screenshot 30s + antietam 360s budget — both re-run green ALONE, zero tree
changes); 139 artifact JSONs swept all-ok/zero-pageerrors; **LANE-014 SHIPPED in full, ARC 3
CLOSED**. Then **LANE-017 loot-and-badges chartered at DRIVE** (`023ec91`: ten
adjudications incl. the R-7 rider resolved-bundled; nine slices with owners+binds) and
**D478** slice 1 shipped — the ONE rarity language: canonical tier map (glyphs •▲◆★ +
RESERVED hexes one step off the app accents after the wall's first run caught the
collision) + cwTierInfo/cwRungTierInfo + the glyph+label-redundant loot chip + the T14
tier-tinted rung glyph; the tree-wide one-language wall enforces data+src/37-default as the
only tier-hex literals; loot 16/16 · ratings 23/23 · a11y + roster adjacents green; binds
hardcode/glyph-strip bit EXACTLY; AD-7 game→9dd15ca2 · dataTree→b3b323fa ·
srcTree→ce48e9ae (+ the follow-up journey/dataTree baseline re-pins, both plan probes
24/24 · 13/13). Counts hold 29/62/1,710/140. Exact next: LANE-017 slice 2 (drop feel).

The post-D471 ladder P4 (Claude Code / Fable 5): the mandatory battery ran
serialized/ALONE — rows 1-72 green in the first leg; ONE red at row 73 `field
sandbox` root-fixed at its exact label (D474 `a7c9e7e`: probe-field's GEA-03
source tooth saw T34's legitimate wrap; the wrapped reposition commands now
expose `_gcDelegate` and the tooth scans the delegate + gains a wrap-without-
delegate failure conjunct — strengthened; the D443/D471 class, the only site
tree-wide); the resumed leg ran rows 73-140 to the END — 68/68 exit 0, every
artifact JSON ok/0-pageerrors, zero timeouts, "VET NO-REGRESSION OK", vf 49/49
re-verified against the fixed build. Slice 5 was SHED from the back (context
safe-stop law). **Slices 3-4 verified at release grade at battery SHA
`a7c9e7e`; LANE-014 rests at CONTRACT (slices 5-6 remain), lock RELEASED.**
Counts 29/62/1,710/140. Next: slice 5 (formation LOD + fixture-only Tripo
slots), then the ARC 3 release checkpoint.

## 2026-07-20 — D473 LANE-014 SLICE 4 SHIPS: the ground-level camera (T34)

The post-D471 continuation ladder P2 (Claude Code / Fable 5): T34 walk-the-field
mode — settings-gated DEFAULT OFF (T+arrows provably inert without the gate),
parameter-mode OrbitControls (no addon, no pointer lock, enableDamping never
written), ground inspect at fldTerrainH+22 with arrow walk/turn, brigade follow
(reduceMotion ⇒ jump), the per-frame terrain-clamp floor, float-exact exit
restore, and the two wrapped T0 reposition commands authoritative.
probe-visual-fidelity 39→49 (49/49, 7 scenes clean); adjacent tactical-visuals
10/10; binds clamp-break/default-on bit exactly, md5-proven; AD-7 game→584e5c6f ·
manifest→4625dca9 · srcTree→a7d2eef4. Counts hold 29/62/1,710/140. Next: slice 5
[IF-ROOM] (formation LOD) then the ARC 3 release battery.

## 2026-07-20 — D472 LANE-014 SLICE 3 SHIPS: HDRI sky + derived lighting (T33)

The post-D471 continuation ladder P1 (Claude Code / Fable 5, the §4 TOP-LOOP
resolution recorded in the lane at `5d6d955` BEFORE any code move): the FIRST CODE
MOVE smoke proved raw RGBE renders in headless SwiftShader r128 but reads near-night
(the linear-output pipeline), so the WIP bank (`lane-014-s3-wip` 06200ba) landed with
two logged amendments — the LDR pre-decode (per-sky EXPOSURE 0.336/0.590/0.645,
gamma-2.2 LUT, below-horizon white fade) and the dusk LIGHTS row recomputed under
the one reproducible 50/50 blend rule; `tools/derive-hdr-palette.mjs` ships and
reproduces every constant. probe-visual-fidelity 28→39 (6 scenes incl. the
route-BLOCKED-first fail-closed page; 39/39; matchesFog = the coupling tooth green
UNAMENDED; 600s slow-Mac budget documented); binds A/B md5-proven; adjacents
weather + atmospherics green; AD-7 game→c72c7585 · manifest→2fdf5fb3 ·
srcTree→b0a88e93 · suite→69681d6f; WIP branch deleted. Counts hold 29/62/1,710/140.
Next: slice 4 (T34 ground-level camera).

## 2026-07-19/20 — D471 the DAY-END BATTERY COMPLETES: 140-row green, LANE-015 + LANE-016 flip SHIPPED (night)

The post-D470 ladder P1 (Claude Code / Fable 5, the §4 TOP-LOOP resolution per Aaron's
continuation kickoff): the battery resumed `--from="render richness"` ALONE/serialized
and ran to the END — every row exit 0, EVERY artifact JSON `ok=true pageerrors=0`,
"VET NO-REGRESSION OK" on the final leg at SHA `c9934a0`. Three root-fixes at exact
labels rode the resumed segments, no tooth weakened: `4e4593f` (RUNTIME — T23's async
GLB apply now routes through the wrapped fld3dSyncUnit seam, closing a real one-frame
orphan-figures window the tripo hideBaseMarker tooth caught; frame-traced, AD-7
game→b26238de · srcTree→cc403e85), `b1c4a4a` (probe-kennesaw's registry-order chain
gains Olustee — the D466 two-teeth-one-swept class), `c9934a0` (probe-franklin's gains
Crater; a programmatic tree-wide adjacency-assertion sweep now proves zero stale
sites). One environment flake: vicksburg 360s in-battery timeout re-ran green alone
in 116.8s (the D454 class). **LANE-015 + LANE-016 FLIPPED SHIPPED at battery SHA
`c9934a0` — ARC 2 / C3 is fully released.** Counts 29/62/1,710/140; `_SAVE_VER=1`;
frozen base untouched. Next: LANE-014 slice 3 (HDRI sky T33).

## 2026-07-19 — D470 the ALL-DAY LADDER P3: the OLUSTEE RUNTIME ships — C3 IS COMPLETE (evening)

LANE-016 chartered ledger-only at DRIVE (`5dbda85`), then the runtime landed as ONE
atomic commit per the D465 spec §8-§9 verbatim: data/olustee.json (the honest Union
defeat from piecemeal-arrival schedule inputs; US 5,500 / CS 5,000 with the 5,400
variant disclosed; the 8th USCT 565/xp-floor law; the Colquitt/Barton/Reed rank locks
with Reed's Feb 26/27 spread; the dual-designation display string; the corridor terrain
with Finegan's works honestly BEHIND the fight; five ≥2-source cards incl. the
rope-train rearguard heart and the contested-scale aftermath card teaching the ABT
self-contradiction itself), schema 61→62, scenarios 28→29 at rank 65.5, register
1,671→1,710 at every pin site, suite 139→140 at the END, probe-olustee 20/20 (direction
battery CS breaks 7/8 + US-bleeds 8/8; machinery at battleId `olustee` direct), the
chattanooga→olustee→fortPillow adjacency re-pins across the rank regex + registry-order
+ DOM chains, binds A/B md5-proven (75f32bf6; the bind-B restore reconstructed exact
original bytes). AD-7: game→21a5216d · dataTree→4bbdebe5 · srcTree→4564d84d ·
suite→cf5de9f6 · focused→78633570. **C3 COMPLETE: Fort Pillow · the Crater · Olustee.**
LANE-015 + LANE-016 rest at VERIFY pending the battery. P4-P6 were SHED honestly
(the context safe-stop law). THE P7 BATTERY (night): ~87/140 green across resumed
segments, ZERO unresolved reds; three root-fixes at exact labels (probe-war-career's
suite-count tooth 138→140 — both the named check and the silent result.ok conjunct;
two environment flakes re-run green); Aaron stopped the session mid-battery. Resume
`--from="render richness"`. Locks released; the flips to SHIPPED await full green.

## 2026-07-19 — D469 the ALL-DAY LADDER P2: the CRATER RUNTIME ships (afternoon)

LANE-015 chartered ledger-only at DRIVE (`2b19f20`, the 3506716 precedent), then the
runtime landed as ONE atomic commit per the D464 spec §8-§9 verbatim: data/crater.json
(one-family 8,500/6,100 with the spread disclosed; the blast as true starting state —
Elliott 1,722 reforming; the Mahone Brig. Gen. lock; the no-Connecticut five-regiment
2nd Brigade; the bowl as the universal move-trap with Cemetery Hill beyond it; the
staged commitment + the three sourced waves; five ≥2-source cards with both findings,
the qualitative toll, and the McClellan caution paired with Suderow), schema 60→61,
scenarios 27→28 at rank 71.5, register 1,632→1,671 at every pin site, suite 138→139
appended at the END, probe-crater authored WITH the commit (20/20; direction battery
CS 6/8 + US-bleeds 8/8 at the fair baseline; the machinery tooth stamps battleId
`crater` directly), the adjudication-2 forbidden-scan flips riding ONLY this commit
(crater token dropped, fort-stedman/overlandCampaign kept, disk scans flipped to
presence), and the Kennesaw→Atlanta→Crater→CedarCreek→Franklin adjacency re-pins.
Three mid-build reds (the Overland whole-registry 27-pins, the D466 sibling class)
root-fixed at their exact labels. Binds A (Mahone tamper) + B (single-source card)
md5-proven (5a5e5132). AD-7: game→1757fdbf · dataTree→3cd4ccb2 · srcTree→bab9cca1 ·
suite→7b36f51e · focused→bb7a1bc9. LANE-015 at VERIFY pending the P7 battery.
EXACT NEXT: P3 — the Olustee runtime (D465 spec §8-§9), which completes C3.

## 2026-07-19 — D468 the ALL-DAY LADDER P1: LANE-014 slice 2 terrain texturing (afternoon)

Claude Code (Fable 5; the §4 TOP-LOOP resolution re-stated at the DRIVE re-take
`04d2bdc` — Aaron's standing drive-on-Fable pick extended by the all-day maximizer)
shipped SLICE 2 per the committed contract clause verbatim: `src/tactical/
T32-terrain-texturing.js` bakes the nine ledgered CC0 albedos into one POT composite
keyed to the analytic region predicates (T0 hooks + marker roads + height bands +
the grain-aligned cultivated mask), exposure-normalized so the map modulates the
authored palette, attached to the existing Lambert ground (map × vertexColors — the
T18/T21 passes show through; zero new objects/draw calls; vertex Y and colours
untouched). Fail-closed everywhere: off/low/file-protocol/any-albedo-missing ⇒
byte-identical current ground. Teeth in existing owners only (suite stays 138):
probe-terrain-readability 30→35 (incl. a route-blocked first-load scene proving
identical vertex-colour checksums) + probe-visual-fidelity 27→28 (off ⇒ no map);
tactical-visuals 10/10 + render-richness 31/31 adjacents green; binds A (broken
path → presence+keying red exactly, fail-closed green) and B (stripped `_tt` →
carry-chain red exactly) md5-proven (79bc5701). AD-7 re-pins game
11099dac→9fca6932 · manifest bb5d7903→bf29b44f · srcTree 916d7e72→03c2cdba at all
four sites; plan probes re-run green post-commit. Counts hold 27/60/1,632/138.
EXACT NEXT: the ladder's P2 — the Crater runtime charter (D464 spec §8-§9).

## 2026-07-19 — D467 the ARC 3 CHARTER + SLICE 1 session (morning; Aaron's pick (a))

Claude Code (Fable 5; the §4 TOP-LOOP resolution recorded — Aaron confirmed driving on
Fable after the kickoff's Opus 4.8 routing note) ratified the FULL LANE-014 acceptance
contract at DRIVE (`489cfc4`, COORDINATION.md-only; six slices, ten adjudications, two
packet errata; recon `wf_1c520994-6d8`), then shipped SLICE 1: the ~98 MB unprovenanced
terrain-texture exposure in the public repo was CLEARED — the committed fetch script's
asset map + live Poly Haven API md5 records matched all 27 maps byte-for-byte, and the 3
HDRIs were identified by md5 across the full 980-asset catalog (syferfontein_18d_clear /
belfast_sunset / overcast_soil pure skies, 2k). 30/30 Verified CC0 with named authors.
Shipped the 30-row `assets/3d/provenance.json`, media-budget 1.9 (assets3d policy +
ledgerClasses caps at the audited totals), probe-media-budget 13→17 steps (1:1
enumeration, per-run full re-hash, caps, outside-embed guard), README provenance law +
model-sourcing plan. Binds A (license-flip) + B (unledgered file) bit at exactly their
steps with md5-proven restores; build GATE OK; schema 60/60; AD-7 re-pins game
f0228c4b→11099dac · dataTree e33afffc→23ccef52 at all three sites; plan probes re-run
green post-commit. Counts hold 27/60/1,632/138. Aaron's other picks recorded: drive on
Fable 5; the D460 Drew's-regiment adjudication stays standing. EXACT NEXT: slice 2
(terrain texturing T32) per the committed contract.

## 2026-07-19 — D463-D466 the ARC 2 COMPLETION + RELEASE session (overnight night 2; the maximizer)

The overnight-maximizer session (Claude Code / Fable 5, the authorized window's final
night) re-took LANE-013 DRIVE at `9a35890` and ran the ladder to release. D463
(`9a0d4e9` + `dffd3bc`): the Fort Pillow RUNTIME in one atomic commit from the banked
`lane-013-p4-wip` draft (branch deleted after landing) — 27/60/1,632/138 chained at
every pin site, the ten absence-tooth flips, probe-fort-pillow 19 steps with the 8-seed
direction battery 8/8 both axes at the fair 1,500 baseline, the no-quarter machinery
teeth extending t1-t6 (24 reward families refused; declined path takes nothing), binds
A/B md5-proven. D464 (`e3fcc8b`) + D465 (`6663449`): the Crater and Olustee specs
committed docs-only with the two HISTORICAL-DATA.md corrections; the adjudication-2
forbidden scans verified untouched. LANE-014 `graphics-uplift` chartered ledger-only
(`fba0b61`); the [IF-ROOM] Crater runtime declined under the charter's budget rule.
D466: the release battery ran ALONE/serialized to 138/138 GREEN at `ca1a219` with 139
artifact JSONs read (zero pageerrors); five reds root-fixed at their exact labels
(`8b082e6` S44 copy update · `7531e15` war-career frozen pin · `813aa53` two
regex-source disk scans split · `7b3edca` spotsylvania DOM sibling · `ca1a219` kennesaw
chain teeth) — no tooth weakened. LANE-012 + LANE-013 flipped SHIPPED; the session
closed with the D412 doc rotation and the release commit.

## 2026-07-18/19 — D459-D462 the ARC 2 OVERNIGHT session (LANE-013 chartered; P1-P3 shipped + P4 spec)

The overnight session (Claude Code / Fable 5, final night of the authorized window) chartered
LANE-013 `content-unlocks` ledger-only at `3506716`, then ran the ARC 2 ladder: D459 `0127cc7`
the massacre-treatment research family packet (3 live-fetch gathers → 3 Opus default-refute
verifiers; JCCW + Forrest-OR primaries; all three chapters READY_FOR_SPEC; seven evidence-
forced corrections recorded) + the incidental `1af86ee` schema-gate root-fix (the validator
never learned the D457 historical action — now enforces the massacre-block at the data layer,
59/59, tamper-bind proven); D460 `a2b0484` the Cherokee fielding at Elkhorn (Watie's 2nd CMR
on its sourced March 8 Big Mountain station; Drew's honestly non-combat — the field-both
tension surfaced to Aaron; register 1,614→1,617 chained at seventeen sites; the 8-seed
direction battery held 8/8 ×4; Goodspeed-strip bind md5-proven); D461 `ea1f714` the Front
Royal scored-capture lift (docs+teeth only; game hash `7c13850e` held as the A/B); D462
`045a50b` the Fort Pillow battle-build SPEC (the runtime deliberately queued at the clean
boundary per the charter's own budget rule). P5 (Crater/Olustee specs) and P6 (the release
battery) deferred honestly to the continuation prompt; LANE-012 rests at VERIFY untouched;
LANE-013 rests at CONTRACT (unowned) with the full ladder + P4 recon in its ledger entry.

## 2026-07-18 — D457+D458 the ARC 1 SLICE 2+3 session (LANE-012 all-slices-green → VERIFY)

The Slice-2 session (Claude Code / Fable 5, within the authorized window through 2026-07-19)
re-took DRIVE ledger-only at `e8d761c`, then shipped D457 at `c4bc504`: the Historical
surrender/no-quarter unlock — judged, never rewarded — through the SHIPPED Mayhem
effect-schema/receipt machinery. The `no-quarter-historical` consequence-only data action
(signs are law: morale/press/diplomacy ≤0, notoriety ≥0; magnitudes recorded with logged
deterministic A/B evidence in the probe artifact), the engine-level LOAD-BEARING
massacre-block (`_MH_HISTORICAL_OPS` — every reward family refused before mutation; the t1
tooth surfaced a real resolve-ordering purity bug, root-fixed so ALL validation runs before
receipt sanitation), four consequence adapters through existing owners (M.infamyShock →
moraleCompute; C.press.infamyShock → pressSentiment; BL.recognition moved AGAINST the
actor; the NEW capped C.infamy ledger → the prisoner-exchange reprisal cycle), the
both-rulesets offer stamp from the T25/T2 chain, and the judged AAR panel (GEA-14 idiom;
all consequences stated before confirmation; committed Fort Pillow + GO-252 condemnation
with attributions; byte-identical Historical AAR at no-offer/no-infamy). Teeth
t1-t6 in probe-mayhem-mode (24/24) + the AAR pin in probe-afteraction (19); adjacent
save-slots 16/16 + campaign-link 19; zero pageerrors. Binds A1/A2/B bit EXACTLY t1/t2/t3
with md5-proven restores; both lane plan probes re-pinned (AD-7 chains) and ALL OK
post-commit. Then D458 shipped the Slice-3 re-toothing sweep: the stripJsComments family
root-fixed TREE-WIDE (11 red-on-clean-HEAD battle plan probes + the same idiom in 4 suite
probes; one regex-literal-aware single-pass scanner — v1's string-only pass was itself
caught by probe-learn-battle on src/100's `.replace(/"/g,…)` and upgraded; verified on real
inputs; inverse bind md5-proven on cedar-creek; zero broken instances remain) and the
consequence-only-absence audit CLOSED (family head split-chained in D457; E41 untouched by
additive fields; nothing else to re-pin). Counts 26/59/1,614/137 and `_SAVE_VER=1` held all
session; frozen base untouched. LANE-012 moved DRIVE → VERIFY (battery-only) and the lock
released at session close. Exact next: charter ARC 2 (the Fort Pillow/Crater/Olustee
research family + Leetown + Front Royal) fresh, ledger-only first; or run the release
battery to flip LANE-012 SHIPPED.

## 2026-07-18 — D456 the ARC 1 CHARTER + BUILD session (LANE-012 chartered; Slice 1 shipped)

The ARC 1 session opened LANE-012 `unlock-and-teach-spine` per the D455 packet §4a: the full
acceptance contract (three slices + probe design + per-slice gates) committed ledger-only at
`138e216` BEFORE any code moved, with the packet's C72 rider dropped as stale (shipped D422,
LANE-008) — the erratum recorded in the lane history. Slice 1 then shipped as D456 at
`0851de0`: `src/113-teaching-companion.js` (manifest 112→113) — the always-visible sourced
"In history…" companion on briefings (each battle's own committed corpus; attribution labels
probe-verified as prefixes of committed source rows; fail-closed without corpus; verified
chain-alias map), the Mayhem AAR companion (the divergence ledger's committed hist corpus,
factual voice — the D416 comparison-off-by-default AMENDED per Aaron's D455 R3/R6 locks
while the no-moral-GPA charter holds), the per-dispatch Chronicle juxtaposition (Fort
Pillow / cartel-collapse, composed verbatim from the committed codex corpus), and both-modes
byte-identity pins on divRenderTab/endRenderSection. Gates: node --check ×7, build GATE OK
(save-shape ✓), briefing 3/3 viewports · mayhem 23/23 · divergence 15 · endings 25 ·
adjacent afteraction 18/18 — all artifacts read, zero pageerrors; Bind A (API absence — the
manifest-drop form proven build-refused fail-closed, BUILD FAIL [5]) and Bind B (attribution
strip) bit exactly, md5-proven byte-identical restores; plan-probe md5 pins re-chained with
the AD-7 idiom and both lane-grepping plan probes re-run green on the clean tree. Counts
26/59/1,614/137 and `_SAVE_VER=1` hold. INCIDENTAL surfaced for Slice 3: the battle
plan-probe stripJsComments family is red on clean HEAD (the validate-data-schemas line-2
`data/*` glob eats BATTLE_FILES before the scan — latent never-run non-suite teeth).
Session closed at the clean D456 boundary; LANE-012 lock released with the resume pointer
at Slice 2.

## 2026-07-18 — D454 the AD-0 COMPLETION + RELEASE session (137/137 GREEN; LANE-009/010/011 SHIPPED) + the D455 design Q&A

The AD-0 completion session resumed the battery `--from='field sandbox'` at the D453 head and
ran rows 73-137 to `VET NO-REGRESSION OK` — 137/137 GREEN total across the 72-row D453 prefix
plus seven serialized segments (23+5+7+8+3+1+18; logs `.tmp/ad0-battery-resume3..10.log`).
Every artifact read: 136 JSONs ok, zero pageerrors, zero realErrors, 232 screenshots. Six
battery reds root-fixed at their exact labels (`bbffcb4` weather/cold-harbor provenance enum ·
`2e2fcde` atlanta PHASE_COUNTS · `7916d14` gettysburg owning-process exit + 600s budget ·
`9b7f58d` the six-site Overland forbidden-scan/adjacency family · `b5be203` kennesaw DOM
adjacency · `1a43027` cedar-creek/franklin Atlanta-insert adjacency + the tree-wide audit
closing the family) — every one a stale VETTING-DEFERRED pin or never-run tooth; none
weakened. Environmental: orphaned headless Chromes cleaned (the roster screenshot flake);
one cold-boot timeout green on retry. AD-0 → SETTLED IN D454; LANE-009 + LANE-010 +
LANE-011 → SHIPPED; docs synced per the D412 law incl. the overdue 56-block V1-CHECKLIST
gate-state archival (inventory-proven unpinned). In parallel (docs-only, battery-safe),
Aaron locked ELEVEN popup rounds of design law for the next arc — recorded verbatim in
`docs/design/unlocked-but-judged-design.md` (D455): UNLOCKED-BUT-JUDGED, the conquest
layer, the terrain pipeline, the graphics uplift promoted to ARC 3, and the integrated
ARC 0-9 roadmap.

## 2026-07-18 — D453 the FINAL AUDIT session (AD-11..AD-19 settled; the AD-0 battery to 72/137, safe-stopped)

The dedicated final audit (Claude Code / Fable 5, within the authorized window) settled every
AD-11..AD-19 row exactly as written: every named probe green with zero pageerrors, all
eighteen predeclared binds bit exactly their teeth with md5-proven byte-identical restores,
all three --diagnostic-invalid fixtures re-proven at the audit head. FOUR
dead-code-under-h0-override runtime bugs root-fixed on the LIVE owners (D444 learn card →
src/100; D445 morning brief → src/99; D446 desk concept spans → real treasury/diplomacy copy;
D452 Mayhem free-battle launch → the design-§8.2 persistent HUD chip), each guarded-off path
proven byte-identical to its pre-slice build. SIX never-run probe teeth re-toothed STRONGER
(the comment-scan class ×4, the audio factored-helper pin, the keymap dispatch tooth); the
GEA-14 packet gained the battle-level source register; DECISIONS.md's two literal NUL bytes
restored to text. The AD-0 battery then ran serialized and alone to 72/137 GREEN with zero
unresolved reds — two battery reds root-fixed and re-run green (row 38 war-career: stale
frozen-wall pins re-pinned with documented chains → 45/45; row 50 h0-main-menu: the
pre-D420-flow tooth re-toothed to the shipped public ruleset-picker flow → 5/5) — before
Aaron called the safe stop at the row-72/73 boundary. Lanes rest at VERIFY (battery-only).
NEXT: resume --from='field sandbox' (rows 73-137) at this head, then D454 flips
LANE-009/010/011 SHIPPED. Settle commits: 3c9757b f045795 f0b1ff2 ed11d68 1491edc 2fd3e30
8ed1c16 a0fb3b7 7224943 e9bc7de 266f6b0.

## 2026-07-18 — D444-D452 the LANE-011 genre-elite P1 build run (coding-first)

The GEA-07..14 P1 build run under the D431/D443 coding-first law (Claude Code / Fable 5,
within the authorized window; LANE-011 ledger-only lock `0224a10` from the clean D443
boundary). All eight chartered slices shipped, one commit + push each: D444 GEA-07
Learn-the-Battle metadata on all 26 scenarios + the non-binding picker card (suite 133→134) ·
D445 GEA-08 the Chief of Staff morning brief with PURE property-path readers per the D443 §19
lesson (schema 57→58, suite 134→135, manifest 109) · D446 GEA-10 concept ids + focus-returning
deep links, all four anchor kinds live-validated (schema 58→59, suite 135→136, manifest 110) ·
D447 GEA-12 the ONE emancipation→reconstruction memory chain, legacy saves byte-identical by
absence, E41 envelope untouched (suite 136→137, manifest 111) · D448/D449 GEA-09 audio buses
(the frozen-closure zero-gate bound recorded) + the T30 action map (a literal-NUL sentinel
caught and root-fixed) · D450 GEA-13 the deterministic replay capsule (hash equality or the
verbatim honest failure) · D451 GEA-14 the print-safe classroom session packet · D452 Mayhem
Slice F, the skirmish standalone ruleset picker (the stays-false charter line adjudicated
stale against the shipped public gate). Per-slice gates only (node --check · build GATE OK ·
schema when data moved · git diff --check); every slice authored (never ran) its probe teeth
with predeclared binds and appended AUDIT-DEBT AD-11..AD-19; the schema/suite pins swept with
documented chains at every site each time they moved. Counts close at 26 scenarios / schema
59 / Register 1,614 / suite 137 / `_SAVE_VER=1` / frozen base untouched. GEA-11 stayed
design-only; the optional LANE-002 5b batch was deliberately not opened on the session tail.
LANE-011 rests at VERIFY (battery-only, unowned). Exact next: the FINAL dedicated audit
session settles AD-11..AD-19 + AD-0 and flips LANE-009/010/011 SHIPPED.

## 2026-07-17 — D422 C72 Shiloh myth correction

Selected the HIGH C72 historical defect ahead of another biography batch and optional/larger lanes. Rewrote player-facing Shiloh text around NPS + Timothy B. Smith/ABT: Grant was surprised but Peabody prevented total tactical surprise; W. H. L. Wallace's veterans anchor the Hornets' Nest account; the road was not trench-like; Buell strengthened rather than single-handedly saved the army; Johnston's survival is counterfactual, not certain victory. The unchanged wall-shaped objective is labeled a game abstraction. Schema 55/55; build GATE OK; Shiloh 32/32; roster 8/8; builder 15/15; Codex 24/24; zero pageerrors. One bind isolated the C72 tooth and restored intended data/probe/game bytes. No mechanics/count/save/schema change; full battery remains deferred.

## 2026-07-17 — D421 New Market Heights USCT prosopography batch

Selected LANE-002 5b after post-D420 roadmap adjudication. Live runtime corrected the stale remainder to 1,440 open generated `ss:` rows. Added Christian A. Fleetwood (Sergeant Major, 4th USCT), Powhatan Beaty (First Sergeant, Company G, 5th USCT), and James Gardiner (Private, Company I, 36th USCT) as Verified New Market Heights Medal of Honor records; pack 39→42 and remainder 1,440→1,437, register fixed at 1,512. Importer 42/42; build GATE OK; loot-survival 12/12; tactical roster 8/8; women-in-war 13/13; zero pageerrors. Full battery deferred under D160/D176.

## 2026-07-17 — D420 Mayhem Slice C public vertical slice

Shipped the accessible public chooser and first production surrender/No Quarter transaction. Exact effects: +25 Mayhem score, +40 casualty credit, one commissary-rations reward, and `side:<actor>:no-quarter-momentum`; all route through `mayhemCan`/`mayhemApply`, stage/commit/rollback, and one receipt. Historical refusal and its AAR path remain intact. Focused evidence: schema 55/55, Mayhem 18/18, save 16/16, full campaign 4/4, suite list 131, zero pageerrors/realErrors. Full `npm run vet:noreg` was intentionally omitted by the opener.

## GATE BATCHING UPDATE — 2026-06-29
Aaron stopped the D161 full no-regression battery and directed that the big suite stay deferred until the planned work is built out. The probes stay intact, but the per-slice commit gate is now focused: source/doc read order, syntax checks, importer/schema checks, build, focused probe, adjacent probes, JSON/pageerror readback, and `git diff --check`. Full `npm run vet:noreg` is reserved for the planned-work batch/release gate or explicit Aaron request.

## QUEUE-LOOP GATE CLARIFICATION — 2026-06-30 (D176)
Aaron clarified during the D175 same-chat queue loop that the long audit must not run after every queued item. For explicit all-queue loops, even manifest/bridge/render/lifecycle/suite-enrollment slices ship on the focused per-item gate: build GATE OK, relevant importer/schema checks, `node --check`, focused probe, 1-3 adjacent probes, JSON/pageerror readback, and `git diff --check`. Full `npm run vet:noreg` is deferred until the end-of-queue planned-work batch/release checkpoint or an explicit Aaron request. The partial D175 `vet:noreg` run was stopped under this clarification after no red output through render-richness.

## D419 OPEN HISTORY / MAYHEM: Slice B closed atomic pipeline shipped — 2026-07-17

- Closed schema and all 30 operations; 55/55 schemas. Pure eligibility, fixed-order adapters, reverse rollback, and 32 deterministic receipts shipped without production adapters or public actions.
- Final: Mayhem 17/17, save 16/16, campaign 4/4, zero errors; suite 131 rows 38/57; 24/55/1512/24 and `_SAVE_VER=1`. Four binds restored byte-identically. Planning/full battery omitted. Slice C is exact next.

## D418 OPEN HISTORY / MAYHEM: hidden Slice A runtime shipped, lane stays DRIVE — 2026-07-17

- Aaron authorized one Slice-A allowlist addition: `tools/save-shape.json`. The enrolled
  `src/105-save-guard.js::applySave` signature moved from `cd6a42c12696426c` to
  `201fa746ea8e8755`; `_SAVE_VER=1` did not move.
- Added `src/107-mayhem-rules.js` after src/106. It owns the exact campaign ruleset, the only
  initializer/sanitizer, strict immutable state, Historical fallback, named Historical-to-Mayhem
  forks, mode labels, and the bounded pre-start carry. Late wrappers attach the ruleset before
  `_t1InitAll` and first launch across H0/legacy US/CS routes, then clear pending state in
  `finally`. Direct two-argument starts remain Historical.
- Added the real-control picker, but `MAYHEM_PUBLIC_READY=false` keeps normal paths Historical.
  Keyboard selection, Back/Escape/focus restoration, visible focus, radio state, action-only
  announcements, 200%/narrow layout, high contrast, and reduced motion are probe-covered.
- Extended save restore, slots, import preview, undo metadata, current-mode labels, and H0 text
  without adding a second save owner. Save A Historical to B Mayhem to A returns Historical;
  `G.settings` cannot select the live mode. Explicit and legacy Historical vectors match byte for
  byte.
- Added `tools/probe-mayhem-mode.mjs` and one suite row. Final focused results: Mayhem 16/16,
  save slots 16/16, H0 main menu 5/5, playstyle 14/14, divergence 14/14, full campaign 4/4;
  every fresh artifact reports zero pageerrors/realErrors. Suite list is 131 with War Career row
  38 and Mayhem row 57.
- Six inverse-restored binds each reddened one declared tooth: Historical fallback,
  attach-before-init, immutable owner, cross-slot isolation, four campaign routes, and the
  fail-closed public gate. Restores returned src107 `ec514d1a4092ba16aa3746b14476f093`,
  src91 `8c2a586c62fb9acb2d49e64c899cd4e5`, src98
  `2c03776cf8f1097fd59860637013f714`, and game
  `fd3064b58871b3b51a7866685075dadb` byte for byte.
- Release pins: srcTree `85f72d325f5fe1c1c09c62a1d59edbec`; base unchanged
  `c9db83fa99230ffb95bdfdfe059f3fb9`; manifest `483be7dbc6dfc820a0092e2085b88b93`;
  suite `5703b0a7a62ea2b922285280362e6c1d`; focused probe
  `9801e496cf90f2ac400e965b2a517475`; save shape
  `c400c9d007bbfdaeea07f96f3fb1945b`; 24/54/1512/24 unchanged.
- The required all-probe pin inventory found no probe that pins the five D413 canonical summary
  lines. D413 moved to the five D412 archives newest-first; SHA-256 comparisons against `HEAD`
  proved every moved line byte-identical.
- Aaron authorized omitting the pre-runtime planning probe after runtime changed its frozen
  allowlist/count pins. The focused release gate replaced it for this slice. `npm run vet:noreg`
  was not run; D398 remains the latest full release battery.
- LANE-007 remains DRIVE. Slice B is exact next: closed action/effect schema, atomic validation
  and apply, deterministic idempotent receipts, fixed-order domain adapters, and operation-family
  fixtures. `mayhemCan` belongs to Slice B. `MAYHEM_PUBLIC_READY=false`; Slice C stays closed.

## D417 OPEN HISTORY / MAYHEM — dual-ruleset planning contract shipped, lane released — 2026-07-17 (D416/D417)

- Aaron superseded D382's universal consequence-only/never-scored/dignity-lock interpretation
  before runtime. The uncommitted surrender research draft was removed; the pushed `41b6051`
  ledger take remains history, then `048417c` committed the superseding D416/LANE-007 contract.
- Shipped `docs/design/open-history-mayhem-mode-design.md`: Historical preserves the current
  teaching game; Mayhem unlocks every historical gameplay/content guardrail. Declared Mayhem
  actions may alter score, casualties/credit, result/winner, victory progress, rewards, rosters,
  technology, and faction/identity tags. Mayhem carries no moral/plausibility GPA; comparison to
  history is optional/off by default. Fiction cannot masquerade as Verified history.
- Locked the one planned owner `C.ruleset={id:"historical"|"mayhem",version:1}`: immutable per
  timeline, campaign-serialized at `_SAVE_VER=1`, independent from mutable global preferences,
  Historical fallback on missing/malformed values, named fork for Historical→Mayhem, local
  snapshots for standalone battles.
- Locked one closed-world, atomic/idempotent effect + receipt pipeline. D74 remains the
  single-engine/no-hidden-hack law but no longer bans explicit Mayhem score/casualty/result power.
  Identity/cultural/faction advantages use composable authored tags, not one global race scalar.
- New suite-excluded plan probe is 13/13. The one-token `DECLARED_ACTIONS_MAY_SCORE`→
  `DECLARED_ACTIONS_NEVER_SCORE` bind exited 1 with exactly MAYHEM AUTHORITY red and 12/13 green;
  byte-identical restore returned final 13/13. JSON read.
- Planning changed no runtime/data/manifest/suite/generated/base byte: build GATE OK; game
  `9d7d91078dd8fceea847f1c2aff4dc5f`; base `c9db83fa99230ffb95bdfdfe059f3fb9`;
  manifest `7924da858de403cac58caabf8c9fcce8`; suite
  `4bcdc6f252389a4bfd6bed269b52f8f0`; 24/54/1512/24/130; `_SAVE_VER=1`; all thirteen existing
  coordination plan probes green. No browser/full battery owed; D398 remains latest full release.
- D412 prior summary blocks moved byte-verbatim to their five `legacy/*-ARCHIVE.md` owners. LANE-007
  released to CONTRACT/unowned. Exact next is Slice A hidden mode kernel/picker/save isolation;
  `MAYHEM_PUBLIC_READY=false` until Slice C supplies a real action and no-judgment result readout.

## D413 WAR-CAREER SLICE E — Matters-of-State runtime shipped, lane released — 2026-07-17 (D413)

- Took LANE-005 DRIVE ledger-only (`a3aec520c3f8e4e823d453011488a7447906c040`) from the clean
  D412 boundary (`70e0f990bbe8d9b37636b5484ebf5f8245467683`) after re-verifying all nine pinned
  hashes byte-identical and the plan probe 24/24. Probe-pin preflight found every collision
  inside the declared transition (plan-probe allowlist/pins/step-count); nothing else pins the
  decision surface.
- Implemented D408 §17 UNCHANGED: `warCareerDecisionAccess` pure reader in src/106
  (general-command + latest validated qualifying receipt canonical `battleYear >= 1864`; one
  `_WC_POLITICAL_DATE_YEAR` law site; `latestQualifying` derived per read, never persisted;
  `warCareerCapabilities.nationalDecisions` consumes it; cabinet/appointments/resources false),
  and the src/32 seam guards (visible defer on Desk + between-battle: readable cards, focusable
  `aria-disabled` Decide + `aria-describedby` per-card defer notes naming date/authority/both;
  `_decWireCards` activation guard focusing the explanation; direct `decResolve` refused before
  `_decApply`; `decOnResolve` deliberately ungated). Legacy/no-career byte-equivalent (zero lock
  bytes on bypass).
- Focused proof: ONE new browser row `D408 MATTERS OF STATE + VISIBLE DEFER` → War Career
  **44/44** + 30/30 static, zero pageerrors/realErrors (legacy bypass · both-missing ·
  date-only via Rhodes rungs 1-6 (latest 1863) · authority-only via a nashville private with an
  1864 v1 receipt · clock-never-grants · queue-current-while-locked · forgery fails closed ·
  unlock at rung 7 with two green save roundtrips and no persisted field · routing literals
  unedited). Adjacent: probe-decisions 19/19, probe-desk 13/13, probe-full-campaign 4/4;
  Command 94/94 byte-identical; twelve battle/arc plans green (136 rows); suite list 130 row 38.
- Plan-probe transition only: allowlist + `src/32-decisions.js`; 42→43 literal steps; moved
  hashes documented old→new (game → `9d7d91078dd8fceea847f1c2aff4dc5f`, srcTree →
  `a4a46fbcff478c239de037f4a63105a4`, 106 → `8e09ebbf56ba3433712f91936f438e5d`, focused →
  `b7d6246e10357afc2a4e8f07f8c5dcea`); never-move pins all stand; 24/24 names/order exact.
  One discovered-at-gate item (D411 loot-pin class, documented in D413): the changed-path
  allowlist predates the D412 HISTORY ARCHIVAL RULE, so the five `legacy/*-ARCHIVE.md`
  closeout targets were admitted with a documented-history comment.
- Five byte-restored binds each reddened ONLY the new row at 43/44 (A UI semantic lock ·
  B 1864→1863 · C any-band authority · D legacy gated · E direct-resolve bypass); every restore
  md5-identical (src/32 `922d6fd0…`, src/106 `8e09ebbf…`, game `9d7d9107…`); red teeth never
  landed. `_SAVE_VER=1`; D398 remains the latest full release battery; `npm run vet:noreg` NOT
  run (not owed). LANE-005 released to CONTRACT/unowned; no queued lane work remains — next
  selection is Aaron's; Slice F stays closed.

## D412 DOCS-HYGIENE AUDIT + RESTRUCTURING — shipped, lane released — 2026-07-16 (D412)

- Took LANE-006 DRIVE ledger-only (`d9ed229a66625b5359926182650c0c9c0fcb3c9b`) from the clean
  D411 boundary (`aebc8f228af1424e15b2b1fc5556bfb2c7bcc7b2`) after re-verifying build
  byte-stability (game `7de51b310e09a710eb83ade276952203`) and all thirteen plan probes green.
- Docs/tooling ONLY: no game, src/, data/, tools/, probe, or generated byte moved; suite stays
  130 with War Career row 38; `_SAVE_VER=1`; D398 remains the latest full release battery;
  `npm run vet:noreg` NOT run (not owed).
- Shipped the three rules (START-HERE §Naming convention + OPUS-PLAYBOOK §7): LIVE-HEAD
  SINGLE-SOURCE (HANDOFF top ⚡ block is THE boundary; other docs summary+pointer), HISTORY
  ARCHIVAL (latest + exactly one prior in place; older heads byte-verbatim to
  `legacy/<DOC>-ARCHIVE.md`, newest at top, inventory-gated, at session closeout), TRIMMED READ
  ORDER (START-HERE → COORDINATION relevant lane → HANDOFF top block → task law docs/probes →
  DECISIONS latest; WAKE-UP/RUN-LOG pull-on-demand). OPUS-PLAYBOOK §7 gains three kickoff
  standards from the D411 session: probe-pin grep preflight over ALL `tools/probe-*.mjs`,
  clone-local git identity at startup, FIRST-`**State:**`/`**Owning tool:**` lane parsing.
- Archived byte-verbatim (diff-proven against the pre-edit snapshots): HANDOFF D410→run-h
  scaffold (`legacy/HANDOFF-ARCHIVE.md`), WAKE-UP D410→run-k (`legacy/WAKE-UP-ARCHIVE.md`),
  START-HERE D410→D392 heads + commented snapshots + LEGACY PASTE BLOCK
  (`legacy/START-HERE-ARCHIVE.md`), AUTONOMOUS-RUN §2 D410→run-i tail
  (`legacy/AUTONOMOUS-RUN-ARCHIVE.md`), V1-CHECKLIST D409→D384 gates
  (`legacy/V1-CHECKLIST-ARCHIVE.md`), RUN-LOG 2026-06-30-and-earlier entries
  (`legacy/RUN-LOG-ARCHIVE-2026H1.md`). COORDINATION/DECISIONS/REVIEW-QUEUE/docs/design
  untrimmed (probe-pinned; COORDINATION got only the LANE-006 ledger).
- Bind: flipped the probe-pinned `43/43` token in LANE-005's retained D410 resume pointer to
  `43/44`; `probe-war-career-loop-plan` exited 1 with exactly `REACHABILITY BASELINES` red;
  COORDINATION.md restored md5-identically; rerun 24/24 green. Red teeth never landed.
- Gates: build GATE OK with game md5 unchanged; plan 24/24; twelve battle/arc plans 136 rows
  unchanged; `vet-no-regression --list` exactly 130 with row 38 `war career`; srcTree/dataTree/
  toolsTree byte-identical to the take baseline. Before/after read-order token measurements and
  the full archive table are in DECISIONS D412.
- LANE-006 released to CONTRACT/unowned ("docs-hygiene rules are live; next docs work only on
  Aaron's request"). Exact next build work (unchanged from D411): the D408 §17 Matters-of-State
  runtime at 44/44 under a fresh committed LANE-005 DRIVE lock.

## D411 WAR-CAREER REACHABILITY RUNTIME — shipped, lane released — 2026-07-16 (D411)

- Took LANE-005 DRIVE (`acb8ac50…`) from the clean D410 boundary (`98f6370c…`) after re-verifying
  every pinned hash exact, re-running the plan probe 24/24, re-running the read-only D410 fixture
  green (ok:true, runId `run-us-d410-1`, rolls `196/204/264/380/855/688/736`, register 1512), and
  re-verifying the "All for the Union" end-bound claim through the citation pipeline (exact
  title/editor/imprint/ISBN 0-679-73828-2 confirmed; Rhodes lieutenant colonel commanding from
  Feb 6, 1865, brevet colonel Apr 2, 1865, mustered out with the 2nd RI July 13, 1865).
- Landed exactly the §18 surface: Rhodes `serviceStart:1861, serviceEnd:1865` + the one
  exactly-named source row (all other record fields byte-identical); the src/37 cleaner validity
  law (finite integers 1800-1900, start <= end, year inside) + the `_ssApplySoldierReplacements`
  carry (valid pair → own-property bounds, NO `serviceYear` pin; the single-year literal
  survives exactly once; malformed bounds drop, never widen); six frozen Rhodes
  `_WC_TIMELINE_ASSIGNMENTS_V1` rows, every computed id proven equal to its pin.
- Focused proof: ONE new browser row `D411 REACHABILITY + SOURCE-BOUNDED SERVICE` (register 1512,
  Rhodes the only bounds carrier, six-shape malformed matrix, seven decisive victories → merit
  28 / reputation 21 / six promotions / Brig. Gen. / general-command / latest receipt nashville
  canonical 1864, source grade+OVR immutable, byte-idempotent sanitation, save roundtrip, zero
  non-Rhodes movement) and ONE new static wall pinning the bounds-carry branch → War Career
  **43/43** browser + **30/30** static, zero pageerrors/realErrors.
- Plan probe transitioned within its declared scope only: contracted-not-landed → landed pins,
  allowlist gains exactly the §18 runtime surface, focused structure 42 steps + 30 checks, moved
  hashes documented old→new (HTML `7de51b31…`, dataTree `3250a3f5…`, srcTree `a48ceb72…`, 106
  `91bd8cd3…`, 37 `25c1226e…`, focused `5e856b3f…`) — **24/24, names/order exact**; never-move
  pins (base/manifest/suite/T2/T3/Auto/After Action/Command/Command probe) all stand.
- Binds: A (source row removed, bounds kept) → focused 42/43 ONLY the new row red + plan
  `SOURCE-BOUNDED SERVICE` red; B (cleaner accepts inverted pair as min/max window) → 41/43,
  exactly the two new teeth red — the browser malformed case was strengthened mid-bind from a
  year-outside shape to a swapped-pair shape so it genuinely bites ordering violations; C
  (`serviceYear` pinned beside bounds) → 42/43 ONLY the new row red. Every restore byte-identical
  (data `5b67f734…`, src/37 `25c1226e…`, HTML `7de51b31…`); red teeth never landed.
- The first full battery caught one genuine collision: the loot probe's `UI D150` row pinned the
  Rhodes detail card at `Sources (4)`; the contracted end-bound row renders 5. Surfaced to Aaron
  mid-take; Aaron approved the one-token stale-pin bump (4 → 5, documented; D394 idiom). Loot
  back to 12/12 with its 1512 pins untouched; the plan-probe take allowlist records the
  exception.
- Full focused battery green (build GATE OK; War Career 43/43+30/30; Command 94/94; plan 24/24;
  loot 12/12; save slots 16/16; twelve battle/arc plans 136 rows unchanged; suite list exactly
  130 with row 38). `npm run vet:noreg` NOT run (not owed). D408 §17 NOT implemented. LANE-005
  released CONTRACT/unowned; exact next: the D408 §17 Matters-of-State runtime unchanged at
  44/44.

## D410 WAR-CAREER REACHABILITY — planning contract shipped, lane released — 2026-07-16 (D410)

- Aaron approved D409 option 1 (2026-07-16; approval line recorded verbatim in DECISIONS D410 and
  LANE-005). Took LANE-005 DRIVE ledger-only (`b82b48e1…`) from the clean D409 boundary
  (`64714e45…`) after re-verifying all seventeen pinned hashes exact.
- Ran the read-only D410 fixture probe in the live built game (`.tmp/d410-reachability-fixture.mjs`
  → `.tmp/d410-reachability-fixture.json`, gitignored; ok:true, zero errors, zero pageerrors,
  register 1512, Rhodes unique by person and slot). Verified live: US chain rungs
  1/9/14/15/16/17/27, canonical years 1861/1862/1863/1863/1863/1863/1864, six unique open non-hq
  timeline targets (antietam `us_french`/sunkenroad and chattanooga `us_hazen_mr`/missionary-ridge
  discovered live; the four D406/D409 candidates confirmed), assignment ids `wcta-fa53w4`,
  `wcta-inib47`, `wcta-154xy3w`, `wcta-azt21w`, `wcta-7u1ul0`, `wcta-9cpe74`, all-alive runId
  `run-us-d410-1` (rolls 196/204/264/380/855/688/736), and `_wcServiceWindowValid` 1861-1865
  admitting every rung year while rejecting 1860/1866.
- Wrote design §18 (approval + D411 three-file scope; source-bounded service law with the exact
  Rhodes bounds 1861-1865 and the exactly-named "All for the Union" end-bound source row; the
  adapter carry law with precedence/clamps/fail-closed and the complete service-field consumer
  enumeration; the verified ladder fixture; count/pin transitions incl. 43/43 → 44/44 and 30/30;
  exclusions) and appended five fail-closed plan-probe steps: plan 19/19 → 24/24 with the
  original nineteen names/order exact and the probe still suite-excluded.
- Negative bind: flipped the single §18 bind token (`NEVER_INVENTED`→`MAY_BE_INVENTED`); the plan
  probe exited 1 with exactly `SOURCE-BOUNDED SERVICE` red and 23 green; restored byte-identically
  (md5 match) and reran 24/24 green. Red teeth never landed in git.
- Gates: `node --check` clean; build GATE OK with HTML byte-identical at `502aee3f…`; plan 24/24;
  all twelve battle/arc plan probes green and unchanged (aggregate 136 unchanged rows + this
  probe's declared 24); suite `--list` exactly 130 with War Career row 38; `git diff --check`
  clean; changed paths only the ten-file planning allowlist. No runtime, data, probe-suite, or
  generated byte moved; `_SAVE_VER=1`; D398 remains the latest full release battery;
  `npm run vet:noreg` not run (not owed in D411 either).
- LANE-005 released to CONTRACT/unowned. Exact next: a fresh committed LANE-005 DRIVE lock for the
  D411 reachability runtime (Rhodes bounds + adapter carry + six authored rows + one focused
  reachability row, 43/43), then a further separate take implements D408 §17 unchanged at 44/44.

## D409 WAR-CAREER SLICE E RUNTIME — reachability HALT, lane released — 2026-07-16 (D409)

- Took LANE-005 DRIVE (`5449158f…`) from the clean D408 boundary (`18c15626…`), confirmed all
  fifteen pinned pre-runtime hashes exact, and ran a read-only reachability probe in the live built
  game before any runtime edit (`.tmp/d408-reachability.json`, gitignored).
- Verified: all 1,465 career-startable Army Register people carry single-year service windows;
  shipped D405/D406 law bounds alternate-timeline service by that window; the only lawful 1864
  cross-rung timeline target on either chain is nashville; General Command needs four promotions
  while a single-1864-window person reaches at most two qualifying rungs. The D408 unlock —
  General Command plus a canonical 1864+ qualifying receipt — is therefore unreachable by any
  lawful state, its focused "unlocks" proof cannot be built inside the runtime allowlist, and
  shipping the gate would permanently lock all Matters-of-State decisions for career players.
- HALTED per the standing law: D409 records the boundary, four options, and the option-1
  recommendation (planning-first reachability: citation-grade multi-year service bounds on
  documented replacement records, the narrow src/37 adapter carry, and the authored nashville-1864
  ladder). No runtime, probe, data, or generated byte moved; plan 19/19; coordination plans
  155/155; suite 130 row 38; `_SAVE_VER=1`. LANE-005 returned to CONTRACT/unowned, blocked on
  Aaron's D409 resolution.

## D408 WAR-CAREER SLICE E — Matters of State contract shipped — 2026-07-16 (D408)

- Selected only `nationalDecisions` / Matters of State after inventorying President, H0,
  decision, cabinet, Command, and resource mutation paths. The decision family is the smallest
  complete rung because both visible surfaces and direct mutation converge in `src/32-decisions.js`.
- Locked access to reconstructed current-person General Command plus a latest qualifying canonical
  receipt with `battleYear >= 1864`. Locked pending cards visibly defer; teaching remains readable;
  direct `decResolve` must guard before `_decApply`; legacy/no-career remains byte-equivalent.
- Added D408 §17, five negative-bind contracts, an exact runtime allowlist, and fail-closed planning
  teeth. No runtime, generated, data, Command, T2/T3/Auto, After Action, or save-version byte moved.
- Gates: plan 19/19; thirteen coordination plans 155/155; build GATE OK; suite 130 with War Career
  row 38; pinned hashes unchanged. D398 remains the latest full release battery.

## D407 WAR-CAREER SLICE D — bounded high-command relationship memory shipped — 2026-07-16 (D407)
- Continued from clean pushed D406 `2ab95ba3459d77a655f1db35dc6e14dec5d06189` through the
  ledger-only LANE-005 take `d9f765ec25c47cbc6577743fe895e13013c31522`. The implementation
  stayed inside 106/37, the focused War Career probe, the 19-row plan transition, generated output,
  and canonical docs. Command runtime/probe, T2/T3/Auto, After Action composition, data, manifest,
  suite manifest, frozen base, save version, combat, and politics did not move.
- One qualifying current-person alive result produces matching event/credit
  `cw_war_career_relationship_signal_v1` copies against the exact active same-side Army Register
  `army commander`. Sanitation dedupes the pair and rebuilds `cw_war_career_relationship_edge_v1`
  under `command-general-v1|<targetId>`; saved maps and scalars are never authority. Personal and
  remembered rapport independently clamp to `-8..8`; 24 edges and four newest history rows bound
  save growth. D407 emits only `emergent-timeline`, `Your Timeline`, and empty sources.
- COMRADE HAND-OFF leaves successor Personal rapport at zero and classifies exact predecessor
  lineage only as Remembered network. The AAR renders exact target, signed personal/remembered
  values, newest code, and timeline label with semantic text at 200% zoom. Relationship state has
  no combat, winner, score, AI, reinforcement, OVR, source, command-projection, politics, resource,
  or balance effect.
- Four source-only binds matched their declared scopes. A removed the sole producer and reddened
  only row 1. B disabled event/credit pair dedupe and reddened only row 1. C changed the producer to
  unsupported historical authorship and reddened only row 2. D moved predecessor memory into
  successor-personal rapport and reddened only row 4. Each inverse restored exact source/generated
  MD5s before rebuilt War Career and Command green reruns.
- Final focused/adjacent proof: War Career **42/42 browser + 29/29 static**, Command **94/94**, plan
  **19/19**, loot 12, save 16, full campaign 4, campaign link 19, After Action 15, H0 three
  viewports, playstyle 14, Auto 10, officers 20, ratings 22, and Classic paint; all processes exited
  0 and all enforced error/pageerror/realError/failure arrays were empty. Classic's non-enforced
  sample retained only the two standing optional-resource 404s with `ok:true` / `nonBlank:346`.
  All thirteen relay-sensitive plan probes total 155/155.
- Final MD5s: source tree `13544d1904aaa1ff3ade0c6deaa2f2d5`; 106
  `adc2dd9583c85cde86bbfb142cb6d666`; 37 `d9bc846734683c4ebcb00babbcc161ab`; focused probe
  `23e67503bed073d46f9f31ff3b715012`; Command `8f12c49f7129b3a9be0203677822e048`;
  Command probe `5ffd40fd221179f2e01cad59ef43bf7d`; HTML
  `502aee3fc5867b970225a59c06cd6102`; frozen base `c9db83fa99230ffb95bdfdfe059f3fb9`.
  Baselines remain 24/54/1512/24/130, sweep 24, War Career row 38, and `_SAVE_VER=1`. D398 remains
  the latest full release battery; `npm run vet:noreg` was not run. LANE-005 returns to
  CONTRACT/unowned. Exact next is a separate Slice-E late-war political-pull take; Slice E was not
  started in D407.

## D406 WAR-CAREER SLICE C — ledger advancement, billets, and bounded command projection shipped — 2026-07-15 (D406)
- Continued from pre-take D405 boundary `22180f80a04482ef742c5949f0d7f8d4a3be45d1` and the pushed
  LANE-005 take `60430009308eb885a5b5f07c0f6abb1af59cfb6c`. The implementation stayed inside
  106/37/35, the two focused probes, the 19-step plan transition, generated output, and canonical docs.
- Shipped deterministic Inferred scoring `4/+3`, `3/+2`, `1/0`, `0/-1`; reconstructed merit
  `0..128` and reputation `-64..96`; threshold `4*(prior promotions+1)` with reputation at least zero;
  one-step rank progression through Brig. Gen.; and journey-owned reconstructed billets. Exact
  Chancellorsville→Vicksburg→Gettysburg→Chickamauga mapping reaches merit 16 / reputation 12 /
  promotions 4 without moving canonical Captain rank, source slot, service year, or OVR 65.
- Field/general command is a pure pull: projections `min(2,1+floor(rep/4))` and
  `min(4,2+floor(rep/4))`, global cap 4, consumed exactly once before the existing `42..88` clamp.
  `C.loot.journey` remains the player owner; `P.command` remains NPC-owned and byte-separate.
- Four binds bit only their declared rows: A missing consumer (`55/55`), B doubled consumer
  (`63/63`), C forbidden player-ledger alias under `P.command`, and D captured-status leakage
  (War Career sanitation plus Command zero compatibility, `79/83`). Each inverse restored exact MD5s
  before rebuilt War Career `38/38` and Command `94/94` reruns.
- Final browser gate: War Career 38, Command 94, loot 12, save 16, full campaign 4, campaign link 19,
  After Action 15, H0 three viewports, playstyle 14, Auto 10, officers 20, ratings 22, and Classic
  visible/nonblank; all processes exited 0 and all present error arrays were empty. War Career plan is
  `19/19`; suite registration is exactly 130 commands with War Career row 38. Responsive and 200%
  War Career/After-Action captures were visually inspected and decode cleanly. After lane release,
  all thirteen coordination-sensitive plan artifacts passed `155/155` named rows with empty errors.
- Final MD5s: 106 `d54ad18271de8d2af33be909be8251ed`; 35
  `8f12c49f7129b3a9be0203677822e048`; 37 `4221eb61fee1c209ebc85d2fc1636a17`;
  War Career probe `c19cffcba98e356faf2679076aa798b8`; Command probe
  `5ffd40fd221179f2e01cad59ef43bf7d`; generated HTML `32dcc03e25e080aa4e7addd26a1c5f99`;
  frozen base `c9db83fa99230ffb95bdfdfe059f3fb9`. D398 remains the latest full release battery;
  `npm run vet:noreg` was deliberately deferred. LANE-005 returns to CONTRACT/unowned. **Exact next:**
  a separate committed Slice-D take for bounded, provenance-bearing relationship memory and its small
  event-code transition set; no relationship runtime has started.

## D405 WAR-CAREER RECEIPT CONTINUITY — dual-reference v2 runtime shipped; Slice C still locked — 2026-07-15 (D405)
- Took LANE-005 in ledger-only commit `7ed5c52dac2d52b3d903e88378918132c3406181`
  from the clean pushed D404 boundary. The implementation stayed inside `src/106-war-career.js`,
  `src/37-loot-survival.js`, `tools/probe-war-career.mjs`, and the narrow 19-step plan transition.
- Added named/coexisting v2 result and participation receipts for Classic later-rung mappings.
  D401 same-source v1 receipts retain their exact shape, ids, validation, and sanitized bytes;
  malformed v2 cannot fall back to v1. T2, T3, and Auto remain unchanged.
- The result binds independently reconstructed canonical `sourceRef` and Inferred “Your Timeline”
  `timelineAssignmentRef`. The exact Haley Gettysburg→Chickamauga fixture qualifies once at rung 16;
  canonical source identity remains Gettysburg, and every wrong/stale/foreign/service/grade/label/
  provenance variant fails closed.
- V2 reuses the existing consequence-only fate, one-credit, recovery, and hand-off path. It grants no
  rank, role, billet, merit, reputation, promotion, command, combat, politics, relationship, or archive
  authority. Hand-off can use only the successor's own exact assignment.
- Corrected replacement service-year reconstruction to use each authored replacement row's year, not
  the mutable campaign clock. Replacement application remains 39/39 and Army Register 1512.
- Focused gate: War Career **34/34 browser + 29/29 static**, zero pageerrors/realErrors; loot 12/12;
  save slots 16/16; command 90/90; full campaign 4/4; all artifacts read green with empty error arrays.
  Build GATE OK; HTML `74d5abd5196f7bdd7998e4d84573a925`; base unchanged.
- The final NEVER→MAY bind made only `SOURCE VS YOUR TIMELINE` red at 18/19 and exit 1. Restore
  returned design/probe md5s `e451043b73ad2624d5d4f9cc2131eaa0` /
  `036a1e53cbd6a6dcfbf80cef0b60b1d7`, then 19/19 green.
- Final lane-release evidence: all thirteen coordination-sensitive plan probes passed **155/155 named
  rows** serialized and every artifact was read green. The earlier 192 number belongs only to D398's
  24×8 scenario sweep. Full `npm run vet:noreg` remains deferred under D160/D176; D398 is the latest
  release checkpoint. LANE-005 returns to CONTRACT/unowned. Exact next is a separate Slice-C take.

## D404 WAR-CAREER RECEIPT CONTINUITY — coexisting v2 contracted, runtime still locked — 2026-07-15 (D404)
- Aaron permits alternate history for gameplay, with a strict display/evidence split: canonical Army
  Register source history stays immutable; authored divergence is labeled “Your Timeline.”
- LANE-005 was taken planning-only in ledger commit
  `f82b38f` from clean pushed D403. The thirteen plan probes were read green at **146/146** before
  contract work.
- Compared additive-v1 against named/coexisting-v2. V2 won because it leaves D401's flat v1 shape,
  result ids, same-source-rung validation, and sanitized bytes exact while schema dispatch makes
  malformed hybrid receipts fail closed. `_SAVE_VER=1` and `careerVersion:1` remain exact.
- Contracted independent `sourceRef` and `timelineAssignmentRef` validators, result identity bound to
  both, one immutable exact-id mapping input, one mutable owner in `C.loot.journey`, eager idempotent
  sanitation, one credit per rung across schemas, and zero hand-off transfer of mapping/authority.
- Pinned the exact alternate-timeline proof:
  `person_gettysburg_us_17me_haley` at `ss:gettysburg:US:us_birney_iii:pvt` / US rung 15 maps only
  under “Your Timeline” to `ss:chickamauga:US:us_harker_rock:pvt` / rung 16, both 1863,
  `assignmentId=wcta-1pav4ac`, `timelineGrade=Private`, provenance `Inferred`.
- Extended the plan probe from 10 to 19 named runtime-mode rows without changing the original ten.
  The surgical NEVER→MAY bind exited 1 with exactly `SOURCE VS YOUR TIMELINE` red and 18 green;
  inverse restore returned design/probe md5s `c81d5e1641a4d20282a965c8344bb5d3` /
  `485760cdffe8a7beaff229b08514d099`, then 19/19 green. The guard also pins the complete
  `src/` tree and rejects changed/nonignored-untracked paths outside the eleven planning files.
- No runtime, data, generated-game, base, tactical, command, manifest, suite, or save-version byte
  moved. Exact next is the receipt prerequisite in three runtime/proof files plus the narrow plan-
  guard completion transition. Slice C and every later seam remain closed. Full `npm run vet:noreg`
  remains deferred; D398 is still the latest full release checkpoint.
- Final released-lane gate: all thirteen plan probes passed **155/155** serialized named rows; every
  JSON had `ok:true`, and every present error array was empty. The D398 24×8 sweep is the separate
  192-row artifact.
  Build printed `GATE OK`; `git diff --check` passed; the 11-file planning allowlist and every locked
  hash/baseline were exact.

## D403 WAR-CAREER RECEIPT CONTINUITY — option 1 selected, receipt-schema HALT — 2026-07-15 (D403)
- Aaron selected exact stable-id cross-rung service assignment. LANE-005 was taken planning-only in
  ledger commit `9fa199c89ed11bd995fc988d00f4fed0076b5667`; all thirteen coordination-sensitive
  plan probes and artifacts were green after the take.
- The six-seam inventory proved D401's `explicit-career-assignment` is a same-result source-slot to
  field-unit representation created only after `_wcActiveLink` accepts the person's immutable source
  battle as the live rung. It has no future target slot or result-independent assignment authority.
- The result builder, runtime participation validator, and save sanitizer all use the same receipt
  battle/unit/slot tuple for both canonical Army Register identity and current campaign-rung proof.
  A cross-rung assignment cannot pass while that receipt remains unchanged.
- The opener's receipt-change HALT fired before the option-1 contract, added plan teeth/bind, or any
  runtime/data/generated/base/save-version edit. The planning probe therefore remains its shipped
  10-step runtime-mode guard.
- Recommendation: authorize a second planning-only slice for a dual-reference receipt contract:
  immutable canonical source reference plus exact journey-owned “Your Timeline” assignment reference,
  with the result id binding both and eager idempotent fail-closed sanitation at `_SAVE_VER=1` or
  HALT. Source-battle-only assignment is safe but cannot progress; rewriting/aliasing source history
  is rejected. LANE-005 returns to CONTRACT/unowned pending Aaron's explicit decision. Full
  `npm run vet:noreg` remains deferred.
- Final docs-only gate: plan-probe syntax clean; all thirteen coordination-sensitive plan probes
  **146/146** with every JSON read and no red/error array; War Career plan 10/10 runtime mode; build
  `GATE OK`; diff check clean. HTML `4560dfc4f22b5907429e6a5c7d303e4f`, base
  `c9db83fa99230ffb95bdfdfe059f3fb9`, runtime 106 `c69f405c0469abe7eca67fc0fff99575`,
  journey 37 `d526f33a7649d378d2062b931b933884`, command 35
  `55bd7b5a30f22470e1abd7a993b3cbb4`, focused War Career
  `54e6a095eb81095ede3d46e5bd523f62`, and command probe
  `bbfeaa69db333fddee2741882abff245` remained exact. The deferred nine-tooth option-1 negative bind
  was not run because the mandated HALT preceded its creation.

## D402 WAR-CAREER SLICE C — reachability contradiction, runtime HALT — 2026-07-15 (D402)
- Took LANE-005 in ledger-only commit `f891f3862e14411133d90dc874a6eaa0fd29d0f9` after a clean fetch/status/hash gate. All thirteen plan probes and artifacts were green before the push.
- The live seam inventory proved that D401's exact source-battle identity cannot qualify on a second campaign rung. `_wcActiveLink` and `_ssCareerParticipation` require the canonical person's one `unitRef.battleId` to equal the live scenario; both chains contain only unique scenario ids (US 31/31, CS 28/28).
- COMRADE HAND-OFF chooses a same-battle successor after that rung's qualifying credit is immutable. Retry cannot award again, and advance makes the successor's source battle stale. Private-through-Captain v1 starts therefore have no legal route to the required valid general-command case.
- HALT fired before any D402 balance law, runtime, focused-probe, generated-game, base, data, combat, command-ledger, or save-version edit. The untouched focused guard remains 25/25 plus 21/21 static with zero pageerrors/realErrors.
- `DECISION-NEEDED-war-career-receipt-continuity.md` records the fork. Recommendation: a planning-only exact cross-rung service-assignment contract using stable person and future scenario-unit ids, with no name/rank guess or second identity owner. Single-receipt multi-rank jumps and high-rank starts are shortcuts that do not solve continuity.
- LANE-005 returns to CONTRACT/unowned. Baselines remain 24/54/1512/24/130, sweep 24, suite row 38, `_SAVE_VER=1`, HTML `4560dfc4f22b5907429e6a5c7d303e4f`, and base `c9db83fa99230ffb95bdfdfe059f3fb9`. Full `npm run vet:noreg` remains deferred under D176.

## D401 WAR-CAREER SLICE B — explicit participation, pure fate, deterministic comrade hand-off — 2026-07-15 (D401)
- Took LANE-005 from the clean pushed D400 boundary in ledger-only commit `cbfe533f02e86f784823bcc730bbc5a36a221dc4`, reran all thirteen coordination-sensitive plan probes green, and pushed the lock before runtime work. The authoritative checkout remained `/private/tmp/codex-vg-recovery-019f62fe`; the largely `compressed,dataless` Desktop checkout was never touched.
- `src/106-war-career.js` now owns result-scoped participation receipts, pure preflight fate, post-undo commit, capture recovery, candidate selection, and hand-off. `src/37-loot-survival.js` canonically sanitizes receipt ownership, recovery, handoff, and strict A→B lineage. Narrow consequence-only seams in `src/tactical/T2-campaign-link.js` and `src/tactical/T3-officers.js` carry realtime result metadata and exact authored officer ids; no `src/87-auto-resolve.js` change was required, no evidence feeds simulation, and no no-career byte moved.
- Auto, Classic, and realtime all produce one explicit result-owned receipt binding run, credit rung, mode, Army Register person, canonical unit slot, represented field unit, mapping/assignment, battle/year/side, and result-time rank. Classic's deterministic assignment exists only where its R# roster lacks the historical unit id. Auto and realtime share T2 handback. Realtime command fate additionally requires the selected person id to equal exactly one authored officer row's own `pid` on the exact source unit. Names, surnames, proximity, rank guesses, aliases, aggregate casualties, same-unit lookalikes, procedural commanders, stale/wrong-side/ambiguous/duplicate evidence, and unarrived officers all fail closed.
- Fate is classified before delegation and the complete token is carried through the existing `_t1Resolve → lootOnResolve → ssJourneyOnResolve` path, then committed after undo capture without recomputation. Career-Ironman fallen reuses D400's only terminal dispatcher. Normal fallen leaves the campaign live and enters COMRADE HAND-OFF. Captured status is absorbing until a later distinct nonparticipating campaign rung records one same-person, exactly cross-linked recovery; that rung is frozen against better retries.
- Comrade candidates are canonical Army Register people who are alive/present, same-side, unique by person and slot, provenance-bearing, in any known service window, outside lineage, and inside the last qualifying result's most specific stable company/regiment/brigade hierarchy. Stable order is hierarchy distance, documented-before-generated provenance, result-time rank distance, then person id; only five persist. Save/load recomputes against the qualifying owner receipt, never mutable display fields. Acceptance freezes the prior identity in a strictly chronological lineage, activates exactly one successor with that person's own snapshot, and copies no rank, OVR, wound, merit, reputation, or personal history. No candidate ends honestly; reload/recovery cannot reroll or mint credit.
- Three independent read-only audits returned NO BLOCKER after hardening exact realtime PID/source-unit matching, result-owned receipt equality, capture-recovery cross-links, canonical service/hierarchy recomputation, and strict multi-hop lineage adjacency. Qualification remains one receipt per `creditKey`; fate/recovery/handoff/retry/load award no merit or reputation. Billets, promotion authority, relationships, politics, franchise state, and `warCareerCommandProjection()` remain zero/empty for Slice C.
- Four apply-patch negative binds proved independent teeth and every restore returned exact hashes. Person-id inversion: exit 1, 12 declared participation/fate/handoff dependents red, 13 unrelated rows green. Preflight sentinel: exit 1, seven ordering/fate/commit/handoff dependents red, 18 unrelated rows green. Lineage exclusion removal: exit 1, exactly `COMRADE ORDER + EXCLUSIONS` red, 24 green. Aggregate-only fall: exit 1, exactly `AGGREGATE CASUALTIES NEVER NAME FATE` red, 24 green. Every bind artifact had zero pageerrors/realErrors.
- Final serialized gate: syntax checks green; build GATE OK; plan 10/10; War Career 25/25 plus 21/21 static, zero pageerrors/realErrors; loot 12/12 at Army Register 1512; save slots 16/16; full campaign 4/4; campaign link 19/19; After-Action 15/15; H0 After-Action desktop/tablet/phone green; playstyle 14/14; Auto 10/10; officers 20/20; ratings 22/22; Classic canvas visible/nonblank; suite exactly 130 with War Career row 38 and `_SAVE_VER=1`. Console readback contains only the established AudioContext, WebGL ReadPixels, and inherited optional-resource 404 diagnostics. All thirteen final relay-sensitive plan probes are green; baselines remain 24/54/1512/24/130 with sweep 24.
- Final hashes: generated HTML `4560dfc4f22b5907429e6a5c7d303e4f`; frozen base `c9db83fa99230ffb95bdfdfe059f3fb9`; 106 `c69f405c0469abe7eca67fc0fff99575`; 37 `d526f33a7649d378d2062b931b933884`; T2 `feef8a3c1ecf5fb28a120d2398ee61fc`; T3 `56e2cd1060a40eb0754b19e8d56bacdb`; focused probe `54e6a095eb81095ede3d46e5bd523f62`. Full `npm run vet:noreg` remains deferred under D176; D398 remains the latest complete 129/129 release checkpoint. LANE-005 returns to CONTRACT/unowned. **Exact next:** fresh committed Slice-C DRIVE take for billet history plus the narrow `warCareerCommandProjection` adapter only, proving player/NPC reputation and promotion ledgers remain isolated and command effects are never double-counted.

## D400 WAR-CAREER SLICE A — minimal spine + honest Ironman terminal loss — 2026-07-15 (D400)
- Shipped ordinary post-105 `src/106-war-career.js`, narrow journey/AAR/save-slot adapters in 37/82/91, manifest registration, and suite-enrolled `tools/probe-war-career.mjs`; release suite 129→130. `C.loot.journey` remains the sole mutable person-career owner and `_SAVE_VER=1`.
- New v1 start is explicit, Private-through-Captain, stable-team, and same-side beside untouched D360 legacy Journey. The idempotent sanitizer carries `runId`, six legal statuses, a 96-row event ring, and a finite credit ledger. Every Slice-A observation is nonqualifying and awards zero merit, reputation, promotion, or authority.
- Closed E71 with one pure-first predicate: Ironman + campaign battle + non-draw + nonplayer winner. Terminal loss delegates nothing, writes no stats/roster/system/reward/recovery/undo/live-save/upgrade state, removes autosave/undo and only validated matching-run named slots, preserves unrelated/malformed storage, clears the campaign, renders once, and has no Continue. Every normal win/draw/loss/free battle delegates byte-for-byte.
- Focused runtime gate is 12/12 with zero pageerrors. Adjacent loot, save-slot, campaign-link, full-campaign, After-Action, H0 After-Action, and playstyle probes preserve their prior contracts. The plan probe enters runtime mode at 10/10; baselines remain 24 scenarios / schema 54 / Army Register 1512 / coverage 24 / sweep 24, with suite 130 and frozen base `c9db83fa99230ffb95bdfdfe059f3fb9`.
- Independent audit hardening rejects person-state aliases and foreign credit tuples, safely normalizes explicit replacement aliases, preserves matching alternate ranks, collision-checks saturated event ids, compares whole terminal inputs, proves undo-before-career order, and aligns truthy imported Ironman slot blocking.
- Four negative binds proved distinct teeth: dispatcher-off made exactly three focused integration steps red; one qualifying-credit tamper made exactly the ledger step red; `B.playerSide`→`C.side` made exactly `PURE TERMINAL CLASSIFIER MATRIX` red; journey-marker removal made exactly focused `STATIC REGISTRATION + WALLS` and plan `IMPLEMENTATION LADDER` red. All apply-patch restores were hash-identical.
- The final coordination-sensitive sweep caught one honest stale pin in the Women-in-War plan probe: its current release-suite expectation moved 129→130 while the D397→D400 history remained explicit. All thirteen lane-sensitive plan probes then passed, including War Career in runtime mode.
- No combat input, historical data, political engine, relationship, command effect, personal fate, franchise archive, or save-version movement. LANE-005 returns to CONTRACT/unowned. **Exact next:** a fresh Slice-B DRIVE take for explicit person↔unit participation plus pre-delegate personal fate and deterministic same-unit COMRADE HAND-OFF only.

## D399 WAR-CAREER PLANNING CONTRACT — one canonical owner, terminal honesty first — 2026-07-14 (D399)
- Took new LANE-005 in ledger-only commit `499c405fab0a528ec257a96785b043429c64cd21` at the clean pushed D398 boundary; all twelve relay-sensitive plan probes passed after the take.
- Three read-only inventories mapped Soldier's Story/Army Register, command/politics/AAR, and save/death/Ironman. A separate adversarial critic caught eleven contract defects before runtime, including the journey whitelist erasing new fields, the nonexistent result argument, too-late personal-death discovery, wrapper/undo ordering, terminal-save resurrection, unbounded retry ids, and retry-farmed political dates.
- Shipped planning artifacts: `docs/design/war-career-loop-design.md` md5 `8fdd062c084d8953ff042c3cf904af1c` and `tools/probe-war-career-loop-plan.mjs` md5 `b4957c1360b55767cb5b6bac5b1fdb57`. The probe is filesystem-first, fail-closed, future-dual-mode, never suite-enrolled, and green 10/10 in planning mode.
- Contract: `C.loot.journey` remains the sole mutable person-career owner; Slice A must change the live 37 whitelist under `WAR_CAREER_JOURNEY_ADAPTER_V1` and add post-105 `WAR_CAREER_RUNTIME_V1` without a declaration override. D360 legacy Journey remains; new War Career opt-in is Private-through-Captain with a stable same-side team. The bounded event ring and finite credit ledger are separate; all Slice-A rows are nonqualifying.
- E71's one terminal predicate is an Ironman campaign battle, non-draw, won by the nonplayer side. Classification is pure before delegation; nonterminals preserve the earlier undo wrapper and commit only in the normal resolution seam. Terminal storage removes autosave/undo, invalidates matching-run slots only, preserves unrelated slots, clears the campaign, and exposes no Continue path.
- Bind: changed only canonical owner `journey`→`career`; exactly `STATE OWNERSHIP` failed with exit 1; apply-patch restore returned spec md5 `8fdd062c…` and 10/10. Build printed GATE OK; HTML stayed `e6699829…`; base `c9db83fa…`; 24/54/1512/129 and `_SAVE_VER=1` held; diff check clean.
- LANE-005 released to CONTRACT/unowned. **Exact next:** fresh committed DRIVE take, then §10 Slice A only (106 + narrow 37/82/91 adapters + focused suite probe 129→130). No personal death, qualifying merit, relationships, politics, command effect, franchise archive, combat input, or save-version movement.

## D398 PETERSBURG RELEASE CHECKPOINT — 129/129 green, teardown root-fixed, lane released — 2026-07-14 (D398)
- D397 candidate `97082fc74e2ae27318684f1f325512a546f58ef9` passed the full serialized manifest across two logs: commands 1-78 green, then Presets wrote green evidence but timed out in teardown; the exact-label resume passed commands 79-129 and ended `VET NO-REGRESSION OK — 51 commands`. Unique coverage is **78+51=129/129**.
- Independent artifact audit read **128 JSON + 149 PNG + 4 JPEG + 1 schema HTML = 282 artifacts**. All JSONs parse and are clean; all 153 images decode; schema 54/54; Army Register 1512; sweep 24×8=192 with `failures:[]`; zero failed steps/pageerrors/realErrors.
- Presets' post-green Playwright close callback is now bounded locally. Gettysburg's suite pass was 19/19 but took 357.9s, so it received the same terminal-only cleanup before becoming the next timeout. Final repaired standalone runs exited naturally: Presets 27/27 in 99.65s; Gettysburg 19/19 in 59.30s; zero pageerrors. No tooth or timeout was weakened.
- D397 gameplay/data/simulation/generated-game bytes and hashes remain unchanged; Petersburg stays city 8/8 and US-higher-loss 7/8 at 24/54/1512/24/129. The schema-report timestamp-only churn was restored.
- **Aaron authorization:** qualifying Tripo Free/public CC BY 4.0 outputs may be used for this personal, noncommercial game, with retained attribution and no paid credits or support-ticket clearance. No asset or slot shipped; every actual file still owes all importer/license/geometry/optimization/browser/performance/visual gates.
- `/private/tmp/codex-vg-recovery-019f62fe` remains the trusted materialized checkout; the Desktop checkout remains largely `compressed,dataless` and must not be overwritten or pulled across. LANE-003 returns to CONTRACT/unowned. Next: D382 item 4 war-career **planning contract only**; Cold Harbor remains deferred.

## D397 PLAYABLE PETERSBURG INITIAL ASSAULTS — interrupted Claude run recovered, focused gate green — 2026-07-14 (D397)
- Claude Code / Fable authored the D396 runtime, honest A/B, and binds before an interrupted session left `fileproviderd` suspended and the Desktop checkout `compressed,dataless`. ChatGPT/Codex resumed the provider, recovered exact edits/results from three Claude journals and the stable final hashes, replayed the candidate over clean `origin/main` in `/private/tmp/codex-vg-recovery-019f62fe`, and independently reran the focused gate and both binds. No source/history/balance contract changed during recovery.
- **Playable shape:** scenario 24 at menu rank 69, single phase June 15-18, US attacker / CS defender, fog off; objective behind the Dimmock Line; US 55,540 / CS 27,460; opening 14,880 / 4,620; 26 ids; guns 28/38; ten cards; exact rank, scope, USCT-dignity, Classic, rail, and D74 walls from D396.
- **Honest A/B:** baseline city 5/8 / US-higher-loss 0/8. Prepared-line entries first regressed to 0/8 / 0/8; seed 19 exposed the rout/capture gap. Final-line cover alignment and the enumerated final inputs (hold 220→240, re-formed guns 18→24 with crew 540 fixed, veteran Hoke/Johnson xp, exact wall positions, militia on the center line) produced surviving intermediate 6/8+6/8 and 7/8+6/8 candidates. Final byte-stable candidate: **city 8/8, US-higher-loss 7/8**, all CS timeout wins; seed 31 is the honest direction exception.
- **Integration:** scenarios 24 · schema 54 · Army Register 1512 · coverage 24 · suite 129 · sweep 24. All ten insertion reshapes and all chronological pin histories landed. Final hashes: data `5534c670…`, focused probe `9025eb75…`, T1 `6281fba3…`, T10 `9090a9be…`, generated HTML `e6699829…`, frozen base `c9db83fa…`.
- **Binds:** registry removal made exactly the declared four focused integration teeth plus plan `FUTURE DIRECTION + INTEGRATION` red, direction green; Beauregard `Gen.`→`Lt. Gen.` made exactly focused `RANK WALL` plus plan `RANKS + COMMAND TRAPS` red. Both apply-patch restores were hash-identical and both probe pairs reran green.
- **Focused gate:** syntax clean · GATE OK · schema 54/54 · research 15/15 · Petersburg plan/runtime 12/12·15/15 · all eleven prior plan probes · Spotsylvania 16/16 · Wilderness 15/15 · Kennesaw 11/11 · Chattanooga/Five Forks 16/16 · roster 8/8 · builder 15/15 · loot 12/12@1512 · flags 48/48 · weather 30/30 · Intel 26/26 · media 13/13 · manifest 129 · 27 JSON artifacts clean · 18 images decode · 0 pageerrors/realErrors · diff check clean. Four heavy-scene screenshot captures carry only the established non-fatal 5-second warning.
- LANE-003 is VERIFY under ChatGPT/Codex. **Sole next action: the complete 129-command `npm run vet:noreg` battery alone, then artifact audit and release.** No war-career or other queue item starts first.

## D396 PETERSBURG INITIAL-ASSAULTS PLANNING CONTRACT — spec + plan probe, no runtime — 2026-07-14 (D396)
- Claude Code / Fable took LANE-003 DRIVE at clean D395 HEAD `d099082` in ledger commit `9db61f7` (all eleven plan probes ALL OK after the lane edit), then executed the D395-named planning slice whole: research-verify first, spec + plan probe second, runtime excluded.
- **Research:** two workflows, 10 agents, 0 errors — 4 Sonnet/medium gatherers (140 claims) → 2 Opus/high default-refute verifiers → 1 Opus/high completeness critic, then a 3-agent gap pass (53 claims → 1 Opus/high refuter). Combined **189 CONFIRMED / 4 ADJUSTED / 0 REFUTED / 0 UNSUPPORTED**. The yield shipped as the attrition packet's §14 addendum (commit `203343e`, research probe 15/15). **The packet's redundancy flag is DISCHARGED:** the honest shape is a defender-reinforcement race (2,200 on the Dimmock Line June 15 growing to 20,000+ by June 18, against 15-16,000 growing to 67,000) with the USCT proving ground (Baylor's Farm + the battery captures, 378 casualties, two-family) — not a static assault-on-works; only June 18 resembles the sibling battles, as the consequence of the lost race.
- **Contract:** `docs/design/petersburg-initial-assaults-battle-build-spec.md` (md5 `277e6754d66e619a8bf63bc0b7ca65b9`) + `tools/probe-petersburg-initial-assaults-plan.mjs` (md5 `0886f6abc4606ba7d28fc55d1692cdc7`, 12/12 dual-mode, filesystem-first, fail-closed). Locked: standalone single phase June 15-18, 1864; id `petersburgAssaults` at future rank 69; US attacker / CS defender; objective = the city ground BEHIND the Dimmock Line; fog OFF; THE REINFORCEMENT-RACE LAW (opening garrison strictly 2,200-5,400, every accession timed); THE CITY GUARD (CS holds ≥5/8) + casualty-direction US>CS ≥5/8; THE 11,386 SCOPE COLLISION named and taught; the full rank wall (Beauregard full General the bind anchor; Smith's restored commission; Willcox's refute-confirmed anachronism; Dearing's unconfirmed commission; Kershaw/Gibbon legitimately MGs — the Wilderness locks reversed; the Lee-late-arrival, VI-Corps-absence, and Pickett/Bermuda-Hundred walls); TEN named reshape obligations + the 13-site 1434 pin-bump grep for the future runtime insertion at rank 69.
- **Bind:** the one-token Beauregard `Gen.` → `Lt. Gen.` tamper bit EXACTLY `RANKS + COMMAND TRAPS` (11/12, exit 1); restore md5-identical; rerun 12/12 with artifact ok=true, 0 pageerrors.
- **Gate:** node --check clean · build GATE OK with HTML byte-identical `4fc16d81…` · schema 53/53 (one transient Node read-fault on first invocation, identical re-run green, timestamp-only artifact churn restored to HEAD) · research 15/15 · Petersburg plan 12/12 · all eleven prior plan probes exact · suite list 128 · `git diff --check` clean · runtime-scope diff EMPTY. A phantom-dirty stat-cache flap (the D394/D395 class) was proven all-ghost via content diffs. No A/B (no simulation input); no vet:noreg (D394 discharged the checkpoint); no browser.
- LANE-003 released to CONTRACT/unowned; next: the playable Petersburg initial-assaults runtime under a fresh committed DRIVE take, then the war-career loop (D382 item 4).

## D395 POST-WILDERNESS LADDER BOUNDARY DECISION — docs only — 2026-07-14 (D395)
- The D394 decision-only checkpoint is resolved with Aaron via recommendation-first popup Q&A from the clean pushed `798398ae` boundary. Both questions were presented strictly on the attrition packet's evidence hierarchy; no new candidate was invented and no verdict upgraded.
- **Decision 1:** D382 item 3.5's Petersburg trench treatment is **NAMED — the initial assaults of June 15-18, 1864 (the Dimmock Line), spec-first in a later planning lane, runtime excluded** (Aaron declined the recommended explicit waiver). The future spec lane owes: a fresh June 15-18 research pass (the packet pins no division-grain OOB/strengths/casualty splits for these dates), discharge of the packet's redundancy flag or HALT, the Beauregard-full-General and Grant-Lt.-Gen. traps, scope walls excluding the Crater/NMH/Fort Stedman/April 2, D74 no-fudge, and two-source verification for any USCT combat claim.
- **Decision 2:** **Cold Harbor is DEFERRED** (the recommendation adopted) — packet-High supports future consideration but does not authorize silently expanding the D382 ratified order; it remains READY_FOR_SPEC, insertable only by an explicit Aaron reorder.
- Docs-only sync across DECISIONS/RUN-LOG/HANDOFF/WAKE-UP/AUTONOMOUS-RUN/START-HERE/V1-CHECKLIST/COORDINATION; LANE-003 stays CONTRACT/unowned with the resume pointer now targeting the Petersburg initial-assaults planning contract under a fresh committed DRIVE take, then the war-career loop (D382 item 4). No runtime/data/tool/probe/simulation/generated file moved; all D394 locks held (23/53/1434/23/128, sweep 23, HTML `4fc16d81…`, base `c9db83fa…`).

## D394 WILDERNESS RELEASE CHECKPOINT — 128/128, every artifact audited — 2026-07-14 (D394)
- D393 runtime commit `e58d9e5` passed all 128 unique manifest commands, serialized and alone, in exact-label evidence segments **17 + 102 + 9**: `.tmp/vet-no-regression-2026-07-14T04-58-57-901Z.log`, `.tmp/vet-no-regression-2026-07-14T05-28-45-831Z.log`, and `.tmp/vet-no-regression-2026-07-14T08-09-22-269Z.log`.
- The first `disease medical` execution wrote a fresh green 8/8 artifact and screenshot with zero pageerrors, then timed out during Chromium cleanup. No orphan remained; the exact probe reran standalone green and the wrapper-owned exact-label resume was also 8/8 with a clean exit. No code change was needed.
- Five Forks exposed one stale whole-registry safety-net pin: runtime count 23 and rank 85 were correct, but its probe still expected count 22 and called the battle scenario 19. The narrow root fix moves only that label/count to 23, preserves the D388/D391/D393 transition history, and leaves every OOB/relief/direction/runtime tooth intact. Focused and exact-label reruns are 16/16, zero pageerrors.
- Artifact audit: **127/127** expected JSONs fresh/parseable/clean; no failed steps, pageerrors, realErrors, or fatal findings; schema **53/53** with 53 data rows; sweep **23×8=184**, `failures:[]`; Army Register **1434**; manifest **128**. Images: **153 fresh outputs (149 PNG + 4 JPEG)**, 46/46 JSON-referenced outputs fresh, 12/12 referenced static inputs present, and the **165/165-file union** nonzero/correctly typed/decodable.
- D393 locks held: Wilderness junction 6/8, US-higher-loss 7/8; T1 `f913c4f9…`; data `7385a179…`; focused probe `376412e4…`; HTML `4fc16d81…`; frozen base `c9db83fa…`. Runtime/data/simulation inputs did not move.
- Final closeout gate: Five Forks syntax clean; build GATE OK; focused Five Forks 16/16 with zero pageerrors; all eleven plan probes green after the ledger edit; suite list 128. Repeated 16 KB short reads on unchanged plan/suite scripts were resolved by explicit materialization and worktree/HEAD blob verification before clean reruns (women-in-war 10/10; suite list 128); no source edit masked the storage fault.
- Standing notices only: 2.418 MB raw-embed soft warning; eight disabled/pending-license Tripo slots; known headless AudioContext/browser/optional-resource diagnostics, including boot's eight recorded diagnostics with `ok:true`/zero pageerrors and Classic's two optional-resource 404 console messages with required paint/JSON green. LANE-003 → CONTRACT/unowned. Next is a decision-only D382 boundary: Petersburg treatment vs explicit waiver to war-career, plus the separate open Cold Harbor reorder question.

## D393 PLAYABLE THE WILDERNESS — scenario 23, dual direction law green — 2026-07-14 (D393)
- ChatGPT/Codex took LANE-003 DRIVE at clean D392 HEAD `29d66fb` in ledger commit `beff166`, then implemented the D392 §11 integration as one runtime slice. Single phase, May 5-7 1864: CS attacks the US-held Brock Road / Orange Plank Road junction on the Plank Road axis. Eighteen unique ids field 23,580 US / 21,240 CS, 6/8 guns, twelve dense-woods regions, four Brock Road works, fog off, and ten cards plus the Eastern/Overland/Inconclusive codex. The Turnpike axis and Gordon's dusk attack remain teaching-only; the burning woods remain dignity teaching only.
- Honest A/B used seeds 3/19/31/47/73/109/223/401. First battery at hold 205: junction 4/8, US-higher-loss 7/8. The required one-seed trace found seed 3 held by the Union through ~t210, then a CS clock from ~t244 to the t449 hold win (losses 9,460/5,844). One eligible input moved, `holdToWinSec 205→240`. Final: junction **6/8**, US-higher-loss **7/8**. No other sim input moved; replay and passive termination pass.
- Integration: **23 scenarios · schema 53 · Army Register 1434 · coverage 23 · suite 128 · sweep 23**; menu rank 67; T10 E/true/anv. All six named reshape obligations passed: Kennesaw adjacency ×2, Spotsylvania adjacency ×2, and Spotsylvania's scope/file scans. Every whole-register pin carries D393 and retains D391 history. Frozen Classic/rail/base stayed byte-identical.
- Binds: registry removal made only the declared four focused integration teeth plus plan FUTURE-INTEGRATION red; Kershaw Brig.→Maj. made only focused RANK WALL plus plan RANKS red. Direction stayed 6/8+7/8 under Bind A. Restores matched T1 `f913c4f9…`, data `7385a179…`, HTML `4fc16d81…`; final focused probe `376412e4…`; spec/plan hashes unchanged.
- Focused gate green and artifacts read: syntax 21/21 · GATE OK · schema 53/53 · research 15/15 · plan 12/12 · Wilderness 15/15 · Spotsylvania 16/16 · Kennesaw 11/11 · Chattanooga 16/16 · roster 8/8 · builder 15/15 · loot 12/12@1434 · flags 48/48@23 · weather 30/30@23 · Intel 26/26 · media 13/13 · suite list 128 · all eleven plan probes. Fresh JSONs: ok true, failed/pageerrors/realErrors 0. Schema report has 53 rows; fresh images decode. Standing 2.418 MB soft media warning only.
- LANE-003 → VERIFY. The complete 128-command `npm run vet:noreg` release battery is the sole resume action and runs alone; no D382 successor starts before release.

## D392 THE WILDERNESS PLANNING CONTRACT — spec + 12-step plan probe, no runtime — 2026-07-13 (D392)
- Claude/Fable took LANE-003 DRIVE at clean `6840e9b` in ledger-only commit `fe740c2` (all TEN plan probes rerun ALL OK after the lane edit; the one commit beyond D391's `6c23082` is a docs-only CLAUDE.md trim, adjudicated as moving no task or decision number).
- Selection from the packet verdicts + the D382 order: D382's 3.5 names "Wilderness · Spotsylvania's Mule Shoe · a Petersburg trench treatment"; Spotsylvania is discharged; the Wilderness (packet Med-High) outranks every Petersburg treatment and carries no dignity fork — the ladder continues, the war-career loop stays next-after. SURFACED for Aaron: Cold Harbor ranks High in the packet but is NOT in the D382 3.5 lock.
- Research: 7 agents (4 Sonnet/med gather → 2 Opus/high default-refute, 82 verdicts → 1 Opus/high critic, 0 errors); the yield is the attrition packet's §13 addendum. Rank wall two-family: Kershaw BRIGADIER (MG June 2 — the bind anchor), Gibbon BRIGADIER (MG June 7; the civilwarintheeast anachronism documented), Gordon BRIGADIER brigade command (division May 8, MG May 14), A. P. Hill PRESENT commanding Third Corps (the reverse of Spotsylvania's Early trap), Sedgwick ALIVE throughout (the reverse dead-officer guard), Stevenson not Crittenden (the "(to 5/10)" read), Wadsworth m.w. May 6 / died May 8, Hays k. May 5, Longstreet wounded ~noon by the 12th Virginia's volley (Jenkins killed; "Press the enemy" to Field). Citation-integrity catches: ABT "around midday" + "250 of 800" not on the fetched page; the Bearss quote not on the ECW page (dropped); IX Corps independence re-cited Wikipedia + NPS; the EV slug corrected; Wikipedia/EV casualty tables adjudicated ONE root.
- Design law: THE AXIS-SCOPE LAW (the Plank Road axis is fielded; the Turnpike/Saunders Field axis and Gordon's dusk attack are taught, never fielded); attacker CS / defender US (logged deviation from the packet's CAMPAIGN recipe — the standalone models the sourced defensive invariant); objective = the Brock Road / Orange Plank Road junction; THE JUNCTION GUARD (US holds ≥5/8, every family confirms the junction never fell) + THE AGGREGATE CASUALTY-DIRECTION TOOTH (US>CS ≥5/8, direction only — the honest split both refuters recommended; US ~17,666-18,000 Verified vs CS Disputed ~8,000-13,000); THE THICKET LAW (blindness = vegetation + smoke, a confirmed weather-fog NEGATIVE; encoding = symmetric dense-woods cover + honestly low deployed guns + fog OFF, never a fog/visibility buff); THE BURNING-WOODS DIGNITY LAW (McParlin's ~200; the fires never a mechanic); menu rank 67 (66 reserved for Mine Run); envelopes US 15,000-30,000 / CS 12,000-26,000 all Inferred; D74 wall + woods/blindness/smoke/brushFire/flank/rollUp/friendlyFire/confusion families; USCT accuracy-as-dignity (train guard, no invented combat); SIX named reshape obligations for the runtime slice (kennesaw adjacency ×2, spotsylvania adjacency ×2 + SCOPE regex + forbiddenData scan) plus the 1380 pin-bump grep.
- Shipped: `docs/design/wilderness-battle-build-spec.md` (md5 `996508a3325b675fb163fbc11ab3f677`) + `tools/probe-wilderness-plan.mjs` (md5 `aa657d017b6bee143c52eed66cda60b7`, 12/12 dual-mode fail-closed, first pass green). Bind: the one-token Kershaw Brig.→Maj. tamper bit EXACTLY `RANKS + COMMAND TRAPS` (11/12, exit 1) → md5-identical restore → 12/12, artifact ok=true. Gate: GATE OK HTML byte-identical `91b99791…` · schema 52/52 (timestamp churn restored) · research 15/15 · all ELEVEN plan probes ALL OK · suite 127 · diff-check clean. No runtime byte moved; `npm run vet:noreg` deliberately deferred (owed at the 2-3-battle checkpoint — AT or immediately after the Wilderness runtime).

## D391 PLAYABLE SPOTSYLVANIA — the Bloody Angle ships as scenario 22 — 2026-07-13 (D391)
- Claude/Fable took LANE-003 DRIVE at clean `d46f1c7` in ledger-only commit `93a77e6` (all TEN plan probes rerun green after the lane edit), then implemented the D390 contract's §11 atomic integration in one green runtime commit.
- The scenario: single-phase May 12, 1864, US attacker (Hancock's II Corps column at near-full weight + Wright's VI Corps as timed reinforcements with Wright's timed Brig.-Gen. aura) vs CS defender (Johnson's gun-stripped 5,500 on the tip + the sourced piecemeal counterattack: Gordon @12 · Ramseur @25 · Daniel @35 · Harris @50 · McGowan @65 · the re-formed-line 12-gun grouping @110). THE ARTILLERY-WITHDRAWAL INPUT LAW is probe-enforced: ZERO opening CS guns, captured batteries never re-enter, US fields 24 guns of true supporting weight. Committed totals US 18,300 / CS 15,860 inside the D390 envelopes, every unit `Verified identity; Inferred strength`. Rank wall verbatim (Wright/Gordon BRIGADIERS with disclosure-only paperwork dates; no Sedgwick/Longstreet/Anderson; dead Stafford/Jones never in a command seat). Lee and Ramseur field ordinary sourced auras. Nine teaching cards + Eastern/Overland/Inconclusive codex under the Rhea-root two-source rule.
- THE HONEST A/B (5 logged iterations, enumerated eligible inputs only): battery 0 = 0/8 (instrumented diagnostic: no defender stood inside the objective radius; arrivals destroyed in detail) → entries moved INTO the salient interior (0/8) → traverse walls + rain-mud + r150 + envelope-edge strengths (1/8) → hold 180 / r165 / interior woods / Lee+Ramseur auras / CS 15,900 (3/8) → hold 200 / timeLimit 410 (inside the sourced 17-24h day spread) / deeper traverse+mud field / Gordon @12 (8/8, one gate red: art crew 500/12 breached the universal ≤40/gun ceiling) → crew 460 root-fix. **FINAL: defender-holds 7/8** (seed 19 US by hold — the spec's honest near-run spread); CASUALTY-DIRECTION-NEUTRAL holds — no per-side casualty tooth exists anywhere.
- Integration: scenarios 21→22 · schema 51→52 · Army Register 1326→**1380** (18 ids × 3; the documented D391 fragment at ELEVEN pin sites incl. probe-five-forks' registry-COUNT 21→22 and probe-women-in-war-arc-plan's triple pin 22/1380/127) · flags/weather/Intel/media 21→22 · suite 126→127 · sweep 22 · T10 `E/true/anv` · menu rank 68. probe-kennesaw's TWO stale immediate-adjacency teeth (menu + DOM) reshaped to the true Chattanooga → Spotsylvania → Kennesaw chronology (the D376 Franklin class). Kennesaw's 17-unit largest-scene crown re-audited and held (Spotsylvania opens at 10).
- Binds on the final candidate: registry removal → plan `FUTURE DIRECTION + INTEGRATION` only (11/12) + EXACTLY the four registration-dependent focused teeth (12/16), direction battery green by design; the one-token Wright Brig.→Maj. tamper → plan `RANKS + COMMAND TRAPS` only + EXACTLY the focused `RANK WALL` tooth (15/16). Both restores md5-identical (T1 `a44f9915…`, data `152a6276…`, HTML `91b99791…`); plan 12/12 after each.
- Gate green, every fresh artifact read (0 failed steps, 0 pageerrors everywhere): node --check + preparse · GATE OK · schema 52/52 · research 15/15 · plan 12/12 · focused 16/16 · roster 8/8@22 · builder 15/15@22 · loot@1380 · flags 48/48 · weather 30/30@22 · Intel 26/26@22 · media 13/13 (standing 2.418MB soft warning) · vet --list 127 · chattanooga 16/16 + kennesaw 11/11 · all ten plan probes · diff-check clean · base md5 unchanged. Full `npm run vet:noreg` deliberately deferred (D389 discharged the checkpoint one day ago; owed at the next 2-3-battle boundary).
- New baselines: **22/52/1380/22/127**, sweep 22, HTML `91b9979144731ae3299af4ebaca4628a`. LANE-003 → CONTRACT/unowned; the D382 ladder continues.

## D390 SPOTSYLVANIA "BLOODY ANGLE" PLANNING CONTRACT — spec + 12-step plan probe, no runtime — 2026-07-13 (D390)
- Claude/Fable took LANE-003 DRIVE at clean `3ba2c93` in ledger-only commit `a76dcd4` (all nine plan probes green after the take). A 6-agent workflow (4 Sonnet/med gather → 2 Opus/high default-refute, 86 claims, ~40 verdicts, 0 errors) resolved every packet-§9 gap; the yield is the attrition packet's §12 addendum.
- Adjudications: Anderson MAJOR GENERAL for all of May 8-21 (temp Lt. Gen. only May 31, never confirmed, lapsed in October; the historyofwar outlier documented); Wright Brig. Gen. with his MG dated May 12 ITSELF (same-day trap, disclosure-only); Gordon Brig. Gen. (MG May 14); Early commanding Third Corps for the sick Hill; NARA Grant page fetched (Feb 29 signing/nomination, Mar 2 confirmation) with LOC mcc.017 still bot-403 and dropped as load-bearing; the ceremony date Disputed Mar 9 vs 10. Division-grain OOB resolved on both sides incl. Johnson's succession wall (dead Stafford/Jones never alive on May 12) and the Perrin/Harris/McGowan counterattack with per-fact sourcing after a refute citation-integrity catch. TOP-LOOP catch: the 12-regiment/4,500 figure is Upton's MAY 10 assault, now an explicit conflation trap.
- Design law: CASUALTY-DIRECTION-NEUTRAL (US ~9,000 vs CS ~8,000-incl-3,000-prisoners is not robust to prisoner counting — the Opus refute recommendation adopted verbatim); the single 8-seed guard is DEFENDER ULTIMATELY HOLDS ≥5/8; the break-in is an emergent requirement (THE ARTILLERY-WITHDRAWAL INPUT LAW: the gun-stripped tip — 22 of 30 pulled, ~20 captured — as accurate gun-count inputs, never a surprise bonus); fog OFF; single phase, menu rank 68; envelopes US 14,000-25,000 / CS 8,000-16,000 all Inferred; D74 wall extended with melee/hand-to-hand/prisoner/capture families; Classic `spotsylvania` row + strategic rail route held as separate byte-identical layers (the shiloh/franklin same-name convention).
- Shipped: `docs/design/spotsylvania-battle-build-spec.md` (md5 `84f458f3494001f37886161001827764`) + `tools/probe-spotsylvania-plan.mjs` (md5 `8cc219b748dbb23a2797a37afaf29cba`, 12/12 dual-mode fail-closed). Bind: the one-token Anderson Major→Lieutenant tamper bit EXACTLY `RANKS + COMMAND TRAPS` (11/12, exit 1) → md5-identical restore → 12/12, artifact read clean. One authoring root-cause: the tactical-branch scan now strips comments (T2's pre-existing D288 campaign-chain comment is not a code branch).
- Gate green, everything read: GATE OK, HTML byte-identical `21544e26…`; schema 51/51 (timestamp-only report churn checked out); research 15/15; Spotsylvania plan 12/12; all nine prior plans exact-count green with fresh ok=true JSONs; suite 126; diff-check exit 0; runtime-scope diff EMPTY; all five D389 hashes held. No A/B (no sim input exists). Baselines 21/51/1326/21/126 unchanged.
- LANE-003 → CONTRACT/unowned. Exact next: playable Spotsylvania runtime from the committed contract (spec §11/§14 the law) under a fresh committed DRIVE lock.

## D389 ELKHORN RELEASE CHECKPOINT — 126/126, every artifact audited — 2026-07-13 (D389)
- D388 playable commit `67f9672a6ff8c734c7f0ec6fa385fb7d5ad700e8` passed the full 126-command manifest in exact-label resume segments: 77 + 14 + 11 + 24 = 126 eventual green commands, serialized and alone.
- Three release catches were fixed without gameplay/assertion weakening: Arms keeps its required PNG but gains a 240-second screenshot window, bounded 2.5/5-second page/browser cleanup, and a 600-second suite budget (23/23); Tripo now inspects the shared formation-instance slot and proves every duplicate base representation inactive/absent while GLB/flag/ring survive (15/15); NMH now asserts the full Gettysburg → NMH → Fort Donelson → Elkhorn → Shiloh order (14/14).
- Artifact readback: 125/125 expected JSONs fresh by owning segment and parseable; `ok:false` 0 · pageerrors 0 · realErrors 0; schema 51/51 with Elkhorn `2 phases, CS vs US` PASS; sweep 21×8=168 rows, failures 0; 149 PNG + 4 JPEG artifacts decode and all 50 JSON-referenced images are fresh/present/decodable; Army Register 1326; suite 126.
- Standing notices only: media 2.418 MB soft tier; eight disabled/pending-license Tripo slots; headless AudioContext/multiple-Three.js/WebGL ReadPixels messages; optional-resource 404s with no real errors. One post-green Shiloh 3D `browser-close timeout` is recorded in tactical-visuals cleanup only; scene/page/lifecycle/image and all later scenes are green. Elkhorn direction remains 8/8 ×4, D74 forbidden keys 0, and all five release hashes unchanged.
- LANE-003 → CONTRACT/unowned. No D382 work started. Next bounded slice: re-verify the attrition packet's spec-time gaps and ship a planning-only standalone Spotsylvania/Bloody Angle spec + bind-tested plan probe; no runtime in that slice.

## D388 PLAYABLE ELKHORN TAVERN — two days on the honest axis — 2026-07-12 (D388)
- Scenario 21 implements D387 exactly: P1 Mar 7 CS attack w1 with disclosed operational-surprise fog; P2 Mar 8 US counterattack w3 decisive, fog off; home edges invert the operational envelopment; Camp Stephens supply collapse enters only through T4 train positions. P1 US/CS 4,030/5,250; P2 7,950/5,050; March 8 guns 21/12. No D74 output fudge.
- Fifteen unique ids add 45 Army Register rows, 1,281→1,326. Integration is 21 scenarios · schema 51 · coverage 21 · suite 126 · sweep 21 · menu rank 49 · T10 `TM/false/first-national`. All strengths are Inferred; Curtis remains Brig. Gen.; Leetown/Native formations stay absent while ten cards teach the omitted history.
- Honest A/B: first authored inputs passed P1 CS 8/8 · P2 US 8/8 · aggregate US 8/8 · aggregate CS losses 8/8. Zero tuning iterations, zero simulation-input changes.
- Binds: registry removal produced plan FUTURE plus exactly eight registration-dependent runtime reds; two Curtis Maj.-Gen. tamper rows produced plan FUTURE plus exactly RANK + NAME LOCKS red. Both restores exact. Final hashes: T1 `0ea7ea9e…`; data `6798671e…`; focused probe `c6654e92…`; HTML `21544e26…`; base `c9db83fa…`.
- Gate green and artifacts read: node-check 18/18 · GATE OK · schema 51/51 · research 15/15 · plan 14/14 · runtime 16/16 · roster 8/8 · builder 15/15 · loot 12/12@1326 · flags 48/48 · weather 30/30 · Intel 26/26 · media 13/13 standing soft warning only · Fort Donelson 15/15 · Shiloh 31/31 · suite 126 · diff clean. One real adjacent catch strengthened Fort Donelson's chronology for the inserted battle; stale pin-history comments and the T10 TM vocabulary comment were repaired.
- LANE-003 → VERIFY. Exact next: `npm run vet:noreg`, all 126 commands serialized with nothing else running; read every fresh artifact, record the release, then release the lane before D382 Overland/attrition work.

## D387 ELKHORN TAVERN CONTRACT — the honest axis, the ammunition law, the Leetown absence guard — 2026-07-12 (D387)
- Eighth LANE-003 planning contract: `docs/design/elkhorn-tavern-battle-build-spec.md` (md5 `075a6c7c755697d0ac36959c4d1ea67f`) + `tools/probe-elkhorn-tavern-plan.mjs` (14/14 dual-mode fail-closed, whitespace-normalized anchors). No runtime moved: 20/50/1281/20/125 all hold; HTML byte-identical `a9b42b69c1c735b81fff7c9c878c1bc0`.
- Research completed ACROSS Aaron's pause: 11/12 agent results recovered from the stopped `wf_1a2d6b8d-36e` journal (never the resumed return — the memory law); the resume's cache-churn re-runs stopped; a minimal continuation workflow (`wf_448b7f8c-07c`) ran the missing native-carveout refute + critic. ~66 verdicts, 0 errors.
- Refute catches: Slack COLONEL (CSA) with the POSTHUMOUS brigadier trap; Frost the reverse trap (CSA BG Mar 3); Price CSA MG dated Mar 6 1862 two-source (the packet's MSG string is Wilson's-Creek-only); the Union colonel wall (Osterhaus/Davis/Carr/Dodge/Vandever); the scalping cluster EOA-misattribution (ABT-only ← Shea, ships Inferred); Gates tactical details REFUTED; Welfley's Knoll un-REFUTED (the named 21-gun ridge); the Shea single-scholar independence finding now controls citation tiering.
- Shape: two-phase T8 role reversal, [1,3] sum 4 (the D92 phase-weight audit PASSES the packet weighting — written down first); P1 fog = disclosed operational-surprise abstraction; the ammunition law = T4 per-phase supply-train POSITIONS (Camp Stephens), never a multiplier; 8-seed four-guard direction law with aggregate-only CS>US casualty direction (no per-day split exists); THE LEETOWN ABSENCE GUARD executable (no leetown file/registry line; OOB unit-row Native scan once data exists; cards 8-10 mandatory). Critic carve-out verdict: HIGHLY FEASIBLE, argument-from-silence rendered Inferred.
- Bind: §6 Curtis lock → Maj. Gen. tamper → EXACTLY `RANKS + TRAPS` red (13/14, exit 1) → md5-identical restore → 14/14. Packet §12 addendum added (research probe 15/15). Gate: build GATE OK byte-identical · schema 50/50 · ALL NINE plan probes green · women focused 13/13 @11-lock 0 pageerrors · suite 125 · diff clean. LANE-003 → CONTRACT/unowned; next: D388 playable runtime.

## D386 PLAYABLE WOMEN-IN-WAR ARC — four chapter walk-throughs under the register law — 2026-07-12 (D386)
- Implements the D385 contract exactly: `data/women-in-war.json` 9→11 (Edmonds Verified / Clayton Disputed), 9V/2D, four `arc` blocks (8/7/5/8 chapters); NEW `src/39-women-war-arc.js` (T29 disclosure pattern, aria-current stepper, aria-live body, ephemeral state); typeof-guarded 38 seam; importer arc law (register law + allowlist + bounds) negative-proven on four violation classes; Cashier "Irene" scrubbed + Barton sleeve-bullet "by her own account" (D385 refute corrections, flagged on the records).
- Pins with documented history: focused probe 11/9/2 + Clayton joins the contested/Disputed filter locks; under-told data text + tooth "11 records, 9 Verified and 2 Disputed" same-commit. Baselines held: 20/50/1281/20/125; HTML `a9b42b69c1c735b81fff7c9c878c1bc0`.
- Runtime bind: `wiwArcSectionHTML` stub → EXACTLY the five declared arc-DOM teeth red (0 pageerrors, non-arc teeth green) → md5-identical restores (src `511d7bca…`, HTML `a9b42b69…`) → 13/13. Gate serialized, artifacts read: GATE OK · importer 11/9/2 · schema 50/50 · plan probe 10/10 INTEGRATION · focused 13/13 · under-told 8/8 · loot 12/12@1281 · roster 8/8@20 · seven battle plan probes ALL OK · diff clean. One honest first-pass red (the Velazquez-only filter lock) moved as a documented data-driven pin, not weakened. No A/B — no sim input exists in this arc.
- LANE-003 released to CONTRACT/unowned; NEXT: M4 Elkhorn Tavern SPEC (non-Leetown axis ONLY, D359). Full `npm run vet:noreg` remains owed at the next release checkpoint (D384 residual + these pin edits).

## D385 WOMEN-IN-WAR ARC CONTRACT — spec + bind-tested plan probe, no runtime — 2026-07-12 (D385)
- LANE-003 taken DRIVE at clean `007cbc0` in ledger commit `c33d92a` (Phase-0 first: 17 "dirty" paths all blob-identical to HEAD — stale index stat, cleared with `git update-index --really-refresh`, nothing discarded). All seven battle plan probes ALL OK after the take.
- Research: 9-agent workflow `wf_527a8c0d-3ed` (4 Sonnet/med gather → 4 Opus/high default-refute → 1 Opus/high critic, 0 errors). Refute catches: the misattributed NARA "spy" quote (fabricated-citation class, fixed to NPS); Edmonds's Antietam presence REFUTED against NPS Battle Units UMI0002RI/Dyer ("Duty in the Defences of Washington, D.C., September 3 to October 11"); Clayton prop-uniform forensics REFUTED (dropped); every memoir-only Edmonds beat downgraded to her-own-account.
- Shipped: `docs/design/women-in-war-arc-spec.md` (md5 `6348e1f9a592118b4f26a007e75561c7`) + `tools/probe-women-in-war-arc-plan.mjs` (10/10 dual-mode fail-closed; whitespace-normalized anchors because the spec is hard-wrapped — the bind still bites). TOP-LOOP adjudications in spec §4: Cashier he/him affirmed (+ "Irene" scrub queued for D386), Clayton documented-mystery register, the Edmonds memoir wall, the four Barton corrections (Dunn/Antietam nickname anchor; sleeve-bullet as her own account; the MANDATORY Andersonville myth-correction + Atwater credit; Red Cross 1881).
- Bind: §4.1 he/him→she/her tamper → EXACTLY the ADJUDICATIONS tooth red (9/10) → md5-identical restore → 10/10, artifact read. Gate: build GATE OK with HTML byte-identical `22e3ca1360a7260070b69301acea1348`; plan probe 10/10; seven battle plan probes ALL OK; focused probe-women-in-war 8/8 @9-lock, 0 pageerrors, live registry 1281; diff clean. Baselines 20/50/1281/20/125 untouched.
- NEXT: D386 playable arc from this committed law (2 new records → 11/9V/2D across all three pin sites; per-record `arc` blocks ×4; importer arc law; `src/39-women-war-arc.js` + guarded 38 seam; both runtime binds), same Fable DRIVE.

## D384 PLAYABLE FORT DONELSON — scenario 20, the river war as inputs — 2026-07-12 (D384)
- `data/fort-donelson.json` implements the D383 contract: three-phase T8 (Investment w1 US-atk cautious → Breakout w1 CS-ATTACKER → Smith's Recapture w3 DECISIVE), weights [1,1,3], fog off, menu rank 48 between New Market Heights and Shiloh; the Feb 14 naval repulse is the phase-2 transition-card interstitial and the recall teaching rides phase 3's. 27 unique ids add 81 Army Register rows (1200→1281, all seven whole-registry pins bumped same-commit incl. a NEW catch — probe-five-forks' undocumented registry-COUNT pin 19→20). Schema 50; coverage 20; suite 125; T10 W/false/first-national.
- Honest A/B: iteration 0 P2 CS 0/8 → obj/blocker-timing (1/8) → sourced piecemeal defense (3/8) → pre-dawn approach line + holdToWin 120→90 → FINAL P1 CS 8/8 · P2 CS 7/8 · P3 US 8/8 · aggregate US 8/8. All values in D384; no result multiplier anywhere. Grant's P2 absence ships as a timed leader arrival (inactive at dawn, active at 170s, probe-verified).
- Binds: registry-line removal → plan FUTURE + exactly 8 registration-dependent focused teeth red (SAME-SEED green — determinism is registration-independent, reconciled); Grant-grade tamper → plan FUTURE + exactly the RANK tooth red. Both restores md5-identical (T1 `ec051a8b…`, data `4d88587e…`, HTML `22e3ca13…`).
- Gate catches: citation gate rejected 3 bare-Verified phase-teaching stamps; schema gate rejected missing _comment/timing + empty phase-1 reinforcements (Morrison's noon assault became the phase-1 arrival); five-forks' registry pin. Serialized gate green with every artifact read: GATE OK; schema 50/50; research 15/15; FD plan 13/13; FD focused 15/15 (0 pe); roster 8/8@20; builder 15/15; loot 12/12@1281; flags 48/48@20; weather 30/30; Intel; media 13/13 (soft warning); suite 125; adjacents five-forks 16/16 · stones 13/13 · shiloh 31/31; diff clean.
- Residual: cedar/cross-keys/gaines/NMH pin edits are assert-verified + node --check green, exercised at the next release checkpoint per D160/D176. NEXT: the D382 ladder — Women-in-War playable arc, then Elkhorn Tavern (non-Leetown) spec.

## D383 FORT DONELSON PLANNING CONTRACT — land+river as inputs, three phases, reweighted decisive — 2026-07-12 (D383)
- Claude/Fable took LANE-003 DRIVE at clean `257bea8` in ledger-only commit `87a82a8` (all six plan probes green after the take — the D381 reshaped role-roster teeth held on a legitimate lock change, exactly as designed).
- A 13-agent research workflow (6 Sonnet gather → 6 Opus default-refute → 1 Opus critic) produced ~57 verdicts with ZERO REFUTED. Headline corrections: ABT's 40,702 is the COMBINED engaged total (US 24,531 / CS 16,171 — the packet's "US 40,702" was a misreading and 24,531 is the Verified Union anchor); the Feb 15 breakout opened Forge Road + a Wynn's Ferry stretch while the Charlotte road belongs to Forrest's separate post-surrender escape; Buckner's OR letter reads "forces and POST under my command"; the Grant Feb 16/17/21 "date dispute" resolves as commission/nomination/district-command events. The naval-river packet carries a §12 spec-time addendum; one refute agent died on a StructuredOutput cap and was resumed with an output-discipline instruction (9/9 CONFIRMED, closing the critic's P1-sourcing and CS-ranks gaps).
- `docs/design/fort-donelson-battle-build-spec.md` + `tools/probe-fort-donelson-plan.mjs` (13 steps, dual-mode, fail-closed) lock: three-phase T8 (Investment w1 → Breakout w1, CS attacker → Recapture w3 DECISIVE), weights `[1,1,3]` deviating from the packet's `[1,3,1]` because the sourced leans (CS holds/CS seizes/US seizes) under the packet weighting would flip the aggregate against the sourced Union victory; the Feb 14 naval repulse as a Phase 2 transition-card TEACHING INTERSTITIAL; gunboats as INPUTS only (transport/reinforcement timing; water batteries terrain/teaching, never land OOB); fog off; menu rank 48 before Shiloh; four direction guards with NO casualty-direction tooth anywhere (US bled more in k/w and won — the accounting conflict IS the teaching); the dense early-1862 rank wall (Grant Brig. Gen., Buckner never Lt. Gen., Forrest Lt. Col., Foote Flag Officer, colonels stay colonels).
- Bind: the first Grant-rank tamper exposed a weak tooth (§13's bind-procedure quotation satisfied a whole-document includes) — hardened to section-6-scoped matching, tamper bit EXACTLY `RANKS + TRAPS` 12/13 exit 1, md5-identical restore, rebuild HTML byte-identical `10a64a20394521efdc94b7edb1646686`, rerun 13/13.
- Gate green, artifacts read: GATE OK; schema 49/49; research 15/15; FD plan 13/13; six prior plan probes ALL OK; Five Forks runtime 16/16; roster 8/8 (one load-11 fonts-stall screenshot timeout root-caused and re-run green on the settled machine); builder 15/15; suite list 124; diff clean; 0 pageerrors everywhere. A dataless probe-new-market-heights.mjs placeholder was materialized with `brctl download` (blob identical to HEAD); the schema artifact's timestamp churn was checked out.
- Baselines unchanged: 19 scenarios / schema 49 / Army Register 1200 / coverage 19 / suite 124. LANE-003 stays Fable DRIVE. NEXT: D384 playable Fort Donelson runtime from this committed contract.

## D381 RELEASE CHECKPOINT VERIFIED — 124/124, lane released — 2026-07-12 (D381)
- Claude/Fable took the VERIFY transfer at clean `2f3da4a`, resumed the serialized battery exactly at command 38, and completed 124/124 across evidenced segments (1-5 · 6 · 7-19 · 20-21 · 22-31 · 32-37 from the Codex morning session; 38-97 · 98-standalone · 99-124 this session, final `VET NO-REGRESSION OK`). Nothing ran beside the battery.
- One red, root-caused, never blind-rerun: `tactical visuals` timed out at its 600s budget under battery load with 9/10 scenes already green (SIGTERM kill artifact on scene 10; historical greens 445-507s; two prior 604s timeouts in old logs). Standalone rerun on the idle machine: 10/10 scenes, fresh PNGs, 0 pageerrors, ~7.5 min. Battery resumed at command 99.
- Artifact audit: 123/123 suite JSONs fresh and clean (no ok:false / pageerrors / realErrors / failed steps / failures); sweep 19 scenarios × 8 seeds = 152 rows all finished with `failures:[]` and direction summaries matching shipped laws; schema 49/49 + tracked HTML at exactly 49 body rows; 147 fresh PNGs decode (two re-offloaded dataless morning artifacts materialized first); representative visuals inspected. Known unasserted heavy-scene image anomalies persist (stones-river dark frame, five-forks screenshot timeout) with green JSONs.
- The eighth bootprobe 404 was investigated: `ford_albedo.png` joins the seven whitelisted URLs as the same frozen-engine absent-optional-asset class (base.html:13391-13429 composes per-terrain-key texture paths with a documented 404 fallback; probe contract reads "~7"); realErrors stayed empty.
- Three transfer-era plan-probe reds greened in the D381 commit per the relay hard rule: five-forks LANE reshaped off the current-lock-holder anchor onto the durable serialization phrase + role-roster owner check; cedar-creek's dropped durable history sentence restored in the lane text; gaines-mill's REGISTRY re-fed by restoring the dropped `D362: 912 -> 957` pin-history fragment (comment-only) plus the same proactive owner-roster reshape. Bind A (phrase removal) → exactly five-forks LANE red; Bind B (DRIVE + unrecognized owner) → exactly the two reshaped teeth red; both restores md5-identical `ae574598c2e0a1fd2d88d8b203260052`; finals 12/12 and 8/8.
- Final gates: node --check green; build GATE OK with HTML md5-identical `10a64a20394521efdc94b7edb1646686`; all six plan probes green; Five Forks runtime 16/16 ALL OK; loot-survival re-run green under the battery env (the first rerun's screenshot stall was the documented fonts-stall pattern — the direct run had omitted `PW_TEST_SCREENSHOT_NO_FONTS_READY=1`); `git diff --check` clean. Pins held: 19/49/1200/19/124; zero simulation inputs changed.
- LANE-003 → CONTRACT/unowned. NEXT: Fort Donelson SPEC ONLY from the naval-river packet; Aaron's popup-ratified forward slate recorded in D382.

## D380 PLAYABLE FIVE FORKS — scenario 19 + generic atomic relief — 2026-07-12 (D380)
- `data/five-forks.json` fields one source-bounded single-phase US attacker-seize fight at Five Forks Crossroads: 21,000 US / 9,200 CS, 10 unique ids, 25 / 15 guns, fog off, menu rank 85 after Nashville. White Oak Road, the Angle, Ford's Road / Scott's Road, Gravelly Run, and Hatcher's Run shape the field; Dinwiddie and the shad bake stay teaching-only. Griffin is Brig. Gen. (brevet Maj. Gen.); Pickett, Fitz Lee, and Rosser supply no active auras.
- Shared T3 now supports a generic current-cast `replaces` event. Raw validation occurs before fate RNG; due events validate as one all-or-none batch before aura accumulation; Warren becomes alive+relieved+inactive while Griffin becomes the sole active aura. Malformed/missing/cross-side/duplicate/multi-target/chain/cycle/event-time-invalid rows reject once without throw, announcement, mutation, or extra RNG. Legacy rows remain byte-identical. HUD, selected attribution, 2D, 3D, and AAR distinguish relief from death.
- First authored simulation inputs passed US seizure 8/8 and CS-losses-greater 8/8. No simulation input moved and no outcome-tuning A/B occurred; one teaching-only correction added the exact Dinwiddie Court House term. Seed losses are recorded in D380.
- Bind A disabled only valid replacement application and turned red only generic `VALID RELIEF`, `EVENT-TIME REJECTION`, `RELIEVED PRESENTATION`, plus focused `COMMAND EVENT`. Bind B removed only the T1 registry line and turned red only the plan future-integration step plus focused registry/menu, registered launch, Army Register, and runtime menu/side-choice steps. Both restores matched T3 `7c3b0924c94e6f450e2fd491726a022f`, T1 `85c12c00440499a7bddc67060e9913fc`, data `380150cee52d99f7e10cbe7b45321f1a`, generic probe `da4934bbfc3bdeecca1150aff66045ed`, focused probe `e4da87df501b2ba50bdab4cf6857df27`, and generated HTML `10a64a20394521efdc94b7edb1646686` after rebuild.
- Focused/adjacent gate green: syntax/preparse; GATE OK; schema 49/49; research 15/15; Five Forks plan 12/12 and runtime 16/16; officers 20/20; roster 8/8; builder 15/15; loot 12/12 at Army Register 1200; flags 48/48; weather 30/30; Intel 26/26; media 13/13 with the known 2.418 MB soft warning; suite 124; Cross Keys plan/runtime 11/11 and 15/15; Bull Run 15/15; Nashville 12/12; every JSON/schema/image artifact read; no failed steps/pageerrors/realErrors; diff clean. Best-effort image notes: Five Forks timed out its 5-second screenshot and produced no PNG; the Cross Keys PNG decoded but was all black. Neither was an asserted step, and both runtime JSONs stayed green.
- Integration is 19 scenarios / 49 schemas / Army Register 1200 (`1170 + 3×10`) / 19-scenario coverage / suite 124. LANE-003 remains ChatGPT/Codex-owned VERIFY. NEXT: push the playable D380 commit, then run `npm run vet:noreg` alone and release only after complete fresh-artifact readback.

## D379 FIVE FORKS PLANNING CONTRACT — spec + generic relief law, no runtime — 2026-07-12 (D379)
- `docs/design/five-forks-battle-build-spec.md` and `tools/probe-five-forks-plan.mjs` lock a single-phase April 1, 1865 US-attacker / CS-defender fight for Five Forks Crossroads, fog off, menu rank 85 after Nashville. Engaged anchors are about 21,000 / 9,200; the broader 32,600 / 22,000 figures are rejected as active-map totals. White Oak Road, the return / the Angle, the road-axis naming variant, Gravelly Run, and Hatcher's Run carry the terrain contract.
- D380's generic T3 `replaces` seam is fully specified: raw-cast validation before RNG, batch due-event prepass before auras, atomic living relief with no aura overlap/gap, presentation-only entry, explicit relieved-vs-fallen output, byte-identical legacy path, and fail-closed handling of malformed/missing/cross-side/duplicate/multi-target/chain/cycle/repeat cases. No Five-Forks branch, wound/fall call, output write, T8 change, or Custom Builder expansion.
- Rank and history locks: Griffin is Brig. Gen. (brevet Maj. Gen.) on April 1; Sheridan/Warren/Pickett/Fitz Lee/Rosser are Maj. Gens.; Grant is Lt. Gen.; Pickett/Fitz Lee/Rosser are absent aura sources. Appomattox stays teaching-only; shad-bake blame and prisoner totals stay disputed; emancipation/Black agency remain central. Future direction law is exactly eight seeds, at least 5/8 US seizes and 5/8 CS losses exceed US, with no magnitude/count guard.
- Bind: Griffin rank-line tamper made exactly `RANKS + ABSENCES` red (11/12 green, exit 1); restore matched spec md5 `0caa5bf0bf9777a3a778090cc6030864`. Final plan 12/12; generated HTML remained `097eabeea06387e47bd819d125950f0d`.
- Serialized gate green: syntax; GATE OK; schema 48/48; research 15/15; Cross Keys plan 11/11 and runtime 15/15; roster 8/8; builder 15/15; suite list 123; every artifact read; 0 failed steps/pageerrors; diff clean. Runtime baselines remain 18/48/1170/18/123. Full `npm run vet:noreg` was not run; it is due after playable Five Forks.
- LANE-003 released to CONTRACT/unowned. NEXT: D380 playable Five Forks plus the generic T3 relief seam, complete 19/49/`1170+3U`/19/124 integration, both binds, then the serialized release battery.

## D378 PLAYABLE CROSS KEYS / PORT REPUBLIC — scenario 18, two-field role flip green — 2026-07-11 (D378)
- `data/cross-keys-port-republic.json` and `tools/probe-cross-keys-port-republic.mjs` ship the D377 contract: Cross Keys w1 US attack / CS defense under cautious doctrine, then Port Republic w3 CS attack / US defense under standard doctrine; fog off, weights 1+3, phase-specific home edges, one scheduled arrival per field.
- Fifteen unique units add 45 Soldier's Story rows: Army Register 1125→1170. Integration moves the roster to 18 scenarios, schema to 48, flags/weather/Intel/media to 18, suite to 123, and menu chronology to Bull Run → Cross Keys / Port Republic → Gaines' Mill → Malvern Hill. Frozen Classic `crosskeys` / `portrepublic` and rail data remain untouched.
- Source honesty held: Jackson/Ewell/Fremont Maj. Gens.; Tyler/Taylor/Winder Brig. Gens.; Carroll Col.; Ashby absent; Coaling battery Unpinned; no invented 7th/9th Louisiana; operational maneuver teaching-only; seven two-source cards and codex use exact provenance words. No D74 output key exists.
- First authored inputs passed all four eight-seed guards 8/8, so zero outcome-tuning A/B iterations. A roster-gate universal-gun correction moved excess crew from two artillery abstractions into same-phase Inferred infantry groupings without changing phase totals or gun counts; all four guards remained 8/8. Final samples are logged in D378.
- Final-candidate binds: registry-line removal → plan 10/11 plus exactly 8/15 focused teeth red; Jackson Maj.-Gen.→Lt.-Gen. → plan 10/11 plus exactly 1/15 focused tooth red. Restores matched T1 `468e234a742255811e8f3cf3e5a2920a`, data `143c89fb819f826bb90bdaf7d865905c`, generated HTML `097eabeea06387e47bd819d125950f0d`; final plan/runtime 11/11 and 15/15.
- Serialized gate green: syntax + cooked templates; GATE OK; schema 48/48; research 15/15; roster 8/8; builder 15/15; loot 12/12; flags 47/47; weather 30/30; Intel 26/26; media 13/13; suite list 123; Bull Run 15/15; Gaines 13/13; Malvern 27/27; NMH/Stones/Cedar plans 10/10·11/11·11/11 and runtimes 14/14·13/13·15/15; every JSON/schema artifact read, 0 failed steps, 0 pageerrors; diff clean. Full `npm run vet:noreg` not run; deferred until playable Five Forks.
- LANE-003 released to CONTRACT/unowned. NEXT: Five Forks spec + bind-tested plan probe from the committed Appomattox packet; runtime only after that green planning commit.

## D377 CROSS KEYS / PORT REPUBLIC PLANNING CONTRACT — spec + plan probe, no runtime — 2026-07-11 (D377)
- `docs/design/cross-keys-port-republic-battle-build-spec.md` and `tools/probe-cross-keys-port-republic-plan.mjs` lock a two-phase T8 Valley finale: Cross Keys w1, US attack/CS defense, cautious doctrine → Port Republic w3 decisive, CS attack/US defense, standard doctrine; fog off, weights sum 4, two field-specific home-edge maps.
- The spec preserves the packet's confidence ceiling. Fremont's 11,500 is army present; the 6,000-9,500 modeled commitment and every lower split/gun envelope are Inferred. The Coaling battery stays Unpinned and generic. Jackson/Ewell/Fremont are Maj. Gens.; Tyler/Taylor/Winder Brig. Gens.; Carroll Col.; Ashby absent. Future guards: P1 CS, P2 CS, aggregate CS, P1 US>CS losses only. No phase-2/aggregate casualty direction, count, or D74 shortcut.
- Future integration is complete and fail-closed: id `crossKeysPortRepublic`, menu rank 12, scenario 17→18, schema 47→48, Army Register `1125 + unique units×3`, flags/weather/Intel/media 17→18, suite 122→123, Gaines chronology updated, frozen Classic `crosskeys`/`portrepublic` untouched.
- Surgical bind: Jackson Maj. Gen.→Lt. Gen. made exactly HISTORY red (10/11, exit 1); ten steps stayed green. Restore matched `bbe53c90c2cbb39045d3bc90f7d52518`; final plan 11/11. Gate: node checks green; GATE OK and generated HTML byte-identical; schema 47/47; research 15/15; Gaines 8/8; NMH 10/10; Stones 11/11; Cedar 11/11; roster 8/8; builder 15/15; every produced JSON read; 0 pageerrors; diff clean. Full vet not run.
- LANE-003 released to CONTRACT/unowned. NEXT: D378 playable runtime from this committed contract after a new ledger-only DRIVE lock.

## D376 PLAYABLE CEDAR CREEK — scenario 17, role reversal green — 2026-07-11 (D376)
- `data/cedar-creek.json` + T1/T10 integration ship the first attacker/defender role reversal: Gordon's fog-bound dawn assault (w1) then Sheridan's clear-afternoon counterattack (w3). Nineteen unique units move the Army Register 1068→1125; schema 47; 17-scenario flags/weather/Intel/media coverage; suite 122; Classic lowercase `cedarcreek` remains a separate frozen layer.
- Honest A/B is fully logged in D376. The initial 14-unit camp line and the first geometry/hold correction both produced P1 CS 0/8. Moving six Union formations to the sourced re-formation schedule produced 4/8. Delaying only Dwight 105→115 and Grover 125→135 produced 8/8 on all five direction-neutral guards: P1 CS, P2 US, aggregate US, P1 US>CS losses, P2 CS>US losses.
- Binds proved load-bearing and restored md5-identically: registry removal made exactly eight dependent focused teeth red; the Emory grade tamper made exactly one focused tooth red. Final serialized gate: build GATE OK; schema 47/47; plan 11/11; Cedar 15/15; roster 8/8; builder 15/15; loot 12/12; flags 46/46; weather 30/30; Intel 26/26; media 13/13; vet list 122; Stones 13/13; Kennesaw 11/11; Franklin 10/10; diff clean. Every required JSON read `ok:true`, no failed steps, 0 pageerrors.
- Two relay/adjacency pins were honestly stale: Franklin still required immediate Kennesaw adjacency, and Gaines' plan still required Claude as the live lane owner. Their substantive history/runtime teeth stayed green; Franklin now requires Kennesaw → Cedar Creek → Franklin, Gaines now requires CONTRACT/unowned while retaining the D362 history, and all affected probes rerun green. The D375→D376 relay needed zero ambiguity questions. LANE-003 returns CONTRACT/unowned; next is Cross Keys/Port Republic spec only in a fresh session. Full vet waits for the 2-3-battle release boundary.

## D373 LANE-003 RELEASE CHECKPOINT — full 121-command battery green — 2026-07-11 (D373)
- The battery owed since D366 ran serialized fail-fast in two segments (1-18, then `--from='hard war'` 103/103), final `VET NO-REGRESSION OK`; every `tools/shots/*.json` read: 120 fresh artifacts all ok:true / 0 pageerrors / 0 realErrors / no failed steps; sweep 16 scenarios × 8 seeds failures=[]; diag-classic green; bootprobe's 7 filtered 404s are the documented absent-optional-assets probe.
- ONE red, root-caused, no probe weakened: hard-war hit its 360s budget with all work provably done at 84s (screenshot+JSON mtimes) — Chrome teardown hung under a concurrently-running 11-agent research workflow (Fable's own scheduling error on the 8 GB Mac). Idle-machine focused rerun 92s green; in-battery rerun 108.1s green. **Lesson: nothing runs concurrently with the release battery.**
- Cedar Creek research rode along between segments (19 agents total, 0 errors): CMH staff-ride per-division strengths (approved .mil source; Kershaw 3,071), afternoon-line/counterattack geometry, DISPUTED fatal-halt with both primaries, Sheridan's ~12-mile ride, full substantive-grade rank table incl. the Emory Brig.-Gen. correction (C73-class; packet says Maj. Gen. via NPS courtesy label). Addendum ships as the next docs slice.
- LANE-003 release obligation discharged; lane stays Fable DRIVE for the ratified stretch order (Cedar Creek first). Stale pre-D372 Sol sentence in the lane pointer reconciled per D372's relay order.

## D374 CEDAR CREEK RESEARCH ADDENDUM — 2026-07-11 (D374)
- The shenandoah-1864 packet gains §12 (the adjudicated two-workflow research yield): CMH staff-ride strength table at unit grain (US per-corps; CS per-division incl. Kershaw 3,071; 31-Oct-reconstruction caveat), dawn/counterattack geometry, count-free pursuit law, the fatal halt as an attributed DISPUTE, and the substantive-grade rank table; §4 Emory corrected to Brig. Gen. (Bvt. MG); §3 gains five source rows (CMH OOB+narrative w/ Wayback mirrors, NPS Fatal Halt + Sheridan Arrives, Gordon's Reminiscences access note); §9 Cedar Creek bullets annotated RESOLVED (audit trail kept). Gate: research probe 15/15, GATE OK (HTML unchanged), diff clean. NEXT: D375 Cedar Creek spec + plan probe.

## D375 CEDAR CREEK SPEC + PLAN PROBE — 2026-07-11 (D375)
- `docs/design/cedar-creek-battle-build-spec.md` + `tools/probe-cedar-creek-plan.mjs` (11/11) ship the fourth LANE-003 contract from packet §12: two-phase T8 with the game's first ROLE REVERSAL (P1 `Gordon's Dawn Assault` w1 CS-atk fog ON → P2 `Sheridan's Counterattack` w3 DECISIVE US-atk fog OFF; weights sum 4 never 5), menu rank cedarCreek:72, CMH-anchored bounds (P1 CS 12,500-14,500 vs US 27,000-31,610; P2 US 22,000-28,500 vs CS 13,000-19,000; Lomax not fielded), THE DIRECTION-NEUTRAL LAW (US bled more AND won — no aggregate casualty tooth in either direction; phase-scoped D92 direction guards only), count-free pursuit, the two-primary DISPUTED fatal halt ("glory enough" only via Gordon's Reminiscences, probe-enforced attribution), "The Burning" teaching-only.
- The §12.5 leftover resolved at spec time: a 3-agent workflow (2 Sonnet gather → 1 Opus refute, 0 errors) CONFIRMED **Col. J. Howard Kitching** from NPS + CCBF + NY State Military Museum, documenting the posthumous-brevet-backdated-to-Aug-1-1864 trap (never encode; never KIA — died of the wound Jan 11 1865).
- Bind: Emory rank-lock tamper → exactly ONE red (HISTORY, exit 1) → md5-identical restore → 11/11. Gate: node --check, GATE OK (HTML byte-identical), schema ok, research 15/15, stones plan 11/11, NMH plan 10/10, diff clean, all JSON read (ok:true, 0 pageerrors). NEXT: D376 playable Cedar Creek from this boundary.

## D366 PLAYABLE STONES RIVER + D367 SOL SESSION CHARTER — 2026-07-10 (D366/D367)
- Scenario 16 ships exactly per the D365 spec: `data/stones-river.json` (26 units, two-phase T8 CS-atk/US-def, weights 3+1, Jan-1 Emancipation interstitial as the phase-2 transition card only, rain/dawn, US-low/CS-high home edges, all 26 notes `Verified identity; Inferred strength`), T1 registry + rank 52, T10 W/false/hardee, schema 46, loot pin 990→1068 (+ the gaines/NMH whole-registry pins in the same commit), flags 45 (+ Stones River semantic tooth), Intel/media 16 (Kennesaw keeps the 17-unit largest-scene crown vs 16), suite 121, roster/builder baselines; NO logistics-rail change.
- Honest A/B: the FIRST 8-seed battery passed all five guards 8/8 (p1 US holds, p2 US holds, p2 CS>US direction-only, aggregate US, near-parity ≤1.6 at ratios 1.08-1.15 vs historical 1.10) — no input moved.
- Pre-authoring citation-verify workflow (6 Sonnet URL packets): Wheeler card dropped (single-source), Garesché carries the à-Kempis correction against Wikipedia's "personal Bible" flattening, WHN scoped to repulse/guns/45-min (Breckinridge's OR controls the line pairing), quod.lib kept as canonical primary (bot-403 today; D365-fetched) with Wikipedia carrying the quote.
- Binds: registry-line removal → exactly the 7 registry-dependent focused teeth + plan REGISTRY red; Polk Lt.→Maj. tamper → exactly ONE focused tooth (RANK + NAME LOCKS) red; both md5-identical restores; final rerun plan 11/11 + focused 13/13.
- Gate serialized, all JSON read, 0 pageerrors: GATE OK · schema 46/46 · plan 11/11 · focused 13/13 · roster 8/8 (one battery-row memory-pressure flake, solo rerun green) · builder 15/15 · loot 1068 · flags 45 · weather · Intel 26 · media 13 · vet --list 121 · NMH · Nashville · diff clean. Screenshot moved to the kennesaw best-effort heavy-scene pattern after a reproducible fonts-stall.
- D367 (Aaron popup): D366 is the session boundary; the full `vet:noreg` release battery defers to the next Claude session; a full ChatGPT 5.6 Sol session is chartered as LANE-004 (genre-elite audit→law, AUDIT-PROMPT run, cleared quick wins, LANE-002 5b batches; hybrid; all four pillars).

## D365 STONES RIVER PLANNING CONTRACT — spec + plan probe, no runtime — 2026-07-10 (D365)
- Third LANE-003 battle contracted from the western-gaps packet: `docs/design/stones-river-battle-build-spec.md` + `tools/probe-stones-river-plan.mjs` (11/11). Roster stays 15 through New Market Heights until D366.
- An 11-agent research workflow (5 Sonnet gather → 5 Opus default-refute → 1 Opus critic, ~581k tokens, 0 errors): all 23 ranks CONFIRMED incl. the Polk/Hardee Lt.-Gen. flip, Sheridan's backdated-MG trap, and Hazen as Colonel; a claimed OR brigade-strength table REFUTED by full-text HRS extraction (only Breckinridge's 7,053 / ~4,500 is OR-sourced — all other splits Inferred inside the ABT 41,400/35,000 anchors); Wood→Cleburne, Preston Smith, Preston+Palmer-not-Hanson corrections landed; Jan-2 force locked ~4,500.
- The near-parity law encoded: US won bleeding MORE (12,906 vs 11,739); aggregate guard = max/min ≤ 1.6, NEVER US < CS; the only lopsided guard is phase-2-scoped direction-only (Breckinridge loses ~1,700-1,800 of 4,500 to the 45-58-gun mass — the range is the tooth). Jan 1 = teaching interstitial (Emancipation Proclamation), never a scored phase. Weather rain/dawn, never snow.
- Negative bind hardened its own tooth: first tamper didn't bite (substring matched elsewhere) → HISTORY tooth anchored to the exact bolded trap lines → same tamper red exactly (10/11, exit 1) → md5-identical restore → 11/11.
- Gate: GATE OK (HTML md5-identical); schema 45/45; research 15/15; stones plan 11/11; NMH plan 10/10; roster 8/8; builder 15/15; nashville 12/12; all JSON ok:true, 0 pageerrors; diff clean. NEXT: D366 playable Stones River, then the LANE-003 release battery.

## D364 PLAYABLE NEW MARKET HEIGHTS — the first USCT-led battle ships; 15 scenarios live — 2026-07-10 (D364)
- Fable closed out the green D364 runtime WIP adopted at the recorded LANE-003 boundary (Aaron stopped the prior session mid-vet): `data/new-market-heights.json` two-phase T8 over the same ground, registry/menu rank 45, the guarded T13 pre-placed abatis seam (`fldEngSeedScenarioObstacles`, no-op without the data key), T10 `E/false/anv`, schema 45th row, loot pin 957→990 (11 unique units × 3), flags/Intel/media 15, suite 120.
- Spec amendment logged (D364): the sourced 22nd USCT skirmish detachment joins phase 1 on the reinforcement schedule (≤250); phase-1 US opening OOB stays 630-770, total ≤1,000. Honest A/B logged in DECISIONS: attempt 0 FAIL (P2 US 2/8) → attempt 1 PASS (8/8 · 7/8 · 7/8 · 8/8) — all moved inputs inside spec bounds.
- Bind 2 executed this session: T13 seam stubbed → exactly the OBSTACLE BELTS tooth red, exit 1, 13 other teeth green → md5-identical restore of source AND generated HTML → 14/14. The direction battery stayed green beltless — the belts are friction, not the outcome carrier (D74).
- A 3-packet Opus default-refute pass over the new teaching prose confirmed the Butler Medal and Fort Pillow cards and AMENDED the MoH superlative to "the most awarded to Black soldiers for any single engagement of the war"; two stronger sources added to the Butler card. Stale 957 registry pin in probe-gaines-mill bumped to 990 with the documented-history comment (root cause, not probe-weakening).
- Full serialized runtime gate green with every JSON artifact read: node --check 13/13, GATE OK, schema 45/45, NMH plan 10/10 + runtime 14/14, roster 8/8, builder 15/15, loot 12, flags 44, weather 30, intel 26, media 13 (known soft warning), vet --list 120, gaines-mill 13, nashville 12, field 23, diff clean, 0 pageerrors everywhere. Full vet:noreg stays owed at the LANE-003 release boundary. NEXT: Stones River spec-first.

## D363 NEW MARKET HEIGHTS PLANNING CONTRACT — Fable takes LANE-003 DRIVE; spec + plan probe, no runtime — 2026-07-10 (D363)
- Claude Fable 5 verified the clean `b1d828b` D362 boundary (HEAD == origin/main) and took the LANE-003 lock. `docs/design/new-market-heights-battle-build-spec.md` + `tools/probe-new-market-heights-plan.mjs` lock the second battle-ladder item before runtime; the playable roster stays at 14 through Gaines' Mill.
- A 13-agent research workflow (6 Sonnet gather → 6 Opus default-refute → 1 Opus completeness critic, ~697k tokens, 0 errors) resolved every USCT-packet §9 unknown first: brigade attachments (Holman 1st/22nd/37th · Draper 5th/36th/38th · Duncan 4th/6th), engaged strengths (~700 / ~1,300 / CS line ~1,800-2,000), Hardaway's two 4-gun batteries (the "no gun counts" gather claim was refuted), all battle-date ranks, all 14 Medal of Honor men by name/rank/unit with award-date nuance, and the withdrawal question — sourced orders, explicitly-contested causation, no clock time.
- Adjudicated shape: two-phase T8 over the same ground (Duncan w1 CS-holds → Draper w3 US-carries against a `Verified withdrawal order; Inferred residual strength` reduced line). Fort Harrison teaching-only: 2,800-vs-200 is below brigade grain and its garrison commander is OR-contradicted. No clock-timed thinning, no pinned causation, the controversy taught as a controversy. Cost guard inverts winner-bleeds-less. T13 pre-placed abatis-belt seam contracted (guarded, no-op elsewhere). Fort Pillow absence guard is now an executable plan-probe tooth. `valorMult`/`heroism` join the forbidden wall.
- Negative bind: the unique Holman-artifact line tampered → exactly the HISTORY step red (9/10, exit 1) → checksum-proven byte-identical restore → 10/10. Gate: build GATE OK (generated HTML unchanged); schema 44/44; research 15/15; Gaines plan 8/8 (lane tooth green under the DRIVE edit); NMH plan 10/10; roster 8/8; builder 15/15; Nashville 12/12; all JSON `ok:true`, 0 pageerrors; diff clean.
- Next: D364 playable New Market Heights from this committed boundary, then Stones River spec-first.

## D362 PLAYABLE GAINES' MILL + FABLE TRANSFER — 2026-07-10 (D362)
- Fourteenth scenario: 15 units, 27,000 US / 32,000 CS, 72 / 32 guns, sourced ranks/terrain/teaching, Army Register 912→957, schema 44, suite 119. First final-input battery needed no tuning: CS hold 8/8 and CS killed/wounded ≥ US 8/8; impossible 9/8 bind red then exact restore.
- Gate: GATE OK; plan 8/8; runtime 13/13; loot 12/12; flags 43/43; weather 30/30; Intel 26/26; media 13/13; Malvern 27/27; Nashville 12/12; roster/builder green; zero pageerrors; diff clean. Full battery deferred to lane release.
- Aaron transfers D363+ to Claude/Fable. `COORDINATION.md` holds the optimized New Market Heights packet; startup docs/hooks force the relay check.

## D361 GAINES' MILL PLANNING CONTRACT — LANE-003 DRIVE lock + spec/probe, no runtime — 2026-07-10 (D361)
- `docs/design/gaines-mill-battle-build-spec.md` and `tools/probe-gaines-mill-plan.mjs` lock the first Codex battle-ladder item before runtime. No data file, registry/menu entry, combat change, or generated-game behavior ships here; the playable roster stays at 13 through Nashville.
- The source audit found and disclosed the aggregate conflict before runtime: ABT's evening map says about 32,000 CS / 34,000 US, CMH says 50,000 Confederates amassed for the final assault, and NPS gives Porter's 27,000 core rising toward 34,000. The 27,000 US / 31,500-32,500 CS game force is a mixed-source bounded abstraction (core Federal line vs ABT's enumerated 16-brigade wave), not an exact same-time OOB; the CS aggregate is Disputed and modeled strength Inferred. Porter/Hill/Hood ranks now have explicit two-source corroboration. The split CS-win/CS-killed-wounded direction guard is pinned; Turkey Hill remains excluded.
- Future-integration teeth cover T1/menu rank 15, schema, both historical baselines, exact data-derived Army Register pin, T10 flags, 14-scene Intel/media inventory, weather, 119-command suite enrollment, generated HTML, and D74 no-fudge keys.
- Aaron authorized inheriting ChatGPT helpers when the surface has no per-helper controls, limited to output-insensitive evidence work. The Ultra top loop retains every quality-bearing judgment and commit. The rule is durable in the routing/startup docs and `~/.codex/AGENTS.md`.
- Negative bind: DRIVE→CONTRACT made only the lane step red (7/8); exact restore returned 8/8 and the original checksum. Gate: GATE OK; schema 43/43; research 15/15; plan 8/8; roster 8/8; custom builder 15/15; Bull Run 15/15; Malvern Hill 27/27; JSON readback all `ok:true`, zero failed steps/pageerrors; diff clean.
- Next: D362 playable Gaines' Mill from the committed spec.

## D360 PHASE I 5c — Start-anywhere career trajectory: full promotion lattice + trajectory read-out — 2026-07-10 (D360)
- The journey's promotion hook grew from two transitions to an 11-rung lattice (enlisted specialists through General; legacy D151 thresholds and decisive fast-track preserved verbatim; cumulative-wins semantic kept deliberately), plus a "Career Trajectory" read-out (current → next rank, victories banked/needed, arc-so-far) in the journey panel and full report. Nothing new rides the save; next-ranks are constrained to rankBase keys so fldPromotePerson's guard is the floor. New D360 probe step drives the D358 Sherman row Col.→Brig. Gen. across four victories; surgical bind test (colonel rung removed → exactly D360 red, D151 green). Gates: GATE OK; loot-survival 12/12; ratings 22/22 (one documented goto-flake rerun); camp 8/8; schema 43/43; 0 pageerrors; diff clean. D359 (same session): Aaron unlocked all phase lanes for the next Codex session, with Leetown Native OOB + playable Fort Pillow held as dignity carve-outs.

## D358 PHASE I 5b — First prosopography batch: eight Bull Run command rows — 2026-07-10 (D358)
- Batch sized (8) and logged in DECISIONS BEFORE the first record per the LANE-002 contract. Contract Relay roles held: 8 Sonnet/medium gather packets → 8 Opus/high default-refute skeptics (16 agents, 0 errors) → Fable-5 top loop adjudicated all 8 AMEND verdicts and owns the final text. Sherman, Porter, Howard, Griffin (US) + Evans, Bee, Bartow, Hampton (CS) replace `bullrun1` `:cmd` slots — each previously a generated hardcoded-'Captain' row, so the batch is also a rank-accuracy fix visible in the D357 muster roll. Refute-driven honesty: no brigade casualty numbers (unverifiable), Evans's temporary colonelcy, Bee's contested quote + posthumous confirmation, Bartow's monument logged as a memorial-rank artifact, Hampton scoped to the Legion's engaged infantry. Gates: importer 39/39 Verified; GATE OK; probe-loot-survival 11/11 (912 pin held, applied=39); two bind tests (count tooth + deep tooth, each exactly red); byte-identical restore; ratings 22/22; camp 8/8; schema 43/43; 0 pageerrors; diff clean. Lane count 848 → 840; canonical records 31 → 39 (19US/20CS).

## D357 PHASE I 5a — Muster-Roll inspect surface wired into the HUD (T29) — 2026-07-10 (D357)
- New `src/tactical/T29-muster-roll-ui.js` + one guarded T0 seam: a native aria-correct toggle in the selected-unit HUD expands the full T14 muster panel. Presentation-only, byte-identical when ratings data absent, open-flag transient on `__FIELD`. WCAG AA: 11.05:1 text, target-size auto-fixed by wcag-auditor, the flagged dangling `aria-controls` resolved via always-in-DOM `hidden` panel, focus survives HUD rebuilds (reassignment wrapper, S22 lesson). Teeth: probe-ratings 22/22 incl. bind-tested seam; adjacents field 23/23, order-feel 22/22; 0 pageerrors; GATE OK. LANE-002: 5a SHIPPED; 5b/5c remain CONTRACT.

## D356 CONTRACT RELAY — COORDINATION.md cross-tool lane ledger shipped — 2026-07-10 (D356)
- New tracked `COORDINATION.md` (linked from START-HERE/AGENTS/CLAUDE.md): lane locks with full committed contracts; **red teeth never land in git — teeth ship in the same commit as the fix**; role-based model routing. LANE-001 = the E50 retro worked example; LANE-002 = Phase I "Named Army" opened with the 848-row inventory. Docs-only: build GATE OK, game byte-unchanged, diff clean.

## D355 FULL RELEASE CHECKPOINT — 118/118 green in 4 fail-fast segments; 3 findings fixed in-run — 2026-07-10 (D355)
- **Battery:** full `npm run vet:noreg` (118 commands), local full-access session, serialized, artifacts read. Fail-fast + `--from=` resume gave D192-style split coverage: 1-25 → 26-36 → 37-93 → 94-118, final segment `VET NO-REGRESSION OK`.
- **Reds (each root-caused, fixed, re-run green — none retried blind):** probe-western-theater's time-bound "future battles must not exist" leg → re-toothed to registry-membership stowaway guard (bind-tested); probe-loot-survival's pre-D353 poison fixture → E50 door-rejection tooth + sanitize teeth keep non-poison tampers, and the stale 645 registry pin → 912 (+89 units × 3, cross-checked vs the LANE-002 inventory); **product-data fix:** chattanooga/franklin/nashville weather hints carried illegal `Verified/Inferred` provenance (+ Franklin `late afternoon`) → Inferred/afternoon per the shipped convention, sources retained, presentation-only, battle guards re-ran green.
- **Nothing deferred (M3c).** diag-classic nonBlank 346; sweep/full-campaign/tactical-visuals/LLM ok=true, 0 pageerrors everywhere.

## D354 TRANSFER READINESS CONSUMER — E70 built per Aaron's disposition; run-2 ledger fully dispositioned — 2026-07-10 (D354)
- **What shipped:** `_cmdTransferReadinessLift(C)` — a bounded command-friction term (−3, data-configured, clamped 0..6) on `commandLeadership`, paid ONLY by an explicitly appointed, un-transferred cross-theater general. History-following defaults, natural fits, and completed Transfers read exactly 0 → untouched campaigns byte-identical. Transfer capital now buys a real, visible, bounded benefit (audit option b: the transferred general's battle command rating).
- **Honesty:** the Command-desk disclosure now states what capital buys; the stale "records readiness only" copy + its pinned tooth updated together (logged in D354). No new player-facing historical claims; calibration Inferred, sized under the corps lift per §27.
- **Gates:** build GATE OK; schema 43/43; probe-command 90/90 (new E70 tooth incl. purity snapshot); adjacents ratings 21/21, bridge 6/6, oob 17/17; 0 pageerrors; negative bind test — consumer unwired → exactly the E70 tooth red (83→83) → restored; `git diff --check` clean.
- **Next:** the full `npm run vet:noreg` release checkpoint (118 commands) owed since the run-2 fix stack began.

## D353 CAMPAIGN-ENVELOPE DEEP SAVE GUARD — E50 shipped; run-2 FIX-NOW queue EMPTY — 2026-07-10 (D353)
- **What shipped:** deep own-`hasOwnProperty` rejection of the whole campaign save envelope at every accept lane (autosave loadLocal, atomic applySave, slot-read/import/undo via `_slValidSave`), plus tamper-proof iteration at the D323 `raw.ids` Transfer sink. New scanner `_slCampaignPoisoned` in src/91-save-slots.js; 105-save-guard stays override-only per the D244 static tooth.
- **Teeth:** the prior Codex session's uncommitted red probe teeth adopted unchanged as the acceptance contract and committed WITH the fix — probe-save-slots 16/16 (import/slot/boot/atomic E50 teeth), probe-command 89/89 (sink sanitization tooth). Negative test: guard stubbed → exactly the 5 E50 teeth red, sink crash reproduced verbatim → restored green.
- **Gates:** build GATE OK (E41 save-shape hashes consciously updated, no `_SAVE_VER` bump — purely rejective tightening, legit saves byte-identical); schema 43/43; adjacents ratings 21/21 + bridge 6/6; 0 pageerrors everywhere; `git diff --check` clean. Full battery deferred to the imminent D176 release checkpoint.
- **Next:** E70 readiness consumer (Aaron 2026-07-10: build the consumer, keep the cost), then full `npm run vet:noreg`.

## D352 REPORT HTML ENTITY-ESCAPING CONTRACT — E69 shipped — 2026-07-10 (D352)
- **What shipped:** five report generators now share an ampersand-first five-character entity escaper; report fields assumed numeric are escaped too. Parse5 is a direct dependency for the hostile-fixture gate.
- **Negative proof:** identity escaping made the exact-entity and hostile-round-trip rows red (**2/4**, exit 1). Clean mode passed seven text/quoted-attribute payloads, all five tool-routing checks, and nullish normalization **4/4**, with no interpreted forbidden nodes or event attributes.
- **Focused gate/readback:** five real reports parsed with 0 errors/forbidden nodes/event attrs; schema **43/43**; orphan assets **199/199**; report inventory **117/117**; media **13/13**; Group 6 **9/9**; build GATE OK, game unchanged; suite list **118**; syntax/dependency/diff clean. Full `vet:noreg` deferred under D176.
- **Queue:** E50 is the sole remaining FIX-NOW item. E70 remains proposal-only.

## D351 LATE-WESTERN BATTLE-FLAG METADATA — E66 shipped — 2026-07-10 (D351)
- **What shipped:** Chattanooga, Kennesaw, Franklin, and Nashville now carry explicit Western/AoT metadata (`W`, no AotP badges, representative Hardee-pattern default) instead of silently inheriting the Eastern/ANV fallback. Registry parity now requires explicit metadata for every one of the 13 historical scenarios.
- **History scope:** Tennessee State Museum and NPS evidence supports the Hardee/Cleburne family and the four battles' Army-of-Tennessee identity. The default is deliberately representative, not a claim of one uniform regimental flag; exact variants remain unit-specific work.
- **Negative/focused gate:** deleting Nashville metadata in-browser made exactly 3 new teeth red, flags **39/42**, exit 1; all 39 legacy rows stayed green. Final flags **42/42**, schema **43/43**, roster **8/8**, visual fidelity **27/27**, all 0 pageerrors/texture warnings; screenshots/artifacts read; syntax/build/diff green. Full `vet:noreg` deferred under D176.
- **Queue:** 2 FIX-NOW items remain: E69 and E50. Next: E69 real entity escaping across five report tools. E70 remains proposal-only.

## D350 CANONICAL ROUTING COHERENCE — S43 shipped — 2026-07-10 (D350)
- **What shipped:** current routing in `START-HERE.md`, `AUTONOMOUS-RUN.md`, `V1-CHECKLIST.md`, and `AUDIT-PROMPT.md` now reflects 13 playable scenarios, D341's closed Antietam revision, D324's broad unlock, D336's 5.6 Sol + Ultra policy, and the remaining run-2 order E66 → E69 → E50. Contradictory D322/D333 snapshots are explicitly historical, not rendered as current instructions.
- **Boundary decision:** Phase D/H/naval/M8 and custom phase-authoring lanes are eligible under normal gates. The trans-Mississippi packet alone retains D183's narrower two-tier source/OOB go/no-go. Nashville is shipped, including its documented USCT lane; remaining USCT candidates are not presented as already built.
- **Focused gate/readback:** four-doc visible-text/comment-balance assertion green; build **GATE OK**, generated HTML unchanged; schema **43/43**; research **15/15**; tactical roster **8/8**, 13 exact scenarios, 0 pageerrors; suite list **117**; artifact/diff readback clean. Full `vet:noreg` deferred under D176.
- **Queue:** 3 run-2 PENDING FIX-NOW items remain including E50. Next: E66 four-battle Western/AoT flag metadata. E70 remains proposal-only.

## D349 LARGEST-SCENE INTEL UHD-617 PROFILE COVERAGE — E68 shipped — 2026-07-10 (D349)
- **What shipped:** Kennesaw is configured and live-verified as the largest of 13 shipped opening OOBs at 17 units (Franklin 16; Chickamauga 8). A third serialized `largest-low` Kennesaw profile joins the existing Chickamauga high/low legs and writes the complete scene inventory into the artifact.
- **Caps/readback:** the existing 360-call / 1,400-object low-tier hard caps are now pinned unchanged. Kennesaw low measured **117 calls / 169 objects**, all 17 opening units, low-tier marker/formation/smoke contract green, 0 pageerrors/texture warnings. Timing remains warning-only; only the known 2.418 MB raw-embed soft warning fired.
- **Negative/focused gate:** stale 8-unit Chickamauga largest config made exactly the inventory step red, **25/26**, exit 1. Final Intel profile **26/26**; schema **43/43**; build **GATE OK**; media budget **13/13**; Kennesaw **11/11**, 0 pageerrors; syntax/JSON/diff clean. Full `vet:noreg` deferred under D176.
- **Queue:** 4 run-2 PENDING FIX-NOW items remain including E50. Next: S43 stale canonical-doc reconciliation. E70 remains proposal-only.

## D348 DRAFT-HONEST CONNECTED-AI LIVE STATUS — S42 shipped — 2026-07-10 (D348)
- **What shipped:** the one connector-readiness predicate now accepts a config value. Runtime still validates saved `_llmConn`; the settings panel validates current `_llmUi`, so its polite live status describes the fields/toggles visibly being edited rather than a saved/draft hybrid.
- **Two-way proof:** invalid saved + valid draft announces ready while saved state stays invalid; valid saved + invalid draft announces incomplete while saved state stays valid. Both update the same live node, save nothing, and make no network request. Restoring the old predicate made exactly this new step red.
- **Focused gate/readback:** syntax clean; build **GATE OK**; LLM commander **26/26**, 0 pageerrors, 0 network; accessibility **25/25**; H0 main menu **5/5**, both 0 pageerrors; artifact/diff readback clean. Full `vet:noreg` deferred under D176.
- **Queue:** 5 run-2 PENDING FIX-NOW items remain including E50. Next: E68 largest-scene Intel UHD-617 profile leg. E70 remains proposal-only.

## D347 DETERMINISTIC TACTICAL-LABEL DECLUTTER — S41 shipped — 2026-07-10 (D347)
- **What shipped:** one priority/collision queue now owns every 2D map/officer/support label, reserves visible units/markers/UI, paints high-contrast chips last, and adds leader lines when labels move. Objective and officer names are mandatory; only lower map tiers may hide. The pass is presentation-only and exposes a deterministic layout audit.
- **Screenshot/readability proof:** refreshed Shiloh is **19/19** labels; Malvern is **16/19**, with only 3 lower terrain/route labels hidden. All five 2D scenes report 0 label-label overlaps, 0 reserved-space overlaps, 0 mandatory hidden labels, and stable identical-frame signatures; all five paired 3D scenes remain green.
- **Negative/focused gate:** hostile Shiloh placement found **9** overlaps and exit 1. Clean tactical visuals **10/10**, 0 pageerrors/lifecycle/cleanup errors; field **23/23**, officers **15/15**, visual fidelity **27/27**; syntax clean; build **GATE OK**; `git diff --check` clean. Full `vet:noreg` deferred under D176.
- **Queue:** 6 run-2 PENDING FIX-NOW items remain including E50. Next: S42 draft-honest Connected-AI live status. E70 remains proposal-only.

## D346 FAIL-CLOSED MEANINGFUL DATA-SCHEMA GATE — E64 shipped — 2026-07-10 (D346)
- **What shipped:** `validate-data-schemas` now has four closed-world, nonempty schema families covering all 43 current data files, meaningful battle/OOB/phase and per-document structure checks, nonzero failure exit, and an authoritative JSON artifact. Unknown files fail closed. `vet-no-regression` enrolls the gate after the two canonical importers; suite list is **117 commands**.
- **Negative proof:** `--diagnostic-invalid=all` corrupts one required structure per family in memory only; exactly Antietam battle objective, artillery guns, cabinet sides, and ratings attributes failed, artifact `ok=false`, exit 1. Clean mode restored **43/43**, all family counts, 0 failures/pageerrors, and no zero-key rule.
- **Focused gate/readback:** touched-tool syntax clean; soldier replacements **31/31**, women in war **9/9**, battle-build research **15/15**; build **GATE OK**, generated HTML unchanged; green schema JSON/report read; `git diff --check` clean. Full `vet:noreg` deferred under D176.
- **Queue:** 7 run-2 PENDING FIX-NOW items remain including E50. Next: S41 deterministic tactical-label declutter and readability evidence. E70 remains proposal-only.

## D345 BATTLE-GUARD ENROLLMENT + HONEST SWEEP — E63 shipped — 2026-07-10 (D345)
- **What shipped:** `vet-no-regression` now enrolls Chattanooga, Kennesaw, Franklin, and Nashville focused guards serially after Chickamauga; suite list is **116 commands**. `sweep-all-battles` now binds registry/order parity, per-seed completion and result shape, finite casualties, pageerrors, artifact `ok`, cleanup, and exit status instead of always returning success.
- **Negative proof:** a controlled `--diagnostic-pageerror` one-seed run completed all 13 battles but wrote `ok=false`, the exact diagnostic pageerror, one failure, and exited 1. Clean mode restored the artifact.
- **Focused gate/readback:** touched-tool syntax clean; build **GATE OK**, generated HTML unchanged; focused guards Chattanooga **16/16**, Kennesaw **11/11**, Franklin **10/10**, Nashville **12/12**, all 0 pageerrors; clean sweep **13 scenarios / 104 runs**, registry/order parity true, 0 unfinished, 0 invalid results/casualties, 0 failures, 0 pageerrors, exit 0; `git diff --check` clean. Suite timeout is 15 minutes for serialized 13×8 coverage on the 8 GB Mac. Full `vet:noreg` deferred under D176.
- **Queue:** 8 run-2 PENDING FIX-NOW items remain including E50. Next: E64 meaningful fail-closed schema validation + suite enrollment. E70 remains proposal-only.

## D344 ALFRED J. VAUGHAN IDENTITY/SPELLING — C70 shipped — 2026-07-10 (D344)
- **What shipped:** every player-facing Kennesaw occurrence now uses Alfred J. **Vaughan** / Vaughan's Tennessee Brigade, grounded in VMI Archives; the spec records the NPS OOB spelling as a source variant. Stable id `cs_vaughn` and every simulation input remain unchanged; generated HTML was rebuilt from source.
- **Probe teeth:** the plan gate requires the VMI URL and correct identity/rank spelling; the runtime gate pins `cs_vaughn` plus exact unit, commander, and codex labels and rejects the old spelling on player-facing fields. Bind tests made the plan gate red **5/6** and the runtime gate red on exactly the rank/identity teeth when the old spelling was temporarily restored; final bytes were restored and rerun green.
- **Focused gate/readback:** JSON parse + probe syntax clean; build **GATE OK**; schema **43/43** with timestamp churn removed; Kennesaw plan **6/6**; Kennesaw **11/11**, CS holds **8/8**, US higher loss **8/8**, 0 pageerrors; adjacent Franklin **10/10**, 0 pageerrors; final JSON artifacts `ok=true` with no failed steps; `git diff --check` clean. The existing Kennesaw post-side-choice PNG remains a black/non-semantic capture and was not used as identity evidence. Full suite deferred under D176.
- **Queue:** 9 run-2 PENDING FIX-NOW items remain including E50. Next: E63 suite enrollment and battle-sweep failure semantics. E70 remains proposal-only.

## D343 LLM-CONNECTOR BROWSER-CALLS CONSENT ENFORCEMENT — E65 shipped — 2026-07-09 (D343)
- **What shipped:** `fldLlmConnConfigured()` is now the one consent seam — adapter B (Anthropic) is unconfigured without the explicit `browserOptIn`, so `fldLlmEnabledForBattle`, `fldLlmArmOnLaunch`, and `fldLlmDispatchAsync` (which all gate on it) can never arm the commander or send the `anthropic-dangerous-direct-browser-access` header before the player consents. Adapter A untouched; pre-E65 stored configs are NOT grandfathered (consent-conservative silent disarm until opted in). The opt-in note now states the enforced behavior and the Status line names the toggle as the blocker instead of "fill in the fields above."
- **Probe teeth:** CONFIG STATE corrected (the old step asserted the defect — anthropic+key configured without opt-in); new E65 CONSENT step proves refusal (`cb(null)` sync, zero fetch) without opt-in, exact request shape (locked endpoint, opt-in header, key, `anthropic-version`, model/system/messages body) with it, and arm-seam gating both directions — all against a recording mock fetch restored in `finally`, with the zero-network spy and playwright request listener still authoritative.
- **Verification:** 3-lens adversarial panel — consent-bypass hunt REFUTED (Opus/high: no path fires the header without consent), probe-teeth sound (dangling 12 s timer verified a benign no-op), UX lens drove the Status-line fix; S42 confirmed not worsened. Bind-test: predicate removed → rebuilt → probe red on exactly the two consent teeth (the unconsented dispatch reached only the recorder — zero real network even in the red run) → restored → green.
- **Focused gate/readback (final bytes):** `node --check` clean ×2; build **GATE OK**; `probe-llm-commander` **25/25**, 0 pageerrors, 0 network, exit 0; adjacents `probe-field` **23/23** and `probe-accessibility` **25/25** rerun on final bytes, exit 0; `git diff --check` clean. Full suite deferred under D176.
- **Queue:** 10 run-2 PENDING FIX-NOW items remain including E50. Next mechanical Codex slice: C70 Vaughan spelling. Next reasoning-tier slice: E64 (schema-gate integrity) or S41 (label declutter).

## D342 TACTICAL-VISUALS PER-SCENE BROWSER ISOLATION — E67 shipped — 2026-07-09 (D342)
- **Provenance:** Codex authored the `tools/probe-tactical-visuals.mjs` isolation rewrite and ran it green (10/10 artifact at 02:47Z), then ran out of usage before the negative test, docs, and commit. This Fable session found the uncommitted diff, panel-reviewed it (crash-paths Opus/high, Playwright-API Sonnet/medium, artifact-honesty Opus/high — no blocking finding; all honesty properties confirmed), hardened it, and re-gated everything on the final bytes.
- **What shipped:** per-scene fresh browser+context+page (serialized for the 8 GB Mac), bounded 5 s teardown, page-crash listener feeding the scene verdict, `failureStage` on every failure path, honest per-scene partial JSON with `expectedScenes`/`attemptedScenes`, and the `--diagnostic-close-scene` negative-test mode. Session hardening from panel findings: 240 s `page.evaluate` hang bound + 5 s bound on the teardown `fldExit` evaluate (a hang must cost one scene, not the run), SIGKILL via `browser.process()` when a bounded browser close times out (no zombie Chrome starving later launches), and `failureStage` for in-page assert returns (`in-page-assert`) and texture-warning flips (`texture-warning`).
- **Negative test (final bytes):** `--diagnostic-close-scene=visual-malvern-hill-3d` — the audited killer scene — fails alone; all 6 later scenes pass fresh; printed `diagnostic recoveryProven=true later=6/6`; exit 1; diagnostic artifacts can never read green.
- **Focused gate/readback:** `node --check` clean; clean full run **10/10, exit 0**; artifact `ok=true`, 0 pageerrors / 0 lifecycleErrors / 0 cleanupErrors on all scenes, `isolation=fresh-browser-context-page`; Malvern Hill 3D PNG read and fully painted (US/CS lines, colors, works, woods, roads); build **GATE OK**; generated HTML byte-identical (tools-only change); `git diff --check` clean. Full suite deferred under D176.
- **Queue:** 11 run-2 PENDING FIX-NOW items remain including E50. Next: E65 (T28 `browserOptIn` consent enforcement) in this session; C70 Vaughan spelling stays the next mechanical Codex slice.

## D341 ANTIETAM RICHARDSON BATTLE-DATE RANK CONSISTENCY — C69 shipped — 2026-07-09 (D341)
- **What shipped:** `data/antietam.json` now gives the `us_richardson` reinforcement the same exact `Maj. Gen. Israel B. Richardson` label already carried by `ld_richardson`; generated HTML was rebuilt. No other Antietam field changed, and the separate Washington Artillery commander remains `Capts. Squires, Richardson, Brown`.
- **Probe/audit:** one new `probe-antietam` data-truth step finds the Sunken Road phase and both Richardson records by stable id, rejects the obsolete brigadier form, and protects the artillery captain from name-based confusion. The D328 Antietam packet records the applied revision and is now `SOLID_AS_IS` while preserving the original evidence and source register.
- **Focused gate/readback:** data parse and touched-probe syntax clean; build **GATE OK** with the known embed soft warning; schema **43/43, 0 failed** with timestamp churn removed; battle-build research **15/15**; final Antietam **17/17**, `ok=true`, 0 failed steps, 0 pageerrors. All 16 baseline step objects are exact by name; only the C69 tooth was added. The first final PNG had an incomplete paint and was rejected; the unchanged rerun produced a readable screenshot matching the baseline scene. `git diff --check` clean. Full suite deferred under D176.
- **Queue:** 12 run-2 PENDING FIX-NOW items remain including E50. Next is C70, the Alfred J. Vaughan player-facing surname correction under the Kennesaw gate.

## D340 KEYBOARD TACTICAL ORDERING EQUIVALENCE — S40 shipped — 2026-07-09 (D340)
- **What shipped:** `M` opens a selected-brigade order cursor; arrows move its endpoint in 30-yard steps; `[` / `]` adjust facing by 15 degrees; Enter commits; Shift+Enter appends through the existing waypoint queue; Escape cancels without leaving battle. Pointer orders retain their old tap/drag/handle/charge/Shift behavior.
- **Architecture:** `src/tactical/T20-order-feel.js` keeps the cursor as presentation state and commits a movement-only gesture through `fldResolveOrderGesture` → `fldApplyOrder` / `fldEnqueueOrder`. `src/tactical/T0-field-sandbox.js` adds editable/modal/inactive guards and the dispatch seam. No simulation or outcome path changed.
- **Accessibility/readout:** static dual-stroke crosshair + facing ghost, high-contrast instruction chip, relative-position/facing live announcements, selected/no-selection HUD hints, and both help references. No animation or transition, so no motion probe was due.
- **Focused gate/readback:** build **GATE OK**; order-feel **22/22** with all 17 legacy rows byte-equal to the D339 baseline; field **23/23**; accessibility **25/25**; tactical HUD **3/3** viewports; help overlay **10/10**. Every final artifact reports `ok=true`, 0 failed steps, and 0 pageerrors; screenshots read; `git diff --check` clean. The first new pointer-event fixture landed on the facing handle created by its preceding tap, correctly exercising re-aim; the fixture states were separated and the final product run passed.
- **Next:** C69 Antietam Richardson rank label + focused tooth. C70 and the rest of the MED/LOW ledger remain untouched.

## D339 KENNESAW PIGEON HILL INPUT CORRECTION — C71 honest A/B shipped — 2026-07-09 (D339)
- **Source decision:** NPS National Register text and the NPS Pigeon Hill site bulletin identify the complete Pigeon Hill commitment as three brigades, about 5,500 men: Giles A. Smith and Lightburn from Morgan L. Smith's division plus Walcutt from Harrow's. They do not support the separate 1,200-man `us_morgan_smith_support` that runtime fielded at 55 seconds.
- **What shipped:** removed that unsupported reinforcement, retained Morgan L. Smith as a verified brigadier-general command identity, added explicit `assaultSector` values to every fielded US infantry brigade, updated the Kennesaw spec/source register, and rebuilt generated HTML. Pigeon Hill commitment is **6,700→5,500**; all-fielded US start is **16,000→14,800**; CS remains **11,925**. No combat rule, terrain, timing, doctrine, weapon, gun count, experience, score, winner, or output gate changed.
- **Probe teeth:** `probe-kennesaw` now sums every fielded US unit from initial OOB plus reinforcements by sector, rejects unclassified US infantry, requires the three sourced Pigeon Hill brigades at 5,500 and Cheatham Hill at 9,000, and rejects a return of `us_morgan_smith_support`. Its casualty readback now uses dynamic all-fielded starting strengths and writes all eight seed rows.
- **Honest A/B:** A captured at `f67cec5`; B used the same seed battery. Direction is unchanged: **CS holds 8/8→8/8**, **US higher loss 8/8→8/8**. Normalized seed-loss deltas (B−A, US/CS) for the four rows preserved by the old artifact are s1 **+98/+40**, s7 **+71/−36**, s21 **−266/+29**, s33 **−391/+315**; seed 909 **−100/−66**. No output tuning followed.
- **Focused gate/readback:** touched probe syntax and Kennesaw JSON clean; build **GATE OK** (known raw-embed soft warning); schema report **43/43, 0 failed**; Kennesaw plan **6/6**; Kennesaw **10/10** `ok=true`, 0 failed steps, 0 pageerrors; Franklin **10/10** after one initial no-step readiness-timeout retry; Chattanooga **16/16**; all final adjacent JSON `ok=true`, 0 failed steps, 0 pageerrors; timestamp-only schema churn restored; `git diff --check` clean. Full suite deferred under D176.
- **Next:** S40 keyboard order/facing/waypoint equivalence, the last run-2 HIGH.

## D338 GETTYSBURG TRUTH BUNDLE — C66+C67+C68 text/history corrections shipped — 2026-07-09 (D338)
- **What shipped:** `data/gettysburg.json` wording for C66 (Longstreet Day-2 sole-blame framing replaced with the documented contested command-and-march context, in agreement with the codex Lost Cause debunk), C67 (the unsourced "General, I will take command" Meade quote removed; Hancock's July 1 field-command assignment now taught separately from his July 3 wound), and C68 (Kemper seriously wounded and captured, not killed — Garnett killed, Armistead mortally wounded); one new data-only truth-teeth step in `tools/probe-gettysburg.mjs`; regenerated HTML. Encyclopedia Virginia added to the battle's Sources manifest and stamps.
- **Text-only readback:** no OOB/strength/timing/terrain/combat/score change; the probe's historical-direction battery is unchanged (Day 1 CS 7/8, Day 2 US 8/8, Day 3 US 8/8, aggregate US 8/8). One incidental in-passage precision fix: Jackson "(mortally wounded at Chancellorsville)".
- **Sources verified this session:** EV 'Gettysburg Campaign' + 'James Longstreet'; NPS 'Union Commanders at Gettysburg' (contains no take-command quote); NPS Fort McHenry 'Gettysburg Prisoners of War'; ABT Hancock bio. Sonnet fetch agents + a 3-lens Opus adversarial panel (framing/citations/consistency), all accepted edits shipped; teeth negative-tested (clean file passes, all four regression classes caught).
- **Focused gate/readback:** `node --check` clean; build **GATE OK** (known raw-embed soft warning); schema report **43/43, 0 failed** (read per E64); `probe-gettysburg` **19/19** `ok=true` **0** pageerrors; adjacent `probe-antietam` **16/16** `ok=true` **0** pageerrors; schema-report timestamp churn restored; `git diff --check` clean.
- **Next:** C71 Kennesaw Pigeon Hill overfielding as a separate sim-affecting A/B milestone.

## D337 AUDIT RUN 2 — audit/triage ledger only — 2026-07-09 (D337)
- **Scope honored:** completed Part 1 full-spectrum audit and Part 2 ranked triage only; no finding, V1 item, or V2/V3 item was implemented.
- **Result:** `REVIEW-QUEUE.md` now carries `## AUDIT — 2026-07-09 (run 2)`: 17 new FIX-NOW findings (4 HIGH / 11 MED / 2 LOW), existing E50 re-confirmed/re-triaged to FIX-NOW, one MED proposal, and the material refutations.
- **Browser boundary:** preserved the red `probe-tactical-visuals` artifact after three valid green scenes, one Malvern Hill 3D frame-detach/navigation failure, and the resulting closed-page cascade. No rerun began; no server remains.
- **Report adjudication:** kept the meaningful source inventory and orphan-reference-map refreshes; restored the schema report's timestamp-only churn.
- **Docs/report gate:** build **GATE OK** with the known raw-embed soft warning; source inventory **4/4** (91 files / 29 tactical / 1,858 functions); ledger/docs/report integrity check green; `git diff --check` clean. No browser gate was started.
- **Next:** fresh Part 3 begins with the text-only Gettysburg truth bundle C66/C67/C68; C71 Kennesaw overfielding follows as a separate sim-affecting milestone.

## D335 NASHVILLE BATTLE-BUILD — playable two-phase T8 implementation shipped — 2026-07-08 (D335)
- **What shipped:** `data/nashville.json`, registry/menu rank after Franklin in `src/tactical/T1-bull-run.js`, new focused guard `tools/probe-nashville.mjs`, both historical baselines updated, schema validator battle-file list updated for Nashville, generated HTML rebuilt, schema artifact refreshed.
- **Scenario shape:** two-phase T8 Nashville; US attacker / CS defender; fog off; Phase 1 Dec. 15 Redoubts/Montgomery Hill scoreWeight 1; Phase 2 Dec. 16 Shy's Hill/Peach Orchard Hill scoreWeight 3. Franklin remains separate; Spring Hill remains teaching-only.
- **Source/OOB readback:** compact phase strengths avoid broad 85,000 / 55,000 totals. Probe readback: phase 1 **16,300 US / 7,575 CS**, phase 2 **19,550 US / 11,150 CS**, with **20** Inferred-strength labels.
- **Rank/sector/USCT traps:** Thomas/A. J. Smith/Schofield/Wilson/Steedman Maj. Gens.; McArthur/Wood Brig. Gens.; Hood temporary General / permanent Lt. Gen.; S. D. Lee and Stewart Lt. Gens.; Cheatham/Bate Maj. Gens.; Shy not a general; Forrest absent from main Nashville field. S. D. Lee stays at Peach Orchard/Overton, Cheatham/Bate/Shy at Shy's Hill, Stewart in the center. USCT placement stays Peach Orchard/Overton: 12th/13th/100th plus 18th USCT support context, no invented Shy's Hill regiment placement.
- **D74 readback:** no per-battle damage/firepower/casualty/winner/score/force-win keys. Artillery uses gun counts under the universal model; the result comes from OOB, terrain, works, artillery, phase weights, Wilson pressure, USCT/Steedman pinning pressure, and objective mechanics.
- **Focused gate/readback:** build GATE OK with the known raw-embed soft warning; schema validation **43/43**; Nashville plan **7/7**; Nashville runtime **12/12** with US aggregate win **8/8**, Redoubts **8/8**, Shy's Hill **8/8**, CS higher loss **8/8**; roster **8/8**; custom-builder **15/15**; adjacent Franklin **10/10**; adjacent Kennesaw **10/10**; all required JSON artifacts `ok=true`, **0** failed steps, **0** pageerrors; `git diff --check` clean.
- **Next:** stop at the D335 battle-build boundary. Remaining natural Group 7 candidates: USCT/New Market Heights or another researched lane; the D328 Antietam label fix remains a small independent cleanup.

## D334 NASHVILLE BATTLE-BUILD SPEC — durable spec + plan probe, no runtime implementation — 2026-07-08 (D334)
- **What shipped:** `docs/design/nashville-battle-build-spec.md` and `tools/probe-nashville-plan.mjs`. No `data/nashville.json`, no registry/menu change, no runtime/combat change, and no generated-HTML behavior change.
- **Scenario shape locked:** two-phase T8 Nashville; US attacker / CS defender; `defaultFog:false`; Phase 1 Dec. 15 Redoubts/Montgomery Hill scoreWeight 1; Phase 2 Dec. 16 Shy's Hill/Peach Orchard Hill scoreWeight 3. Franklin remains separate; Spring Hill remains teaching-only.
- **Source/OOB recheck:** before writing the spec, load-bearing claims were reverified against American Battlefield Trust Nashville materials, Battle of Nashville Trust Peach Orchard Hill and Shy's Hill pages, and Nashville Metro historical markers. The older Franklin/Nashville packet was used as a starting point only. Broad 85,000/55,000 force figures are context, not literal active-map strengths; exact runtime unit strengths remain **Verified identity; Inferred strength** unless pinned.
- **Rank/sector/USCT traps:** Thomas, A. J. Smith, Schofield, Wilson, and Steedman Maj. Gens.; McArthur Brig. Gen.; Wood not overpromoted without source note; Hood temporary General / permanent Lt. Gen.; S. D. Lee and Stewart Lt. Gens.; Cheatham/Bate Maj. Gens.; Shy not a general; Forrest absent from main Nashville field. USCT placement is source-honest: 12th/13th/100th at Peach Orchard/Overton, 18th USCT supporting, no invented regiment-level Shy's Hill placement.
- **D74 readback:** no per-battle damage/firepower/casualty/winner/score/force-win keys or output forcing. Nashville's intended result must come from OOB, terrain, works, artillery, phase weights, timing, doctrine, and the universal model.
- **Focused gate/readback:** build GATE OK with the known raw-embed soft warning; Nashville plan **7/7**; roster **8/8**; custom-builder **15/15**; adjacent Franklin **10/10**; adjacent Kennesaw **10/10**; all required JSON artifacts `ok=true`, **0** failed steps, **0** pageerrors; `git diff --check` clean.
- **Next:** D335 runtime Nashville: data file, registry/menu after Franklin, focused runtime probe, both historical baselines, schema/build/browser readback, docs sync, commit, push.

## D333 FRANKLIN BATTLE-BUILD — playable single-phase implementation shipped — 2026-07-08 (D333)
- **What shipped:** `data/franklin.json`, registry/menu rank after Kennesaw in `src/tactical/T1-bull-run.js`, new focused guard `tools/probe-franklin.mjs`, both historical baselines updated, schema validator battle-file list updated for Franklin, generated HTML rebuilt, schema artifact refreshed.
- **Scenario shape:** single-phase Franklin; CS attacker / US defender; fog off; objective = Carter House / Carter cotton gin / Columbia Pike main line. Nashville remains queued as a later separate T8 battle.
- **Source/OOB readback:** active CS assaulting strength is **19,000**, inside the D332 **18,000-20,000** target; runtime does not use the broader army-present figure. Exact brigade/division game strengths are marked **Verified identity; Inferred strength** where not pinned.
- **Rank traps:** Hood temporary General / permanent Lt. Gen. nuance; Schofield and Stanley Maj. Gens.; Cox/Wagner Brig. Gens.; Opdycke Colonel; Cheatham/Cleburne/Brown Maj. Gens.; Stewart Lt. Gen.; John C. Carter mortally wounded Nov. 30 and died Dec. 10.
- **D74 readback:** no per-battle damage/firepower/casualty/winner/score/force-win keys. Artillery uses gun counts under the universal model; the defensive result comes from terrain, works, abatis, Fort Granger/main-line guns, OOB, doctrine, reserve timing, and objective mechanics.
- **Focused gate/readback:** build GATE OK with the known raw-embed soft warning; schema validation **42/42**; Franklin plan **7/7**; Franklin runtime **10/10** with US holds **8/8** and CS higher loss **8/8**; roster **8/8**; custom-builder **15/15**; adjacent Kennesaw **10/10**; all required JSON artifacts `ok=true`, **0** failed steps, **0** pageerrors; `git diff --check` clean.
- **Next:** stop at the D333 battle-build boundary. Remaining natural Group 7 candidates: Nashville, USCT/New Market Heights, or another researched lane; the D328 Antietam label fix remains a small independent cleanup.

## D332 FRANKLIN BATTLE-BUILD SPEC — durable spec + plan probe, no runtime implementation — 2026-07-08 (D332)
- **What shipped:** `docs/design/franklin-battle-build-spec.md` and `tools/probe-franklin-plan.mjs`. No `data/franklin.json`, no registry/menu change, no runtime/combat change, and no generated-HTML behavior change.
- **Scenario shape locked:** single-phase Franklin, Nov. 30, 1864; CS attacker / US defender; `defaultFog:false`; objective = the Federal main line around the Carter House / Carter cotton gin / Columbia Pike. Nashville remains queued as a later T8 two-phase build.
- **Source/OOB recheck:** before writing the spec, load-bearing details were reverified against American Battlefield Trust, Battle of Franklin Trust, the NPS Franklin special-resource study, and official-report/OOB locators for the runtime follow-up. The spec forbids using the broader 30,000+ / 33,000 Army of Tennessee present figure as the assaulting force; D333 should model roughly **18,000-20,000 Confederate assaulting troops** and keep exact brigade strengths labeled **Verified identity; Inferred strength** unless pinned.
- **Rank/terrain traps:** Hood temporary General / permanent Lt. Gen. nuance; Schofield and Stanley Maj. Gens.; Cox/Wagner Brig. Gens.; Opdycke Colonel; Cheatham/Cleburne/Brown Maj. Gens.; Stewart/S. D. Lee Lt. Gens. if included. Runtime Franklin should model the open southern approach, Winstead Hill context, Wagner's exposed line, works/ditch/head logs/abatis, Columbia Pike breach, Carter House/Cox HQ, cotton gin, Fort Granger/Harpeth support, and Carnton as teaching/casualty context.
- **D74 readback:** no per-battle damage/firepower/casualty/winner/score/force-win keys or output forcing. Franklin's result must come from terrain, works, OOB, doctrine, and the universal combat model.
- **Focused gate/readback:** build GATE OK with the known raw-embed soft warning; Franklin plan **7/7**; roster **8/8**; custom-builder **15/15**; adjacent Kennesaw **10/10**; all required JSON artifacts `ok=true`, **0** failed steps, **0** pageerrors; `git diff --check` clean.
- **Next:** D333 runtime Franklin: data file, registry/menu after Kennesaw, focused runtime probe, both historical baselines, schema/build/browser readback, docs sync, commit, push.

## D331 KENNESAW MOUNTAIN BATTLE-BUILD — playable single-phase implementation shipped — 2026-07-08 (D331)
- **What shipped:** `data/kennesaw.json`, registry/menu rank after Chattanooga in `src/tactical/T1-bull-run.js`, new focused guard `tools/probe-kennesaw.mjs`, both historical baselines updated, schema validator battle-file list updated for Chattanooga/Kennesaw, generated HTML rebuilt.
- **Scenario shape:** single-phase Kennesaw Mountain; US attacker / CS defender; fog off; objective = Kennesaw ridge breastworks and the Dead Angle across Pigeon Hill / Little Kennesaw and Cheatham Hill. Schofield's flank movement is teaching/campaign context, not the playable objective.
- **Source/OOB readback:** runtime preserves D330 sector totals: Pigeon Hill **5,500** Federals; Cheatham Hill **9,000** Federals. Exact brigade splits and Confederate strengths are marked **Verified identity; Inferred strength** where the sources do not pin headcounts. No 150,000/100,000 campaign totals are used.
- **Rank traps:** Johnston remains full General CSA and Hood is not commander yet; Hardee Lt. Gen.; Cheatham/Cleburne Maj. Gens.; Maney/Vaughn Brig. Gens.; Sherman/Thomas/Schofield/McPherson/Logan Maj. Gens.; McCook/Mitchell Colonels.
- **D74 readback:** no per-battle damage/firepower/casualty/winner/score/force-win keys. Artillery uses gun counts under the universal model; the defensive result comes from terrain, works, guns, OOB, doctrine, and objective mechanics.
- **Focused gate/readback:** build GATE OK with the known raw-embed soft warning; schema validation **41/41**; Kennesaw plan **6/6**; Kennesaw runtime **10/10** with CS holds **8/8** and US higher loss **8/8**; roster **8/8**; custom builder **15/15**; adjacent Chattanooga **16/16**; all required JSON artifacts `ok=true`, **0** failed steps, **0** pageerrors; `git diff --check` clean.
- **Next:** stop at the D331 battle-build boundary. Next Group 7 candidate can be Franklin/Nashville or USCT if selected; the D328 Antietam label fix remains a small independent cleanup.

## D330 KENNESAW MOUNTAIN BATTLE-BUILD SPEC — durable spec + plan probe, no runtime implementation — 2026-07-08 (D330)
- **What shipped:** `docs/design/kennesaw-battle-build-spec.md` and `tools/probe-kennesaw-plan.mjs`. No `data/kennesaw.json`, no registry/menu change, no runtime/combat change, and no generated-HTML behavior change.
- **Scenario shape locked:** single-phase Kennesaw Mountain; US attacker / CS defender; `defaultFog:false`; objective = the Confederate ridge/breastwork line spanning Pigeon Hill / Little Kennesaw and Cheatham Hill / Dead Angle. The attacker historically loses because of terrain, fieldworks, abatis, timing, and OOB inputs, never per-battle output fudge.
- **Source/OOB recheck:** before writing the spec, the load-bearing sector claims were reverified against NPS Kennesaw materials, NPS Union/Confederate OOB pages, the NPS National Register text, and ABT Cheatham Hill. The D331 implementation must preserve **~5,500 Federals at Pigeon Hill** (Giles A. Smith, A. J. Lightburn, Walcutt) and **~9,000 Federals at Cheatham Hill** (Newton/Davis; Harker/Wagner/Kimball and McCook/Mitchell). Confederate brigade identities are verified; exact brigade strengths may need **Verified identity; Inferred strength** handling.
- **D74/D92 guard:** forbids campaign-scale 150,000/100,000 strength totals, wrong ranks/command dates (especially Johnston/Hood and Hardee/Cheatham/Cleburne), and any damage/firepower/casualty/winner fudge.
- **Focused gate/readback:** `node --check tools/probe-kennesaw-plan.mjs`; `node tools/build.mjs` GATE OK with the known raw-embed soft warning; `node tools/probe-kennesaw-plan.mjs` green **6/6**; JSON readback `ok=true`, `failedSteps:0`; `git diff --check` clean.
- **Next:** D331 runtime Kennesaw: data file, registry/menu after Chattanooga, focused runtime probe, both historical baselines, schema/build/browser readback, docs sync, commit, push.

## D329 BATTLE-RESEARCH COVERAGE COMPLETION — the last six unbuilt, uncovered lanes (research/docs only) — 2026-07-08 (D329)
- **What shipped:** six new packets in `docs/design/battle-build-research/` — `eastern-1862`, `shenandoah-1862`, `shenandoah-1864`, `western-gaps`, `trans-mississippi`, `appomattox-campaign` — plus a README rewrite (lane table, lane-boundary note, D183 gate section, a "what is teaching-only and why" section, coverage statement) and an extended guard (**15/15**, +1 HYGIENE step). No data/runtime/registry/generated-HTML change; `civil_war_generals.html` byte-unchanged. **The library is now complete.**
- **Trigger:** Aaron's directive to finish the battle-research coverage — research every remaining buildable battle/campaign not shipped and not covered by a D327 lane.
- **Gap set confirmed first:** grepped `data/` for all 29 candidates; every hit was teaching/codex/bio prose, never a scenario. Jackson's Valley was split into its own lane so it carries a distinct verdict.
- **Method:** the D327 workflow rerun — 6 × [Opus researcher w/ live WebSearch/WebFetch → Opus adversarial verifier that re-fetched and edited in place] + Opus 4.8 main-loop final verify. 12 agents, 0 errors, ~1.17M subagent tokens.
- **Verdicts:** all six **READY_FOR_SPEC**. Leads: Gaines' Mill (single-phase defender-hold), Cross Keys+Port Republic (T8 two-phase), Cedar Creek (T8 two-phase), Stones River (T8 two-phase), Pea Ridge (T8 two-phase), Five Forks (single-phase).
- **Blocking finding:** **`trans-mississippi` is gated behind D183's verbatim "M8 battle-build still needs Aaron go/no-go"** — a two-tier gate (Tier 1 whole-lane, Tier 2 Native OOB). Its READY_FOR_SPEC means "writable once Aaron clears the gate," not "start now." Surfaced, not resolved.
- **Defects caught:** the **run prompt itself** wrongly claimed Jackson was never a lieutenant general (he was, from Oct 10 1862) — the verifier refuted the prompt from sources and rescoped the guard, preventing a probe that would falsely fail a correct future Chancellorsville build. Main-loop verify then caught Jackson's wounding (May 2) vs death (May 10) conflation. Also: ABT Second Manassas shows 125,000 Union *total* not engaged, and prints an anachronistic "Lt. Gen. Longstreet"; Cedar Creek's 7,682 is NPS's figure, not ABT's 8,824 or Wikipedia's 8,575.
- **Rank flip resolved:** Polk and Hardee were **Maj. Gens.** at Perryville (Oct 8 1862) and **Lt. Gens.** at Stones River (Dec 31 1862) — appointed Oct 10-11, two days after Perryville. Cleburne flips Brig.→Maj. Gen. across the same pair; Sheridan is Brig. Gen. at both (MG date-of-rank backdated to Dec 31 1862). Stand Watie was a **Colonel** at Pea Ridge (BG only in 1864); Sterling Price was a **Missouri State Guard** major general, not Confederate.
- **D74/D92 discovery:** Stones River, Perryville, Wilson's Creek, and McDowell **invert** the "winner bleeds less" assumption — the side holding the field lost more. Stones River's spec must guard **near-parity, explicitly NOT US < CS**.
- **Teaching-only (dignity/engine):** "The Burning," the Leetown scalpings, Sand Creek, the Appomattox surrender, Glorieta Pass (a wagon-train raid decided it), Brandy Station and all cavalry raids, the Valley Campaign's operational maneuver, the Red River river-war.
- **Exact gates run:** `node --check tools/probe-battle-build-research.mjs`; `node tools/probe-battle-build-research.mjs` **15/15, 0 fail**, JSON `ok=true`, hygiene `checked:21 clean:true`; `node tools/build.mjs` **GATE OK** (no-fudge ✓ · citations ✓; known raw-embed soft warning); `git diff --check` clean; deliverable SHA-256 identical pre/post build.

## D328 BUILT-BATTLE RESEARCH/AUDIT — citation-grade audit of all 10 shipped battles, for Codex revision (research/docs only) — 2026-07-08 (D328)
- **What shipped:** `docs/design/battle-build-research/built-battles/` — a README index + 10 audit packets (one per shipped battle) — and an extension of `tools/probe-battle-build-research.mjs` (now 14/14). No data/runtime/registry/generated-HTML change; `civil_war_generals.html` byte-unchanged.
- **Trigger:** Aaron's mid-D327 request to confirm the already-built battles were researched/supported to the D327 standard and, if not, do that research for Codex to revise.
- **Method:** per battle, a digest of the actually-encoded ranks/units/terrain/teaching (from `data/<id>.json`) → Opus auditor (web-verified) → adversarial Opus verifier (protects D92-hardened data from bad fixes) → Opus 4.8 main-loop verify against the live file.
- **Finding:** **9/10 SOLID_AS_IS** (D92/D86/D90/D325 held). **Antietam = MINOR_REVISIONS**, one confirmed outcome-neutral fix: `us_richardson.commander` `Brig. Gen.` → `Maj. Gen. Israel B. Richardson` (MG since Jul 4 1862; internal self-contradiction with the file's own `ld_richardson` leader entry). **Fredericksburg:** an auditor false flag (Owen `Brig. Gen.`→`Col.`) was **refuted** (Owen held a Nov 1862 recess BG appointment, unlike Zook) — recorded DO-NOT-APPLY.
- **Codex handoff:** apply only the Antietam `us_richardson.commander` label fix, then re-gate (build GATE OK + probe-antietam 16/16 + git diff --check). All other 9 battles confirmed source-accurate.
- **Exact gates run:** `node --check tools/probe-battle-build-research.mjs`; `node tools/probe-battle-build-research.mjs` **14/14**; `node tools/build.mjs` **GATE OK** (known raw-embed soft warning only); built-verdict JSON readback correct; `git diff --check` clean.
- **Next:** first battle-build spec slice — Kennesaw Mountain (Atlanta/March) per D327 — unless Aaron reorders.

## D327 BATTLE-BUILD RESEARCH LIBRARY — durable citation-grade packets for every remaining lane (research/docs only) — 2026-07-08 (D327)
- **What shipped:** `docs/design/battle-build-research/` with `README.md` + five lane packets (`atlanta-march`, `franklin-nashville`, `usct`, `naval-river`, `1864-65-attrition`) and the guard `tools/probe-battle-build-research.mjs`. No `data/*.json`, no registry line, no runtime, no generated-HTML behavior; `civil_war_generals.html` is byte-unchanged.
- **Packet contents (each lane):** candidates ranked by buildability; recommended playable shape (single-phase vs T8, roles, phase list, scoreWeight logic); Source Register (URLs + per-source confidence); OOB/rank traps; terrain/objective landmarks; teaching cards + anti-Lost-Cause framing; D74 no-fudge risks; candidate probe teeth; a READY_FOR_SPEC/NEEDS_MORE_RESEARCH/DO_NOT_BUILD_NOW verdict; exact next slice.
- **Method:** Opus research→adversarial-verify workflow (5 lanes × [Opus researcher with live WebSearch/WebFetch → Opus adversarial verifier that re-fetched the riskiest claims]) + Opus 4.8 main-loop final verify. Corrected before landing: Forrest = Lt. Col. (not Col.) at Donelson; 54th Mass ~40-45% (not >50%) at Fort Wagner; Jonesborough day-by-day casualty split; two-phase scoreWeights sum to 4 (not 5); Cold Harbor "7,000 in 30 min" flagged as disputed myth, not an input.
- **Verdicts:** all five READY_FOR_SPEC for their lead candidate — Kennesaw Mountain (Atlanta), Franklin, New Market Heights (USCT), Fort Donelson (naval/river; ship-vs-ship = DO_NOT_BUILD_NOW), Spotsylvania/Overland (attrition). Fort Pillow = DO_NOT_BUILD (massacre = teaching only). Dignity line + D74/D92 preserved throughout.
- **Most ready next:** Atlanta/March → Kennesaw Mountain (also the standing Priority-1 item). Research-thin: all naval ship-vs-ship + Fort Pillow.
- **Exact gates run:** `node --check tools/probe-battle-build-research.mjs`; `node tools/probe-battle-build-research.mjs` **8/8**; `node tools/build.mjs` **GATE OK** (known raw-embed soft warning only); JSON readback `ok=true`, 0 fail; `git diff --check` clean.
- **Next:** D328 research/audit pass over the already-built battles (for Codex revision), then the first battle-build spec slice (Kennesaw) unless Aaron reorders.

## D326 CHATTANOOGA BATTLE-BUILD — playable three-phase T8 implementation shipped — 2026-07-08 (D326)
- **What shipped:** `data/chattanooga.json` adds the playable Chattanooga battle; `src/tactical/T1-bull-run.js` registers/menu-ranks it after Chickamauga; `tools/probe-chattanooga.mjs` gates the scenario; both historical registry baselines now include `chattanooga`.
- **Scenario shape:** three T8 phases: Orchard Knob / Indian Hill (US seizes), Lookout Mountain / Cravens-house bench below the palisade (US seizes, lighter-casualty/fog teaching), and Missionary Ridge (US seizes, scoreWeight 3 decisive phase). Top-level roles are US attacker / CS defender.
- **Source/honesty readback:** D325's source/OOB/rank substrate re-verified clean enough to implement. The runtime content keeps Cleburne/Tunnel Hill/Ringgold Gap as teaching and end-note material, not an unsupported fourth playable phase. Rank traps and terrain traps are probe-gated.
- **D74 readback:** no per-battle damage/firepower/casualty/winner fudge keys were added. The probe checks gun counts and rejects per-battle fudge surfaces; outcomes come from OOB, terrain, timing, doctrine, scoreWeight, and existing universal systems.
- **Exact gates run:** `node tools/build.mjs`; `node --check src/tactical/T1-bull-run.js`; `node --check tools/probe-chattanooga-plan.mjs`; `node --check tools/probe-chattanooga.mjs`; `node --check tools/probe-tactical-roster.mjs`; `node --check tools/probe-custom-battle-builder.mjs`; `node tools/probe-chattanooga-plan.mjs`; `node tools/probe-chattanooga.mjs`; `node tools/probe-tactical-roster.mjs`; `node tools/probe-custom-battle-builder.mjs`; `node tools/probe-vicksburg.mjs`; `node tools/probe-chickamauga.mjs`; JSON readback over all six artifacts; `git diff --check`.
- **Focused gate/readback:** build GATE OK with the known raw-embed soft warning; `probe-chattanooga-plan` green **6/6**; `probe-chattanooga` green **16/16**; `probe-tactical-roster` green **8/8**; `probe-custom-battle-builder` green **15/15**; `probe-vicksburg` green **18/18**; `probe-chickamauga` green **18/18**; all required JSON artifacts read back `ok=true`, **0** failed steps, **0** pageerrors; `git diff --check` clean.
- **Next:** stop at the D326 boundary. The next queued battle-build item is an Atlanta/March planning/spec slice unless Aaron reorders.

## D325 CHATTANOOGA BATTLE-BUILD — durable spec + probe scaffold, no runtime implementation — 2026-07-08 (D325)
- **What shipped:** `docs/design/chattanooga-battle-build-spec.md` now carries the durable Chattanooga plan, source register, OOB/rank/terrain traps, D74 no-fudge gates, and future probe teeth. `tools/probe-chattanooga-plan.mjs` gates that packet and the planned-only registry state.
- **Scope:** docs/probe only. No `data/chattanooga.json`, no T1 registry/menu order change, no battle data, no combat code, no generated HTML behavior, no media assets.
- **Readback:** D325 locks a three-phase intended implementation: Orchard Knob (US seizes), Lookout Mountain / Cravens-house bench (US seizes, light/fog teaching), and Missionary Ridge (US seizes, decisive scoreWeight-3 phase), with top-level US attacker / CS defender.
- **Future guard:** if Chattanooga data appears later, `probe-chattanooga-plan` requires a focused `tools/probe-chattanooga.mjs` plus both historical-registry baselines: `tools/probe-tactical-roster.mjs` and `tools/probe-custom-battle-builder.mjs`.
- **Exact gates run:** `node --check tools/probe-chattanooga-plan.mjs`; `node tools/build.mjs`; `node tools/probe-chattanooga-plan.mjs`; adjacent `node tools/probe-tactical-roster.mjs`; adjacent `node tools/probe-custom-battle-builder.mjs`; adjacent Western precedent `node tools/probe-vicksburg.mjs`; adjacent Western precedent `node tools/probe-chickamauga.mjs`; JSON readback over all five probe artifacts; `git diff --check`.
- **Focused gate/readback:** build GATE OK with the known raw-embed soft warning; `probe-chattanooga-plan` green **6/6** and `planned-only`; `probe-tactical-roster` green **8/8**, **0** pageerrors; `probe-custom-battle-builder` green **15/15**, **0** pageerrors; `probe-vicksburg` green **18/18**, **0** pageerrors; `probe-chickamauga` green **18/18**, **0** pageerrors; `git diff --check` clean.
- **Next:** D326 Chattanooga playable implementation, but only after source/OOB verification from the D325 packet.

## D324 ROUTING — all previously locked phase lanes unlocked — 2026-07-08 (D324)
- **What changed:** docs/routing only. Aaron explicitly unlocked every previously locked phase lane.
- **Unlocked lanes:** M8 battle-build, Chattanooga, Atlanta/March, Franklin/Nashville, USCT playable battles, Phase H media additions, H2 footage, HDRI/model media, Tripo/model/asset work, remaining Soldier's Story rows, Phase D full-hex tactical mode, custom-battle phase authoring/editor work, and optional Group 6 report polish are all eligible for normal planning and execution.
- **Still binding:** D74 no-fudge, citation-grade/anti-Lost-Cause history, accessibility/performance standards, source-only edits plus generated build discipline, focused gates, JSON/pageerror readback, `git diff --check`, clean commit, and push.
- **Queue effect:** future runs should not treat old M8/Q5/Q6/Phase H/Soldier's Story/Phase D language as a current lock. If no narrower instruction is given, start with a short fresh-chat planning pass over the unlocked lanes and then execute the selected slice under normal gates.

## D323 GROUP 2 GM/TRANSFER — explicit cross-theater Transfer move — 2026-07-08 (D323)
- **What shipped:** `cmdTransfer(C,id)` is now the explicit player Command-desk move over D322's theater substrate. It spends political capital, records only current-battle theater readiness under `C.president.command.transfer`, and makes `cmdTransferReadiness(C,id)` show `transferred:true` / `transferNeeded:false` for that engagement.
- **Readback:** the Command desk now shows a `Cross-theater transfer` section with next-battle theater, natural fits, cross-theater candidates, affordability, and completed Transfer status. Meade remains a natural Eastern fit, Grant remains Multi/natural, and Thomas can be transferred to an Eastern next battle only through the player action.
- **Output wall:** no hidden enemy Transfer, no hidden commissions, no enemy command save state, no scoreboard/battle-result/casualty/OOB-total/combat-output writes. `cmdInit` drops malformed, stale, native-fit, uncommissioned, bogus, and wrong-theater transfer save records.
- **Exact gates run:** `node --check src/35-command.js`; `node --check tools/probe-command.mjs`; `node tools/build.mjs`; `node tools/validate-data-schemas.mjs`; `node tools/probe-command.mjs`; adjacent `node tools/probe-ratings.mjs`; adjacent `node tools/probe-oob.mjs`; adjacent `node tools/probe-bridge.mjs`; `git diff --check`.
- **Focused gate/readback:** build GATE OK with the known raw-embed soft warning; data schema validation **39/39**; `probe-command` green **88/88**, **0** pageerrors; `probe-ratings` green **21/21**, **0** pageerrors; `probe-oob` green **17/17**, **0** pageerrors; `probe-bridge` green **6/6**, **0** pageerrors; `git diff --check` clean.
- **Queue effect:** Group 2 explicit Transfer is closed. Stop at the D323 boundary; optional Group 6 report polish is the next eligible non-locked item, and M8/Q5/Q6 battle-build stays locked behind explicit Aaron approval.

## D322 GROUP 2 GM/TRANSFER SUBSTRATE — theater classification and readiness readout — 2026-07-08 (D322)
- **What shipped:** data/runtime/probe substrate only. `data/generals.json` now gives every starting-roster and commission-pool general broad `theater` / `theaters` fields (`Eastern`, `Western`, `Multi`) with `theaterProvenance:"Inferred"`. `src/35-command.js` now exposes pure theater helpers plus `cmdTransferReadiness(C,id)` and carries theater fields through the AI-GM enemy shadow readout.
- **Readback:** **26/26** command-pool records carry theater classification; D322 probe teeth prove Meade fits an Eastern next battle, Thomas is flagged as cross-theater for that Eastern battle, and Grant bridges both without a Transfer flag.
- **Exact gates run:** `node --check src/35-command.js`; `node --check tools/probe-command.mjs`; `node tools/build.mjs`; `node tools/validate-data-schemas.mjs`; `node tools/probe-command.mjs`.
- **Focused gate/readback:** build GATE OK with the known raw-embed soft warning; data schema validation **39/39**; `probe-command` green **81/81**, **0** pageerrors.
- **Queue effect:** the `theater` blocker is closed. Superseded by D323's explicit Transfer move, still bounded as input/readout with no scoreboard/output writes. M8/Q5/Q6 remain locked behind explicit go/no-go.

## D321 GROUP 6 TOOLING — source-file inventory closeout and probe — 2026-07-08 (D321)
- **What shipped:** tooling only. `tools/inventory-source-files.mjs` now walks `src/**/*.js` instead of only top-level `src/*.js`, so the source inventory includes the tactical engine. New `tools/probe-source-file-inventory.mjs` pins that behavior against the live recursive tree.
- **Readback:** `tools/shots/source-file-inventory.csv` now reports **91** JS files, **29** tactical modules, **34,207** lines, **1,846** function declarations, and **0** ES/module exports. The 0-export readback is expected for this IIFE/global codebase.
- **Exact gates run:** `node --check tools/inventory-source-files.mjs`; `node --check tools/probe-source-file-inventory.mjs`; `node tools/inventory-source-files.mjs`; `node tools/probe-source-file-inventory.mjs`; `node tools/build.mjs`; `node tools/probe-group6-readback.mjs`; `node tools/probe-media-budget.mjs`; `node tools/probe-historical-source-domains.mjs`; JSON readback via `tools/shots/probe-source-file-inventory.json`; `git diff --check`.
- **Focused gate/readback:** source-file inventory probe green **4/4**; build GATE OK with the known raw-embed soft warning; adjacent Group 6 readback green **9/9**; media-budget green **13/13**; historical-source-domains green **6/6**.
- **Queue effect:** Group 6 is complete enough after D321. D322 later shipped the Group 2 theater substrate and D323 later shipped the explicit Transfer move. M8/Q5/Q6 remain locked behind explicit go/no-go.

## D320 GROUP 6 TOOLING — diagnostic/reporting tools landed — 2026-07-08 (D320/D320b)
- **What shipped:** tooling/reporting only. Added data schema validation, orphan embedded-asset reporting, probe-log summary, source-file inventory, media/source-domain HTML reports, Group 6 health dashboard, and source-domain CSV export. D320b refreshed tracked report outputs after tool fixes.
- **Readback after D321 verification:** schema validation **39/39**; orphan-assets report **199 embedded / 0 orphans**; probe-log summary **107/107** after the D321 probe; source-domain CSV **152** URL rows; Group 6 dashboard reports media, historical inventory, source-domain, hotpath, and consolidated readbacks PASS.
- **Follow-up closed:** D320's source-file inventory initially omitted `src/tactical/`; D321 made it recursive and probe-gated.
- **Locks:** tooling/reporting only; no gameplay/content/media/combat/runtime/history-data mutation and no lock changes.

## D319 GROUP 6 TOOLING — historical source-domain policy-readback consistency guard — 2026-07-08 (D319)
- **What shipped:** tooling only. `tools/probe-historical-source-domains.mjs` now enforces internal consistency between policy readback `current*` values and computed source-domain stats.
- **Exact gates run (from `tools/`):** `node --check probe-historical-source-domains.mjs`; `node build.mjs`; `node probe-historical-source-domains.mjs`; `node probe-group6-readback.mjs`; `node probe-media-budget.mjs`; JSON readback via `tools/shots/probe-historical-source-domains.json` and `tools/shots/probe-group6-readback.json`; `git diff --check`.
- **Focused gate/readback:** source-domain probe green **6/6**; build GATE OK with known raw-embed soft warning; new consistency step green (`policyConsistencyStep=true`) with URL items **152** and unique domains **33**; consolidated Group 6 probe green **9/9**; adjacent media-budget green **13/13**.
- **Locks:** readback/tooling only; no gameplay/content/media/combat/runtime/history-data mutation and no lock changes.

## D318 GROUP 6 TOOLING — consolidated cross-artifact parity guard — 2026-07-08 (D318)
- **What shipped:** tooling only. `tools/probe-group6-readback.mjs` now enforces explicit cross-artifact parity over key counters, requiring the consolidated readback to carry present/positive metrics across media policy, historical source inventory, source-domain inventory, and hotpath profile.
- **Exact gates run (from `tools/`):** `node --check probe-group6-readback.mjs`; `node build.mjs`; `node probe-group6-readback.mjs`; `node probe-media-budget.mjs`; `node probe-historical-source-domains.mjs`; JSON readback via `tools/shots/probe-group6-readback.json` and `tools/shots/group6-readback.json`; `git diff --check`.
- **Focused gate/readback:** consolidated probe green **9/9**; build GATE OK with known raw-embed soft warning; parity step green with `mediaRawBytes=2535463`, `historicalSourceItems=1559`, `sourceDomainUrlItems=152`, `sourceDomainUniqueDomains=33`, `hotpathFiles=12`, `hotpathFunctions=381`; adjacent media-budget green **13/13** and source-domain green **5/5**.
- **Locks:** readback/tooling only; no gameplay/content/media/combat/runtime/history-data mutation and no lock changes.

## D317 GROUP 6 TOOLING — consolidated artifact freshness/coherence guard — 2026-07-08 (D317)
- **What shipped:** tooling only. `tools/probe-group6-readback.mjs` now enforces component artifact freshness/coherence by checking required artifact mtimes against run start and a bounded coherence window.
- **Exact gates run (from `tools/`):** `node --check probe-group6-readback.mjs`; `node build.mjs`; `node probe-group6-readback.mjs`; JSON readback via `tools/shots/probe-group6-readback.json`; `git diff --check`.
- **Focused gate/readback:** consolidated probe green **8/8**; build GATE OK with known raw-embed soft warning; freshness step green with coherence window **120000ms** and observed artifact drift **1209ms**; summary includes `runStartedAt`.
- **Locks:** readback/tooling only; no gameplay/content/media/combat/runtime/history-data mutation and no lock changes.
- **Bundle status:** D314-D317 same-chat Group 6 bundle completed green with per-slice docs sync and commit/push after each slice.

## D316 GROUP 6 TOOLING — historical source-domain per-file concentration guard (index-aware) — 2026-07-08 (D316)
- **What shipped:** tooling only. `tools/historical-source-domains.mjs` and `tools/probe-historical-source-domains.mjs` now include index-aware per-file concentration policy/readback: overall single-file share and non-index single-file share thresholds with explicit top-file readback.
- **Exact gates run (from `tools/`):** `node --check historical-source-domains.mjs`; `node --check probe-historical-source-domains.mjs`; `node build.mjs`; `node probe-historical-source-domains.mjs`; `node probe-group6-readback.mjs`; JSON readback via `tools/shots/probe-historical-source-domains.json` and consolidated readback artifacts; `git diff --check`.
- **Focused gate/readback:** source-domain probe green **5/5**; consolidated Group 6 probe green **7/7**; readback shows top file `data/press.json` at **100%** under index-file allowance, max non-index share **0%** <= **20%**, invalid URLs **0**, concentration **88.82%**, unique domains **33**, drift reasons `[]`.
- **Locks:** readback/tooling only; no gameplay/content/media/combat/runtime/history-data mutation and no lock changes.

## D315 GROUP 6 TOOLING — media-budget arithmetic consistency guard — 2026-07-08 (D315)
- **What shipped:** tooling only. `tools/probe-media-budget.mjs` now emits and enforces `metrics.arithmeticConsistency` so total files/bytes and all headroom math are explicitly verified against recomputed values.
- **Exact gates run (from `tools/`):** `node --check probe-media-budget.mjs`; `node build.mjs`; `node probe-media-budget.mjs`; JSON readback via `tools/shots/probe-media-budget.json`; `git diff --check`.
- **Focused gate/readback:** media-budget probe green **13/13**; build GATE OK with known raw-embed soft warning; arithmetic readback shows totals match (`files 199/199`, `rawBytes 2,535,463/2,535,463`) and exact headroom parity (`soft -962,599`, `review 348,121`, `hard 610,265`, `coreFiles 61`).
- **Locks:** readback/tooling only; no gameplay/content/media/combat/runtime/history-data mutation and no lock changes.

## D314 GROUP 6 TOOLING — consolidated readback now includes source-domain drift posture — 2026-07-08 (D314)
- **What shipped:** tooling only. `tools/probe-group6-readback.mjs` now runs `tools/probe-historical-source-domains.mjs` and validates source-domain conservative drift posture inside the consolidated Group 6 guard.
- **Artifact/readback change:** `tools/shots/group6-readback.json` now includes `sourceDomains` with URL item count, unique domains, concentration, invalid URL count, policy readback, and drift pass/reasons; consolidated probe summary now includes source-domain URL/domain counts.
- **Exact gates run (from `tools/`):** `node --check probe-group6-readback.mjs`; `node build.mjs`; `node probe-group6-readback.mjs`; JSON readback via `tools/shots/probe-group6-readback.json` and `tools/shots/group6-readback.json`; `git diff --check`.
- **Focused gate/readback:** consolidated probe green **7/7**; build GATE OK with known raw-embed soft warning; source-domain summary reads URL items **152**, unique domains **33**, drift pass `true`, reasons `[]`.
- **Locks:** readback/tooling only; no gameplay/content/media/combat/runtime/history-data mutation and no lock changes.

## D313 GROUP 6 TOOLING — historical source-domain conservative drift guard thresholds — 2026-07-08 (D313)
- **What shipped:** tooling only. `tools/historical-source-domains.mjs` now emits policy threshold readback (`requireZeroInvalidUrls`, `maxTop20ConcentrationPct`, `minUniqueDomains`), and `tools/probe-historical-source-domains.mjs` now enforces those thresholds with explicit pass/fail reasons in probe metrics.
- **Exact gates run (from `tools/`):** `node --check historical-source-domains.mjs`; `node --check probe-historical-source-domains.mjs`; `node build.mjs`; `node probe-historical-source-domains.mjs`; `node probe-group6-readback.mjs`; JSON readback via `tools/shots/probe-historical-source-domains.json` and `tools/shots/probe-group6-readback.json`; `git diff --check`.
- **Focused gate/readback:** source-domain probe green **5/5**; consolidated Group 6 readback green **6/6**; invalid URLs **0**; top-20 concentration **88.82%** against policy max **90**; unique domains **33** against policy floor **30**; drift reasons `[]`; build GATE OK with known raw-embed soft warning.
- **Locks:** no source/data gameplay edits, no historical-claim changes, no media/assets/network/combat/runtime changes, and no lock changes.
- **NEXT:** stop after D313 per the two-slice boundary (D312 + D313) once this slice is committed and pushed.

## D312 GROUP 6 TOOLING — media-budget undeclared-embed drift guard hardening — 2026-07-08 (D312)
- **What shipped:** tooling/data only. `data/media-budget.json` schemaVersion **1.7** adds `requireDeclaredCoreEmbedCategoriesWhileFrozen`; `tools/probe-media-budget.mjs` adds explicit `metrics.undeclaredEmbedState` readback and frozen-core enforcement.
- **New readback metrics:** undeclared embed categories, undeclared embed files count, bounded sample offending paths, plus `frozenCorePostureActive` and `guardEnabled` flags.
- **Guard behavior:** while raw embeds remain above soft warning and frozen-core posture is active, any file under `assets/embed` outside declared core categories is now a hard probe failure.
- **Exact gates run (from `tools/`):** `node --check probe-media-budget.mjs`; `node build.mjs`; `node probe-media-budget.mjs`; artifact readback via `node -e` over `tools/shots/probe-media-budget.json`; `git diff --check`.
- **Focused gate/readback:** probe green **12/12**; build GATE OK with known raw-embed soft warning; undeclared categories **0**; undeclared files **0**; sample offending paths `[]`; artifact contains no pageerror entries.
- **Locks:** no media assets/fetches/Tripo/H2/HDRI/model enablement; no Soldier's Story rows; no M8/Q5/Q6/Phase D; no gameplay/combat/runtime changes.

## D311 GROUP 6 TOOLING — historical source-domain visibility guard — 2026-07-08 (D311)
- **What shipped:** tooling only. `tools/historical-source-domains.mjs` inventories URL-bearing historical source domains from `data/*.json` source arrays, and `tools/probe-historical-source-domains.mjs` gates that inventory into reusable artifacts.
- **Source-domain readback:** `tools/shots/historical-source-domains.json` reports **152 URL source items**, **33 unique domains**, top-20-domain concentration **88.82%**, and **0 invalid URL items**. Top domains currently include `en.wikipedia.org` (44), `encyclopediavirginia.org` (16), and `www.loc.gov` (12).
- **Focused gate:** `node --check tools/historical-source-domains.mjs` and `node --check tools/probe-historical-source-domains.mjs` clean; `node tools/build.mjs` GATE OK with known raw-embed soft warning; source-domain probe green **4/4**; adjacent historical-data inventory probe green **5/5**; JSON readback clean for both new artifacts; `git diff --check` clean.
- **Locks:** no source/data gameplay edits, no historical-claim changes, no media/assets/network/combat/runtime changes, and no lock changes.
- **NEXT:** this is the fourth post-D307 same-chat Group 6 tooling slice; stop at the D307 bundle boundary with a fresh continuation prompt unless Aaron explicitly directs a new same-chat bundle.

## D310 GROUP 6 TOOLING — consolidated readback guard across budget/source/hotpath artifacts — 2026-07-08 (D310)
- **What shipped:** tooling only. `tools/probe-group6-readback.mjs` provides one filesystem-only consolidated Group 6 guard that re-runs and cross-checks the existing media-budget, historical-data inventory, and hotpath profile probes.
- **Consolidated readback:** `tools/shots/group6-readback.json` now summarizes media policy/source posture (raw tier `soft-warning`, raw **2.418 MB**, active D300-D303 guards, source parity/metadata green), historical inventory (**1,559 source items / 675 source notes**), and hotpath profile (**381 functions / 228 loop sites / 1 fetch in T28**).
- **Focused gate:** `node --check tools/probe-group6-readback.mjs` clean; `node tools/build.mjs` GATE OK with known raw-embed soft warning; consolidated probe green **6/6**; adjacent `probe-media-budget` green **12/12**; JSON readback clean for `tools/shots/probe-group6-readback.json` and `tools/shots/group6-readback.json`; `git diff --check` clean.
- **Locks:** no runtime source/data/content/media/combat changes; no network-surface expansion; no Tripo/H2/Soldier's Story/battle-build/Phase D work.
- **NEXT:** this is the third post-D307 same-chat Group 6 tooling slice. Either stop at the D307 bundle boundary with a fresh continuation prompt, or take only another clearly bounded filesystem-only Group 6 reporting guard.

## D309 GROUP 6 HOTPATH TOOLING — static hotpath profile readback — 2026-07-08 (D309)
- **What shipped:** tooling only. `tools/profile-hotpaths.mjs` builds a read-only static profile over declared tactical hotpath source files; `tools/probe-hotpath-profile.mjs` gates the profile and writes `tools/shots/probe-hotpath-profile.json`.
- **Profile readback:** 12 hotpath files, 463,690 bytes, 7,215 lines, 381 functions, 228 loop sites, 13 instancing references, 35 `.dispose()` cleanup references, 14 `localStorage` references, and 1 `fetch()` reference isolated to the opt-in LLM connector (`src/tactical/T28-llm-connector.js`).
- **Focused gate:** `node --check tools/profile-hotpaths.mjs` and `node --check tools/probe-hotpath-profile.mjs` clean; `node tools/build.mjs` GATE OK with the known raw-embed soft warning; hotpath profile probe **6/6**; adjacent `probe-field` green **23 steps, 0 pageerrors**; JSON readback clean; `git diff --check` clean.
- **Locks:** no runtime source module, data, content, media, combat, balance, network, H2, Tripo, Soldier's Story, battle-build, or Phase D work.
- **NEXT:** either one more small filesystem-only Group 6 budget/source reporting guard if clearly useful, or stop at the D307 bundle boundary before browser-heavy/full-suite work. M8/Q5/Q6 locked; Phase D deferred; Phase H media additions remain frozen unless Aaron explicitly reopens D300.

## D308 GROUP 6 HISTORICAL-DATA TOOLING — reusable source inventory artifact — 2026-07-08 (D308)
- **What shipped:** tooling only. `tools/historical-data-inventory.mjs` builds a reusable read-only inventory over the canonical `HISTORICAL-DATA*.md` docs and every `data/*.json` file; `tools/probe-historical-data-inventory.mjs` gates it and writes `tools/shots/probe-historical-data-inventory.json`.
- **Inventory readback:** 4 canonical historical docs, 2,202 markdown lines, 10 source headings, 10 key-fact tables, 146 `Verified` mentions, 29 `Inferred` mentions, 39 data files, 35 data files with source fields, 592 source fields, 1,559 source items, and 675 source notes.
- **Focused gate:** `node --check tools/historical-data-inventory.mjs` and `node --check tools/probe-historical-data-inventory.mjs` clean; `node tools/build.mjs` GATE OK with the known raw-embed soft warning; historical-data inventory probe **5/5**; adjacent `probe-primary-sources` green **14 steps, 0 pageerrors**; JSON readback clean; `git diff --check` clean.
- **Locks:** no historical claim changed, no data/content/media asset added, no H2 footage or HDRI/model path enabled, no Tripo action, no Soldier's Story row, no battle-build, and no Phase D work.
- **NEXT:** continue the D307 same-chat Group 6 bundle with hotpath profiling/readback or another low-blast-radius source/budget reporting guard. M8/Q5/Q6 locked; Phase D deferred; Phase H media additions remain frozen unless Aaron explicitly reopens D300.

## D307 OPERATING MODEL — same-chat execution bundles for safe homogeneous queues — 2026-07-08 (D307)
- **What changed:** docs/instructions only. Aaron directed that runs should include more tasks and stop less often. D307 updates D171: safe homogeneous queues should run as same-chat execution bundles instead of stopping after every tiny slice.
- **New default:** for Group 6-style tooling/reporting queues, ship 2-4 small slices in one chat when the work stays low-risk and already cleared.
- **Still required after each slice:** focused gate, JSON/stdout readback, docs sync, `git diff --check`, commit, and push before continuing.
- **Stop conditions:** bundle exhausted, new group/phase, design fork/risk/lock, browser-heavy/full-suite gate, context risk, or ambiguous worktree state.
- **Locks:** this is not authorization for media assets, asset fetches, credits/Tripo, H2 footage, Phase H reopening, Soldier's Story, M8/Q5/Q6, or Phase D.
- **Gate:** docs-only; `git diff --check` clean.

## D306 GROUP 6 MEDIA-BUDGET TOOLING — explicit source-inventory readback — 2026-07-08 (D306)
- **What shipped:** tooling/data only. `data/media-budget.json` schemaVersion 1.6 records `requireSourceInventoryReadback`, and `tools/probe-media-budget.mjs` now emits/enforces `metrics.sourceInventory`: same-stem source/embed parity, source-only files, embed-only files, duplicate stems, source/embed extensions, and largest embedded file per declared core category.
- **Source-inventory readback:** exact parity is green for all six declared core categories. Source/embed counts remain portraits **156/156**, weapons **8/8**, artillery **2/2**, USCT **7/7**, leaders **20/20**, and scenes **6/6**; no source-only files, embed-only files, or duplicate stems were found.
- **Focused gate:** `node --check tools/probe-media-budget.mjs` clean; `node tools/build.mjs` GATE OK with the known raw-embed soft warning; strengthened media-budget probe **12/12**, warnings=1 for the known soft warning; JSON readback clean; `git diff --check` clean.
- **Locks:** no media assets were added/fetched/regenerated/reclassified, no H2 footage or HDRI/model path was enabled, no Tripo action, no Soldier's Story row, no battle-build, and no Phase D work.
- **NEXT:** continue Priority 1 Group 6 with another small gateable tooling slice such as reusable historical-data organization, hotpath profiling, or another budget/source reporting guard. M8/Q5/Q6 locked; Phase D deferred; Phase H media additions remain frozen unless Aaron explicitly reopens D300.

## D305 GROUP 6 MEDIA-BUDGET TOOLING — explicit source-organization readback — 2026-07-08 (D305)
- **What shipped:** tooling/data only. `data/media-budget.json` schemaVersion 1.5 records `requireSourceOrganizationReadback`, and `tools/probe-media-budget.mjs` now emits/enforces `metrics.sourceOrganization`: declared core categories, informative categories, source/embed counts, source-mirror status, and informative metadata coverage.
- **Source-organization readback:** all six declared core categories mirror cleanly: portraits **156/156**, weapons **8/8**, artillery **2/2**, USCT **7/7**, leaders **20/20**, and scenes **6/6** source/embed files. Informative metadata is green for USCT **7**, leaders **20**, and scenes **6**, with no missing source categories and no metadata issue categories.
- **Focused gate:** `node --check tools/probe-media-budget.mjs` clean; `node tools/build.mjs` GATE OK with the known raw-embed soft warning; strengthened media-budget probe **11/11**, warnings=1 for the known soft warning; JSON readback clean; `git diff --check` clean.
- **Locks:** no media assets were added/fetched/regenerated/reclassified, no H2 footage or HDRI/model path was enabled, no Tripo action, no Soldier's Story row, no battle-build, and no Phase D work.
- **NEXT:** continue Priority 1 Group 6 with another small gateable tooling slice: reusable historical-data layer, broader source organization, hotpath profiling, or another budget/source reporting guard. M8/Q5/Q6 locked; Phase D deferred; Phase H media additions remain frozen unless Aaron explicitly reopens D300.

## D304 GROUP 6 MEDIA-BUDGET TOOLING — explicit policy-state readback — 2026-07-08 (D304)
- **What shipped:** tooling/data only. `data/media-budget.json` schemaVersion 1.4 records `requirePolicyStateReadback`, and `tools/probe-media-budget.mjs` now emits/enforces `metrics.policyState`: raw tier, bytes/files, soft/review/hard/file headroom, active D300-D303 guards, H2/heavy-media locks, and frozen category headroom.
- **Policy readback:** raw tier **soft-warning**; **199 files / 2.418 MB raw**; headroom is soft **-962,599 bytes**, review **348,121 bytes**, hard **610,265 bytes**, core files **61**. D300 core freeze, D301 category ceilings, D302 source mirror, D303 informative metadata, H2 disabled, and heavy-media optional-pack routing all read active. All six core embed categories have zero file/raw-byte headroom and no negative headroom.
- **Focused gate:** `node --check tools/probe-media-budget.mjs` clean; `node tools/build.mjs` GATE OK with the known raw-embed soft warning; strengthened media-budget probe **10/10**, warnings=1 for the known soft warning; JSON readback clean; `git diff --check` clean.
- **Locks:** no media assets were added/fetched/regenerated/reclassified, no H2 footage or HDRI/model path was enabled, no Tripo action, no Soldier's Story row, no battle-build, and no Phase D work.
- **NEXT:** continue Priority 1 Group 6 with another small gateable tooling slice: reusable historical-data layer, source organization, hotpath profiling, or another budget/source reporting guard. M8/Q5/Q6 locked; Phase D deferred; Phase H media additions remain frozen unless Aaron explicitly reopens D300.

## D303 GROUP 6 MEDIA-BUDGET TOOLING — curated-metadata guard for informative embeds — 2026-07-08 (D303)
- **What shipped:** tooling/data only. `data/media-budget.json` schemaVersion 1.3 records `requireInformativeEmbedMetadata` plus metadata-module declarations for informative embedded categories. `tools/probe-media-budget.mjs` now verifies exact metadata coverage and nonempty alt/caption/credit fields for embedded USCT, leader, and scene imagery.
- **Metadata readback:** USCT **7/7**, leaders **20/20**, and scenes **6/6** all have matching curated metadata records; no missing, stale, or incomplete records.
- **Focused gate:** `node --check tools/probe-media-budget.mjs` clean; `node tools/build.mjs` GATE OK with the known raw-embed soft warning; strengthened media-budget probe **9/9**, **199 files / 2.418 MB raw**, D300 freeze active, all category headroom 0, source mirror green, warnings=1 for the known soft warning; JSON readback clean; `git diff --check` clean.
- **Locks:** no media assets were added/fetched/regenerated/reclassified, no H2 footage or HDRI/model path was enabled, no Tripo action, no Soldier's Story row, no battle-build, and no Phase D work.
- **NEXT:** continue Priority 1 Group 6 with another small gateable tooling slice: reusable historical-data layer, source organization, hotpath profiling, or another media-budget guard/reporting improvement. M8/Q5/Q6 locked; Phase D deferred; Phase H media additions remain frozen unless Aaron explicitly reopens D300.

## D302 GROUP 6 MEDIA-BUDGET TOOLING — source-tier mirror guard for core embeds — 2026-07-08 (D302)
- **What shipped:** tooling/data only. `data/media-budget.json` schemaVersion 1.2 records a `requireEmbedSourceMirror` policy: every file under a declared core `assets/embed/<category>/` directory must have a same-stem source file under that category's `sourceDir`. `tools/probe-media-budget.mjs` now enforces that mirror and reports source/embed counts plus any missing sources in its JSON artifact.
- **Source mirror readback:** portraits **156/156**, weapons **8/8**, artillery **2/2**, USCT **7/7**, leaders **20/20**, and scenes **6/6** all mirror cleanly; no orphan embeds.
- **Focused gate:** `node --check tools/probe-media-budget.mjs` clean; `node tools/build.mjs` GATE OK with the known raw-embed soft warning; strengthened media-budget probe **8/8**, **199 files / 2.418 MB raw**, D300 freeze active, all category headroom 0, warnings=1 for the known soft warning; JSON readback clean; `git diff --check` clean.
- **Locks:** no media assets were added/fetched/regenerated/reclassified, no H2 footage or HDRI/model path was enabled, no Tripo action, no Soldier's Story row, no battle-build, and no Phase D work.
- **NEXT:** continue Priority 1 Group 6 with another small gateable tooling slice: reusable historical-data layer, source organization, hotpath profiling, or another media-budget guard/reporting improvement. M8/Q5/Q6 locked; Phase D deferred; Phase H media additions remain frozen unless Aaron explicitly reopens D300.

## D301 GROUP 6 MEDIA-BUDGET TOOLING — D300 frozen-core category ceilings are executable — 2026-07-08 (D301)
- **What shipped:** tooling/data only. `data/media-budget.json` schemaVersion 1.1 records the D300 core-media freeze as per-category file and raw-byte ceilings while the raw embed tier is above the soft warning. `tools/probe-media-budget.mjs` now enforces those ceilings and reports category headroom plus the ten largest embedded files in its JSON artifact.
- **Frozen ceilings:** portraits 156 / 1,040,819 bytes; weapons 8 / 171,858 bytes; artillery 2 / 53,819 bytes; USCT 7 / 332,447 bytes; leaders 20 / 641,050 bytes; scenes 6 / 295,470 bytes.
- **Focused gate:** `node --check tools/probe-media-budget.mjs` clean; `node tools/build.mjs` GATE OK with the known raw-embed soft warning; strengthened media-budget probe **7/7**, **199 files / 2.418 MB raw**, D300 freeze active, all category headroom 0, warnings=1 for the known soft warning; JSON readback clean; `git diff --check` clean.
- **Locks:** no media assets were added/fetched/regenerated, no H2 footage or HDRI/model path was enabled, no Tripo action, no Soldier's Story row, no battle-build, and no Phase D work.
- **NEXT:** continue Priority 1 Group 6 with another small gateable tooling slice: reusable historical-data layer, source organization, hotpath profiling, or another media-budget guard/reporting improvement. M8/Q5/Q6 locked; Phase D deferred; Phase H media additions remain frozen unless Aaron explicitly reopens D300.

## D300 MEDIA-BUDGET/PROFILE DECISION — core media frozen; PD still assets frozen; H2/HDRI/model media disabled — 2026-07-08 (D300)
- **What changed:** docs/routing only. Aaron adopted all three conservative recommendations from the D299 media-budget/profile checkpoint: keep the self-contained core frozen, keep public-domain still/surviving-colours assets frozen, and keep H2 footage / HDRI / model media disabled.
- **Focused gate:** `node tools/build.mjs` GATE OK with the known raw-embed soft warning; media-budget artifact green **6/6**, **199 files / 2.418 MB raw**, above soft warning but below hard/review caps; Intel UHD-617 artifact green **19/19**, actual Intel Metal renderer, high **10.74ms / 75 calls / 116 objects**, low **1.98ms / 63 calls / 97 objects**, **0 pageerrors**, **0 texture warnings**; JSON readback clean; `git diff --check` clean.
- **Locks:** no new media assets, no asset fetches, no credits/Tripo, no H2 footage, no HDRI/model pilot, no optional HD-pack build, no zero-byte Phase H polish loop, and no Soldier's Story replacement slice are authorized by this checkpoint.
- **NEXT:** Group 6 meta/deferred tooling, in a small gateable slice. M8/Q5/Q6 locked; remaining generated/unresearched Soldier's Story rows deferred until all other queued tasks/phases are done; Phase D deferred/v2.

## D299 QUEUE DIRECTIVE — Soldier's Story remaining generated/unresearched rows deferred; media-budget/profile checkpoint active — 2026-07-08 (D299)
- **What changed:** docs/routing only. Aaron directed that the researched Soldier's Story rows are complete and shipped through D298, and that the remaining generated/unresearched replacement rows are deferred until all other queued tasks/phases are done.
- **Current playable head:** D298 remains the latest playable-content milestone: John Bell Hood is the thirty-first `Verified` Soldier's Story replacement; lane count remains 31 and women/support figures remain separate.
- **Active next checkpoint:** present the Phase H media-budget/profile decision packet before reopening any real surviving-colours/PD asset work, H2 moving footage, HDRI/model media, optional HD pack, or other media-heavy work. No media assets, footage, HDRI/model files, optional pack, Tripo action, source/data gameplay change, or battle-build work is authorized by D299.
- **Locks:** M8/Q5/Q6 locked; Phase D deferred; D74 no per-battle fudge; source-only build discipline remains intact.

## D298 PHASE I SOLDIER'S STORY SCALE-OUT — John Bell Hood added as the thirty-first citation-grade replacement, a Chickamauga / Hood's Arriving Brigades command row — 2026-07-08 (D298)
- **What shipped:** the Soldier's Story replacement lane grows 30→**31** `Verified` records; side balance moves 15US/15CS → **15US/16CS**. **John Bell Hood** replaces `ss:chickamauga:CS:cs_hood_arrives:cmd`, the open Chickamauga / Hood's Arriving Brigades command row. Data + probe only; no engine/combat change, D74 intact.
- **Record (`data/soldier-replacements.json`):** Hood ships as Maj. Gen., Hood's Division, Longstreet's Left Wing / Hood's Corps, Army of Tennessee, at Chickamauga. The record asserts no lieutenant-general-at-Chickamauga rank, no company command, no portrait, no later Atlanta/Franklin command rating, and no sourced ratings.
- **Sources:** NPS John Bell Hood person page; U.S. Army Staff Ride Handbook for Chickamauga; NPS History Chickamauga narrative; American Battlefield Trust Chickamauga facts; American Battlefield Trust John Bell Hood biography.
- **Probe (`tools/probe-loot-survival.mjs`):** canonical replacement tooth retitled D298/thirty-one; counts bumped 30→31 for records/applied/generated/authored; Hood gets alias lookup, generated/replacement/provenance/name, rank/side/branch/team, bio/sourceNote substring, source-count, no-lieutenant-general-at-Chickamauga, and no-portrait assertions.
- **Gate (focused, D176):** JSON parse OK; importer/schema OK records=31 verified=31 disputed=0; importer `--check` OK records=31 verified=31 disputed=0; `node tools/build.mjs` GATE OK (known raw embed soft warning only); `node --check tools/probe-loot-survival.mjs`; **probe-loot-survival ok=true 11/11, applied=31, 0 pageerrors**; adjacents **probe-tactical-roster 8/8** and **probe-women-in-war 8/8, 0 pageerrors** (`replacementRecords:31`, women/support lane still separate); JSON readback confirmed all three artifacts with zero pageerrors; `git diff --check` clean. Full `npm run vet:noreg` was not rerun immediately after the D292 batch/release checkpoint.
- **NEXT:** superseded by D299. Remaining generated/unresearched Soldier's Story rows are deferred until all other queued tasks/phases are done; active next checkpoint is the Phase H media-budget/profile decision. M8/Q5/Q6 locked; Phase H media remains approval-gated; Phase D deferred.

## D297 PHASE I SOLDIER'S STORY SCALE-OUT — Bushrod R. Johnson added as the thirtieth citation-grade replacement, a Chickamauga / Johnson's Provisional Division command row — 2026-07-08 (D297)
- **What shipped:** the Soldier's Story replacement lane grows 29→**30** `Verified` records; side balance moves 15US/14CS → **15US/15CS**. **Bushrod R. Johnson** replaces `ss:chickamauga:CS:cs_johnson_gap:cmd`, the open Chickamauga / Johnson's Provisional Division breakthrough command row. Data + probe only; no engine/combat change, D74 intact.
- **Record (`data/soldier-replacements.json`):** Johnson ships as Brig. Gen., Johnson's Provisional Division, Longstreet's Left Wing / Hood's Corps, Army of Tennessee, at Chickamauga. The record asserts no major-general-at-Chickamauga rank, no company command, no portrait, and no sourced ratings.
- **Sources:** NPS Bushrod Johnson person page; U.S. Army Staff Ride Handbook for Chickamauga; NPS History Chickamauga narrative; American Battlefield Trust Chickamauga facts; American History Central Bushrod Johnson entry.
- **Probe (`tools/probe-loot-survival.mjs`):** canonical replacement tooth retitled D297/thirty; counts bumped 29→30 for records/applied/generated/authored; Johnson gets alias lookup, generated/replacement/provenance/name, rank/side/branch/team, bio/sourceNote substring, source-count, no-major-general-at-Chickamauga, no-company-command, and no-portrait assertions.
- **Gate (focused, D176):** JSON parse OK; importer/schema OK records=30 verified=30 disputed=0; importer `--check` OK records=30 verified=30 disputed=0; `node tools/build.mjs` GATE OK (known raw embed soft warning only); `node --check tools/probe-loot-survival.mjs`; **probe-loot-survival ok=true 11/11, applied=30, 0 pageerrors**; adjacents **probe-tactical-roster 8/8** and **probe-women-in-war 8/8, 0 pageerrors** (`replacementRecords:30`, women/support lane still separate); JSON readback confirmed all three artifacts with zero pageerrors; `git diff --check` clean. Full `npm run vet:noreg` was not rerun immediately after the D292 batch/release checkpoint.
- **NEXT:** another bounded Priority-1 Soldier's Story slice only where source trail and slot fit are exact. Side balance is now 15US/15CS. M8/Q5/Q6 locked; Phase H parked; Phase D deferred.

## D296 PHASE I SOLDIER'S STORY SCALE-OUT — John W. Haley added as the twenty-ninth citation-grade replacement, a Gettysburg / Birney's Division private row — 2026-07-08 (D296)
- **What shipped:** the Soldier's Story replacement lane grows 28→**29** `Verified` records; side balance moves 14US/14CS → **15US/14CS**. **John W. Haley** replaces `ss:gettysburg:US:us_birney_iii:pvt`, the open Gettysburg / Birney's Division / III Corps private slot. Data + probe only; no engine/combat change, D74 intact.
- **Record (`data/soldier-replacements.json`):** Haley ships as Private, Company I, 17th Maine Infantry, de Trobriand's Brigade, Birney's First Division, III Corps / Army of the Potomac, at Gettysburg. The record asserts no Gettysburg-corporal rank, no portrait, and no sourced ratings.
- **Sources:** Haley journal/bibliography trail; Emerging Civil War John Haley/17th Maine article; NPS Gettysburg Army of the Potomac OOB; Maine at War Gettysburg march article; UNE/Saco Museum exhibit page; Civil War Monitor Trobriand/Wheatfield article.
- **Probe (`tools/probe-loot-survival.mjs`):** canonical replacement tooth retitled D296/twenty-nine; counts bumped 28→29 for records/applied/generated/authored; Haley gets alias lookup, generated/replacement/provenance/name, rank/side/branch/team, bio/sourceNote substring, source-count, private-slot caveat, no-corporal-claim, and no-portrait assertions.
- **Gate (focused, D176):** JSON parse OK; importer/schema OK records=29 verified=29 disputed=0; importer `--check` OK records=29 verified=29 disputed=0; `node tools/build.mjs` GATE OK (known raw embed soft warning only); `node --check tools/probe-loot-survival.mjs`; **probe-loot-survival ok=true 11/11, applied=29, 0 pageerrors**; adjacents **probe-tactical-roster 8/8** and **probe-women-in-war 8/8, 0 pageerrors** (`replacementRecords:29`, women/support lane still separate); JSON readback confirmed all three artifacts with zero pageerrors; `git diff --check` clean. Full `npm run vet:noreg` was not rerun immediately after the D292 batch/release checkpoint.
- **NEXT:** another bounded Priority-1 Soldier's Story slice. With side balance now 15US/14CS, Western/CS is again useful where source trail and slot fit are exact. M8/Q5/Q6 locked; Phase H parked; Phase D deferred.

## D295 PHASE I SOLDIER'S STORY SCALE-OUT — Taliaferro N. "Tally" Simpson added as the twenty-eighth citation-grade replacement, a Chickamauga / Kershaw's Brigade corporal row — 2026-07-08 (D295)
- **What shipped:** the Soldier's Story replacement lane grows 27→**28** `Verified` records; side balance improves 14US/13CS → **14US/14CS**. **Taliaferro N. "Tally" Simpson** replaces `ss:chickamauga:CS:cs_kershaw_rock:nco`, the open Chickamauga / Kershaw's Brigade NCO slot. Data + probe only; no engine/combat change, D74 intact.
- **Record (`data/soldier-replacements.json`):** Simpson ships as Corporal, Companies A/B, 3rd South Carolina Infantry, Kershaw's Brigade, McLaws' Division, Longstreet's Corps / Army of Tennessee, at Chickamauga. The record asserts no portrait, no company command, no promotion, and no sourced ratings. Its bio keeps the letters source-aware by noting enslaved Zion rather than presenting a romanticized Confederate enlisted voice.
- **Sources:** Oxford/PagePlace preview of *Far, Far from Home*; Clemson University Simpson bio; Old Pendleton District Chapter January 2013 newsletter; ACWScots Chickamauga Confederate OOB; NPS History Chickamauga narrative.
- **Probe (`tools/probe-loot-survival.mjs`):** canonical replacement tooth retitled D295/twenty-eight; counts bumped 27→28 for records/applied/generated/authored; Simpson gets alias lookup, generated/replacement/provenance/name, rank/side/branch/team, bio/sourceNote substring, source-count, enslaved-Zion context, and no-portrait assertions.
- **Gate (focused, D176):** JSON parse OK; importer/schema OK records=28 verified=28 disputed=0; importer `--check` OK records=28 verified=28 disputed=0; `node tools/build.mjs` GATE OK (known raw embed soft warning only); `node --check tools/probe-loot-survival.mjs`; **probe-loot-survival ok=true 11/11, applied=28, 0 pageerrors**; adjacents **probe-tactical-roster 8/8** and **probe-women-in-war 8/8, 0 pageerrors** (`replacementRecords:28`, women/support lane still separate); JSON readback confirmed all three artifacts with zero pageerrors; `git diff --check` clean. Full `npm run vet:noreg` was not rerun immediately after the D292 batch/release checkpoint.
- **NEXT:** another bounded Priority-1 Soldier's Story slice. M8/Q5/Q6 locked; Phase H parked; Phase D deferred.

## D294 PHASE I SOLDIER'S STORY SCALE-OUT — John Camden West added as the twenty-seventh citation-grade replacement, a second Chickamauga / Hood's Texas Brigade private-soldier row — 2026-07-07 (D294)
- **What shipped:** the Soldier's Story replacement lane grows 26→**27** `Verified` records; side balance improves 14US/12CS → **14US/13CS**. **John Camden West** replaces `ss:chickamauga:CS:cs_law_gap:pvt`, the still-open Chickamauga / Hood's-Law's Division private slot beside D291's Val C. Giles NCO row. Data + probe only; no engine/combat change, D74 intact.
- **Record (`data/soldier-replacements.json`):** West ships as Private, Company E, 4th Texas Infantry, Robertson's Texas Brigade, Hood's Division (Law commanding, 20 September), Longstreet's Corps / Army of Tennessee, at Chickamauga. The record asserts no portrait, no company command, no promotion, and no sourced ratings.
- **Sources:** TSHA Handbook of Texas Online entry for John Camden West; Online Books Page/HathiTrust listing for *A Texan in Search of a Fight* as diary and letters of a private soldier in Hood's Texas Brigade; Daily Observations transcription of West's 24 September 1863 Chickamauga letter; NPS 4th Texas battle-unit page; Chickamauga Confederate OOB placing the 4th Texas in Robertson's Brigade, Hood's Division, with Law commanding.
- **Probe (`tools/probe-loot-survival.mjs`):** canonical replacement tooth retitled D294/twenty-seven; counts bumped 26→27 for records/applied/generated/authored; West gets alias lookup, generated/replacement/provenance/name, rank/side/branch/team, bio/sourceNote substring, sources.length, and no-portrait assertions. The touched probe also now exits explicitly on success after writing/printing the green artifact, fixing the local Chrome teardown hang observed during the first D294 run.
- **Gate (focused, D176):** importer/schema OK records=27 verified=27 disputed=0; `node tools/build.mjs` GATE OK (known raw embed soft warning only); `node --check tools/probe-loot-survival.mjs`; **probe-loot-survival ok=true 11/11, applied=27, hostileRejected=true, 0 pageerrors**; adjacents **probe-tactical-roster 8/8** and **probe-women-in-war 8/8, 0 pageerrors** (`replacementRecords:27`, women/support lane still separate); JSON readback confirmed all three artifacts `ok=true`, zero failed steps, zero pageerrors, zero realErrors; `git diff --check` clean. Full `npm run vet:noreg` was not rerun immediately after the D292 batch/release checkpoint.
- **NEXT:** another bounded Priority-1 Soldier's Story slice, still preferably Western/CS if source/slot fit is exact. M8/Q5/Q6 locked; Phase H parked; Phase D deferred.

## D293 PHASE I SOLDIER'S STORY SCALE-OUT — John S. Jackman added as the twenty-sixth citation-grade replacement, a bounded Western/CS private-soldier slice — 2026-07-07 (D293)
- **What shipped:** the Soldier's Story replacement lane grows 25→**26** `Verified` records; side balance improves 14US/11CS → **14US/12CS**. **John S. Jackman** replaces `ss:chickamauga:CS:cs_breck_rock:pvt`, the still-open Chickamauga / Breckinridge's Division / Orphan Brigade private slot beside D290's John W. Green NCO row. Data + probe only; no engine/combat change, D74 intact.
- **Record (`data/soldier-replacements.json`):** Jackman ships as Private, Company B, 9th Kentucky Infantry, Helm's Kentucky "Orphan Brigade," Breckinridge's Division, Polk's Wing / Army of Tennessee, at Chickamauga. The record asserts no portrait, no promotion, no company command, and no sourced ratings.
- **Sources:** University of South Carolina Press book page for *Diary of a Confederate Soldier: John S. Jackman of the Orphan Brigade*; University of Louisville digital collection item placing Jackman in the Ninth Kentucky and at Shiloh/Vicksburg/Chickamauga; Savas Beatie excerpt identifying "Pvt. John Jackman of Company B, the Confederate 9th Kentucky"; Chickamauga Confederate OOB placing the 9th Kentucky in Helm's Brigade / Breckinridge's Division.
- **Probe (`tools/probe-loot-survival.mjs`):** canonical replacement tooth retitled D293/twenty-six; counts bumped 25→26 for records/applied/generated/authored; Jackman gets alias lookup, generated/replacement/provenance/name, rank/side/branch/team, bio/sourceNote substring, sources.length, and no-portrait assertions.
- **Gate (focused, D176):** importer/schema OK records=26 verified=26 disputed=0; `node tools/build.mjs` GATE OK (known raw embed soft warning only); `node --check tools/probe-loot-survival.mjs`; **probe-loot-survival ok=true 11/11, applied=26, hostileRejected=true, 0 pageerrors**; adjacents **probe-tactical-roster 8/8** and **probe-women-in-war 8/8, 0 pageerrors** (`replacementRecords:26`, women/support lane still separate); JSON readback confirmed all three artifacts `ok=true`, zero failed steps, zero pageerrors; `git diff --check` clean. Full `npm run vet:noreg` was not rerun immediately after the D292 batch/release checkpoint.
- **NEXT:** another bounded Priority-1 Soldier's Story slice, still preferably Western/CS if source/slot fit is exact. M8/Q5/Q6 locked; Phase H parked; Phase D deferred.

## D291 PHASE I SOLDIER'S STORY SCALE-OUT — three new citation-grade CS Western replacements (23-25): Val C. Giles (Chickamauga / Hood's Texas Brigade), William Pitt Chambers (Vicksburg / 46th Mississippi — the 2nd Vicksburg-CS record), Sam Houston Jr. (Shiloh / 2nd Texas — the Unionist governor's son) — 2026-07-07 (D291)
- **What shipped:** the Soldier's Story replacement lane grows 22→**25** `Verified` records; a second CS-weighted, Western-theater slice — side balance 14US/8CS → **14US/11CS**, deepening all three Western battles (Chickamauga → 3 CS, Vicksburg → 2 CS, Shiloh → 2 CS). Aaron picked this lane over a `vet:noreg` batch/release checkpoint by popup. Data + probe only, no engine/combat change, D74 intact, standalone/sandbox byte-identical.
- **Records (`data/soldier-replacements.json`):** (1) **Val C. Giles** → `ss:chickamauga:CS:cs_law_gap:nco` — Sgt (4th Sergeant from 1 May 1863), Co. B "Tom Green Rifles", 4th Texas Infantry, Robertson's Texas Bde, Hood's Division (Law commanding 20 Sep), Longstreet's Corps on loan to the Army of Tennessee, Chickamauga 19-20 Sep 1863; memoir *Rags and Hope*; captured Wauhatchie 29 Oct 1863. (2) **William Pitt Chambers** → `ss:vicksburg:CS:cs_smith_stockade:nco` — Sgt (rose private→first sergeant), Co. B, 46th Mississippi Infantry, Baldwin's Bde, M.L. Smith's Division, Vicksburg garrison; a Covington County schoolteacher; journal *Blood and Sacrifice*. The **2nd Vicksburg-CS** record. (3) **Sam Houston Jr.** → `ss:shiloh:CS:cs_bragg_corps:pvt` — Pvt, Co. C "Bayland Guards", 2nd Texas Infantry, Jackson's Bde, Withers' Div, Bragg's Corps, Shiloh; wounded + left for dead on the second day (7 Apr 1862), a Bible from his mother stopped a ball; POW Camp Douglas; the eldest son of the Unionist governor Sam Houston (removed for refusing the Confederate oath). Echoes the fluid-loyalties theme beside Stanley (D289).
- **Honesty (per D92/D152-D290):** Giles — ships at his documented Chickamauga rank (Sergeant, an NCO in an NCO slot; Wikipedia quotes "Sergeant Val Giles" on the field), no portrait. Chambers — does NOT claim the 46th personally held the Stockade Redan salient (its parent Smith's Division held that northern sector; the salient proper was Shoup's Louisianans), ships his first-sergeant grade as generic "Sergeant" (transparently disclosed — a within-NCO generalization, not a cross-line deflation), no portrait. Houston — ships his enlisted Private rank (no inflation), the Bible/left-for-dead details attributed to the cited sources not asserted, the 7 April wound-day pinned per the regimental account with a bio hedge that some accounts place it on the first day, explicitly placed for his own 2nd Texas service not his famous father, no portrait.
- **Sources (all live-confirmed IN THE MAIN LOOP; 4 per record):** Giles — *Rags and Hope* (HathiTrust 000423481), TSHA "Fourth Texas Infantry", Wikipedia "4th Texas Infantry Regiment" ("Sergeant Val Giles" at Chickamauga), Emerging Civil War "A Thousand Words a Battle: Chickamauga" (Robertson's Bde in Hood's Division, Longstreet's left wing). Chambers — USM McCain finding aid M214, *Blood and Sacrifice* (Blue Acorn Press 1994), NPS "46th Mississippi Infantry" (Baldwin's Bde/M.L. Smith's Div), Find a Grave 46789283. Houston — TSHA "Houston, Sam, Jr.", Wikipedia "Sam Houston Jr.", Wikipedia "2nd Texas Infantry Regiment" (Jackson's Bde/Withers'/Bragg; ambushed 7 Apr "with Sam Houston Jr. among the wounded"), TSHA "Second Texas Infantry".
- **Process note (D289/D290 lesson APPLIED):** every load-bearing citation was independently verified in the MAIN LOOP with inline `WebSearch`/`WebFetch`, not parked on a background research workflow (the D289 hang — a stalled per-agent `WebFetch` — avoided). Two facts were corrected DURING verification: Giles's rank was raised from a planned `:pvt` to `:nco` once his 4th-Sergeant grade was confirmed (honest, not deflating), and Houston's wounding was pinned to Shiloh's second day by the 2nd Texas regimental account. The adversarial panel ran only as a read-only background cross-check with a bounded wait — this time it completed cleanly (no hang, no args mis-feed: each lens prompt embedded the full record text rather than passing `args`).
- **Probe (`tools/probe-loot-survival.mjs`):** the D290 "twenty-two" step retitled D291 "twenty-five"; counts bumped 22→25 (records/applied/generated-25/authored+25); three new per-record verification blocks (alias lookup + generated/replacement/provenance/name + rank/side/branch/team + bio substrings + front-loaded sourceNote caveats + sources.length≥4 + no-portrait) added for Giles/Chambers/Houston; return summary extended. `probe-women-in-war` needed no edit — it reads the replacement count dynamically and only checks cross-lane leaks + the `ss:` prefix.
- **Gate (focused, D176):** importer validate 25/25 Verified; `node tools/build.mjs` GATE OK (citations ✓, women-in-war ✓); `node --check` probe clean; **probe-loot-survival ok=true 11/11, applied=25, hostileRejected=true, 0 pageerrors**; adjacents probe-tactical-roster 8/8 + probe-women-in-war 8/8 lane-separation green (replacementRecords:25); `git diff --check` clean; deliverable diff = the roster-data embed only. All three sourceNotes trimmed to ≤360 chars so the runtime's `_lootCleanText(...,360)` display clip cuts nothing.
- **Adversarial fact-check (read-only default-refute Opus ×3 workflow `wf_a1ac5e1b-4c9`, the D281 read-only-lens lesson): 9/9 SHIP, 0 FIX, 0 BLOCK.** HONESTY, ACCURACY, and SLOT-CONSISTENCY lenses each SHIP all three — every rank matches the documented grade with no inflation/deflation, every unit belongs in its slot's brigade/division/corps, no portrait asserted, caveats accurate (the panel independently confirmed Chambers's Stockade-Redan division-vs-regiment disclaimer is historically correct). Two minor advisories: Chambers's "first sergeant"→"Sergeant" generalization (all lenses: non-inflating, already disclosed — no change) and Houston's contested 7-April wound-day (ACCURACY) → **advisory adopted**, a bio hedge added, re-gated green.
- **NEXT:** more Priority-1 Soldier's Story slices (theater balance still leans US) OR a batch/release `vet:noreg` checkpoint (Aaron's call). Held for a future slice: Haley (US Gettysburg — worsens the side balance this lane corrects). M8/Q5/Q6 locked; Phase H parked; Phase D deferred.

## D290 PHASE I SOLDIER'S STORY SCALE-OUT — three new citation-grade CS replacements (20-22): Berry Benson (Chancellorsville), John W. "Johnny" Green (Chickamauga / Orphan Brigade), William H. Tunnard (Vicksburg — the FIRST Vicksburg-CS record) — 2026-07-07 (D290)
- **What shipped:** the Soldier's Story replacement lane grows 19→**22** `Verified` records; a CS-weighted, theater-balancing slice — side balance 14US/5CS → **14US/8CS**, spanning Eastern (Chancellorsville) + two Western theaters (Chickamauga, Vicksburg — the emptiest: Vicksburg had 1 US, 0 CS). Data + probe only, no engine/combat change, D74 intact, standalone/sandbox byte-identical.
- **Records (`data/soldier-replacements.json`):** (1) **Berry Benson** → `ss:chancellorsville:CS:cs_ap_hill_div:nco` — Cpl, Co. H, 1st South Carolina Infantry, McGowan's (Gregg-McGowan) Bde, A. P. Hill's Light Division, Jackson's Second Corps, Chancellorsville (leg-wounded, missed Gettysburg); the celebrated scout/sharpshooter who tunneled out of Elmira. The prompt's held candidate, shipped with the 2nd rank source confirmed. (2) **John W. "Johnny" Green** → `ss:chickamauga:CS:cs_breck_rock:nco` — an enlisted man of the 9th Kentucky, Helm's Kentucky "Orphan Brigade," Breckinridge's Division, D. H. Hill's Corps, Polk's Right Wing, Chickamauga (20 Sep 1863, the assault where Helm was killed); entered service 4 Oct 1861 and rose to regimental Sergeant-Major. (3) **William H. Tunnard** → `ss:vicksburg:CS:cs_3rd_louisiana:nco` — Sgt, Co. K (Pelican Rifles origin), 3rd Louisiana Infantry, Hebert's Bde, Forney's Div; his regiment held the 3rd Louisiana Redan (Union mines 25 Jun & 1 Jul 1863); captured at Pemberton's 4 Jul surrender; author of *A Southern Record* (1866). The **FIRST Vicksburg Confederate** record.
- **Honesty (per D92/D152-D289):** Benson — shipped at Corporal, bracketed (NGE: corporal at enlistment; American Rifleman: sergeant only after his late-1864 capture → May 1863 = corporal); no formal sharpshooter-battalion claim at Chancellorsville (McGowan's battalion organized 1864); no portrait. Green — his exact grade at Chickamauga is undocumented; placed in the NCO (`:nco`) "Sergeant" slot because he demonstrably rose to regimental Sergeant-Major and secondary accounts date a Shiloh (April 1862) promotion — before Chickamauga — so the NCO tier is the conservative read of a documented NCO, NOT a private baseline, and the panel's tier concern (a `:pvt` slot might fit a still-private) is answered by that promotion evidence; Sergeant-Major-at-the-battle explicitly NOT asserted; company unidentified; no portrait. Tunnard — does not claim he was personally in a mine crater (a sergeant of the regiment that held the redan sector); rank corroborated (the 3rd Louisiana page cites "Sergeant Tunnard" at Iuka, Sept 1862, before Vicksburg); *A Southern Record* framed as a participant/period account, not an uncritical authority; no portrait.
- **Sources (all live-confirmed; every load-bearing URL re-fetched IN THE MAIN LOOP):** Benson — New Georgia Encyclopedia, American Rifleman (NRA), Wikipedia "A. P. Hill's Light Division" (Gregg-McGowan / 1st SC / Chancellorsville), Berry Benson's Civil War Book (UGA Press). Green — University Press of Kentucky, Genealogy Trails (entered 4 Oct 1861, Sergeant-Major 9th KY), Wikipedia "Battle of Chickamauga order of battle: Confederate" (9th KY in Helm's Bde / Breckinridge / Polk's Wing) + "Orphan Brigade". Tunnard — Wikipedia "William H. Tunnard" (Sgt, Co. K, captured 4 Jul 1863), UA Press "A Southern Record", Wikipedia "3rd Louisiana Infantry Regiment" (Hebert/Forney/redan/mines/Sgt Tunnard), UMich Making of America primary text.
- **Slot enumeration:** a harness over the nine battle OOBs enumerated 612 generated slots (593 open before this slice); all three `replacePid` targets confirmed open and correctly typed (nco×3); the importer independently re-validates each targets a real generated row. Vicksburg-CS and a second Chickamauga-CS chosen to fill the emptiest theaters.
- **Process note (D289 lesson APPLIED):** every load-bearing citation was independently re-fetched in the MAIN LOOP rather than parking on a background research workflow — the D289 hang (a stalled per-agent `WebFetch`) is avoided by owning the fetches inline. The adversarial panel ran only as a read-only background cross-check with a bounded wait.
- **Adversarial fact-check (read-only default-refute Opus ×3 workflow `wf_e9626494-e91` + a clean accuracy re-run):** honesty lens = all 3 SHIP (Benson rank bracket verified vs NGE; Green NCO placement judged HONEST; Tunnard Vicksburg facts confirmed); slot-consistency lens = Benson/Tunnard SHIP, Green FIX (the tier question — addressed above by the Shiloh-promotion evidence + a strengthened caveat); accuracy lens (the workflow's leg mis-received args and checked the already-shipped D289 records, so it was re-run cleanly as a single read-only Opus agent on the final text). Panel advisories ADOPTED before commit: Benson caveat margin tightened, Green tier justification strengthened, Tunnard period-source hedge + "sector of the redan" precision added.
- **Gate (focused, D176):** import `--check` 3/3 → `--import --write` merged 22/22 Verified; `node tools/build.mjs` GATE OK (citations ✓, women-in-war ✓); `node --check` probe clean; **probe-loot-survival ok=true 11/11, applied=22, hostileRejected=true, 0 pageerrors** (D289 "nineteen" step retitled → "D290 twenty-two"; counts 19→22; 3 new per-record blocks); adjacents probe-tactical-roster 8/8 + probe-women-in-war lane-separation green (replacementRecords:22); `git diff --check` clean; deliverable diff = the roster-data embed only. Re-gated green after the panel edits.
- **NEXT:** more Priority-1 Soldier's Story slices OR a batch/release `vet:noreg` checkpoint (Aaron's call). Held for a future slice: Haley (US Gettysburg — worsens the side balance this slice corrects). M8/Q5/Q6 locked; Phase H parked; Phase D deferred.

## D289 PHASE I SOLDIER'S STORY SCALE-OUT — three new citation-grade replacements (17-19): Henry M. Stanley (first Western-CS), John Dooley (first Confederate Gettysburg), Joseph H. De Castro (19th Mass corporal at the Angle) — 2026-07-07 (D289)
- **What shipped:** the Soldier's Story replacement lane grows 16→**19** `Verified` records; side balance 13US/3CS → **14US/5CS**; the two biggest gaps filled (Western CS; a Confederate voice at Gettysburg). Data + probe only, no engine/combat change, D74 intact, standalone/sandbox byte-identical.
- **Records (`data/soldier-replacements.json`):** (1) **Henry M. Stanley** → `ss:shiloh:CS:cs_hardee_corps:pvt` — Pvt, Co. E "Dixie Grays", 6th Arkansas, Hindman's/Shaver's Bde, Hardee's Corps, Shiloh; captured→galvanized Yankee; the future explorer (born John Rowlands). (2) **John Dooley** → `ss:gettysburg:CS:cs_pickett_div:cmd` — 1st Lt, Co. C "Montgomery Guard", 1st Virginia, Kemper's Bde, Pickett's Div; wounded both thighs + captured in Pickett's Charge. (3) **Joseph H. De Castro** → `ss:gettysburg:US:us_gibbon_bdes:nco` — Cpl, Co. I, 19th Massachusetts, Hall's Bde/Gibbon/II Corps; seized a Confederate color at the Angle repulsing Pickett's Charge, MOH 1 Dec 1864, widely-credited first Hispanic-American recipient. Dooley (charging) + De Castro (repulsing) = the two sides of the Angle.
- **Honesty (per D92/D152-D239):** Stanley — autobiography flagged self-mythologizing, soldier-life source only, no portrait, no claim on his contested later career. Dooley — enlisted a private (Aug 1862), firm 1st lieutenant from 10 Apr 1863, captaincy *backdated* to 17 May 1863; ships the firm lieutenant rank + discloses the backdating, mapped to the officer `:cmd` slot (an officer in a `:pvt` slot would DEFLATE rank — D92 forbids it like inflation); journal read critically, not a Lost Cause frame; no portrait. De Castro — battle-day corporal (not the later sergeancy); the 19th Virginia flag ID hedged as later-secondary (Devereux's primary report names his capture but lists 14th/19th/57th Virginia without matching officer to flag); "first Hispanic-American" hedged as "widely credited"; no portrait.
- **Sources (all live-confirmed; every load-bearing URL re-fetched):** Stanley — Autobiography (Gutenberg #77113), HistoryNet, History of War Shiloh OOB, Wikipedia 6th Arkansas. Dooley — Dictionary of Virginia Biography, American Battlefield Trust (his own account, "Shot through both thighs, I fall about 30 yards from the guns"), NPS ANV OOB (1st Virginia in Kemper's/Pickett's), Antietam-on-the-Web photo file. De Castro — Devereux's official report (primary, "one by Corpl. Joseph H. De Castro, Company I"), NPS AOP OOB (19th Mass in Hall's Bde), American Battlefield Trust, Army.mil Hispanic-MOH article.
- **Content bug caught + fixed in-flight:** the runtime clips `sourceNote` to 360 chars (`_lootCleanText(...,360)`), dropping trailing honesty caveats from the *displayed* note; the lane probe caught it (Stanley's "contested later career" clipped). Fixed by front-loading the caveats within 360 chars (the established pattern) — probe NOT weakened.
- **Slot correction from research:** proposed Dooley `:pvt` was wrong (officer at Gettysburg) → remapped to `:cmd`; confirmed by the verify pass + my own DVB/ABT/NPS fetches.
- **Process note (lesson):** the research workflow `wf_b50adca5-ea2` HUNG overnight — a Sonnet research agent stalled mid-`WebFetch` on Stanley's large Perseus autobiography page and never timed out, blocking the pipeline; the main loop was parked on a completion notification that never fired. Killed it (`TaskStop`) and finished from the four completed verify packets + independent verification of Stanley. Lesson: don't park the main loop on a background workflow without a bounded fallback; a per-agent web fetch can hang the whole pipeline.
- **Probe (`tools/probe-loot-survival.mjs`):** the D239 "sixteen" step retitled D289 "nineteen"; counts bumped (records/applied/generated-19/authored+19); three new per-record verification blocks (alias lookup + generated/replacement/provenance/name + rank/side/branch/team + bio substrings + sourceNote caveats + sources.length + no-portrait) added for Stanley/Dooley/De Castro.
- **Focused gate (D160/D176):** import gate 19/19 Verified · `node tools/build.mjs` **GATE OK** (citations ✓) · `node --check` probe clean · **probe-loot-survival ok=true 11/11, applied=19, hostileRejected=true, 0 pageerrors** · adjacents **probe-tactical-roster 8/8** + **probe-women-in-war** (lane-separation) green · `git diff --check` clean. Probes foreground `2>/dev/null`, `TMPDIR=$PWD/.tmp`, one shared server.
- **Adversarial fact-check (read-only Opus, single agent — ultracode toggled off mid-session, so not a workflow):** all three **SHIP, zero errors**; every load-bearing URL independently re-fetched; Stanley's Hardee-not-Bragg/Polk corps, Dooley's lieutenant-vs-backdated-captaincy hedge, and De Castro's 19th-Virginia-as-secondary hedge all confirmed accurate.
- **Held for a future slice (vetted, not shipped):** Benson (CS Chancellorsville, corporal — rank single-sourced on the New Georgia Encyclopedia) and Haley (US Gettysburg — worsens the side balance this slice fixes).
- **Queue: D289 done. NEXT = Priority-1 Soldier's Story scale-out (more bounded named-person slices) OR a batch/release `vet:noreg` checkpoint (Aaron's call — probe-presets green since D278). M8/Q5/Q6 locked; Phase H parked; Phase D deferred.**

## D288 E59 FIXED — the procedural skirmish-forces clamp no longer compresses authored odds to a coin flip; an odds-preserving joint brigade scale (symmetric cap 1.8), shared by the fought AND the PM3 delegated paths — 2026-07-06 (D288)
- **Defect (E59, filed at D277):** `_fldCampaignSkirmishParams` clamped brigade COUNT [2,5] and men [1300,2100] INDEPENDENTLY per side, destroying the authored `bd.us:bd.cs` ratio — Sumter 6:1 → 2600-vs-2600 (a coin flip; a fresh delegate needed up to 9 tries), Fredericksburg 1.58:1 → 10500-vs-10500 (both saturated). Pre-existing, shared with the fought path; PM3 (D277) made it visible.
- **Fix (`src/tactical/T2-campaign-link.js`):** the two sides derived JOINTLY (`_skForces`/`_skDecomp`) so the ratio survives up to a symmetric cap `SK_MAX_ODDS=1.8`; `effBig=clamp(3400+big*0.13,3400,10500)`, `ratio=min(1.8,big/small)`, `effSmall=effBig/ratio` (floored 2600, lifting effBig), decompose to `{count=clamp(2,5,ceil(eff/2100)), men=clamp(1300,2100,round(eff/count))}`. Pure deterministic, no RNG, seed untouched. INPUT-fidelity ceiling, NOT a D74 output gate. `_skCnt`/`_skMen` deleted.
- **A/B (log every number, `.tmp/ab-e59*`):** mean |log-ratio| odds error **0.391→0.218** (−44%); coin-flip class gone (Sumter→1.8:1, Nashville→1.83, Fredericksburg 1.58 exact, Wilderness 1.67 uncapped). Cap sweep (dominant, both chains): the cap is MEASURED — full ~4:1 strands the delegated US at Sumter + CS at Kernstown; **1.8 is the UNIQUE cap** keeping US completing (mcl 1) + CS reaching Spotsylvania (idx 17). No softer non-cap scheme works (Kernstown 2.24 ≈ Vicksburg 2.33). US completes idx 31/31 unchanged; CS wall sharpened inward from Nashville/Bentonville (old idx 22-23) to Spotsylvania — out = take command or the political path (unchanged).
- **Probes (honest re-baselines, not weakened):** probe-auto-resolve PL-3 flip re-homed Wilderness→Fort Donelson (empty→CS/loss, Henry→US/capture, same seed — Grant's "Unconditional Surrender"); Gettysburg spencer-delta still passes (eFrac 0.474→0.683, pFrac 0.173→0.144). probe-full-campaign CS "reaches the late war" 20→16 (measured 17, margin 1; wins≥15 unchanged=18).
- **Panel `wf_a0945f25-a3c` (read-only default-refute Opus ×4, D281 lesson — read-only lenses only): 4× SAFE_TO_COMMIT, 0 BLOCK.** Every D74/D69 refutation failed first-hand (pure symmetric input ceiling — Sumter fields identically as US or CS; only >1.8 capped; `_arSimSeed` untouched; shipped `_skForces` byte-for-byte == the cap-sweep harness `makeForces(1.8)`; NaN unreachable; isolation confirmed). History: the inward CS stall shortens the counterfactual (anti-Lost-Cause-positive). STANDS notes adopted/process-satisfied: `ab-e59-forces.mjs` is the uncapped design (0.026) vs shipped-capped 0.218; 1.8 provenance logged as playability-tuned; CS ≥16 = the measured floor; Henry@Donelson mild anachronism noted; the read-only "can't run the gate" caveat satisfied — the focused gate ran green independently.
- **Focused gate (D160/D176):** GATE OK · `node --check` T2+both probes · **probe-campaign-link 19/19 · probe-auto-resolve 10/10 · probe-full-campaign 4/4 · probe-bridge 6/6 · probe-field 23/23** (byte-identical standalone) — all ok, **0 pageerrors**, JSON read back · `git diff --check` clean. Probes foreground `2>/dev/null`, `TMPDIR=$PWD/.tmp`, one shared server, sequential/background. Full `vet:noreg` deferred per D176 (probe-presets still expected-red on E60).
- **Decide-&-log (not surfaced):** cap 1.8 preserves every D277 invariant, contradicts no teaching (refines the pacing D277 deferred to E59), symmetric (no D69 cushion), reversible. Tradeoff recorded transparently (steamrolls capped at 1.8; CS wall at Spotsylvania). E59 CLOSED.
- **Queue: E59 done. NEXT = Priority-1 Soldier's Story scale-out. M8/Q5/Q6 locked; Phase H parked; Phase D deferred.**

## D287 LLM-OPPONENT SLICE 3 SHIPPED — VOICE + PERSONA IS LIVE (the §5 dispatch stack + generals.json seasoning); probe-llm-commander 24/24 ×2; 4× panel-driven fixes; 4-lens read-only Opus panel — 2026-07-06 (D287)
- **Built (law §5/§7.4):** the optional ≤160-char in-character `dispatch` end-to-end under the §5 containment stack + per-general persona seasoning. T27 CAPTURE (`fldLlmCleanDispatch` + `fldLlmIsMetaDispatch`; the wall/install carry `st.dispatch`, never touching orders/diagnostics). T28 schema `dispatch` (maxLength 160, no fact fields), `LLM_SYSTEM` voice charter, `fldLlmSomberNow`/`fldLlmSceneIsSomber`, persona (`fldLlmPersonaLine`/`_fldLlmSurname`/`fldLlmPersonaFor` from `scenData.leaders`→`generals.json`, `fldLlmSystemPrompt`), the render surface `fldLlmRenderDispatch` (top-left "Dramatization" card, escaped), the aria-live in-place panel-polish. One guarded `fldRenderTop` line in T0. No new module/manifest; byte-identical OFF.
- **The §5 stack:** one-way facts (schema + digest bands) · grim-professional + anti-Lost-Cause register · "Dramatization" caption (never Verified/Inferred) · somber suppression on antietam/gettysburg/chancellorsville (text hidden, orders execute) · failure=silence incl. AI-meta/refusal → silence · grounding reads only `__FIELD._t27`. Persona = INPUT texture only, never an outcome (D74). Verified live: Bull Run CS→Beauregard bold, US→Burnside measured.
- **Panel `wf_370ea214-aef` (read-only default-refute Opus ×4, D281 lesson): 0 BLOCK** — d74-persona + robustness SAFE_TO_COMMIT high; containment + probe-adequacy ADVISORY. **4 findings FIXED before commit:** §5.5 meta-filter added; persona was inert vs real data (brigade≠army generals) → rewired to `scenData.leaders`; somber broadened to `scenData.id/name`; the D285 aria-live polish pinned. Residuals recorded (Adapter-A free-text = disclosed §5 residual; stale-line = §3.4 continuity; somber-set hand-mirror = fail-safe).
- **Commands/results:** GATE OK · `node --check` all clean · `probe-llm-commander` **24/24 ×2, 0 pe, 0 net** (18 slice-1/2 + 6 voice teeth) · adjacents ai 15/15 · attacker-parity 13/13 · presets 27/27 (OFF-state byte-identity guard) · field 23/23 · bullrun 15/15 · fredericksburg 22/22 · PM3 lock auto-resolve 10/10 + campaign-link 19/19 · diff-check clean. **Screenshot readback caught + fixed a real top-right `#fldHud` collision** (D282 lesson) → repositioned top-left, re-verified. **WCAG dispatch card 4/4 AA** (weakest 9.68:1 caption). Probes foreground `2>/dev/null`, `TMPDIR=$PWD/.tmp`, one shared server, sequential.
- **Manual-only (never a gate):** a live OpenRouter `:free` / Anthropic smoke by hand — network NEVER in a probe. Not run this session.
- **Queue: the LLM-opponent arc is COMPLETE. NEXT = E59 → Priority-1 Soldier's Story. M8/Q5/Q6 locked; Phase H parked; Phase D deferred.**

## D286 FABLE 5 LEFT THE SUBSCRIPTION — THE D223 MIGRATION IS REVERTED; CLAUDE OPUS 4.8 IS THE PERMANENT TOP/MAIN-LOOP MODEL AGAIN (docs + config + memory; deliverable byte-identical) — 2026-07-06 (D286)
- **What changed:** Claude Fable 5 is gone from Aaron's subscription (for a long time), so the D223 migration is reverted. The Claude Code main loop is **Claude Opus 4.8 (`claude-opus-4-8` / `opus[1m]`) + xhigh** again — the permanent top model (`/model opus[1m]` already persisted in `~/.claude/settings.json`; `effortLevel:"xhigh"` predates Fable and stays). The D145 routing law is unchanged with Opus 4.8 as the top tier; helpers stay explicit Sonnet/Haiku on mechanical legs and Opus only on reasoning legs. The D223 "never Fable on a helper" clause is retired (Fable no longer exists).
- **Docs/config/memory:** `FABLE-5-PLAYBOOK.md` + `FABLE-AUDIT-PROMPT.md` moved to `legacy/`, replaced by **`OPUS-PLAYBOOK.md`** + **`AUDIT-PROMPT.md`**; forward-operating routing language repointed to Opus 4.8 in `CLAUDE.md`/`AGENTS.md`/`.github/copilot-instructions.md`/`START-HERE.md`/`AUTONOMOUS-RUN.md`/`V1-CHECKLIST.md`/`RATING-SYSTEM-DESIGN.md`/the three `docs/design/*-design.md` forward lines; `HANDOFF.md` + `WAKE-UP.md` top blocks refreshed; user-level `~/.claude/CLAUDE.md` + memory (`civilwar-subagent-model-routing`, `civilwar-opus-restore`) updated. Append-only history (DECISIONS D223–D285, all prior RUN-LOG entries) is untouched — a Fable session shipped them and that provenance stands; D223 got a one-line superseded-by-D286 pointer only.
- **Boundary + gate:** docs/config/memory only — no `src/`/`data/`/`build/`; deliverable `civil_war_generals.html` byte-identical (`git diff --stat` empty). `node tools/build.mjs` GATE OK · `git diff --check` clean · commit + push. All roadmap locks stand (Phase H park D214, M8/Q5/Q6). Follow-up out of scope: claude.ai account-level prefs may still carry Fable framing (fix in the claude.ai settings UI).

## D284 LLM-OPPONENT SLICE 1 SHIPPED — the T27 engine seam is live, ZERO network; probe-llm-commander 13/13 ×2 enrolled; 3× SAFE_TO_COMMIT panel — 2026-07-06 (D284)
- **Built (the law §9 prompt verbatim):** `src/tactical/T27-llm-commander.js` (per-launch `_gen`/`phaseIdx`-keyed state · the PURE fog-respecting band-quantized digest [250-men/25-yd/5-s/compass bands; `fldVisible`-filtered enemy contacts — the fog law binds the LLM] · the deterministic validation wall [malformed → whole-cycle fallback keeping the last good plan; illegal order → that brigade falls to the real engine field-for-field] · order application writing ONLY `u.order`/`u.formation`+`_t27`, vocabulary `move|hold|charge`+`line|column`, no fldRng, never playerCharge · four refusal gates: default-off `llmCommander` / sticky `_llmOff` / the PM3 double lock (`autoBoth` OR renderer-none) / no-plan-source, plus the `_gen` self-heal disarm so consent never crosses launches · `_t27MockPlan` hook = the ONLY slice-1 plan source; `fldLlmConfigured()` honestly false) + the T0 §3.2 dispatch line above fldAiDefender + manifest registration + `tools/probe-llm-commander.mjs` + vet:noreg enrollment (113 entries). **The D278-owed T0:351 badges-comment fix rode along** (the honest 5/8 → 7/8 pre-D273 → 8/8 chain layered on D281's framing).
- **Commands/results:** `node tools/build.mjs` → GATE OK · `node --check` all touched clean · `probe-llm-commander` **13/13 ×2, 0 pageerrors, 0 net** (fog-mask fires at t≈83s with 1 genuinely hidden brigade; the in-page fetch/XHR/WS/beacon spy read a hard 0 across all legs incl. armed ones) · adjacents **ai 15/15 · attacker-parity 13/13 · presets 27/27 · field 23/23** · spots **bullrun 15/15 · fredericksburg 22/22** · the PM3 lock **auto-resolve 10/10 · campaign-link 19/19** · deliverable diff = exactly the T27 splice + the T0 dispatch/comment block (+263/−1) · `git diff --check` clean. Probes foreground `2>/dev/null`, `TMPDIR=$PWD/.tmp`, one shared server, sequential.
- **Session catches (all probe-side, engine untouched):** the fog tooth was VACUOUS at deploy (2 US on field, all visible) → re-anchored to a deterministic step-until-hidden with a hard vacuity throw; the continuity tooth had to accept the engine's arrived-move→hold conversion (T0 order-queue arrival preserves tx/tz/tface — pinned at the un-fakeable 600/450/1.25 triple); the lone http request during legs is base.html's pre-existing boot `_m3dLoadScripts` THREE-CDN loader (pre-legs, not connector-class) → the playwright listener tolerates exactly that prefix and nothing else.
- **Panel `wf_89fe1c05-993` (read-only default-refute Opus ×3 — no tree mutation, the D281 lesson): 3× SAFE_TO_COMMIT high, zero refutations.** Advisories adopted/recorded in D284: the disarm-only `llmCommander=false` write named a seam-owned control flag (write-set amendment); the 7/8 chain re-confirmed vs D278; two SLICE-2 ARMING TRAPS recorded as contract law (never persist `llmCommander` into `_launchOpts` — the relaunch button would silently re-arm; stamp `playerSide` BEFORE arming — the fallback could aim the LLM at the human's side).
- **Queue: slice 2 the connector (adapters A+B + presets + settings/enable UI + key handling; manual `:free` smoke only, never a gate) → slice 3 voice → E59 → Priority-1 Soldier's Story. M8/Q5/Q6 locked; Phase H parked; Phase D deferred.**

## D285 LLM-OPPONENT SLICE 2 SHIPPED — the universal BYOK connector is live (adapters A+B, re-verified presets, settings panel + per-battle enable, device-only keys, async one-in-flight cadence); probe-llm-commander 18/18 ×2; 3× SAFE_TO_COMMIT panel — 2026-07-06 (D285)
- **Built (the law §2/§6/§7.4 slice-2 prompt):** new `src/tactical/T28-llm-connector.js` (the network + settings UI + the arm hook) + surgical T27 edits (`fldLlmConfigured` delegates to T28; `fldLlmRequestPlan` callback-based; `fldLlmCycle` async/one-in-flight with a triple staleness drop; new `fldLlmInstall`; state gains `pending`) + one T0 `fldLaunchSandbox` arm-hook line (after `fldInitSim`, so `playerSide` is stamped first — TRAP 2) + manifest registration + 5 new probe teeth. Adapter A (OpenAI-compat: OpenRouter/Groq/Ollama/LM Studio/custom) + Adapter B (Anthropic Messages: browser opt-in header, haiku-class default, never Opus/Fable). Config lives ONLY in a T28 module var + `localStorage cw_llm_conn`/`cw_llm_key` — never in `G.settings`/`gor_save`/C4/exports/repo. Every dispatch is failure-safe (`cb(null)` on any error → last good plan). The ONLY fetch in the feature is `fldLlmDispatchAsync` (T28); T27 stays network-free.
- **Provider facts RE-VERIFIED 2026-07-06** (5-agent web workflow `wf_101741db-65d`): Groq CORS confirmed wide-open by a live preflight; OpenRouter `:free` still works but Mistral `:free` is GONE; Gemini/OpenAI-direct still blocked (excluded); Anthropic browser header still works but is now undocumented (dispatch is failure-safe). Repo seams re-verified first-hand (`_launchOpts` stored by reference at T0:278; `playerSide` stamped at T0:310 inside `fldInitSim`; the relaunch `Object.assign` at T0:1663).
- **Commands/results:** `node tools/build.mjs` → GATE OK · `node --check` T28/T27/T0/probe clean · `probe-llm-commander` **18/18 ×2, 0 pageerrors, 0 net** (the 13 slice-1 teeth green under the async restructure + 5 new: T28-contract/config-state/key-leak/arm-hook-traps/panel-a11y+zero-network-UI) · adjacents **ai 15/15 · attacker-parity 13/13 · presets 27/27 · field 23/23** · spots **bullrun 15/15 · fredericksburg 22/22** · PM3 lock **auto-resolve 10/10 · campaign-link 19/19** · `git diff --check` clean · deliverable diff = T28 + the T27 async rewrite + the T0 arm line (+531/−30). Probes foreground `2>/dev/null`, `TMPDIR=$PWD/.tmp`, one shared server, sequential.
- **UI verification (the D282 lesson):** screenshot readback on both panel variants (OpenRouter + Anthropic desktop) — polished, legible, no paint/clip/overlap bug, no scroll-cap freeze (the panel lives in `.sheet` `overflow:auto`). WCAG arithmetic **11/11 pairs AA, weakest text 8.17:1**.
- **Panel `wf_fc1308d1-912` (read-only default-refute Opus ×3, the D281 lesson): 3× SAFE_TO_COMMIT high, zero blocking.** 4 advisories all resolved without a code change: security lens zero refutations (TRAP 1 verified; no leak; XSS-safe; proto-guarded); the `document.body` observer mirrors the shipped T11 idiom; the Anthropic schema's partial `required` is correct (hold omits tx/tz); the aria-live echo is mitigated by the focused `role=switch` announcing its `aria-checked` (recorded as a slice-3 panel-polish).
- **Manual-only (never a gate):** a live OpenRouter `:free` / Anthropic smoke runs by hand — network NEVER in a probe. Not run this session.
- **Queue: SLICE 3 voice + persona (the §5 dispatch render stack, persona/difficulty prompt presets as INPUT texture, optional per-general seasoning) → E59 → Priority-1 Soldier's Story. M8/Q5/Q6 locked; Phase H parked; Phase D deferred.**

## D283 LLM-OPPONENT DESIGN LAW LOCKED (Q-D270-5 planning slice) — the live LLM field commander + universal connector; docs-only, build not started — 2026-07-06 (D283)
- **Process (the D280 pattern):** workflow `wf_888c5559-785` — 4 Sonnet readers (T0 command surface · T26/T6/auto-resolve · gates/constraints · teaching/history surface) → 3 independent Opus design candidates → 3 adversarial Opus judges (scores: doctrine-engine 22/30 · narrator 21/30 · live-commander 14/30). Fable main loop re-verified every cited seam first-hand, loaded the claude-api reference, and web-verified the 2026 provider matrix (OpenRouter `:free`/Groq free tier browser-CORS OK; Gemini/OpenAI-direct blocked → excluded) before the Aaron popups.
- **Aaron's four locks:** live LLM field commander (over the judged hybrid, kill shots disclosed) · universal BYOK connector (OpenAI-compat adapter + Anthropic adapter; $0 rungs verified — the judges' reach kill shot refuted for this architecture) · guarded live voice under the §5 containment stack · opt-in/OFF-default with PM3 strictly neutral (T27 hard-refuses autoBoth/headless).
- **The law:** `docs/design/llm-opponent-design.md` — §3 order-writing seam (T26 idiom; validation wall; fog-respecting band digest; ~25 sim-s cadence), §4 determinism/probe law (OFF byte-identity by construction; zero re-pins; probe-llm-commander teeth incl. a zero-network fetch-spy; network never in a probe), §5 voice/gravity, §7 three slices (S1 zero-network engine seam RIDES the D278-owed T0:351 comment fix), §9 the paste-ready slice-1 build prompt.
- **Gates (docs-only per the kickoff):** no build/probe due (src/tools untouched) · `git diff --check` clean · docs trail (DECISIONS D283 · this entry · HANDOFF/WAKE-UP tops · V1-CHECKLIST gate state · REVIEW-QUEUE Q-D270-5 → RESOLVED). **Queue: the T27 slice-1 build → E59 → Priority-1 Soldier's Story. M8/Q5/Q6 locked; Phase H parked; Phase D deferred.**

## D282 THE D280 MAIN-MENU BUILD SHIPPED — THE AARON-LOCKED HYBRID COMMAND SCREEN IS LIVE (full-bleed somber-static backdrop · chain tracker · Field Operations group · E61 nudge half; 3× SAFE_TO_COMMIT) — 2026-07-06 (D282)
- **The build:** `docs/design/main-menu-redesign-design.md` §1-§6 executed verbatim — one module rewrite (`src/98-h0-main-menu.js`) + the probe re-anchor (`tools/probe-h0-main-menu.mjs`) + docs; presentation-only (D74), zero new embedded bytes, `build/base.html` untouched. Full-bleed PD-scene backdrop (aria-hidden, cold static grade, vignette+scrim) behind ≥.90 dark-glass panels; the theater-tinted campaign-chain rail (fought/current-ringed/ahead, SR summary, overflow-x rail, no-save suppressed) replaces the prototype footer OUTSIDE `.h0-top` (the `.gn-col:last-child` classifieds contract survives by construction); `#gnFree` anchors a labeled scroll-capped Field Operations group (the T0→T11 sibling chain clusters inside, mechanics unchanged); the E61 take-command card renders read-only at `recoveryMode && recoveryLossCount>=2` naming the walled battle (the collapse-terminal half stays open); `H0_SOMBER_SCENES` (antietam/gettysburg/chancellorsville — verified against SCENE_IMG provenance) suppresses ALL motion incl. the 340ms one-shot entrance and (panel advisory, adopted) the hover lift; nothing loops.
- **Shot-readback catches (both probe-pinned now):** the scroll-capped grid froze button rows at min-height (3-line decks painted over the next button) → flex column + a fit-content tooth; the tracker sat below the desktop fold post-injection → vertical trims + a fold tooth measured against the SHEET box after injection settle (the first draft measured the window and false-greened — rewritten, red-verified, fixed). Season chip now reads the battle row's year (saved-not-applied campaigns no longer show 1861).
- **WCAG:** 19/19 new pairs pass AA at worst case (white photo pixel under the glass; weakest 7.53:1 text / 9.08:1 non-text); focus/keyboard/SR structure probe-pinned; high-contrast force-hides the backdrop (toggled tooth).
- **Panel:** wf_a20efea1-d4c read-only default-refute Opus ×3 (per the D281 no-mutating-lens law) — **3× SAFE_TO_COMMIT, zero refutations**; both advisories adopted (somber hover stilled; the D74 static tripwire broadened to ANY `C.<field>=`) and re-gated green ×2.
- **Gates:** node --check ×2 files · GATE OK · probe-h0-main-menu ×2 green 0 pe (23 teeth ×3 viewports + saved/nudge/wardept/generated-region incl. dual D74 tripwires) · adjacents vs the FINAL CSS: menuprobe · help-overlay 10 · tutorial 15 · save-slots 14/14 · custom-battle-builder 15/15 · presets 27/27 · bootprobe realErrors 0 · 8 screenshots read visually · diff-check clean. Deferred per §4 scope: D278's T0 stale-comment incidental (T0 untouched). **Queue: LLM-opponent planning (Q-D270-5) → E59 → Priority-1 Soldier's Story.**

## D281 E62 RESOLVED — THE CAUTIOUS×LOGISTICS FOG-OFF RESUPPLY INVERSION CLOSED AT THE T4 SEAM (AI-led brigades only; neutrality delta −5 → 0; 2× SAFE_TO_COMMIT) — 2026-07-06 (D281)
- **The fix:** `FLDL.ATK_STANDOFF_RESUPPLY: 0` (the `ATK_FOG_RESUPPLY` fog-OFF analog) — the T4 step choke is `attacker ? (fog ? ATK_FOG_RESUPPLY : (_atkCautious && u.ai ? ATK_STANDOFF_RESUPPLY : 1.0)) : 1.0` + an `fldLogisticsAiUnit` stand-fast gate. AI-scope is the decisive panel sharpening: the posture is an AI-command input, so the choke binds exactly the brigades the doctrine commands; **the human player is unbound (orders and resupply both)** — the shipped Fredericksburg alt-history promise stays true. Fog path + defender untouched; D272's cautious INPUT untouched.
- **Measured:** pre-fix 2×2 cautious ON 3/8 vs OFF 8/8 (delta −5) · aggressive delta 0 (the hole was cautious-specific); FIXED delta 0 both postures, US train pinned at exactly 300, all CS wins full-clock timeouts cs 10.3k-11.4k; five surgical-identity gates full-row between builds; ×2 deterministic; live layers-ON before/after directions hold (Fred CS 8/8 · MH US 8/8 · BR byte-identical fog-ON); vicksburg/chickamauga multi-phase ON-vs-OFF aggregate delta 0 (chick P2 defender-supply asymmetry logged — the documented design-law direction, historical: Thomas held). All 0 pe.
- **Probe:** BALANCE v2 deliberate re-anchor — the invariant itself (live ON+OFF legs, |delta|≤1) + exact ON full-row pins (absolute-anchor duty commented) + winBy/CS≥7000 sharpenings + a dedicated choke tooth (incl. the ai:false human positive control); four fixtures protectively re-scoped. Teeth bind: the panel's probe-integrity lens reverted the fix, rebuilt, reproduced red, restored.
- **Panels:** wf_eef00e48-e93 — probe-integrity SAFE_TO_COMMIT (high, adversarial bind-proof) · mechanism SHARPEN_FIRST (all three adopted: u.ai scope, phases spot-check, pins kept+commented) · history REFUTED **on panel-race artifacts** (it read the tree during the other lens's revert+rebuild bind-test window; its non-artifact sharpenings adopted: Inferred-grade data notes, the unsourced Bull Run resupply specific dropped). Read-only confirm wf_59e68d5d-c6e: **2× SAFE_TO_COMMIT (high, zero refutations)**; both cheap sharpenings applied. **Lesson recorded: tree-mutating panel lenses (revert/rebuild bind-tests) must run isolated or serialized — never concurrent with read lenses.**
- **Gates:** GATE OK ×3 · probe-logistics 15/15 ×4 · arms/presets/field/bullrun/csplayer green · the 8-battle battery green (fred 22 · mh 27 · vicks 18 · chick 18 · antietam 16 · chancellorsville 27 · gettysburg 18 · shiloh 31) · attacker-parity/ai/auto-resolve/campaign-link green · diff-check clean · JSON readback ok, 0 pe everywhere. **probe-logistics' vet:noreg entry is GREEN again — every entry expected green at this head.** Ships: T4 + T0 comment + 3 data notes + probe-logistics. NEXT: the D280 main-menu build (Aaron kickoff orders same-session continuation).

## D279+D280 THE BATCH/RELEASE CHECKPOINT RAN (111/112 GREEN; E62 FILED — A REAL ENGINE FINDING, PANEL-CAUGHT) + THE MAIN-MENU DESIGN LAW LOCKED — 2026-07-06 (D279, D280)
- **D279 (the checkpoint, Aaron-approved by popup):** first full `vet:noreg` since D192, run in 5 split segments (the D174/D192 precedent) at the parity-arc-complete head. **111/112 entries green at this tree; probe-logistics is the one red — and it is NOT a stale pin.** The attribution A/B (`.tmp/ab-e62-logistics.mjs`, 8 legs × 3 deliverables ×2 deterministic, 0 pe) decomposed the drift (d251 5/8 → E49b 4/8 → D273-cautious 3/8; T26 zero again), but the 2-lens default-refute Opus panel (wf_c59e30a7-f43) REFUTED the re-anchor adjudication with the axis the A/B never sampled: **logistics OFF = CS 8/8 vs ON = 3/8 at HEAD — the layer is genuinely non-neutral; the cautious attacker freely resupplies a fog-off stand-off fire-trade (only `ATK_FOG_RESUPPLY` gates it, fog-on) — the D66 inversion's fog-off analog.** The refuted re-anchor was reverted; **E62 filed (REVIEW-QUEUE, full owner-slice spec) and Aaron-locked NEXT by popup.** Live exposure measured, not assumed: all 8 shipping battle probes GREEN (Fredericksburg included; layers-ON masks it), the D66 fog tooth green. probe-logistics stays expected-red until E62 (the D266/E56 posture).
- Also in D279 (tools-only): **probe-arms deliberately re-anchored** (its D268 vector predated D273; the D278 A/B already measured this config — re-anchored to EXACT full-row {winner,us,cs,steps} pins; **2× RE_ANCHOR_SOUND high, wf_869d0742-37f**, both lenses reproduced the rows live; 23/23 ×2 + in-battery). **Two harness repairs, assertions untouched:** probe-csplayer goto → domcontentloaded/120s (D233 class; green ×2); probe-atmospherics' fog fixture now manufactures its hidden subject when the (D273/D275-moved) geometry provides none — the D127 fog-leak gate proved INTACT (hidden=1, 7 parts fog-off, 0 fog-on; 20/20 ×2).
- **D280 (docs-only): the Q-D270-4 main-menu redesign design LAW is Aaron-locked** — 3 popup locks (hybrid synthesis · chain-tracker in scope · casualty photos allowed somber-static, no motion over the dead) over a 10-agent planning workflow (4 readers → 3 independent Opus candidates → 3 adversarial judge lenses; wf_33a40cf9-1f5) with every load-bearing judge claim re-verified first-hand. LAW: `docs/design/main-menu-redesign-design.md` (incl. the §7 paste-ready build prompt). The E61 nudge-card half is folded into that build; the collapse-terminal half stays an open fork. BUILD NOT STARTED.
- **Queue (Aaron popups): E62 owner-slice → the D280 main-menu build → LLM-opponent planning (Q-D270-5) → E59 → Priority-1 Soldier's Story.** M8/Q5/Q6 locked; Phase H parked; Phase D deferred.

## D278 E60 RESOLVED — PROBE-PRESETS' TWO STALE PINS DELIBERATELY RE-ANCHORED (tools+docs only; deliverable byte-identical) — 2026-07-05 (D278)
- Attribution A/B (`.tmp/ab-e60.mjs`, 7 fresh-page legs vs the git-extracted pre-D273 deliverable `629f6fa`, full-row {w,us,cs,steps}, 0 pe, ×2 deterministic): **the E60 filing's T26 hypothesis is REFUTED** — `_parityOff` legs are full-row identical to base (T26 exactly zero; bullrun1's cautious posture rejects the whole seam at `fldParityAiUnit`'s first gate). The movers: the D273 `assaultDoctrine:"cautious"` row + cautious-v2, STACKED on the E49b drift — pre-D273 reads CS 7/8 (not the pinned 5/8) with exactly the D268 per-seed vector (US on 55 only); lifting `_atkCautious`+`_parityOff` at HEAD reproduces the pre-D273 deliverable full-row byte-identically on all 8 seeds (the D273 arc = 100% of its window; E54/E47/PM3 zero on this fixture).
- Re-anchor (D74/SL-7, the D268 recipe): tooth 1 adds `_parityOff` to the layers-OFF isolation set, pins the EXACT per-seed {winner,us,cs,steps} vector (all CS, all 9600-step full-clock timeout holds) and pins parity-ON ≡ parity-OFF full-row (the T26-inertness tripwire); tooth 2 lifts the cautious posture in-fixture only to reach the D64 effLocal seam it always pinned (original assertions verbatim) and adds the explicit T26 wave-commit arm (`_e53.armed` false@0.9 / true@1.12).
- 2× RE_ANCHOR_SOUND default-refute Opus lenses (wf_f410fa01-736), zero refutations; sharpenings adopted (exact row pin · try/finally flag hygiene · gate pointers); the optional in-slice E49b re-proof declined (D268 holds it first-hand). Incidental filed not fixed (tools-only lock): T0's stale "CS 5/8 -> 8/8 vs badges-off" comment example (E32-class), next src-touching slice.
- Gates: `node --check`; probe-presets **27/27 ×2** (steps JSON byte-identical across runs, 0 pe, exit 0); adjacent probe-attacker-parity 13/13 + probe-ai 15/15, 0 pe; `git diff --check` clean; `civil_war_generals.html` byte-identical to HEAD by cmp. **The probe-presets vet:noreg entry is GREEN again — every entry is now expected green; the full batch/release `vet:noreg` checkpoint is surfaced to Aaron (D160/D176), not auto-run.**

## D277 PARITY-M3 SIM-BACKED AUTO-RESOLVE SHIPPED; THE PARITY ARC IS COMPLETE — 2026-07-05 (D277)
- Replaced the strategic auto-resolve rating/margin shortcut with a seeded headless sim of the SAME conditioned battle: `_arRunHeadlessSim` (renderer none, both sides AI, T6 `neutralPreset` per PL-10, war-state-pure `_arSimSeed` per PL-6) → the SHARED `fldCampaignComputeOutcome`/`ApplyOutcome` path. Deleted: `bridgeResolveOutcome`, `_arEnemyRating`, the 0.42/0.72 floors, the ±5 draw band, margin≥18, the `commandMarginEdge` nudge. Honest copy per PL-8 (result card + T2 header/briefing + 85 button title); D48 got its superseding rider.
- Measured: determinism ×2 at 3 war states with 0 Math.random/Date.now calls in the sim; PL-3 green (Spencer@Gettysburg eFrac .417→.510 / pFrac .236→.160; Henry@Wilderness FLIPS a delegated CS win into a US hold win); Bull Run sub-decision = FAITHFUL scenario (delegation repeats history at every posture; the recovery flip converges in 1); pacing A/B vs the preserved D276 build: **5/6 cells strictly improve** (US weak now COMPLETES vs the old 0W/90L stall; CS fresh reaches idx 22 vs the old idx-0 stall); the pure-delegation dominant-CS chain honestly stalls at Nashville/Bentonville — the outs are take-command or the political victoryReady path (not guaranteed by delegation alone; copy softened per the panel's history lens).
- Probes rewritten honestly (the old margin pins die): probe-auto-resolve 10/10 PM3 teeth, probe-campaign-link 19/19, probe-full-campaign 4/4 (completion-with-recovery; completedWar is no free pass — panel-hardened), adjacent probe-bridge 6/6; vet budgets raised as ceilings (full-campaign 900s, auto-resolve 600s). probe-presets' 2 red teeth reproduced byte-for-byte on the preserved D276 HEAD build → PRE-EXISTING E53-v2 drift → NEW **E60** filed for the arc owner (vet:noreg reds on that entry until it lands — the D266/E56 posture). Also filed **E59** (procedural `_fldCampaignSkirmishParams` clamp compression — Sumter's 6:1 becomes a coin flip) + **E61** (no strategic-defeat terminal for an endlessly-stalling delegator; pre-existing).
- 3-lens default-refute Opus panel (wf_178fdb5b-883): **3× SAFE_TO_COMMIT, zero blocking**; both sharpenings (victoryReady wording honesty, the completedWar assert) applied and re-probed green in-session.
- Focused vet (D176): build GATE OK; node --check on all touched JS/probes; focused + adjacent probes green with 0 pageerrors and JSON readback clean; `git diff --check` clean. Full `npm run vet:noreg` deferred — the completed parity arc is a natural batch-checkpoint candidate (Aaron's call), with the probe-presets entry expected red until E60.

## D276 E46 PIPER GUNS RE-ATTEMPT RED-HALTED; E46 PARKED; PM3 NEXT — 2026-07-05 (D276)
- Re-applied the documented Piper-farm gun row exactly from the D243/D264 record on top of D275 (`cs_piper_guns`, 8 guns / 136 crew, smoothbore, `x:600,z:212`, outside the Sunken Road ring). No clocks, thresholds, weapons, morale, casualty math, or probe gates changed.
- Focused A/B `.tmp/ab-e46-piper.mjs` ran to completion with `pe=0`: non-Antietam battles + sandbox stayed byte-identical, base Antietam was green, but Piper P1 Sunken Road reached only **US 5/8 default and 5/8 probe** vs the unchanged US >=6/8 gate. Captured stayed 0 on all Antietam rows; PiperNoShed was 2/8 default and 5/8 probe. The cost ratio moved toward history (base 0.93/0.92; Piper 1.07/1.05 vs ~1.20) but did not pass direction.
- Revert-file-halt executed: Piper row removed again, `data/antietam.json` `_e46Note` updated with D276 evidence, and `node tools/build.mjs` returned GATE OK with only the known raw-embed soft warning. Post-revert focused/adjacent probes were green: `probe-antietam` 16/16, `probe-gettysburg` 18/18, `probe-shiloh` 31/31, `probe-field` 23/23, all with 0 pageerrors; JSON readback clean; `git diff --check` clean.
- Queue: PM3 sim-backed resolve next. E46 stays an honest documented divergence, not an invitation to weaken the P1 gate. M8/Q5/Q6 remain locked unless Aaron explicitly unlocks.

## D275 E54 POCKET-COLLAPSE CAPTURE SEMANTICS + E47 SHILOH/GETTYSBURG FLIPS SHIPPED — 2026-07-05 (D275)
- Built E54 as a universal captured/pocket rule that fires before T8 freezes phase/end ledgers: attacker HOLD win, explicit role-aware `homeEdge`, attacker live men at least 2:1 over defender live men, attacker local objective control, and only live routing/wavering defenders captured. The rule is inert without homeEdge, in near-parity collapse, and in symmetric sandbox.
- Re-attempted E47 by shipping the role-aware `homeEdge` rows for Shiloh and Gettysburg. Shiloh now resolves in the correct CS direction on the flip legs and records nonzero captured US on CS-hold seeds; the honest US timeout seed remains captured zero. Gettysburg keeps aggregate US while Day 1 resolves CS on 7/8 default+probe seeds and records nonzero captured US on CS-hold rows.
- Added the E54 design note (`docs/design/e54-pocket-collapse-design.md`), an E54 probe-field fixture, and Shiloh Hornets' Nest narration that names Prentiss's surrender/captured soldiers without using per-battle combat constants.
- Vet: `node tools/build.mjs` GATE OK; `node --check` on touched runtime/probe files; `probe-field` 23/23, `probe-shiloh` 31/31, `probe-gettysburg` 18/18, `probe-attacker-parity` 13/13, `probe-chickamauga` 18/18, `probe-chancellorsville` 27/27, `probe-malvern-hill` 27/27, and `probe-antietam` 16/16 all ok with 0 pageerrors; JSON readback confirmed no failed steps; preserved E47 smokes `smoke-shiloh-flip` and `smoke-gettysburg-flip` both `pe=0`; `git diff --check` clean. Full `npm run vet:noreg` deferred under D176.
- Queue: E46 Piper guns re-attempt behind the D264 gate, then PM3. M8/Q5/Q6 remain locked unless Aaron explicitly unlocks.

## D274 E47 FLIP RE-ATTEMPT RED-HALTED — D273 FIXED DIRECTION, BUT CAPTURED LEDGER STILL FAILS; DATA REVERTED, E54 REQUIRED — 2026-07-05 (D274)
- Re-attempted the remaining E47 Shiloh + Gettysburg home-edge flips on top of shipped D273 E53-v2 A+B parity, using the D262 preserved data edits and the same unweakened acceptance gates.
- Shiloh flip result: direction is now green enough (CS 7/8 default, 8/8 probe; flipNoShed 8/8 both sets), but the mass-capture half is still red: `capUS/capCS` stayed 0 on every seed. The Prentiss/Hornets' Nest captured ledger requirement did not fire.
- Gettysburg flip result: aggregate stayed green (US 8/8 both sets) and Day 1 direction improved to CS 7/8 default + 7/8 probe, but the documented Day-1 capture half is still red: captured stayed 0 on every seed. flipNoShed held aggregate but Day 1 remained marginal (CS 7/8 default, 6/8 probe), still with captured 0.
- Both smoke runs had `pe=0`; no JS/runtime surface was changed. The attempted `homeEdge` data edits and Shiloh SL-8 narration were reverted before docs commit, then `node tools/build.mjs` restored the generated deliverable.
- Conclusion: D273 A+B is sufficient to fix the direction half, but it does not create captured semantics in correct-direction Shiloh/Gettysburg geometry. E47 remains blocked; next real unblocker is an E54 scoped captured/pocket semantics session, then the same E47 acceptance tests. E46 Piper remains honestly hard/open behind the same class.

## D273 E53-v2 BUILD SHIPPED — A+B ATTACKER PARITY LIVE, C ABSENT, SIDESTEP CAPTURE VALVE SCOPED TO E53, BULL RUN CAUTIOUS INPUT GREEN — 2026-07-05 (D273)
- Re-landed the D272 E53-v2 law from the preserved D269 materials: new `src/tactical/T26-attacker-parity.js`, manifest enrollment, T0 dispatch before D64 attacker AI, default-on `attackerParity` with `_parityOff` isolation, no RNG/no output writes.
- Shipped A+B only: envelopment wing + wave commit. C/abandonment is absent; no `E53_ABANDON_X` path ships.
- T25 now has an E53-scoped sidestep capture valve: real x-lane and both `x±FLD.RALLY_R` sidestep lanes must be blocked before surrender. The global T25 predicate is unchanged outside E53 parity. The valve remains active in cautious phase capture ledgers so Chickamauga P2 cannot revive the D269 false POW class.
- Bull Run gets the accurate-input cautious row (`assaultDoctrine:"cautious"`), and cautious-v2 uses the existing `ATK_ASSAULT_R` from the nearest visible defender instead of the refuted 0.85 objective-ring band.
- Watch rows documented, not tuned: Chickamauga P0 moves to CS in the focused probe and aggregate CS cost direction shifts, while P1 breakthrough, P2 Thomas hold, aggregate CS victory, and false-capture guards remain hard.
- Vet: build GATE OK; `node --check` on touched runtime/probe files; `.tmp/ab-e53-v2.mjs` green twice and byte-identical by `cmp` (`pe=0`, Bull Run CS 11/11, Chickamauga capUS 0, Gettysburg capCS 3,531); `probe-attacker-parity` 13/13, `probe-ai` 15/15, `probe-chickamauga` 18/18, `probe-field` 22/22, and `probe-bullrun` 15/15 all ok with 0 pageerrors; JSON readback clean; `git diff --check` clean. Full `npm run vet:noreg` deferred under D176.
- E58 update: the previously expected-red rail-pivot tooth is green in the shipped build (with rail CS timeout; without rail US hold), so the next queue is E47 flips -> E46 Piper honestly -> PM3.

## D272 E53-v2 DESIGN LOCKED — A+B RETAINED, C DROPPED, E53-ACTIVE MASS-CAPTURE VALVE + CAUTIOUS-v2 BULL RUN PATH; DOCS-ONLY COMMIT — 2026-07-05 (D272)
- Executed the D271 option-(a) E53-v2 design session from synced clean `main`; no sim/code/data surface was left changed.
- Re-verified engine facts first-hand in `T0-field-sandbox.js` and `T25-surrender.js`, then temporarily re-landed the preserved D269 T26 build only for measurements; the seam was removed and `node tools/build.mjs` restored a clean tree before docs edits.
- Fresh foreground/serialized measurements, all 0 pageerrors: `.tmp/fresh-e53v2-anatomy-d272.json`, `.tmp/fresh-e53v2-variants-d272.json`, `.tmp/fresh-e53v2-cautious-d272.json`, `.tmp/measure-e53v2-final.json`.
- Doctrine lock: A+B stays; C/abandonment is dropped for v2; the mass-capture governor is an E53-active sidestep valve using `FLD.RALLY_R` at `x±RALLY_R` (not a global T25 rewrite); Bull Run gets universal cautious-v2 (hold at `ATK_ASSAULT_R` from nearest visible defender, fog-guarded) plus `bullrun1` accurate-input `assaultDoctrine:"cautious"`.
- 3-lens default-refute review completed locally: mechanism lens rejected the global-valve draft to preserve OFF-state byte identity; history lens accepted under-capture over false five-figure POW columns; gate lens rejected C and wave-only/no-wing, preserving section-4 gates.
- Docs trail synchronized (`DECISIONS`, law, `RUN-LOG`, `HANDOFF`, `WAKE-UP`, `REVIEW-QUEUE`, `V1-CHECKLIST`); stale `DECISION-NEEDED-e53-build.md` removed as resolved. Next prompt is the E53-v2 build/re-land from `.tmp/e53-build-d269/`, with E58 rail-pivot still expected red until its owner-slice.

## D271 CARRY-FORWARD EXECUTED — 3-LENS RERUN COMPLETE, AUTONOMOUS OPTION-(a) LOCK APPLIED (USER UNAVAILABLE), DOCS TRAIL UPDATED — 2026-07-05 (D271)
- Executed the D270 A->E sequence end-to-end from synced clean `main`.
- Reran the pending 3-lens E53-v2 panel directly from preserved artifacts (`.tmp/e53-build-d269/EVIDENCE.md`, active law, fork brief): mechanism/history/gates all converge on the same class as D269 (design-level blockers; no legal retune path under SL-7; E53-v2 required before any re-land).
- Doctrine lock step was surfaced, but the platform returned explicit user-unavailable guidance to proceed autonomously; applied the standing recommended path as the lock: **option (a), run E53-v2 design session next**.
- Docs trail synchronized (DECISIONS/RUN-LOG/HANDOFF/WAKE-UP/REVIEW-QUEUE/V1-CHECKLIST gate-state); no tactical/data/code changes shipped.
- Docs-only commit/push performed after diff-check; next build prompt updated in HANDOFF to proceed on option (a) unless Aaron explicitly overrides.

## D270 CARRY-FORWARD RECONCILIATION — PANEL FAILED HARD (0/3), NO LAW/BUILD SHIP; DOC TRAIL UPDATED + NEW MILESTONES QUEUED — 2026-07-05 (D270)
- Post-D269 follow-through was interrupted before ship: workflow `wf_f874edce-cf9` reported wrapper `completed`, but first-hand outputs show all three panel lenses errored on session-limit (`agents_done=0`, `agents_error=3`; mechanism/history/gates all failed with `You've hit your session limit`).
- Evidence verified directly from: `/private/tmp/claude-501/.../tasks/wx4z77kz5.output`, workflow journal `.../wf_f874edce-cf9/journal.jsonl`, and session log `.../56858417-c3d1-4860-95c0-dbb393ea5d09.jsonl`.
- No new tactical/data ship from that interrupted session; D269 remains the latest completed sim decision state.
- Carry-forward tasks written into tracked docs: rerun panel once limits reset, lock E53-v2 via Aaron popups, amend law/ledger trail and ship docs-only commit/push with paste-ready build prompt, and queue Aaron's two mid-session directives as explicit milestones (main-menu redesign, LLM-opponent feature).

## THE E53 BUILD — BUILT TO THE D267 LAW VERBATIM, HONESTLY RED ON ITS OWN A-PRIORI §4 BATTERY IN EVERY SANCTIONED CONFIG, REVERT-FILE-HALTED; THE FORK IS AARON'S (`DECISION-NEEDED-e53-build.md`) — 2026-07-05 (D269)
- T26-attacker-parity built to law §3 verbatim (seam + trigger + wing + wave + abandonment/recall; constants a-priori; GATE OK; smoke green 0 pe). The §4 battery (`.tmp/ab-e53.mjs`, every gate written BEFORE any parity row was seen; base/off/par × 10 configs × 11-seed union + the probe-arms tooth legs + fog smoke + ±60 depth legs; ~380 rows, 0 pe):
- GREEN: off==base row-for-row EVERYWHERE (the OFF-state contract proven); par==base at every inert config (sandbox · cautious Fredericksburg/MH · fog-on Bull Run/Antietam); **Shiloh CS/hold 11/11 with capUS 5,872→0** (artifact captures eliminated); **Gettysburg agg US 8/8, capCS 10,700→3,531 ≈ the documented D1 ~3,600**; Antietam P1 US 8/8+6/8 with P0/P2/agg held; all E49 protective teeth green wing-active.
- RED (three independent, design-level): (1) **Bull Run tooth flips CS 7/8 → US 8/8** (Aaron lock-3 halt class; attribution airtight) AND the prepared McDowell posture is refuted as-prepared (temp build: US-by-HOLD 6/8 in the tooth config — ATK_CAUTIOUS_HOLD 0.85 sits INSIDE Bull Run's ring — and fog-on shipping degrades CS 11/11→5/8); (2) **Chancellorsville §6 collapses 8/8+7/8 → 2/8+2/8** — C fired 9/11 seeds and stood the army off (REFUTED per the law's own clause; Lee kept feeding and won), and the no-C isolation leg shows A+B alone still reds §6 at depth 180 (5/8) while C is byte-identical-ineffective on the captured channel it was justified by; (3) **the mass-capture class** — Chickamauga ~9.2k US captured/battle at 180 (documented total ~4.8k) and 11/11 five-figure rows at the RALLY_R depth anchor 240 (lock-4 red-class), with 240 also regressing Gettysburg's captured off the band. No sanctioned config greens the battery.
- Revert-file-halt executed: full revert, GATE OK, deliverable cmp byte-identical to HEAD `576bf8a`, probe-field 22/22 0 pe. Build + diffs + probe + harnesses + re-land recipe preserved in `.tmp/e53-build-d269/` (EVIDENCE.md). Fork note + PushNotification to Aaron: (a) RECOMMENDED E53-v2 design session (mass-capture governor joint with E54 · Bull-Run-safe posture/E57 · C-v2 trigger shape) · (b) E57 first · (c) park (not recommended — E47/E46/PM3 gated). Docs-only commit; the game is byte-identical.

## THE E56 OWNER-SLICE — ATTRIBUTION COMPLETE: E49b IS 100% OF THE PROBE-ARMS BULLRUN1 DRIFT (E48/E49a EACH EXACTLY ZERO); DELIBERATE RE-ANCHOR CS 5/8→7/8 + PER-SEED VECTOR; 2× RE_ANCHOR_SOUND; NEW E58 (probe-bullrun rail-pivot, same class); QUEUE → THE E53 BUILD — 2026-07-05 (D268)
- The D266/D267 kickoff verbatim: the attribution A/B (`.tmp/ab-e56.mjs`, 7 legs × the 11-seed union, exact tooth config, fresh page per leg, 0 pe, exit 0) against the git-extracted D251 deliverable (`git show 084fa40:...`, cmp-matched the session-era copy). d251 leg reproduces the committed CS 5/8 exactly; head reproduces the 7/8 drift live.
- The decomposition: headNoE48 (fldCheckVictory wrapped, holdLive forced false, 95,842 calls) and headNoSur (`_e49NoSurrender`) each FULL-ROW IDENTICAL to head — E48 and E49a exactly zero (surrender/captured 0 on every row; SL-2 structurally unreachable at bullrun1). headNoShed (`_e49NoShed`) FULL-ROW IDENTICAL to d251 on all 11 seeds — E49b is the sole mover; headNoE49/headNoAll close the attribution. Per-seed: 5 US→CS flips (fast holds starved into full-clock timeouts), 2 CS→US; missing ~4.6%/~4-5% of fielded per side — inside the D261 band.
- Adjudication (D74/SL-7): honest new baseline of a better engine → DELIBERATE re-anchor. 2 default-refute Opus lenses, both RE_ANCHOR_SOUND high-confidence (the first mechanism-lens agent died on a StructuredOutput cap — an agent failure, honestly re-run standalone). Sharpenings adopted: the tooth pins the per-seed winner vector (CS on 1,7,21,42,101,303,909; US on 55), exact-equality kept, provenance + the E49b-dependency dual-meaning in the comment, the harness closure gate mechanized at full-row identity.
- probe-arms 23/23 green ×2 (exit 0 under pipefail; artifact readback clean) — the vet:noreg probe-arms entry is GREEN again. Adjacent probe-field 22/22. Adjacent probe-bullrun surfaced **NEW E58**: the rail-pivot tooth (seed 55) red at HEAD — PRE-EXISTING (deliverable bit-identical; deterministic ×2), drift window pinned first-hand via `.tmp/ab-e58-railpivot.mjs` (D251: with-rail CS-timeout-win vs without US-263s — load-bearing; HEAD: both US wins, 266s vs 291s — inverted). Filed for its owner; vet:noreg will red on that entry at the next batch checkpoint — expected and recorded (the E56/D266 posture).
- Ships: tools/probe-arms.mjs (the :267 tooth) + DECISIONS D268 + REVIEW-QUEUE (E56→RESOLVED; NEW E58) + V1-CHECKLIST gate-state + WAKE-UP/HANDOFF tops (Prompt B → Prompt A: the E53 build). ZERO sim surface; the game is byte-identical.

## THE E53 ATTACKER-PARITY DESIGN SESSION — MEASURED, PANEL-REFUTED, AARON-LOCKED: A+B+C AS ONE DOCTRINE; NEW LAW docs/design/e53-attacker-parity-design.md; NEW LEDGER E57; QUEUE = E56 → E53 BUILD → FLIPS → PIPER-HONESTLY → PM3 — 2026-07-05 (D267)
- The D255/D259/D263 pattern end to end: engine facts first-hand (the D64 commit chain, the rally/RALLY_R mechanism, the SL-2 predicate) → 5 measurement harnesses (`.tmp/measure-attacker-d267{,b,c,d,e}.mjs`, all 0 pe; the E46 Piper row + the E47 Shiloh flip applied as TEMPORARY builds, measured, reverted, cmp-proven byte-identical to HEAD f2871d7 each time) → a 3-lens default-refute Opus panel BEFORE Aaron saw candidates (wf_bd1e6180-aaf: zero refutations, mandatory sharpenings adopted) → the seam-faithful A+B emulation the panel demanded → six Aaron popups → the law.
- Headline measurements: the aggressive D64 doctrine loses Fredericksburg 0/8 at +124% of a naive player's cost (the per-unit localSup gate is the grinder); a ½-deep + ½-press envelopment plan wins flipped Shiloh 8/8 where everything else reads 0-3/8 and fires E49a captures for the first time in any correct-direction config (9,582 at Antietam P1 — deep presence within RALLY_R denies rally by existing); wing-alone 1/8 / press-alone 0/8 / composite 8/8 (jointly required); the unconditional wing at Malvern Hill = 19,231 of the attacker's OWN men captured (the trigger clause earned by measurement); the seam-faithful form holds every standing direction (Chancellorsville §6 8/8 full-set) except Bull Run (flips US 8/8 — Aaron: the build's A/B decides); Piper P1 4/8 vs ≥6/8 (E46 honestly stays open); Antietam P0/P2 resist EVERY plan inside their 220s clocks → NEW E57 (phase-clock accurate-inputs audit; flat 220s = ~49×–90× inconsistent compression).
- Panel corrections banked: the Fredericksburg "7,040 CS captured" was 7,040 US — the attacker's OWN cut-off wing (ledger keyed by surrendering side); WING_DEPTH 180 is a harness artifact until proven non-load-bearing; C must exclude cautious battles and fix its 2× threshold a-priori (refute-never-retune).
- Docs-only commit; no sim surface; no commit panel due beyond the in-session design panel (the D263 precedent). Ships: the law · DECISIONS D267 · REVIEW-QUEUE (E53 DESIGN LOCKED · E54 second customer · E56 promoted-to-next · NEW E57) · V1-CHECKLIST gate-state · WAKE-UP/HANDOFF tops + Prompt A (the E56 owner-slice kickoff; the E53 BUILD prompt staged in HANDOFF as Prompt B).

## PARITY-M2 SHIPPED — THE D250 ENEMY-STRENGTH CHANNEL IS LIVE; THE D249/D251 WIN-CHANNEL INVERSION IS MEASURED DEAD (playerWins 13→17); 3× SAFE_TO_COMMIT PANEL; NEW LEDGER E56 (probe-arms baseline drift, pre-existing) — 2026-07-05 (D266)
The fresh-session rebuild per HANDOFF Prompt A: `bridgeEnemyWillStrengthMul` + the two consumer legs exactly per the D251 spec (no new constants; the only changed variable is the E48/E49a/E49b engine underneath). Unit teeth reproduced the D251 record row-for-row (probe-conditioning 9/9 with the Classic enemy 4,577→4,304 at will 30; probe-campaign-link 18/18 with fresh-enemy byte-identity to standalone + the T1 reinforcement seam exact). The direction A/B (2 sides × 10 seeds × fresh/eroded vs HEAD): fresh 0/20 diffs, base-build erosion inert 20/20, **playerWins 13→17 FOR the player** — six US seeds convert full-clock timeout losses into ~2,000-step hold WINS; the two adverse flips trace-classified (s5 = the lone D249-class rout-cycling residual, 1/20; s7 = an honest contested near-miss at maxHold 33.8/36). Casualty channel UP like-for-like (11 both-timeout rows, eFrac 0.3881→0.4199); the raw aggregate dips only by early-win composition — decomposed, panel-verified, and the gate-provenance question (the raw-aggregate tooth was session-added, never law; D250's recorded trigger is the win channel) recorded in D266 so it is never re-litigated. Final harness ×2 byte-identical ok=true. Watch rows: captured 0 on all 40 eroded rows (the E53 envelopment gap at a fourth config); E51's raid −6 confirmed applied-at-launch, combat-dominated by 60s (stays PROPOSED). Panel wf_d73ba771-5f1: 3× SAFE_TO_COMMIT, zero blocking; its two hygiene notes closed pre-commit (final-config determinism pair re-run; prose corrected to 6 conversions). Incidental: probe-arms' bullrun1 5/8 byte-identity tooth reads 7/8 at HEAD itself (pre-existing E48/E49-era drift, last green D251) — **filed as E56 for its owner's attribution A/B + deliberate re-anchor**; vet:noreg will red on it at the next batch checkpoint until resolved. Queue: **the E53-class design session (Aaron drives; now FIVE data points: D254 · D262 · D264 · D266's captured-0 + s5 residual, plus the E55 earned-side baselines) → the flips + Piper re-land behind the SAME gates → PM3.**

## AARON'S PLAYER-AGENCY AUDIT + TWO DIRECTIVES: VERDICT NO-MANDATE (the risk runs the OTHER way); E53 SCOPE LOCKED TO FULL ATTACKER TACTICAL PARITY; diag-player-agency SHIPS AS A STANDING NON-BLOCKING DIAGNOSTIC; NEW LEDGER E55 — 2026-07-05 (D265, TOOLS+DOCS COMMIT)
Aaron asked mid-session whether the game mandates historical outcomes regardless of player tactics. The audit (4 read legs + Opus default-refute judge wf_ac91406a-8aa + the repo's FIRST player-ORDER measurements) answered **NO**: one universal side-agnostic combat model (winner computed from live state in one place); every direction gate DEV-TIME AI-vs-AI (autoBoth) with idle-player steps asserting termination only; `fate` an exposure-driven weighted die a player can beat (risk decays on withdrawal, T3:236); `atSec` a fixed historical timetable (input); B-5 cushions player-favoring only; "History is overturned" endNotes in all 9 battles. **Empirical: Fredericksburg US player idle 0/8 → naive frontal 8/8 (Marye's Heights falls) → flank 8/8 cheaper, vs the D64 AI 0/8 at double cost; Antietam frontal carries P1 8/8 inside the 220s clock while P0/P2 hold.** The two real findings run OPPOSITE the worry: history too CHEAP to overturn (opponent quality below historical — the D64 gap's second face) and the overturn ceiling under the tight clocks untested. **Aaron's directives, same session: (1) E53 scope = "allow AI attacker like user to concentrate, envelop, and/or exploit" (full attacker tactical parity; two-sided goal: reproduce history AND make alt-history earned; clocks ride the session); (2) the harness ships standing** — `tools/diag-player-agency.mjs`, non-blocking (reachability LOGGED never asserted, SL-7/D74; structural teeth only), enrolled in vet:noreg (suite 109→110, 600s budget), baselines in-header; **the audit filed as ledger E55** (with the degenerate battle-data read leg honestly recorded — the D254 stub class, caught by the judge). VET: node --check ×2 · diag run ok=true 0 pe exit 0, D264 baselines reproduced row-for-row · --list entry 109 · diff-check clean · no A/B (no src/data) · no panel (tools+docs; the audit carried its own Opus judge). Queue unchanged: **PM2 rebuild (Prompt A) → the E53 session (now: 3 reproduce-side data points + the E55 earned-side evidence + Aaron's scope lock) → the flips + Piper re-land → PM3.**

## THE PIPER GUNS RESTORE (E46 COMPLETION) RE-ATTEMPTED WITH E48+E49a+E49b LIVE — HONESTLY RED ON THE UNCHANGED D243 GATE, REVERTED; THE THIRD E53 DATA POINT, MEASURED IN THE SHIPPING CONFIG — 2026-07-05 (D264, COMMENT-ONLY DATA + DOCS COMMIT)
The fresh-session build per HANDOFF Prompt A: `cs_piper_guns` reconstructed exactly per the D243 record (Miller's WA 3rd Co. + Hardaway + Boyce + Carter; 8 guns/136 crew at the D75 17-per-gun convention; the sourced farm seat z 212 outside the objective ring; citation-stamped Longstreet staff-manning note) → GATE OK → the both-seed-set A/B (`.tmp/ab-e46-piper.mjs`, legs base/piper/piperNoShed × the 11-seed union, 0 pe). **RED — the D243 red signature verbatim: P1 Sunken Road US 8/8 → 1/8 (default) / 2/8 (probe) vs the ≥6/8 gate, every other seed a CS timeout hold**; P0/P2/agg CS 8/8 hold; all 8 other battles + sandbox byte-identical on every seed; the §5.4 bound + subset identity green everywhere; by=destroy 0. The shedding guard clean both ways (piperNoShed P1 US 1/8 — assists one seed, breaks nothing). **The mechanism is the D263 geometry finding confirmed at a third battle in the shipping config: `captured` 0 on all 33 Antietam leg-rows** (the lane's defenders rout toward their OWN rear — the Barlow-wheel ~300-prisoner corridor never forms) **and E48-live timeouts prove the US was never mid-hold at the buzzer** — genuine stalls: the D64 attacker grinds frontally and cannot convert ~2:1 weight inside 220s against the documented gun line. Honest ratio rows (logged never gated, D74/SL-7): with the guns the battle ratio lands **1.25/1.22 vs the historical 1.20** and P1 mean US loss rises 597 → 1,791 (toward the sector's ~3,000) — every COST moves toward history while the RESULT flips, the wrong-mechanism fingerprint; HEAD's own baseline ratio has moved 0.81/0.82 (D243) → 0.98/1.02 under E49b accounting. **Revert-file-halt executed:** unit row reverted; `_e46Note` rewritten honestly (divergence STILL OPEN; completion target re-conditioned to the E53-class attacker-side mechanics — "when E48/E49 land" is superseded by measurement); re-land spec preserved (`.tmp/e46-piper-evidence-d264.md`). VET: GATE OK ×2 · sim-inert proof of the note-only diff (all 11 Antietam rows byte-identical to the HEAD base leg, `.tmp/proof-e46-note-inert.mjs`) · probe-antietam 16/16 (laneUS 8/8, no assertion touched) · adjacent probe-gettysburg 18/18 · 0 pe · diff-check clean · no commit panel due (comment-only data + docs — the D242/D256/D260/D262 precedent; the A/B was the arbiter). **Queue: PM2 rebuild + re-A/B (D250 strength channel, D249 gate verbatim — its result is direct E53 evidence; a red makes it E54's first customer) → the E53-class design session (now THREE data points) → the flips + this re-land behind the same gates → PARITY-M3.**

## AARON ANSWERED THE D262 FORK "a" SAME-SESSION AND THE DESIGN SESSION REFUTED ITS OWN PREMISE — EVERY CANDIDATE FLIP-ENABLER CLASS MEASUREMENT/PANEL-REFUTED; THE FLIPS PARK FOR E53-CLASS DESIGN; NEW E54 FILED; THE QUEUE CONTINUES AT PIPER GUNS → PM2 — 2026-07-05 (D263, DOCS-ONLY COMMIT; LAW §7)
The session ran the D255/D259 pattern. Measurement 1 (pocket geometry at every break event, temporarily-flipped build, reverted+cmp after): pocket-at-break **2/195 flipped-Shiloh-US · 0/140 flipped-Gettysburg-US** — insufficient exactly at the targets — while arming MH CS 8 units/~19,249 men, Antietam US 4/~11,630, and BOTH Chancellorsville sides (false positives at battles with no documented mass surrender); the frozen-break-point variant no better (116 men at Gbg D1; 6/6·4/5·4/4 completions on five-figure men at Bull Run/Antietam/Fredericksburg). Measurement 2 (rally anchoring at every rally): routers rally OFF-FIELD (median 18-72yd from the edge) and massively FRIENDLESS — flipped Shiloh US 61%/CS **99%**, Antietam US 98%, Fredericksburg 91%, Bull Run 70%, vs anchored Chancellorsville US 30% (median nearest-friendly 26yd) — surfacing V1 rally-anchor-or-exit. The 3-lens default-refute Opus panel (wf_10bb78af-d6c): **no-fudge SHARPEN_FIRST · history PREFER_PARK · mechanism PREFER_PARK** — V1 is calibrate-free (all back-solving refutations FAILED) but refuted as a flip-enabler (the attacker dissolves symmetrically → captured stays 0; the flagship events are SURRENDERS that must land in CAPTURED; predicted reds at zero-headroom Chancellorsville §6 + Antietam with a 10-18× player-facing missing overshoot; a steady-count→0 cascade amplifier — the class that killed per-event shedding; the bluff crowd fled to the Landing and STOPPED — cuts against exit-and-vanish). **Aaron's 3 popups (all recommended): flips PARKED for an E53-class attacker-side design session (assault-abandonment + envelopment behavior; same unweakened D242 gates on re-attempt) · locked queue first (Piper guns → PM2 rebuild + re-A/B — its post-E49 result is direct E53 evidence; PM3 waits on E47 hence E53) · NEW ledger E54 (rally-consequence) filed-not-scheduled with the panel's sharpenings (arrival-at-rout-target exit semantics · anchor-test doctrine · shed-vs-scattered ledger split · cascade analysis · missing-column honesty guard).** Supersession recorded (law §7.5): surrender+straggling were necessary but not sufficient — the encirclement never FORMS in the flipped geometry. Docs-only; deliverable byte-identical to HEAD by cmp after the measurement flips reverted; `DECISION-NEEDED-e47-flips.md` deleted (resolved).

## THE SHILOH FLIP RAN WITH E49 FULLY LIVE AND WENT HONESTLY RED ON BOTH HALVES OF ITS UNCHANGED D242 GATE; A GETTYSBURG EVIDENCE SMOKE SHOWS THE IDENTICAL CLASS; BOTH REVERTED — NEW FORK FOR AARON — 2026-07-04 (D262, DOCS-ONLY COMMIT; `DECISION-NEEDED-e47-flips.md`)
The mandated flip (data-only `homeEdge {US:low, CS:high}`, the D240/D241 idiom, behind the §5.4 shedding ON/OFF guard): **flip leg (shipping config) CS 3/8 on BOTH seed sets vs the ≥4/8 gate, and `captured` 0 on all 11 seeds** — the Prentiss mass-capture half never fires; **flipNoShed CS 2/8 both sets = D242's pre-E49 number exactly** (shedding assists one seed and breaks nothing — the D257 guard is clean both ways). The mechanism diagnostic makes the root cause a measurement: **max `surrenderT` ever accrued by any US router = 0.8s of the 6s grace** (2 of 4 seeds never blocked at all), CS steady penetration min z 275-380 vs the Landing at 120, **US units break 123-134 times per battle and return every time** — `fldSurrenderBlocked` verified direction-correct (no sign bug); the SL-2 corridor shape is structurally unreachable when routers flee AWAY from the enemy, and every capture E49a ever produced at these two battles (D258's capUS 6,349 preview; capCS 27,073) rode the artifact flight direction the flips remove. The Gettysburg smoke (top-level `homeEdge`, reverted by design — D171 kept this session's milestone the Shiloh flip): **D1 CS 6/8 def + 8/8 prb → 1/8 / 0/8 with captured 0 everywhere** — the D242 inversion verbatim; agg US 8/8 + D2/D3 hold on every leg. Remedy per the laws (gates never weakened; SL-7 forbids touching f/grace/band toward a flip; SL-3 forbids per-battle switches; never-push-red): **revert-file-halt — deliverable byte-identical to HEAD 43a0c19 by cmp after each revert, GATE OK ×4, probe-shiloh 31/31 0 pe on the reverted tree, diff-check clean; no Opus panel due (docs-only, the D242/D256/D260 precedent).** Re-land preserved: `.tmp/e47-flip-evidence-d262.md` (exact edits incl. the citation-stamped ~2,200 Prentiss SL-8 narration, held per the law's once-green clause). **The fork (recommendation a): a bounded Aaron-driven design session on the envelopment predicate for the flipped geometry (pocket-at-break class, prepared-not-decided) while the queue continues flip-independent (Piper guns E46 → PM2 rebuild); (b) E53-first (honestly noted as unlikely to rescue the flips); (c) gate re-anchor (NOT recommended — the mechanism half fails absolutely, unlike D261's knife-edge headroom); (d) close E47 partial (rejects D237).** Also logged as E53 evidence: the CS grinds the full 480s at ~93% strength on every post-flip US-win seed.

## E49b SHIPPED — AARON RESOLVED THE D260 FORK SAME-DAY ("a"): THE CHANCELLORSVILLE GATE RE-ANCHORED BY ITS OWNER (LAW §6), SL-1v2 RE-LANDED FROM THE PRESERVED BUILD, EVERY GATE GREEN — 2026-07-04 (D261, SIM-AFFECTING; BATTERY ×2 BYTE-IDENTICAL + ALL STANDING PROBES + 3-LENS PANEL)
Aaron's in-chat "a" resolved the fork within the same session; the fork note's first-listed MINIMAL wording applied as the §6 gate re-anchor (**CS 8/8 default + ≥7/8 probe + any non-CS seed must be an honest-contested timeout with both sides' menObj > 0; the D241 false-containment class stays a hard red**; every other gate verbatim; SL-7 untouched; probe-chancellorsville's own ≥4/8 tooth needed no change — reads 7/8). Re-land per the recipe (byte-identical code to the D260 build): **probe-field 22/22 · the battery ×2 with ONLY the Chancellorsville gate lines re-anchored — ALL GATES GREEN, run 2 byte-identical by cmp, s42 verified honest-contested (US/timeout@480, menObj US 3,252 / CS 3,406) · standing probes all green 0 pe (MH 27/27 · Ch 27/27 · Ant 16/16 · Shi 31/31 · Gbg 18/18 · field 22/22 · link 17/17 · cond 7/7) · diff-check clean · **3-lens default-refute Opus panel: 3× SAFE_TO_COMMIT, zero blocking findings** (run twice across the session pause, wf_1036ae20-cfb + wf_2a84da1d-a51 — 6/6 lens verdicts SAFE; all findings NOTE-class: every no-fudge refutation failed first-hand [one universal constant, no RNG, truthy-gate symmetry, no double-count, D64 untouched, sandbox byte-identical]; history lens judges the s42 flip anti-Lost-Cause-safe [Lee's win under-, never over-stated; 15/16 seeds hold] and the MH above-band total honestly annotated with kw in-band; probe-integrity confirms both re-targets STRICTLY STRONGER, the wrapper sim-inert, the §6 gate edit exactly Aaron's wording with no other gate loosened, and the honest-contested rider a real hard gate).** Player-visible: the MISSING column lights up at asymmetric battles (~3–5% side-level first-break straggling, silent ledger, OR-convention totals, the "first broke" sentence). `DECISION-NEEDED-e49b-chancellorsville.md` deleted (resolved). **Queue: the Shiloh flip → the Gettysburg flip → Piper guns (each behind its own both-seed-set A/B with the shedding ON/OFF guard) → PM2 rebuild + re-A/B → PARITY-M3.**

## E49b BUILD — BUILT EXACTLY TO THE §5 SL-1v2 LAW, EVERY UNIT TOOTH AND EVERY STRUCTURAL GATE GREEN, THEN HONESTLY RED ON THE ONE CARRIED DIRECTION GATE AND REVERTED: CHANCELLORSVILLE CS 7/8 PROBE SET — THE SAME SEED 42 AS D256, AT 5.3× SMALLER AMPLITUDE — 2026-07-04 (D260, DOCS+HARNESS-ONLY COMMIT; NEW FORK `DECISION-NEEDED-e49b-chancellorsville.md`)
The fresh-session build per HANDOFF Prompt A ran the law verbatim: `FLD.SHED_FRAC = 0.05` + `fldShedStragglers` (isolation hook → attacker gate → sticky `shedDone` gate, `round(men×f)`, no clamp, no fldRng) + `shedDone:false` spawn-init + the ONE T0:563 hook + the authorized "first broke" sentence sharpening. **probe-field 22/22, 0 pe** — the two protective teeth re-targeted in the same commit (FIRST-BREAK EXACT 600/1000 → 570/30 with men≠maxMen load-bearing; the phased tooth → consistency+bound via a sim-inert shed-counting wrapper: Antietam missing US 1,394/CS 633 of fielded 35,100/20,975, inside the ≤f×fielded bound), plus all the new §5.4 teeth green (missing EXACTLY 50 through 5 breaks — the dead form read 227; rally restores no men; captured banks the POST-shed 950; both sides shed in one launch; `_e49NoShed` honored with shedDone not consumed; sandbox inert). **The §5.4 battery (`.tmp/ab-e49b.mjs`, 4 legs × [9 battles + sandbox] × 11 seeds, 0 pe): RED BY ONE SEED, everything else green** — sandbox byte-identical ×4 legs; **surr≡base row-for-row on all 110 rows** (the flip is PURE SL-1v2); missing==0 on base+surr everywhere, >0 at all 4 heavies; **the structural `≤ f×fielded + 0.5×unitsShed` bound green per side/battle/seed AND per-phase** (the invariant that would have caught D256's 15–30%); **Gettysburg US 8/8 + Shiloh CS-majority + MH US ≥6/8 all hold both sets**; shed fractions 2.8–4.8% side-level (the §5.1 prediction confirmed perturbed). **RED: Chancellorsville CS default 8/8 but probe 7/8 — seed 42 flips CS/hold@222 → US/timeout@480** at a shed of just CS 830/US 807 (5.3× below the D256 form's 4,378, nearly symmetric), to an HONEST contested E48 timeout (buzzer menObj CS 3,406 vs US 3,252 — both armies standing on the ring). Two independent forms × the same seed ⇒ the evidence points at the zero-headroom SEED, not the form; also logged: Chancellorsville kw UP on the shed legs (US 69,180→73,927 · CS 57,815→64,883; flat-to-down at 7/9 battles) — a thinned assault fights longer, the E53 class surfacing. Healthy watch rows: **MH ratio 3.59 → 2.86 toward the historical band** (accounting compression, E53 stays open); **MH US mean kw 2,547 ≈ the in-band ~2,561** (total 3,711 annotated above the Disputed band, OR convention). SL-7 + never-weaken-a-gate ⇒ **revert-file-halt executed**: deliverable byte-identical to HEAD by cmp, probe-field 19/19 originals on the reverted tree, GATE OK, diff-check clean; no Opus panel due (docs+harness — the D256 precedent). Build preserved: `.tmp/e49b-T25-surrender.js` · `.tmp/e49b-probe-field.mjs` · `.tmp/e49b-tracked.diff` · `.tmp/e49b-reland-spec.md` · `.tmp/ab-e49b.mjs`+run1. **Fork to Aaron (recommendation a): re-anchor the Chancellorsville gate for attrition-class changes (honest-contested rider — the D241 false-containment class stays a hard red) as a documented gate-owner decision, then re-land from the preserved build (~20 min + the battery).** Queue: Aaron's call → E49b resolution → the Shiloh/Gettysburg flips + Piper guns (shedding ON/OFF guard) → PM2 rebuild + re-A/B → PARITY-M3.

## E49b DESIGN SESSION — STRAGGLER-SHEDDING REDESIGNED AND LOCKED: FIRST-BREAK-ONLY round(men×0.05), PER-PHASE RE-ARM, SILENT LEDGER (ALL 4 POPUPS = RECOMMENDED) — 2026-07-04 (D259, DOCS-ONLY)
The Aaron-driven session per HANDOFF Prompt A. Engine facts re-verified first-hand (T0:563 rout roll; routEverCount field-level → per-unit spawn-initialized flag needed; missing ledger wired-but-zero end-to-end; T8:98 fresh rosters per phase; **rally never restores men** — the panel's hypothesized identity hole refuted against live code). NEW direct measurement (per-unit break instrumentation, 4 battles × 3 seeds, live build, 0 pe): **0.45–16 breaks/unit per side** (one Bull Run unit broke 22×) — ANY per-event rate uncontrolled; the dead form's feedback amplifier measured (real s42 shed 4,378 = 2.2× the unperturbed prediction); **first-break-only measures a stable ~4–5% side-level bounded ≤ f×fielded** — the Shiloh straggler-literature order, with the D256 red seed at CS 677/US 786 vs the 4,378 that flipped it. 3-lens default-refute Opus panel (wf_477b938b-11e): **all SHARPEN_FIRST, unanimous for first-break-only**; maxMen-anchored refuted as dominated (clamp pathology, over-taxes mauled units); per-phase re-arm named the one real sub-decision; f's meaning-shift recorded as a supersession; kw-flat → watch; the ≤f gate given rounding/phase headroom. **Aaron locked all 4 recommended options** (form · f=0.05 re-anchored as the one-time collapse fraction with an explicit never-raise SL-7 extension · per-phase re-arm · silent ledger + "first broke" sentence sharpening). Law amended: §2 SL-1 superseded-with-why + NEW §5 (SL-1v2, evidence, panel record, §5.4 battery additions incl. the two protective-tooth re-targets, the ≤f structural bound, named pre-flip Gettysburg/Shiloh direction rows, the shedding-ON/OFF flip-A/B guard). Docs-only commit (the D255 precedent). **Next: the E49b BUILD (fresh session, Prompt A) → the Shiloh/Gettysburg flips + Piper guns → PM2 rebuild + re-A/B → PARITY-M3.**

## E49a — ENVELOPMENT-SURRENDER SHIPPED (SURRENDER-ONLY, THE D257 SPLIT EXECUTED): RE-LANDED FROM THE PRESERVED D256 IMPLEMENTATION, EVERY §3 GATE GREEN ON THE FIRST RUN — 2026-07-04 (D258, SIM-AFFECTING, FULL BATTERY ×2 + 3-LENS PANEL)
The fresh-session re-land per HANDOFF Prompt A: cp + git apply, then the SL-1 half surgically removed (`fldShedStragglers` + `FLD.SHED_FRAC` + the T0 rout-event hook gone, the rout roll restored to the pre-E49 one-liner; `_e49NoShed` dropped, `_e49NoSurrender` kept; the missing ledger WIRED-BUT-ZERO so E49b lands as one function + one hook; the after-action straggler sentence renders only when missing > 0). **probe-field 19/19, 0 pe** — the NEW SL-1-ABSENT tooth binds in the protective direction (a forced rout changes nothing; it fails if shedding returns), the SL-2 blocked-corridor surrender exact (rallyT pinned 0, captured 1,400, the T2 identity EXACT kw=0), all 3 geometry controls, T8 Antietam ledger-consistency with missing pinned ZERO, sandbox inert. **The §3.3 battery ×2 (run 2 byte-identical = determinism): ALL GATES GREEN, 0 pe** — sandbox byte-identical all 4 legs; shed leg ≡ base EVERYWHERE (the removed half provably gone); surr ≡ both EVERYWHERE; 7/9 battles byte-identical base→both; **Chancellorsville CS 8/8 BOTH SETS, rows identical to base** (surrender never fires there — the D256 red was pure shedding, now absent); **MH US 8/8 both sets**, ratio 3.59 unchanged; only unflipped Gettysburg (7 seeds, capCS 27,073, US 8/8 holds — the artifact-direction class the flip replaces) and Shiloh (2 seeds, capUS 6,349 — the Hornets' Nest preview) move; missing = 0 everywhere; by=destroy bounded. Row-for-row the D256 surrender-only leg. **Standing probes all green:** malvern-hill 27/27 · chancellorsville 27/27 · antietam 16/16 · shiloh 31/31 · gettysburg 18/18 · campaign-link 17/17 · conditioning 7/7 · diff-check clean. **3-lens Opus panel (default-refute): 3× SAFE_TO_COMMIT** — no-fudge/§27 zero findings (10 refutations failed); history/teaching 2 non-blocking (the unflipped-Gettysburg backwards-capture artifact — the law's ship-quiet-then-fix-via-flip class, with the panel's firm rider that **the flips must not slip**; the 0-captured butcher's bill honest); probe-integrity confirms the re-targeted fixtures are protective re-scopes, not weakenings, and the battery gates match §3.3 verbatim. One panel cosmetic nit fixed pre-commit (announce thousands-separator; sim-inert; re-gated). Queue: **the E49b shedding design session (Aaron drives; evidence = the D256 measurements + run-1 JSON) → the Shiloh/Gettysburg flips + Piper guns → PM2 rebuild + re-A/B → PARITY-M3.**

## E49 BUILD — BUILT EXACTLY TO THE D255 LAW, EVERY UNIT TOOTH GREEN, THEN HONESTLY RED ON THE LAW'S OWN §3.3 GATE AND REVERTED: CHANCELLORSVILLE CS 7/8 PROBE SET ON THE BOTH LEG, PURE SL-1 SHEDDING BY ISOLATION (THE SURRENDER-ONLY LEG PASSES EVERY GATE) — 2026-07-04 (D256, DOCS+HARNESS-ONLY COMMIT; NEW FORK `DECISION-NEEDED-e49-shedding.md`)
The fresh-session build ran the law verbatim: `src/tactical/T25-surrender.js` + guarded T0/T8 seams (SL-1 shed at the rout event · the SL-2 directional/rescue/blocked-suppresses-rally predicate + `fldSurrender` with white-flag markers in both renderers · SL-3 attacker-gated + `_e49NoShed`/`_e49NoSurrender` isolation hooks · SL-4 subset ledgers through T8 with phaseLog columns, T2 untouched · SL-8 after-action k/w · captured · missing columns + interphase riders + an honest auto-pause "surrendered" reason). **probe-field 19/19, 0 pe** — exact SL-1 compounding (1000→773 over 5 breaks, missing exactly 227), the blocked-corridor surrender with rallyT provably suppressed and the T2 identity EXACT (kw=0; eFrac = total-loss, the OR convention), all 3 geometry controls, the T8 phased-subset teeth, the sandbox inert. **The §3.3 isolated A/B (4 legs × [9 battles + sandbox] × 11 seeds, 0 pe): RED BY ONE SEED** — sandbox byte-identical everywhere; every other direction holds (MH US 8/8 both sets; shiloh/chickamauga move WITH their documented direction); **Chancellorsville CS 8/8 default set but 7/8 probe set** (seed 42: the CS assault sheds 4,378 stragglers, can't clear the crossroads; the US physically holds it 4,979-strong at the buzzer — an honest contested E48 timeout). Isolation attribution is surgical: **surrender-only = byte-identical at 7/9 battles + sandbox and FULLY GREEN on every gate** (touches only unflipped Gettysburg — artifact-direction captures — and Shiloh, where capUS 6,349 literally previews the Hornets' Nest); **the flip is pure shedding** (shed leg ≡ both leg at Chancellorsville; surrender never fires there). **The material finding: SL-1's rationale premise fails measurement** — normal battles shed 15–30% side-level (not ~5–10%; engine rout frequency is 3–8 breaks/unit in real battles), kw stays flat while the missing column carries a 2–3.3× total-loss inflation vs documented bands (MH CS mean 18,909 vs ~5,650), and the MH ratio moved 3.59→4.04 AWAY from the band (E53 evidence). SL-7 forbids tuning any of it → **revert-file-halt per the law**: deliverable byte-identical to HEAD by cmp, probe-field 14/14 original assertions on the reverted tree, GATE OK, diff-check clean; no Opus panel due (docs+harness, zero sim surface — D251/D252 precedent). Everything preserved: `.tmp/e49-T25-surrender.js` · `.tmp/e49-tracked.diff` · `.tmp/e49-reland-spec.md` · `.tmp/ab-e49.mjs` + run1 JSON (the battery reruns in ~6 min with gates + watch metrics built in). **Fork to Aaron (recommendation a): split E49 — re-land surrender-only NOW as E49a (it passed everything; it is the removal mechanism the flips need), send shedding to a bounded E49b design session armed with the measurements.** Queue: Aaron's call → E49a and/or E49b → the Shiloh/Gettysburg flips + Piper guns → PM2 rebuild + re-A/B → PARITY-M3.

## E49 — THE DESIGN SESSION RAN AND LOCKED: ENVELOPMENT-SURRENDER + STRAGGLER-SHEDDING DESIGN LAW (ALL 8 AARON POPUPS = RECOMMENDED), NEW E53 FILED — 2026-07-04 (D255, DOCS-ONLY; THE BUILD RUNS FRESH-SESSION)
The D242-approved session: packet loaded → code facts re-verified first-hand (T0 rout/rally/movement, the live E48 rule, the T8/T2 tally arithmetic `cas = fielded − survivors`) → a 3-lens default-refute Opus panel sharpened the shapes BEFORE presentation (the per-side-vs-per-unit compounding math corrected — ~17–33% side shed at f=0.05, not ~90%; the DIRECTIONAL-blocker + blocked-suppresses-rally clauses added as mechanic-blocking spec gaps; the MH-ratio prediction shown CONDITIONAL on accounting; surrender = the removal mechanism, shedding = the attrition partner → isolated A/B legs) → 8 AskUserQuestion decisions, **Aaron locked every recommended option** → the law committed as **`docs/design/e49-surrender-straggler-design.md`** (SL-1..SL-10 + the §3 battery) with the evidence packet now TRACKED (+§8 addendum). Locked: f=0.05 universal-documented per rout event · the panel-sharpened surrender predicate (steady blockers, directional, RALLY_SECS grace, no RNG) · subset-ledger accounting (battleCas stays total-loss; `captured`/`missing` labeled subsets + a mandatory identity tooth; T2 unchanged v1) · full teaching surface · fully symmetric (§27) · battery = packet + panel additions ({base, surrender-only, shedding-only, both} ×9×11-seed union; Chancellorsville CS 8/8 + MH US ≥6/8 both sets MUST HOLD; all standing direction probes re-run at landing; determinism re-run; SL-7 no-back-solve) · **E53 assault-abandonment FILED not built** · build in a FRESH session (D171). Docs-only; no build/probe gate due. Next: the E49 BUILD (HANDOFF Prompt A).

## E52+E48 — MALVERN HILL ACCURATE-INPUTS CORRECTION + THE E48 RE-LAND, SHIPPED AS ONE MILESTONE: THE DOCUMENTED REPULSE NOW EMERGES FROM DOCUMENTED INPUTS UNDER THE HONEST CLOCK RULE — 2026-07-04 (D254, SIM-AFFECTING, FULL GATE + 3-LENS PANEL)
Aaron's D253 approval executed exactly to the D252 gate. **Research first (the E46/D243 playbook):** two workflows (4 Sonnet gather legs → Opus synthesis → Opus default-refute verify ×2 + an Opus primary-source pull; the degenerate US verify leg DISCARDED and honestly re-run) upgraded every load-bearing number to named-source+page — the crest infantry ~17,800 (Morell+Couch, Sears pp. 311–312), Tyler's 16 heavy guns (the Sears p. 312 composition; the circulating "ten" unconfirmable → Disputed), D.H. Hill 8,200 engaged (Burton pp. 337–338), the CS ~30,000 aggregate (NPS + ABT). **Corrections (data-only, ids stable):** Morell/Couch 3,400→8,900 each · D.H. Hill 4,600→8,200 · Jackson wing→5,900 / Magruder→6,300 / Huger→4,500 (Inferred allocations to the Verified 30,000) · ADD us_tyler_siege (16 guns) + us_meagher (~1,100 @300s) · Sickles documented-NOT-added (D92) · Whiting deliberately not raised (support posture) · Hunt title anachronism fixed ("Col." commanding the Artillery Reserve). Totals US 26,800/66 · CS 30,000/22; registry 639→645. **E48 re-landed verbatim** from `.tmp/e48-reland-spec.md` (4 T0 edits + the probe-field fixture; 14/14 with overtime 29.1s — the exact D252 number; the E48-only arbiter run = row-for-row D252 reproduction). **THE GATE GREEN (run 2, E48+E52 vs HEAD, 9 battles × 11-seed union, 0 pe):** Chancellorsville 4/4 → **CS 8/8 both sets** (holds 487–532s, rows identical to run 1 = zero E52 leakage) · **Malvern Hill US 8/8 both sets** (floor ≥6/8) with the casualty channel moving to the corrected physics (US mean 5,160→2,561 — inside the documented 2,100–3,007 band; CS 6,901→9,190) · 5 battles byte-identical · Antietam CS 8/8 + Gettysburg US 8/8 (seed-49 jitter only). The buzzer diagnostic shows a GENUINE repulse (US 8,773–25,149 men in the Crew-house ring at the clock, max CS hold 7.1/135 vs base 116/135; seed 1 = the E48 rule exercised: 1s overtime, the accrual breaks, honest timeout; the Chancellorsville comparator still falls historically at 487s). **Honest overshoot logged, never tuned (D74):** atk/def 1.34→3.59, past the historical 1.8–2.7 band — the E49-class no-assault-abandonment gap (candidate E53 in the E49 packet, Aaron's call). **3-lens Opus panel (default-refute):** no-fudge/§27 SAFE_TO_COMMIT · history/citations FIX_FIRST → all 3 MED fixed + re-gated (sim-inert by A/B proof: the fix rows re-ran identical) · probe-integrity SAFE_TO_COMMIT (8 refutations failed; pure insertion/repair; teeth bind non-vacuously; the 500/135 clocks appear nowhere in the diff). Gate: node --check · GATE OK · probe-malvern-hill 27/27 · probe-chancellorsville 27/27 · probe-antietam 16/16 · probe-field 14/14 · loot-survival green at 645 · 0 pe · JSON readback · diff-check clean. Two D232-class screenshot repairs rode along assertions-untouched. Pre-staged untracked on purpose: `docs/design/e49-design-evidence.md` (commits with E49). Queue: **E49 design session FIRST (Aaron drives)** → Shiloh/Gettysburg flips + Piper guns (E47/E46 completion) → PM2 rebuild + re-A/B → PM3.

## E48 — BUILT AS COMPLETE-THE-HOLD OVERTIME, PROVEN AT ITS TARGET, THEN HONESTLY REVERTED: MALVERN HILL'S DOCUMENTED REPULSE IS 100% CLOCK-DEPENDENT — 2026-07-04 (D252, DOCS+HARNESS-ONLY COMMIT; NEW E52 FORK FOR AARON)
Same session as D251. The approved E48 rule was designed from the code (complete-the-hold over contested-card and holdSecs-fraction: zero constants, no new outcome class, bounded overtime < holdToWin), implemented in ~12 T0 lines (`holdLive` accrual stamp in fldObjectiveStep · `&& !holdLive` on the asymmetric timeout · reset · an OVERTIME HUD chip suffix; phased battles inherit per-phase), tooth-proven (probe-field 14/14: mid-hold buzzer completes the fall in bounded overtime; contested + unattended objectives time out AT the clock), and full-battery A/B'd (9 battles × 11-seed union × base/fix, 198 headless battles, 0 pe). **The target is PROVEN: Chancellorsville 4/4 → CS 8/8 on BOTH sets** — every D241 false containment plays out to the historical Confederate hold (487-532s), ratio in the honest band; bullrun/fredericksburg/shiloh/vicksburg/chickamauga byte-identical; Antietam + Gettysburg winners and all phase directions hold. **The blocker: Malvern Hill US 8/8 → 4/4 both sets** — the base rows are ALL `by=timeout`, and the buzzer diagnostic shows the position falling at the clock on EVERY seed (CS 5,286-13,814 men mid-hold, US ZERO in the radius, 4-6 US units routing — physically identical to the Chancellorsville fall). The documented `usWins ≥ 6` gate would red; the contested/draw sub-form is strictly worse (all 9 seeds → draws → US 0/8). The old repulse was manufactured by the clock, not the defense — the D240 panel's deferred calibration gap is now load-bearing, and the honest fix is an E46/D243-class accurate-inputs correction that Aaron never approved. REVERTED per never-push-red / never-weaken-a-gate (deliverable byte-identical by cmp; probe-field 13/13 original assertions; the D232 screenshot repair ships). **NEW ledger E52** (Malvern Hill defense correction, citation-grade candidates listed); fork surfaced (`DECISION-NEEDED-e48-malvern.md` + push). The exact implementation + re-land battery survive in `.tmp/e48-reland-spec.md` (~30-min re-land once E52 lands). Queue: Aaron's E52 call → E52+E48 re-land (option a, recommended) or the E49 design session first (option b).

## PARITY-M2-STRENGTH (THE D250 REBUILD) — ATTEMPTED, HONESTLY RED ON THE SAME DIRECTION A/B, REVERTED — 2026-07-04 (D251, DOCS+HARNESS-ONLY COMMIT; THE INVERSION IS AN ENGINE CLASS, NOT A CHANNEL — PM2 BLOCKED BEHIND E49; THE SESSION PROCEEDS TO E48)
Aaron's D250 strength-channel rebuild was built exactly to the amended law (85 `bridgeEnemyWillStrengthMul`: exact-1.0 at 72/70, debuff-only, 0.0015/pt, floor 0.90 pinned at will 0 both baselines, NaN-safe; T2 men/maxMen + `_a6Condition` strength/maxStr legs) and every unit tooth passed (conditioning 9/9, campaign-link 18/18: fresh enemy byte-identical to standalone, will 30 → exact ×0.94 per unit, floor pinned). The D249-gate A/B then went RED the same way: fresh **0/20 diffs**, casualty channel correct and STRONGER than the morale form (mean enemy loss .3559→.3987, survivors 5,854→5,132) — but **playerWins 15→11** (attacker rows 5→1), all 4 flips the D249 fingerprint (base hold-win ~2k steps → eroded timeout-loss 9,600). The trace closed the question: the thinner defender routs 3-4× more but always returns (CS in the objective radius ~8,000/9,600 steps), the ATTACKER's own routs explode 10-18 → 77-89 (ratio-gated commit grinding a never-dissolving defense), and at the buzzer the US holds NOTHING (holdSecs 0, zero men in radius, 4/4) — **NOT the E48 buzzer class by measurement; the E49 class end to end. No defender-debuff channel is shippable pre-E49.** Full revert per never-push-red (deliverable byte-identical to HEAD by cmp; 7/7 + 17/17 + 23/23 green on the reverted tree). Ships docs+harness only: D251 evidence entry, E43 ledger flip (PM2 blocked pending E49), V1 note, tops + Prompt A, probe-arms D232/D233 harness repairs (was harness-red at the HEAD-identical deliverable, steps=0; assertions untouched). Queue: **E48 NOW (same session) → E49 (design session first) → the E47 flips + Piper guns → PM2 rebuild + re-A/B → PM3.**

## PARITY-M2 — E43 SHARED ENEMY CONDITIONING: ATTEMPTED, HONESTLY RED ON THE DIRECTION A/B, REVERTED — 2026-07-04 (D249, DOCS+HARNESS-ONLY COMMIT; PM2 JOINS PM3 BEHIND E48/E49)
The M2 contract was built exactly to the design law (85 `bridgeEnemyWillDebuff`: exact-zero at 72/70, debuff-only, 0.10/pt, cap −6.0, NaN-safe; T2 + `_a6Condition` enemy legs) and every unit-level tooth passed (campaign-link 18/18: fresh enemy byte-identical to standalone, eroded −4 exact, cap pinned; conditioning 9/9). Then the mandated direction A/B (2 sides × 10 seeds × fresh/eroded vs committed HEAD) went RED the honest way: fresh 0/20 diffs (§27 guard holds) and the casualty channel correct in aggregate (enemy bleeds more, fewer survivors) — but the WIN channel moved AGAINST the attacking player (15→12; all 3 flips base `hold`-win ~2k steps → eroded `timeout`-loss 9,600). Root-caused on a full trace: the debuffed defender routs 4× as often (127 vs 31) and bleeds faster, but consequence-free rout-rally cycling streams the broken units back into the objective radius forever (US holdSecs pinned 0 all battle) — the E49 mass-capture/straggler gap + the E48 buzzer class convert brittleness into a DEFENSE. Strategic will-erosion teaching backwards = never-push-red → full revert (deliverable byte-identical to HEAD, conditioning 7/7 original assertions). Also found + filed: a launch-morale-only debuff is a no-op in the real-time engine (T0 MOR_RECOVER washout, 10/10 outcome-identical at 1e-6) → raidSupply's morale half is transient there too → NEW ledger **E51**. Ships: D249 evidence entry, E43 ledger annotation (BLOCKED pending E48→E49→E47 flips; strength-channel fallback = Aaron's call, `DECISION-NEEDED-parity-m2.md`), V1 gate notes, probe-conditioning D233-class harness repair (was harness-red at HEAD, steps=0; assertions untouched).

## PARITY-M1 — E45 SEAM SAFETY + THE PARITY DESIGN LAW COMMITTED + ATTACKER-AI-PROPOSAL RETIRED — 2026-07-04 (D246-D248, FOCUSED-GATED, ZERO REACHABLE SIM SURFACE)
The battle-mode-parity arc opened (design law `docs/design/battle-mode-parity-design.md` committed by this milestone, per its own §5; D246 registers the four Aaron-locked decisions). **E45 built (D247):** T8 accumulates a cumulative `battleFielded` tally beside `battleCas` (ONE `_fldSidePhaseTally` arithmetic feeds both; `_fldSidePhaseCas` is a thin wrapper), and `fldCampaignComputeOutcome` is phase-aware — when `__FIELD.phases` is set and the tallies have accumulated, campaign casualty fractions aggregate losses/fielded across ALL phases instead of the final sector only. Unreachable in every shipped path (no phased battle is campaign-launchable); the probe tooth measured the latent distortion on a synthetic phased+campaign Antietam: final-sector-only would report ~0.43 US loss fraction vs the honest all-phase 0.094 (fielded US 36,282 vs last-phase 7,907). Byte-identity PROVEN: probe-phased-ab 20/20 identical vs the committed D245 HEAD (4 battles × 5 seeds, full outcome dicts). **Retirement executed (D248):** ATTACKER-AI-PROPOSAL.md → legacy/ with the superseded-by-D64 header; START-HERE canonical line corrected (the "not yet approved" label had survived by inertia). Gate: node --check ×5 · GATE OK · probe-campaign-link 17/17 (NEW E45 tooth) · adjacents phased-ab 20/20 + antietam 16/16 + gettysburg 18/18 · 0 pe · JSON readback · diff-check clean. Five documented slow-Mac harness repairs rode along assertions-untouched (campaign-link/antietam/gettysburg off the stalling 'load' wait, D233 class — campaign-link + antietam were harness-red at HEAD today, steps=0; antietam/gettysburg screenshots to 120s, D232 class). Review scaled to LOW risk (A/B-proven zero reachable change; M2/M3 carry Opus panels). Ledger: E45 → fixed-in-D247; E42/E43 → DESIGN RESOLVED in D246 (build = PARITY-M2/M3; **M3 hard-gated on E47, which is HALF-landed** — the arc HALTS at the M3 boundary).

## S25 — PRE-BATTLE CONFIG PALETTE UNIFICATION — 2026-07-04 (D245, FOCUSED-GATED, PRESENTATION-ONLY)
The three pre-battle config surfaces (T2 skirmish menu · T6 preset picker · T11 custom-battle builder) dropped their three divergent invented brass/parchment palettes and now consume the shared H0 `--h0d-*` token set — defined per-surface on each wrapper (the D232 six-shell idiom), every value pinned to the `99-h0-president-desk.js` canon by a NEW node-side tooth in probe-custom-battle-builder (drift or an unknown token fails before the browser launches). Mapping: labels→brass, selected outlines/titles→focus, inks→ink, card/input/status bgs→panel/panel2, muted→muted, dividers→line, builder states→green/red/warn. All pairs ≥AA (worst text 7.48:1, worst non-text 3.82:1); the skirmish labels' latent `var(--rule)` 3.59:1 failure fixed as a side effect (brass 8.17:1). Sim byte-identity PROVEN by probe-presets' standing guards (layers-off CS 5/8 unchanged; stacked run seed-for-seed identical). Gate: node --check ×6 · GATE OK · builder 15/15 (canon + computed-border teeth) · presets 27/27 (S25 tooth) · adjacents field + h0-main-menu green · 0 pe · screenshots of all three surfaces (one visual system) · diff-check clean. Two documented slow-Mac harness repairs rode along, assertions untouched (presets+field off the stalling 'load' wait, D233 class; presets screenshot 120s, D232 class — both harness-red at HEAD today, steps=0). Opus lens (default-refute): SAFE_TO_COMMIT, 4 LOW — the find: the 95-playstyle picker is a FOURTH config surface on the same idiom → filed as NEW ledger **S39** (with the out-of-scope drawer + briefing accents), not scope-crept.

## E13+E41 — SAVE HARDENING (ONE MILESTONE, TWO HALVES) — 2026-07-04 (D244, FOCUSED-GATED)
Aaron's approved pair shipped as one code-health milestone. **E13:** a tampered `gor_save` whose settings carried an own `hasOwnProperty` crashed the game at SCRIPT-EVAL time (base:3983 boot lane → base:3159 `src.hasOwnProperty(k)` TypeError → whole script dead, persistent brick until localStorage cleared). Fixed via NEW `src/105-save-guard.js` redeclaring loadLocal+applySave (hoisted last-declaration-wins protects even the eval-time lane the 91-save-slots wrapper idiom cannot reach; manifest `overrides` += both): reject at loadLocal (the D234 `_slValidSave` posture on the autosave lane), sanitize at applySave (`Object.prototype.hasOwnProperty.call` iteration + skip-list += the shadow key), byte-identical on every legit save. Negative control: the pre-fix HEAD deliverable + the tamper = "src.hasOwnProperty is not a function" + 2 cascade pageerrors, module layer dead; the fixed build = 0 pe, menu up, tamper rejected. **E41:** NEW build gate 4h + tracked `tools/save-shape.json` — whitespace-collapsed sha256/16 pins on the 7 envelope-owning fns + `_SAVE_VER`↔saveVer mirror + required-core floor + same-file dup-declaration die + assignment-form rebind scan (importSave exempt, the D234 wrapper); proven on 5 violation fixtures, live tree green, honest coverage limits documented in-gate. **Probe:** save-slots 10/10→**14/14** (tamper-boot reload with the persistent pageerror listener · direct sanitize · legit round-trip · source-hygiene scan). Two D232/D233-class harness repairs, assertions untouched: the save-slots screenshot → 120s budget; probe-full-campaign off the stalling `'load'` wait → domcontentloaded+120s (red at HEAD today, harness-only — goto timeout, steps=0; 4 ok after). **3-lens Opus panel (default-refute): 3× SAFE_TO_COMMIT**; the coverage-floor MED fixed pre-verdict, the dup-decl + rebind MEDs hardened in-slice, the doc overclaim rewritten honest; NEW pre-existing residual filed as **E50** (tampered `campaign.*` still reaches callable-hasOwnProperty walks in 35-command.js et al. — navigation-gated, never the boot; a future deep-sanitize slice). Gate: node --check ×4 · GATE OK (`save-shape ✓` token added) · probe-save-slots 14/14 ×2 0 pe · full-campaign 4 ok · loot-survival 11 ok · JSON readback · diff-check clean.

## E46 — ANTIETAM ACCURATE-INPUTS CORRECTION — 2026-07-04 (D243, FOCUSED-GATED + A/B)
Aaron's approved E46 shipped as one data-only milestone from the pre-staged adversarially-verified dossier (committed with it). The model had ERASED McClellan's ~2:1 weight — Meade's division missing entirely, XII Corps ~4,900 vs ~7,100 engaged, French 4,400 vs 5,700 — while CS strengths sat above sources (the lane double-counted 3,700 vs NPS "over 2,500"; Toombs 1,100 vs his real 450 as a self-admitted bottleneck proxy — REMOVED, the A/B proves the bluff cover + hold timer carry the bottleneck; A.P. Hill 3,700 vs his OR's "not over 2,000"). Weapons honesty: the ANV majority-rifled (75.8% modeled, `_weaponsNote` stamps all tags Inferred) — empirically the single biggest ratio mover (0.30→0.86), refuting the dossier's weak-lever read. Two documented CS batteries added (Pelham's 15 guns on Nicodemus Hill; Jones's 10 organic ridge guns) — neither flips a direction. A/B both seed sets: agg CS 8/8 unchanged, atk/def **0.57/0.58 → 0.81/0.82** (historical 1.20), fielded ratio 1.32:1 → **1.67:1 US**, all three phase directions historical at every accepted step; 8 other battles byte-identical both sets. ONE honest divergence (the D242 pattern): the documented Piper-farm guns invert the lane's documented fall (diagnostic: genuine timeout stall, NOT the E48 buzzer class — the E49 mass-capture gap exactly, ~300 prisoners at the real lane-fall) → left unmodeled with `_e46Note` + a completion target for the approved E48/E49 arc (with them the ratio hit 1.06). Draw-emergence answered structurally: the T8 draw band is unreachable with 3 decisive phases (T8 header annotated; E48 makes it reachable — re-A/B then). In-session research: 3-leg citation sign-off (its ADJUSTs applied: Williams 4,600/Greene 2,500, A.P. Hill 1,650/350) + 2-leg CS-artillery verify. 3-lens Opus panel: law SAFE_TO_COMMIT (the Piper omission passes the fudge-refutation test — it COSTS accuracy, buys nothing); history/probe-data FIX_FIRST both fixed pre-commit (Pelham Capt→**Maj.**, the D92 wrong-rank class; D243 logged). Registry 630→639 re-pin. Gate: JSON ×8, GATE OK ×9, sweeps ×12 + diagnostic, probe-antietam 16/16 ×3 (no assertion touched), loot-survival ×2, gettysburg + shiloh adjacents, node --check ×2, 0 pe, diff clean.

## E47 SLICES 3-4 — SHILOH + GETTYSBURG FLIPS RED, REVERTED; NEW PROPOSAL E49; ARC PAUSED FOR AARON — 2026-07-04 (D242, DOCS-ONLY)
Both remaining flips were built, A/B'd, diagnosed, and reverted. Shiloh: CS 7/8 → 2/8 (direction gate ≥4/8 RED), ratio 0.11 → 0.31-0.34; the end-state diagnostic shows the US holding the Hornets' Nest corridor at the buzzer with the CS army stalled at ~6% loss — the artifact had been simulating the missing mass-surrender (Prentiss ~2,200) + straggler-collapse mechanisms, so removing it makes the historically-dissolving defense bottomless. Gettysburg: Day 1 inverts to US 8/8 (gate CS ≥6/8 RED; ~3,600 Day-1 prisoners are the same missing mechanism). Never push red / never weaken a direction gate → reverted both (final re-sweep proves all 9 battles byte-identical to the committed D241 state). Filed E49 (universal envelopment-surrender + straggler-shedding, recommendation: design session, then finish the arc) alongside D241's E48. E47 ends this session HALF-LANDED by design: Malvern Hill (D240) + Chancellorsville (D241) fixed; Shiloh + Gettysburg blocked on Aaron's E48/E49 calls.

## E47 SLICE 2 — CHANCELLORSVILLE FLIP + ENDNOTE HONESTY + NEW PROPOSAL E48 — 2026-07-04 (D241, FOCUSED-GATED + A/B)
Chancellorsville gains `homeEdge {US:"low",CS:"high"}`. A/B both seed sets: CS 7/8 → US 4 / CS 4, atk/def 0.32-0.33 → 0.84-0.86 — nearly the historical 0.77 defender-pays (US 17,287 / CS 13,303); the pre-flip ratio was the E47 artifact. The 4/4 split is a clock knife-edge, not emergent balance: an end-state diagnostic showed every new US "win" is a 480s buzzer expiry with the CS standing ON the crossroads (12-13k men in the radius, US zero, holdSecs 88-133/140) — and the 480s clock is an unanchored shared template (bullrun/fredericksburg/shiloh/chancellorsville verbatim). Per Aaron's live fair-gameplay concern + D74, NOT touched: filed as proposal E48 (recommendation: a universal position-falling-at-the-buzzer rule, not a clock guess). Panel-mandated in-slice fix: the US-win endNote no longer claims the assault "never reached the crossroads" (false on 100% of observed US wins) — now honestly "denied a consolidated hold." 2-lens Opus panel: both SAFE_TO_COMMIT + SHIP_AS_IS_PLUS_PROPOSAL. Probe-chancellorsville 27/27 (new E47 tooth; CS≥4/8 balance step passes at its exact floor — deterministic canary). 8 unflipped battles byte-identical. Gate: JSON ×3, GATE OK ×2, sweeps + diagnostic, probe ×2, 0 pe, diff clean.

## E47 SLICE 1 — ROLE-AWARE homeEdge SEAM + MALVERN HILL FLIP — 2026-07-04 (D240, FOCUSED-GATED + A/B)
The first slice of Aaron's approved E47 rout-direction arc (flip order Malvern Hill → Chancellorsville → Shiloh → Gettysburg, one at a time). The seam: `fldHomeEdgeZ` consults a per-scenario `homeEdge {US:"low"|"high",CS:...}` data field (T1 single-phase + T8 per-phase init via the both-sides-required `fldHomeEdgeSpec`; cleared every launch), lazily resolved against live FIELD_H; two T5 no-visible-enemy fallback facings made role-aware via `fldArmsFallbackFace` (default = exact original constants). NO-FLIP PROOF: both seed sets' 9-battle sweeps byte-identical to HEAD baselines. The Malvern flip A/B: US 7/8→8/8 (all assaults repulsed, as history), atk/def 2.90→1.45 (default) / 3.38→1.34 (probe) — the pre-flip ratio was artifact-inflated (CS routers annihilated behind the Union gun line); the post-flip number is honest and emergent, slightly below the historical 1.8-2.7 band (calibration observation logged, deliberately not touched, D74). 8 unflipped battles byte-identical. 3-lens Opus panel (default-refute): 3× SAFE_TO_COMMIT, 1 actionable LOW (one-sided homeEdge spec trap) FIXED pre-commit. Probe-malvern-hill 27/27 with 3 new teeth (declaration, behavioral rout-direction both sides, sandbox no-leak) — the probe also caught a dropped `defaultFog:false` during the data edit (restored). Gate: node --check ×6, GATE OK ×4, sweeps ×6, adjacents arms 23/23 / order-feel 17/17 / antietam 16/16, 0 pe, diff clean.

## FABLE AUDIT M9 — SAVE-MANAGER GUARDS — 2026-07-03 (D234, FOCUSED-GATED)
S31 overwrite-filled-slot confirm · S32 load/import-over-live-campaign confirm on EVERY lane (slot manager + the base menu's Load-from-File via the hardened importSave wrapper — the bypass was a review catch) · S33 delete confirm with the save's label · S34 a distinct "Incompatible save" state for raw-present-but-unreadable slots (Save disabled against clobber, Delete kept for a deliberate clear; a future _SAVE_VER bump no longer silently "empties" every slot). Gate: node --check ×2, GATE OK, probe-save-slots 10/10 (new both-paths confirm teeth), adjacent probe-full-campaign ok, 0 pe, diff clean.

## SOLDIER'S STORY CASLER (16TH) + C64 STANNARD SPLIT + C65 BERRY ATTACH — 2026-07-04 (D239, FOCUSED-GATED + A/B)
Aaron's D237 "Soldier's Story + C64" pairing shipped as one milestone. John O. Casler (Pvt, Co. A, 33rd Virginia, Stonewall Brigade — pioneer-corps detail at Chancellorsville by his own account) is the sixteenth Verified replacement, the first Chancellorsville record, and the third CS voice; sources page-verified (memoir 1906 ed. + USC Press Krick edition + NPS FRSP OOB); no Paxton-death/Jackson-wounding eyewitness claim, no portrait. C64 closed verify-first: the tablet-sourced split (line = 14th VT 650, flank = 13th+16th 1,140; total 1,790 vs sourced 1,788) replaced the ~4,000 double-count — and the trim honestly flipped Day 3 to defender-pays in the A/B, exposing the two compensating errors, fixed per the D235 precedent: Trimble 3,500→1,900 (only Lane + Lowrance charged) and the missing Osborn 18-gun Cemetery Hill northern enfilade. Final A/B both seed sets: Gettysburg agg US 8/8, atk/def 1.09-1.11, D3 repulsed 8/8 at 2.32-2.55:1, Days 1-2 mean-identical; Chancellorsville CS 7/8 with Berry's aura now really bound (C65 — the only dangling attach repo-wide, C33 class); seven battles byte-identical. 3-lens Opus panel: 3× SAFE_TO_COMMIT, 1 MED + 6 LOW, all actionable findings fixed pre-commit. Gates: JSON ×3, importer 16/16, node --check ×3, GATE OK ×3, probes gettysburg 18/18 · chancellorsville 26/26 · loot-survival green + antietam/women-in-war/bridge adjacents, 0 pe, diff clean. Registry 627→630 (Osborn's 3 generated slots, D237 class).

## FABLE AUDIT RUN 1 CLOSED — FULL vet:noreg GREEN 109/109 — 2026-07-04 (D238, BATCH GATE)
The D176 batch checkpoint closed green: the full 109-entry suite passed across two contiguous segments (the D174/D192 split form) with the E15 freshness law enforcing fresh ok=true / 0 pe / 0 realErrors per entry. Segment 1 = entries 1-92 (all three D237 failure classes stayed fixed); the single red stop was the harness SIGTERM-ing a GREEN probe-atmospherics (20/20, ok=true, 0 pe) 2.4s over the 360s default budget — root-caused as the D232-class slow-Mac budget flake and fixed by granting it tactical-visuals' 600s budget (no assertion touched); segment 2 (`--from=atmospherics`) = entries 93-109 green incl. atmospherics at 358.8s, all nine battle probes, the sweep, full-campaign, and diag-classic (nonBlank=346). **Audit run 1 is closed: 143/144 FIX-NOW items fixed (D225-D237); C64 rides D239 per Aaron's D237 assignment.** Also recorded: Aaron's parity-arc ordering call (queued after S25; PM3 gated on E47; M1-only pull-forward), with the parity design doc + the pre-staged E46 dossier untracked in docs/design/ for their future milestones.

## FABLE AUDIT CLOSE-OUT (PARTIAL) — HARNESS REPAIRS + AARON DECISIONS + PUBLISHED — 2026-07-03 (D237)
The run-ending full `vet:noreg` battery was started; its first-ever exercise of the D230 E15 freshness law exposed three latent harness defects, all root-caused (never weakened): five artifact-less enrolled gates now write fresh ok-mirroring artifacts (3 import gates, probe-portraits — which also gained real teeth, diag-classic — contract-mirroring); probe-real-diplomacy's innerHTML assertion made decoration-tolerant after the C18 glossary widening (same strings, textContent; all 18 exposed probes swept green); probe-loot-survival's registry count updated 603→627 for the 9 documented M10 formations (+24 generated slots). Aaron called the D171 boundary mid-battery — **the full green battery REMAINS OPEN, next session's first task.** Aaron's popup decisions recorded: E47 APPROVED all 4 battles; next work = Soldier's Story + C64; E46/E13+E41/S25 approved, E33 parked, E42/E43/E45 to a design session; X02 residue deleted; **PUBLISH approved + executed — the game is LIVE at https://adhanke-star.github.io/History-Video-Game/ (repo public, Pages on main/root, verified 200)**.

## FABLE AUDIT M11 — DOCS COHERENCE + TWO BOUNDED TAIL FIXES — 2026-07-03 (D236, FOCUSED-GATED)
REVIEW-QUEUE is now purely the audit ledger (run-e/f/g/h history → legacy/); START-HERE's canonical/legacy lists, D-head labels, and read-order pointer reconciled (D222 stays the playable-content head; the audit run is the active work); DEPLOY.md unstuck from its "nothing published" 2026-06-14 framing (live PRIVATE remote; the open Aaron decision is public-web publishing); V1-CHECKLIST confirm-items 3/5 stamped RESOLVED and `.tmp/` scratch references annotated; AUTONOMOUS-RUN §2 epoch label fixed; the H0 research packet moved to tracked docs/design/ (X01); the stale entrench-cover figures annotated at all four doc spots (E01, shipped maxima ×1.53/×1.76/×1.99); the attrition lever's label now surfaces its T13 engineering-realism coupling (E02, presentation-only); and the never-slotted orphan E35 closed — prisoner-exchange's returned-POW strength channel is now cumulatively capped (≤1.2/battle, ≤6.0/campaign via P.strengthLiftUsed) with a non-vacuous probe tooth. Gate: node --check ×3, GATE OK ×2, probe-prisoner-exchange 9/9 + presets/engineering-corps/manpower adjacents green, 0 pe, diff clean. Only C64 remains open in the ledger; the full vet:noreg batch checkpoint runs next.

## FABLE AUDIT M10 — SIM-AFFECTING ACCURATE-INPUTS CORRECTIONS — 2026-07-03 (D235, FOCUSED-GATED + A/B)
The first ledger milestone that changes battle inputs (D92/D74). **C28 HIGH:** all three Gettysburg phases had the attacker/defender seating INVERTED (the CS attacker spawned ON the defended objective terrain, the US defender ~450 yd away at high z) — re-seated per the engine convention and the three shipped CS-attacker battles; the corrected seating exposed that the old probe passes were geometric accidents, so the missing documented Union defense was added per D92 (Hazard 24 guns + McGilvery 39 guns + Hays's division + Hall/Harrow on Day 3; Birney's III Corps + Bigelow's battery on Day 2, with CS Benning/G.T. Anderson added at the same altitude). **C30** Heth 5500→3400 · **C43** Day-2/3 CS infantry rifled · **C05-scale** Ruggles's 53-gun grand battery as a timed Shiloh reinforcement (atSec 100, BEFORE the dusk assault — the first try at 200 failed the probe-seed gate and was root-caused to the file's compressed clock, not the input scale) · **C47** both Shiloh armies smoothbore (sourced WEAPONS NOTE) · **C33** Wallace attach fixed (was a silent no-op) · **C11** display-only "Hold the Line" badge alias on Shiloh (the D104 lever untouched) · **C37** already fixed in D226, stale ledger line flipped. A/B logged on BOTH seed sets: Gettysburg agg US 8/8 with the atk/def casualty ratio moving 1.04 → **1.22-1.23 (the historical 28,063/23,049 = 1.22, emergent)**, Day 1 an honest CS 6-7/8 meeting engagement, and the charge paying ~2.6:1 on Day 3; Shiloh US 5/CS 3 → CS 7/8 (the modeled Hornets' Nest objective historically FELL; the file's endNote frames the CS field win as history-holds); Chancellorsville CS 8/8 → 6-7/8; the six untouched battles byte-identical. Full Opus panel (5 lenses) pre-commit: 6 findings all fixed/filed (Day-1 CS terrain re-seat; _rosterNote Shiloh calibration superseding-addendum; E47 pedagogy dimension; Ruggles causal softening; Enfield hedge; Hazard 24→20) — code/probe lenses 0 findings; a pre-existing Stannard double-count filed as NEW C64. NEW proposal E47 (side-keyed fldHomeEdgeZ rout asymmetry inflates defender casualties in all four CS-attacker battles; pre-existing). Gate: JSON ×4, node --check ×4, GATE OK ×4, probes gettysburg 17/17 · shiloh 31/31 · chancellorsville 25/25 · antietam 16/16 · ratings 21/21 (all 0 pe, JSON readback, re-run green post-panel), new teeth in all three battle probes, diff-check clean. Full vet:noreg deferred to the run's batch checkpoint (D176).

## FABLE AUDIT M8 — A11Y + DISCOVERABILITY + TEACHING-UI STALENESS — 2026-07-03 (D233, FOCUSED-GATED)
18 ledger items across 9 files: S07/S08/C19 gesture+hotkey discoverability and honest quick-start; S12/S14/S15 H2 cutaway focus trap + app reduceMotion + dyslexia coverage; S21(HIGH)-S27 builder a11y (accessible names, decimal/numeric keypads, focus restore, announced validation, dirty-draft confirms, clamp warning); S13/S28/S30 small a11y; C18 glossary widened to 16 teaching tabs; C20 two Verified codex systems entries (rail logistics, medicine/disease — 2 scholarly sources each); C21 honest tour tabs. Review workflow caught 2 LOW (delete-slot disabled-focus, numeric-vs-decimal keypad) — both fixed pre-commit. Harness: 3 more probes off the stalling 'load' wait; builder screenshot on the slow-Mac budget; glossary hook step updated to the C18-corrected scoping. Gate: node --check ×17, GATE OK, 9 probes ok=true 0 pe with JSON readback, diff clean.

## FABLE AUDIT M7 — H0/UI VISUAL POLISH — 2026-07-03 (D232, FOCUSED-GATED)
9 presentation-only ledger items across the six H0 shells + the shared 2D view: S00 no more literal '&amp;' in the prep list (plain data + escape-at-sink); S01 the after-action grade letter re-centered (CSS specificity fix); S02 the interstitial army panel spans the row; S03+S11 the main menu joins the shared accent system (green/red/amber/muted + 3 rgba literal stragglers — one caught by the pre-commit Opus review); S04 the portrait 2D field band centers between the top bar and the bottom chrome (no more phone void); S05 the menu action grid absorbs the no-save column gap; S09 a phone-only Unit-panel minimize toggle reclaims the drag surface; S29 the desk header shows the year once. Also root-caused a PRE-EXISTING probe-h0-main-menu red (slow-Mac 75s budgets, flaking on different scenes run-to-run) by porting the desk probe's SLOW_MAC profile — assertions unchanged. Gate: node --check ×14, GATE OK, 6 H0 probes + field + order-feel all ok=true 0 pe with unpiped exit codes + JSON readback, phone screenshot eyeballed, diff clean.

## FABLE AUDIT M6 — TACTICAL CONTROL / PERF / SMALL-CODE — 2026-07-03 (D231, FOCUSED-GATED)
14 ledger items across 6 runtime files, all gated on player-only state (AI-vs-AI byte-identical — proven by the presets/phased-ab/order-feel invariants): the H5-i4 charge lock gains its 3 missing releases (E03 river stall, E23 interposer melee contact, E34 permanent through rout→rally); S10 holding lines pivot in place via a drag-only handle (a tap still nudges forward — the dead-zone the pre-commit Opus review confirmed was FIXED via tap-fallthrough, not documented away); E05/E06 conditioning honesty (a collapsed-war 0 keeps the 0.88 floor; the empty catch warns); E19/E20/E21/E18 render perf (figure layer reclaimed on rebuild, instanceColor upload gated, sway throttled ~24 Hz, fade closure hoisted); E44 '?' editable-target guard; S06 one pause indicator (sr-only aria-live lane kept); E04/E32 comment/dead-var truth. Gate: node --check ×10, GATE OK, 10 probes ok=true 0 pe (order-feel 17/17 · conditioning 7/7 · formation-figures 19/19 · render-richness · help-overlay 8/8 · field · presets byte-identity · h0-tactical-hud 3/3 · phased-ab), diff clean.

## FABLE AUDIT M5 — PROBE TEETH — 2026-07-03 (D230, FOCUSED-GATED)
43 exit-less enrolled probes gain a beforeExit teeth epilogue (exit nonzero unless a fresh artifact reports ok/0-fail/0-pe); vet-no-regression enforces artifact existence+freshness (E15); probe-cab-exploit asserts+exits (E08, caught a stale navy-heed claim); probe-conditioning enrolled+exit (E09); probe-motion artifact+exit (E10); new probe-help-overlay enrolled (E24). Gate: node --check, GATE OK, 4 probes ok=true 0 pe, diff clean.

## FABLE AUDIT M4 — BUILD-GATE HARDENING — 2026-07-03 (D229, FOCUSED-GATED)
10 gate blind spots closed in tools/build.mjs (+T15 menTotal rename, +manifest comment): 4d wall covers strength/morale/ammo + alias-resistant lever names; 4e dedups sources; manifest-completeness + script-terminator gates added; collision regex handles async/generators; hex case; data-file mask parity; unique tmp path. Gate: node --check, GATE OK on live tree, wall fire/false-trip tests 6/6+5/5, probe-oob ok, diff clean.

## FABLE AUDIT M3 — TAMPER/INJECTION HARDENING — 2026-07-03 (D228, FOCUSED-GATED)
E38 HIGH stored-XSS closed at both layers (T11 strips [<>] on free text; T0 HUD sink escapes u.name). Plus E11/E12/E22/E25/E26/E27/E36/E39: quote-safe escapes, hasOwnProperty keys, cushion law on the apply path, import size caps, marker-path clamps, camp fatigue clamp, tripo BAD_KEYS. Gate: node --check x7, build GATE OK, 7 probes ok=true 0 pe (incl. presets byte-identity + field baselines), diff-check clean.

## FABLE AUDIT M2b — SRC CAPTION/TEACHING FIXES — 2026-07-03 (D227, FOCUSED-GATED)
10 ledger items: Jackson/Sherman/Tubman/Sudley/Antietam-credit caption accuracy, Chancellorsville plate honesty, Fredericksburg provenance reconciliation, Early not-rail-borne (T1), McClellan peace-plank repudiation (83). Gate: node --check x5, build GATE OK, 5 probes ok=true 0 pe, diff-check clean.

## FABLE AUDIT M2a — CONTENT TEXT CORRECTIONS — 2026-07-03 (D226, FOCUSED-GATED)
37 ledger items fixed across 15 data files (codex/battles/cabinet/generals/artillery/weapons/human-cost/decisions/economy/logistics-rail/engineering/under-told/soldier-replacements). Cabinet gains Benjamin (first CS AG) + Keyes (ad interim); Watts ends 1863/10. All D74-inert. Gate: build GATE OK; importer 15/15; 8 probes ok=true 0 pe; diff-check clean. Sim-affecting siblings (C05-scale/C11/C28/C30/C33/C43/C44/C47) deferred to M10.

## FABLE AUDIT M1 — HIGH HISTORICAL CORRECTIONS — 2026-07-03 (D225, FOCUSED-GATED)
Five HIGH wrong-fact-under-Verified items fixed (C32 Vicksburg forlorn-hope front, C41 Paxton, C42 Pegram rank, C46 unverifiable Grant quote, C48 rejected cotton figure ×2). Text-only / D74-inert; probe-vicksburg assertions track corrected names. C28 Gettysburg geometry verified positional → M10. Gate: build GATE OK; vicksburg 18/18, chancellorsville 24/24, gettysburg/chickamauga/cabinet ok, 0 pageerrors; diff-check clean.

## FABLE AUDIT RUN 1 — LEDGER SHIPPED — 2026-07-03 (D224, docs-only)
**Full-spectrum audit at HEAD `6d8b098`.** 3 read-only Workflows (content/engine/surface), 304 agents, loop-until-dry on dims 1/2/7, default-refute verify, completeness critics. **150 confirmed (10 HIGH / 71 MED / 69 LOW) / 43 refuted.** Ledger + ranked M1–M11 FIX-NOW plan appended to `REVIEW-QUEUE.md`; fixes ship as D225+.
- Foreground checks: fresh rebuild is byte-identical to the committed deliverable (GATE OK all gates) ✓; git hygiene ✓ (no secrets/.bak tracked; `docs/design/ui-redesign-research.md` tracked-vs-gitignore inconsistency logged as X01).
- **(Backfill) D223 — Claude Fable 5 migration** (docs+settings only, commit `6d8b098`, 2026-07-03) had no RUN-LOG entry when it shipped; recorded here (audit finding S37 → fixed-in-D224).

## PHASE I SOLDIER'S STORY ALEXANDER S. WEBB SLICE — 2026-07-03 (D222, FOCUSED-GATED)
**Priority 1 Phase I Soldier's Story scale-out continues.** D222 does not reopen Phase H, approve media work, or start M8 battle-build work. D214's Phase H park/closeout remains live: no automatic Phase H zero-byte loop, and no real surviving-colours/PD assets, H2 footage, HDRI/model media, optional-pack work, or Tripo action without explicit approval.
- **What changed:** `data/soldier-replacements.json` now has fifteen Verified replacement records. Alexander S. Webb replaces `ss:gettysburg:US:us_phila_bde:cmd` with a Gettysburg / Brig. Gen. / Philadelphia Brigade / Second Division / II Corps command story. NPS identifies Webb as newly appointed brigadier general commanding the Philadelphia Brigade and ties his troops to the Angle during Pickett's Charge; the NPS Army of the Potomac OOB places the brigade in Second Division, II Corps; CMOHS supports Webb's July 3, 1863 Gettysburg action. The record asserts no company command, no major-general-at-Gettysburg rank, no portrait asset, and uses neutral inferred ratings.
- **Probe/data guard:** `tools/probe-loot-survival.mjs` now requires fifteen canonical records, verifies Webb alias lookup from the generated `ss:` id, checks rank/unit/team/source-note caveats, asserts no unsupported portrait, locks the rendered UI detail/source block, and keeps hostile replacement packs rejected. `SOLDIER-REPLACEMENT-FORMAT.md`, `START-HERE.md`, `AUTONOMOUS-RUN.md`, `HANDOFF.md`, `WAKE-UP.md`, and `V1-CHECKLIST.md` now route the next run to another bounded Soldier's Story slice while preserving the D214 Phase H park.
- **Contracts:** no canonical battle data, tactical combat rules, `build/base.html`, save schema, item balance, bridge math, playable battle, OOB, media asset, portrait asset, H2 footage, HDRI/model media, Tripo action, or runtime web dependency changed. `civil_war_generals.html` was rebuilt from source.
- **Verification:** `node tools/import-soldier-replacements.mjs --check data/soldier-replacements.json` passed **records=15 verified=15 disputed=0**; `node --check` passed for `src/37-loot-survival.js`, `tools/import-soldier-replacements.mjs`, and `tools/probe-loot-survival.mjs`; `node tools/build.mjs` printed **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the known raw-embed soft warning; focused `probe-loot-survival` wrote **ok=true, 11/11, 0 pageerrors**; adjacent `probe-women-in-war` wrote **ok=true, 8/8, 0 pageerrors** and its wrapper was stopped after the green artifact, `probe-save-slots` passed **9/9, 0 pageerrors**, and `probe-bridge` passed **6/6, 0 pageerrors**. JSON readback found all four artifacts `ok=true`, no failed steps, realErrors, texture warnings, or page errors. Full `npm run vet:noreg` was not run under D176 focused-slice batching. `git diff --check` passed.
- **Next:** continue Priority 1 with another bounded Phase I Soldier's Story named-person/story slice. Keep D152-D158/D172/D214/D215/D216/D217/D218/D219/D220/D221/D222 source honesty, no fabricated ranks/people/units, no unsupported portrait claims, and keep women-in-war separate. Phase H media additions, M8, and Q5/Q6 remain locked behind explicit Aaron decisions.

## PHASE I SOLDIER'S STORY SULLIVAN BALLOU SLICE — 2026-07-03 (D221, FOCUSED-GATED)
**Priority 1 Phase I Soldier's Story scale-out continues.** D221 does not reopen Phase H, approve media work, or start M8 battle-build work. D214's Phase H park/closeout remains live: no automatic Phase H zero-byte loop, and no real surviving-colours/PD assets, H2 footage, HDRI/model media, optional-pack work, or Tripo action without explicit approval.
- **What changed:** `data/soldier-replacements.json` now has fourteen Verified replacement records. Sullivan Ballou replaces `ss:bullrun1:US:us_burnside:cmd` with a First Bull Run / Major, 2nd Rhode Island Infantry / Burnside's Brigade field-officer story. NPS identifies Ballou as elected major in the 2nd Rhode Island and killed as the Rhode Islanders advanced from Matthews Hill; Rhode Island Historical Society verifies Major, Second Rhode Island, Manassas/Bull Run wound/death, and the July 14 letter-copy caveat; NPS places the 2nd Rhode Island in Burnside's Brigade under Hunter's Second Division. The record asserts no company command, no autograph-original claim, no portrait asset, and uses neutral inferred ratings.
- **Probe/data guard:** `tools/probe-loot-survival.mjs` now requires fourteen canonical records, verifies Ballou alias lookup from the generated `ss:` id, checks rank/unit/team/source-note caveats, asserts no unsupported portrait, locks the rendered UI detail/source block, and keeps hostile replacement packs rejected. `SOLDIER-REPLACEMENT-FORMAT.md`, `START-HERE.md`, `AUTONOMOUS-RUN.md`, `HANDOFF.md`, `WAKE-UP.md`, and `V1-CHECKLIST.md` now route the next run to another bounded Soldier's Story slice while preserving the D214 Phase H park.
- **Contracts:** no canonical battle data, tactical combat rules, `build/base.html`, save schema, item balance, bridge math, playable battle, OOB, media asset, portrait asset, H2 footage, HDRI/model media, Tripo action, or runtime web dependency changed. `civil_war_generals.html` was rebuilt from source.
- **Verification:** `node tools/import-soldier-replacements.mjs --check data/soldier-replacements.json` passed **records=14 verified=14 disputed=0**; `node --check` passed for `src/37-loot-survival.js`, `tools/import-soldier-replacements.mjs`, and `tools/probe-loot-survival.mjs`; `node tools/build.mjs` printed **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the known raw-embed soft warning; focused `probe-loot-survival` wrote **ok=true, 11/11, 0 pageerrors** and its wrapper was stopped after the green artifact; adjacent `probe-women-in-war` wrote **ok=true, 8/8, 0 pageerrors**, `probe-save-slots` passed **9/9, 0 pageerrors**, and `probe-bridge` passed **6/6, 0 pageerrors**. JSON readback found all four artifacts `ok=true`, no failed steps, realErrors, or page errors. Full `npm run vet:noreg` was not run under D176 focused-slice batching. `git diff --check` passed.
- **Next:** continue Priority 1 with another bounded Phase I Soldier's Story named-person/story slice. Keep D152-D158/D172/D214/D215/D216/D217/D218/D219/D220/D221 source honesty, no fabricated ranks/people/units, no unsupported portrait claims, and keep women-in-war separate. Phase H media additions, M8, and Q5/Q6 remain locked behind explicit Aaron decisions.

## PHASE I SOLDIER'S STORY JOHN H. WORSHAM SLICE — 2026-07-03 (D220, FOCUSED-GATED)
**Priority 1 Phase I Soldier's Story scale-out continues.** D220 does not reopen Phase H, approve media work, or start M8 battle-build work. D214's Phase H park/closeout remains live: no automatic Phase H zero-byte loop, and no real surviving-colours/PD assets, H2 footage, HDRI/model media, optional-pack work, or Tripo action without explicit approval.
- **What changed:** `data/soldier-replacements.json` now has thirteen Verified replacement records. John H. Worsham replaces `ss:antietam:CS:cs_jr_jones:pvt` with an Antietam / Company F, 21st Virginia Infantry / Jones' Brigade private soldier-life story. NPS identifies Worsham as a Confederate soldier in the 21st Virginia and says he fought at Antietam; Antietam on the Web verifies Private, Company F, and Maryland Campaign context; Worsham's DocSouth memoir supplies the first-person 21st Virginia / Company F identity and soldier-life source trail; Antietam on the Web and U.S. Army CMH place the 21st Virginia in Jones' Brigade, Jackson's Division. The record asserts no later sergeant/adjutant rank, no First Manassas claim, no portrait asset, and uses neutral inferred ratings.
- **Probe/data guard:** `tools/probe-loot-survival.mjs` now requires thirteen canonical records, verifies Worsham alias lookup from the generated `ss:` id, checks rank/unit/team/source-note caveats, asserts no unsupported portrait, locks the rendered UI detail/source block, and keeps hostile replacement packs rejected. `SOLDIER-REPLACEMENT-FORMAT.md`, `START-HERE.md`, `AUTONOMOUS-RUN.md`, `HANDOFF.md`, `WAKE-UP.md`, and `V1-CHECKLIST.md` now route the next run to another bounded Soldier's Story slice while preserving the D214 Phase H park.
- **Contracts:** no canonical battle data, tactical combat rules, `build/base.html`, save schema, item balance, bridge math, playable battle, OOB, media asset, portrait asset, H2 footage, HDRI/model media, Tripo action, or runtime web dependency changed. `civil_war_generals.html` was rebuilt from source.
- **Verification:** `node tools/import-soldier-replacements.mjs --check data/soldier-replacements.json` passed **records=13 verified=13 disputed=0**; `node --check` passed for `src/37-loot-survival.js`, `tools/import-soldier-replacements.mjs`, and `tools/probe-loot-survival.mjs`; `node tools/build.mjs` printed **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the known raw-embed soft warning; focused `probe-loot-survival` wrote **ok=true, 11/11, 0 pageerrors**; adjacent `probe-women-in-war` wrote **ok=true, 8/8, 0 pageerrors**, `probe-save-slots` passed **9/9, 0 pageerrors**, and `probe-bridge` passed **6/6, 0 pageerrors**. JSON readback found all four artifacts `ok=true`, no failed steps, realErrors, or page errors. Full `npm run vet:noreg` was not run under D176 focused-slice batching. `git diff --check` passed.
- **Next:** continue Priority 1 with another bounded Phase I Soldier's Story named-person/story slice. Keep D152-D158/D172/D214/D215/D216/D217/D218/D219/D220 source honesty, no fabricated ranks/people/units, no unsupported portrait claims, and keep women-in-war separate. Phase H media additions, M8, and Q5/Q6 remain locked behind explicit Aaron decisions.

## PHASE I SOLDIER'S STORY FRANCIS C. BARLOW SLICE — 2026-07-03 (D219, FOCUSED-GATED)
**Priority 1 Phase I Soldier's Story scale-out continues.** D219 does not reopen Phase H, approve media work, or start M8 battle-build work. D214's Phase H park/closeout remains live: no automatic Phase H zero-byte loop, and no real surviving-colours/PD assets, H2 footage, HDRI/model media, optional-pack work, or Tripo action without explicit approval.
- **What changed:** `data/soldier-replacements.json` now has twelve Verified replacement records. Francis C. Barlow replaces `ss:antietam:US:us_barlow:cmd` with an Antietam / Caldwell's Brigade / 61st and 64th New York colonel story. NPS identifies Barlow as Colonel at Antietam and places the 61st/64th New York under him in Caldwell's Brigade, First Division, II Corps; Barlow's transcribed Official Records report anchors the Sunken Road enfilading-fire and prisoner-capture story; the Antietam on the Web officer profile corroborates the Antietam command/wounding context. The record asserts no brigadier-rank-at-Antietam, no single-company claim, no portrait asset, and uses neutral inferred ratings.
- **Probe/data guard:** `tools/probe-loot-survival.mjs` now requires twelve canonical records, verifies Barlow alias lookup from the generated `ss:` id, checks rank/unit/team/source-note caveats, asserts no unsupported portrait, locks the rendered UI detail/source block, and keeps hostile replacement packs rejected. `SOLDIER-REPLACEMENT-FORMAT.md`, `START-HERE.md`, `AUTONOMOUS-RUN.md`, `HANDOFF.md`, `WAKE-UP.md`, and `V1-CHECKLIST.md` now route the next run to another bounded Soldier's Story slice while preserving the D214 Phase H park.
- **Contracts:** no canonical battle data, tactical combat rules, `build/base.html`, save schema, item balance, bridge math, playable battle, OOB, media asset, portrait asset, H2 footage, HDRI/model media, Tripo action, or runtime web dependency changed. `civil_war_generals.html` was rebuilt from source.
- **Verification:** `node tools/import-soldier-replacements.mjs --check data/soldier-replacements.json` passed **records=12 verified=12 disputed=0**; `node --check` passed for `src/37-loot-survival.js`, `tools/import-soldier-replacements.mjs`, and `tools/probe-loot-survival.mjs`; `node tools/build.mjs` printed **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the known raw-embed soft warning; focused `probe-loot-survival` wrote **ok=true, 11/11, 0 pageerrors**; adjacent `probe-women-in-war` wrote **ok=true, 8/8, 0 pageerrors**, `probe-save-slots` passed **9/9, 0 pageerrors**, and `probe-bridge` passed **6/6, 0 pageerrors**. JSON readback found all four artifacts `ok=true`, no failed steps, realErrors, or page errors. Full `npm run vet:noreg` was not run under D176 focused-slice batching. `git diff --check` passed.
- **Next:** continue Priority 1 with another bounded Phase I Soldier's Story named-person/story slice. Keep D152-D158/D172/D214/D215/D216/D217/D218/D219 source honesty, no fabricated ranks/people/units, no unsupported portrait claims, and keep women-in-war separate. Phase H media additions, M8, and Q5/Q6 remain locked behind explicit Aaron decisions.

## PHASE I SOLDIER'S STORY SAMUEL N. BENJAMIN SLICE — 2026-07-02 (D218, FOCUSED-GATED)
**Priority 1 Phase I Soldier's Story scale-out continues.** D218 does not reopen Phase H, approve media work, or start M8 battle-build work. D214's Phase H park/closeout remains live: no automatic Phase H zero-byte loop, and no real surviving-colours/PD assets, H2 footage, HDRI/model media, optional-pack work, or Tripo action without explicit approval.
- **What changed:** `data/soldier-replacements.json` now has eleven Verified replacement records. Samuel N. Benjamin replaces `ss:antietam:US:us_benjamin:cmd` with an Antietam / Battery E, 2nd U.S. Artillery first-lieutenant artillery story. Army.mil and CMOHS verify Benjamin's First Lieutenant rank, 2d U.S. Artillery unit, and Medal of Honor citation; NPS Antietam places Battery E under Lt. Benjamin in the IX Corps order of battle; Benjamin's transcribed official report anchors the Sept. 16-17 Stone Bridge / Sharpsburg battery action. The record asserts no captain-rank-at-Antietam, no portrait asset, and uses neutral inferred ratings.
- **Probe/data guard:** `tools/probe-loot-survival.mjs` now requires eleven canonical records, verifies Benjamin alias lookup from the generated `ss:` id, checks rank/unit/team/source-note caveats, asserts no unsupported portrait, locks the rendered UI detail/source block, and keeps hostile replacement packs rejected. `SOLDIER-REPLACEMENT-FORMAT.md`, `START-HERE.md`, `AUTONOMOUS-RUN.md`, `HANDOFF.md`, `WAKE-UP.md`, and `V1-CHECKLIST.md` now route the next run to another bounded Soldier's Story slice while preserving the D214 Phase H park.
- **Contracts:** no canonical battle data, tactical combat rules, `build/base.html`, save schema, item balance, bridge math, playable battle, OOB, media asset, portrait asset, H2 footage, HDRI/model media, Tripo action, or runtime web dependency changed. `civil_war_generals.html` was rebuilt from source.
- **Verification:** `node tools/import-soldier-replacements.mjs --check data/soldier-replacements.json` passed **records=11 verified=11 disputed=0**; `node --check` passed for `src/37-loot-survival.js`, `tools/import-soldier-replacements.mjs`, and `tools/probe-loot-survival.mjs`; `node tools/build.mjs` printed **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the known raw-embed soft warning; focused `probe-loot-survival` wrote **ok=true, 11/11, 0 pageerrors**; adjacent `probe-women-in-war` wrote **ok=true, 8/8, 0 pageerrors**, `probe-save-slots` passed **9/9, 0 pageerrors**, and `probe-bridge` passed **6/6, 0 pageerrors**. JSON readback found all four artifacts `ok=true`, no failed steps, realErrors, or page errors. Full `npm run vet:noreg` was not run under D176 focused-slice batching. `git diff --check` passed.
- **Next:** continue Priority 1 with another bounded Phase I Soldier's Story named-person/story slice. Keep D152-D158/D172/D214/D215/D216/D217/D218 source honesty, no fabricated ranks/people/units, no unsupported portrait claims, and keep women-in-war separate. Phase H media additions, M8, and Q5/Q6 remain locked behind explicit Aaron decisions.

## PHASE I SOLDIER'S STORY FRANCIS A. WALLER SLICE — 2026-07-02 (D217, FOCUSED-GATED)
**Priority 1 Phase I Soldier's Story scale-out continues.** D217 does not reopen Phase H, approve media work, or start M8 battle-build work. D214's Phase H park/closeout remains live: no automatic Phase H zero-byte loop, and no real surviving-colours/PD assets, H2 footage, HDRI/model media, optional-pack work, or Tripo action without explicit approval.
- **What changed:** `data/soldier-replacements.json` now has ten Verified replacement records. Francis A. Waller replaces `ss:gettysburg:US:us_iron_bde:nco` with a Gettysburg / Company I, 6th Wisconsin Infantry corporal and Railroad Cut / 2nd Mississippi flag-capture story. Army.mil verifies Waller's Corporal rank, Company I / 6th Wisconsin unit, Gettysburg July 1 action, and Medal of Honor citation; the NPS Gettysburg article uses the Wallar spelling, supports the Railroad Cut story, and names the later memory dispute; NPS Gettysburg OOB places the 6th Wisconsin in the First Brigade (Iron Brigade), First Division, I Corps. The record asserts no higher rank at Gettysburg, no portrait asset, and uses neutral inferred ratings.
- **Probe/data guard:** `tools/probe-loot-survival.mjs` now requires ten canonical records, verifies Waller alias lookup from the generated `ss:` id, checks rank/unit/team/source-note caveats, asserts no unsupported portrait, locks the rendered UI detail/source block, and keeps hostile replacement packs rejected. `SOLDIER-REPLACEMENT-FORMAT.md`, `START-HERE.md`, `AUTONOMOUS-RUN.md`, `HANDOFF.md`, `WAKE-UP.md`, and `V1-CHECKLIST.md` now route the next run to another bounded Soldier's Story slice while preserving the D214 Phase H park.
- **Contracts:** no canonical battle data, tactical combat rules, `build/base.html`, save schema, item balance, bridge math, playable battle, OOB, media asset, portrait asset, H2 footage, HDRI/model media, Tripo action, or runtime web dependency changed. `civil_war_generals.html` was rebuilt from source.
- **Verification:** `node tools/import-soldier-replacements.mjs --check data/soldier-replacements.json` passed **records=10 verified=10 disputed=0**; `node --check` passed for `src/37-loot-survival.js`, `tools/import-soldier-replacements.mjs`, and `tools/probe-loot-survival.mjs`; `node tools/build.mjs` printed **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the known raw-embed soft warning; focused `probe-loot-survival` wrote **ok=true, 11/11, 0 pageerrors** after its wrapper was manually stopped post-artifact; adjacent `probe-women-in-war` wrote **ok=true, 8/8, 0 pageerrors** after the same wrapper-cleanup pattern; `probe-save-slots` passed **9/9, 0 pageerrors**; `probe-bridge` passed **6/6, 0 pageerrors**. JSON readback found all four artifacts `ok=true`, no failed steps, and no page errors. Full `npm run vet:noreg` was not run under D176 focused-slice batching. `git diff --check` passed.
- **Next:** continue Priority 1 with another bounded Phase I Soldier's Story named-person/story slice. Keep D152-D158/D172/D214/D215/D216/D217 source honesty, no fabricated ranks/people/units, no unsupported portrait claims, and keep women-in-war separate. Phase H media additions, M8, and Q5/Q6 remain locked behind explicit Aaron decisions.

## PHASE I SOLDIER'S STORY ORION P. HOWE SLICE — 2026-07-02 (D216, FOCUSED-GATED)
**Priority 1 Phase I Soldier's Story scale-out continues.** D216 does not reopen Phase H, approve media work, or start M8 battle-build work. D214's Phase H park/closeout remains live: no automatic Phase H zero-byte loop, and no real surviving-colours/PD assets, H2 footage, HDRI/model media, optional-pack work, or Tripo action without explicit approval.
- **What changed:** `data/soldier-replacements.json` now has nine Verified replacement records. Orion P. Howe replaces `ss:vicksburg:US:us_blair_stockade:pvt` with a Vicksburg / Company C, 55th Illinois Infantry musician and wounded cartridge-message story. CMOHS verifies Howe's Musician rank, Company C / 55th Illinois Infantry unit, Vicksburg date/place, and Medal of Honor citation; Illinois State Archives supports the fourteen-year-old wounded drummer and cartridge-message story; NPS sources place the 55th Illinois in Blair's Second Division, XV Corps, at the May 19 Stockade Redan/Graveyard Road assault. The record asserts no higher rank at Vicksburg, no portrait asset, and uses neutral inferred ratings.
- **Probe/data guard:** `tools/probe-loot-survival.mjs` now requires nine canonical records, verifies Howe alias lookup from the generated `ss:` id, checks rank/unit/team/source-note caveats, asserts no unsupported portrait, locks the rendered UI detail/source block, and keeps hostile replacement packs rejected. `SOLDIER-REPLACEMENT-FORMAT.md`, `START-HERE.md`, `AUTONOMOUS-RUN.md`, `HANDOFF.md`, `WAKE-UP.md`, and `V1-CHECKLIST.md` now route the next run to another bounded Soldier's Story slice while preserving the D214 Phase H park.
- **Contracts:** no canonical battle data, tactical combat rules, `build/base.html`, save schema, item balance, bridge math, playable battle, OOB, media asset, portrait asset, H2 footage, HDRI/model media, Tripo action, or runtime web dependency changed. `civil_war_generals.html` was rebuilt from source.
- **Verification:** `node tools/import-soldier-replacements.mjs` passed **records=9 verified=9 disputed=0**; `node --check tools/probe-loot-survival.mjs` passed; `node tools/build.mjs` printed **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the known raw-embed soft warning; focused `probe-loot-survival` passed **11/11, 0 pageerrors**; adjacent `probe-women-in-war` passed **8/8, 0 pageerrors**, `probe-save-slots` **9/9, 0 pageerrors**, and `probe-bridge` **6/6, 0 pageerrors**. JSON readback found all four artifacts `ok=true`, no failed steps, and no page errors. Full `npm run vet:noreg` was not run under D176 focused-slice batching. `git diff --check` passed.
- **Next:** continue Priority 1 with another bounded Phase I Soldier's Story named-person/story slice. Keep D152-D158/D172/D214/D215/D216 source honesty, no fabricated ranks/people/units, no unsupported portrait claims, and keep women-in-war separate. Phase H media additions, M8, and Q5/Q6 remain locked behind explicit Aaron decisions.

## PHASE I SOLDIER'S STORY JOHN COOK SLICE — 2026-07-02 (D215, FOCUSED-GATED)
**Priority 1 Phase I Soldier's Story scale-out continues.** D215 does not reopen Phase H, approve media work, or start M8 battle-build work. D214's Phase H park/closeout remains live: no automatic Phase H zero-byte loop, and no real surviving-colours/PD assets, H2 footage, HDRI/model media, optional-pack work, or Tripo action without explicit approval.
- **What changed:** `data/soldier-replacements.json` now has eight Verified replacement records. John Cook replaces `ss:antietam:US:us_battery_b:nco` with an Antietam / Battery B, 4th U.S. Artillery bugler and acting-cannoneer story. CMOHS verifies Cook's Bugler rank, Battery B / 4th U.S. Artillery unit, Antietam date/place, and Medal of Honor citation; Department of War/DOD and NPS support the Battery B bugler-to-cannoneer action after Capt. Joseph B. Campbell was wounded; U.S. Army CMH places Battery B in Army of the Potomac / I Corps / First Division artillery. The record asserts no higher rank, no portrait asset, and uses neutral inferred ratings.
- **Probe/data guard:** `tools/probe-loot-survival.mjs` now requires eight canonical records, verifies Cook alias lookup from the generated `ss:` id, checks rank/unit/team/source-note caveats, asserts no unsupported portrait, locks the rendered UI detail/source block, and keeps hostile replacement packs rejected. `SOLDIER-REPLACEMENT-FORMAT.md`, `START-HERE.md`, `AUTONOMOUS-RUN.md`, `HANDOFF.md`, `WAKE-UP.md`, and `V1-CHECKLIST.md` now route the next run to another bounded Soldier's Story slice while preserving the D214 Phase H park.
- **Contracts:** no canonical battle data, tactical combat rules, `build/base.html`, save schema, item balance, bridge math, playable battle, OOB, media asset, portrait asset, H2 footage, HDRI/model media, Tripo action, or runtime web dependency changed. `civil_war_generals.html` was rebuilt from source.
- **Verification:** `node tools/import-soldier-replacements.mjs` passed **records=8 verified=8 disputed=0**; `node --check tools/probe-loot-survival.mjs` passed; `node tools/build.mjs` printed **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the known raw-embed soft warning; focused `probe-loot-survival` passed **11/11, 0 pageerrors** after it caught and the slice fixed a source-note caveat mismatch; adjacent `probe-women-in-war` passed **8/8, 0 pageerrors**, `probe-save-slots` **9/9, 0 pageerrors**, and `probe-bridge` **6/6, 0 pageerrors**. JSON readback found all four artifacts `ok=true`, no failed steps, and no page errors. Full `npm run vet:noreg` was not run under D176 focused-slice batching. `git diff --check` passed.
- **Next:** continue Priority 1 with another bounded Phase I Soldier's Story named-person/story slice. Keep D152-D158/D172/D214/D215 source honesty, no fabricated ranks/people/units, no unsupported portrait claims, and keep women-in-war separate. Phase H media additions, M8, and Q5/Q6 remain locked behind explicit Aaron decisions.

## PHASE H PARKED + SOLDIER'S STORY STILLWELL SLICE — 2026-07-02 (D214, FOCUSED-GATED)
**Phase H is parked / complete-enough, and Phase I Soldier's Story scale-out is active again.** D214 does not approve or start M8 battle-build work. It closes out the D193-D213 Phase H run as enough for now: executable media-budget and optional-pack/H2 locks exist, the Intel UHD-617 profile is green, H0/H2/audio/flags/readability seams are probed, and the zero-byte terrain/marker/atmospheric 3D resource wins have been covered. Remaining visible Phase H media work mostly needs an explicit media-budget/profile decision.
- **What changed:** `data/soldier-replacements.json` now has seven Verified replacement records. Leander Stillwell replaces `ss:shiloh:US:us_prentiss:nco` with a Shiloh / 61st Illinois / Company D enlisted-man record. The record is source-honest: Stillwell's memoir grounds the first-person Shiloh story; NPS corroborates the 61st Illinois at Shiloh; ILGenWeb and Kansas biography sources corroborate Company D/private muster/later promotions. It asserts no portrait, no higher rank, and uses neutral inferred ratings.
- **Probe/data guard:** `tools/probe-loot-survival.mjs` now requires seven canonical records, verifies the Stillwell alias from the generated `ss:` id, checks rank/unit/team/source-note caveats, and keeps hostile replacement packs rejected. `SOLDIER-REPLACEMENT-FORMAT.md`, `START-HERE.md`, `AUTONOMOUS-RUN.md`, `HANDOFF.md`, `WAKE-UP.md`, and `V1-CHECKLIST.md` now route the next run to another bounded Soldier's Story slice instead of an automatic Phase H loop.
- **Contracts:** no canonical battle data, tactical combat rules, `build/base.html`, save schema, item balance, bridge math, playable battle, OOB, media asset, portrait asset, H2 footage, HDRI/model media, Tripo action, or runtime web dependency changed. `civil_war_generals.html` was rebuilt from source.
- **Verification:** `node tools/import-soldier-replacements.mjs` passed **records=7 verified=7 disputed=0**; `node --check tools/probe-loot-survival.mjs` passed; `node tools/build.mjs` printed **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the known raw-embed soft warning; focused `probe-loot-survival` passed **11/11, 0 pageerrors** after it caught and the slice tightened the Stillwell no-portrait caveat; adjacent `probe-women-in-war` passed **8/8, 0 pageerrors**, `probe-save-slots` **9/9, 0 pageerrors**, and `probe-bridge` **6/6, 0 pageerrors**. Full `npm run vet:noreg` was not run under D176 focused-slice batching. `git diff --check` passed.
- **Next:** continue Priority 1 with another bounded Phase I Soldier's Story named-person/story slice. Keep D152-D158/D172/D214 source honesty, no fabricated ranks/people/units, no unsupported portrait claims, and keep women-in-war separate. Phase H media additions, M8, and Q5/Q6 remain locked behind explicit Aaron decisions.

## GROUP 5 · PHASE H LOW-TIER MARKER BODY LAYER PERF POLISH — 2026-07-02 (D213, FOCUSED-GATED)
**The twentieth Group 5 Phase H slice is complete.** D213 does not approve or start M8 battle-build work. It uses the D212 Intel profile to take another zero-new-media low-tier render/resource step: low-quality markers keep their slab/front/flag/pole read, but the slab/front body now renders through two shared scene-level layers instead of two child meshes per unit.
- **What changed:** `src/tactical/T0-field-sandbox.js` adds `markerBodySlabLayer` and `markerBodyFrontLayer` instanced layers for low tier, stable body slots, per-instance side/routing color, inactive-slot parking, and rebuild/dispose cleanup. `src/tactical/T23-tripo-unit-assets.js` clears shared body slots when a local GLB hides the base marker and avoids restoring stale child slab/front meshes on low tier. `src/tactical/T24-formation-figures.js` preserves the shared low-tier body fallback when formation figures are off. Profile/formation/Tripo/visual probes now assert active shared body slots.
- **Contracts:** no new media, asset fetch, H2 video, runtime web dependency, Tripo action/credit/API call, playable battle, battle roster/OOB rewrite, combat model, save schema, bridge math, battle-output path, or `build/base.html` edit. This is presentation/performance-only marker-resource polish.
- **Verification:** `node --check` passed for touched source/probe files; build **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the existing raw-embed soft warning. Focused `probe-intel-uhd617-profile` passed **19/19** with high 6.30ms / 75 render calls / 116 objects and low 1.62ms / 63 render calls / 97 objects. Adjacent `probe-formation-figures` passed **17/17**, `probe-tripo-unit-assets` **15/15** after catching and fixing the low-tier GLB duplicate-body restore, `probe-visual-fidelity` **27/27**, `probe-render-richness` **31/31**, and `probe-media-budget` **6/6**, all with zero pageerrors and no texture warnings where applicable. Key-aware JSON readback across counted artifacts found no `ok=false`, failed steps, `FATAL`, pageerrors, realErrors, or texture warnings. `git diff --check` passed.
- **Next:** continue Group 5 Phase H with another bounded zero-byte render/readability/perf slice while the raw embed tier remains above the soft warning, or surface the explicit media-budget/profile decision before adding real PD/surviving-colours/H2/HDRI/model media. M8 battle-build remains blocked pending Aaron go/no-go; Q5 Chattanooga, Atlanta/March, Franklin/Nashville, and Q6 USCT playable battles remain last.

## GROUP 5 · PHASE H HIGH-TIER MARKER BODY RESOURCE POLISH — 2026-07-02 (D212, FOCUSED-GATED)
**The nineteenth Group 5 Phase H slice is complete.** D212 does not approve or start M8 battle-build work. It uses the D211 Intel profile to take another zero-new-media high-tier resource step: default high-tier infantry formation figures already own the visible marker read, so the old slab/front marker body no longer stays resident as hidden fallback geometry.
- **What changed:** `src/tactical/T0-field-sandbox.js` now lazy-creates marker slab/front bodies through `fld3dAddMarkerBody()` only when `fld3dNeedsMarkerBody()` says fallback, low-tier, GLB, or fade paths need them. `src/tactical/T21-visual-fidelity.js` reapplies rank maps to lazily restored fallback slabs, and `src/tactical/T18-render-richness.js` materializes a fallback body only for active casualty fade. Formation/profile/visual probes now lock no hidden default high-tier marker bodies plus fallback rank-map/body restoration.
- **Contracts:** no new media, asset fetch, H2 video, runtime web dependency, Tripo action/credit/API call, playable battle, battle roster/OOB rewrite, combat model, save schema, bridge math, battle-output path, or `build/base.html` edit. This is presentation/resource-allocation-only T0/T18/T21 marker polish.
- **Verification:** `node --check` passed for touched source/probe files; build **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the existing raw-embed soft warning. Focused `probe-formation-figures` passed **17/17**; `probe-intel-uhd617-profile` passed **19/19** with high 8.58ms / 75 render calls / 116 objects and low 1.98ms / 77 render calls / 111 objects. Adjacent `probe-render-richness` first caught the lazy-body casualty-fade regression, then passed **31/31** after the T18 fade-body fix; `probe-visual-fidelity` passed **27/27**, `probe-tripo-unit-assets` **15/15**, and `probe-media-budget` **6/6**, all with zero pageerrors and no texture warnings where applicable. Key-aware JSON readback across counted artifacts found no `ok=false`, failed steps, `FATAL`, pageerrors, realErrors, or texture warnings; formation, visual-fidelity, and Tripo screenshots were spot-checked. `git diff --check` passed.
- **Next:** continue Group 5 Phase H with another bounded zero-byte render/readability/perf slice while the raw embed tier remains above the soft warning, or surface the explicit media-budget/profile decision before adding real PD/surviving-colours/H2/HDRI/model media. M8 battle-build remains blocked pending Aaron go/no-go; Q5 Chattanooga, Atlanta/March, Franklin/Nashville, and Q6 USCT playable battles remain last.

## GROUP 5 · PHASE H LOW-TIER MARKER POLE LAYER PERF POLISH — 2026-07-02 (D211, FOCUSED-GATED)
**The eighteenth Group 5 Phase H slice is complete.** D211 does not approve or start M8 battle-build work. It uses the D210 Intel profile to take another zero-new-media low-tier render/resource step: low-quality markers keep their slab/front/flag/pole read, but the pole cue now renders through one shared scene-level layer instead of one mesh per unit.
- **What changed:** `src/tactical/T0-field-sandbox.js` adds a shared low-tier `markerPoleLayer` `InstancedMesh`, parks stale instances on quality changes, and keeps normal per-unit pole creation for high/off fallback markers. `tools/probe-formation-figures.mjs` locks the low-tier shared pole cue, and `tools/probe-intel-uhd617-profile.mjs` records/asserts `poleLayer` state.
- **Contracts:** no new media, asset fetch, H2 video, runtime web dependency, Tripo action/credit/API call, playable battle, battle roster/OOB rewrite, combat model, save schema, bridge math, battle-output path, or `build/base.html` edit. This is presentation/performance-only T0 marker polish.
- **Verification:** `node --check` passed for touched source/probe files; build **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the existing raw-embed soft warning. Focused `probe-formation-figures` passed **17/17**; `probe-intel-uhd617-profile` passed **19/19** with high 8.83ms / 75 render calls / 128 objects and low 2.65ms / 77 render calls / 111 objects. Adjacent `probe-render-richness` passed **31/31**, `probe-visual-fidelity` **27/27**, `probe-tripo-unit-assets` **15/15**, and `probe-media-budget` **6/6**, all with zero pageerrors and no texture warnings where applicable. Key-aware JSON readback across counted artifacts found no `ok=false`, failed steps, `FATAL`, pageerrors, realErrors, or texture warnings; the low-tier formation screenshot was spot-checked. `git diff --check` passed.
- **Next:** continue Group 5 Phase H with another bounded zero-byte render/readability/perf slice while the raw embed tier remains above the soft warning, or surface the explicit media-budget/profile decision before adding real PD/surviving-colours/H2/HDRI/model media. M8 battle-build remains blocked pending Aaron go/no-go; Q5 Chattanooga, Atlanta/March, Franklin/Nashville, and Q6 USCT playable battles remain last.

## GROUP 5 · PHASE H HIGH-TIER MARKER POLE RESOURCE POLISH — 2026-07-02 (D210, FOCUSED-GATED)
**The seventeenth Group 5 Phase H slice is complete.** D210 does not approve or start M8 battle-build work. It uses the D209 Intel profile to take another zero-new-media high-tier resource step: default high-tier infantry formation figures no longer allocate hidden base-marker pole meshes/materials after T24 has replaced the slab/front/pole/topper read.
- **What changed:** `src/tactical/T0-field-sandbox.js` adds `fld3dAddMarkerPole()` and `fld3dNeedsMarkerPole()`, so the pole is lazy-created only when the fallback marker is visible. `renderRich="off"` / `formationFigures="off"` restores the pole and topper fallback; low tier still keeps slab/front/flag/pole readability while omitting decorative toppers. `tools/probe-formation-figures.mjs` locks no resident high-tier infantry pole plus off/low pole restoration, and `tools/probe-intel-uhd617-profile.mjs` records `poleCount` alongside marker resource state.
- **Contracts:** no new media, asset fetch, H2 video, runtime web dependency, Tripo action/credit/API call, playable battle, battle roster/OOB rewrite, combat model, save schema, bridge math, battle-output path, or `build/base.html` edit. This is presentation/resource-allocation-only T0/T24 marker polish.
- **Verification:** `node --check` passed for touched source/probe files; build **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the existing raw-embed soft warning. Focused `probe-formation-figures` passed **17/17**; `probe-intel-uhd617-profile` passed **19/19** with high 8.88ms / 75 render calls / 128 objects and low 2.41ms / 84 render calls / 118 objects. Adjacent `probe-tripo-unit-assets` passed **15/15**, `probe-render-richness` **31/31**, `probe-visual-fidelity` **27/27**, and `probe-media-budget` **6/6**, all with zero pageerrors and no texture warnings where applicable. Key-aware JSON readback across counted artifacts found no `ok=false`, failed steps, `FATAL`, pageerrors, realErrors, or texture warnings; formation and GLB fixture screenshots were spot-checked. `git diff --check` passed.
- **Next:** continue Group 5 Phase H with another bounded zero-byte render/readability/perf slice while the raw embed tier remains above the soft warning, or surface the explicit media-budget/profile decision before adding real PD/surviving-colours/H2/HDRI/model media. M8 battle-build remains blocked pending Aaron go/no-go; Q5 Chattanooga, Atlanta/March, Franklin/Nashville, and Q6 USCT playable battles remain last.

## GROUP 5 · PHASE H IDLE SELECTION-RING RESOURCE POLISH — 2026-07-02 (D209, FOCUSED-GATED)
**The sixteenth Group 5 Phase H slice is complete.** D209 does not approve or start M8 battle-build work. It uses the D208 Intel profile to take another zero-new-media resource step: idle 3D unit selection rings are no longer allocated by default after D201 already stopped drawing them.
- **What changed:** `src/tactical/T0-field-sandbox.js` adds `fld3dEnsureSelectionRing()` and lazy-creates the marker selection ring only when a unit is selected. `src/tactical/T18-render-richness.js` reacquires a lazily-created ring so the selected pulse and casualty-fade cue still work. `src/tactical/T23-tripo-unit-assets.js` explicitly requests a ring when a local GLB hides the base slab/front marker, preserving that optional fixture cue. `tools/probe-render-richness.mjs` now locks no-resident-or-hidden idle rings plus selected-ring visibility, and `tools/probe-intel-uhd617-profile.mjs` records/asserts default `ringCount:0` in high/low profile scenes.
- **Contracts:** no new media, asset fetch, H2 video, runtime web dependency, Tripo action/credit/API call, playable battle, battle roster/OOB rewrite, combat model, save schema, bridge math, battle-output path, or `build/base.html` edit. This is presentation/resource-allocation-only T0/T18/T23 marker polish.
- **Verification:** `node --check` passed for touched source/probe files; build **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the existing raw-embed soft warning. Focused `probe-render-richness` passed **31/31, 0 pageerrors, 0 texture warnings**; `probe-intel-uhd617-profile` passed **19/19** with high 8.37ms / 75 render calls / 134 objects and low 2.03ms / 84 render calls / 118 objects. Adjacent `probe-tripo-unit-assets` passed **15/15**, `probe-visual-fidelity` **27/27**, `probe-formation-figures` **17/17**, `probe-media-budget` **6/6**, and `probe-presets` **26/26**, all with zero pageerrors and no texture warnings where applicable. Key-aware JSON readback across counted artifacts found no `ok=false`, failed steps, `FATAL`, pageerrors, realErrors, or texture warnings; relevant screenshots were spot-checked. `git diff --check` passed.
- **Next:** continue Group 5 Phase H with another bounded zero-byte render/readability/perf slice while the raw embed tier remains above the soft warning, or surface the explicit media-budget/profile decision before adding real PD/surviving-colours/H2/HDRI/model media. M8 battle-build remains blocked pending Aaron go/no-go; Q5 Chattanooga, Atlanta/March, Franklin/Nashville, and Q6 USCT playable battles remain last.

## GROUP 5 · PHASE H HIGH-TIER MARKER TOPPER RESOURCE POLISH — 2026-07-02 (D208, FOCUSED-GATED)
**The fifteenth Group 5 Phase H slice is complete.** D208 does not approve or start M8 battle-build work. It uses the D207/D206 Intel profile to take a zero-new-media high-tier resource step: default high-tier infantry formation figures no longer allocate hidden fallback marker toppers after the shared T24 figure layer has replaced the slab/front/topper read.
- **What changed:** `src/tactical/T0-field-sandbox.js` adds `fld3dNeedsMarkerTopper()`, which skips marker-topper creation when `fldFfShowFor(u,g)` says T24 formation figures own the visible infantry marker read. The existing fallback remains lazy: `renderRich="off"` / `formationFigures="off"` restores the cube/cone topper, and low tier still creates no decorative topper while preserving slab/front/flag/pole readability. `tools/probe-formation-figures.mjs` now asserts the no-hidden-topper default plus fallback restoration; `tools/probe-intel-uhd617-profile.mjs` records/asserts the profile contract.
- **Contracts:** no new media, asset fetch, H2 video, runtime web dependency, Tripo action/credit/API call, playable battle, battle roster/OOB rewrite, combat model, save schema, bridge math, battle-output path, or `build/base.html` edit. This is presentation/resource-allocation-only T0/T24 marker polish.
- **Verification:** `node --check` passed for `src/tactical/T0-field-sandbox.js`, `tools/probe-formation-figures.mjs`, and `tools/probe-intel-uhd617-profile.mjs`; build **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the existing raw-embed soft warning. Focused `probe-formation-figures` passed **17/17, 0 pageerrors**; `probe-intel-uhd617-profile` passed **19/19** with high 8.33ms / 75 render calls / 142 objects and low 2.03ms / 84 render calls / 126 objects; adjacent `probe-visual-fidelity` passed **27/27, 0 pageerrors, 0 texture warnings**; `probe-media-budget` passed **6/6** with the known soft warning only. Key-aware JSON readback across counted artifacts found no `ok=false`, failed steps, `FATAL`, pageerrors, realErrors, or texture warnings. `git diff --check` passed.
- **Next:** continue Group 5 Phase H with another bounded zero-byte render/readability/perf slice while the raw embed tier remains above the soft warning, or surface the explicit media-budget/profile decision before adding real PD/surviving-colours/H2/HDRI/model media. M8 battle-build remains blocked pending Aaron go/no-go; Q5 Chattanooga, Atlanta/March, Franklin/Nashville, and Q6 USCT playable battles remain last.

## REMAINING-WORK PRIORITY LADDER REFRESH — 2026-07-02 (D207, DOCS-ONLY)
**D207 is a routing/docs/memory refresh, not a gameplay milestone.** It prioritizes all remaining queued work after D206 and updates the startup documents so future sessions begin from the same order.
- **Priority 1:** continue Group 5 Phase H with one more bounded zero-byte render/readability/perf polish slice guided by `tools/shots/probe-intel-uhd617-profile.json`.
- **Priority 2:** make an explicit media-budget/profile decision before any real surviving-colours/PD asset work, H2 footage, HDRI/model media, or optional-pack work.
- **Priority 3:** Group 6 meta/deferred tooling: reusable historical-data layer, source organization, hotpath profiling, embedded-media budget tooling.
- **Priority 4:** later Phase I Soldier's Story scale-out: citation-grade named bios/portraits/unit detail and richer career trajectory.
- **Priority 5:** GM/Transfer leftovers: Transfer only after honest `theater` fields; AI-GM-to-outcome wiring requires a separate no-fudge decision.
- **Priority 6:** battle-build last: M8 requires Aaron go/no-go; Chattanooga, Atlanta/March, Franklin/Nashville, and USCT playable battles remain last unless Aaron explicitly reorders.
- **Deferred/v2:** Phase D full hex tactical mode and custom-battle phase authoring/editor.
- **Contracts:** no code/data/generated HTML/media changed; no probes weakened; no battle-build approval granted; no media-budget approval granted.
- **Verification:** docs-only gate: `node tools/build.mjs`, `git diff --check`, and stale-routing scans after edit. No browser probe was needed because no runtime source/data changed.

## GROUP 5 · PHASE H LOW-TIER MARKER TOPPER RESOURCE POLISH — 2026-07-02 (D206, FOCUSED-GATED)
**The fourteenth Group 5 Phase H slice is complete.** D206 does not approve or start M8 battle-build work. It uses the D205 Intel profile to take a zero-new-media low-tier resource step: the low-quality 3D marker path no longer allocates the hidden decorative topper mesh/geometry that D205 already removed from the visible low-tier read.
- **What changed:** `src/tactical/T0-field-sandbox.js` adds `fld3dAddMarkerTopper()` and lazy-creates topper geometry only when a high-quality marker needs the non-color cube/cone fallback. Low-quality rebuilds now create no `topper` child; flag, pole, slab, and front strip remain visible. `tools/probe-intel-uhd617-profile.mjs` records `topperCount` and asserts high tier keeps shared topper fallback resources while low tier has no resident topper allocation.
- **Contracts:** no new media, asset fetch, H2 video, runtime web dependency, Tripo action/credit/API call, playable battle, battle roster/OOB rewrite, combat model, save schema, bridge math, battle-output path, or `build/base.html` edit. This is presentation/resource-allocation-only T0 marker polish.
- **Verification:** `node --check` passed for `src/tactical/T0-field-sandbox.js` and `tools/probe-intel-uhd617-profile.mjs`; build **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the existing raw-embed soft warning. Focused `probe-intel-uhd617-profile` passed **19/19** with high 7.92ms / 75 render calls / 148 objects and low 2.46ms / 84 render calls / 126 objects; adjacent `probe-formation-figures` passed **17/17, 0 pageerrors**; `probe-visual-fidelity` passed **27/27, 0 pageerrors, 0 texture warnings**; `probe-media-budget` passed **6/6** with the known soft warning only. Key-aware JSON readback across counted artifacts found no `ok=false`, failed steps, `FATAL`, pageerrors, realErrors, or texture warnings; high/visual-fidelity screenshots were visually checked. `git diff --check` and `node tools/build.mjs --check` passed.
- **Next:** continue Group 5 Phase H with another bounded polish/media/perf slice, preferably zero-byte render/readability/perf polish while the raw embed tier remains above the soft warning. Tightly budgeted PD/surviving-colours asset work should happen only after an explicit media-budget/profile decision. Heavy footage/HDRI/model media remains optional-pack or explicit-budget only. M8 battle-build remains blocked pending Aaron go/no-go; Q5 Chattanooga, Atlanta/March, Franklin/Nashville, and Q6 USCT playable battles remain last.

## GROUP 5 · PHASE H LOW-TIER MARKER TOPPER PERF POLISH — 2026-07-02 (D205, FOCUSED-GATED)
**The thirteenth Group 5 Phase H slice is complete.** D205 does not approve or start M8 battle-build work. It uses the D204 Intel profile to take another zero-new-media marker performance step: low-quality 3D unit markers now hide the decorative white cube/cone topper while preserving slab/front/flag/pole readability.
- **What changed:** `src/tactical/T0-field-sandbox.js` hides the base marker topper whenever the active 3D quality is low. `src/tactical/T24-formation-figures.js` adds `fldFfApplyLowMarkerTrim()` and reapplies that same trim after the low/off fallback path restores marker visibility. `tools/probe-intel-uhd617-profile.mjs` now records flag/pole/topper state and asserts low tier keeps flag/pole visible while trimming only the topper.
- **Contracts:** no new media, asset fetch, H2 video, runtime web dependency, Tripo action/credit/API call, playable battle, battle roster/OOB rewrite, combat model, save schema, bridge math, battle-output path, or `build/base.html` edit. This is presentation/performance-only T0/T24 marker polish.
- **Verification:** `node --check` passed for `src/tactical/T0-field-sandbox.js`, `src/tactical/T24-formation-figures.js`, and `tools/probe-intel-uhd617-profile.mjs`; build **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the existing raw-embed soft warning. Focused `probe-intel-uhd617-profile` passed **19/19** with high 9.98ms / 75 render calls / 148 objects and low 1.94ms / 84 render calls / 134 objects; adjacent `probe-formation-figures` passed **17/17, 0 pageerrors**; `probe-visual-fidelity` passed **27/27, 0 pageerrors, 0 texture warnings**; `probe-media-budget` passed **6/6** with the known soft warning only. JSON readback across counted artifacts found no `ok=false`, failed steps, `FATAL`, pageerrors, realErrors, or texture warnings. `git diff --check` and `node tools/build.mjs --check` passed.
- **Next:** continue Group 5 Phase H with another bounded polish/media/perf slice, preferably zero-byte render/readability/perf polish while the raw embed tier remains above the soft warning. Tightly budgeted PD/surviving-colours asset work should happen only after an explicit media-budget/profile decision. Heavy footage/HDRI/model media remains optional-pack or explicit-budget only. M8 battle-build remains blocked pending Aaron go/no-go; Q5 Chattanooga, Atlanta/March, Franklin/Nashville, and Q6 USCT playable battles remain last.

## GROUP 5 · PHASE H ATMOSPHERIC SMOKE DRAW-RANGE PERF POLISH — 2026-07-02 (D204, FOCUSED-GATED)
**The twelfth Group 5 Phase H slice is complete.** D204 does not approve or start M8 battle-build work. It uses the D203 Intel profile to take another zero-new-media T16 performance step: the 3D gunsmoke point cloud now draws only active smoke particles instead of the full 200-slot buffer.
- **What changed:** `src/tactical/T16-atmospherics.js` initializes `atmoSmoke` hidden with draw range `0`, then sets `geometry.drawRange` and `visible` from the live active particle count every frame. `tools/probe-atmospherics.mjs` locks the active-particle draw-range contract while preserving smoke spawn, fog secrecy, reduce-motion/off suppression, seed stability, and texture-warning checks. `tools/probe-intel-uhd617-profile.mjs` records/asserts the smoke draw range in the Intel profile artifact.
- **Contracts:** no new media, asset fetch, H2 video, runtime web dependency, Tripo action/credit/API call, playable battle, battle roster/OOB rewrite, combat model, save schema, bridge math, battle-output path, or `build/base.html` edit. This is presentation/performance-only T16 atmospherics polish.
- **Verification:** `node --check` passed for `src/tactical/T16-atmospherics.js`, `tools/probe-atmospherics.mjs`, and `tools/probe-intel-uhd617-profile.mjs`; build **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the existing raw-embed soft warning. Focused `probe-atmospherics` passed **20/20, 0 pageerrors, 0 texture warnings**; profile `probe-intel-uhd617-profile` passed **18/18** with high 8.93ms / 75 render calls / 148 objects / 111 smoke points and low 1.34ms / 92 render calls / 134 objects / 43 smoke points; adjacent `probe-weather` passed **30/30, 0 pageerrors, 0 texture warnings**; `probe-media-budget` passed **6/6** with the known soft warning only; `probe-visual-fidelity` passed **27/27, 0 pageerrors, 0 texture warnings**. JSON readback across counted artifacts found no `ok=false`, failed steps, `FATAL`, pageerrors, realErrors, or texture warnings. `git diff --check` and `node tools/build.mjs --check` passed.
- **Next:** continue Group 5 Phase H with another bounded polish/media/perf slice, preferably zero-byte render/readability/perf polish while the raw embed tier remains above the soft warning. Tightly budgeted PD/surviving-colours asset work should happen only after an explicit media-budget/profile decision. Heavy footage/HDRI/model media remains optional-pack or explicit-budget only. M8 battle-build remains blocked pending Aaron go/no-go; Q5 Chattanooga, Atlanta/March, Franklin/Nashville, and Q6 USCT playable battles remain last.

## GROUP 5 · PHASE H HIDDEN PEG-FALLBACK RESOURCE POLISH — 2026-07-02 (D203, FOCUSED-GATED)
**The eleventh Group 5 Phase H slice is complete.** D203 does not approve or start M8 battle-build work. It uses the D202 Intel profile to take another zero-new-media resource step: when T24 formation figures replace the slab, T21 no longer keeps the older peg-rank fallback resident as hidden `vfPegs`.
- **What changed:** `src/tactical/T21-visual-fidelity.js` now builds peg ranks only when the slab fallback is actually needed. Default high-tier infantry with T24 formation figures gets no resident `vfPegs`; `formationFigures="off"` still restores visible peg fallback; low tier still gates pegs out. `tools/probe-visual-fidelity.mjs`, `tools/probe-formation-figures.mjs`, and `tools/probe-intel-uhd617-profile.mjs` lock those contracts.
- **Contracts:** no new media, asset fetch, H2 video, runtime web dependency, Tripo action/credit/API call, playable battle, battle roster/OOB rewrite, combat model, save schema, bridge math, battle-output path, or `build/base.html` edit. This is presentation/resource-allocation-only T21/T24 visual-layer polish.
- **Verification:** `node --check` passed for `src/tactical/T21-visual-fidelity.js`, `tools/probe-visual-fidelity.mjs`, `tools/probe-formation-figures.mjs`, and `tools/probe-intel-uhd617-profile.mjs`; build **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the existing raw-embed soft warning; focused `probe-visual-fidelity` passed **27/27, 0 pageerrors, 0 texture warnings** and screenshots were visually checked. Adjacent `probe-formation-figures` passed **17/17, 0 pageerrors**; `probe-intel-uhd617-profile` passed **16/16** with high 9.39ms / 75 render calls / 148 objects and low 1.19ms / 92 calls / 134 objects; `probe-tripo-unit-assets` passed **15/15, 0 pageerrors**; `probe-media-budget` passed **6/6** with the known soft warning only. JSON readback across counted artifacts found no `ok=false`, failed steps, `FATAL`, pageerrors, realErrors, or texture warnings. `git diff --check` passed.
- **Next:** continue Group 5 Phase H with another bounded polish/media/perf slice, preferably zero-byte render/readability/perf polish while the raw embed tier remains above the soft warning. Tightly budgeted PD/surviving-colours asset work should happen only after an explicit media-budget/profile decision. Heavy footage/HDRI/model media remains optional-pack or explicit-budget only. M8 battle-build remains blocked pending Aaron go/no-go; Q5 Chattanooga, Atlanta/March, Franklin/Nashville, and Q6 USCT playable battles remain last.

## GROUP 5 · PHASE H BASE 3D MARKER GEOMETRY PERF POLISH — 2026-07-02 (D202, FOCUSED-GATED)
**The tenth Group 5 Phase H slice is complete.** D202 does not approve or start M8 battle-build work. It uses the D201 Intel profile to take another zero-new-media resource/performance step: share immutable base 3D unit-marker geometries while preserving per-unit material state.
- **What changed:** `src/tactical/T0-field-sandbox.js` adds `fld3dUnitMarkerResources()` and reuses slab/front/ring/pole/topper geometries for every unit marker during a 3D rebuild. Materials remain per unit so side color, T18 casualty fade/routing opacity, flags, and selected/fading ring behavior cannot leak across brigades. `tools/probe-intel-uhd617-profile.mjs` records and asserts the marker geometry-sharing contract in high and low profile scenes. `tools/probe-render-richness.mjs` extends the per-scene wrapper timeout to 240s after the 120s local wrapper cut off a real rich-3D run on this 8 GB Mac; assertions were not weakened.
- **Contracts:** no new media, asset fetch, H2 video, runtime web dependency, Tripo action/credit/API call, playable battle, battle roster/OOB rewrite, combat model, save schema, bridge math, battle-output path, or `build/base.html` edit. This is presentation/resource-allocation-only T0 marker polish.
- **Verification:** `node --check` passed for `src/tactical/T0-field-sandbox.js`, `tools/probe-intel-uhd617-profile.mjs`, and `tools/probe-render-richness.mjs`; build **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the existing raw-embed soft warning; focused `probe-intel-uhd617-profile` passed **15/15** with high 8.45ms / 75 render calls / 154 objects and low 3.81ms / 92 calls / 134 objects. Adjacent `probe-render-richness` passed **31/31, 0 pageerrors, 0 texture warnings**; `probe-visual-fidelity` passed **26/26, 0 pageerrors, 0 texture warnings**; `probe-formation-figures` passed **17/17, 0 pageerrors**; `probe-presets` passed **26/26, 0 pageerrors**; `probe-media-budget` passed **6/6** with the known soft warning only. JSON readback across counted artifacts found no `ok=false`, failed steps, `FATAL`, pageerrors, realErrors, or texture warnings. `git diff --check` passed.
- **Next:** continue Group 5 Phase H with another bounded polish/media/perf slice, preferably zero-byte render/readability/perf polish while the raw embed tier remains above the soft warning. Tightly budgeted PD/surviving-colours asset work should happen only after an explicit media-budget/profile decision. Heavy footage/HDRI/model media remains optional-pack or explicit-budget only. M8 battle-build remains blocked pending Aaron go/no-go; Q5 Chattanooga, Atlanta/March, Franklin/Nashville, and Q6 USCT playable battles remain last.

## GROUP 5 · PHASE H RENDER-RICHNESS SELECTION-RING PERF POLISH — 2026-07-02 (D201, FOCUSED-GATED)
**The ninth Group 5 Phase H slice is complete.** D201 does not approve or start M8 battle-build work. It uses the D200 Intel profile to take another zero-new-media render-cost polish step: keep selected-unit rings readable, but stop drawing opacity-zero idle rings for every unit marker.
- **What changed:** `src/tactical/T18-render-richness.js` now visibility-culls idle/dead/final-faded 3D selection rings and restores them only for selected units or active casualty fades. `tools/probe-render-richness.mjs` locks idle-ring culling, selected-ring visibility, fade behavior, sim invariance, and bounded scene progress/timeout behavior. `tools/probe-intel-uhd617-profile.mjs` records/asserts idle selection-ring culling in both high and low profile scenes.
- **Contracts:** no new media, asset fetch, H2 video, runtime web dependency, Tripo action/credit/API call, playable battle, battle roster/OOB rewrite, combat model, save schema, bridge math, battle-output path, or `build/base.html` edit. This is presentation/performance-only T18 render-richness polish.
- **Verification:** `node --check` passed for `src/tactical/T18-render-richness.js`, `tools/probe-render-richness.mjs`, and `tools/probe-intel-uhd617-profile.mjs`; build **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the existing raw-embed soft warning; focused `probe-render-richness` passed **31/31, 0 pageerrors, 0 texture warnings** and the 3D screenshot was visually checked. Adjacent `probe-media-budget` passed **6/6** with the known soft warning only; `probe-intel-uhd617-profile` passed **14/14** with high 10.14ms / 75 render calls / 154 objects and low 1.74ms / 92 calls / 134 objects; `probe-visual-fidelity` passed **26/26, 0 pageerrors, 0 texture warnings**; `probe-formation-figures` passed **17/17, 0 pageerrors**; `probe-presets` passed **26/26, 0 pageerrors**. JSON readback across counted artifacts found no `ok=false`, failed steps, `FATAL`, pageerrors, realErrors, or texture warnings. `git diff --check` passed.
- **Next:** continue Group 5 Phase H with another bounded polish/media/perf slice, preferably zero-byte render/readability/perf polish while the raw embed tier remains above the soft warning. Tightly budgeted PD/surviving-colours asset work should happen only after an explicit media-budget/profile decision. Heavy footage/HDRI/model media remains optional-pack or explicit-budget only. M8 battle-build remains blocked pending Aaron go/no-go; Q5 Chattanooga, Atlanta/March, Franklin/Nashville, and Q6 USCT playable battles remain last.

## GROUP 5 · PHASE H FORMATION-FIGURES PERF POLISH — 2026-07-02 (D200, FOCUSED-GATED)
**The eighth Group 5 Phase H slice is complete.** D200 does not approve or start M8 battle-build work. It uses the D199 Intel profile to take another zero-new-media render-cost polish step: keep high-tier miniature infantry formations, but stop paying five instanced meshes per brigade for them.
- **What changed:** `src/tactical/T24-formation-figures.js` now owns one shared scene-level `ffFormationLayer` with five `InstancedMesh` layers (bodies, heads, kepis, rifles, bayonets). Unit groups keep only a lightweight `ffFormation` marker and slot metadata; live infantry update their assigned instance block, while off/low/GLB-hidden units clear their slots and restore the correct slab/GLB fallback. `tools/probe-formation-figures.mjs` now locks the shared-layer contract, pose/readability behavior, off/low fallback, screenshot, and zero pageerrors. `tools/probe-intel-uhd617-profile.mjs` records/asserts shared formation-figure mode and no longer warns when this intended high-tier optimization makes high render calls lower than low-tier slab fallback.
- **Contracts:** no new media, asset fetch, H2 video, runtime web dependency, Tripo action/credit/API call, playable battle, battle roster/OOB rewrite, combat model, save schema, bridge math, battle-output path, or `build/base.html` edit. This is presentation/performance-only T24 polish over the existing high-tier formation-figure seam.
- **Verification:** `node --check` passed for `src/tactical/T24-formation-figures.js`, `tools/probe-formation-figures.mjs`, and `tools/probe-intel-uhd617-profile.mjs`; build **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the existing raw-embed soft warning; focused `probe-formation-figures` passed **17/17, 0 pageerrors** and the high-tier screenshot was visually checked. Adjacent `probe-media-budget` passed **6/6** with the known soft warning only; `probe-intel-uhd617-profile` passed **13/13** with high 7.36ms / 83 render calls / 154 objects and low 2.32ms / 100 calls / 134 objects; `probe-tripo-unit-assets` passed **15/15, 0 pageerrors**; `probe-visual-fidelity` passed **26/26, 0 pageerrors, 0 texture warnings**; `probe-presets` passed **26/26, 0 pageerrors**. JSON readback across counted artifacts found no `ok=false`, failed steps, `FATAL`, pageerrors, realErrors, or texture warnings. `git diff --check` passed.
- **Next:** continue Group 5 Phase H with another bounded polish/media/perf slice, preferably zero-byte render/readability/perf polish while the raw embed tier remains above the soft warning. Tightly budgeted PD/surviving-colours asset work should happen only after an explicit media-budget/profile decision. Heavy footage/HDRI/model media remains optional-pack or explicit-budget only. M8 battle-build remains blocked pending Aaron go/no-go; Q5 Chattanooga, Atlanta/March, Franklin/Nashville, and Q6 USCT playable battles remain last.

## GROUP 5 · PHASE H VISUAL-FIDELITY CONTACT-SHADOW PERF POLISH — 2026-07-02 (D199, FOCUSED-GATED)
**The seventh Group 5 Phase H slice is complete.** D199 does not approve or start M8 battle-build work. It uses the D198 media/profile readout to take a zero-new-media T21 render-cost polish step instead of adding asset bytes while the raw embed tier remains above the soft warning budget.
- **What changed:** `src/tactical/T21-visual-fidelity.js` now renders contact shadows through one shared scene-level `vfShadowLayer` `InstancedMesh` instead of one `vfShadow` child mesh per brigade. Each unit group stores a shadow instance index; live visible units update their shadow matrix, and dead/fog-hidden/off instances are parked at zero scale. `tools/probe-visual-fidelity.mjs` now locks the instanced shadow layer, ground gap, positive shadow scale, low-tier peg gating, off-switch, and byte-identity burst. `tools/probe-intel-uhd617-profile.mjs` records and asserts instanced shadows in high and low profile scenes.
- **Contracts:** no new media, asset fetch, H2 video, runtime web dependency, Tripo action, playable battle, battle roster/OOB rewrite, combat model, save schema, bridge math, battle-output path, or `build/base.html` edit. This is presentation/performance-only visual-fidelity polish over the existing T21 seam.
- **Verification:** `node --check` passed for `src/tactical/T21-visual-fidelity.js`, `tools/probe-visual-fidelity.mjs`, and `tools/probe-intel-uhd617-profile.mjs`; build **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the existing raw-embed soft warning; focused `probe-visual-fidelity` passed **26/26, 0 pageerrors, 0 texture warnings** and the 3D screenshot was visually checked. Adjacent `probe-media-budget` passed **6/6** with the known soft warning only; `probe-intel-uhd617-profile` passed **12/12** with high 9.57ms / 108 render calls / 178 objects and low 2.38ms / 100 calls / 134 objects; `probe-h0-tactical-hud` passed **3/3, 0 pageerrors**. JSON readback across counted artifacts found no `ok=false`, failed steps, `FATAL`, pageerrors, realErrors, or texture warnings. `probe-formation-figures` and `probe-render-richness` were attempted as extra adjacent checks but both hung before writing fresh artifacts and were stopped with exit 130, so neither is counted.
- **Next:** continue Group 5 Phase H with another bounded polish/media/perf slice, preferably zero-byte render/readability/perf polish while the raw embed tier remains above the soft warning. Tightly budgeted PD/surviving-colours asset work should happen only after an explicit media-budget/profile decision. Heavy footage/HDRI/model media remains optional-pack or explicit-budget only. M8 battle-build remains blocked pending Aaron go/no-go; Q5 Chattanooga, Atlanta/March, Franklin/Nashville, and Q6 USCT playable battles remain last.

## GROUP 5 · PHASE H TERRAIN OVERLAY PERF POLISH — 2026-07-02 (D198, FOCUSED-GATED)
**The sixth Group 5 Phase H slice is complete.** D198 does not approve or start M8 battle-build work. It uses the D197 media/profile readout to take a zero-new-media terrain overlay performance step instead of adding asset bytes while the raw embed tier remains above the soft warning budget.
- **What changed:** `src/tactical/T22-terrain-readability.js` now lazy-builds optional 3D terrain overlays: default Hillshade carries no resident contour or hypsometric overlay geometry, while selected Contours/Color-by-height modes build on demand and still revert cleanly. `tools/probe-terrain-readability.mjs` now locks the no-resident-default behavior plus selected-mode rendering, legend/hover, lifecycle, low-tier trimming, and sim-stability gates. `tools/probe-intel-uhd617-profile.mjs` records overlay residency and asserts the default high/low profile scene does not prebuild optional overlays.
- **Contracts:** no new media, asset fetch, H2 video, runtime web dependency, Tripo action, playable battle, battle roster/OOB rewrite, combat model, save schema, bridge math, battle-output path, or `build/base.html` edit. This is a presentation/performance-only terrain overlay polish over the existing T22 seam.
- **Verification:** `node --check` passed for `src/tactical/T22-terrain-readability.js`, `tools/probe-terrain-readability.mjs`, and `tools/probe-intel-uhd617-profile.mjs`; build **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the existing raw-embed soft warning; focused `probe-terrain-readability` passed **29/29, 0 pageerrors**. Adjacent `probe-media-budget` passed **6/6** with the known soft warning only; `probe-intel-uhd617-profile` passed **11/11** with high 10.16ms / 115 render calls / 185 objects and low 2.77ms / 107 calls / 141 objects; `probe-visual-fidelity` passed **26/26, 0 pageerrors, 0 texture warnings**; `probe-h0-tactical-hud` passed **3/3, 0 pageerrors**. JSON readback across counted artifacts found no `ok=false`, failed steps, `FATAL`, pageerrors, realErrors, or texture warnings. `git diff --check` passed.
- **Next:** continue Group 5 Phase H with another bounded polish/media/perf slice, preferably zero-byte render/readability/perf polish while the raw embed tier remains above the soft warning. Tightly budgeted PD/surviving-colours asset work should happen only after an explicit media-budget/profile decision. Heavy footage/HDRI/model media remains optional-pack or explicit-budget only. M8 battle-build remains blocked pending Aaron go/no-go; Q5 Chattanooga, Atlanta/March, Franklin/Nashville, and Q6 USCT playable battles remain last.

## GROUP 5 · PHASE H BATTLE COLOURS HUD READABILITY POLISH — 2026-07-02 (D197, FOCUSED-GATED)
**The fifth Group 5 Phase H slice is complete.** D197 does not approve or start M8 battle-build work. It uses the green D196 media/profile readout to take a zero-new-media flags HUD polish step instead of adding surviving-colours asset bytes while the raw embed tier remains above the soft warning budget.
- **What changed:** `src/tactical/T10-flags.js` now renders the selected-unit battle-colours readout as a bounded labelled card with a larger 58x37 flag image, stronger contrast, escaped title/caption/corps text, wrapping-safe readable text, a clearer corps-badge row, and a readable pre-March-1863 badge-adoption note. `tools/probe-flags.mjs` now locks the HUD card structure, ARIA label, image size, readable/wrapping text, historical flag/corps gates, and seed/sim invariance across a profile-scale 45-frame render burst.
- **Contracts:** no new media, asset fetch, real surviving-colours photo ingestion, H2 video, runtime web dependency, Tripo action, playable battle, battle roster/OOB rewrite, combat model, save schema, bridge math, or battle-output path. This is presentation-only tactical HUD polish over the existing procedural T10 flag and corps-badge seam.
- **Verification:** `node --check` passed for `src/tactical/T10-flags.js` and `tools/probe-flags.mjs`; build **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the existing raw-embed soft warning; focused `probe-flags` passed **39/39, 0 pageerrors** with no texture warnings. Adjacent `probe-media-budget` passed **6/6** with the known soft warning only; `probe-intel-uhd617-profile` passed **10/10** with high 9.66ms / 115 render calls / 195 objects and low 1.94ms / 107 calls / 144 objects; `probe-h0-tactical-hud` passed **3/3, 0 pageerrors**. JSON readback across counted artifacts found no `ok=false`, failed steps, pageerrors, realErrors, or texture warnings. `probe-formation-figures` was attempted but hung before a fresh artifact and is not counted.
- **Next:** continue Group 5 Phase H with another bounded polish/media/perf slice, preferably zero-byte render/readability/perf polish or tightly budgeted PD asset work only if the media budget/profile stays green. Heavy footage/HDRI/model media remains optional-pack or explicit-budget only. M8 battle-build remains blocked pending Aaron go/no-go; Q5 Chattanooga, Atlanta/March, Franklin/Nashville, and Q6 USCT playable battles remain last.

## GROUP 5 · PHASE H H2 CUTAWAY READABILITY POLISH — 2026-07-02 (D196, FOCUSED-GATED)
**The fourth Group 5 Phase H slice is complete.** D196 does not approve or start M8 battle-build work. It uses the green D195 media/profile readout to take another zero-new-media polish step instead of adding asset bytes while the raw embed tier remains above the soft warning budget.
- **What changed:** `src/104-h2-cutaways.js` now makes the skippable H2 field-cutaway shell more phone-safe: viewport-clamped card width/height, contained scrolling, clamp-based still/procedural-frame heights, 42px controls, larger note/footer/caption text, border-box caption wrapping, mobile first-screen alignment, ARIA labelling via the title/subtitle, and key-handler cleanup so Escape listeners do not linger after close. `tools/probe-h2-cutaways.mjs` now locks desktop and 390px phone layout metrics, caption sizing, touch targets, horizontal-overflow absence, focus return, and zero pageerrors.
- **Contracts:** no new media, asset fetch, video tag, iframe, runtime web dependency, H2 moving-image enablement, Tripo action, playable battle, battle roster/OOB rewrite, combat model, save schema, bridge math, battle-output path, or `build/base.html` edit. H2 still uses existing embedded PD scene stills or local procedural fallback only; real footage remains locked pending per-asset provenance, dignity/anachronism review, captions/credits, explicit budget decision, and probe updates.
- **Verification:** `node --check` passed for `src/104-h2-cutaways.js` and `tools/probe-h2-cutaways.mjs`; build **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the existing raw-embed soft warning; focused `probe-h2-cutaways` passed **9/9, 0 pageerrors** with desktop and phone JSON metrics. Adjacent `probe-media-budget` passed **6/6** with the known soft warning only; `probe-intel-uhd617-profile` passed **10/10** with high 12.24ms / 115 render calls / 195 objects and low 2.00ms / 107 calls / 144 objects; `probe-h0-battle-briefing` passed **3/3, 0 pageerrors**. Key-aware JSON readback across the focused/adjacent artifacts found no `ok=false`, no actual `FATAL`, no pageerrors, no realErrors, and no texture warnings. `git diff --check` passed.
- **Next:** continue Group 5 Phase H with another bounded polish/media/perf slice, preferably tightly budgeted surviving-colours/PD asset polish only if the media budget/profile stays green, or another zero-byte render/readability polish. Heavy footage/HDRI/model media remains optional-pack or explicit-budget only. M8 battle-build remains blocked pending Aaron go/no-go; Q5 Chattanooga, Atlanta/March, Franklin/Nashville, and Q6 USCT playable battles remain last.

## GROUP 5 · PHASE H AUDIO/READABILITY POLISH — 2026-07-02 (D195, FOCUSED-GATED)
**The third Group 5 Phase H slice is complete.** D195 does not approve or start M8 battle-build work. It uses the D194 Intel UHD-617 profile to pick a zero-new-media polish slice rather than adding asset bytes while the raw embed tier remains above the soft warning budget.
- **What changed:** `src/tactical/T9-audio.js` now gives the field Audio dialog a bounded scrollable `#fldAudioPanelCard`, 32px+ segmented controls, a larger Done button, focus return to the toolbar Audio button, and a more readable caption box with fixed line-height, stronger border/contrast, viewport-bounded width, and border-box wrapping. `src/tactical/T19-battle-ambience.js` matches the Battle ambience On/Off row to the same 32px+ target size. `tools/probe-audio-ambience.mjs` now locks desktop and phone panel containment, row/button count, min button height, focus handoff/return, caption viewport fit, caption readable sizing, and zero pageerrors. `civil_war_generals.html` rebuilt from source.
- **Contracts:** no new media, asset fetch, external dependency, H2 video, Tripo action, playable battle, battle roster/OOB rewrite, combat model, save schema, bridge math, or battle-output path. Audio remains presentation-only: default-off ambience, reduceMotion suppression, no `fldRng`, and seed-for-seed tactical presets unchanged.
- **Verification:** `node --check` passed for `src/tactical/T9-audio.js`, `src/tactical/T19-battle-ambience.js`, and `tools/probe-audio-ambience.mjs`; build **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the existing raw-embed soft warning; focused `probe-audio-ambience` passed **27/27, 0 pageerrors** with clean JSON readback. Adjacent `probe-media-budget` passed **6/6** with the known soft warning only; `probe-intel-uhd617-profile` passed **10/10** with high 9.37ms / 115 render calls / 195 objects and low 2.09ms / 107 calls / 144 objects; `probe-h0-tactical-hud` passed **3/3, 0 pageerrors**; `probe-accessibility` passed **25 steps, 0 pageerrors**; `probe-presets` passed **26 steps, 0 pageerrors** including the seed-for-seed byte-identity guard. JSON readback found no `ok=false`, no `FATAL`, no pageerrors, no realErrors, and no texture warnings. `git diff --check` passed.
- **Next:** continue Group 5 Phase H with another bounded polish/media/perf slice: tightly budgeted surviving-colours/PD asset polish only if media-budget/profile gates stay green, or another zero-byte render/readability polish. M8 battle-build remains blocked pending Aaron go/no-go; Q5 Chattanooga, Atlanta/March, Franklin/Nashville, and Q6 USCT playable battles remain last.

## GROUP 5 · PHASE H INTEL UHD-617 PROFILE READOUT — 2026-07-01 (D194, FOCUSED-GATED)
**The second Group 5 Phase H slice is complete.** D194 does not approve or start M8 battle-build work. It turns the Intel UHD-617 floor into an executable readout before further media polish.
- **What changed:** `data/media-budget.json` now has a `performanceProfile` block for the Intel UHD Graphics 617 / 8 GB RAM floor and a rule to run the profile before adding more core media while the raw embed tier is above the soft warning budget. New `tools/probe-intel-uhd617-profile.mjs` launches the built single-file game in Chrome, records embedded asset footprint, WebGL renderer info, high/low 3D launch and render-burst timings, render calls, scene object counts, pixel nonblank checks, low-tier formation/peg gating, pageerrors, and Three.js texture warnings. `tools/vet-no-regression.mjs` enrolls the probe for the next release battery. `civil_war_generals.html` rebuilt from source because the media-budget data changed.
- **Profile evidence:** local Chrome used the actual `ANGLE (Intel, ANGLE Metal Renderer: Intel(R) UHD Graphics 617, Unspecified Version)` renderer. Chickamauga high tier measured 3407.9ms launch, 9.92ms average proxy frame burst, 115 render calls, and 195 scene objects. Low tier measured 343ms launch, 2.48ms average proxy frame burst, 107 calls, 144 objects, `fldLow:true`, and formation figures gated out. Embedded core remains 199 files / 2.418 MB raw; generated HTML is about 7.023 MB.
- **Contracts:** no playable battle, tactical scenario, OOB rewrite, combat model, save schema, H2 video enablement, runtime web dependency, external asset fetch, account/trial/download, or Tripo action. Timing values are advisory/warning-only because headless browser mode can vary; structural low-tier gates and pageerror/texture-warning checks are hard.
- **Verification:** JSON parse passed for `data/media-budget.json`; `node --check` passed for the new profile probe and suite file; build **GATE OK** with the existing raw-embed soft warning; focused `probe-intel-uhd617-profile` passed **10/10** with the expected raw-embed soft warning only. Adjacent `probe-media-budget` passed **6/6**, `probe-h2-cutaways` passed **5 steps, 0 pageerrors**, and `probe-formation-figures` passed **16/16, 0 pageerrors**. Artifact readback found no `ok=false`, no `FATAL`, no pageerrors, no realErrors, no texture warnings, and no failed steps. `git diff --check` passed.
- **Next:** continue Group 5 Phase H with a bounded polish/media/perf slice guided by the profile artifact: audio/readability polish or tightly budgeted surviving-colours/PD asset polish. M8 battle-build remains blocked pending Aaron go/no-go; Q5 Chattanooga, Atlanta/March, Franklin/Nashville, and Q6 USCT playable battles remain last.

## GROUP 5 · PHASE H MEDIA BUDGET GUARD — 2026-07-01 (D193, FOCUSED-GATED)
**The first Group 5 Phase H slice is complete.** D193 did not approve or start M8 battle-build work. It adds an executable media-budget guard before any footage/heavy-asset step.
- **What changed:** new `data/media-budget.json` records the single-file core policy, optional-HD-pack boundary, raw embed caps, H2 video lock, Tripo lock, and the no-battle-build lock. New `tools/probe-media-budget.mjs` measures `assets/embed/**`, checks the data policy against `tools/build.mjs` caps, rejects undeclared embedded categories/video files, verifies H2 moving-image slots remain disabled, and writes `tools/shots/probe-media-budget.json`. `tools/vet-no-regression.mjs` enrolls the probe for the next release battery. `civil_war_generals.html` was rebuilt from source after the new data file entered `GAME_DATA`.
- **Measured footprint:** 199 embedded files, 2,535,463 raw bytes / 2.418 MB. Category counts: portraits 156, leaders 20, scenes 6, USCT 7, weapons 8, artillery 2. This is above the existing 1.5 MB soft warning but below the 3.0 MB hard cap and new 2.75 MB review-warning guard.
- **Contracts:** no playable battle, tactical scenario, OOB rewrite, combat model, save schema, H2 video enablement, runtime web dependency, external asset fetch, account/trial/download, or Tripo action. H2 video remains disabled pending per-asset provenance, anachronism/dignity review, captions/credits, explicit budget decision, and probe updates.
- **Verification:** JSON parse passed for media-budget/footage-cutaways/manifest; `node --check` passed for the new probe and suite file; build **GATE OK** with the existing raw-embed soft warning; focused `probe-media-budget` passed **6/6** with one expected soft warning. Adjacent `probe-h2-cutaways` passed **5 steps, 0 pageerrors** and `probe-scenes-imagery` passed **16/16, 0 pageerrors**. Artifact readback found no `ok=false`, no `FATAL`, no pageerrors, no realErrors, and no failed steps. `git diff --check` passed.
- **Next:** continue Group 5 Phase H with a bounded slice such as surviving-colours/PD asset polish, audio polish, or Intel UHD-617 profiling. M8 battle-build remains blocked pending Aaron go/no-go; Q5 Chattanooga, Atlanta/March, Franklin/Nashville, and Q6 USCT playable battles remain last.

## GROUP 4 · BATCH/RELEASE NO-REGRESSION GATE — 2026-07-01 (D192, RELEASE-GATED)
**The planned Group 4 release checkpoint is complete.** This milestone changed only the logistics probe harness and live-status docs; no game source, data, generated HTML, battle roster, combat model, save schema, or historical content changed.
- **Harness repair:** the first `npm run vet:noreg` segment passed build/import/boot/strategic probes through production, then stopped at `probe-logistics-rail` after Playwright's default 30s screenshot timeout wrote `ok=false`. `tools/probe-logistics-rail.mjs` now uses the repo's slow-Mac pattern: 120s screenshot timeout, bounded browser-close cleanup, and explicit nonzero exit on failed JSON. No assertions were weakened.
- **Verification:** `node --check tools/probe-logistics-rail.mjs` passed. Focused `probe-logistics-rail` passed **8 steps, 0 pageerrors**. Resumed `npm run vet:noreg -- --from="logistics rail"` completed with **VET NO-REGRESSION OK - 92 commands**; combined with the initial segment, the full 104-command battery was covered. A 104-file `tools/shots/*.json` scan found `bad=0` with no `ok=false`, `FATAL`, pageerrors, or realErrors. Classic diag ended `nonBlank:346`, `m3dActive:false`, with only the known filtered 404 console lines.
- **Next:** D171 fresh-chat boundary. Surface the next execution decision in a fresh prompt: M8 battle-build go/no-go packet or proceed to Group 5 Phase H polish/media/perf. Do not start M8 battle-build without Aaron go/no-go; Q5 Chattanooga, Atlanta/March, Franklin/Nashville, and Q6 USCT playable battles remain last.

## GROUP 4 · WESTERN-THEATER STRATEGIC READOUTS — 2026-07-01 (D191, FOCUSED-GATED)
**Western-theater strategic readouts** ship as bounded Group 4 non-battle War Effort/H0 Desk and Theater Map readouts. No playable battle, tactical OOB, roster, casualty/winner/scoreboard, battle-output, or combat-model path changed.
- **Data and surface:** `data/western-theater.json` adds citation-guarded current-arc cards for Shiloh, Vicksburg, and Chickamauga; strategic hinges for river/rail war, Chickamauga-to-Chattanooga reversal, Atlanta/election pressure, and Franklin/Nashville collapse; and locked future labels for Chattanooga, Atlanta/March, Franklin/Nashville, and USCT at Nashville. `src/73-western-theater.js` renders the War Effort/H0 Desk block and a Theater Map readout by aggregating existing campaign ledgers instead of creating a new priority lever.
- **Contracts:** `westernTheaterBridgeBonus()` returns exact zero and is not consumed by the battle bridge. The system writes only `C.westernTheater.lastTurn` and the capped `C.westernTheater.log`; it does not mutate stats, morale, production, manpower, hard-war, tactical, OOB, winner, casualty, scoreboard, or direct overall state. No future battle JSON was created.
- **Wiring:** manifest, lifecycle init/resolve, base/H0 President's Desk rendering, Theater Map rendering, focused probe, and later-batch suite enrollment are wired through guarded seams.
- **Verification:** JSON parse passed for western-theater/manifest; `node --check` passed for touched source/probe/suite files; `node tools/build.mjs` printed **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the existing raw-embed soft-budget warning and rebuilt generated HTML from source. Focused `probe-western-theater` passed **8 steps, 0 pageerrors**. Adjacent `probe-human-cost` passed **7 steps, 0 pageerrors**; `probe-bridge` passed **6 steps, 0 pageerrors**; `probe-h0-president-desk` passed **3/3, 0 pageerrors**. JSON artifact readback found no `ok=false`, no `FATAL`, and no pageerrors. `git diff --check` passed. Full no-regression then became the planned Group 4 batch/release gate under D176, completed as D192.
- **Next:** planned Group 4 batch/release gate unless Aaron redirects. M8 battle-build track still needs Aaron go/no-go; Q5 Chattanooga, Atlanta/March, Franklin/Nashville, and Q6 USCT playable battles remain last.

## GROUP 4 · HUMAN COST WITH GRAVITY TREATMENT — 2026-07-01 (D190, FOCUSED-GATED)
**The human-cost-with-gravity treatment** ships as a bounded Group 4 non-battle War Effort readout. No playable battle, tactical OOB, roster, casualty/winner/scoreboard, battle-output, or combat-model path changed.
- **Data and surface:** `data/human-cost.json` adds citation-guarded scale anchors for the traditional 620,000 death count, Hacker's roughly 750,000 demographic revision, a 650,000-850,000 uncertainty range, disease deaths, mourning/cemeteries/pensions, and Faust work-of-death framing. `src/72-human-cost.js` renders the War Effort/H0 Desk ledger by aggregating existing campaign ledgers instead of creating a new priority lever.
- **Contracts:** `humanCostBridgeBonus()` returns exact zero and is not consumed by the battle bridge. The system writes only `C.humanCost.lastTurn` and the capped `C.humanCost.log`; it does not mutate stats, morale, medical, prisoner, hard-war, irregular-war, tactical, OOB, winner, casualty, scoreboard, or direct overall state.
- **Wiring:** manifest, lifecycle init/resolve, H0 President's Desk, focused probe, and later-batch suite enrollment are wired through guarded seams. Focused probing caught and fixed a recursive readout bug: human-cost snapshots now read stored public-will/casualty values instead of calling `moraleCompute()` from the readout path.
- **Verification:** JSON parse passed for human-cost/manifest; `node --check` passed for touched source/probe/suite files; `node tools/build.mjs` printed **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** with the existing raw-embed soft-budget warning and rebuilt generated HTML from source. Focused `probe-human-cost` passed **7 steps, 0 pageerrors**. Adjacent `probe-disease-medical` wrote a green artifact **8 steps, 0 pageerrors** and was manually stopped only after a post-artifact wrapper hang; `probe-bridge` passed **6 steps, 0 pageerrors**; `probe-h0-president-desk` passed **3/3, 0 pageerrors**. JSON artifact readback found no `ok=false`, no `FATAL`, and no pageerrors. `git diff --check` passed. Full no-regression is deferred under D176.
- **Then-next, now shipped as D191:** Western-theater strategic readouts. Current next item is the planned Group 4 batch/release gate unless Aaron redirects. M8 battle-build track still needs Aaron go/no-go; Q5 Chattanooga, Atlanta/March, Franklin/Nashville, and Q6 USCT playable battles remain last.

## GROUP 4 · REAL DIPLOMACY SYSTEM — 2026-07-01 (D189, FOCUSED-GATED)
**The real diplomacy system** ships as a bounded Group 4 non-battle War Effort and Diplomacy-tab system. No playable battle, tactical OOB, roster, casualty/winner/scoreboard, battle-output, or direct combat model path changed.
- **Data and surface:** `data/diplomacy.json` adds `realDiplomacy` with sourced crises, priorities, and debate framing for Mason/Slidell recognition work, the Trent Affair, 1862 mediation pressure, Laird rams, the Russian fleet, and King Wheat vs cotton diplomacy. `src/71-real-diplomacy.js` renders the War Effort block, extends the existing blockade diplomacy tab, sanitizes save state lazily, and exposes guarded init/priority/bridge/resolve hooks.
- **Contracts:** inactive bridge bonus exact zero. Active priorities are side-filtered, capped, and can never add direct `overall`. Resolve writes only diplomacy ledgers plus strategic blockade recognition, `clock.intervention`, `clock.capital`, neutral goodwill, commerce pressure, and crisis pressure.
- **Wiring:** manifest, President render/H0 Desk, blockade diplomacy-tab wiring, lifecycle init/resolve, and battle bridge are extended through guarded seams. `tools/probe-real-diplomacy.mjs` locks schema/source coverage, exact-zero default, side filtering, active caps, strategic resolve effects, save sanitation, UI toggle wiring, and no battle-queue leakage. `tools/vet-no-regression.mjs` enrolls the focused probe for the later batch/release gate.
- **Verification:** JSON parse passed for diplomacy/manifest; `node --check` passed for touched source/probe/suite files; `node tools/build.mjs` printed **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** and rebuilt generated HTML from source. Focused `probe-real-diplomacy` passed **8 steps, 0 pageerrors**. Adjacent `probe-blockade` passed **11 steps, 0 pageerrors**, `probe-bridge` passed **6 steps, 0 pageerrors**, and `probe-h0-president-desk` passed **3/3, 0 pageerrors**. JSON readback found no `ok=false`, no `FATAL`, and no pageerrors. `git diff --check` passed. Full no-regression is deferred under D176.
- **Then-next, now shipped as D190/D191:** human-cost-with-gravity treatment and Western-theater strategic readouts. Current next item is the planned Group 4 batch/release gate unless Aaron redirects. M8 battle-build track still needs Aaron go/no-go; Q5 Chattanooga + Q6 USCT playable battles remain last.

## GROUP 4 · CS FINANCE TOOLKIT — 2026-07-01 (D188, FOCUSED-GATED)
**The Confederate finance toolkit** ships as a bounded Group 4 non-battle War Effort system. No playable battle, tactical OOB, roster, casualty/winner/scoreboard, battle-output, or direct combat model path changed.
- **Data and surface:** `data/cs-finance.json` adds five `Verified` finance instruments with source guards: Erlanger loan, cotton bonds, produce loan, impressment, and printing spiral. `src/69-cs-finance.js` renders the War Effort toolkit and debate cards, sanitizes save state lazily, and exposes guarded init/priority/bridge/resolve hooks.
- **Contracts:** CS-only; US side inert; inactive bridge bonus exact zero. Active priorities are capped and costly, can never add direct `overall`, and feed only strategic finance ledgers, funds/debt/cotton/impressment/civilian pressure, inflation, and capital pressure. Erlanger remains one-shot/reduced on repeat.
- **Wiring:** manifest, President render/H0 Desk, economy-tab wiring, lifecycle init/resolve, and battle bridge are extended through guarded seams. `tools/probe-cs-finance.mjs` locks schema/source coverage, the corrected Erlanger numbers, exact-zero default, active caps, resolve effects, save sanitation, UI toggle wiring, and no battle-queue leakage. `tools/vet-no-regression.mjs` enrolls the focused probe for the later batch/release gate.
- **Reference cleanup:** `HISTORICAL-DATA-ECONOMY.md` now separates Erlanger's 77 buy price / 90 public offer from Confederate net proceeds and holds the corrected roughly £1.4M / ~45% of face guardrail instead of the stale 72% shortcut.
- **Verification:** JSON parse passed for CS finance/economy/manifest; `node --check` passed for touched source/probe/suite files; `node tools/build.mjs` printed **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** and rebuilt generated HTML from source. Focused `probe-cs-finance` passed **8 steps, 0 pageerrors**. Adjacent `probe-economy` passed **8 steps, 0 pageerrors**, `probe-bridge` passed **6 steps, 0 pageerrors**, and `probe-h0-president-desk` passed **3/3, 0 pageerrors**. JSON readback found no `ok=false`, no `FATAL`, and no pageerrors. `git diff --check` passed. Full no-regression is deferred under D176.
- **Then-next, now shipped as D189/D190/D191:** real diplomacy, human-cost, and Western-theater strategic readouts. Current next item is the planned Group 4 batch/release gate unless Aaron redirects. M8 battle-build track still needs Aaron go/no-go; Q5 Chattanooga + Q6 USCT playable battles remain last.

## GRADUATE-HISTORY PASS — M7 LIVED-SLAVERY + BLACK COMBAT AGENCY — 2026-07-01 (D187, FOCUSED-GATED)
**M7 of the authorized graduate-seminar history build-out** ships lived-slavery and Black combat-agency readouts as pure teaching/readout content. No combat model, OOB, save, bridge behavior, resolve, victory, economy math, or battle-output path changed.
- **Primary-source lane:** `data/primary-sources.json` gains a **Lived slavery & resistance** category and 2 `Verified` records with ≥2 sources each and ≤60-word exact excerpts: Harriet Jacobs on enslaved women and Fountain Hughes on pass control / auction sale. Source critiques name Jacobs's publication/editing context and Hughes's 1949 oral-history/interviewer/transcription limits.
- **Codex readouts:** `data/codex.json` adds `slavery-as-lived-institution` and `black-combat-agency`, deepens `united-states-colored-troops`, and cross-links secession, contraband, emancipation economics, the 54th Massachusetts, and the USCT manpower system. The Black combat-agency card covers Port Hudson, Battery Wagner, 1st Kansas / Poison Spring, the Crater, and New Market Heights while stating that playable USCT battle work remains a later queued milestone.
- **Probe locks:** `tools/probe-primary-sources.mjs` locks the M7 source lane and records; `tools/probe-codex.mjs` locks the new codex entries, source-critical tokens, related links, and USCT/cross-link updates.
- **Verification:** JSON parse passed for primary sources/codex; `node --check` passed for touched source/probe files; `node tools/build.mjs` printed **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** and rebuilt generated HTML from source. Focused probes passed: `probe-primary-sources` **14 steps, 0 pageerrors** and `probe-codex` **23 steps, 0 pageerrors**. Adjacent `probe-h0-president-desk` passed **3/3, 0 pageerrors**. JSON readback found no `ok=false`, no `FATAL`, and no pageerrors. `git diff --check` passed. Full no-regression is deferred under D176.
- **Next:** CS finance toolkit, then real diplomacy system, human-cost-with-gravity, Western-theater strategic readouts, and the planned batch/release gate. M8 battle-build track still needs Aaron go/no-go; Q5 Chattanooga + Q6 USCT playable battles remain last.

## DOCS PRIORITY REFRESH — 2026-07-01 (D186, DOCS-ONLY)
**D186 aligns the live routing docs after D185.** The immediate next task is M7 lived-slavery + Black combat-agency. After M7, the proper priority order is CS finance toolkit, real diplomacy system, human-cost-with-gravity treatment, Western-theater strategic readouts, then the planned batch/release gate. M8 remains blocked pending Aaron go/no-go because it would pull battle-build work forward; Q5 Chattanooga, Atlanta/March, Franklin/Nashville, and Q6 USCT playable battles remain last.
- **Updated docs:** `START-HERE.md`, `AUTONOMOUS-RUN.md`, `HANDOFF.md`, `WAKE-UP.md`, `V1-CHECKLIST.md`, `DECISIONS.md`, `RUN-LOG.md`, `CLAUDE.md`, and `.clinerules`.
- **Contract:** docs-only. No source/data/generated HTML changes, no gameplay/simulation/save/bridge/tactical/OOB/economy math changes, and no full `npm run vet:noreg` tax for a documentation refresh.
- **Verification:** `node tools/build.mjs` GATE OK; `git diff --check` clean.

## GRADUATE-HISTORY PASS — M6 HOME-FRONT POLITICS/ECONOMY — 2026-07-01 (D185, FOCUSED-GATED)
**M6 of the authorized graduate-seminar history build-out** ships home-front politics/economy readouts as pure teaching/readout content. No combat model, OOB, save, bridge behavior, resolve, victory, economy math, or battle-output path changed.
- **Primary-source lane:** `data/primary-sources.json` gains a **Home front, politics & economy** category and 2 `Verified` records with ≥2 sources each and ≤60-word exact excerpts: Lincoln's August 23, 1864 blind memorandum and the February 25, 1862 Legal Tender Act. The source notes preserve transcription/locator limits and name the Legal Tender exceptions rather than overstating greenbacks as unrestricted hard money.
- **Codex readouts:** `data/codex.json` adds `war-finance-civics`, `womens-home-front-labor`, `emancipation-economic-revolution`, and `ex-parte-milligan`; updates `election-of-1864` with Wade-Davis/Radical pressure, the blind memorandum, soldier vote, and emancipation/Black-soldier platform stakes; and cross-links greenbacks, habeas, and emancipation to the new readouts.
- **Economy readout:** `src/40-economy.js` keeps the finance model unchanged but sharpens the Treasury why-it-mattered card around Union bonds/taxes/printing/legal tender/National Banking and the Confederate printing/Currency Reform collapse.
- **Probe locks:** `tools/probe-primary-sources.mjs`, `tools/probe-codex.mjs`, `tools/probe-economy.mjs`, and `tools/probe-h0-president-desk.mjs` lock the M6 source lane, codex cards, Treasury readout, and H0 Desk reachability.
- **Verification:** JSON parse/word-cap/related-link smoke passed for primary sources/codex; `node --check` passed for touched source/probe files; `node tools/build.mjs` printed **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** and rebuilt generated HTML from source. Focused probes passed: `probe-primary-sources` **13 steps, 0 pageerrors**, `probe-codex` **22 steps, 0 pageerrors**, and `probe-economy` **8 steps, 0 pageerrors**. Adjacent `probe-h0-president-desk` passed **3/3, 0 pageerrors**. JSON readback found no `ok=false`, no `FATAL`, and no pageerrors. `git diff --check` passed. Full no-regression is deferred under D176.
- **Then-next, now shipped as D187:** M7 lived-slavery + Black combat-agency. M8 battle-build track still needs Aaron go/no-go; Q5 Chattanooga + Q6 USCT playable battles remain last.

## GRADUATE-HISTORY PASS — M5 KEYSTONE CARDS — 2026-07-01 (D184, FOCUSED-GATED)
**M5 of the authorized graduate-seminar history build-out** ships keystone cards as pure teaching/readout content. No combat model, OOB, save, bridge behavior, resolve, victory, or battle-output path changed.
- **Codex keystones:** `data/codex.json` gains two `Verified` entries. `second-founding` ties McPherson/Foner to greenbacks, conscription, contraband policy, emancipation, Reconstruction, and Douglass's July 6, 1863 Philadelphia enlistment speech while explicitly not misattributing the "brass letters U.S." phrase to "Men of Color, To Arms!" `age-of-emancipation` compares Britain 1830s compensated emancipation, Russia 1861 / roughly 23 million privately owned serfs, and U.S. wartime uncompensated emancipation driven by policy, self-emancipation, USCT service, and Black agency.
- **War Effort keystones:** `data/disease-medical.json` gains the Faust/Hacker work-of-death debate card; `data/irregular-war.json` gains a Fellman/Sutherland historiography card. `src/63-disease-medical.js` and `src/65-irregular-war.js` now render all debate cards in their existing details sections so the new cards are not dark data.
- **Probe locks:** `tools/probe-codex.mjs`, `tools/probe-disease-medical.mjs`, and `tools/probe-irregular-war.mjs` lock the M5 claims and visible rendering, including the corrected Douglass attribution, the corrected Russia ~23M guardrail, Faust/Hacker death-and-mourning terms, and Fellman/Sutherland irregular-war historiography.
- **Verification:** JSON parse passed for codex/disease/irregular/manifest; `node --check` passed for touched source/probe files; `node tools/build.mjs` printed **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** and rebuilt generated HTML from source. Focused probes passed: `probe-codex` **21 steps, 0 pageerrors**, `probe-disease-medical` **8 steps, 0 pageerrors**, and `probe-irregular-war` **8 steps, 0 pageerrors**. Adjacent probes passed: `probe-primary-sources` **12 steps, 0 pageerrors**, `probe-bridge` **6 steps, 0 pageerrors**, and `probe-h0-president-desk` **3/3, 0 pageerrors**. JSON readback found no `ok=false`, no `FATAL`, and no pageerrors. `git diff --check` passed. Full no-regression is deferred under D176.
- **Next:** M6 home-front/politics/economy. M8 battle-build track still needs Aaron go/no-go; Q5 Chattanooga + Q6 USCT playable battles remain last.

## GRADUATE-HISTORY PASS — M4 SOURCE-CRITICISM / UNDER-TOLD VOICES / NATIVE REWRITE — 2026-07-01 (D183, FOCUSED-GATED)
**M4 of the authorized graduate-seminar history build-out** ships source criticism, under-told voices, and the Native rewrite as a pure teaching/readout milestone. No combat model, OOB, save, resolve, victory, or battle-output path changed.
- **Primary-source lane:** `data/primary-sources.json` gains a **Source criticism & under-told voices** category and 5 `Verified` records with ≥2 sources each and ≤60-word excerpts: Gettysburg Address Bliss copy, Susie King Taylor's 1902 postwar critique, Dolly Lunt Burge's hard-war eyewitness/enslaver-language record, William McCarter's Irish Brigade memoir, and William Dwyer's Irish Brigade letter. `tools/probe-primary-sources.mjs` now locks the M4 category/records and exits red on failed JSON/browser assertions.
- **Codex:** `data/codex.json` gains Source Criticism, East Tennessee Unionism, and West Virginia Statehood. The East Tennessee entry explicitly separates Unionism from abolitionism and preserves the Brownlow pro-slavery guardrail. The West Virginia entry names the Willey Amendment and June 20, 1863 statehood. Irish Brigade now names McCarter's postwar immigrant-soldier memoir and Dwyer's contemporary immigrant-soldier letter. `tools/probe-codex.mjs` locks these claims and exits red on failed assertions.
- **Women / under-told perspectives:** `data/women-in-war.json` adds Mary Boykin Chesnut and Susie King Taylor as card-only `canMap:false` records; `src/38-women-in-war.js` adds role labels/colors; `tools/import-women-in-war.mjs` and `tools/probe-women-in-war.mjs` now expect 9 records, 8 Verified, 1 Disputed. `data/under-told-perspectives.json` upgrades Native nations to `Verified` from the M4 dossier while keeping the narrow-source note that forbids playable Trans-Mississippi battle/OOB work and Confederate-diversity claims. `src/66-under-told-perspectives.js` updates teaching copy and the women-lane count only.
- **Verification:** JSON parse passed for primary sources/codex/women/under-told; `node tools/import-women-in-war.mjs` passed **records=9 verified=8 disputed=1**; `node --check` passed for touched source/probe files; `node tools/build.mjs` printed **GATE OK · no-fudge ✓ · citations ✓ · women-in-war ✓** and rebuilt generated HTML from source. Focused `probe-primary-sources` passed **12 steps, 0 pageerrors** and `probe-under-told-perspectives` passed **8 steps, 0 pageerrors** after one probe-pattern punctuation fix. Adjacent probes passed: `probe-codex` **20 steps, 0 pageerrors**, `probe-women-in-war` **8 steps, 0 pageerrors**, and `probe-h0-president-desk` **3/3, 0 pageerrors**. JSON readback found no `ok=false`, no `FATAL`, and no pageerrors. `git diff --check` passed. Full no-regression is deferred under D176.
- **Next:** M5 keystone cards from the execution brief/audit. M8 battle-build track still needs Aaron go/no-go; Q5 Chattanooga + Q6 USCT playable battles remain last.

## GRADUATE-HISTORY PASS — M3 RECONSTRUCTION/MEMORY — 2026-07-01 (D182, FOCUSED-GATED)
**M3 of the authorized graduate-seminar history build-out** ships Reconstruction/memory content as a pure teaching readout. No combat model, OOB, save, bridge, resolve, victory, or battle-output path changed.
- **Primary-source lane:** `data/primary-sources.json` gains a **Reconstruction & memory** category and 3 `Verified` records with ≥2 sources each and ≤60-word verbatim excerpts: Mississippi Black Code apprenticeship law, Elias Hill's 1871 KKK testimony, and Frederick Douglass's "What the Black Man Wants." `src/68-primary-sources.js` adds matching fallback category metadata.
- **Codex/coda:** `data/codex.json` updates Reconstruction with the 13th/14th/15th amendment dates, Black Codes, 1871 Klan testimony, Jim Crow/Redemption enforcement context, and the Fifteenth certification caveat. The Lost Cause entry now pairs Pollard's 1866 naming/Resistance frame with Stephens's 1868-1870 postwar Constitutional View recast. `src/82-after-action.js` surfaces the amendment dates plus Black Codes/Klan terror in the Reconstruction coda.
- **Probe hardening:** `tools/probe-primary-sources.mjs` now locks the M3 lane and records; `tools/probe-codex.mjs` locks amendment dates and Pollard/Stephens memory manufacture; `tools/probe-afteraction.mjs` locks the coda dates and Black Codes/Klan terror. `probe-codex` navigation timeout moves 60s→90s after a local load-timeout false red, matching the existing slow-Mac browser-probe policy and leaving assertions intact.
- **Verification:** JSON parse passed for primary sources/codex/manifest; `node --check` passed for touched source/probe files; `node tools/build.mjs` printed **GATE OK · no-fudge ✓ · citations ✓** and rebuilt generated HTML from source. Focused `probe-primary-sources` passed **11 steps, 0 pageerrors**. Adjacent probes passed: `probe-codex` **19 steps, 0 pageerrors**, `probe-afteraction` **15 steps, 0 pageerrors**, and `probe-h0-after-action` **3/3, 0 pageerrors**. Focused/adjacent JSON readback found no `ok=false`, no `FATAL`, and no pageerrors. `git diff --check` passed. Full no-regression is deferred under D176.
- **Next:** M4 source-criticism + under-told voices + Native rewrite from the execution brief/audit/Native dossier; update `tools/probe-under-told-perspectives.mjs` in the same commit. M8 battle-build track still needs Aaron go/no-go; Q5 Chattanooga + Q6 USCT playable battles remain last.

## GRADUATE-HISTORY PASS — M2 READ THE DOCUMENT APPARATUS — 2026-07-01 (D181, FOCUSED-GATED)
**M2 of the authorized graduate-seminar history build-out** ships the primary-source apparatus and surfaces the dark manpower debate cards. Pure teaching read-out, D74 byte-identical by construction, anti-Lost-Cause.
- **Primary-source deck:** new `data/primary-sources.json` (`cw_primary_sources_v1`) with 8 `Verified` records and ≥2 sources each: Stephens Cornerstone, Mississippi secession declaration, Confederate Constitution, Hale to Magoffin, Cobb to Seddon, Emancipation Proclamation service clause, Douglass "Men of Color, To Arms!", and Gooding's equal-pay letter. Every excerpt is ≤60 words; every Confederate self-justification has a catalyst frame and repository/locator attribution.
- **Documents surface:** new `src/68-primary-sources.js` renders the **Documents / Read the Document** tab with search, category filters, expandable cards, source critique, source list, and scoped focus rings. `src/30-president-shell.js` and `src/99-h0-president-desk.js` wire the `sources` tab into the base and H0 desk shells. `src/00-manifest.json` registers the module before manpower.
- **Manpower scholarship surfaced:** `src/70-manpower.js` now renders `manpower-teaching.json` cards in **The Ranks** as consensus / scholarly dissent / Lost Cause claim named-and-countered / primary documents / takeaway. Replacement math, pools, and battle-conditioning inputs were not changed.
- **Probe/suite:** new `tools/probe-primary-sources.mjs` validates schema, word caps, Verified source counts, catalyst frames, shell dispatch, filters/search/expand, purity, XSS escaping, and a static scan that no combat/bridge/save path reads `primary-sources`. `tools/probe-manpower.mjs` now locks the rich debate block and has local 8 GB Mac navigation/screenshot timeout hardening only; assertions unchanged/strengthened. `tools/vet-no-regression.mjs` includes the new focused probe for the next batch gate.
- **Verification:** JSON parse passed for `data/primary-sources.json` and manifest; `node --check` passed for touched source/probe/suite files; build printed **GATE OK · no-fudge ✓ · citations ✓** and rebuilt generated HTML from source. Focused `probe-primary-sources` passed **10 steps, 0 pageerrors**. Adjacent probes passed: `probe-manpower` **9 steps, 0 pageerrors**, `probe-codex` **18 steps, 0 pageerrors**, and `probe-h0-president-desk` **3/3, 0 pageerrors**. Focused/adjacent JSON readback found no `ok=false`, no `FATAL`, and no pageerrors. `git diff --check` passed. Full no-regression is deferred under D176.
- **Next:** M3 Reconstruction/memory from `.tmp/civil-war-phd-execution-brief.md` and `.tmp/civil-war-history-audit-and-phd-plan.md`. M8 battle-build track still needs an Aaron go/no-go; Q5 Chattanooga + Q6 USCT playable battles remain last.


---

**ARCHIVE CUT (D412, 2026-07-16):** all entries dated 2026-06-30 and earlier were moved byte-verbatim to [`legacy/RUN-LOG-ARCHIVE-2026H1.md`](legacy/RUN-LOG-ARCHIVE-2026H1.md). This file keeps the current month; the cut advances at month boundaries during session closeout (HISTORY ARCHIVAL RULE, `START-HERE.md` §Naming convention).
