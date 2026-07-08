# First Bull Run (First Manassas) - Built-Battle Research Audit

**Status:** D328 durable research/audit of an already-built battle (docs only; no data/runtime change).
**Battle id:** bullrun1 | **Current data:** data/bullrun1.json | **Prior hardening:** D92 roster hardening + D92-verify (Elzey/1st Maryland gloss fix; ranks); Heintzelman rank left as an open source conflict
**Audit verdict:** SOLID_AS_IS (ratified by D328 adversarial pass — no flags refuted because none were raised; no missed rank error found)

The current build is source-accurate: every reinforcement commander's rank on July 21 1861, unit composition, principal ground (Henry Hill / Chinn Ridge / Stone Bridge / the fords), the rail-concentration teaching, and the contested "stone wall" framing all check out against NPS, ABT, Encyclopedia Virginia, and the Official-Records-derived OOBs. The single suspicious encoding ("1st & 4th Michigan" in Willcox's brigade) was verified CORRECT and is not a defect.

## 1. Source Register

| Source | Use | URL | Confidence |
|---|---|---|---|
| NPS Manassas — Union Order of Battle, First Manassas | Verify Heintzelman's division brigade/regiment composition (Franklin, Willcox incl. 4th Michigan, Howard) | https://www.nps.gov/mana/learn/historyculture/union-order-of-battle-first-manassas.htm | High |
| American Battlefield Trust — Bull Run | Battle narrative, Early's Chinn Ridge flank attack, command roles | https://www.battlefields.org/learn/civil-war/battles/bull-run | High |
| Encyclopedia Virginia — Stonewall Jackson at First Manassas | Rail concentration; Bee "stone wall" contested framing | https://encyclopediavirginia.org/1139hpr-e3ea44372ec2cf5/ | High |
| Wikipedia — First Battle of Bull Run (+ Union OOB, drawn from Official Records) | OOB cross-check, Bee-quote historiographic dispute | https://en.wikipedia.org/wiki/First_Battle_of_Bull_Run | Medium-High |
| firstbullrun.co.uk — 4th Michigan Infantry (Third Division) | Confirm 4th Michigan attached to Willcox's brigade July 1861 | http://www.firstbullrun.co.uk/NEV/Third%20Division/4th-michigan-infantry.html | Medium-High |
| americanhistorycentral / Wikipedia — Jubal Early; Samuel Heintzelman | Confirm Early = colonel on the date (BG after); Heintzelman dual-commission | https://en.wikipedia.org/wiki/Samuel_P._Heintzelman | High |

## 2. Confirmed Solid

- **Roles / framing:** attacker=US, defender=CS is correct — McDowell's army made the offensive turning movement; the "Union must win the morning quickly" scenario logic mirrors the real rail-fed Confederate concentration.
- **Confederate army names:** "Army of the Potomac" (Beauregard's brigades — Cocke 5th Bde, Early 6th Bde) and "Army of the Shenandoah" (Johnston's — Jackson 1st Bde, Elzey 4th Bde) are the correct 1861 Confederate designations, an easily-confused detail encoded right.
- **Jackson — Brig. Gen. Thomas J. Jackson, 1st Bde Army of the Shenandoah (~2,600), reverse slope of Henry Hill:** rank correct (Jackson was commissioned BG June 17 1861); regiments (2nd/4th/5th/27th/33rd Virginia + Rockbridge Artillery) and reverse-slope posting correct.
- **Early — Col. Jubal A. Early, 6th Bde, Chinn Ridge flank march:** rank correctly encoded as colonel; he was promoted BG *after* this battle. Composition (7th Louisiana, 13th Mississippi, 7th & 24th Virginia) and the rear-march-to-Chinn-Ridge flank attack are accurate.
- **Elzey — Col. Arnold Elzey (ex-Kirby Smith), 4th Bde Army of the Shenandoah:** the D92-verify fix holds — Elzey was a colonel who took the brigade when E. Kirby Smith was wounded; the "1st Maryland (Elzey's own regiment), 3rd Tennessee, 10th & 13th Virginia" gloss is accurate, arriving late off the rail movement.
- **Willcox — Col. Orlando B. Willcox, 2nd Bde Heintzelman's div:** the "11th NY Fire Zouaves, 38th NY, 1st & 4th Michigan" list is CORRECT per the NPS OOB (both the 1st and 4th Michigan were in the brigade; 4th Michigan under Col. D. A. Woodbury). Willcox was wounded and captured — encoded correctly.
- **Franklin — Col. William B. Franklin, 1st Bde Heintzelman's div:** 5th/11th Massachusetts + 1st Minnesota correct; the encoded note that the 4th Pennsylvania marched to the rear that morning on its expired 90-day term is historically accurate (the famous 4th PA / 8th NY Militia departure).
- **Howard — Col. Oliver O. Howard, 3rd Bde Heintzelman's div:** 3rd/4th/5th Maine + 2nd Vermont correct; arrived last, Chinn Ridge.
- **Sherman (Col. W. T. Sherman, 3rd Bde Tyler's div — 13th/69th/79th NY, 2nd Wisconsin) and Keyes (Col. E. D. Keyes, 1st Bde Tyler's div — 1st/2nd/3rd Connecticut, 2nd Maine):** ranks and regiments correct; Sherman's crossing at the unguarded ford and Keyes's abortive eastern-foot flanking are accurate.
- **Batteries:** Griffin (Capt. Charles Griffin, Battery D, 5th U.S. Artillery, 6 guns) and Ricketts (Capt. James B. Ricketts, Battery I, 1st U.S. Artillery, 6 guns) — ranks, unit designations, gun counts, and the fatal advance onto the Henry Hill crest (Ricketts wounded & captured) all correct.
- **Hampton (Col. Wade Hampton, Hampton's Legion) and Stuart (Col. J. E. B. Stuart, 1st Virginia Cavalry):** ranks correct; Stuart's charge routing the 11th NY Fire Zouaves area is accurate.
- **Teaching — rail concentration:** the Manassas Gap Railroad strategic troop movement (first of its kind) and Elzey-off-the-train framing are sound (Encyclopedia Virginia, ABT).
- **Teaching — "stone wall":** the contested framing (Bee mortally wounded, died the next day, intent never clarified, no subordinate reports) is exactly what the historiography supports — sound anti-Lost-Cause treatment of the war's founding legend.

## 3. Revision Checklist For Codex

| Field/location | Current encoding | Issue | Corrected value | Source | Confidence |
|---|---|---|---|---|---|
| — | — | No revisions required — build is source-accurate. | — | — | — |

*D328 adversarial pass: the checklist was empty on entry (no flags raised), and no flag was manufactured during verification. Nothing was moved out of this section. The auditor's own self-caught false flag ("1st & 4th Michigan" in Willcox's brigade, which looked wrong but is correct) was independently confirmed correct and stays out of the checklist.*

