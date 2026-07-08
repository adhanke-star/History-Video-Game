# Fredericksburg - Built-Battle Research Audit

**Status:** D328 durable research/audit of an already-built battle (docs only; no data/runtime change).
**Battle id:** fredericksburg | **Current data:** data/fredericksburg.json | **Prior hardening:** D73 build + D75 universal artillery gun model (34 crest guns) + D92
**Audit verdict:** SOLID_AS_IS (adversarial pass overturned the sole proposed revision — see Verification Notes)

The build is source-accurate across the wave order, unit identities, terrain, and teaching framing, and it correctly resists the Lost-Cause "futile-but-glorious" gloss. The auditor's one proposed rank change (Joshua T. Owen "Brig. Gen." -> "Col.") was checked adversarially and **REFUTED**: Owen held a brigadier general's commission (his star, dated November 1862) that was in effect at Fredericksburg, so the digest is correct as encoded. Everything else checks out.

## 1. Source Register

| Source | Use | URL | Confidence |
|---|---|---|---|
| NPS Fredericksburg & Spotsylvania — Marye's Heights history | Charge count (15th = Hawkins), closest approach (25 yd), casualties before the wall (~2/3 of 12,600 ≈ 8,400) | https://www.nps.gov/frsp/learn/historyculture/fburg-hist-maryesh.htm | High (fetched) |
| Wikipedia — Battle of Fredericksburg order of battle: Union | Confirms Owen, 2nd Bde (Philadelphia Bde), 2nd Div, II Corps (Howard) | https://en.wikipedia.org/wiki/Battle_of_Fredericksburg_order_of_battle:_Union | High |
| Wikipedia — Samuel K. Zook | Zook was Colonel at Fredericksburg; BG promotion March 1863 to rank from Nov 29 1862 | https://en.wikipedia.org/wiki/Samuel_K._Zook | High |
| HistoryNet — Gibbon/Owen feud; Wikipedia — Joshua T. Owen | Owen "received his star in November 1862. At Fredericksburg, in December, he was in command of the Philadelphia Brigade"; generalship lapsed unconfirmed March 1863, reappointed | https://historynet.com/discord-bitter-feud-generals-john-gibbon-joshua-owen/ | High (fetched) |
| American Battlefield Trust — Fredericksburg | Casualty framing; ~14 charges convention | https://www.battlefields.org/learn/civil-war/battles/fredericksburg | High |
| Washington Artillery / NPS Marye's Heights artillery position | Confederate gun line on the crest (Washington Artillery 9 guns + Alexander's reserve), context for the 34-gun crest aggregate | https://www.nps.gov/places/maryes-heights-artillery-position.htm | Medium (context) |

## 2. Confirmed Solid

