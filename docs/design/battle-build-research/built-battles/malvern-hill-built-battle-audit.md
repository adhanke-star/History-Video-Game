# Malvern Hill - Built-Battle Research Audit

**Status:** D328 durable research/audit of an already-built battle (docs only; no data/runtime change).
**Battle id:** malvernHill | **Current data:** data/malvernHill.json | **Prior hardening:** D92 + D92-verify (Hunt Col; Jackson Maj. Gen. not Lt. Gen.; Porter Brig. Gen.; Hooker Brig. Gen. reverted)
**Audit verdict:** SOLID_AS_IS (ratified by D328 adversarial pass)

The current build is source-accurate on every high-risk axis: commander ranks on July 1, 1862, the open-plateau (not-a-fortress) terrain framing, Hunt's massed-artillery lesson, Lee's failed two-grand-battery plan, Magruder's late/piecemeal attacks, the gunboat/Harrison's Landing context, and the lopsided casualty asymmetry. No source-backed revision is required.

## 1. Source Register

| Source | Use | URL | Confidence |
|---|---|---|---|
| American Battlefield Trust — Malvern Hill | Date, commanders, casualties (US ~2,100 / CS ~5,600), Union tactical victory, retreat to Harrison's Landing, open-ground terrain | https://www.battlefields.org/learn/civil-war/battles/malvern-hill | High |
| Wikipedia — Battle of Malvern Hill (OOB cross-check) | Union corps/division commanders (Porter, Sumner, Heintzelman, Couch, Franklin), CSA plan (Magruder/Jackson/D.H. Hill/Huger), Hunt's gun line | https://en.wikipedia.org/wiki/Battle_of_Malvern_Hill | High |
| Fitz John Porter — American Battlefield Trust / Wikipedia | Porter's rank sequence: Brig. Gen. (May 17, 1861) → Maj. Gen. of volunteers July 4, 1862 (i.e., Brig. Gen. on July 1) | https://www.battlefields.org/learn/biographies/fitz-john-porter | High |
| Joseph Hooker — Wikipedia / NPS | Hooker MG-of-volunteers rank date May 5, 1862 but promotion order issued July 26, 1862 — the source of the July 1 rank ambiguity | https://en.wikipedia.org/wiki/Joseph_Hooker | Medium |

## 2. Confirmed Solid

- **Date / place / roles** — July 1, 1862, Malvern Hill, Henrico County, VA near the James River; attacker=CS, defender=US. Confirmed by ABT and the OOB sources.
- **Jackson = Maj. Gen. (D92 fix holds)** — Correct. The CSA lieutenant-general grade did not exist until it was authorized Sept/Oct 1862; Jackson was promoted Lt. Gen. only in October 1862. Maj. Gen. is the correct July-1 rank. This is the classic backdated-rank trap, and the encoding avoids it.
- **Porter = Brig. Gen. (D92 fix holds)** — Correct. Porter's major-generalcy of volunteers is dated July 4, 1862; on July 1 he was still a brigadier general. Confirmed by ABT and Wikipedia.
- **Hunt encoded without an inflated rank (D92 "Hunt Col" holds)** — The reinforcement labels Hunt's batteries "the Artillery Reserve" and no card assigns him a general's star. Hunt was a **Colonel** commanding the Artillery Reserve at Malvern Hill (Brig. Gen. of volunteers only from Sept 15, 1862). Note: ABT's summary page loosely calls him "Brigadier General," which is the common error the D92 fix correctly avoided — do not "correct" the encoding toward that.
- **CSA division commanders / ranks** — Magruder (Maj. Gen.), Huger (Maj. Gen.), and D.H. Hill (Maj. Gen., implied by the center-assault role) all correct for the date. Whiting = Brig. Gen. correct (MG only Feb 1863).
- **US reinforcement ranks** — Kearny (Brig. Gen.; MG July 4, 1862), Meagher (Brig. Gen., Irish Brigade), both correct.
- **Whiting honesty fix** — The E52 note that Whiting's division sat in a support/artillery-cover posture on Lee's left and did **not** make a committed infantry assault is historically sound and avoids overstating Confederate infantry commitment.
- **Terrain framing** — "Not a fortress… a modest plateau with open fields of fire" matches ABT ("open ground rather than fortifications," crest of Malvern Hill, Crew house / West farm). Correct.
- **Teaching spine** — Hunt massing/shifting batteries + counter-battery fire; Lee/Longstreet's two-grand-battery plan wrecked by poor communication, brigade-attached batteries, and Union counter-battery fire; forward pointer to Gettysburg artillery. All well-supported.
- **Endnote outcome logic** — Union tactical victory that nonetheless preceded McClellan's retreat to Harrison's Landing ending the Peninsula Campaign. Confirmed by ABT. The anti-Lost-Cause framing (Union guns/infantry broke the attacks; Lee "saved Richmond only because McClellan retreated after winning the field") is accurate and non-mythologizing.

