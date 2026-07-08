# Shiloh - Built-Battle Research Audit

**Status:** D328 durable research/audit of an already-built battle (docs only; no data/runtime change).
**Battle id:** shiloh | **Current data:** data/shiloh.json | **Prior hardening:** D92 (Breckinridge Brig.Gen.; Bragg RIGHT wing; W.H.L.Wallace d.Apr 10; Ammen Col; Wood->Chalmers) + D235 audit (Ruggles grand battery, smoothbore parity)
**Audit verdict:** SOLID_AS_IS (ratified by D328 adversarial pass)

Every encoded claim visible in the digest — the four reinforcements and their commanders' ranks, the Ruggles grand-battery gun-count, the named ground, and the casualty framing — checks out against NPS and American Battlefield Trust. This is a well-built, history-hardened battle with no source-backed revision needed. The adversarial pass re-fetched all four reinforcement-commander ranks and confirmed each; no flag survived and no missed error was found.

## 1. Source Register

| Source | Use | URL | Confidence |
|---|---|---|---|
| American Battlefield Trust — Battle of Shiloh | Casualties (13,047 US / 10,699 CS / 23,746), CS strength ~44,000, terrain, Buell rescue | https://www.battlefields.org/learn/civil-war/battles/shiloh | High |
| NPS / npplan Tour Stop #4 — Ruggles' Battery | Ruggles grand battery 53 (or 62 per Ruggles) guns, ~4:30 p.m. bombardment | https://npplan.com/parks-by-state/tennessee/shiloh-national-military-park-shiloh-battlefield-tour-park-version/shiloh-national-military-park-nps-tour-stop-4-ruggles-battery/ | High |
| Wikipedia — Jacob Ammen | Colonel (24th Ohio) commanding 10th Brigade, 4th Div, Army of the Ohio; promoted Brig.Gen. July 16, 1862 (after battle) | https://en.wikipedia.org/wiki/Jacob_Ammen | High |
| American Battlefield Trust — William "Bull" Nelson | Brig.Gen. commanding 4th Division at Shiloh; promoted Maj.Gen. July 1862 (after battle) | https://www.battlefields.org/learn/biographies/william-nelson | High |
| HistoryNet — Chalmers' Mississippians at Shiloh; ABT — Official Report of Brig. Gen. James Chalmers | Brig.Gen. Chalmers, Mississippi brigade (Withers's div, Bragg's corps), final dusk assault toward Pittsburg Landing | https://www.historynet.com/chalmers-mississippians-shiloh/ | High |
| American Battlefield Trust — Battle of Shiloh: Shattering Myths | Hornets' Nest held chiefly by W.H.L. Wallace's men; Prentiss over-credited | https://www.battlefields.org/learn/articles/battle-shiloh-shattering-myths | High |

## 2. Confirmed Solid

- **Ruggles's Grand Battery — Brig. Gen. Daniel Ruggles, ~53-62 guns, ~4:00-4:30 p.m., ~400 yds from the Hornets' Nest.** Confirmed: Ruggles massed roughly 53 guns (62 by his own count) — the greatest concentration of artillery yet seen on a North American battlefield. Rank (Brig.Gen., from Aug 9, 1861) and the D235-audited framing are accurate. The digest's honest "~53-62 guns" hedge matches the sourced discrepancy exactly.
- **Col. Jacob Ammen — leading brigade of Buell's Army of the Ohio, first across the Tennessee River.** Confirmed COLONEL on the battle date (24th Ohio; commanded 10th Brigade, 4th Div). His Brig.Gen. promotion came July 16, 1862 — after Shiloh. The D92 "Ammen Col" fix stands.
- **Brig. Gen. William "Bull" Nelson — 4th Division, Army of the Ohio.** Confirmed BRIGADIER GENERAL at Shiloh (from Sept 16, 1861); Maj.Gen. promotion not until July 19, 1862. Rank on the date is correct.
- **Brig. Gen. James R. Chalmers — Mississippi brigade, final dusk assault toward Pittsburg Landing.** Confirmed Brig.Gen. (promoted Feb 13, 1862) commanding the Mississippi brigade (2nd Brigade, Withers's division, Bragg's corps) that made one of the last April-6 attacks and got nearer the Landing than any other CS brigade before darkness/resistance/Beauregard halted it. The D92 "Wood->Chalmers" reassignment holds.
- **Terrain — Sunken Road / Hornets' Nest, Peach Orchard, the Crossroads, Pittsburg Landing, River Road, Corinth Road.** All are genuine, correctly named Shiloh ground.
- **Casualty framing — 13,047 US / 10,699 CS / 23,746 total; ~24,000 "more than the Revolution, 1812, and Mexican War combined."** Matches the standard ABT/NPS figures and is internally consistent (13,047 + 10,699 = 23,746).
- **Roles/geography — attacker=CS, defender=US, Pittsburg Landing, Hardin County TN, along the Tennessee River, fog=false.** Correct.

