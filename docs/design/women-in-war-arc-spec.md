# Women-in-War Playable Arc — Build Spec (M3, D385)

**Status:** CONTRACTED (D385). Runtime ships as D386 from this committed law.
**Lane:** COORDINATION.md LANE-003 (battle-ladder, Aaron's D382 set-1 lock: the M3 Women-in-War
playable arc follows playable Fort Donelson and precedes the Elkhorn Tavern non-Leetown spec).
**Design law honored:** D153 (the women's presentation lane NEVER collapses into `ss:`
replacements — ABSOLUTE), D74 (no combat fudge anywhere — this arc is presentation/journey only),
D92 (accurate inputs; here: accurate *sources*), D360 (nothing new rides the save), D382 set-1
(Edmonds/Cashier/Clayton + a Clara Barton arc), citation law (≥2 independent reputable sources =
Verified, else Inferred/Disputed; pension/muster records outrank memoirs; no invented service
records, engagements, wounds, or quotes).
**Research basis:** 9-agent workflow `wf_527a8c0d-3ed` (2026-07-12): 4 Sonnet/medium gathers →
4 Opus/high default-refutes → 1 Opus/high completeness critic; ~50 claim verdicts; every AMEND
and both TOP-LOOP adjudications below are binding on D386 player copy.

---

## 1 · The playable shape

The arc is an **interactive documented-chapter walk-through per figure**, rendered inside the
existing D153 Women in the War section of the Campaign Kit. Four figures carry arcs:

| Figure | Record | Record provenance | Arc title |
|---|---|---|---|
| Sarah Emma Edmonds | **NEW** `edmonds-sarah-emma` | Verified (spine) | The Two Wars of Emma Edmonds |
| Albert D. J. Cashier | existing `cashier-albert-d-j` | Verified (shipped) | Fifty Years as Albert Cashier |
| Frances Clayton | **NEW** `clayton-frances` | **Disputed** | The Photographs of Frances Clayton |
| Clara Barton | existing `barton-clara` | Verified (shipped) | The Angel and the Office |

Playability = chapter progression (a stepper: chapter list + Previous/Next, keyboard-first) plus
a **played-ground reflection**: a chapter tied to a battle the game models shows whether the
player's own war has already fought that ground (read-only derivation from existing campaign
state). No score, no reward, no combat effect — the arc is a journey/presentation seam.

**What the arc is NOT (forbidden acts, probe-enforced):** no `ss:` ids, no `replacePid`, no
`ssPersonRegistry` entry, no Soldier's Story journey start, no battle-launch control, no write to
`C`/`G`/save/localStorage, no combat/bridge/tactical read beyond the read-only reflection inputs,
no `_SAVE_VER`/E41/E50 touch, no new vet-suite enrollment (suite stays 125), no portrait claim for
any figure without an existing codex asset.

## 2 · Data contract (`data/women-in-war.json`, schema `cw_women_in_war_v1` unchanged)

Top-level keys stay exactly `_meta, schema, records` (the schema-validator row is untouched;
schema count stays 50). Two records are ADDED (9 → 11): `edmonds-sarah-emma` (Verified) and
`clayton-frances` (Disputed). Lane totals move 8 Verified / 1 Disputed → **9 Verified / 2
Disputed**. Exactly four records gain an optional `arc` block:

```
arc: {
  title:  <string ≤120>,
  intro:  <string 30-90 words>,
  stages: [ 4..8 of {
    title:           <string ≤120>,
    dateRange:       <string ≤80>,
    what:            <string 30-130 words, plain text, no markup>,
    stageProvenance: "Verified" | "Inferred" | "Disputed",
    gameBattleTie:   optional, one of the §3 allowlist keys,
    tieRegister:     REQUIRED iff gameBattleTie present: "documented" | "claimed",
    disputeNote:     REQUIRED iff stageProvenance === "Disputed" (≤600 chars),
    sourceRefs:      [ ≥1 zero-based indices into the record's sources array ]
  } ]
}
```

