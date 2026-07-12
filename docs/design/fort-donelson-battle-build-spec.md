# Fort Donelson Battle-Build Spec (D383)

**Status:** D383 planning/spec plus a filesystem-first, dual-mode plan probe. This slice adds no Fort Donelson runtime data, scenario registry entry, menu button, schema row, Army Register row, generated-game behavior, combat input, or baseline-count movement.

**Task shape:** build the seventh LANE-003 contract from `docs/design/battle-build-research/naval-river-battle-build-research.md` (`READY_FOR_SPEC`, D327 adversarial pass ratified) plus this session's 13-agent research workflow (6 Sonnet gather packets → 6 Opus default-refute verifiers → 1 Opus completeness critic; Fable adjudication owns every claim below). The playable unit is the combined land siege of Fort Donelson, February 12-16, 1862: Grant invests the landward works, Foote's flotilla is beaten at close range on February 14, the Confederate command wins its breakout on February 15 and throws the escape away, C. F. Smith carries the thinned outer works that afternoon, and the garrison passes into history under the first "unconditional surrender." The war's river theater enters the game as the war-winning axis it was — with **no ship-vs-ship engine** and no naval fudge.

## 1. Scope And Planning Boundary

**Battle:** Fort Donelson, Tennessee, February 1862 — the investment closes February 12-13 (McClernand's division took the road February 11, the main column February 12, a twelve-mile overland march from Fort Henry); probes February 13; naval repulse February 14; breakout and recapture February 15; surrender February 16.

**Tactical id and future file:** `fortDonelson` in `data/fort-donelson.json`.

**Playable shape:** a three-phase T8 combined land siege over the landward works. The engine fights the LAND battle only; the river war enters as inputs and teaching (section 5).

- **Roles:** top-level `attacker:"US"` / `defender:"CS"`. Phase roles flip per phase exactly as Cedar Creek's shipped role-reversal seam allows: Phase 1 US attacker / CS defender, Phase 2 **CS attacker / US defender**, Phase 3 US attacker / CS defender.
- **Phase law:** exactly three `phases[]` — `The Investment - Feb 13` (scoreWeight 1) → `The Breakout - Feb 15` (scoreWeight 1) → `The Recapture - Smith's Assault` (scoreWeight 3, DECISIVE). The `scoreWeight` array is `[1, 1, 3]`; weights sum 5; decisive index = 2.
- **Weight deviation, owned and logged:** this contract **deviates from the packet's `[1, 3, 1]`** (decisive = the breakout). The deviation is forced by the D92 accurate-inputs law: the sourced phase leans (CS holds, CS seizes, US seizes) under `[1, 3, 1]` would make the AGGREGATE a Confederate victory on the AI-vs-AI baseline — but the sourced aggregate result is a Union victory (the surrender of the garrison). The only weight assignment consistent with all four sourced directions puts the decisive weight on Phase 3, where the battle's result was in fact decided: the works were retaken, the road was shut, and the garrison was doomed. The packet's teaching — the Confederates *won the ground and abandoned it* — is preserved undiluted on the Phase 3 transition card (section 4/9), not by mis-scoring the battle.
- **Fog:** top-level `defaultFog:false`, and no phase sets fog on. Visibility was not the load-bearing feature of any of the three fights; the works, the freezing weather, the thinned sectors, and the command collapse were. Weather is presentation-only (section 6 of the packet; section 9 here).
- **The Feb 14 naval repulse is a TEACHING INTERSTITIAL**, never a scored phase: it ships on Phase 2's `transition.lead` (the inter-phase card the player reads between the Investment and the Breakout) with its own teaching card — Foote's ironclads beaten at close range, the storm night, and the transports landing Lew Wallace's division. The Stones River January-1 Emancipation interstitial is the shipped precedent. No T8 code change is required.
- **Objectives:** Phase 1 — the landward works ring (CS holds it); Phase 2 — the escape-road exit where the Forge Road and Wynn's Ferry Road left the Union right (CS seizes it); Phase 3 — the outer works on the Confederate right (Buckner's vacated rifle-pit sector; US seizes it).
- **Menu rank:** `fortDonelson:48`, before `shiloh:50` — the Western arc runs in campaign chronology (Donelson February 1862 → Shiloh April 1862 → Stones River → Vicksburg → Chickamauga → Chattanooga → Kennesaw → Franklin → Nashville). The kickoff's "rank ~20s" suggestion was checked and rejected: the 10-45 band is the curated Eastern/USCT marquee arc, and rank 20 would wedge the war's first Western epic between Malvern Hill and Antietam. 48 is the chronology-true Western slot.
- **Terminal boundary:** D383 stops before `data/fort-donelson.json`, T1/T10 registration, any focused runtime probe, any count movement, any generated-game behavior change, and the full release battery.

## 2. Research Basis And Source Register

This contract uses the committed naval-river packet, the D327 adversarial pass, and this session's gather→default-refute→critic workflow. No claim is promoted beyond its evidence. A URL's presence does not turn a thin or disputed claim into a Verified claim.

