# Vicksburg - Built-Battle Research Audit

**Status:** D328 durable research/audit of an already-built battle (docs only; no data/runtime change).
**Battle id:** vicksburg | **Current data:** data/vicksburg.json | **Prior hardening:** D86 full bug-hunt (M.L. Smith at Stockade Redan; Hebert relocated to 3rd Louisiana Redan) + D92 (M.L. Smith Brig. Gen.)
**Audit verdict:** SOLID_AS_IS (ratified by D328 adversarial pass)

The current 3-phase siege build is source-accurate: the one named leader (Hugh Ewing) carries the correct rank, every terrain name (Stockade Redan, 3rd Louisiana Redan, Great Redoubt, Railroad Redoubt, Battery DeGolyer, the Graveyard/Jackson Road approaches, the June 25 mine) is authentic, and the teaching frame is anti-Lost-Cause sound. No source-backed revision found.

## 1. Source Register
| Source | Use | URL | Confidence |
|---|---|---|---|
| American Battlefield Trust — Vicksburg | Siege sequence, assault dates, July 4 surrender, strategic result | https://www.battlefields.org/learn/civil-war/battles/vicksburg | High |
| Iron Brigader — Hugh Ewing's Brigade in the Vicksburg Assaults (May 19 & 22, 1863) | Ewing rank (Brig. Gen.), brigade composition, Graveyard Road / Stockade Redan assault role | https://ironbrigader.com/2019/05/19/general-hugh-ewings-brigade-in-the-vicksburg-assaults-of-may-19th-and-may-22nd-1863/ | High |
| Wikipedia — Siege of Vicksburg (defense) | Confederate fortification list & sectors; M.L. Smith division/rank; Hébert brigade at the 3rd Louisiana Redan front; June 25 mine under XVII Corps (Logan) | https://en.wikipedia.org/wiki/Siege_of_Vicksburg | Medium-High |
| NPS — Vicksburg NMP (West Virginia Troops / campaign series) | Sector geography, siege-craft narrative, corps assignments | https://home.nps.gov/vick/learn/historyculture/west-virginia-troops-in-the-vicksburg-campaign.htm | High |
| NPS — Brig. Gen. Hugh Ewing (Vicksburg NMP) | Ewing rank + brigade at Vicksburg | https://www.nps.gov/vick/learn/historyculture/brig-gen-hugh-ewing.htm | High |

## 2. Confirmed Solid
- **Siege timeline** — invested May 18, first assault May 19, Grand Assault May 22, surrender July 4, 1863. Matches ABT/NPS exactly.
- **Hugh Ewing = Brig. Gen.** on May 19/22, 1863 — confirmed. Promoted brigadier Nov 29, 1862; he led his brigade (30th/37th/47th Ohio, 4th W.Va.) up the Graveyard Road toward the Stockade Redan complex; the "Ewing's Support Line" reinforcement is historically apt.
- **Stockade Redan on Graveyard Road** as the May 19 northern ridge throat — authentic; the phase's "defended ridge throat walled by ravines" description is accurate geography.
- **3rd Louisiana Redan + Great Redoubt astride the Jackson Road** as the May 22 front — authentic named ground.
- **M.L. Smith Brig. Gen. (D92 fix) still correct** — Smith commanded a division at the siege and was not promoted to major general until Nov 4, 1863 (brigadier from Apr 11, 1862); his D92-set brigadier rank holds for May–July 1863.
- **Hébert at the 3rd Louisiana Redan sector (D86 relocation) still correct** — Louis Hébert's brigade (incl. 36th Mississippi / 3rd Louisiana) held that front; the D86 move from Stockade Redan is consistent with the sources.
- **Phase 2 siege craft** — Battery DeGolyer, Logan's approach/sap, and the mined 3rd Louisiana Redan (June 25 explosion, XVII Corps assault) are all authentic; the "River Battery Pressure / Mississippi Squadron" abstraction is a fair universal-gun stand-in for combined river+siege fire.
- **Strategic result** — river split, Trans-Mississippi severed, Gettysburg + Vicksburg in the same week. Correct.

## 3. Revision Checklist For Codex
| Field/location | Current encoding | Issue | Corrected value | Source | Confidence |
|---|---|---|---|---|---|
| — | — | No revisions required — build is source-accurate. | — | — | — |

*No revision rows were proposed by the auditor, and the D328 adversarial pass found none to add. See Verification Notes below.*

