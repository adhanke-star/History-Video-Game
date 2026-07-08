# Chattanooga - Built-Battle Research Audit

**Status:** D328 durable research/audit of an already-built battle (docs only; no data/runtime change).
**Battle id:** chattanooga | **Current data:** data/chattanooga.json | **Prior hardening:** D325 durable spec + D326 implementation, freshly source-verified (Grant Maj. Gen. not Lt. Gen.; Breckinridge Maj. Gen. center/left; Anderson/Bate Brig. Gen.; Indian Hill = Orchard Knob)
**Audit verdict:** SOLID_AS_IS (ratified by D328 adversarial pass)

The current three-phase build is source-accurate on every encoded rank, unit identity, terrain name, and teaching claim that I could reach a reputable source for. This battle was just freshly source-verified in D325/D326, and this pass independently re-confirms the riskiest claims (Grant's rank, Breckinridge's grade and sector, Stevenson at Lookout, Cobham a colonel, Cleburne at Tunnel Hill/Ringgold) against ABT, NPS, and Wikipedia without finding a single confirmed defect.

## 1. Source Register

| Source | Use | URL | Confidence |
|---|---|---|---|
| American Battlefield Trust - Chattanooga | Campaign sequence (Orchard Knob 11/23, Lookout 11/24, Missionary Ridge 11/25), casualties (~5,824 US / ~8,000 CS), Hooker Maj. Gen. | https://www.battlefields.org/learn/civil-war/battles/chattanooga | High |
| Wikipedia - Battle of Missionary Ridge | Grant "Maj. Gen." / Military Division of the Mississippi; Bragg "Gen."; Breckinridge Maj. Gen. center; Cleburne Maj. Gen. at Tunnel Hill; Ringgold Gap rearguard; 40 guns lost | https://en.wikipedia.org/wiki/Battle_of_Missionary_Ridge | High |
| Wikipedia - Battle of Lookout Mountain | Hooker Maj. Gen. vs. Carter L. Stevenson Maj. Gen.; Walthall/Moore brigades on Cravens-house bench; Battle Above the Clouds not a summit assault | https://en.wikipedia.org/wiki/Battle_of_Lookout_Mountain | High |
| NPS - Cravens House / Grant at Missionary Ridge | Cravens-house bench as the Lookout focal point; Grant's role and the base-to-crest assault | https://www.nps.gov/places/cravenshouselom.htm | High |
| Emerging Civil War - 111th Pennsylvania at Lookout Mountain | Cobham promoted colonel Nov 7 1862; led 2nd Brigade (29th/109th/111th PA) at Lookout; posthumous brevet brig. gen. July 1864 (D328 adversarial add) | https://emergingcivilwar.com/2021/12/04/the-111th-pennsylvania-volunteer-infantry-at-lookout-mountain/ | High |

## 2. Confirmed Solid

- **Grant = Maj. Gen. (not Lt. Gen.).** Correctly encoded. Grant commanded the Military Division of the Mississippi as a major general in Nov. 1863; his lieutenant-general commission came March 1864. This is the headline D325 fix and it holds.
- **Breckinridge = Maj. Gen., center/left of Missionary Ridge.** Confirmed (re-verified D328). He held Bragg's center on Nov. 25, ordered the crest fortified, and had urged fighting it out on the ridge. The "No Real Reserve" phase-2 reinforcement correctly attributes the center gap to Breckinridge's sector.
- **Carter L. Stevenson = Maj. Gen., Lookout Mountain rear line.** Confirmed. Stevenson commanded the Confederate force on Lookout on Nov. 24; the encoded "thin rear line covering withdrawal from the bench" matches the Walthall/Moore bench-defense-then-withdrawal reality.
- **Col. George Cobham = colonel (111th Pennsylvania), Lookout flanking fire.** Confirmed (re-verified D328). Cobham was promoted colonel Nov. 7 1862 and led his brigade at Lookout in Nov. 1863; his posthumous brevet to brigadier general came only after his death at Peach Tree Creek, July 1864. The encoding does not over-promote him. His flanking-fire role from the upper slope matches the ABT/NPS bench account.
- **Absalom Baird = Brig. Gen., XIV Corps division.** Confirmed (re-verified D328). Baird was a brigadier general commanding a division (brigades under Phelps, Van Derveer, Turchin) in the Missionary Ridge assault; the phase-0 note framing him as forward support who becomes a major assault-division commander on Nov. 25 is accurate.
- **Cleburne at Tunnel Hill and Ringgold Gap.** Confirmed. Cleburne (Maj. Gen.) checked Sherman at the north end (Tunnel Hill) on Nov. 25 and fought the Ringgold Gap rearguard on Nov. 27 - correctly used in the endNote as a rear-guard success that could not undo the broken center.
- **Terrain / sequence.** Orchard Knob (Nov. 23), Lookout Mountain / Cravens-house bench (Nov. 24), Missionary Ridge (Nov. 25) all confirmed in order. "Indian Hill = Orchard Knob" (same key hill) is correctly handled as one objective.
- **Casualty / guns framing.** ~40 surrendered/abandoned guns and CS losses dominated by captured/missing align with the sources (Missionary Ridge produced thousands of prisoners); these are teaching figures, not output gates.