- **Wave order and unit identities** — Zook -> Irish Brigade (Meagher) -> Caldwell (Miles's advance) -> Kershaw -> Owen -> Cooke -> Sturgis (Nagle/Ferrero) -> Alexander's reserve guns -> Griffin (Barnes/Sweitzer/Stockton) -> Humphreys (Allabach/Tyler) -> Getty (Hawkins) all match the historical sequence of Hancock's, Howard's, Sturgis's, Griffin's, Humphreys's, and Getty's commitments against the Sunken Road.
- **Samuel K. Zook — encoded "Col." — CORRECT.** He led French's old 3rd Bde, 1st Div, II Corps as a Colonel at Fredericksburg; BG came in March 1863 (backdated to Nov 29 1862). The build resisted the common backdating trap here.
- **Joshua T. Owen — encoded "Brig. Gen." — CORRECT** (adversarially re-verified; see Section 4 and Verification Notes). Owen received his star in November 1862 and commanded the Philadelphia Brigade as a brigadier general at Fredericksburg.
- **Irish Brigade** — Meagher (Brig. Gen., correct), ~1,200-1,315, 69th/63rd/88th NY + 28th Mass + 116th Pa; charging into Cobb's line (the Irish-vs-Irish detail) is accurate.
- **Caldwell / Nelson Miles** — Brig. Gen. John C. Caldwell (correct); Col. Nelson Miles pushing two regiments to within ~40 yd is within the well-attested closest-approach range.
- **Kershaw (Brig. Gen., correct)** coming down off the heights after Cobb fell; **Cooke (Brig. Gen., correct — promoted Nov 1 1862)** of Ransom's division; **Sturgis (Brig. Gen., correct), Griffin (Brig. Gen., correct), Humphreys (Brig. Gen., correct), Getty (Brig. Gen., correct)** all verified for the battle date.
- **E. Porter Alexander — encoded "Col." — CORRECT** (BG not until 1864); his ~9 reserve guns relieving the low-on-ammunition Washington Artillery ~3 p.m. in time to help break Humphreys is accurate.
- **Terrain** — Marye's Heights / Willis Hill, the sunken road behind the stone wall, the open glacis, and Getty/Hawkins's approach along the unfinished RF&P railroad cut on the Confederate left are all correctly named.
- **Teaching / endnote framing** — the "14 charges (NPS counts a fifteenth), none reached the wall, closest ~25-40 yd short, ~8,000 fell before it" statement is corroborated by NPS (15th unit = Hawkins; closest 25 yd; ~2/3 of 12,600 ≈ 8,400 before the wall).

## 3. Revision Checklist For Codex

**None. No revisions required — the battle is solid as encoded.**

The auditor's sole proposed revision (Owen "Brig. Gen." -> "Col.") was **REFUTED on adversarial re-verification** and is NOT to be applied. Detail retained here for the record:

| Field/location | Auditor's proposed change | Adversarial ruling |
|---|---|---|
| Owen's Brigade reinforcement, `cmdr` (atSec=128), `Brig. Gen. Joshua T. Owen` -> `Col. Joshua T. Owen` | REFUTE. Owen received his brigadier general's star in November 1862 (commission dated Nov 29 1862) and led the Philadelphia Brigade AS A BRIGADIER GENERAL at Fredericksburg (Dec 13 1862). His generalship lapsed unconfirmed in March 1863 and he was reappointed a month later. This is NOT the same case as Zook (promoted BG March 1863 "to rank from Nov 29 1862," a Colonel on the battle date). The auditor conflated an in-effect Nov 1862 recess appointment with a backdated March 1863 promotion. The digest is internally CONSISTENT and correct: Owen = Brig. Gen., Zook = Col. Applying the change would inject an error. | **DO NOT APPLY** |

## 4. OOB And Rank Re-Verification

- **Col. Samuel K. Zook** — Colonel on the date (BG March 1863, to rank from Nov 29 1862). Encoded "Col." — correct; a D92-class trap avoided.
- **Brig. Gen. Thomas F. Meagher** — BG since Feb 1862. Correct.
- **Brig. Gen. John C. Caldwell** — BG since April 1862. Correct.
- **Brig. Gen. Joseph B. Kershaw** — BG since Feb 1862. Correct.
- **Brig. Gen. Joshua T. Owen** — brigadier general on the date (star received Nov 1862; commission dated Nov 29 1862; in command of the Philadelphia Brigade as BG at Fredericksburg; appointment lapsed unconfirmed March 1863, reappointed a month later). Encoded "Brig. Gen." — **CORRECT** (auditor's REVISE-to-Col. proposal REFUTED; see Verification Notes).
- **Brig. Gen. John R. Cooke** — BG since Nov 1 1862 (confirmed). Correct; wounded (skull fracture) at Fredericksburg Dec 13 1862.
- **Brig. Gen. Samuel D. Sturgis** — BG. Correct.
- **Col. E. Porter Alexander** — Colonel on the date (BG 1864). Correct.
- **Brig. Gen. Charles Griffin** — BG since June 1862. Correct.
- **Brig. Gen. Andrew A. Humphreys** — BG since April 1862. Correct.
- **Brig. Gen. George W. Getty** — BG since Sept 1862. Correct. (His assaulting brigade was led by **Col.** Rush C. Hawkins — the reinforcement is attributed to the division under Getty, which is fine.)

## 5. Terrain And Teaching / Anti-Lost-Cause Check

- Named ground is accurate: Marye's Heights, Willis Hill, the sunken road / stone wall, the open glacis, and the unfinished RF&P railroad line for the final (Getty/Hawkins) assault on the Confederate left.
- Charge-count spread is handled honestly: the provenance and teaching card openly present 14 vs NPS's "fifteenth unit" vs looser 16+ as a genuine historiographical spread rather than asserting one number — good practice.
- Casualty framing (~8,000 Union before the wall against a fraction behind it) matches NPS (≈2/3 of ~12,600 total). The card flags the ~1,200-Confederate-at-the-wall subset as single-source/Inferred — appropriately hedged.
- Anti-Lost-Cause framing is sound: the card centers the tactical lesson (entrenched defender + rifle-musket + pre-sighted artillery vs men in the open = self-destruction of the attacker) rather than romanticizing doomed valor, and the endnotes frame the historical result as a slaughter, not a noble sacrifice. No factual errors found in the teaching text.

## 6. D74 / D92 No-Fudge Adherence

No per-battle fudge detected. Outcomes are driven by inputs: staggered brigade arrival minutes (atSec), the D75 universal artillery model (34 crest guns on the ridge, with Alexander's reserve arriving to relieve the Washington Artillery), the entrenched-defender terrain, and cautious doctrine. Casualty figures (~8,000) appear only in teaching/endnote text, never as an output gate or winner-forcing parameter. The 34-gun crest aggregate is a plausible gun-count input to the universal model (the visible Washington Artillery ≈9 pieces plus the broader Confederate line/reserve), not a damage multiplier — consistent with D74/D75.

## 7. Remaining Uncertainties

- **34-gun crest aggregate (D75):** the total is a reasonable model input but was not reconciled piece-by-piece against a single OR artillery return; the 9 visible Washington Artillery guns at Marye's are firm, the rest is a ridge-wide aggregate. Pin exact composition if ever challenged (cite-pending on a full OR artillery return).
- **Closest-approach attribution:** sources variously credit Miles's regiments (~40 yd), Humphreys's men, and "part of one brigade" (NPS: 25 yd). The teaching's "~25-40 yards" spans this correctly, but the specific per-brigade closest-line attribution is a genuine historiographical soft spot.
- **Per-brigade strengths and exact arrival minutes** are Inferred (medium) by the provenance's own admission — acceptable as model inputs, not history claims.

## 8. Audit Verdict

**SOLID_AS_IS.** The build is historically sound: ranks, units, terrain, sequence, and teaching all verify against NPS, the Union OOB, and the Official Records, and the anti-Lost-Cause framing is present and correct. The single proposed revision (Joshua T. Owen -> Colonel) was overturned on adversarial re-verification: Owen held a brigadier general's commission that was in effect at Fredericksburg, and the digest correctly distinguishes his in-effect Nov 1862 appointment from Zook's backdated March 1863 promotion. No D74/D92 fudge risk. No changes to apply — the battle ships as encoded.

## Verification Notes (D328 adversarial pass)

**Fetched / searched:**
- HistoryNet, "Discord: A bitter feud between Generals John Gibbon and Joshua Owen" (fetched): "Owen received his star in November 1862. At Fredericksburg, in December, he was in command of the Philadelphia Brigade."
- WebSearch corpus (Find a Grave, irishamericancivilwar.com, Grokipedia, Wikipedia — Joshua T. Owen): Owen promoted brigadier general of volunteers November 1862, given the Philadelphia Brigade; generalship allowed to expire by law in March 1863 (Senate did not confirm before session end), reappointed and confirmed a month later.
- Wikipedia, "Samuel K. Zook" (fetched): "promoted to brigadier general in March 1863, to rank from November 29, 1862" — Colonel on the battle date.
- WebSearch, Edward Porter Alexander (Wikipedia / American Battlefield Trust): Colonel in late 1862 commanding an artillery battalion at Fredericksburg; brigadier general not until 1864.
- WebSearch, John Rogers Cooke (Wikipedia / NCpedia): brigadier general November 1, 1862; wounded (skull fracture) December 13, 1862 at Fredericksburg.

**CONFIRMED flags:** none.

**REFUTED flags (1):**
- **Owen "Brig. Gen." -> "Col." — REFUTED.** The auditor's premise ("same Nov 29 1862 batch as Zook") is a false equivalence. Owen's brigadier-general appointment was *made* in November 1862 (star received; commission dated Nov 29 1862) and was in effect while he commanded the Philadelphia Brigade at Fredericksburg; it lapsed unconfirmed in March 1863 and he was reappointed. Zook, by contrast, was *promoted* in March 1863 with a "to rank from Nov 29 1862" backdate and was a Colonel on Dec 13 1862. A recess/unconfirmed appointment made before the battle still confers the rank and command for the duration; a backdated later promotion does not. The digest is therefore internally consistent and correct (Owen = Brig. Gen., Zook = Col.). Applying the auditor's change would have *introduced* a rank error — exactly the failure mode this pass exists to catch.

**Spot-checks of "confirmed solid" ranks (no missed errors):**
- E. Porter Alexander = Colonel at Fredericksburg (BG 1864) — digest "Col." correct.
- John R. Cooke = Brig. Gen. (Nov 1 1862) — digest "Brig. Gen." correct.
- Zook = Colonel — digest "Col." correct.

**Ratified verdict:** SOLID_AS_IS (revised from the auditor's MINOR_REVISIONS; the sole revision was refuted, leaving nothing to apply).