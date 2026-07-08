# Antietam (Sharpsburg) - Built-Battle Research Audit

**Status:** D328 durable research/audit of an already-built battle (docs only; no data/runtime change).
**Battle id:** antietam | **Current data:** data/antietam.json | **Prior hardening:** D76 build + D92 (Benjamin 4 guns, Battery B smoothbore); Mansfield Maj.Gen.-of-vols date left as an open source conflict.
**Audit verdict:** MINOR_REVISIONS (adversarial pass D328: one missed rank error — Israel B. Richardson was a MAJOR GENERAL at Antietam, encoded as Brig. Gen.)

The build is very nearly source-accurate, but the adversarial pass caught one commander-rank error the original audit missed: **Israel B. Richardson was a major general (of volunteers) on Sep 17, 1862**, not a brigadier general. Every other commander rank checks out, unit identities and brigade attachments are correct, the three-sector phase structure matches the historical sequence, the casualty figures are the standard American Battlefield Trust numbers, and the teaching text is soundly anti-Lost-Cause. Section 3 originally proposed no revisions; the adversarial pass adds the single Richardson fix.

## 1. Source Register

| Source | Use | URL | Confidence |
|---|---|---|---|
| American Battlefield Trust — John Bell Hood bio | Hood Brig. Gen. at Antietam; MG effective Oct 10, 1862 | https://www.battlefields.org/learn/biographies/john-bell-hood | High |
| Wikipedia — Richard H. Anderson (general) | Anderson MG dated July 14, 1862; wounded in thigh at the Sunken Road | https://en.wikipedia.org/wiki/Richard_H._Anderson_(general) | High |
| American Battlefield Trust — Israel Bush Richardson bio | Richardson MG July 4, 1862 (before Antietam); MG at the Bloody Lane, mortally wounded | https://www.battlefields.org/learn/biographies/israel-bush-richardson | High |
| NPS — Israel B. Richardson | Refers to Richardson as Major General throughout the Sep 17, 1862 narrative; MG July 4, 1862 | https://www.nps.gov/people/israel-b-richardson.htm | High |
| Antietam on the Web — Richardson officer file | Titled "MGen Israel Bush Richardson" at Antietam | https://antietam.aotw.org/officers.php?officer_id=109 | High |
| NPS — Antietam National Battlefield, Casualties | Casualty weight (~12,400 US / ~10,320 CS) | https://www.nps.gov/anti/learn/historyculture/casualties.htm | High |
| American Battlefield Trust — Antietam battle facts | 12,401 US / 10,316 CS / 22,717 total | https://www.battlefields.org/learn/civil-war/battles/antietam | High |
| HistoryNet — "Fighting Too Fast: The Texas Brigade at Sharpsburg" | Hood's Div = Law's Bde + Texas Bde under Wofford, ~2,300 | https://www.historynet.com/fighting-fast-texas-brigade-sharpsburg.htm | High |
| Antietam on the Web — L. O'B. Branch officer file / Wikipedia | Branch Brig. Gen., killed (head shot) during A.P. Hill's counterattack | https://antietam.aotw.org/officers.php?officer_id=11 | High |
| American Battlefield Trust — Joseph K.F. Mansfield bio | MG-of-volunteers date disputed (backdated July 18 / posthumous) — supports leaving it open | https://www.battlefields.org/learn/biographies/joseph-kf-mansfield | High |

## 2. Confirmed Solid