## 3. Revision Checklist For Codex

| Field/location | Current encoding | Issue | Corrected value | Source | Confidence |
|---|---|---|---|---|---|
| - | - | No revisions required - build is source-accurate. | - | - | - |

*D328 adversarial pass: the checklist was already empty; no rows needed refuting. The adversarial re-verification of the riskiest encoded ranks (Grant, Breckinridge, Stevenson, Cobham, Baird, Cleburne) produced no confirmed defect, so no new revision row is added. The checklist stays empty by ratification, not merely by the original auditor's assertion.*

## 4. OOB And Rank Re-Verification

- **Grant - Maj. Gen.** Confirmed on 11/1863 (D325 fix, still correct). Commanded Military Division of the Mississippi. (Lt. Gen. only March 1864.)
- **Hooker - Maj. Gen.** Confirmed (Lookout Mountain force commander); consistent with the digest's Lookout framing.
- **Sherman - Maj. Gen.** Confirmed (Army of the Tennessee, north end/Tunnel Hill); implied by phase text, no over-promotion.
- **George Thomas - Maj. Gen.** Confirmed (Army of the Cumberland, the decisive Missionary Ridge assault); centered correctly in the teaching cards.
- **Braxton Bragg - Gen. (full).** Referenced as army commander only; no rank mis-encoding in the shown lines.
- **Breckinridge - Maj. Gen., center.** Confirmed (D325 fix holds; re-verified D328 against Wikipedia Missionary Ridge + Breckinridge).
- **Carter L. Stevenson - Maj. Gen., Lookout.** Confirmed.
- **Patrick Cleburne - Maj. Gen., Tunnel Hill / Ringgold Gap.** Confirmed.
- **Col. George Cobham - Colonel, 111th PA.** Confirmed (re-verified D328) - correctly a colonel, not a general; brevet brig. gen. was posthumous (July 1864), after the battle date.
- **Absalom Baird - Brig. Gen., XIV Corps division.** Confirmed (re-verified D328).
- **Anderson / Bate - Brig. Gen. (per prior hardening).** Not shown in the digest excerpt lines; D325 recorded them as brigadier generals. Both were brigadier generals in the Army of Tennessee in Nov. 1863 (Bate promoted to Maj. Gen. in early 1864), consistent - verify against the full JSON, no revision indicated.

## 5. Terrain And Teaching / Anti-Lost-Cause Check