## 3. Revision Checklist For Codex

| Field/location | Current encoding | Issue | Corrected value | Source | Confidence |
|---|---|---|---|---|---|
| — | — | No revisions required — build is source-accurate. | — | — | — |

*(D328 adversarial pass: Section 3 was already empty; there were no revision flags to adjudicate, and the adversarial spot-check surfaced no missed error to add. See Verification Notes below.)*

## 4. OOB And Rank Re-Verification

- **Fitz John Porter (US, de facto field commander) — Brig. Gen. on July 1, 1862.** Confirmed; MG-of-volunteers only July 4, 1862. D92 fix holds.
- **Henry J. Hunt (US, Artillery Reserve) — Colonel on July 1, 1862.** Confirmed (Brig. Gen. only Sept 15, 1862). Encoding correctly assigns no general rank. D92 "Hunt Col" holds. Ignore ABT's loose "Brigadier General" label.
- **Thomas J. Jackson (CS) — Maj. Gen.** Confirmed; Lt. Gen. grade not created until autumn 1862. D92 fix holds.
- **John B. Magruder (CS) — Maj. Gen.** Confirmed.
- **Benjamin Huger (CS) — Maj. Gen.** Confirmed.
- **D.H. Hill (CS) — Maj. Gen.** Confirmed (center assault).
- **W.H.C. Whiting (CS) — Brig. Gen.** Confirmed (MG Feb 13, 1863).
- **Philip Kearny (US) — Brig. Gen.** Confirmed (MG July 4, 1862).
- **Thomas F. Meagher (US) — Brig. Gen.** Confirmed (Brig. Gen. commissioned Feb 3, 1862; led Irish Brigade).
- **Joseph Hooker (US) — encoded Brig. Gen. — VERIFY, do not revise.** Genuine ambiguity: Hooker's major-generalcy of volunteers carries a **rank date of May 5, 1862**, but the **promotion order was issued July 26, 1862**. Under the rank-actually-held-on-the-date test, he had not yet been ordered/commissioned MG as of July 1, so Brig. Gen. is defensible — and this is precisely the item D92-verify examined and deliberately reverted to Brig. Gen. Leave as-is; flagged only for the record.

## 5. Terrain And Teaching / Anti-Lost-Cause Check

- **Named ground accurate** — Malvern Hill plateau, James River proximity, Crew house / West farm, Crew-house ravine (Mahone repulsed), Willis Church / Carter's Mill Road axis all match the OOB sources. The "open slope / open fields of fire" characterization is correct.
- **Hunt gun-line card** — Sound; massing + ammunition-shifting + counter-battery emphasis is the historical mechanism, and the Gettysburg forward-reference is a legitimate teaching thread.
- **Grand-batteries card** — Accurate: Lee/Longstreet's crossfire plan failed on communication and brigade-attached artillery, not on any invented cause.
- **Anti-Lost-Cause framing** — Present and sound. The endnote credits Union artillery and infantry for the defensive win and explicitly notes Lee held the field only because McClellan withdrew — it does not romanticize the Confederate assault or launder the piecemeal-attack failure. No "gallant lost cause" gloss. No teaching-text factual error found.

## 6. D74 / D92 No-Fudge Adherence