## 4. OOB And Rank Re-Verification
- **Hugh Ewing — Brig. Gen. (May 19 & 22, 1863):** CONFIRMED via NPS / Iron Brigader / OR report; promotion dated Nov 29, 1862, so brigadier is correct for the battle window. Only explicitly named leader in the digest; rank correct.
- **Martin Luther Smith — Brig. Gen. (D92 fix):** CONFIRMED correct for the battle window; brigadier Apr 11, 1862, MG promotion dated Nov 4, 1863 (after the siege). Watch item is satisfied — no backdated promotion in the encoding. (Context only — Smith is not a named leader in this digest.)
- **Louis Hébert — Brig. Gen. / 3rd Louisiana Redan sector (D86 relocation):** CONFIRMED brigadier and sector; not a rank issue. (Context only — Hébert is not a named leader in this digest.)
- **All other reinforcements** ("Vicksburg garrison," "Army of the Tennessee," "Logan's front," "Mississippi Squadron support," "Interior Reserve") are deliberately corps/garrison-level abstractions with no personal rank to verify — appropriate for a siege model and not a defect.

## 5. Terrain And Teaching / Anti-Lost-Cause Check
- Named ground (Stockade Redan, Graveyard Road, 3rd Louisiana Redan, Great Redoubt, Railroad Redoubt, Jackson Road, Battery DeGolyer, the saps/mine) is all accurate and correctly assigned to the right phase.
- Teaching cards are historically sound: "The May assaults failed for architectural reasons... it is geometry, not romance" and "hunger is real, but it is the result of operational isolation plus siege architecture, not a substitute for it" are textbook anti-Lost-Cause framing — they credit Union maneuver + engineering, refuse the "starved into surrender / heroic defenders" myth, and keep hunger as a consequence not a cause. No factual error in teaching text.
- Minor nuance (not a flag): on May 19 Ewing's specific objective was the 27th Louisiana Lunette just west of the Stockade Redan; the digest names the phase "Stockade Redan" at sector level, which is correct for the assault complex and appropriate for teaching granularity.

## 6. D74 / D92 No-Fudge Adherence
No per-battle fudge visible. Reinforcements are timed OOB feeds (atSec) and one universal-gun abstraction (6 guns for river/siege pressure) — inputs, not output gates. Casualty/hunger content lives only in teaching text, not as a forced winner or damage multiplier. Outcomes-from-inputs (OOB + terrain + timing + gun model + scoreWeight, with Phase 2 weighted 3 to reflect that the siege, not the assaults, decided it) is adhered to.

## 7. Remaining Uncertainties
- Per-unit strengths and exact sector timing are self-labeled "Inferred (medium)" in the provenance and were not independently pinned this pass — accepted as teaching-grade estimates, not errors.
- The digest is truncated (teaching/endNote bodies cut off); this audit verified the visible content. If Codex touches the full JSON, spot-check the truncated `vb_failed_assaults` card tail and the CS-victory endNote branch for any stray claim, though nothing in the visible text raises concern.
- Battery DeGolyer's precise commander/unit (Capt. Henry DeGolyer, 8th Michigan Light Artillery, Logan's front) was not deep-verified this pass since the digest only names the battery, not a leader — low risk.

## 8. Audit Verdict
**SOLID_AS_IS (ratified).** The single named commander is correctly ranked (Hugh Ewing, Brig. Gen. from Nov 29, 1862), the D86 and D92 hardening fixes (M.L. Smith brigadier; Hébert at the 3rd Louisiana Redan) both still check out against the sources, all named terrain is authentic and correctly phased, and the teaching frame is anti-Lost-Cause sound. No source-backed revision was found; the abstracted garrison/corps reinforcements are appropriate for a siege and carry no verifiable rank defect. Sending Codex to "fix" anything here would risk breaking a correct build.

## Verification Notes (D328 adversarial pass)
- **Fetched/searched:**
  - Hugh Ewing promotion date + Vicksburg brigade command — NPS Vicksburg NMP (Brig. Gen. Hugh Ewing) and secondary bios: promoted **Brig. Gen. Nov 29, 1862**; led 30th/37th/47th Ohio + 4th W.Va. in the 1863 Vicksburg campaign. → Digest's "Brig. Gen. Hugh Ewing" is CORRECT.
  - Martin Luther Smith rank timeline — Wikipedia / bios: **Brig. Gen. Apr 11, 1862; Maj. Gen. Nov 4, 1863** (after the siege). → D92 brigadier stamp for May–Jul 1863 is CORRECT (no backdated MG).
- **Flags CONFIRMED (real, keep):** none — Section 3 contained no proposed revisions.
- **Flags REFUTED (removed to note):** none — there were no revision rows to refute.
- **Missed errors found and added:** none. The only rank-bearing named leader in the digest (Ewing) is correct; Smith and Hébert are referenced by the auditor as prior-hardening context but do not appear as named commanders in this digest, so they are not encoding-verifiable rank items here — their historical ranks nonetheless check out.
- **CSA lieutenant-general-grade guard (no LTG before Oct 1862):** not triggered — the digest names no CSA lieutenant general; all CS reinforcements are garrison/corps abstractions.
- **Ratified verdict:** SOLID_AS_IS. Do not dispatch Codex to change any Vicksburg field.