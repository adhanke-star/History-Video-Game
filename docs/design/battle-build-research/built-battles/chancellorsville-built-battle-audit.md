# Chancellorsville - Built-Battle Research Audit

**Status:** D328 durable research/audit of an already-built battle (docs only; no data/runtime change).
**Battle id:** chancellorsville | **Current data:** data/chancellorsville.json | **Prior hardening:** D92 (Rodes Brig.Gen.; Fairview battery dead-Hazzard->Best; Paxton's Stonewall Bde re-attached to Colston's div; Berry III Corps)
**Audit verdict:** SOLID_AS_IS (ratified by D328 adversarial pass)

The current build is source-accurate. Every encoded rank, reinforcement, terrain reference, and teaching claim I checked holds against reputable sources, and the D92 rank/attachment fixes remain correct on the battle date. No confirmed revision is required.

## 1. Source Register

| Source | Use | URL | Confidence |
|---|---|---|---|
| Wikipedia — Robert E. Rodes | Rodes rank on May 2 1863 (brig. gen.; MG backdated to May 2 but carried out May 6/7) | https://en.wikipedia.org/wiki/Robert_E._Rodes | High |
| Wikipedia — Amiel Weeks Whipple | Whipple brig. gen., 3rd Div III Corps; mortally wounded May 4, died May 7, posthumous/deathbed MG only | https://en.wikipedia.org/wiki/Amiel_Weeks_Whipple | High |
| American Battlefield Trust — Chancellorsville battle facts | Casualties (US 17,304 / CS 13,460), Sedgwick's VI Corps at Fredericksburg, Jackson friendly-fire wounding May 2, Anderson's division on Plank Road | https://www.battlefields.org/learn/civil-war/battles/chancellorsville | High |
| American Battlefield Trust — Jackson's Flank Attack, May 2 1863 (map) | ~28,000-29,400 men, flank march distance (~15 mi cited), XI Corps rout | https://www.battlefields.org/learn/maps/chancellorsville-jacksons-flank-attack-may-2-1863 | High |
| Britannica — Battle of Chancellorsville | Overall phase sequence, dates, Hooker/Lee framing | https://www.britannica.com/event/Battle-of-Chancellorsville | Med-High |
| Encyclopedia Virginia — Chancellorsville Campaign | Campaign framing, Sedgwick at Marye's Heights, casualty weight | https://encyclopediavirginia.org/entries/chancellorsville-campaign/ | High (cite-pending, canonical) |

## 2. Confirmed Solid