## 4. OOB And Rank Re-Verification

- **Brig. Gen. Thomas J. Jackson** — BG confirmed (commissioned June 17 1861); correct on July 21.
- **Col. Jubal A. Early** — colonel on the date confirmed (colonel, 24th Virginia; formally June 1861); BG promotion came after Bull Run (valor at Blackburn's Ford). Encoded rank correct (a classic backdated-promotion trap avoided).
- **Col. Arnold Elzey** — colonel confirmed; assumed brigade command mid-battle when Kirby Smith fell; BG ("Blücher of Manassas") came after. D92-verify fix stands.
- **Col. Philip St. George Cocke** — colonel confirmed (BG promotion later in 1861). Correct.
- **Cols. Sherman, Keyes, Franklin, Willcox, Howard, Hampton, Stuart** — all correctly colonels on the date; captains **Griffin** and **Ricketts** correct. NOTE (D328): Sherman, Keyes, Franklin, and Howard each held a regular-army colonelcy (May 14 1861) plus a BG-USV commission backdated to rank from May 17 1861 but not actually issued/confirmed until August 1861 — the identical profile to Heintzelman. The standard First Bull Run convention (and every OR-derived OOB) lists them as **Colonel** at the battle; the digest's uniform "Col." encoding is therefore correct, not an error. This consistency also confirms Heintzelman needs no change.
- **Samuel P. Heintzelman (division commander) — VERIFY, do not revise:** he held two simultaneous commissions on July 21 1861 — colonel, 17th U.S. Infantry (regular, May 14) and brigadier general of U.S. Volunteers (May 17), the latter being the operative rank under which he commanded the 3rd Division. The digest encodes no explicit rank for him (referenced only as "Heintzelman's div"), so there is nothing to change. If the full data file carries a leader entry with a rank, "Brig. Gen. (USV)" is the most defensible reading, but the source usage genuinely splits — leave as the flagged open conflict per prior hardening.

## 5. Terrain And Teaching / Anti-Lost-Cause Check

- Named ground is accurate: Henry Hill (the decisive plateau), Robinson House front, Chinn Ridge (the afternoon flank), Stone Bridge sector (Cocke), and the unguarded ford Sherman used (Farm/Poplar Ford) — all correctly placed.
- Rail-concentration teaching card: historically sound and appropriately framed as the first strategic rail movement of troops to a battlefield.
- "Stone wall" teaching card: correctly presents Bee's remark as contested (praise vs. rebuke), notes he died before clarifying, and frames the battle as the illusion-shattering opening — anti-Lost-Cause framing present and sound. No factual error found in the teaching text (note: the digest capture of br_stonewall is truncated mid-sentence at "died the …"; the visible portion is accurate — see Section 7).

## 6. D74 / D92 No-Fudge Adherence

No per-battle fudge present. The digest encodes only inputs — OOB, commander ranks, weapons/gun-counts, per-brigade men, and reinforcement arrival timing (atSec minutes) — plus teaching-only casualty color (e.g., Hampton's Legion "~600 engaged, 121 casualties"). Casualty figures appear as teaching text, not as output/winner gates. Outcomes emerge from the universal model per D74; the staggered CS reinforcement clock (Jackson 135s, Early 220s, Elzey 275s) is the historically correct pressure driver, not a scripted result. Adherence confirmed.

## 7. Remaining Uncertainties

- **Heintzelman's rank** (Section 4) — the intended open source conflict; leave flagged for a future call, do not auto-fix. D328 note: by the same dual-commission convention that keeps Sherman/Keyes/Franklin/Howard as colonels, a "Col." reading for Heintzelman would also be defensible; the split is genuine and no correction is warranted either way while the digest carries no encoded rank.
- **br_stonewall teaching body** — the digest capture truncates at "…died the …", so the final one-to-two sentences of that card were not audited verbatim. The visible portion is sound; Codex/future should eyeball the tail of the card in data/bullrun1.json to confirm it closes on the anti-Lost-Cause framing and contains no fabricated quotation attribution.
- **Per-brigade strengths and the exact reinforcement minute** — the provenance string honestly marks these Inferred (medium); the ~2,600 for Jackson and ~600 for Hampton's Legion are reasonable but not independently re-derived this pass.

## 8. Audit Verdict

**SOLID_AS_IS** (ratified by the D328 adversarial pass). Every risky encoded claim verified against reputable sources: all commander ranks are correct for July 21 1861 (no backdated-promotion errors — Early and Elzey correctly colonels, Jackson correctly BG), unit compositions match the NPS/ABT/OR-derived OOBs, and the one item that looked wrong ("1st & 4th Michigan" in Willcox's brigade) was confirmed correct — a would-be false flag caught by verification. The adversarial pass raised and refuted no new flags, added no missed error, and independently re-verified four ranks (Jackson, Early, Keyes, Franklin) plus the Sherman/Keyes/Franklin/Howard dual-commission convention. The build honors D74 (inputs only, no result fudge) and the teaching text is historically sound and anti-Lost-Cause. The single genuine open question (Heintzelman's dual-commission rank) is an uncertainty to verify, not a confirmed error, and carries no encoded rank to correct.

## Verification Notes (D328 adversarial pass)

**Method:** Read the encoded-data digest (bullrun-digest.txt), then WebSearch-verified the ranks most exposed to the backdated-promotion / dual-commission trap. Applied the rule that the CSA had no lieutenant-general grade before Oct 1862 (not implicated here — all CS commanders in this build are correctly Col. or, for Jackson, Brig. Gen.).

**Section 3 flags evaluated:** None. The checklist contained only the "no revisions required" placeholder row, so there was no flag to confirm or refute. No flag was manufactured. Result: Section 3 left unchanged.

**Ranks re-verified (spot-check that the auditor missed no real error):**
- **Jackson — CONFIRMED correct as Brig. Gen.** Commissioned brigadier general June 17 1861; held BG at First Manassas. (Wikipedia; American Battlefield Trust.)
- **Early — CONFIRMED correct as Col.** Colonel, 24th Virginia, on July 21 1861; promoted brigadier general *after* Bull Run for his conduct. Encoding "Col. Jubal A. Early" is right; a BG encoding would have been the trap. (Wikipedia; americanhistorycentral.)
- **Keyes — CONFIRMED correct as Col.** Colonel, 11th U.S. Infantry (May 14 1861); BG-USV backdated to May 17 but not promoted until August 1861. Colonel at the battle. (Wikipedia; americanhistorycentral.)
- **Franklin — CONFIRMED correct as Col.** Colonel, 12th U.S. Infantry (May 14 1861); BG-USV backdated to May 17, confirmed August 20 1861. Colonel at the battle. (americanhistorycentral; Wikipedia.)
- **Dual-commission convention:** Sherman, Keyes, Franklin, and Howard share Heintzelman's exact profile (regular colonelcy + BG-USV backdated to May 17 1861, confirmed August). The digest's uniform "Col." for the brigade commanders matches every OR-derived OOB and is correct — and confirms Heintzelman (no encoded rank) needs no change.

**Flags CONFIRMED (real errors requiring revision):** None.

**Flags REFUTED (false flags rejected):** None were raised in Section 3; nothing to reject. The auditor's own pre-caught false flag (Willcox "1st & 4th Michigan") was independently re-confirmed correct.

**Missed errors found:** None.

**Ratified verdict:** SOLID_AS_IS. No data/runtime change; docs-only audit stands.