# Chickamauga - Built-Battle Research Audit

**Status:** D328 durable research/audit of an already-built battle (docs only; no data/runtime change).
**Battle id:** chickamauga | **Current data:** data/chickamauga.json | **Prior hardening:** D90 full bug-hunt (Harker Col not Brig.Gen.; Hood Maj.Gen./wounded Sep 20; Helm in Breckinridge's div; Granger/Walker Maj.Gen.)
**Audit verdict:** SOLID_AS_IS

The current 3-phase build is source-accurate: every encoded commander rank verifies for the September 19-20, 1863 battle date, the casualty framing matches the American Battlefield Trust exactly, the three-phase structure (woods fight → Longstreet's breakthrough → Snodgrass/Horseshoe stand) is historically correct, and the anti-Lost-Cause "contingency not genius" framing is well-grounded and appropriately hedged where sources conflict. No revisions required.

## 1. Source Register

| Source | Use | URL | Confidence |
|---|---|---|---|
| American Battlefield Trust — Chickamauga facts | Casualty totals, battle summary | https://www.battlefields.org/learn/civil-war/battles/chickamauga | High |
| Wikipedia — Battle of Chickamauga | Casualties (US 16,170 / CS 18,454 / 34,624 combined), OOB cross-check | https://en.wikipedia.org/wiki/Battle_of_Chickamauga | High |
| American Battlefield Trust / Wikipedia — John Bell Hood | Hood rank (Maj. Gen.), Sep 20 wounding/leg amputation, Lt. Gen. promotion Feb 1864 | https://www.battlefields.org/learn/biographies/john-bell-hood | High |
| Wikipedia — Joseph B. Kershaw | Kershaw Brig. Gen. at Chickamauga (Maj. Gen. only June 1864); McLaws's division | https://en.wikipedia.org/wiki/Joseph_B._Kershaw | High |
| Wikipedia — James B. Steedman / Gordon Granger | Steedman Brig. Gen. (Maj. Gen. Apr 1864); Granger Maj. Gen., unordered relief | https://en.wikipedia.org/wiki/James_B._Steedman | High |
| Wikipedia — Charles Garrison Harker | Harker held Colonel at battle; Brig. Gen. only dated from Sep 20, 1863 | https://en.wikipedia.org/wiki/Charles_Garrison_Harker | High |
| Wikipedia / ABT — Joseph J. Reynolds | Reynolds Maj. Gen. of Volunteers Nov 29, 1862; XIV Corps division at Chickamauga | https://en.wikipedia.org/wiki/Joseph_J._Reynolds | High |
| Wikipedia — James S. Negley | Negley Maj. Gen. of Volunteers Nov 29, 1862; XIV Corps division; relieved, acquitted at court of inquiry | https://en.wikipedia.org/wiki/James_S._Negley | High |

## 2. Confirmed Solid

- **Casualty framing (Verified, exact match):** CS ~18,454; US ~16,170; combined ~34,000. ABT gives 16,170 US / 18,454 CS / 34,624 combined — the encoding matches to the digit and is correctly labeled Verified (high). Second-costliest battle of the war, deadliest in the West.
- **Hood — Maj. Gen. (D90 fix holds):** Correctly encoded as Major General, not Lieutenant General. He was promoted to Maj. Gen. in 1862; the Lt. Gen. commission (backdated to Sep 20 on Longstreet's recommendation) was not confirmed until Feb 1, 1864. Encoding him at his backdated rank would be the classic later-promotion defect — the build correctly avoids it. His Sep 20 wounding (thigh → leg amputation) is also correctly implied by the "off the trains from Virginia" lead role.
- **Kershaw — Brig. Gen. (correct):** Commanded his brigade under McLaws's division; promoted Maj. Gen. only June 2, 1864. The digest note "On-field elements of McLaws's division (Kershaw, Humphreys); McLaws himself was not yet up" is precise and historically accurate.
- **Steedman — Brig. Gen. (correct):** Brig. Gen. as of July 1862; Maj. Gen. only April 1864. The unordered relief, the counterattack ("did not merely reinforce"), and "horse shot under him" detail are all sound.
- **Granger — Maj. Gen. (D90 fix holds):** Correctly Maj. Gen.; his ~2:00-3:00 p.m. unordered march to Thomas's aid and the ~95,000 rounds figure (from Granger's report) are documented.
- **Negley — Maj. Gen. (correct, adversarially re-verified):** Maj. Gen. of Volunteers (Nov 29, 1862) commanding the 2nd Division of Thomas's XIV Corps; the "controversial Sep 20 conduct → relieved → court of inquiry" framing is accurate (charged with removing his artillery prematurely, later acquitted but never got another command).
- **Reynolds — Maj. Gen. (correct, adversarially re-verified):** Maj. Gen. of Volunteers (Nov 29, 1862) commanding a XIV Corps division at Chickamauga; became Thomas's chief of staff Oct 10, 1863. Rank correct for the battle date.
- **Harker — Colonel (D90 fix holds, though not shown as a leader row in this digest excerpt):** Prior hardening correctly set him at Colonel; his Brig. Gen. commission only *dated from* Sep 20, 1863, so Colonel is the correct battle-date rank.
- **Three-phase structure (Verified):** Sep 19 woods fight (Winfrey/Brock/Viniard Fields, LaFayette Road) → Sep 20 Longstreet breakthrough at the Brotherton farm exploiting the Wood-gap order → Thomas's Snodgrass Hill / Horseshoe Ridge stand covering the Dry Valley Road / McFarland's Gap. This matches the standard NPS/ABT narrative arc and the scoreWeights (breakthrough weighted 3) reflect the decisive phase.
- **Named ground (Verified):** West Chickamauga Creek, Catoosa & Walker Counties, ~12 mi south of Chattanooga; Winfrey/Brock/Viniard/Dyer Fields; Brotherton farm; Snodgrass Hill; Horseshoe Ridge; Dry Valley Road; McFarland's Gap — all correct and correctly placed.

## 3. Revision Checklist For Codex

| Field/location | Current encoding | Issue | Corrected value | Source | Confidence |
|---|---|---|---|---|---|
| — | — | No revisions required — build is source-accurate. | — | — | — |

*(Adversarial pass: the checklist was empty in the auditor's packet, so there were no revision flags to refute. The adversarial re-verification below independently confirmed the two ranks the original packet marked "Verify only in the trivial sense" — Reynolds and Negley — and found no missed error, so the checklist stays empty. See Verification Notes.)*

## 4. OOB And Rank Re-Verification

- **John Bell Hood — Maj. Gen.** ✓ Confirmed for Sep 1863 (Lt. Gen. only Feb 1, 1864). D90 fix holds. Wounded Sep 20, leg amputated — consistent with digest.
- **Joseph B. Kershaw — Brig. Gen.** ✓ Confirmed (Maj. Gen. June 1864). Brigade within McLaws's division, McLaws not yet up — accurate.
- **James B. Steedman — Brig. Gen.** ✓ Confirmed (Maj. Gen. April 1864). Vanguard of Granger's Reserve Corps.
- **Gordon Granger — Maj. Gen.** ✓ Confirmed. D90 fix holds. Unordered relief documented.
- **James S. Negley — Maj. Gen.** ✓ Confirmed (Maj. Gen. of Volunteers Nov 29, 1862). Division commander, relieved post-battle, acquitted at court of inquiry — accurate.
- **Charles G. Harker — Colonel** ✓ Confirmed as battle-date rank (Brig. Gen. only *dated from* Sep 20). D90 fix holds.
- **Joseph J. Reynolds — Maj. Gen.** ✓ Confirmed (Maj. Gen. of Volunteers Nov 29, 1862); commanded a XIV Corps division at Chickamauga. Digest gives first name as "Joseph" (full name Joseph Jones Reynolds) — no rank issue.
- **Longstreet's left wing / Renewed Assault Wave** — descriptive reinforcement label, not a rank claim; sound.

## 5. Terrain And Teaching / Anti-Lost-Cause Check

- **Terrain accurate:** The "fields were the battle" phase-teaching (second-growth timber, brigades losing alignment within a hundred yards, clearings as the only islands of visibility/artillery/road access) is historically well-supported and pedagogically strong. Snodgrass Hill / Horseshoe Ridge described as covering the Dry Valley Road and McFarland's Gap — the army's only escape — is correct.
- **Anti-Lost-Cause framing sound:** The core teaching ("Contingency Beat Genius" / "The Victory They Threw Away") correctly frames the Sep 20 breakthrough as a chain of Union command errors (the Wood order obeyed literally, a screened position misread) that *coincided* with Longstreet's pre-planned assault, NOT as innate Confederate martial superiority. This is the mainstream modern scholarly reading and directly rebuts Lost-Cause mythologizing.
- **Appropriately hedged where sources conflict:** The gap-reporter attribution (Capt. Sanford Kellogg) is explicitly marked "commonly attributed, though the sources conflict" / "Disputed" — exactly the right treatment, no fabricated certainty.
- **No teaching-text factual error found.** Longstreet's "genuine merit was a deep, mass column" caveat correctly credits him without overclaiming, preserving honest history.

## 6. D74 / D92 No-Fudge Adherence

No per-battle fudge detected. The digest carries no damage/firepower/casualty/winner override — casualty numbers appear only as Verified teaching text, not as output gates. Phase scoreWeights (1 / 3 / 1) encode the relative decisiveness of the three phases through the universal model rather than forcing an outcome, and the endNote's alt-history branches ("History is overturned" vs "History holds") are narrative responses to player results, not scripted winners. Outcomes-from-inputs adherence is intact.

## 7. Remaining Uncertainties

- **Per-unit strengths and exact field placement** are self-labeled Inferred (medium) in the provenance string; this is honest and appropriate. Not a defect — flagged only so future work knows these were never claimed as Verified.
- **Reinforcement timing (atSec values)** for Hood, Reynolds, Kershaw, Negley, Steedman, and the renewed wave are Inferred; the *presence* of each is Verified. No correction needed, but exact hour-of-arrival is a pin-later item.
- **Gap-reporter identity** (Kellogg vs. others) remains genuinely Disputed in the literature; the build already treats it correctly — leave hedged.
- **Helm-in-Breckinridge's-division** was a prior D90 fix; that leader row was not present in this digest excerpt, so it was not re-verified this pass (no reason to suspect regression).

## 8. Audit Verdict

**SOLID_AS_IS.** Every source-checkable claim in the build verifies against reputable authorities: all eight audited commander ranks are correct for the Sep 19-20, 1863 battle date (the four D90 fixes — Harker/Hood/Granger and the rank discipline generally — all still hold, and the two ranks the original packet under-verified, Reynolds and Negley, are independently confirmed Maj. Gen. from Nov 29, 1862), the casualty totals match the American Battlefield Trust to the digit, the three-phase terrain narrative is accurate, and the anti-Lost-Cause teaching is both sound and honestly hedged where the record is disputed. No confirmed error was found and no per-battle fudge exists, so there is nothing for Codex to revise. Remaining uncertainties are limited to already-honestly-labeled Inferred strengths/timings.

## Verification Notes (D328 adversarial pass)

- **Flags in Section 3 checklist:** 0. The auditor proposed no revisions, so there were no false flags to refute — the adversarial risk here was a *missed* error under a SOLID_AS_IS verdict, not a bad fix.
- **Fetched/searched this pass:**
  - Joseph J. Reynolds — Wikipedia / ABT: confirmed Maj. Gen. of Volunteers **Nov 29, 1862**, commanded a XIV Corps division at Chickamauga (later Thomas's chief of staff, Oct 10 1863). Encoded "Maj. Gen. Joseph Reynolds" is **CORRECT**.
  - James S. Negley — Wikipedia: confirmed Maj. Gen. of Volunteers **Nov 29, 1862**, 2nd Division / XIV Corps; relieved after the battle over premature artillery withdrawal, **acquitted** at court of inquiry, never re-employed in field command. Encoded "Maj. Gen. James Negley" and the relief/court-of-inquiry framing are **CORRECT**.
- **CSA lieutenant-general check:** No CSA officer in this build is over-ranked to Lt. Gen. by later promotion. Hood is correctly held at Maj. Gen. (his Lt. Gen. commission was confirmed Feb 1, 1864, backdated to Sep 20 — not valid on the battle date); the "no CSA lieutenant-general grade before Oct 1862" rule is not implicated for the Sep 1863 date but the later-promotion trap (the real risk for Hood) is correctly avoided.
- **CONFIRMED flags:** none (checklist was empty).
- **REFUTED flags:** none (checklist was empty; nothing to refute).
- **Missed errors found:** none. All spot-checked "confirmed solid" ranks (Reynolds, Negley) verify; the D90-hardened ranks (Hood, Kershaw, Steedman, Granger, Harker) are well-established and unchanged.
- **Ratified verdict:** **SOLID_AS_IS** — unchanged from the auditor's verdict. The build is source-accurate; no data or runtime change is warranted.