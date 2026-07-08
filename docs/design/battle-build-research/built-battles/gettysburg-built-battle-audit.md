# Gettysburg (3 days) - Built-Battle Research Audit

**Status:** D328 durable research/audit of an already-built battle (docs only; no data/runtime change).
**Battle id:** gettysburg | **Current data:** data/gettysburg.json | **Prior hardening:** D89-era build + D92 (Doubleday & Early Maj. Gen.; Stannard's Vermont Bde I Corps; Archer captured at Willoughby Run)
**Audit verdict:** SOLID_AS_IS (ratified by D328 adversarial pass)

The current build is source-accurate. Every encoded commander rank is correct on the battle date, the three-phase terrain (McPherson Ridge / Little Round Top / Pickett's Charge) is right, the casualty framing matches standard authorities, and the teaching text is explicitly anti-Lost-Cause. No source-backed revisions found.

## 1. Source Register

| Source | Use | URL | Confidence |
|---|---|---|---|
| Wikipedia, "Abner Doubleday" | Doubleday MG-of-volunteers (rank Nov 29 1862); took I Corps after Reynolds' death | https://en.wikipedia.org/wiki/Abner_Doubleday | High |
| Encyclopedia Virginia / Wikipedia, "Jubal Early" | Early promoted Maj. Gen. Jan 17 1863; division under Ewell's Second Corps at Gettysburg | https://encyclopediavirginia.org/entries/early-jubal-a-1816-1894/ | High |
| HistoryNet, "Stannard and the 2nd Vermont Brigade" | 13th & 16th Vermont change front, flank Kemper; hundreds of prisoners taken | https://historynet.com/battle-of-gettysburg-union-general-george-stannard-and-the-2nd-vermont-brigade/ | High |
| American Battlefield Trust, "Gettysburg Battle Facts" | ~51,000 total casualties; Union ~23,055; CS "as many as 28,000"; turning-point framing | https://www.battlefields.org/learn/civil-war/battles/gettysburg | High |
| NPS Gettysburg NMP (official reports, Doubleday & Early) | Corps/division command, terrain named ground | https://www.nps.gov/gett/learn/historyculture/official-report-of-major-general-abner-doubleday.htm | High |
| Wikipedia, "George J. Stannard" / "2nd Vermont Brigade" | Stannard BG (rank Mar 1863); I Corps attachment of the Vermont brigade | https://en.wikipedia.org/wiki/George_J._Stannard | High |

## 2. Confirmed Solid

- **Maj. Gen. Robert E. Rodes** (Ewell's division, Oak Hill) — Rodes was promoted MG (rank May 1863, post-Chancellorsville) and led his division onto Oak Hill via Mummasburg Road on Day 1. Correct.
- **Maj. Gen. Abner Doubleday** — D92 fix. Confirmed: promoted MG of volunteers to rank from Nov 29 1862; commanded 3rd Div and took over I Corps after Reynolds was killed July 1. Rank and command succession both correct.
- **Maj. Gen. Jubal A. Early** — D92 fix. Confirmed: MG rank from Jan 17 1863; division under Ewell striking the Union right near the almshouse. Correct (NOT the later Lt. Gen. of 1864 — the D92 rank is right for the date).
- **Brig. Gen. Henry L. Benning** and **G. T. Anderson's brigade** (Hood's Division) — carried Devil's Den / Rose Woods. Brigade-level ranks correct.
- **Brig. Gen. Joseph B. Kershaw** (McLaws's Division) — BG at Gettysburg (his MG promotion was 1864). Correct; Wheatfield/Rose Woods action accurate.
- **Brig. Gen. John C. Caldwell**, 1st Division, II Corps — correct; the Wheatfield counterattack against Kershaw is accurate.
- **Brig. Gen. Romeyn B. Ayres**, 2nd Division, V Corps ("the Regulars") — correct division/corps and the Regular-brigade identity below Little Round Top.
- **Brig. Gen. Paul J. Semmes (mw)** — mortally wounded in the Wheatfield, died July 10 1863. Rank, fate, and date all correct.
- **Brig. Gen. Lewis A. Armistead** (Pickett's Division) — Virginia brigade following Garnett and Kemper, hat-on-sword to the stone wall. Correct.
- **Brig. Gen. George J. Stannard**, 13th & 16th Vermont (I Corps) — D92 fix. Confirmed: Stannard was BG (rank Mar 1863); the 2nd Vermont Brigade was attached to the I Corps; the 13th and 16th changed front forward to enfilade Kemper's right, then the 16th wheeled against Lang/Wilcox. Encoding matches the historical maneuver.
- **Terrain / named ground** — McPherson Ridge, Oak Hill, Railroad Cut, Chambersburg Pike (Day 1); Little Round Top, Devil's Den, Wheatfield, Peach Orchard (Day 2); Cemetery Ridge, the Angle, the Copse of Trees (Day 3) — all correct and correctly assigned to their phases.
- **Casualty teaching** — 23,049 US / 28,063 CS / 51,112 total is the standard traditional count and matches ABT's ~51,000 framing; Pickett's Charge ~12,500 attacking, ~6,000 lost. Sound.
- **Roles / fog** — attacker=CS, defender=US across all three set-piece phases (CS on the tactical offensive each day); fog=false appropriate for a fully-documented battle.

## 3. Revision Checklist For Codex

| Field/location | Current encoding | Issue | Corrected value | Source | Confidence |
|---|---|---|---|---|---|
| — | — | No revisions required — build is source-accurate. | — | — | — |

*(D328 adversarial pass: the checklist was empty on intake; no proposed flags existed to refute, and the independent spot-checks below surfaced no missed error that would add a row. Section 3 stands empty.)*

## 4. OOB And Rank Re-Verification

- **Rodes — Maj. Gen.** ✓ (MG rank May 1863; correct for July).
- **Doubleday — Maj. Gen.** ✓ D92 fix, confirmed (MG vols, Nov 1862 rank); I Corps succession after Reynolds correct.
- **Early — Maj. Gen.** ✓ D92 fix, confirmed (MG Jan 17 1863) — correctly NOT the 1864 Lt. Gen.
- **Benning / G. T. Anderson — Brig. Gen.** ✓
- **Kershaw — Brig. Gen.** ✓ (MG only in 1864).
- **Caldwell — Brig. Gen.**, 1st Div II Corps ✓
- **Ayres — Brig. Gen.**, 2nd Div V Corps ✓
- **Semmes — Brig. Gen. (mw)** ✓ died July 10 1863.
- **Armistead — Brig. Gen.** ✓
- **Stannard — Brig. Gen.** ✓ D92 fix, confirmed; Vermont brigade in I Corps correct.
- No CSA lieutenant-general/full-general anachronism anywhere; no dead-officer-commanding or wrong-corps attachment detected.

## 5. Terrain And Teaching / Anti-Lost-Cause Check

- Named ground is accurate and phase-correct (see Section 2).
- Day 1 card correctly frames the "shoes" story as **apocryphal** — a direct anti-myth move.
- "Command failure on both sides — not destiny" card frames the outcome as contingent generalship (Lee's overconfidence, fighting without Jackson), explicitly rejecting the Lost-Cause "invincible South undone by fate" narrative. Sound.
- The "high-water mark" card notes it is not a monument to Confederate valor-as-tragedy but the cost of a futile frontal assault — sound framing.
- Chamberlain / 20th Maine "swinging door" bayonet charge described as the famous refused-flank wheel — accurate metaphor, not overstated as single-handedly saving the battle (the card credits Vincent's whole brigade and the timing).
- No teaching-text factual error found.

## 6. D74 / D92 No-Fudge Adherence

No per-battle fudge present. Outcomes are driven by OOB, terrain, timing, and reinforcement arrival seconds — casualty numbers appear only in teaching cards, never as output gates. The Day-3 scoreWeight of 1.5 (vs 1.0 for Days 1-2) is a design-legitimate relative-importance weight within the universal model, not a per-battle damage/winner override. Adherence confirmed.

## 7. Remaining Uncertainties

- **Stannard "~243 prisoners"** — accounts confirm the flank attack captured hundreds (Codori/Alabama ~80, plus Floridians from Lang's brigade), but the exact figure of 243 is one estimate among several; low-stakes teaching detail, not an error. For a future pin, cite the specific source of the 243 count.
- **CS casualty 28,063 attributed to ABT** — ABT frames Confederate losses as "as many as 28,000"; 28,063 is the traditional Livermore-lineage figure and is contested downward by Busey & Martin. The number is defensible and standard; the ABT attribution is slightly generous but not wrong. Consider softening the provenance stamp on the CS figure to "traditional/Livermore" if precision is wanted — not required.
- **Per-unit strengths and arrival minutes** — already self-flagged in the provenance as Inferred (medium); OOB totals genuinely differ across Pfanz/Sears/Coddington/OR. No action needed; the honesty stamp is correct.

## 8. Audit Verdict

**SOLID_AS_IS** (ratified by the D328 adversarial pass). Every encoded commander rank is correct on July 1-3 1863 — including all three D92 fixes (Doubleday MG, Early MG, Stannard BG in I Corps), which independently re-verify against NPS, Encyclopedia Virginia, ABT, and Wikipedia. Terrain, phase structure, casualty framing, and the explicitly anti-Lost-Cause teaching all hold. No confirmed, source-backed error was found, so there is nothing for Codex to revise; the two minor uncertainties in Section 7 are provenance-precision notes, not defects.

## Verification Notes (D328 adversarial pass)

**Intake state:** Section 3 (Revision Checklist For Codex) contained zero proposed revisions — the packet arrived SOLID_AS_IS. There were therefore **no revision flags to confirm or refute**; the adversarial task reduced to (a) confirming the empty checklist was not hiding a real defect and (b) spot-checking "confirmed solid" ranks for a missed error.

**Sources fetched / searched this pass:**
- NPS Gettysburg NMP — official report titled "Brig. General Joseph Kershaw" (https://www.nps.gov/gett/learn/historyculture/official-report-of-brig-general-joseph-kershaw.htm) and "Maj. General Jubal Early" (https://www.nps.gov/gett/learn/historyculture/official-report-of-maj-general-jubal-early.htm) — primary-grade confirmation of both encoded ranks on the battle date.
- Wikipedia, "Joseph Brevard Kershaw" (https://en.wikipedia.org/wiki/Joseph_Brevard_Kershaw) — Kershaw commissioned BG Feb 13 1862; promoted MG **May 18 1864**. Confirms he was a Brig. Gen. at Gettysburg (the encoding is right; the MG promotion is correctly NOT applied to 1863).
- Encyclopedia Virginia, "Jubal A. Early" (https://encyclopediavirginia.org/entries/early-jubal-a-1816-1894/) — Early promoted MG **Jan 17 1863**; commanded a division in Ewell's Second Corps at Gettysburg. Confirms the D92 fix and the correct rejection of the 1864 Lt. Gen. anachronism.
- Wikipedia, "Paul Jones Semmes" (https://en.wikipedia.org/wiki/Paul_Jones_Semmes) — Brig. Gen., mortally wounded in the Wheatfield July 2 1863, died **July 10 1863**. Confirms rank, fate, and date exactly as encoded.

**Flags CONFIRMED (encoding wrong):** none — no revision was proposed and none was warranted.

**Flags REFUTED (would have sent Codex to change a correct fact):** none to refute — the checklist was empty on intake. The three D92 rank fixes (Doubleday MG, Early MG, Stannard BG/I Corps) were re-verified as correct and must NOT be reverted.

**Missed-error spot-check result:** Kershaw (BG, not the 1864 MG), Early (MG Jan 1863, not the 1864 Lt. Gen.), and Semmes (BG, died July 10 1863) all match the encoded ranks and dates against NPS/Encyclopedia Virginia/Wikipedia. No CSA lieutenant-general or full-general anachronism exists in the encoded OOB (all encoded division/brigade commanders are MG or BG; Ewell as the Lt. Gen. corps commander is not an encoded actor). No missed error found.

**Ratified verdict: SOLID_AS_IS.** The build is source-accurate; there is nothing for Codex to revise.