- **Rodes as Brig. Gen. (D92 fix) — CORRECT.** Robert E. Rodes led the flank attack on May 2 as a brigadier general; his major-general promotion (recommended by Jackson on his deathbed) was backdated to May 2 but not carried out by Lee until May 6/7 — i.e., AFTER the attack. Encoding him as a brigadier on the battle date is the disciplined, correct choice. The D92 fix holds. (Re-fetched this pass — confirmed.)
- **Maj. Gen. Richard H. Anderson — CORRECT and notable.** Encoded as major general. Anderson was promoted MG in July 1862; he did not become a lieutenant general until May 1864 (First Corps after Longstreet's wounding). The CSA had no lieutenant-general grade at all before October 1862, so a Lt. Gen. encoding for May 1863 would be doubly wrong. The ABT page's prose anachronistically calls him "Lt. Gen." — the digest's "Maj. Gen." is the rank-at-battle-correct value. This is a good rank-discipline catch confirming the build, not a flag against it.
- **Maj. Gen. John Sedgwick, VI Corps (from Fredericksburg), atSec=180 — CORRECT.** Sedgwick commanded VI Corps, was left to demonstrate at Fredericksburg, and carried Marye's Heights on May 3. Rank and role confirmed.
- **Brig. Gen. Amiel W. Whipple, III Corps division reserve, atSec=100 — CORRECT.** Whipple commanded the 3rd Division, III Corps as a brigadier general; he was mortally wounded (shot by a sharpshooter) at Chancellorsville and died May 7, promoted major general of volunteers only at/after his death. Brigadier is the battle-date-correct rank. (Re-fetched this pass — confirmed.)
- **Teaching card `cv_flank_march` numbers — CONFIRMED.** ~28,000 men (sources give 28,000-29,400), attack "~5:15 p.m. on May 2" (sources: "shortly after 5:00 pm," Sears 5:15), XI Corps posted on an exposed flank and routed, Jackson mortally wounded by his own men that night — all sound.
- **Casualty weight — CONFIRMED.** US ~17,304 / CS ~13,460 (~30,764 total), consistent with the digest's "casualty weight Verified (high)."
- **Terrain — CONFIRMED.** Chancellorsville / the Wilderness in Spotsylvania County; the Chancellor House, Wilderness Church, Dowdall's Tavern, Hazel Grove, the flank-march route are all real, correctly named battlefield ground.
- **Roles/fog — CONFIRMED.** attacker=CS, defender=US is the correct historical posture for the flank attack.

## 3. Revision Checklist For Codex

| Field/location | Current encoding | Issue | Corrected value | Source | Confidence |
|---|---|---|---|---|---|
| — | — | No revisions required — build is source-accurate. | — | — | — |

*The auditor's Section 3 carried no revision flags. The D328 adversarial pass therefore had no false flags to refute; it instead re-verified the load-bearing "confirmed solid" ranks (Rodes, Whipple, Anderson, Sedgwick) to check for a MISSED error, and found none. See Verification Notes below.*

## 4. OOB And Rank Re-Verification

- **Robert E. Rodes — Brig. Gen. on May 2 1863 (D92 fix, still correct).** MG promotion backdated to May 2 but carried out May 6/7, after the attack. Re-fetched this pass.
- **Richard H. Anderson — Maj. Gen. (correct; NOT lieutenant general until May 1864).** Watch: secondary prose (incl. ABT) sometimes uses his later rank; the digest is right. CSA had no lt.-gen. grade before Oct 1862, so Lt. Gen. is impossible for May 1863 regardless.
- **John Sedgwick — Maj. Gen., VI Corps (correct).**
- **Amiel W. Whipple — Brig. Gen., 3rd Div III Corps (correct; posthumous/deathbed MG only).** Re-fetched this pass.
- **Hiram G. Berry (D92 III Corps fix) — Maj. Gen., 2nd Div III Corps, killed May 3 (correct rank/corps; not fully re-fetched this pass — verify only if Codex touches his node).**
- **Elisha F. Paxton — Brig. Gen., Stonewall Brigade, attached to Colston's division, killed May 3 (D92 re-attachment; standard OOBs place the Stonewall Brigade under Colston at Chancellorsville — correct; verify if edited).**

## 5. Terrain And Teaching / Anti-Lost-Cause Check

- Named ground (Chancellor House, Wilderness Church, Dowdall's Tavern, Hazel Grove, the Wilderness) is accurate.
- The `cv_flank_march` card frames the flank march as audacity AND its cost — explicitly tying the "monument to audacity" to Jackson's mortal friendly-fire wounding. This is sound, non-triumphalist framing: it credits Lee/Jackson's operational skill without lapsing into Lost-Cause glorification, and it foregrounds the human cost.
- The endnotes correctly present the alt-history as a departure from the actual outcome (Lee's greatest victory; Hooker driven back), not as a rewriting of the real result. No fabricated units, quotations, or casualty inflation detected.

## 6. D74 / D92 No-Fudge Adherence

No per-battle fudge visible in the digest. Casualty figures appear as teaching text and provenance weighting, not as output gates. The reinforcement timings (atSec 100/150/180) and the CS-attacker / US-defender posture are structural inputs that let the outcome emerge from OOB, terrain, and timing per D74. Adherence confirmed.

## 7. Remaining Uncertainties

- **Flank-march distance in the teaching text ("12 miles").** Sources vary: Sears/NPS commonly cite ~12 miles to the jump-off; ABT says "nearly 15 miles." The encoded "12 miles" is within the accepted range and defensible — NOT a revision — but if Codex wants tighter wording, "roughly 12-15 miles" would bracket the sources.
- **Per-unit strengths and exact arrival minutes** are self-declared Inferred (medium) in the provenance because OOB totals differ across Sears/Gallagher/Krick/OR. No action needed unless a specific unit strength is challenged.
- **Berry and Paxton nodes** were confirmed from standard OOB knowledge but not individually re-fetched this pass; pin only if Codex edits those specific entries.

## 8. Audit Verdict

**SOLID_AS_IS (ratified by the D328 adversarial pass).** Every encoded rank verified is correct on the battle date, including the D92 fixes (Rodes brigadier, Anderson major general, Whipple brigadier, Berry III Corps, Paxton under Colston). Rodes and Whipple were independently re-fetched this pass and both confirm the brigadier encoding on the battle date. The teaching card's numbers (28,000 men, ~5:15 p.m., friendly-fire wounding) and the casualty weight all match reputable sources, and the anti-Lost-Cause framing is present and sound. The only soft spot — the "12 miles" flank-march figure — sits within the sourced range and is not a confirmed error, so no revision is warranted.

## Verification Notes (D328 adversarial pass)

**Method.** The auditor's Section 3 carried zero revision flags, so there were no false flags to refute. Per the adversarial charter, the pass instead re-fetched the load-bearing "confirmed solid" ranks to catch any MISSED error that would still be wrong under the SOLID_AS_IS verdict, and applied the CSA rank rule (no lieutenant-general grade before October 1862).

**Fetched / verified this pass:**
- **Robert E. Rodes** (Wikipedia + search corroboration) — brigadier general commanding a division on May 2 1863; MG recommended by Jackson on his deathbed and backdated to May 2 but carried out later (May 6/7). Digest encoding "Brig. Gen." **CONFIRMED CORRECT** (D92 fix holds).
- **Amiel W. Whipple** (Wikipedia + search corroboration) — brigadier general, 3rd Div III Corps; mortally wounded at Chancellorsville, died May 7, MG only at/after death. Digest encoding "Brig. Gen." **CONFIRMED CORRECT.**
- **Richard H. Anderson** — Maj. Gen. at Chancellorsville; Lt. Gen. not until May 1864, and impossible for May 1863 under the pre-Oct-1862 CSA grade rule. Digest encoding "Maj. Gen." **CONFIRMED CORRECT** (auditor's rank-discipline catch against ABT's anachronistic "Lt. Gen." prose upheld).
- **John Sedgwick** — Maj. Gen., VI Corps, at Fredericksburg. **CONFIRMED CORRECT** (well-established; not separately re-fetched).

**Flags CONFIRMED:** none (Section 3 was empty).
**Flags REFUTED:** none (Section 3 was empty; nothing to overturn).
**Missed errors found:** none.

**Ratified verdict: SOLID_AS_IS.** No data or runtime change. Berry and Paxton nodes remain confirmed-from-standard-OOB and should be pinned only if Codex edits those specific entries.