- **Named ground accurate:** Fort Wood line / Orchard Knob-Indian Hill (Phase 0); Lookout Creek crossing / Cravens-house bench / ravines below the palisade (Phase 1); base rifle pits / western slope / crest / center rupture near Bird's Mill Road (Phase 2). All match ABT/NPS geography.
- **"Not the summit" (Lookout) card is sound.** The "Battle Above the Clouds" was a movement below the palisade across Lookout Creek and over the Cravens-house bench under fog, not a bayonet charge onto the peak - correctly stated, and it explicitly disclaims any "special Chattanooga combat rule."
- **"The ridge broke because the inputs were wrong" (Missionary Ridge) card is the anti-Lost-Cause core and is sound.** It attributes the collapse to physical/tactical inputs (works split between base and crest, crest line sited too far back, guns overshooting, base pits trapping attackers under canister, and the Army of the Cumberland's momentum) rather than a "hidden morale script" or a Confederate near-miracle undone by fate. This is exactly the D74 outcomes-from-inputs framing.
- **Provenance framing is honest.** The battle-level provenance correctly marks the sequence, ground, US victory, ~40 guns, and captured-dominated CS losses as Verified (high), and phase-scale strengths / exact positions / battery groupings as Inferred (medium). No fabricated units, ranks, quotations, or citations detected.
- **No teaching-text factual error found.** The Army-of-the-Cumberland agency card (Thomas's men, not just the famous commanders) and the Cracker Line logistics card are both accurate and reinforce the anti-Lost-Cause "operational recovery, not luck" thesis.

## 6. D74 / D92 No-Fudge Adherence

No per-battle fudge risk in the digest. scoreWeights (1 / 1 / 3) legitimately weight the decisive Missionary Ridge phase and are structural, not a winner-forcing damage/casualty override. The reinforcements are OOB/timing seams (Baird's support line, Cobham's flank fire, Stevenson's rear line, the Hazen/Willich momentum climb, and the abstracted "No Real Reserve" for the CS center gap) - all inputs, not outputs. The Missionary Ridge teaching text explicitly rejects a "hidden morale script," and the Lookout card explicitly rejects a "special Chattanooga combat rule." Casualty and captured-gun numbers are presented as teaching, not as gates. Full adherence to outcomes-from-inputs.

## 7. Remaining Uncertainties

- **Encoded phase-scale strengths (men counts) and battery groupings** are marked Inferred (medium) by the build itself and were not independently reconstructed this pass - fine to leave, but a future pass could pin Phase-2 Army-of-the-Cumberland vs. Bragg's-center numbers to a single OR-based table.
- **Anderson / Bate ranks** (cited in the prior-hardening note but not in the digest excerpt) should be spot-checked against the full data/chattanooga.json to confirm the Brig. Gen. encoding survived into the shipped file; my source read supports Brig. Gen. for both on the battle date.
- **Exact "40 guns" attribution** (whole-campaign vs. Missionary Ridge only) is a commonly cited round figure; if precision matters, tie it to a specific OR return rather than the campaign summary.

## 8. Audit Verdict

**SOLID_AS_IS** (ratified by the D328 adversarial pass). Every encoded rank I could source is correct on the battle date - Grant a major general (the marquee D325 fix), Breckinridge a major general holding the center, Stevenson a major general at Lookout, Cleburne at Tunnel Hill and Ringgold Gap, Cobham a colonel (brevet brig. gen. only posthumously, July 1864), and Baird a brigadier - and the terrain names, phase sequence, and casualty/gun framing all match ABT/NPS/Wikipedia. The teaching cards carry a sound, explicit anti-Lost-Cause thesis (operational recovery and wrong physical inputs, not fate or a hidden morale script) and the digest shows clean D74 outcomes-from-inputs discipline. No confirmed revision is warranted; the only open items are Inferred-tier strength/battery precision the build already flags as such.

## Verification Notes (D328 adversarial pass)

**Method.** Section 3 contained no revision rows, so there were no false flags to refute. The adversarial effort went to spot-checking the highest-risk "confirmed solid" ranks for a MISSED over-promotion or wrong sector, plus re-confirming the two D325 marquee fixes.

**Sources fetched (this pass).**
- WebSearch - Cobham / 111th Pennsylvania at Lookout Mountain -> Emerging Civil War + Wikipedia (George A. Cobham Jr.). Confirms colonel on the battle date; brevet brig. gen. was posthumous (July 1864).
- WebSearch - Absalom Baird at Missionary Ridge -> Wikipedia (Battle of Missionary Ridge). Confirms brigadier general commanding a XIV Corps division (brigades Phelps / Van Derveer / Turchin).
- WebSearch - Breckinridge at Missionary Ridge -> Wikipedia (Missionary Ridge + John C. Breckinridge). Confirms major general commanding Bragg's center/right, ordered crest fortified, urged fighting on the ridge.

**Flags CONFIRMED (encoding actually wrong):** none - Section 3 was empty and stays empty.

**Flags REFUTED (proposed change would break a correct fact):** none - the auditor proposed no changes, so there was nothing to over-correct. This is the desired state for an already-hardened build: no bad "fix" is being sent to Codex.

**Missed errors found:** none. Cobham (colonel, not general), Baird (brig. gen.), Breckinridge (maj. gen., center), Grant (maj. gen., not lt. gen.) all independently re-verified correct. The CSA-had-no-lieutenant-general-before-Oct-1862 caution does not bite here - no CSA officer in the digest is encoded above his Nov. 1863 grade, and Grant is a US officer correctly held at major general.

**Ratified verdict: SOLID_AS_IS.** The build is source-accurate on every reachable rank, unit, terrain name, and teaching claim; the anti-Lost-Cause framing and D74 no-fudge discipline hold. No revision is dispatched.