`tools/import-women-in-war.mjs` gains arc validation (same fail-closed style as the record
gates): shape/bounds above, allowlist membership, **the register law** (`tieRegister:
"documented"` is legal ONLY when `stageProvenance === "Verified"`; every non-Verified tied stage
MUST carry `"claimed"`), disputeNote presence, sourceRefs resolve in-range, forbidden keys
rejected everywhere (the existing deep scan already covers nested arcs).

## 3 · Battle-tie allowlist and the register law

| `gameBattleTie` (tactical key) | Classic id | Figures that tie there | Register |
|---|---|---|---|
| `bullrun1` | `bullrun1` | Edmonds (contested presence) | claimed |
| `malvernHill` | `malvern` * | Edmonds (regiment Verified; her duty single-source) | claimed |
| `antietam` | `antietam` | Barton (documented) · Edmonds (memoir-contradicted) | documented / claimed |
| `fredericksburg` | `fredericksburg` | Barton (documented) · Edmonds (single-source orderly) | documented / claimed |
| `fortDonelson` | `ftdonelson` | Clayton (newspaper claim only) | claimed |
| `stonesRiver` | `stonesriver` | Clayton (newspaper claim only) | claimed |
| `vicksburg` | `vicksburg` | Cashier (regiment/service documented) | documented |

\* D386 verifies each classic id against `build/base.html`'s `BATTLES` array at build time of the
probe (bullrun1/ftdonelson/shiloh confirmed in-repo; malvern's exact classic id must be read, not
assumed — if a classic id does not exist, the reflection simply reads the tactical career log
side only). **The register law is the arc's core honesty device:** a `documented` tie renders
"—— stood on this ground" plainly; a `claimed` tie renders a visually and textually distinct
treatment ("newspaper accounts place her here — no service record has been found" class wording)
and may NEVER render the documented treatment. Shared nodes carry per-figure registers
(Antietam: Barton documented beside Edmonds claimed — the contrast IS the teaching).

**Played-ground reflection (read-only):** a tied chapter shows one extra line when the player's
war has fought that ground — derived from `C.completed` (classic ids) and, when a Soldier's
Story journey is active, the journey career log battle ids/names via existing `lootInit` state.
READ-ONLY, best-effort, never persisted, no launch affordance.

## 4 · TOP-LOOP adjudications (binding; log = DECISIONS D385)

**4.1 Cashier naming/pronouns — AFFIRMED he/him under Albert D. J. Cashier** (consistent with
the shipped D153-lane record; changing it would relitigate a shipped decision without new
evidence). Grounds: ~50 years of continuous documented male life before, during, and after any
economic necessity; documented resistance to re-dressing at Watertown in 1914; voted, drew and
defended the pension, died and was buried as Albert D. J. Cashier with GAR honors under that
name. The historiographical split is SURFACED TO THE PLAYER as itself a documented fact, not
silently resolved: Blanton & Cook (*They Fought Like Demons*, LSU 2002) — the strongest academic
study of the ~240 documented women soldiers — classes Cashier among them and uses she/her under
the birth name; trans-history scholarship and public-history practice read the lifelong record
as a man's life; the comrades' own pension depositions mix pronouns within single testimonies.
No interior "why" may be authored — the record cannot establish it (Cashier's only first-person
background account, given in 1913 under dementia, is internally inconsistent). The birth name
appears once, as the enlistment-era historical fact, never as the primary name. The commonly
cited birth date (Dec 25, 1843) and surname Hodgers ship as *commonly-recorded tradition* — no
Irish birth/baptismal record has been located. **Correction to the shipped record:** playerCopy's
"Jennie **Irene** Hodgers" middle name is supported by none of the record's own cited sources —
D386 scrubs "Irene" (record correction, logged).