| Source | Contract use | Confidence |
|---|---|---|
| [American Battlefield Trust - Fort Donelson](https://www.battlefields.org/learn/civil-war/battles/fort-donelson) | Engaged strengths (infobox data attributes: US 24,531 / CS 16,171 / combined 40,702); casualties US 507 k / 1,976 w / 208 m&c = 2,691 and CS 327 k / 1,127 w / 12,392 m&c = 13,846; Dudley's Hill; the McClernand right; surrender texts | Verified, fetched (raw HTML parsed this session) |
| [Wikipedia - Battle of Fort Donelson](https://en.wikipedia.org/wiki/Battle_of_Fort_Donelson) | Cross-check on strengths/casualties; the Feb 13 probes; the Feb 15 breakout timeline and the Forge Road / Wynn's Ferry Road opening; the recall; the 30th Tennessee in the vacated works; the night council | Verified, fetched |
| [NPS - Fort Donelson (fodo) battle pages and tour stops](https://www.nps.gov/fodo/index.htm) | The Feb 13 Redan No. 2 / Maney's Battery repulse; the Feb 14 naval fight (St. Louis 59 hits, ~90 minutes, "54 killed and wounded"); the water-battery armament framing; the 30th Tennessee corroboration; day-by-day sequence | Verified, fetched (tour-stop and event pages) |
| [Encyclopedia Britannica - Battle of Fort Donelson](https://www.britannica.com/event/Battle-of-Fort-Donelson) | Cross-check on Floyd/Pillow flight, Buckner surrender, "Unconditional Surrender" (packet-fetched D327; direct refetch returned bot-403 this session — bot-403 ≠ dead link) | Packet-Verified |
| [Naval History and Heritage Command](https://www.history.navy.mil/) | Flotilla composition register row; Carondelet Feb 13 caption corroboration. Direct fetch failed on a TLS error this session; NPS carried the naval cross-checks instead | cite-pending (fetch blocked; retained as the naval-record anchor) |
| [Wikipedia - Union order of battle](https://en.wikipedia.org/wiki/Battle_of_Fort_Donelson_order_of_battle:_Union) + [Confederate order of battle](https://en.wikipedia.org/wiki/Fort_Donelson_Confederate_order_of_battle) | Brigade rosters and brigade-commander names/ranks — SINGLE-SOURCE at brigade grain; every brigade-level identity therefore ships `Inferred` (section 3) | Inferred (single source family) |
| [Tennessee Encyclopedia - Fort Donelson](https://tennesseeencyclopedia.net/entries/fort-donelson-battle-of/) | Escape-count conflict rows (Floyd "3,000" vs NPS "~2,000 combined"; Forrest "1,500" vs "~700"); garrison narrative range | Verified as a CONFLICT record — used only to document disputes |

**The corrected strength reading (adjudicated this session):** the ABT infobox's **40,702 is the COMBINED two-side engaged total** — its own side split is US **24,531** and CS **16,171** (24,531 + 16,171 = 40,702, confirmed by parsing the page's raw `data-sidea`/`data-sideb`/`data-total` attributes, and matching Wikipedia's infobox). **The packet's "US 40,702 total" line is a documented misreading**, and its "24,531 engaged = cite-pending" flag is resolved the other way: 24,531 IS the ABT Union engaged figure. The packet carries a D383 spec-time addendum recording this correction; the packet text above it is left as the historical record of what D327 believed.

**Two-source rule:** every future runtime teaching card and codex claim stamped `Verified` requires at least two independent register sources supporting that exact claim. One source = `Inferred`; a real conflict = `Disputed` with both values shown. D384 may amend this register with a second source before upgrading provenance; it may not silently promote a claim in runtime data.

## 3. Strength And OOB Contract

Use engaged forces on the active map, not campaign-wide present figures.

- **US engaged anchor:** about **24,531** (ABT infobox side split + Wikipedia infobox — two sources, Verified).
- **CS engaged anchor:** about **16,171** (same two sources, Verified). Tennessee Encyclopedia's looser "some 15,000" and other 15,000-17,000 narrative estimates are the same ballpark and are not modeled.
- **Phase committed-total envelopes (engine abstractions, all `Inferred`):** each phase fields a committed SLICE of each army, never the whole army total, per the Stones River / Nashville compact-strength precedent. D384 authors inside these envelopes and the plan probe enforces them once data exists:
  - Phase 1 (Investment): US 8,000-15,000 committed against CS 7,000-13,000 in the works.
  - Phase 2 (Breakout): CS 8,000-13,000 assaulting (Pillow's wing + Bushrod Johnson + Buckner's supporting division + Forrest's cavalry) against US 9,000-15,000 (McClernand's division struck first; W. H. L. Wallace/Oglesby/McArthur hardest hit; Lew Wallace's blocking elements arrive as sourced-timing reinforcements astride Wynn's Ferry Road).
  - Phase 3 (Recapture): US 4,000-9,000 (C. F. Smith's assault — Lauman's brigade led by the 2nd Iowa, Cook's brigade feinting) against CS 1,500-6,500 (the vacated right held at first by a thin garrison — the 30th Tennessee alone in the rifle pits per NPS + Wikipedia — with Buckner's returning troops as timed reinforcements trying to retake the lodgment).
- **Every lower split ships coarse:** division/brigade grouping strengths, gun counts, crew counts, experience, formation, readiness, reinforcement seconds, and exact sector placements remain coarse and `Inferred` unless a register source pins them. The Union and Confederate brigade ROSTERS are single-source (the two Wikipedia OOB pages), so **every brigade-grain identity and split ships `Inferred`** even where the name is confidently known. No unit note may claim Verified brigade strength anywhere.
- **Artillery ceiling:** no register source pins an active-map land gun total for either side. D384 may use a coarse Inferred land-gun envelope under the universal gun model (Maney's battery at Redan No. 2 is sourced by name and may be represented as ordinary Inferred-strength OOB artillery inside the works); it may not present any gun total as Verified or use guns as a back-solved outcome switch. The WATER batteries are excluded from the land OOB entirely (section 5).
- **The escape accounting is a teaching dispute, never an OOB driver:** Floyd's steamboat escape is "two Virginia regiments" (Wikipedia, no count) vs "3,000-man brigade" (Tennessee Encyclopedia) vs "~2,000 with Pillow combined" (NPS); Forrest's ride-out is "~700 cavalrymen" vs "1,500 horsemen and scattered infantry." The surrendered count spans roughly 11,500-15,000 across reputable sources, with 12,392 (the ABT/Wikipedia m&c figure) the citation-grade single number. All of these ship as `Disputed` teaching text with both values; none becomes a runtime count, an OOB subtraction, or a probe tooth.

The roughly 3:2 Union edge, the transports that delivered a fresh division mid-siege, and the Confederacy's inability to reinforce a trapped garrison are accurate inputs. Northern manpower, industry, and river logistics explain why that edge existed; the teaching may not collapse the result into inevitability, and it must state plainly that this garrison was lost by command collapse, not by soldier cowardice.

## 4. Terrain And Objective Contract

The future map must carry these packet/register landmarks as terrain, objective, marker, road, water, or teaching context. Coordinates and geometry remain Inferred abstractions.

- **The Cumberland River** — the field's eastern wall and the reason the fort exists; never a damage source.
- **The water batteries** — the lower and upper river batteries on the bluff; terrain/teaching markers ONLY (section 5). Never land OOB, never a damage source.
- **Hickman Creek and its backwater** — the flooded left anchor of the Confederate outer works (impassable except by bridge/boat).
- **Indian Creek** — the central drainage entering the Cumberland between the wings.
- **Lick Creek and its flooded backwater** — the swollen right/southern boundary; the icy water Forrest's troopers crossed on the way out.
- **Dudley's Hill** — where the Feb 15 assault struck and drove the Union right.
- **Wynn's Ferry Road** — the central road; Lew Wallace's blocking ridge and the corridor the breakout cleared a stretch of.
- **Forge Road** — the escape road toward Nashville that the breakout actually opened; the Phase 2 objective sits where these exits left the Union right.
- **The road to Charlotte** — the separate route associated with Forrest's post-surrender ride out on Feb 16. The packet conflated this with the Feb 15 breakout objective; this contract keeps them distinct: the breakout opened the Forge Road / Wynn's Ferry corridor, and the Charlotte direction is Forrest's escape teaching context.
- **Dover and the Dover Hotel** — the town behind the works and the surrender site; teaching context, never a second scored objective. (The fort proper enclosed about 15 acres; the outer landward rifle-pit line ran roughly 2.5-3 miles around Dover — refute-confirmed framing, `Inferred` grade pending a primary structural cite.)
- **The middle redoubt (Redan No. 2 / Maney's Battery)** — the Feb 13 repulse site on Heiman's sector; a Phase 1 works/marker anchor.

The earthworks may provide ordinary universal cover. The vacated right in Phase 3 is thin because the bodies left it (accurate input), never because a modifier weakened it. No terrain element writes casualties, morale, rout, score, or winner.

## 5. Gunboat-Support Input Contract (The Land+River Law)

There is **no ship-vs-ship engine** and this battle does not create one. The **gunboats enter the land model ONLY as inputs** and teaching:

1. **Transport and reinforcement timing (the real naval contribution to the land fight):** Grant's army marched overland from Fort Henry on Feb 12; the river then delivered the rest — transports under flotilla escort landed the reinforcements from which Lew Wallace's 3rd Division was formed on Feb 14 (Cruft's and Thayer's brigades among them). D384 models this as sourced arrival/reinforcement timing in the phase OOBs — the Phase 2 blocking force exists because the river delivered it. Counts inside the section 3 envelopes stay `Inferred` (the "~10,000 aboard twelve transports" figure is a search synthesis, not a pinned quote — it ships as `Inferred` narrative, never a Verified count).
2. **The Feb 14 naval repulse must be taught honestly:** Foote's four ironclads (flagship St. Louis, Carondelet, Louisville, Pittsburg) with the timberclads Tyler and Conestoga closed to point-blank range and were **beaten at close range** by the water batteries — St. Louis took 59 hits and lost her steering, Louisville was disabled, Foote was wounded, and the flotilla withdrew after about 90 minutes with roughly 54 casualties (the sources spread 52-55; "about 54" is the honest rendering) against **zero significant Confederate loss in the batteries** — a qualitative "zero," never a numeric claim. Hampton Roads was three weeks away, and the lesson stands: ironclads were not invincible, and forts with heavy guns could still win. This ships on the Phase 2 interstitial transition card and a teaching card. The refute pass confirmed the per-boat hit counts (Carondelet 54, Louisville 36 and disabled, Pittsburg 20 and taking water) and the under-400-yard closing range; the completeness critic further resolved the upper-battery armament (one 64-pounder rifled Columbiad plus two 32-pounder carronades — ABT's "64-pounder howitzers" is the outlier error, noted as such rather than a live dispute), while the 11-vs-12 water-battery gun TOTAL remains a genuine source conflict carried as `Disputed`.
3. **The water batteries are terrain and teaching, never land OOB artillery.** Their guns faced the river and did not bear on the landward fight; fielding them as land OOB would be an inaccurate input, and converting their effect into any modifier is FORBIDDEN (section 8). The lower battery's sourced armament (eight 32-pounders and a 10-inch Columbiad) and the upper battery's rifled Columbiad ship as marker/teaching text with exact-count honesty about the disputes.
4. **No bombardment mechanic:** no naval fire support enters any phase — after the repulse the battered fleet's Feb 15-16 role was marginal (a requested demonstration; nothing sourced as load-bearing on the land result). Naval effect via a battle-only combat field is exactly the packet's named D74 temptation and is rejected: **never a battle-only firepower switch.**

## 6. Battle-Date Ranks And Command Traps

The future runtime probe searches leaders, unit commanders, notes, brief/end text, teaching cards, and codex content. Rank checks are scenario-scoped. February 1862 is EARLY — nearly everyone who became famous later is junior here, which makes this the game's densest rank-trap battle.

- **Grant battle-date rank — Brig. Gen. Ulysses S. Grant; the Major General of Volunteers promotion was the immediate reward for this surrender and postdates the fight — never render Maj. Gen. during the battle.** (The refute pass resolved the apparent Feb 16/17/21 date conflict as three different events — the commission ranked FROM Feb 16, the surrender date; Lincoln's nomination followed about Feb 17; the district command about Feb 21. If teaching text needs the date at all it says "to rank from February 16, 1862"; runtime rank checks never depend on it.)
- **Brig. Gen. John A. McClernand** — 1st Division, the Union right. **Brig. Gen. Charles F. Smith** — 2nd Division, the Union left. **Brig. Gen. Lew Wallace** — 3rd Division, formed Feb 14 from the transport-landed brigades.
- **Brig. Gen. John B. Floyd** — senior Confederate officer from Feb 13; fled before the surrender. **Brig. Gen. Gideon J. Pillow** — second; initiated the recall; fled by skiff. **Brig. Gen. Simon B. Buckner** — left to surrender. Reject `Lt. Gen. Simon B. Buckner` — the CSA lieutenant-general grade was only authorized in September 1862. **Brig. Gen. Bushrod R. Johnson** (brigadier from Jan 24, 1862; briefly held nominal command Feb 9 before Pillow arrived).
- **Lt. Col. Nathan Bedford Forrest** — commanding the cavalry. Reject `Col. Forrest` (full colonelcy dates March 1862), Reject `Gen. Forrest` (first star July 1862). The most-tempting inflation in the entire cast.
- **Flag Officer Andrew H. Foote** — U.S. Navy. Reject `Admiral Foote`: the U.S. Navy had no admiral grade until July 1862 (created for Farragut). Every register source styles him Flag Officer throughout this campaign.
- **The brigade commanders were colonels, and the colonels are rendered as colonels:** US — Cols. Richard J. Oglesby, William H. L. Wallace, William R. Morrison (wounded Feb 13), John McArthur, John Cook, Jacob G. Lauman, Morgan L. Smith, Charles Cruft, John M. Thayer; Col. James Tuttle led the 2nd Iowa up the works. CS — Cols. Adolphus Heiman, Joseph Drake, John M. Simonton, Gabriel C. Wharton, John McCausland, William E. Baldwin, John W. Head, Roger W. Hanson (2nd Kentucky). These identities are single-source at brigade grain (section 2) and therefore ship `Inferred` — but their GRADES are part of the trap wall: none of them may be rendered as a general.
- **Brig. Gen. Lloyd Tilghman** — Fort Henry's commander, already a prisoner; teaching card only (section 9), never in the Donelson cast.

Command absence and collapse enter the model ONLY as accurate inputs: Grant's pre-dawn absence downriver on Feb 15 (consulting the wounded Foote, no second-in-command designated) is teaching plus, at most, ordinary reinforcement/order timing; the Confederate recall is Phase 3's thinned works and returning-reinforcement timing. No leader writes a result.

## 7. Historical Direction Law And Honest A/B

D384 runs exactly eight shared-model deterministic seeds in one serialized focused process. Require at least **5/8** for each independent direction guard, each derived from a sourced phase outcome, never from a prior:

1. **Phase 1 — the CS holds the works** (the Feb 13 probes were repulsed: McClernand's three-regiment assault on Redan No. 2 broke down under Heiman's fire with about 200 casualties and burning grass; Smith's probe on Buckner's rifle pits was turned back — NPS + Wikipedia, Verified).
2. **Phase 2 — the CS seizes the escape-road exit** (by early afternoon Feb 15 the breakout had broken two of McClernand's three front-line brigades and cleared the Forge Road and a stretch of Wynn's Ferry Road — NPS + Wikipedia, Verified).
3. **Phase 3 — the US seizes the outer works** (Smith's division, Lauman's brigade with the 2nd Iowa leading, carried the vacated rifle pits on the Confederate right against the lone 30th Tennessee and held them against Buckner's returning counterattacks — NPS + Wikipedia, Verified; ABT's "Confederate left" framing of the same assault is adjudicated an orientation slip, and the sector ships as the Confederate right with a note, per the completeness critic).
4. **The aggregate battle winner is the US** (the surrender — the sourced result of the battle).

**Casualty guards: NO casualty-direction tooth anywhere, in any phase, in any direction.** This is the Cedar Creek direction-neutral law applied for the inverse reason: the killed-and-wounded accounting shows the US bled more (2,483 US k/w against 1,454 CS k/w), while the total-loss accounting including the surrendered garrison shows the CS losing five times as many — **the accounting conflict is the teaching, never a guard.** Do **not** guard casualty magnitude, a casualty ratio, a killed/wounded/captured split, a prisoner count, a surrender count, a captured-gun count, an escape count, or a rout count. Prisoner and escape totals conflict across reputable sources (section 3) and remain teaching text.

If D384 changes any simulation input after the first eight-seed battery, `DECISIONS.md` logs the old value, new value, and both observed guard counts for every iteration. Eligible inputs are committed strengths inside the section 3 envelopes, coarse OOB splits, universal land-gun counts, ordinary leader quality/aura inputs, works/terrain geometry, formation, experience/readiness, reinforcement and recall timing, objective radius, and universal time/hold thresholds. No result-derived multiplier or scripted verdict is eligible.

## 8. D74 No-Fudge Acceptance Wall

The future data scan rejects these keys and families at any depth:

`damage`, `dmg`, `damageMult`, `firepower`, `firepowerMult`, `fireScale`, `fireMult`, `fireMultiplier`, `killScale`, `killMult`, `casualtyScale`, `casualtyMult`, `lossScale`, `lossMult`, `captureScale`, `captureMult`, `surrenderScale`, `surrenderMult`, `routScale`, `routMult`, `moraleScale`, `moraleMult`, `combatScale`, `battleDamage`, `battleFire`, `powerMult`, `scoreBonus`, `scoreMult`, `winner`, `winOverride`, `victoryOverride`, `outcomeOverride`, `forceWin`, `winnerFudge`, `fudge`, `genius`, `geniusMult`, `gunboatMult`, `bombardMult`, `navalBarrage`, `surrenderForce`, `paralysisMult`, `commandCollapseMult`, `weatherDamage`, `frostbiteMult`, `floydPenalty`, `escapeBonus`, `prisonerCount`.

Named temptations, all forbidden: simulating Foote's gunboats or the water batteries with a bombardment damage field; forcing the lopsided total-loss ratio with a casualty multiplier or a winner gate (the 12,392 were prisoners of a capitulation, not battlefield kills); modeling Floyd/Pillow's paralysis as a Confederate debuff (command collapse = fewer bodies committed and later reinforcement timing, both accurate inputs); scripting the Phase 2 breakout instead of giving the CS the historical means (local mass against a thinned right, per D90); a Grant absence penalty; a weather damage tick; an escape bonus; a prisoner-count writer; any source branch that checks `fortDonelson` and writes combat output.

The result must emerge from committed strength, works cover, the thinned-sector geometry, reinforcement and recall timing, formation, experience/readiness, universal command aura, and the objective/time model.

## 9. Teaching, Dignity, And Memory Contract

D384 requires at least eight restrained teaching cards plus one codex entry. Every claim obeys the two-source/provenance rule; sourced quote text is rendered exactly; disputed counts show both values.

1. **The River War Won the West.** Henry and Donelson cracked the Confederate line in the West and opened the Tennessee and Cumberland as invasion highways; Nashville — the first Confederate state capital to fall, surrendered without a fight — was abandoned within days, and Columbus, Kentucky followed by March 2-3. Frame the river theater as the war-winning axis, against the Lost-Cause fixation on Virginia. (`Verified` core; the refute pass resolved the Nashville two-date confusion — February 23 marks the Confederate evacuation, February 25 the formal surrender/occupation by Buell's army; if a date ships, it is Feb 25.)
2. **"Unconditional Surrender."** Buckner asked for commissioners and an armistice; Grant's reply is rendered exactly: "No terms except an unconditional and immediate surrender can be accepted. I propose to move immediately upon your works." Buckner accepted what he called "ungenerous and unchivalrous terms." The exchange made Grant's initials a legend and set the war's terms-of-victory doctrine. (Grant's text `Verified`; the refute pass confirmed Buckner's two letters against an Official Records reproduction with one wording amendment D384 must honor — the OR primary reads "the forces and **post** under my command," not ABT's secondary "fort"; render "post.")
3. **Command collapse, stated plainly.** At the Dover Hotel in the small hours of Feb 16, the command devolved Floyd → Pillow → Buckner. Floyd — a former U.S. Secretary of War who feared federal arrest — took the only steamboat out with his Virginians; Pillow crossed the river in a small boat with his staff; Buckner, who had argued the works could not hold half an hour, stayed to surrender the men. **Floyd and Pillow abandoned their own men.** This is command collapse, not tragic nobility; the card refuses the "gallant defense betrayed by fate" gloss. (`Verified` sequence; escape counts `Disputed`, both values shown.)
4. **Forrest refused and rode out.** Lt. Col. Forrest — "I did not come here to surrender my command" (traditionally attributed; no primary citation located, ships as attributed-not-verbatim) — led his troopers out through the icy Lick Creek backwater toward Charlotte before the capitulation. Sources conflict on the number (about 700 cavalry vs "1,500 horsemen and scattered infantry"); the conflict is shown. No romance: the card notes the men he left behind went to the prison camps, and where Forrest's road led — Fort Pillow, and after the war the Klan — is already told plainly in this game's command content.
5. **The gunboats were beaten.** The Feb 14 card: four ironclads closed to point-blank range and the water batteries wrecked them — 59 hits on the flagship, steering shot away, Foote wounded, the flotilla repulsed in about 90 minutes with zero significant Confederate loss. The ironclad revolution was real, but Donelson taught its limit three weeks before Hampton Roads: heavy guns behind earth could still beat armor. (`Verified` core; per-boat hit details and the battery gun-count dispute carried honestly.)
6. **The freezing night.** After the warm Feb 12 march tempted soldiers to throw away coats and blankets, the night of Feb 13-14 turned to rain, sleet, and snow with hard cold; fires drew fire, and wounded men froze to death between the lines. Human cost with gravity — no numbers invented; the figures remain single-source under the two-source rule, so the card ships `Inferred` and, if it uses them at all, says "about 10-12°F and roughly three inches of snow," never a bare pinpoint (the completeness critic's demotion, honored over the refute's softer CONFIRMED).
7. **Grant's absence, Grant's return.** The Feb 15 breakout struck while Grant was miles downriver with the wounded Foote, having named no second-in-command. He returned, read the ration-stuffed knapsacks of the Confederate dead, and attacked: "The one who attacks first now will be victorious" (attributed across independent secondaries). Command presence as an input lesson — the counterattack, not a genius stat, retook the field.
8. **Fort Henry is teaching-only.** Brig. Gen. Lloyd Tilghman sent his garrison to Donelson and surrendered Fort Henry to the gunboats alone on Feb 6 after roughly 75 minutes of bombardment, holding on with an under-100-man rear detachment (the refute pass confirmed the 75 minutes over ABT's "two hours" and sized the rearguard at ~54-94; its casualties conflict — ~15 killed/20 wounded in some narratives vs ~5 killed/11 wounded in Tilghman's own report — and ship `Disputed` if used). It is the reason Donelson's garrison was swollen and the river door already half-open. NO Fort Henry playable battle, data file, or registry entry exists or may be added (the packet's DO_NOT_BUILD verdict on every ship-vs-ship action stands).

**Dignity boundaries:** Fort Pillow (1864) remains **DO_NOT_BUILD** as a playable/scored battle — the standing dignity carve-out — and is not part of this battle's content beyond the already-shipped command-content truth-telling about Forrest. **No USCT unit existed in February 1862** — no Black regiment may be invented into either OOB; the honest Black-agency teaching here is that the river war's advance carried emancipation's frontier south (formal Black enlistment began after the July 17, 1862 Militia Act; the USCT designation came in 1863), which belongs in card 1's river-war frame, scoped exactly that way.

The codex entry uses `theater:"Western"`, `campaign:"Henry-Donelson Campaign"`, and `result:"Union victory"`, with the cost/direction accounting conflict and the command collapse stated plainly.

## 10. Frozen Classic And Rail-Route Collision Law

Two lowercase `ftdonelson` layers already exist and remain untouched:

- frozen Classic `build/base.html` has exactly one `{id:"ftdonelson", name:"Fort Donelson", year:1862, th:"W", atk:"US", us:25000, cs:21000, ...}` roster row (with `cmdUS:"Grant", cmdCS:"Floyd"` and `wx:"snow"`);
- `data/logistics-rail.json` has the existing route `ftdonelson` labeled `Cumberland-Tennessee river-rail junctions`, theater `W`, friction `{US:10, CS:15}`, provenance `Inferred`.

The new tactical id is camel-case `fortDonelson` and the new data filename is hyphenated `fort-donelson.json`. D384 must preserve the lowercase Classic and rail records byte-for-byte as separate layers. No attempt may rename, merge, delete, or repurpose them, and the tactical id must not create or replace a rail route. The Classic row's 25,000/21,000 and `wx:"snow"` are that frozen layer's own record — never a source for the tactical model.

## 11. Planned-Only And Future Complete-Integration Baselines

### D383 planned-only baselines (must remain exact)

- registered tactical scenarios: **19**;
- battle files / total schema files: **19 / 49**;
- Army Register: **1200**;
- explicit flags / valid weather hints / Intel opening-scene coverage / media opening scenes: **19 / 19 / 19 / 19**;
- no-regression suite list: **124**; sweep comment: **19** battles;
- generated HTML md5: **`10a64a20394521efdc94b7edb1646686`**;
- no `data/fort-donelson.json`, no `tools/probe-fort-donelson.mjs`, no T1/T10/runtime integration, and no Fort-Donelson identifier in any scanned integration surface.

The D383 plan probe fails if even one Fort Donelson runtime seam appears while the data file is absent.

### D384 future atomic integration contract

All surfaces arrive in one green runtime commit or the plan probe fails closed:

- `data/fort-donelson.json`, top-level key/id `fortDonelson`, three-phase T8 per section 1 (roles US>CS / CS>US / US>CS, weights `[1,1,3]`, fog off, the Feb 14 interstitial on Phase 2's `transition.lead`, the recall teaching on Phase 3's `transition.lead`), committed strengths inside the section 3 envelopes, terrain per section 4, teaching per section 9, ranks per section 6;
- `src/tactical/T1-bull-run.js` exact registry line `R.fortDonelson = GAME_DATA["fort-donelson"].fortDonelson` and menu rank `fortDonelson:48`;
- tactical scenarios **19 -> 20**;
- `tools/validate-data-schemas.mjs` battle enrollment and total schema files **49 -> 50**;
- `tools/probe-tactical-roster.mjs` and `tools/probe-custom-battle-builder.mjs` historical baselines include `fortDonelson`; the roster's `PHASE_COUNTS` records `fortDonelson: 3` and the DOM check includes `fldScnBtn_fortDonelson`;
- Army Register **`1200 + (unique Fort Donelson side-unit ids × 3)`**, with every whole-registry pin moved and documented in the same commit — the full pin-history chain is preserved and the new `D384: 1200 -> N — Fort Donelson ...` fragment is appended in the documented-history format;
- `src/tactical/T10-flags.js` explicit Fort Donelson metadata **`W / false / first-national`** (Western theater, no AotP badges, First National family — February 1862 precedes this game's sourced Hardee-pattern convention, which begins at Stones River; Shiloh, two months later, is the shipped first-national precedent) with an Inferred-representative disclosure, and `tools/probe-flags.mjs` coverage teeth at 20;
- flags/weather/Intel/media coverage **19 -> 20**; the weather hint ships winter presentation only (sky/time `Inferred`, with a note that the frozen Classic row's `wx:"snow"` is a separate layer, not a source);
- `tools/probe-fort-donelson.mjs` focused browser/runtime guard enrolled in `tools/vet-no-regression.mjs`; suite **124 -> 125** and sweep comment **19 -> 20**;
- generated `civil_war_generals.html` rebuilt only through `node tools/build.mjs`;
- frozen lowercase Classic/rail `ftdonelson` layers unchanged;
- no new Fort Henry, Fort Pillow, or ship-vs-ship data or registration of any kind.

## 12. Plan Probe Contract

`tools/probe-fort-donelson-plan.mjs` is filesystem-first, dual-mode, and fail-closed. It writes `tools/shots/probe-fort-donelson-plan.json`, exits nonzero on failure, prints exactly one 13-step summary, and reports each failed step on stderr.

The thirteen steps, in this exact order, are:

1. `SPEC SHAPE`
2. `PHASES + WEIGHTS + INTERSTITIAL`
3. `SOURCES + STRENGTH`
4. `TERRAIN`
5. `GUNBOAT-SUPPORT INPUTS`
6. `RANKS + TRAPS`
7. `HISTORY + DIGNITY`
8. `D74 NO-FUDGE`
9. `DIRECTION LAW`
10. `CLASSIC/RAIL COLLISION`
11. `PLANNED-ONLY BASELINES`
12. `FUTURE COMPLETE-INTEGRATION CONTRACT`
13. `LANE`

When the runtime data file is absent, the probe requires every D383 count/hash and rejects any partial runtime seam. When the runtime data file is present, it requires the complete 20/50/`1200+3U`/20/125 integration plus the three-phase shape, role flips, interstitial cards, envelope sums, rank walls, teaching provenance, and the focused-probe direction contract. Half-registration is always red.

## 13. D383 Negative Bind And Focused Gate

After the clean plan probe passes:

1. record md5 for this spec and the generated HTML;
2. change only the exact line `**Grant battle-date rank — Brig. Gen. Ulysses S. Grant; the Major General of Volunteers promotion was the immediate reward for this surrender and postdates the fight — never render Maj. Gen. during the battle.**` to a firm `Maj. Gen.` battle-date rendering;
3. run `node tools/probe-fort-donelson-plan.mjs` and require exit 1 with exactly `RANKS + TRAPS` red (12/13 green);
4. restore the line byte-identically;
5. require the spec md5 to match exactly;
6. rebuild and require generated HTML md5 `10a64a20394521efdc94b7edb1646686`;
7. rerun the plan probe 13/13 green.

Harden only the rank tooth if the tamper fails too broadly or does not bite. Do not weaken any unrelated tooth.

Set `TMPDIR="$PWD/.tmp"` and run serially:

```bash
node --check tools/probe-fort-donelson-plan.mjs
node tools/build.mjs
node tools/validate-data-schemas.mjs
node tools/probe-battle-build-research.mjs
node tools/probe-fort-donelson-plan.mjs
node tools/probe-five-forks-plan.mjs
node tools/probe-cedar-creek-plan.mjs
node tools/probe-cross-keys-port-republic-plan.mjs
node tools/probe-stones-river-plan.mjs
node tools/probe-new-market-heights-plan.mjs
node tools/probe-gaines-mill-plan.mjs
node tools/probe-five-forks.mjs 2>/dev/null
node tools/probe-tactical-roster.mjs 2>/dev/null
node tools/probe-custom-battle-builder.mjs 2>/dev/null
node tools/vet-no-regression.mjs --list
git diff --check
```

Require build `GATE OK`; generated HTML md5 unchanged; schema 49/49; research 15/15; Fort Donelson plan 13/13; all six prior plan probes green; Five Forks runtime 16/16 with zero pageerrors; roster 8/8 with 19 scenarios; builder 15/15 with 19 scenarios; suite list 124; every produced JSON/HTML artifact parsed and read; no failed step or recursive pageerror. Do not run `npm run vet:noreg`.

## 14. D384 Runtime Gate Contract

D384 starts only from the clean pushed D383 contract under the same LANE-003 DRIVE (or a new takeover recorded in the ledger). At minimum it runs, serially and with full artifact readback:

- `node --check` on every new/touched JS/MJS file, including preparse of any cooked browser SETUP/DOM strings (the S-03 amendment-8 law);
- `node tools/build.mjs`;
- `node tools/validate-data-schemas.mjs`;
- `node tools/probe-battle-build-research.mjs`;
- `node tools/probe-fort-donelson-plan.mjs`;
- `node tools/probe-fort-donelson.mjs` (three-phase runtime guard: registry/menu/launch, per-phase objective/role assertions, the 8-seed four-guard direction battery, rank walls, D74 scan, interstitial presence, Classic/rail separation, 0 pageerrors);
- `node tools/probe-tactical-roster.mjs`;
- `node tools/probe-custom-battle-builder.mjs`;
- `node tools/probe-loot-survival.mjs`;
- `node tools/probe-flags.mjs`;
- `node tools/probe-weather.mjs`;
- `node tools/probe-intel-uhd617-profile.mjs`;
- `node tools/probe-media-budget.mjs`;
- `node tools/vet-no-regression.mjs --list`;
- 1-3 directly adjacent current battle probes selected from the final diff (Shiloh and Stones River are the natural Western neighbors);
- the registry-removal bind AND the Grant-rank bind, each proving exactly its predeclared teeth red with byte-identical (md5-proven) restores;
- honest A/B per section 7 if any simulation input moves after the first battery;
- `git diff --check`.

After playable Fort Donelson is green, the next full serialized `npm run vet:noreg` release battery is owed at the next 2-3-battle release checkpoint (D381 was green 2026-07-12), not automatically in D384. Nothing runs concurrently with any battery on the 8 GB Mac.

## 15. D383 Completion Criteria

D383 is green when this spec and `tools/probe-fort-donelson-plan.mjs` pass 13/13; the Grant-rank bind makes exactly one step red and restores byte-identically; every required focused artifact is read; the 19/49/1200/19/124 baselines and generated HTML md5 remain exact; the naval-river packet carries the D383 spec-time addendum recording the ABT-total correction and the road-name disambiguation; canonical docs record the phase-weight deviation, the gunboats-as-inputs law, and the D384 runtime boundary; the final D383 commit is pushed; and no Fort Donelson runtime surface has started.
