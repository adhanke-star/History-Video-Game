# Built-Battle Research Audits (D328)

Durable, citation-grade **research/audit packets for the 10 already-built battles**, produced so Codex can revise them alongside building the new battles researched in the parent [../README.md](../README.md) (D327). This is **research/docs only** — no packet here changes `data/*.json`, runtime, or the generated deliverable.

**Why this exists:** the built battles were already history-hardened (D92 rank/roster audit over all pre-Chattanooga battles; D86 Vicksburg bug-hunt; D90 Chickamauga bug-hunt; D325/D326 Chattanooga source-verify), but they lacked a durable, source-registered audit that confirms what's solid and hands Codex a precise revision checklist. D328 adds exactly that, at the same standard as the D327 forward-looking library.

## How each audit was produced

For each battle, a compact digest of the **actually-encoded** ranks/units/terrain/teaching (extracted from `data/<id>.json`) was handed to an Opus auditor that web-verified the riskiest encoded claims, then to an **adversarial Opus verifier** whose explicit job was to protect the D92-hardened data from bad "fixes" — refute false flags and catch missed errors — followed by an Opus 4.8 main-loop final verify against the live data file. This two-layer design mattered: it **caught a missed error** and **refuted a false flag** (see below). Each packet ends with a Verification Notes section.

## Audit-verdict taxonomy

- **SOLID_AS_IS** — no confirmed revisions needed; the encoded content is source-accurate.
- **MINOR_REVISIONS** — small, confirmed, source-backed fixes listed in the packet's "Revision Checklist For Codex."
- **NEEDS_REVISION** — a material confirmed error.

## The audits

| Audit | Battle | Verdict | Confirmed revisions for Codex |
|---|---|---|---|
| [bullrun-built-battle-audit.md](bullrun-built-battle-audit.md) | First Bull Run (Jul 21 1861) | **SOLID_AS_IS** | None |
| [antietam-built-battle-audit.md](antietam-built-battle-audit.md) | Antietam (Sep 17 1862) | **MINOR_REVISIONS** | **1** — `us_richardson.commander` `Brig. Gen.` → **`Maj. Gen. Israel B. Richardson`** (MG since Jul 4 1862; the file's own `ld_richardson` leader entry already says Maj. Gen., so it is an internal self-contradiction; outcome-neutral label fix) |
| [fredericksburg-built-battle-audit.md](fredericksburg-built-battle-audit.md) | Fredericksburg (Dec 13 1862) | **SOLID_AS_IS** | None — auditor's Owen→Col. flag was **REFUTED** (Owen was a Brig. Gen. via a Nov 1862 recess appointment, unlike Zook; applying the "fix" would inject an error) |
| [chancellorsville-built-battle-audit.md](chancellorsville-built-battle-audit.md) | Chancellorsville (May 1863) | **SOLID_AS_IS** | None (D92 Rodes/Best/Colston fixes hold) |
| [malvern-hill-built-battle-audit.md](malvern-hill-built-battle-audit.md) | Malvern Hill (Jul 1 1862) | **SOLID_AS_IS** | None (D92 Hunt/Jackson/Porter/Hooker fixes hold) |
| [gettysburg-built-battle-audit.md](gettysburg-built-battle-audit.md) | Gettysburg (Jul 1-3 1863) | **SOLID_AS_IS** | None (D92 Doubleday/Early/Stannard fixes hold) |
| [shiloh-built-battle-audit.md](shiloh-built-battle-audit.md) | Shiloh (Apr 6-7 1862) | **SOLID_AS_IS** | None (D92 + D235 Ruggles/smoothbore fixes hold) |
| [vicksburg-built-battle-audit.md](vicksburg-built-battle-audit.md) | Vicksburg (May-Jul 1863) | **SOLID_AS_IS** | None (D86 M.L. Smith / Hebert relocation holds) |
| [chickamauga-built-battle-audit.md](chickamauga-built-battle-audit.md) | Chickamauga (Sep 19-20 1863) | **SOLID_AS_IS** | None (D90 Harker/Hood/Helm fixes hold) |
| [chattanooga-built-battle-audit.md](chattanooga-built-battle-audit.md) | Chattanooga (Nov 23-25 1863) | **SOLID_AS_IS** | None (D325/D326 source-verify holds) |

## Bottom line

**9 of 10 built battles are source-accurate as-is** — the D92/D86/D90/D325 hardening held up under independent re-verification. **Antietam** is the only one needing a revision: a single **outcome-neutral rank-label fix** (`us_richardson.commander` `Brig. Gen.` → `Maj. Gen.`), which also resolves an internal self-contradiction with the file's own leader entry — the antietam probe should stay 16/16. One auditor **false flag** (Fredericksburg's Owen) was correctly refuted so Codex is not sent to break a correct fact.

Every audit obeys the same law as the forward library: **D74** (no per-battle damage/firepower/casualty/winner fudge; casualty figures are teaching, not output gates), **D92** (accurate inputs, never an output gate), and citation-grade, anti-Lost-Cause history. The anti-Lost-Cause framing in each battle's teaching text was checked and confirmed sound.

## Guard

`tools/probe-battle-build-research.mjs` also guards this subfolder: it verifies all 10 built-battle audit packets exist, that each carries a Source Register / Confirmed Solid / Revision Checklist For Codex / D74-D92 adherence / Audit Verdict, that this README indexes every audit, and that each declares a parseable SOLID_AS_IS / MINOR_REVISIONS / NEEDS_REVISION verdict.