**4.2 Clayton framing register — DOCUMENTED MYSTERY, never implied-fraud, never confirmed
heroine.** Record ships Disputed (`roleCategory: "contested"`, the Velazquez precedent). What is
Verified: the photographic objects (Samuel Masury studio, Boston, ca. 1864-66 — AFTER the claimed
service; LOC Liljenquist Collection + Metropolitan Museum copies) and the fact that the story
circulated in period print. What is not: any service. The arc renders four evidence layers in
order — the claims (alias "Jack Williams," ~18 engagements, the husband killed at Stones River;
accounts internally contradictory, the husband's name variously Frank/Elmer/John; the oft-cited
"Fincher's Trades' Review, 1863" attribution itself unconfirmed) · the self-report conflicts (the
LOC catalog caption's service months don't sum — "4 mo. heavy artillery, Co. I / 13 mo., Cavalry
Co. A. / 22 months"; the LOC exhibit caption records wounds at Shiloh and Stones River while
newspaper summaries place a hip wound at Fort Donelson — the wound location is ITSELF a
self-report conflict and ships as one) · the negative-record search (Blanton & Cook's National
Archives search: no discharge, hospital, muster, or pension record under any claimed name, alias,
or husband's name in the claimed units) · the honest split (many historians: likely fabricated
for sympathy/profit; others: unverifiable — Missouri/Minnesota records are incomplete and an
undocumented alias cannot be ruled out). FORBIDDEN in Clayton copy: any first-person wound/combat
vignette rendered as fact, any on-screen husband death, any invented husband name/unit, the
REFUTED prop-uniform forensics ("non-standard jacket"/"officer's sword" class), and the
granular unit-nonexistence specifics (they reach this repo only through tertiary summaries —
ship the GENERIC negative finding, attributed to Blanton & Cook).

