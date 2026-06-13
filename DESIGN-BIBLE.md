# DESIGN BIBLE — The Civil War (An American War Saga, Vol. I)
Compiled 2026-06-12 from 38 popup design rounds (~130 locks). This is the organized master spec; GENERALS_HANDOFF.md holds the chronological lock record + build state; BUILD-PLAN.md holds the chunk pipeline. Where this document and a dated handoff lock conflict, the handoff lock wins. **Personal project — NOT MJI.**

Source DNA (exceed, never copy): Civil War Generals 2 / Robert E. Lee CWG · Sid Meier's Civilization Revolution · Ultimate General: Gettysburg · SimCity/city-builders · The Sims · Oregon Trail · Madden/EA Sports · Borderlands (all).

---

## ⚑⚑ FULL 3D — LOCKED 2026-06-14 (supersedes the painted-2D pivot below)

Aaron escalated past painted-2D and 2.5D to **full 3D, as realistic as possible** (Total War / modern-console look). Render layer becomes **WebGL via Three.js** (CDN r128, in-file): sculpted terrain mesh (elevation from `tile.elev`) with **PBR materials**, **HDRI lighting + shadows**, orbit/pan/zoom camera with **raycast hex-picking**, and **rigged+animated 3D unit models** (`.glb`). Game logic/state, AUTHORED_MAPS, and the painted-2D tiles all carry over (tiles → fallback/LOD skin; 2D canvas renderer kept as a toggle). Asset production + handoff spec = **`3D-ASSET-PLAN.md`**; assets live in `assets/3d/`. Tools: Meshy (rigged unit GLB), Poly Haven (CC0 PBR + HDRI). Formats LOCKED: `.glb` / seamless PNG / `.hdr`. **Gating decision:** local web server (rec — `.glb`/HDRI can't load on `file://`) vs base64 embed. This supersedes "single self-contained HTML" further (3D needs a server or embed); logic/sound stay in-file. Phased build P3D-1→4 in 3D-ASSET-PLAN §7.

## ⚑ GRAPHICS PIVOT — LOCKED 2026-06-14 (now the painted-2D FALLBACK under full-3D)

Aaron's verdict on the procedural painterly renderer: **not realistic enough — wants Ultimate General: Gettysburg-level painted terrain.** Decision tree he locked:
1. **Realism comes from painted RASTER ART, not procedural vector code.** The G-wave's code-drawn approach has a hard ceiling below UG:G and is now the *fallback*, not the target.
2. **Single-file "zero external assets" lock RELAXED → allow a sibling `assets/` folder.** Why: UG:G-level realism is unreachable as pure in-file procedural; for a personal game run off the Desktop, single-file purity is worth less than the look. The HTML + `assets/` ship together.
3. **Approach = painted HEX-TILE SET** (not bespoke per-battle maps): one painted PNG per terrain type, tiled across the grid. Why: scales to all 84 battles with ~13–25 tiles instead of 84 bespoke maps; realistic terrain everywhere, fast.
4. **Engine (built): asset-loading renderer.** `assets/terrain/<key>.png` loaded via `Image()` (file://-safe — no fetch), tiled with the axonometric tilt + seeded flip; **any missing tile → procedural fallback** (incremental, no manifest, no network). Placeholder tiles shipped; real art per `ASSET-PROMPTS.md` (Aaron generates in an external image tool — Cowork has no image-gen — and drops PNGs in).
5. **Phase 2:** painted soldier/cannon/cavalry sprite sheets in `assets/sprites/` via the existing `drawUnitSprite` seam.

This supersedes §3 "THEATER OR NOTHING / painterly-vector" and the §1/§11 "single self-contained HTML, zero external assets, no files" locks **for graphics only** (logic/sound stay in-file). Saga-file/save JSON and "one HTML per volume" still hold — the HTML is still one file; it just has an art folder beside it.

---

## 1 · IDENTITY & SERIES

- **Series:** standalone title per war + small series mark "An American War Saga." **Vol. I = "The Civil War"** (applied in file). Vol. II = the Revolution (title TBD).
- **One Family. One Town. Every War** — within each volume. **Chronological restart** across volumes: when Vol. II ships, the true saga starts there; Vol. I trees remain standalone branches. No prequel-grafting.
- **Saga thread:** family lineage + Home Town + heirlooms (weapons w/ provenance & kill-notches; story-proc relics — the Bible that stopped a ball; the family NAME as compounding reputation) + Hall of Honor (account-wide; gains a **Presidents wing**).
- **Era-pack architecture:** all era content in data tables (TERRAIN/WEAPONS/BATTLES/CHAINS/events); engine era-agnostic; **era-pack JSON spec documented publicly** for modders. Saga file = small exported JSON (family tree, town, heirlooms, honors) imported by later volumes.
- **Vol. II signature system: deferred** to Vol. II (candidates noted: enlistment-midnight 1776; militia mass vs Continental steel). Naval wind gauge pre-built for it (see §3).
- Delivery: **one self-contained HTML per volume**, Safari, file://, zero install, no external assets. Three named saga slots (export/import for overflow).

## 2 · MODES (one file, newspaper menu, linked AND standalone)

1. **Battle Campaign** — 84 battles, branching US/CS chains, recovery branches; now with **structural divergence** (§4).
2. **War Room** — strategic war-economy layer (brass map-room table) feeding the campaign.
3. **Soldier Campaign** — full life sim: March/Camp/Battle triptych + lineage (§7).
4. **Home Town** — deep single-city builder, 3 archetypes (§8).
5. **What-If War** — free-movement sandbox, full gonzo from start (§9).
6. **The Executive** — run the war from the President's chair, both seats at launch (§4).
7. **Free Battle** + **The Gauntlet** (famous last stands + endless unlocks + procedural; daily seed) (§9).
- **Unlock pacing:** progressive with one-line ceremonies + a "muster everything" settings toggle.
- **Menu = the morning newspaper,** side-specific masthead following the active slot's side; headlines are modes, classifieds are settings, date advances with progress.

## 3 · BATTLE ENGINE

- Chassis (built): regiment-scale hex IGOUGO, probabilistic fire/charge + morale/rout/rally, fog scaled by difficulty + cavalry scouting, BFS supply w/ encirclement starvation, dynamic weather, entrenchment/forts, leaders w/ traits + command radius, naval on same engine, victory = objectives + casualties + historical benchmark, 4 DIFF tiers.
- **Feel = IGOUGO + UG flavor:** drag-drawn movement arrows w/ facing, flank/rear bonuses, fatigue, painterly Field Map polish, optional corps-commander auto-assist. (WEGO and real-time rejected.)
- **Day-phase acts** for marquee multi-day battles (Gettysburg 3, Shiloh 2) with **night interludes**: torchlight council (posture via generals' traits), burial details, campfire vignettes (soldier-mode crossover), night-assault gamble.
- **Naval:** ram (ironclad charge, mutual hull risk) + boarding/cutting-out (marine-party melee) + **wind gauge** (steam ignores, sail feels; Vol. II inheritance).
- **AI:** personality matrix per enemy general (McClellan stalls, Hood overreaches, Forrest raids supply). **Fog symmetric at Hardened+** (AI scouts honestly, can be ambushed); omniscient at Recruit/Veteran.
- **Élan momentum meter** + **Council of War** midpoint adjustment.
- **Mapmaker's Table** pre-battle planning + **command friction** (courier-borne orders lag; couriers interceptable).
- **Undo:** one "courier recall" per battle default (movement only, never fire/charge); settings toggle for unlimited; Iron = none.
- **Supersim:** hand your army to your own AI personality engine mid-battle, jump back anytime; doubles as QA harness.
- **Animation: THEATER OR NOTHING** — static board-game visuals until full sprite theater (tiny soldiers: march/kneel/fire/fall) lands as a committed v3 pillar. Tween+smoke CUT.
- **Battle audio: dynamic din** (intensity-scaled synthesized battle-bed under discrete SFX) + period music engine (§11).
- Mascots in battle: auras + theft risk (§7).

## 4 · STRATEGIC LAYER (War Room + politics)

- **War-economy map (brass map-room table):** build factories/arsenals/farms/depots; output flows by rail and BECOMES what regiments carry; raiders cut lines. Asymmetric economies: US industry vs CS battlefield-capture + blockade-runner imports. **Asymmetric pay:** US greenbacks chronically late (paymaster event, arrears, payday night); CS inflation (barter king, three-currency sutler prices).
- **Seasons gate tempo:** mud season bogs movement/supply (Mud March event), summer campaigns, winter forces quarters; pushing the season priced.
- **The 1864 Clock:** war weariness, midterms, the 1864 election, political capital as spendable currency, foreign-intervention meter. Wars end politically.
- **Press & Élan:** period-newspaper recaps; press narrative affects recruiting/politics; **embedded correspondent** (named, access-controlled, grudges, coda memoir).
- **Staff & Surgeons:** rated hires (surgeon/quartermaster/engineer/signal/provost), hospital pipeline, poaching, condolence letters.
- **Grand Works:** one-per-war mega-projects (Tredegar, Military Telegraph, USMRR, Sanitary Commission).
- **Structural divergence:** big upsets reroute the battle chain (forks reuse the 84-battle pool w/ procedurally shifted variants; fork points capped at marquee upsets). **Drift cap = gonzo-lite:** extreme records can escalate the campaign (intervention scares, experimental arsenals). The sandbox starts unhinged; the campaign earns it.
- **Raids:** map-crawl mini-campaigns (Grierson-style decisions) resolving in a playable climax skirmish.
- **Nemesis arc:** rival general remembers, escalates — **letters AND press feud**; reckoning battle. **Rival house: player-defined at founding** (their sons recur across battles, prison, ballots; friend-playable in versus).
- **Emancipation & USCT arc** (policy cascade; USCT regiments with real story weight).
- **The President: audiences + SACKABLE** — relieved to a lesser theater, comeback arc. **The Executive mode:** both chairs (Lincoln AND Davis) at launch; appoint/sack AI-personality generals, theater priorities, the Clock from the other side; battles auto-resolve unless you take the field at a crisis.
- **Political ascent track (full):** any veteran of the line: town office → legislature → Congress/governor → Presidency; electability from war record/medals/memoirs/press/town standing. **Elections = whistle-stop campaigns** (stump via letter-composer, debates as card duels, bloody-shirt rallies, scandals mined from your own ledger; press = polling).
- **Sutler camp economy** (army funds ↔ soldier purchases glue).
- Captured officers: **all three doors, consequences each** — exchange (cartel credit) / host (honor, press, nemesis threads) / ransom (funds, scandal). Your captured leaders sit out until exchanged.

## 5 · FRANCHISE LAYER (winter quarters = the off-season)

- War year = season; winter = off-season. **Buildable winter camp** (hut rows, kitchens, chapel, sutler row, hospital tents on a small grid; layout drives disease/dev-pops/desertion/spring morale; your soldier walks the camp you built).
- **Recruiting draft class** (scouted regiments, potential grades, bust/gem). **Enlistment contracts** (90-day/2-yr/3-yr/veteran-volunteer; expirations mid-war; re-enlistment drives w/ bounties or veterans walk). **Training camps** (sub-rating upgrades, dev-trait pops). **Brigade trades/transfers.**
- **General's winter deeds (all four):** Washington galas (political-capital minigame), drill the army, visit Home Town (statue/family/recruiting), draft memoirs (legacy score → Grand Review epilogue + Hall of Honor).

## 6 · PROGRESSION & LOOT

- **Three tiers:** Personal = Borderlands skill tree (Grit/Marksman/Messmate; capstones e.g. Color Bearer). Unit = Madden ratings card (OVR: Firepower/Discipline/Mobility/Élan/Stamina; dev traits Normal→Star→Superstar→X-Factor; storied-unit procs: Iron Brigade aura). Army = doctrine tree + general cards fed by research + economy.
- **War research tree:** Ordnance / Medicine / Logistics / Signal & Intelligence.
- **Full armory loot:** 5 rarity tiers (Surplus→Legendary), real manufacturers as brands w/ stat flavors AND quirk downsides (Richmond misfires in rain; Enfield ammo strain), condition wear, procedural rolls, named uniques, **battlefield capture on rout** (how the CS armed itself), weapon-card UI.
- **Collectible great commanders** (gallery, promotable, mortal).
- **Full flag designer** (name/state/motto/drawn regimental color; battle honors stitched on; flags fly, age, get captured as trophies).
- **General's death → War Department appointee** (command stays professional; family stakes live in the lineage, not the army).

## 7 · SOLDIER CAMPAIGN (full life sim)

- **Triptych:** **March** (Oregon Trail: pace, rations, fords, breakdowns, straggling, disease > bullets; landmark stops; **rumor intel**; **timing-volley hunt** — Marksman widens windows, misses waste cartridges/draw provost) → **Camp** (needs: Rations/Warmth/Health/Spirits; drill/forage/letters/cards/sick call; 5–7 named messmates, bonds = battle buffs, grief real) → **Battle** (embedded in one regiment on the hex engine; survival rides health/role/cover; wounds → hospital).
- **Identity:** create-a-general's counterpart at enlistment; **family origin pick** (Yankee / Famine Irish / German Forty-Eighters / border Scots-Irish / **free Black Northern family**); **aspirations** (glory/survival/abolition/home); **knapsack weight**; **instrument skill** (his tune scores his replays); **staggered creators** (founding = family+town only; the rest arrive as scenes).
- **USCT path (full, both doors):** free-family founding (1861 opens with enlistment denied) or mid-war self-emancipation entry post-1863. Pay-protest year, graver capture stakes, distinct Reconstruction stakes. Research-grade care + hard review gate.
- **Camp economy:** three-ring **trading web** (mess barter; sutler store w/ gouging, credit/debt spiral, sutler-raid event; **cross-picket trade with the enemy** — coffee/tobacco, enemy newspapers, provost risk, rival-house encounters). **Gambling both-by-context** (playable chuck-a-luck/faro/poker vs messmates w/ tells, Gambler skill, provost raids, payday night; abstract when time-compressed; general plays whist with politicians; **own-side only** — no cross-line cards). **Vices & virtues:** whiskey ration system, the Great Revival (chapel, chaplain, optional faith trait — character never sermon), temperance pledge, tobacco & coffee rituals. **Contraband ephemera as items, never shown** (French postcards, Police Gazette; confiscatable).
- **Romance (all modes, fade-to-black, consequences real):** courtship via composed letters; **sweetheart with her own war** (mill/farm strain, draft-riot summer, possible nursing path → ward reunion; agency incl. ending it); camp followers for pay w/ real costs (money, provost, disease incl. hospitalization); furlough marriage; officer's wife winters in camp; town courtships/widows handled gently; coda marriage boom. **Heat dial:** Parlor / Barracks / **Burn This Letter (default)** — top register = heated/suggestive max, never explicit (hard line, text + visuals); romance events in moddable JSON.
- **Disease: period-plain naming** (camp fever, bloody flux, the French disease — real vectors/odds, moved by camp layout + choices).
- **Hospital: full ward arc** (fever ticks, ward mates, surgeon trust, the amputation decision; scars/prosthetics persist in portraits).
- **POW: full chapter** (camp survival, trade, escape-vs-exchange; cartel sets odds; factual, somber).
- **Desertion: full arc** (always-present choice at cratered Spirits → fugitive chapter; amnesty / exile west / witnessed firing squad).
- **Fight On** (downed → final stand; high-bond messmate can drag you out). **Lineage: death = continue as kin; ALWAYS A COUSIN** (the line never fully ends). **Sailor branch** (Cruise/Mess/Action re-skin on naval engine). **Defeated coda: the long walk home** (parole march through hollowed country). **The sergeant is on the rolls** (named, mortal, his marginalia personal then silent). Letters = **compose from fragments** (feeds Ken Burns narration). **Mascots & named horses** (Old Abe: battle aura + theft/recapture quest; mournable; Muster Roll records them). **Brady portraits** (milestone tintypes → Muster Roll art) + **battlefield photographers** (placement shapes coverage).
- **The Muster Roll:** the cross-mode ledger of every named man, mascot, and fate — the series' soul.

## 8 · HOME TOWN

- **3 archetypes** (Northern mill town / border town / Southern county seat); soldier enlists from it; letters land in it; packages reflect its economy.
- **Industry specialization:** uniforms&boots / arms&powder / rations&forage / hospital town → army supply discounts, workers/troubles, postwar character.
- **Standalone victory = war's-end report card** (population, industry, boys sent/brought home, grief ledger, epidemic/riot survival — benchmarked vs real towns), then Reconstruction sandbox.
- **Museum: player-curated** (relics + composer-written plaques; schoolchildren tour; in album export).

## 9 · SANDBOX, GONZO, ARCADE, VERSUS

- **What-If War:** corps-level stacks on the brass table; collisions generate hex battles; **full gonzo from start** — tech run-ahead (Gatlings, war balloons, armored trains, land ironclads), foreign powers enter, alt-politics map shake, legends & tall tales; + prototype workshop (misfire-risk experimental gear), telegraph hacking (cut AND spoof dispatches), U.S. Camel Corps. **War codes** (compact shareable seeds; daily challenge machinery).
- **The Gauntlet:** authored famous-last-stand micro-maps w/ survival clocks + medals → each unlocks endless variant; pure procedural mode alongside; daily seed; service-record meta-progression trickles account-wide bonuses.
- **Versus:** hotseat IGOUGO + **play-by-telegraph** (per-turn dispatch file PBEM, zero servers). Friend can play the rival house.

## 10 · ENDINGS & MEMORY

- **Won war: Grand Review + roll-call** (Pennsylvania Avenue May 1865 / counterfactual Richmond review) — every named man and mascot, and what became of them.
- **CS victory: sober alt-history coda** — your men honored; the epilogue tells the whole truth of the cause that won (emancipation threads, the family's reckoning). Never a celebration of the cause.
- **Reconstruction: playable coda** (1865–77: muster-out, pensions, GAR halls, town rebuild, ascent track launches). **Annual encampments** (the thinning circle, retellings via your own clips, the last man at the monument).
- **Ken Burns replay** (documentary cut of every battle from your letters + dispatches; skippable to plain scrubber). **Wet-plate photo mode** (long exposure blurs motion; period caption cards → PNG). **Full album export** (self-contained printable HTML: tintypes, letters, flags/honors, Muster Roll, records, front pages). **War Department records office (full)** — sortable career ledgers + period charts; feeds memoirs, elections, Hall of Honor.

## 11 · PRESENTATION & UX

- **Visual identity:** 1860s map-room (parchment, iron-gall ink, brass, blue/gray) — never generic-vintage. 3 render skins over one state (Field Map / Miniatures / Modern).
- **Period music engine** (procedural fife & drum, contextual bugle calls, regimental band as upgradable morale unit) + dynamic battle din + synthesized SFX only (no files).
- **Console-style UI + Gamepad API controller support** (PlayStation-native feel).
- **Accessibility: full pass at v1.0 standard** — colorblind-safe w/ shape/pattern redundancy, scalable text, reduced-motion, full keyboard play, focus-visible, WCAG-grade contrast in all skins. New UI ships compliant (wave-5 contracts); C12 retrofits existing skins.
- **Tutorials: drill-manual pages + the sergeant's marginalia** (two registers).
- **Death rules: choose at muster** (Iron / Standard per campaign). **Quick play (v1.5):** skirmish preset + mid-battle save/resume. **Saves:** localStorage + JSON export/import; three named slots.

## 12 · CUT LIST (asked and not selected — do not build)

Espionage & Signals network · Blockade Board · Occupation & Prisoners (as a system; officer-capture doors DO exist) · omens/aurora events · full songbook · prequel-grafting · family memorial/new-founding (superseded by always-a-cousin) · family succession of army command · attic-trunk menu · national-broadsheet menu · cross-line card games · tween+smoke animation (theater-or-nothing).

## 13 · BUILD LADDER & PIPELINE STATE

- **DONE (v1.0-core, integrated + smoke-tested):** §1–§16 in `civil_war_generals.html` — engine, UI, sound, AI, result, campaign, upgrade, save/load, menus/boot. Retitled. jsdom smoke PASS (boot → menu → muster → battle → AI → turn 2).
- **NEXT GATE:** Aaron's Safari playtest → PLAYTEST-LOG.md → C9 fix pass.
- **Wave 5:** C10 loot cards + C11 regiment ratings (a11y woven in) + C12 skin retrofit audit.
- **v1.5:** War Room economy + franchise winter + 1864 Clock + press/Élan + skirmish/mid-battle saves. **v2.0:** Soldier Campaign. **v2.5:** Sandbox + Home Town + Gauntlet. **v3.0:** life-sim depth + sprite theater + Executive + ascent + saga file + remaining memory systems. **Vol. II: Revolution.**
- Pipeline: Fable plans/audits/integrates per BUILD-PLAN.md + AUDIT-PROTOCOL.md; sonnet-class executors build chunks; every wave parse-gated.