## 3. Revision Checklist For Codex

| Field/location | Current encoding | Issue | Corrected value | Source | Confidence |
|---|---|---|---|---|---|
| — | — | No revisions required — build is source-accurate. | — | — | — |

_No revision rows were proposed by the original audit, and the D328 adversarial pass added none: all four encoded reinforcement ranks (Ammen Col; Nelson, Ruggles, Chalmers Brig.Gen.) were re-fetched and confirmed correct. Nothing to revise._

## 4. OOB And Rank Re-Verification

- **Daniel Ruggles — Brig. Gen. (encoded correct).** Brigadier general (from Aug 9, 1861) at Shiloh; commanded a division in Bragg's corps and organized the grand battery. Re-verified.
- **Jacob Ammen — Colonel (encoded correct; D92 fix confirmed).** Colonel on April 6-7, 1862; Brig.Gen. only from July 16, 1862. Re-verified.
- **William "Bull" Nelson — Brig. Gen. (encoded correct).** Brig.Gen. (from Sept 16, 1861) at Shiloh; Maj.Gen. from July 19, 1862. Re-verified.
- **James R. Chalmers — Brig. Gen. (encoded correct; D92 Wood->Chalmers fix confirmed).** Brigadier general (from Feb 13, 1862) commanding the Mississippi brigade (2nd Brigade, Withers's division). Re-verified.
- **Prior-hardening leaders not shown in this digest excerpt** (Breckinridge Brig.Gen., Bragg RIGHT wing, W.H.L. Wallace d.Apr 10) — consistent with the historical record, but the digest provided did not include the main-army leader roster, so they were not directly re-verified this pass (see Section 7). Note: the CSA had no lieutenant-general grade before Oct 1862, so Breckinridge could at most have been a brigadier general at Shiloh — the encoded Brig.Gen. is consistent with the record and there is no reason to suspect error. Flagged only as "verify against data/shiloh.json," not "revise."

## 5. Terrain And Teaching / Anti-Lost-Cause Check

- **Named ground accurate.** Sunken Road/Hornets' Nest, Peach Orchard, Crossroads, Pittsburg Landing, River Road, Corinth Road all verified as real Shiloh features.
- **Teaching card "sh_cost" sound.** The 13,047 / 10,699 / 23,746 figures and the "more than the Revolution, 1812, and Mexican War combined" comparison are the standard, well-sourced framing; the Grant "death-blow to the idea that the war would be short" quotation is genuinely from his Memoirs and correctly attributed.
- **Teaching card "sh_surprise" sound (as far as shown).** Corinth ~20 miles, Johnston reinforced to ~44,000, and Grant's failure to entrench are all accurate; ABT's own "Shattering Myths" article supports the surprise-and-no-entrenchments framing. This is squarely anti-Lost-Cause — it holds Grant accountable rather than mythologizing, and credits W.H.L. Wallace's men (not just Prentiss) for the Hornets' Nest, which matches current scholarship.
- **Endnote framing sound.** The alt-history "history is overturned" text correctly states the actual outcome (Grant surprised, pressed to Pittsburg Landing, saved by Buell's overnight arrival; the Hornets' Nest historically fell) — no Lost-Cause inversion.

## 6. D74 / D92 No-Fudge Adherence

No per-battle fudge visible in the digest. Casualty numbers appear only inside teaching text (an explicit teaching device, never an output gate), and the D235 note confirms smoothbore parity rather than a per-battle firepower buff. Reinforcements are encoded as timed arrivals (atSec) with commander/gun inputs, so the outcome emerges from OOB + timing + gun-counts per the universal model. Adherence confirmed.

## 7. Remaining Uncertainties

- **Main-army leader/unit roster not present in the digest excerpt provided.** The digest lists only the four reinforcements plus teaching/endnote — it does not show the primary encoded leaders (Johnston, Beauregard, Grant, Sherman, Prentiss, W.H.L. Wallace, Bragg, Breckinridge) or line units. The D92 fixes for Breckinridge's rank, Bragg's wing, and W.H.L. Wallace's death date therefore could not be re-verified directly against the encoding this pass; they should be confirmed against data/shiloh.json. Nothing suggests they are wrong.
- **Per-unit strengths and exact arrival minutes** remain Inferred (medium) by the build's own provenance — the OOBs differ across Cunningham, Sword, and the Official Records. This is honestly disclosed and not a defect; left as a known estimate.
- **CS casualty figure variant (10,669 vs 10,699).** One ABT page rendered 10,669; the digest's 10,699 is the standard figure and the only one internally consistent with the 23,746 total. Not a flag, but noted for completeness.

## 8. Audit Verdict

**SOLID_AS_IS (ratified).** Every claim the digest exposes — four reinforcement commanders at their correct battle-date ranks (Ruggles/Chalmers Brig.Gen., Ammen Col, Nelson Brig.Gen.), the Ruggles grand-battery gun-count with its honest 53-62 hedge, the named terrain, and the casualty/teaching framing — is confirmed against NPS and American Battlefield Trust, and the anti-Lost-Cause framing is sound. The D92 rank fixes (Ammen Col, Wood->Chalmers) hold. The D328 adversarial pass independently re-fetched all four reinforcement ranks and found no error to add and no flag to remove (Section 3 proposed none). No source-backed revision is warranted; the only open item is that the main-army leader roster was outside the digest excerpt and should be spot-checked against the JSON, not "fixed."

## Verification Notes (D328 adversarial pass)

**What I fetched / searched (all High-confidence, reputable):**
- Jacob Ammen — Wikipedia + ABT "Shattering Myths": Colonel, 24th Ohio, 10th Brigade at Shiloh; promoted Brig.Gen. July 16, 1862 (after the battle).
- William "Bull" Nelson — ABT biography + Wikipedia: Brig.Gen. of volunteers from Sept 16, 1861; led 4th Division, Army of the Ohio at Shiloh; Maj.Gen. July 19, 1862 (after the battle).
- James R. Chalmers — Wikipedia + ABT official report + HistoryNet: promoted Brig.Gen. Feb 13, 1862; commanded 2nd Brigade, Withers's Division at Shiloh (the Mississippi "High Pressure Brigade") in the final April-6 push toward Pittsburg Landing.
- Daniel Ruggles — Wikipedia: Brig.Gen. from Aug 9, 1861; commanded a division in Bragg's corps and organized the 53-62 gun grand battery on April 6, 1862.

**Flags CONFIRMED as real:** none — Section 3 proposed no revisions.

**Flags REFUTED:** none required — there were no revision rows to overturn. The audit correctly recommended zero changes; the adversarial pass verifies that recommendation rather than reversing a bad "fix." (Guard applied: the CSA had no lieutenant-general grade before Oct 1862, so no Shiloh-date encoding above brigadier general could have slipped in for these commanders — none did.)

**Missed error added:** none — the four encoded reinforcement ranks are each independently confirmed correct, and the digest exposes no other rank/geography claim to check.

**Ratified verdict:** SOLID_AS_IS. The main-army roster (Johnston/Beauregard/Grant/Sherman/Prentiss/W.H.L. Wallace/Bragg/Breckinridge) lies outside the digest excerpt and remains a spot-check-against-JSON item, not a revision.