**4.3 Edmonds memoir wall.** The record ships Verified because the SPINE is beyond doubt —
enlistment as Franklin Thompson, Co. F, 2nd Michigan, Detroit, May 25, 1861 (NARA Prologue +
ABT); nurse/mail-carrier duties; the April 19, 1863 departure (malaria, denied furlough, fear of
discovery — carried on the rolls as desertion); H.R. 5335 (1884): "That Franklin Thompson and
Mrs. Sarah E. E. Seelye are one and the same person is established by abundance of proof and
beyond a doubt," the $12/month pension, the mid-1880s clearance steps (sources date them
differently — present as steps, never one clean sequence); GAR admission 1897; died Sept 5,
1898, La Porte, Texas. The MEMOIR LAYER ships stage-scoped Disputed with "her own account"
wording: the eleven spy missions (memoir-only; NPS: no official record — the NPS attribution,
NEVER the NARA Prologue, which does not discuss espionage: the workflow caught this exact
misattribution before it shipped); the Antietam presence (CONTRADICTED by the regimental record:
NPS Battle Units UMI0002RI/Dyer — "Duty in the Defences of Washington, D.C., September 3 to
October 11," no Antietam; + PBS History Detectives — verified in the main loop 2026-07-12); the
Second Manassas horse-killed/broken-leg injuries (memoir-derived, single secondary; NO wound may
ship as fact); the Williamsburg "picked up a musket" beat (memoir-only — drop or label); the
"175,000 copies" sales figure (popular-secondary only — ships hedged or not at all). First Bull
Run ships AS the documented dispute (NARA lists First Manassas among the regiment's battles; ABT
says she did not participate in the fighting but helped cover the retreat).

**4.4 Barton corrections (all binding on D386 copy).** The "Angel of the Battlefield" nickname
anchors to Dr. James L. Dunn's autumn-1862 letter, most famously tied to ANTIETAM — never "earned
at Cedar Mountain" (Cedar Mountain stays her first documented field battle, Aug 9, 1862). The
Antietam sleeve-bullet ships strictly as HER OWN ACCOUNT (first-person diary/writing; no
independent witness). The Missing Soldiers Office: opened at 437 Seventh St NW March 11, 1865;
63,182 letters; fates of 22,000+ identified; rediscovered by GSA carpenter Richard Lyons, Nov
1996; now operated by the National Museum of Civil War Medicine. The Andersonville stage MUST
carry the NPS myth-correction and the Atwater credit: Dorence Atwater secretly copied the death
register; the 1865 expedition was LED by Capt. James Moore; nearly 13,000 graves (12,912) were
identified by Atwater's list, captured Confederate records, and paroled prisoners' labor; Barton
raised the flag Aug 17, 1865 — she did NOT organize the expedition, did NOT personally identify
the graves, did NOT establish the cemetery (crediting her with those repeats a documented myth
and erases Atwater's labor — a dignity failure). The American Red Cross: founded May 21, 1881 —
sixteen years after the war, never compressed into it.

## 5 · Locked stage sets (titles/dates/provenance/ties; D386 authors the `what` copy under §4)

**Edmonds (8):** 1. Enlistment as Franklin Thompson — May 25, 1861 [Verified] · 2. First Bull
Run: the contested presence — Jul 21, 1861 [Disputed · tie bullrun1/claimed] · 3. The Peninsula
and the hospitals — Apr-Jul 1862 [Inferred · tie malvernHill/claimed] · 4. Second Manassas and
the Antietam claim — Aug-Sep 1862 [Disputed · tie antietam/claimed] · 5. Fredericksburg orderly —
Dec 1862 [Inferred · tie fredericksburg/claimed] · 6. The desertion — Apr 19, 1863 [Verified] ·
7. "Nurse and Spy": bestseller and embellishment — 1864-65 [Disputed] · 8. The pension act and
the GAR — 1884-1898 [Verified].

**Cashier (7):** 1. Ireland to Illinois — c. 1843-Aug 1862 [Inferred birth / Verified enlistment
→ stage ships Verified with tradition-hedged birth facts] · 2. Into the Army of the Tennessee —
1862-63 [Verified, "~40 engagements" as the regimental tally] · 3. Vicksburg — May-Jul 1863
[Verified · tie vicksburg/documented; the capture-and-escape anecdote INSIDE the stage labeled as
Sgt. C. W. Ives's postwar press recollection, no wartime record] · 4. Red River to muster-out —
1864-Aug 17, 1865 [Verified; detached to Banks — Fort DeRussy/Yellow Bayou, NOT
Mansfield/Pleasant Hill; lightly engaged at Nashville] · 5. Fifty years as Albert Cashier —
c. 1869-1911 [Verified; pension APPLIED 1890, initially refused, later granted] · 6. The accident
and the unmasking — 1911-1913 [Verified] · 7. Vindication, the asylum, and the uniform —
1913-Oct 10, 1915 [Verified; the board CONFIRMED the identity and continued the pension for life
(comrade depositions incl. Robert D. Hannah, Jan 24, 1915; Feb 1915 ruling); women's-ward
placement and forced dress Verified; the pinned-skirt resistance as "accounts describe";
uniformed burial, GAR honors, the headstone].

**Clayton (5, ALL claimed-register where tied):** 1. The claims — 1861-63 [Disputed] ·
2. Claimed: Fort Donelson — Feb 1862 [Disputed · tie fortDonelson/claimed; the wound-location
self-report conflict rendered as such] · 3. Claimed: Stones River and the husband — Dec 31,
1862-Jan 2, 1863 [Disputed · tie stonesRiver/claimed; the Frank/Elmer/John conflict presented,
no name invented] · 4. The Boston photographs — c. 1864-66 [Verified — the objects] · 5. The
pension quest and the verdict of the archives — 1863-65 and 2002-present [Disputed].

**Barton (8):** 1. The Patent Office clerk — 1854-61 [Verified] · 2. 1861: the Sixth
Massachusetts and Bull Run's aftermath — Apr-Jul 1861 [Verified; relief in WASHINGTON — no
bullrun1 tie, she was not on that field] · 3. Cedar Mountain to Second Bull Run — Aug 1862
[Verified] · 4. Antietam — Sep 17, 1862 [Verified · tie antietam/documented; sleeve-bullet as her
own account; the Dunn nickname anchored here] · 5. Fredericksburg: the Lacy House — Dec 1862
[Verified · tie fredericksburg/documented] · 6. The Sea Islands and the Army of the James —
1863-64 [Verified] · 7. The Missing Soldiers Office — Mar 11, 1865-1868 [Verified] ·
8. Andersonville, honestly — and the Red Cross — 1865/1881 [Verified; the §4.4 myth-correction
and Atwater credit are MANDATORY content].

## 6 · Source register (record-level rows authored in D386 from these; every load-bearing URL
workflow-fetched 2026-07-12; LOC endpoints bot-403 to plain fetch — retrieved by the workflow
agents, the D366 quod.lib class)

**Edmonds:** NARA Prologue Spring 1993 (Blanton), archives.gov/publications/prologue/1993/spring/women-in-the-civil-war-1.html
(also carries the CMSR/pension-file archival citations: CMSR Franklin Thompson RG 94; Enlisted
Branch file 3132 C 1884) · ABT battlefields.org/learn/biographies/sarah-emma-edmonds · NPS
nps.gov/people/sarah-emma-edmonds.htm (the "no official record" spy-mission language — the ONLY
legal attribution for that quote) · PBS History Detectives pbs.org/opb/historydetectives/technique/case-file-soldiers-in-skirts
(the Antietam contradiction + H.R. 5335 text) · NPS Battle Units UMI0002RI (2nd Michigan/Dyer
service record; main-loop verified). **Cashier:** the four SHIPPED record sources stand (NARA
Prologue; ABT albert-cashier; Clausius, *JISHS* 1958; Blanton & Cook pp. 174-175 non-independent)
+ arc-stage sources: HSQAC Parts I-II (hsqac.org) · NPR Illinois "Little Soldier, Big Mystery" ·
Kennesaw State Veteran Stories item 17 · OutHistory tgi-bios/albert-cashier (historiography) ·
Washington College Review 2019 (mixed-pronoun deposition analysis). The NPS Cashier article page
is a confirmed placeholder — NPS framing may NOT be cited. **Clayton:** LOC P&P item 2016646109
(Liljenquist; the months caption) · LOC exhibition portrait page (the Shiloh/Stones River wound
caption) · Met search/302391 · ABT battlefields.org/learn/biographies/frances-clayton (main-loop
verified 2026-07-12: "questioned by historians," "fabricated the story for money and fame," no
pension-outcome record) · Blanton & Cook, *They Fought Like Demons*, LSU 2002 (the generic
negative-search finding) · UVA Small Special Collections blog (smallnotes.library.virginia.edu,
2023-03-08 — the newspaper-claims layer ONLY, not the pension narrative). **Barton:** NPS people
page + NPS Chronology 1861-1869 (nps.gov/clba) · NPS Antietam clarabarton page · NPS
Andersonville bartonmyths page (MANDATORY for stage 8) + cb_and_andersonville · Clara Barton
Missing Soldiers Office Museum (clarabartonmuseum.org; civilwarmed.org) · American Red Cross
history page · GSA rediscovery record · Pfanz, *Clara Barton's Civil War* (Westholme) — the
speeches-vs-diary embellishment finding.

## 7 · Runtime contract (D386)

- **NEW `src/39-women-war-arc.js`** (manifest entry between `38-women-in-war.js` and
  `40-economy.js`): pure presentation — `wiwArcSectionHTML(r, C)` renders an arc disclosure per
  arc-bearing card; `wiwWireArcs(C)` wires the steppers. Chapter position lives in a module-local
  ephemeral map keyed by record id (dies with the page; never on `C`, never saved).
- **`src/38-women-in-war.js` guarded seam:** `_wiwCardHTML`/`wiwWireThread` call the 39-module
  fns through `typeof` guards — with 39 absent, or for records without `arc`, output is
  byte-identical to the shipped D153 rendering.
- **WCAG 2.2 AA (the T29 canonical disclosure pattern):** native `<button>` toggle with
  `aria-expanded`/`aria-controls`, the panel always in the DOM (`hidden` when closed), ≥24px
  target size, chapter list buttons with `aria-current="step"`, Prev/Next real buttons, the
  chapter body in an `aria-live="polite"` region, text contrast ≥4.5:1 on the existing palette,
  `#wiwThread` focus-visible CSS extended to buttons, zero animation (reduceMotion needs no gate),
  all text escaped through the existing `_wiwEsc`/`_wiwAttr` (XSS probe extends to arc fields).
- **Provenance chips per chapter** reuse the record-chip vocabulary (Verified green / Inferred
  brass / Disputed amber) — a Disputed chapter is visually distinct at a glance, and claimed-tie
  banners are styled distinctly from documented-tie banners (never color-alone: wording differs).

## 8 · Probe obligations (D386)

`tools/probe-women-in-war.mjs` (suite #51 slot, suite count stays 125) moves its locks with a
documented-history comment — D153 shipped 7 · the D183/M4 women-lane decision added Chesnut +
Taylor → 9 (8V/1D) · **D386 adds Edmonds (Verified) + Clayton (Disputed) → 11 (9V/2D)** — and
gains arc teeth: ARC DATA (exactly four arc records: edmonds/cashier/clayton/barton; stage
bounds; allowlist ties; the register law — every Clayton tie `claimed`; Barton
antietam/fredericksburg + Cashier vicksburg `documented`) · ARC UI (disclosure opens/closes with
aria-expanded; stepper navigates; aria-current moves; aria-live body updates; keyboard path) ·
ARC REGISTER (a claimed-tie chapter renders the claimed wording, never the documented wording —
asserted on Clayton fortDonelson) · ARC REFLECTION (mock `C.completed=["antietam"]` → Barton's
Antietam chapter shows the played line; empty → not shown) · ARC NO-OP (a record without `arc`
renders byte-identical card HTML; arc fns stubbed → thread renders the D153 baseline) · XSS (arc
fields escape; payload never reaches DOM) · names/registry non-leak lists grown to 11 (add
'sarah emma edmonds', 'frances clayton'). `data/under-told-perspectives.json` `women-d153-lane`
thread text and `tools/probe-under-told-perspectives.mjs` tooth move "9 records, 8 Verified and
1 Disputed" → "11 records, 9 Verified and 2 Disputed" in the SAME commit. Baselines that must
NOT move: 20 scenarios · schema 50 · Army Register 1281 · coverage 20 · suite 125.

## 9 · Gate sequence

**D385 (this commit):** node --check on `tools/probe-women-in-war-arc-plan.mjs` · `node
tools/build.mjs` GATE OK with generated HTML md5 UNCHANGED (`22e3ca1360a7260070b69301acea1348`) ·
plan probe green in planning mode · the negative bind (tamper one declared spec anchor → EXACTLY
its tooth red → md5-identical restore → rerun green) · all seven battle plan probes ALL OK ·
focused probe-women-in-war green at the 9-lock · `git diff --check` · docs sync · commit + push.

**D386:** node --check every touched JS/MJS + SETUP-string preparse (S-03 #8) · build GATE OK
(md5 moves once, byte count read) · importer canonical 11/9/2 · schema 50/50 · plan probe
integration mode fully green (fail-closed: half-registration reds it) · focused
probe-women-in-war green at the 11-lock with arc teeth, 0 pageerrors · probe-under-told-
perspectives green · adjacents probe-loot-survival 12/12 @1281 + probe-tactical-roster 8/8 @20 ·
runtime negative bind (stub `wiwArcSectionHTML` → exactly the declared arc teeth red →
md5-identical restore → green) · all seven battle plan probes ALL OK · `git diff --check` · docs
sync (DECISIONS D386 · RUN-LOG · HANDOFF top · WAKE-UP top · AUTONOMOUS-RUN §2 · START-HERE head ·
V1-CHECKLIST · COORDINATION lane) · commit + push. Serialized; `TMPDIR=$PWD/.tmp`;
`PW_TEST_SCREENSHOT_NO_FONTS_READY=1`; one Chrome at a time; READ every `tools/shots/*.json`.

## 10 · HALT triggers

Any pressure to touch `ss:`/save envelope/`_SAVE_VER`/E41/E50 · any service-record claim no
source defends · a count/pin drift beyond §8's declared moves · a gate red without in-scope root
cause · any Clayton copy drifting toward confirmed-heroine or implied-fraud register · any
Cashier copy authoring interior identity · any Barton copy crediting her with Atwater's work.