- **John B. Hood — Brig. Gen.** commanding a division at Antietam. Promotion to Major General was effective Oct 10, 1862 (nearly a month later), so the battle-date rank is correct; no backdating error. **(Adversarial pass CONFIRMED — ABT/Wikipedia/AotW.)**
- **Hood's Division composition** — Law's Brigade + the Texas Brigade, ~2,300 men, counterattacking through the Cornfield ~7 a.m. and being wrecked. The "Texas Brigade (Wofford)" label is correct: William T. Wofford led the Texas Brigade that day while Hood ran the division. (Wofford was a colonel at the time; the digest asserts a rank only for Hood, so no rank error is encoded.)
- **Richard H. Anderson — Maj. Gen. (w)** at the Sunken Road. His MG commission dated July 14, 1862 predates the battle, so the two-star rank is correct, and he was indeed wounded (thigh) defending the Bloody Lane. **(Adversarial pass CONFIRMED — Wikipedia/ABT.)**
- **John C. Caldwell — Brig. Gen.**; Col. Francis Barlow wheeling the 61st & 64th New York onto the enfilading ground is accurate (Barlow was colonel of the 61st NY).
- **Alpheus S. Williams / George S. Greene — Brig. Gen.** (XII Corps divisions); Williams succeeding to corps command when Mansfield fell, and Greene reaching the Dunker Church plateau, are both correct.
- **Jubal A. Early — Brig. Gen.**, taking over Lawton's division after Lawton was wounded — correct (Early's MG came Jan 17, 1863). **(Adversarial pass CONFIRMED — ABT/Wikipedia/AotW.)**
- **Isaac P. Rodman / Orlando B. Willcox — Brig. Gen.** (IX Corps divisions); Snavely's Ford flanking crossing and the push toward Sharpsburg are accurate.
- **L. O'B. Branch — Brig. Gen. (k)** and **James J. Archer — Brig. Gen.**, leading A.P. Hill's Light Division brigades after the ~17-mile march from Harpers Ferry. Branch was killed by a head shot during the counterattack — confirmed. Walker's/Hill's artillery (Pegram, Crenshaw, McIntosh) is correctly named.
- **Casualties** — 12,401 US / 10,316 CS / 22,717 total match ABT exactly; NPS gives the same weight. The "bloodiest single day" framing is standard and sound.
- **Terrain / sectors** — Confederate left (Miller's Cornfield, East & West Woods, Dunker Church plateau), center (Sunken Road between the Roulette and Piper farms), and right (Lower/Rohrbach = Burnside's Bridge) are all correctly named and correctly assigned to phases.
- **D92 artillery fixes** (Benjamin 4 guns, Battery B smoothbore) are not surfaced in this leader/unit digest but are noted as prior hardening; nothing in the digest contradicts them.

## 3. Revision Checklist For Codex

| Field/location | Current encoding | Issue | Corrected value | Source | Confidence |
|---|---|---|---|---|---|
| `us_richardson` unit (`data/antietam.json`, the Irish-Brigade reinforcement, atSec 80), `commander` field | `Brig. Gen. Israel B. Richardson` | Richardson was promoted **major general of volunteers on July 4, 1862**, more than two months before Antietam. He commanded the 1st Div, II Corps at the Bloody Lane as a MAJOR GENERAL (mortally wounded there, died Nov 3, 1862). The one-star encoding is a rank error under a Verified stamp; by the same rule the audit applied to R.H. Anderson (MG July 14, 1862), Richardson is a two-star. **INTERNAL SELF-CONTRADICTION (main-loop confirmed against the live file):** the leader entry `ld_richardson` on the same battle ALREADY reads `"Maj. Gen. Israel B. Richardson"` — only the `us_richardson.commander` field disagrees, exactly the D92 "file self-contradicts itself" class (cf. Malvern Hill's Hunt). This is a one-field label fix, outcome-neutral (rank labels don't feed combat), so the antietam probe should stay 16/16. Do NOT touch the separate battery captain "Capts. Squires, **Richardson**, Brown" (a different man — J.B. Richardson of the Washington Artillery). | `Maj. Gen. Israel B. Richardson` | ABT / NPS / Antietam on the Web (officer_id=109, "MGen") / Wikipedia / Stone Sentinels; internal `ld_richardson` field | High |

*(Original audit proposed NO revisions in this section; the single row above was added by the D328 adversarial pass and confirmed against the live `data/antietam.json` by the main-loop final verifier. No false/over-reaching flags were present to refute.)*