No per-battle fudge detected. Confederate strength is committed piecemeal by design (staggered reinforcement `atSec` times: Magruder 105, Huger 150, D.H. Hill supporting batteries 170, Whiting 230 in a non-committed support posture), and the Union depth is fed forward (Hunt relief batteries at 95, Kearny 145, Hooker 210, Meagher 300 arriving ~7 p.m. after Sickles). Guns are expressed through the universal gun model (e.g., 10-gun groupings), not a hardcoded damage/casualty/winner value. The lopsided historical result is left to emerge from timing, open terrain, and Union artillery mass — outcomes-from-inputs, consistent with D74/D92. Casualty asymmetry appears as teaching, not as an output gate.

## 7. Remaining Uncertainties

- **Hooker's July-1 rank** — MG rank-date May 5 vs. promotion order July 26, 1862. Encoding's Brig. Gen. is defensible and already deliberated by D92-verify; a future pass could pin the exact commissioning/notification date from the Official Records if a definitive resolution is ever wanted.
- **Per-unit strengths and exact field minutes** — Marked Inferred (medium) in the provenance string; brigade-scale compression is a design choice, not a sourced claim. No action needed unless a strength-accuracy pass is scheduled.
- **Meagher/Irish Brigade "~7 p.m., after Sickles" timing** — Broadly supported but the precise arrival minute is Inferred; acceptable as encoded.
- **Truncated teaching/endnote tails** — The digest truncates the `mh_grand_batteries` body and the CS/CS endnote branch mid-sentence; this audit reviewed the visible text (sound). A full-string read of data/malvernHill.json is advisable before any edit, but nothing in the visible text flags a problem.

## 8. Audit Verdict

**SOLID_AS_IS** (ratified by the D328 adversarial verification pass). Every high-risk claim — Jackson Maj. Gen. (not Lt. Gen.), Porter Brig. Gen., Hunt as Colonel/Artillery Reserve, the open-plateau terrain, the failed grand-battery plan, and the casualty asymmetry with McClellan's subsequent retreat — verifies against reputable sources, and the D92-era fixes all still hold. The single genuine ambiguity (Hooker's rank) was already examined and reverted-to by D92-verify and remains defensible under the rank-held-on-the-date standard, so it is flagged for the record rather than sent for revision. No confirmed, source-backed error exists; Section 3 is intentionally empty. The adversarial pass independently re-verified Whiting (Brig. Gen. / MG Feb 13, 1863), Hunt (Colonel at Malvern Hill / Brig. Gen. Sept 15, 1862), and Meagher (Brig. Gen. from Feb 3, 1862) and found no missed error.

## Verification Notes (D328 adversarial pass)

**Sources fetched (this pass):**
- Wikipedia / Union Generals / Emerging Civil War on **Henry J. Hunt** — confirmed he was a **Colonel** commanding the Artillery Reserve at Malvern Hill and was promoted **Brig. Gen. of volunteers on Sept 15, 1862**. The encoding correctly assigns no general's star to Hunt.
- Wikipedia / TSHA on **W.H.C. Whiting** — confirmed **Brig. Gen. at Malvern Hill**, promoted **Maj. Gen. on Feb 13, 1863**. Encoding's "Brig. Gen. W. H. C. Whiting" is correct for the date.
- Wikipedia / Antietam-on-the-Web / Britannica on **Thomas F. Meagher** — confirmed **Brig. Gen. (commissioned Feb 3, 1862)** leading the Irish Brigade; correct as encoded.

**Flags CONFIRMED (require revision):** None. Section 3 contained no revision rows, so there was nothing to confirm.

**Flags REFUTED (would send Codex to break a correct fact):** None to refute — Section 3 was already empty. The adversarial concern (a false flag pushing a correct rank toward the wrong value, e.g. inflating Hunt to Brig. Gen. per ABT's loose label, or backdating Jackson to Lt. Gen.) did NOT materialize; the auditor had already resisted both traps.

**Missed errors found:** None. Spot-checks of three "confirmed solid" ranks (Hunt, Whiting, Meagher) all verified against reputable sources. The CSA-had-no-lieutenant-general-grade-before-Oct-1862 test was applied to Jackson and confirms Maj. Gen. as correct.

**Ratified verdict:** **SOLID_AS_IS.** The build is source-accurate; no revision should be sent to Codex.