## 4. OOB And Rank Re-Verification

- **John B. Hood — Brig. Gen.** ✓ (MG effective Oct 10, 1862; battle-date rank correct, no backdate error). — ABT/NPS.
- **Richard H. Anderson — Maj. Gen. (w)** ✓ (MG July 14, 1862; wounded at the Sunken Road). — Wikipedia/ABT.
- **Israel B. Richardson — MUST BE Maj. Gen.** ✗ **(encoded Brig. Gen. — REVISE).** Richardson was promoted major general of volunteers on July 4, 1862; he commanded the 1st Div, II Corps at the Bloody Lane as a major general and was mortally wounded there (died Nov 3, 1862). Antietam on the Web titles his own officer file "MGen"; NPS/ABT/Wikipedia all call him major general at the battle. The original audit conflated "commanded at the battle" with "rank correct" — the rank is wrong. There are therefore **TWO** two-star leaders in the set (Anderson CS, Richardson US), not one.
- **John C. Caldwell — Brig. Gen.** ✓; Barlow correctly a colonel wheeling the 61st/64th NY.
- **Alpheus S. Williams — Brig. Gen.** ✓ (succeeded to XII Corps command on Mansfield's fall).
- **George S. Greene — Brig. Gen.** ✓.
- **Jubal A. Early — Brig. Gen.** ✓ (took Lawton's division after Lawton wounded; MG came Jan 17, 1863).
- **Isaac P. Rodman — Brig. Gen.** ✓ (mortally wounded at Antietam; commanded 3rd Div IX Corps at the battle).
- **Orlando B. Willcox — Brig. Gen.** ✓.
- **L. O'B. Branch — Brig. Gen. (k)** ✓ (killed by head shot during A.P. Hill's counterattack).
- **James J. Archer — Brig. Gen.** ✓.
- **Joseph K.F. Mansfield** (referenced, not an encoded leader) — his MG-of-volunteers date is genuinely disputed in the sources (backdated to July 18, 1862 in some accounts, described as posthumous in others). The digest correctly leaves this open rather than asserting a date — **verify only, do not "fix."**

## 5. Terrain And Teaching / Anti-Lost-Cause Check

- Named ground is accurate across all three sectors (Cornfield/West Woods/Dunker Church; Sunken Road between Roulette and Piper farms; Rohrbach/Burnside's Bridge). ✓
- Anti-Lost-Cause framing is present and sound: the teaching cards explicitly attribute the Cornfield and Bloody Lane to "slaughter, not maneuver," name McClellan's piecemeal feeding-in as command failure on both sides, and frame the Sunken Road's fall as "an accident of terrain, a misheard order — not destiny" and the defenders as "ordinary soldiers multiplied by terrain — not Southern invincibility." Burnside's Bridge is framed as "contingent, not destiny" (a twelve-foot bottleneck and timid Union command, not innate Confederate prowess). This is exactly the anti-Lost-Cause posture required.
- The "an_cost" card's comparative claim (more Americans fell than in the War of 1812, Mexican-American, and Spanish-American Wars combined in a single day) is the standard, well-supported statement, and the Gardner-photographs point is accurate.
- The "an_wasted" card (the Lost/Special Order 191 wrapped around three cigars; near two-to-one numbers; Lee pinned against the Potomac) is historically sound.
- No teaching-text factual error found.

## 6. D74 / D92 No-Fudge Adherence

No per-battle fudge risk visible in the digest. All scoreWeights are 1 (uniform), casualty figures are presented as teaching provenance rather than as output gates, and per-unit strengths / arrival minutes are honestly flagged Inferred (medium) because Carman, Sears, and the Official Records disagree. Outcomes are set up to emerge from OOB, terrain, timing, and gun-counts — consistent with the one universal combat model. No damage/firepower/winner override is present. (The Richardson fix is a rank-label correction only; it does not touch combat weights.)

## 7. Remaining Uncertainties

- **Mansfield's major-general-of-volunteers date** — genuinely contested (July 18, 1862 backdated vs. posthumous). Left open by the digest; a future pass could pin the OR/AGO commission record, but it is not an encoded leader field so it drives nothing.
- **Per-unit strengths and exact arrival seconds (atSec)** — the ~2,300 (Hood), ~540 Irish Brigade loss, "only 350 strong" (Archer), and reinforcement timings are Inferred (medium) by the build's own provenance; the source estimates vary (Carman/Sears/OR) and are within the honest range, so no revision is called for, but they are estimates by nature.
- **Battery-level D92 fixes** (Benjamin 4 guns, Battery B smoothbore) are not exposed in this leader/unit digest and were not re-derived this pass; assumed intact per prior hardening.

## 8. Audit Verdict

**MINOR_REVISIONS.** Nearly every risk-bearing encoded claim verifies against reputable sources (ABT, NPS, HistoryNet, Antietam on the Web) — unit identities and brigade attachments, the three-sector terrain, the casualty weight, and every commander rank EXCEPT one. The adversarial pass caught a single missed error the original audit made: **Israel B. Richardson was a major general (of volunteers, July 4, 1862) at Antietam, encoded as brigadier general.** Correcting that gives the set two two-star leaders (Anderson CS, Richardson US), which is historically right. The teaching text is factually sound and firmly anti-Lost-Cause, and the digest shows no per-battle fudge (D74/D92 clean). The Mansfield promotion date is correctly left open. One confirmed revision (Richardson → Maj. Gen.) is needed; nothing else.

## Verification Notes (D328 adversarial pass)

**What I fetched / searched (reputable sources):**
- Hood: WebSearch + ABT/Wikipedia/TSHA — Brig. Gen. at Antietam, MG effective Oct 10, 1862. **CONFIRMED correct as encoded.**
- R.H. Anderson: WebSearch + Wikipedia/ABT — MG July 14, 1862, wounded in thigh at the Sunken Road. **CONFIRMED correct as encoded (two-star).**
- Jubal Early: WebSearch + ABT/Wikipedia/AotW — Brig. Gen. at Antietam (took Lawton's division), MG Jan 17, 1863. **CONFIRMED correct as encoded.**
- Israel B. Richardson: WebSearch + Wikipedia (en.wikipedia.org/wiki/Israel_B._Richardson), ABT (battlefields.org/learn/biographies/israel-bush-richardson), NPS (nps.gov/people/israel-b-richardson.htm), Stone Sentinels, and Antietam on the Web officer file (officer_id=109, titled "MGen") — **all agree he was MAJOR GENERAL of volunteers (July 4, 1862) at Antietam.** The digest encodes "Brig. Gen." — **MISSED ERROR, now flagged in Section 3.**

**Flags CONFIRMED (real, kept/added):** 1 — Richardson `Brig. Gen.` → `Maj. Gen.` (added by this pass; original Section 3 was empty).

**Flags REFUTED (removed):** 0 — the original audit proposed no revisions, so there were no false or over-reaching flags to strike. (CSA had no lieutenant-general grade before Oct 1862; not relevant here — no leader was over-ranked to Lt. Gen.)

**Spot-check result:** The original SOLID_AS_IS verdict was over-confident. The audit's own reasoning was internally inconsistent — it accepted R.H. Anderson's July 14, 1862 MG as making him a correct two-star, but kept Richardson (MG July 4, 1862, ten days EARLIER) at one star, rationalizing that "he commanded at the battle, so encoding is correct" (conflating command with rank). Both are two-star leaders.

**Ratified verdict: MINOR_REVISIONS** — one confirmed rank correction (Richardson → Maj. Gen.); no false flags refuted; all other ranks, unit identities, terrain, casualties, and anti-Lost-Cause teaching text verified solid.