# Generals of the Republic — Master Handoff v2 (2026-06-12)

Single-file HTML Civil War hex wargame, now **Volume 1 of a series spanning every U.S. war**. **Personal project — NOT MJI.** No brain hub, no MJI machinery. Universal rules only (terse, recommendation+reason, push back, 125/100).

**Source file:** `civil_war_generals.html` in this folder (1,271 lines). Open in Safari. Zero install, no external assets (sound synthesized via Web Audio).
**This doc supersedes the v1 handoff** (the zip's GENERALS_HANDOFF.md). The v1 status block was stale; corrected below. The v1 embedded source copy is obsolete — the HTML file in this folder is canonical.

---

## Build state — v1.0-CORE INTEGRATED 2026-06-12 (chunked pipeline, waves 1-4 complete)

**The game is playable.** All §1–§16 sections live in `civil_war_generals.html` (~172KB): original engine (§1–§8) + pipeline-built §9 UI core, §10 synthesized sound, §11 enemy AI, §12 result screen, §13 campaign flow (recovery branch, roster carry, iron/standard rules), §14 upgrade screen, §15 save/load (localStorage + JSON export/import), §16 menus/picker/settings/tutorial/boot. Marker now `/*__ENGINE_END__*/`.

**Pipeline record:** 8 chunks executed by sonnet-class agents under BUILD-PLAN.md contracts; Fable audited (2 false-positive bug reports rejected: C2 audio ctx scope, C5 flipAtk double-clear), spliced, parse-gated every wave (`node --check`), and fixed one fatal pre-existing engine bug all three wave-1 executors caught independently: `genMap` seed `0x5C1V1L` was invalid hex (parse error) → now `0x5C1B1E`.

**Verification:** jsdom boot smoke PASS — menu renders, muster choice works, Fort Sumter loads 14 units, endPlayerTurn → AI phase completes → turn 2. NOT yet exercised end-to-end: result → campaignAdvance → upgrade → save/reload (static-audited only). **Next gate: Aaron's Safari playtest** (open the HTML, play Sumter → Bull Run; log defects to PLAYTEST-LOG.md for the C9 fix pass).

**Retitle applied (Round 10-11 locks):** game title is now **"The Civil War — An American War Saga, Vol. I"** (title tag, topbar crest, main menu). "Generals of the Republic" remains the project codename in docs/CSS comments only.

Known cosmetic defects (C9 backlog): minimap viewport rectangle is dead code (never drawn); §2 state comment for G.campaign is stale vs actual shape; `started` field unused.

---

## THE SERIES — locked frame

**One Family. One Town. Every War.** (declared and undeclared: Revolution → Quasi-War/Barbary → 1812 → Mexican → Civil War → Indian Wars → Spanish-American → Philippine-American → Banana Wars → WWI → WWII → Korea → Vietnam → Gulf → Afghanistan/Iraq)

- **Era-pack volumes + saga file.** One self-contained HTML per war, shared engine; a small exported **Saga file** (family tree, town state, heirlooms, Hall of Honor) imports into the next volume. Why: zero-install stays true, each volume ships complete, the family thread is real.
- **Saga thread = Family + Town + Heirlooms.** One lineage serves in every war (Muster Roll = multi-generational service ledger). One Home Town grows colonial village → present across volumes. Heirloom weapons/relics carry legacy effects (grandfather's presentation sword, Yorktown → San Juan Hill). Hall of Honor = account-wide medals/meta-progression.
- **Volume 2 = Revolution** (founds family + town; linear tactics fit engine as-built). Engine honesty: chassis generalizes cleanly 1775–1918; WWII+ needs air/armor/combined-arms; insurgency wars need an asymmetric layer.
- **Era-pack data rule (apply during v1.0 build):** all era-specific content lives in the data tables (TERRAIN/WEAPONS/BATTLES/CHAINS/era constants); engine code stays era-agnostic. Why: makes Volume 2+ a data job, not a rewrite.

---

## Locked design v2 (8 popup rounds, 2026-06-12; supplements v1's 8 rounds)

**Mode lineup** (one file, mode-select menu; modes interlink AND launch standalone — locked "Linked + standalone"):
1. **Battle Campaign** — the existing 84-battle branching US/CS chains (v1 spec intact: IGOUGO hex battles, loss → recovery branch, difficulty tiers).
2. **War Room** (linked strategic layer) — war-economy map: build factories/arsenals/farms/rail/depots; output physically flows by rail to the front and becomes what regiments carry; raiders cut lines; supply chain itself is the game. Asymmetric economies: US = industry; CS = battlefield capture + blockade-runner imports.
3. **Soldier Campaign** — full life sim (locked "Everything incl. life sim"): **March / Camp / Battle triptych.** March = Oregon Trail (pace, rations, fords, weather, breakdowns, straggling, disease — camp fever kills 2× bullets). Camp = needs (Rations/Warmth/Health/Spirits) + camp actions (drill/forage/letters/cards/sick call) + 5–7 named messmates with bonds = battle buffs, grief debuffs. Battle = embedded in one regiment on the hex engine; survival odds ride health/role/cover; wounds → hospital arc. Plus: family wired to Home Town, furlough romance, literacy arc, post-war epilogue for every messmate, **lineage** (death = continue as kin; family tree of service).
4. **Home Town** — deep single-city builder; **pick from 3 archetypes** (Northern mill town / border town / Southern county seat); your soldier enlists from it; letters land in it; its economy fills his packages.
5. **What-If War** (standalone sandbox) — Civ-Rev-style free army movement; battles trigger where armies collide. **Full gonzo from start**, all four boxes: tech run-ahead (Gatlings, repeating artillery, war balloons, armored trains, land ironclads), foreign powers enter (British corps, French from Mexico), alt-politics map shake (Kentucky flips, Texas un-secedes), legends & tall tales (ghost regiments, John Henry, folk-hero units). Bonus gonzo locked in chat: mad-inventor prototype workshop (experimental gear w/ misfire risk), telegraph hacking (cut + spoof dispatches), U.S. Camel Corps.
6. **Free Battle** + **The Gauntlet** (survival waves arcade, service-record medals).

**Battle feel — locked "IGOUGO + UG flavor":** keep turn structure; add drag-drawn movement arrows w/ facing, flank/rear bonuses, fatigue, painterly Field Map polish, optional corps-commander auto-assist for untouched units. Why: 90% of Ultimate General's feel for 20% of engine risk.

**Civ Rev hooks — all four locked:** war research tree (Ordnance/Medicine/Logistics/Signal&Intel branches, fed by economy); collectible great commanders (gallery, promotable traits, mortal); era events + alt-history deck; console-style UI + **Gamepad API controller support** (PS-native feel).

**Progression — locked "Full three-tier":**
- *Personal:* Borderlands-style skill tree for your soldier (Grit / Marksman / Messmate branches; points per promotion; capstones e.g. Color Bearer = huge buff/huge risk).
- *Unit:* Madden-style ratings card per regiment — OVR from Firepower/Discipline/Mobility/Élan/Stamina; dev traits Normal→Star→Superstar→X-Factor; proc abilities for storied units (Iron Brigade aura, Texas Brigade shock).
- *Army:* doctrine tree + general ratings cards, fed by research + economy.

**Weapons — locked "Full armory" (Borderlands loot):** 5 rarity tiers (Surplus/Standard/Fine/Presentation/Legendary); real manufacturers as brands w/ stat flavors (Springfield reliable, Sharps accuracy, Spencer/Henry fire rate, Richmond cheap+rough, Enfield import); condition wear; procedural rolls within type; named uniques captured from specific battles; weapon-card UI. **Battlefield capture:** rout a unit, take its guns (historically how the CS armed itself). Manufacturer quirks have downsides (Richmond misfires in rain; Enfield ammo compatibility strains supply).

**Madden franchise layer — all four locked, runs in winter quarters (war year = season, winter = offseason):** recruiting draft class (scouted fresh regiments, potential grades, bust/gem); **enlistment contracts** (90-day/2-yr/3-yr terms expire mid-war; re-enlistment drives w/ bounties or veterans walk home); training camps (upgrade sub-ratings, pop dev traits); brigade trades/transfers.

**Strategic features locked:** **The 1864 Clock** (war weariness, midterms, 1864 election, political capital as spendable currency, foreign-intervention meter — the grand campaign's true win/lose; wars end politically). Press & Élan (period-newspaper recaps, press narrative affects recruiting/politics; in-battle Élan momentum meter; **Council of War** one-time army-wide midpoint adjustment). Staff & Surgeons (rated hires: surgeon/quartermaster/engineer/signal/provost; hospital pipeline; poaching; condolence letters). **AI general personalities** (McClellan stalls, Hood overreaches, Forrest raids — biggest replay value/LOC). Grand Works (one-per-war mega-projects: Tredegar, Military Telegraph, USMRR, Sanitary Commission). Mapmaker's Table + command friction (pre-battle planning; courier-borne orders lag and can be intercepted). Nemesis arc (rival general remembers, press-fanned, reckoning battle). Emancipation & USCT arc (policy cascade: recruiting/foreign meter/unrest; USCT regiments, Olustee already in data). Sutler camp economy (army funds ↔ soldier-mode purchases glue).

**Soldier features locked:** Fight On (downed → final-stand beat decides wounded-vs-killed; high-bond messmate can drag you out). Muster Roll (cross-mode ledger of every named man + fate — the series' soul). Knapsack weight (blanket vs cartridges; matters on forced marches). Aspirations (generated wants: glory/survival/abolition/home — re-flavor events + personal win). Rumor intel (march encounters leak unreliable next-battle info).

**Death rules — locked "Choose at muster":** per-campaign one-time choice — Iron (no redos, death = kin continues, Muster Roll permanent) or Standard (replay lost battles).

**Presentation (v1 spec intact):** 3 render skins over one state; 1860s map-room identity (parchment/iron-gall/brass; NOT generic-vintage); synthesized SFX/ambient only; single file per volume (~1MB fine from file://).

**Rounds 9–11 locks (2026-06-12, this session):**
- **Period music engine** — procedural synthesized fife-and-drum + contextual bugle calls (reveille/assembly/charge/taps); regimental band as upgradable morale-radius unit. (Full songbook not selected.)
- **Texture pack:** mascots & named horses (Old Abe, dogs, camels; relic-class, mournable), Brady portrait studio (milestone tintypes → Muster Roll art), battlefield photographers (placement shapes what the press prints). Omens/aurora events CUT to backlog.
- **Big extras (all four):** after-action replay (animated battle replay, exportable), hotseat two-player IGOUGO, scenario editor (JSON share), daily challenge seed (score chase + medal).
- **Branding:** standalone title per volume with small series mark "An American War Saga." **Vol. I = "The Civil War"** (applied). Vol. II = Revolution, title TBD.
- **Day-phase acts** for multi-day marquee battles (Gettysburg = 3 acts, Shiloh = 2) with night interludes running ALL FOUR locked features: torchlight council (posture choice via generals' traits), burial details (recover wounded, morale costs), campfire vignettes (soldier-mode crossover), night assault gamble (rare, high-variance).
- **Campaign finale:** Grand Review + Muster Roll roll-call (Union: Pennsylvania Avenue, May 1865; CS: counterfactual Richmond review), every named man/mascot and his fate.
- **Create-a-general:** name, home state, portrait, one starting trait; press/nemesis/statue/Muster Roll all reference your authored founder.

**Rounds 12–16 locks (2026-06-12, continued):**
- **Heirlooms = weapons + relics + family name.** Heirloom weapons (provenance, kill-notches), story-proc relics (the Bible that stopped a ball, watch, flag fragment), and family reputation compounding with recruiters/press/Home Town. (Scars/debts/grudge-bloodlines not selected.)
- **Forage/hunt = timing-volley minigame** (Oregon Trail hunt: timed shot windows widened by Marksman skill; misses waste cartridges, can draw provost attention).
- **Gauntlet = all three flavors:** authored famous-last-stand micro-maps (Little Round Top, Hornet's Nest, Sunken Road) with survival clocks + medals; beating a stand unlocks its endless-wave variant; pure procedural horde mode alongside; daily seed rotates the lineup.
- **After-action replay = Ken Burns mode** (documentary cut: pans over frozen moments, dispatch captions, excerpts from the player's own composed letters, synth fiddle; skippable to plain map+scrubber).
- **Saga chronology = CHRONOLOGICAL RESTART** (Aaron rejected prequel-grafting): once Vol. II (Revolution) exists, the true saga starts there; Vol. I family trees remain standalone branches. Simplifies saga file — no retroactive ancestor writes.
- **Nemesis voice = letters AND press feud** (period-correct correspondence between battles + newspaper rivalry; final letter or surrender sword at the reckoning).
- **Letters = compose from period phrase fragments** (choices move Spirits, bonds, Home Town beliefs; composed letters feed the Ken Burns replay narration).
- **War Room look = brass map-room table** (engraved map under glass, brass pins, red string rail, grease-pencil fronts, ticking telegraph; factories/depots as placed stamps).
- **Winter deeds (all four):** Washington galas (political-capital minigame), drill the army (dev-trait pop boost, press cost), visit Home Town (statue/family/recruiting), draft memoirs (legacy score shaping Grand Review epilogue + Hall of Honor).
- **Raids = map-crawl + climax skirmish** (Grierson-style multi-day decision crawl resolving in a playable small hex battle).
- **Hospital = full ward arc** (fever ticks, ward mates, surgeon trust, the amputation decision; scars/prosthetics persist on the man and his portraits).
- **President = audiences + SACKABLE with comeback arc** (telegrams + crisis audiences; lose confidence → relieved to a lesser theater, rebuild toward reinstatement).
- **POW = full chapter** (camp survival, trade, disease, escape-vs-exchange; cartel status sets odds; factual, somber).
- **Navy = sailor lineage branch** (Cruise/Mess/Action re-skin of March/Camp/Battle on existing naval engine).
- **Photo mode = wet-plate camera** (long exposure blurs movement, plate wobble, vignette, period caption card → PNG; best shots feed Brady/Muster Roll).

**Rounds 17–23 locks (2026-06-12, continued — politics arc added at Aaron's direction):**
- **Political ascent track (full):** any veteran of the line can stand — town office → legislature → Congress/governor → Presidency; war record/medals/memoirs/press/Home Town standing convert to electability; plays in the Reconstruction coda and across volumes; Hall of Honor gains a Presidents wing.
- **The Executive mode:** run the war from the President's chair — appoint/sack AI-personality generals, set theater priorities, manage the 1864 Clock from the other side, survive the election; battles auto-resolve from generals' personalities unless you take the field at a crisis. **Both seats (Lincoln AND Davis) at Vol. I launch.**
- **Elections = whistle-stop campaign** (stump speeches via letter-fragment composer, debates as card duels, bloody-shirt rallies spending your war story, scandals mined from your own ledger; press narrative doubles as polling).
- **Campaign divergence = STRUCTURAL** (non-rec pick): big upsets reroute the battle chain itself. Cost containment (Fable): forks reuse the 84-battle pool with procedurally shifted variants; fork points capped at marquee upsets. **Drift cap = GONZO-LITE** (second non-rec): extreme records can escalate the campaign into intervention scares/experimental arsenals — the sandbox starts unhinged, the campaign earns it.
- **Mascots in battle = auras + theft risk** (Old Abe flies: morale aura, rally scream; enemy can steal him — loss is a morale wound and press story, recapture is a quest).
- **Reconstruction = playable coda** (condensed 1865–77: muster-out, pensions, GAR, town rebuild, Muster Roll fates resolve, ascent track launches here).
- **Full flag designer** (name/state/motto/canvas-drawn regimental color at muster; battle honors stitched on after victories; flags fly on-map, age with wear; captured flags are trophies).
- **Play-by-telegraph** (async two-player: per-turn dispatch file export/import — PBEM on the existing save infrastructure, zero servers).
- **Accessibility = full pass at v1.0 standard** (colorblind-safe with shape/pattern redundancy, scalable text, reduced-motion, full keyboard play, focus-visible, WCAG-grade contrast in all three skins).
- **War Department records office (full)** (career ledgers per regiment/general/weapon, period-chart graphs, sortable; feeds memoirs, elections, Hall of Honor).
- **Mode unlocking = progressive + "muster everything" toggle.**
- **Quick play = skirmish preset + mid-battle save/resume, v1.5** (G.battle serialization — the deferred CHUNK-07 fork).
- **Line's end = ALWAYS A COUSIN** (non-rec): the line never truly dies; extinction/memorial systems off the table (the cousin's arrival still gets its scene).
- **Tutorials = drill-manual pages + sergeant's marginalia** (two registers: period lore + plain English).
- **Undo = one "courier recall" per battle by default; settings toggle for unlimited (movement only, never fire/charge; Iron = none).**
- **Rival house = player-defined at founding** (name the opposing family; their sons appear across battles, prison, nemesis letters, ballots; friend can play them in versus modes).
- **General's death = War Department appointee succeeds** (non-rec: command stays professional; family stakes live in soldier mode/lineage, not army command).
- **AI fog = symmetric at Hardened+** (Recruit/Veteran omniscient AI as built; Hardened/Iron Brigade AI scouts honestly and can be ambushed).
- **Album = full export** (self-contained album HTML, printable: tintypes, composed letters, flags/honors, Muster Roll fates, records highlights, front pages).

**Rounds 24–28 locks (2026-06-12, continued):**
- **Main menu = the morning newspaper** (non-rec pick): a broadsheet front page — headlines are modes, classifieds are settings, the date advances with progress. **Masthead is SIDE-SPECIFIC** (second non-rec): a Union or Confederate organ following the active saga slot's side; each family slot opens its own paper.
- **CS campaign victory = sober alt-history coda** (Richmond review honors your men; the epilogue tells the whole truth of the cause that won — emancipation threads, the family's own reckoning; never a celebration of the cause).
- **Three named saga slots** (each a trunk/family; export/import for overflow).
- **Battle audio = dynamic din** (continuous synthesized battle-bed scaling with engagement intensity under discrete SFX; settings-respectful).
- **Ladder holds:** v1.5 = War Room economy + franchise winter + 1864 Clock + press/Élan BEFORE Executive/elections (politics feeds on those systems).
- **Naval = ram & boarding AND wind gauge** (steam ignores wind, sail-rigged ships feel it; pre-builds Vol. II frigate duels; ramming = ironclad charge with mutual hull risk; boarding = marine-party melee).
- **Winter quarters = buildable camp** (small-grid layout — hut rows, kitchens, chapel, sutler row, hospital tents — drives disease/dev-pops/desertion/spring morale; your soldier walks the camp you built).
- **Captured officers: all three doors, each with consequences** — exchange (cartel credit), host (honor/press, nemesis threads), ransom (funds, scandal). Your captured leaders sit out until exchanged.
- **Defeated soldier coda = the long walk home** (playable parole march through the hollowed country — Oregon Trail in reverse — to whatever remains at the front gate).
- **Supersim toggle** (hand your army to your own AI personality engine mid-battle, jump back anytime; doubles as the AI-vs-AI QA harness).
- **Era-pack spec = documented for modders** (battles/weapons/terrain/chains/events JSON shape published with the scenario editor; the chassis becomes a platform).
- **Sandbox scale = corps-level stacks** (Civ Rev readability; collisions generate hex battles from corps strength/composition).
- **Soldier instrument skill** (fiddle/fife/mouth harp: Spirits engine, vignette variants, sutler credit; his mastered tune scores his Ken Burns replays and album).
- **Founding flow = staggered creators** (boot = name family + town only; general at muster, flags at regiment muster, rival house at first press villain, soldier at enlistment — creators arrive as scenes, never forms).

**Rounds 29–30 locks (2026-06-12 — camp-life expansion at Aaron's direction: trading, sutler store, camp followers, romance, gambling):**
- **Romance = full arcs per mode, ALL intimacy fade-to-black, consequences real.** Soldier: courtship via composed letters, sweetheart at home/furlough, camp followers for pay (money, provost trouble, real disease risk incl. hospitalization), furlough marriage, heartbreak. General: officer's wife winters in camp; marriage strained by ambition. Town: home-front courtship, war widows handled gently. Coda: postwar marriage boom. Never explicit content — costs and stories only.
- **Gambling = both-by-context:** playable period mini-games at the table in camp (chuck-a-luck, faro bank, five-card poker vs named messmates with learnable tells; Gambler skill; provost raids; payday-night event; the general plays high-stakes whist with politicians); abstract odds when time-compressed (marches, winter summaries).
- **Trading = full three-ring barter web:** mess barter (rations/gear/paper/charms/newspapers; knapsack weight matters) + sutler store (period catalog, notorious gouging, paymaster credit cycle with debt spiral, historical sutler-raid event) + **cross-picket trading with the enemy** (coffee-for-tobacco, enemy newspapers as intel crumbs, provost risk, nemesis-softening, rival-house encounters at the river).
- **Disease = period-plain naming** (camp fever, bloody flux, the French disease — real vectors and odds, moved visibly by winter-camp layout and choices).
- **Sweetheart = her own war** (full character arc revealed in letters — mill/farm strain, draft-riot summer, possible nursing path that can place her at YOUR ward; she has agency, including ending it by letter).
- **Cards stay own-side only** (non-rec): no cross-line gambling; picket trade is goods only.

**Rounds 31–34 locks (2026-06-12, continued):**
- **Heat setting:** three registers — Parlor / Barracks / **Burn This Letter (DEFAULT)**. Top register = heated letters, cutaway intimacy, bawdy camps; never anatomically explicit (Claude's hard line, all registers; visuals likewise — period-suggestive max). Romance events ship as moddable JSON; Aaron may edit his own copy past that line.
- **Asymmetric pay:** US greenbacks chronically late (paymaster arrival = event; arrears; payday night detonates gambling + sutler economies). CS pay inflates toward worthless (barter becomes king; sutler quotes three monies; picket-trade coffee is currency).
- **Vices & virtues (all four):** whiskey ration system (official gill, smuggled bottles, Dutch-courage buff w/ costs, drunkenness charges), the Great Revival 1863–64 (chapel in buildable camp, chaplain staff card, optional faith trait — character never sermon), temperance pledge (signable; locks whiskey buffs, earns regard, breaking it before the mess is a small tragedy), tobacco & coffee ritual (daily Spirits rituals; the picket trade's twin currencies).
- **Full desertion arc:** always-present choice at cratered Spirits → fugitive chapter (hunted journey home, hiding, provost knock; endings: amnesty return, exile west, or firing squad witnessed by the old mess). Muster Roll records it plainly.
- **Town industry specialization:** uniforms&boots / arms&powder / rations&forage / hospital town — sets army supply discounts, arriving workers/troubles (arsenal explosions real), postwar character.
- **Family origin pick at founding:** Yankee stock / Famine Irish / German Forty-Eighters / border Scots-Irish (+ see USCT below) — flavors names, letters, church, recruiting regiments (Irish Brigade, all-German XI Corps), nativist friction, Home Town character.
- **Full USCT lineage path:** playable United States Colored Troops soldier story — pay-protest year ($10 vs $13), graver capture stakes, Olustee/Crater weight, Reconstruction coda with different stakes entirely. Research-grade care + hard review gate before ship.
- **Contraband ephemera = items, never shown:** French postcards, Police Gazette, dime novels — tradeable, morale perks, provost-confiscatable; imagery never rendered (the envelope and the confiscation report are the joke).

**Rounds 35–36 locks (2026-06-12, continued):**
- **USCT entry = both doors:** free Black Northern founding family at boot (origin picker; 1861 opens with enlistment denied) AND mid-war self-emancipation entry post-1863 (the larger history; the lineage system's most powerful founding).
- **Vol. II signature system = DEFERRED to Vol. II** (era-pack fields stay generic; enlistment-midnight and militia/Continental concepts noted as candidates).
- **Battle animation = THEATER OR NOTHING** (non-rec, bold): tween+smoke CUT; visuals stay static board-game until full sprite theater (tiny drawn soldiers in ranks — march/kneel/fire/fall, per arm × side × action) can be done right. Sprite theater is now a COMMITTED v3 pillar for the Miniatures skin, not a dream.
- **Home Town standalone victory = war's-end report card** (graded at the surrender vs how real towns fared: population, industry, boys sent/brought home, grief ledger, epidemic/riot survival; Reconstruction continues sandbox-style after).
- **Wave 5 = C10 loot cards + C11 regiment ratings with a11y woven into both contracts + C12 retrofit audit** of existing skins to the locked WCAG-grade standard.

**Rounds 37–38 locks (2026-06-12, final discovery rounds):**
- **Annual encampments:** GAR/UCV reunions as recurring coda scenes — the surviving Muster Roll convenes yearly, aging; battles retold via the player's own Ken Burns clips; the circle thins to the last man at the town monument.
- **The sergeant is a man on the rolls:** the tutorial voice is a named persistent sergeant-major — ages, promotes, can fall (marginalia silences); Muster Roll carries him.
- **War codes:** sandbox starts compress to short shareable codes (seed + dials + gonzo flags); daily challenge runs on the same machinery.
- **Museum = player-curated** (relics displayed, plaques written via letter-composer; schoolchildren tour in coda; album export includes the gallery).
- **Embedded correspondent:** one named war reporter attaches for the duration — his dispatches are your recaps, access granted/denied has consequences, his coda memoir is the other version of your story.
- **Seasons gate tempo:** strategic calendar enforces mud/campaign/winter rhythm (Mud March cautionary event; pushing the season possible but priced; winter forces the buildable camp).

**Design discovery COMPLETE at Round 38** (~130 locks). Further rounds only at Aaron's explicit request; DESIGN-BIBLE.md is the organized capstone of all locks.

**CUT (explicitly not selected — backlog only, do not build):** Espionage & Signals network, Blockade Board, Occupation & Prisoners, omens/aurora events, full songbook, prequel-grafting saga model, family memorial/new-founding system, family succession of army command, attic-trunk menu, national-broadsheet menu, cross-line card games, tween+smoke animation (superseded by theater-or-nothing).

---

## Release ladder — locked

- **v1.0** Playable army campaign: AI, result screen, campaign advance, upgrade screen, save/load, sound, menus/boot + **loot cards & three-tier boost integration**. Era-pack data rule applied during this build.
- **v1.5** War Room economy map + winter-quarters franchise layer (draft/contracts/camps/trades) + 1864 Clock + press/Élan.
- **v2.0** Soldier Campaign (March/Camp/Battle + lineage + Fight On + knapsack + aspirations + rumors + Muster Roll).
- **v2.5** What-If gonzo sandbox + Home Town (3 archetypes) + Gauntlet.
- **v3.0** Life-sim depth (family/romance/literacy/epilogue) + Grand Works + nemesis + Mapmaker/friction + staff/surgeons + Saga file export.
- **Volume 2: Revolution** (era pack on the refactored engine).

Each rung ships a complete playable game.

## v1.0 build list (append at `/*__ENGINE7__*/`, in order)

1. `logMsg` / `refreshUI` / toast / `clearSelection` already exists — verify; tutorial coach.
2. `runAI(cb)` — per DIFF aiAgg/skill; advance to objectives/weak targets, fire/charge when favorable, routed drift rear; staggered `setTimeout`; MUST call `cb()`; re-check `checkVictory` between actions. Hook for AI-personality matrix (v1.5 fills personalities).
3. `endBattle` — verdict, casualty tallies, historical benchmark vs `bd.res`, continue → campaign/menu.
4. Campaign — `startCampaign(side)`, roster carry (XP/weapons/leaders), win → advance, loss → harder recovery node, funds.
5. Upgrade screen — funds, XP pips, date-gated weapon buys, replace losses; **extend to weapon cards + unit ratings cards (loot/boost v1 slice)**.
6. Save/load — localStorage try/catch + JSON export/import (reliable path).
7. `playSfx` synth set (volley/cannon/march/charge/rout/bugle) + ambient toggle.
8. Menus/boot — main menu, battle picker (theater tabs), settings, `init()`.
9. Playtest full loop in Safari; iterate. Marquee battles (Gettysburg, Antietam, Shiloh, Chickamauga, Hampton Roads) flagged for hand-tuning later.

## Architecture notes (carried from v1, still accurate)

`G` global state: `mode/settings{diff,render,sound,tutDone}/cam/campaign/battle/sel/order/reach/fireT/chargeT/hover/anim/tut`. `G.battle`: `bd,M{GW,GH,map,key,objs,naval},units,turn,maxTurns,wx,playerSide,enemySide,atkSide,log,over,casualties,infl,vis,suppliedSide,phase,_start0`. Unit/Tile fields, DOM ids, hex math (odd-r offset, `ODDR_DIRS[r&1]`), deterministic per-battle maps (`mulberry(hashStr(bd.id))`) — see v1 doc §Architecture or read the source directly; the source is canonical.

Saga file (design target, v3.0): JSON `{family:[{name,born,wars:[{vol,unit,fate,medals}]}], town:{archetype,era,development}, heirlooms:[{item,provenance,legacyProc}], honors:[]}` — exported like saves, imported by later volumes.

## Session 2026-06-14 — autonomous build (Aaron: "skip eyeball gate, execute all outstanding")

Delegation model proven: bounded card chunks → sonnet executors; historical authoring + a11y + all merges → Fable. Both executor outputs passed Gate 1–3 clean on first audit (no invalid-hex, no redeclares, namespaced). Third executor false-positive logged (G6 tintype `G.sel.side===G.battle` — real dead code but harmless; verified before removing).

**Shipped + verified (parse PASS, jsdom smoke + regression PASS, file ~365KB script):**
- **G-wave remainder:** `spriteBudgetCheck(_frameDt)` wired into `_gorDriver` — LOD tripwire now live.
- **F1 — AUTHORED_MAPS (the format + the flagship):** new `AUTHORED_MAPS` data table + `authoredMap(bd)` builder returning the genMap-compatible M plus `authoredFeatures`/`deploy`/`ground`. Four engine hooks: `startBattleRuntime` prefers authored over genMap; `deployForce` honors per-side deploy zones (Set of "c,r") when present, else the old bands; `_drawFamousFeatures` draws authored features at exact hexes (tag-scan fallback for generated battles); new `_showGroundBriefing` pre-battle "The Ground" panel with Verified/Inferred feature ledger. **Antietam authored** hex-exact on a 20×18 grid: Lee's line on the high ground (ridge/hills upper-center), Cornfield/Dunker Church(obj★3)/West+East Woods north, Sunken Road (fort=entrenched lane, obj★2) center, Sharpsburg west, Antietam Creek down the east with Burnside's Bridge (ford, obj★2) SE; two-axis Union deploy (Hooker north + Burnside east-of-creek). 9 features tagged (8 Verified, Hagerstown Pike Inferred). Provenance note distinguishes Verified relative-position from authored hex-abstraction.
- **Wave 5:** C10 loot (5 tiers, 10 makers+quirks, 6 named uniques, `rollLoot`/`captureLootFromRout`/`renderWeaponCard`; capture is campaign-gated by design, wired into `killUnit` behind `G.campaign`, surfaced in a "Captured Arms" upgrade section). C11 ratings (`ratingsFor`/`renderRatingsCard`/`xfactorFor`, OVR+5 ratings, dev N/S/SS/XF, 15 X-Factor procs; wired into unit-info panel + upgrade roster rows, compact badge). C12 a11y (full keyboard operability: Tab/Space cycle, M/F/C/R/D orders, arrow hex cursor, Enter commit/end-turn, E end-turn, +/- zoom, ? legend; objective ownership conveyed by glyph+word+aria not color alone; Reduced Motion + Colorblind Aids settings toggles; `prefers-reduced-motion` first-run default; cbAids draws side glyphs on units + a dashed brass aim reticle when an order is pending).

**LOCKS this session:**
- **AUTHORED_MAPS format (LOCKED):** `{GW,GH,legend,grid[GH strings],objs[{c,r,val,label}],features[{c,r,label,conf}],deploy[GH 'U'/'C'/'.' strings],ground}`. Why: a hand-laid grid + zone overlay is the minimum that expresses real ground AND multi-axis fronts without per-map engine code; everything else (rendering, deploy, labels, provenance) is the existing engine reading these fields. No elev-override field — added only when a map needs elev>1 (avoid disconnected infra).
- **Deploy zones beat bands for authored maps (LOCKED).** Why: the generator's top/bottom bands can't seat Lee's line + a two-axis Union assault; the zone overlay can, and generated battles are untouched (fall through to bands).
- **Loot is a campaign mechanic (LOCKED):** capture only fires inside a campaign (`G.campaign.captured[]`). Why: free battles have no roster to carry trophies into.
- **AUDIT-PROTOCOL Gate 1 now greps invalid hex** (`0x[0-9a-fA-F]*[g-z]`) on chunk + full splice. Why: this bug class shipped three times.

**STILL OPEN at that point:** the eyeball gate. → which produced the GRAPHICS PIVOT below.

## Session 2026-06-14b — GRAPHICS PIVOT (Aaron saw the render, rejected procedural)

Aaron opened Fort Sumter (a naval/all-water map — worst-case) and said the graphics aren't realistic enough; wants **Ultimate General: Gettysburg**-level. I pushed back with the honest truth: UG:G's realism is **painted raster art**, not procedural code, and the G-wave's vector approach has a hard ceiling below it — so the fix is an art pipeline, which collides with the "single-file / zero external assets" lock. Walked him through 3 paths; he locked:

- **Direction:** painted art, **single-file zero-asset lock RELAXED → sibling `assets/` folder**, **painted HEX-TILE SET** (one PNG per terrain type, tiled — scales to all 84 vs bespoke maps). Why each: see DESIGN-BIBLE "⚑ GRAPHICS PIVOT" block.
- **Honest blocker surfaced (and verified, not faked):** Cowork has **no image-generation tool** — I cannot produce the art here. So the split: I build the asset-loading ENGINE + write generation PROMPTS; Aaron generates the PNGs in ChatGPT/Gemini/Grok and drops them in `assets/terrain/`.
- **BUILT this session:** asset-loading renderer — `TILE_SRC` key→path map, `_preloadTiles()`/`_tileReady()`, `Image()`-based load (file://-safe, NO fetch — fetch to local files is browser-blocked), integrated into `_renderTerrainToOffscreen` (tile drawn clipped to hex w/ tilt + seeded H-flip; **procedural fallback per missing tile**; feature/elev/water overdraw skipped when painted). Placeholder PNGs (PIL noise) shipped in `assets/terrain/` so the pipeline is demonstrable today. `ASSET-PROMPTS.md` written (per-tile prompts + UG:G style + seamless/512px/naming spec).
- **Bug caught by smoke (why we gate):** `_preloadTiles()` called in `init()` (runs mid-script) hit a **TDZ** on `const TILE_SRC` (declared later in file) → deferred the call via `setTimeout(…,0)` past script end. Parse + jsdom smoke + regression all PASS after fix.
- **LESSON (banked):** when adding a `const` that an early-running `init()` path touches, mind the temporal dead zone — defer the call or declare earlier. Smoke caught it; static parse did not.

**Then it evolved further → see next section.**

## Session 2026-06-14c — CLASSIC vs MODERN (both render looks shipped)

Aaron escalated painted-2D → 2.5D → **full 3D, as realistic as possible**, then settled it cleanly: **build BOTH and let the user choose**, framed in plain English as **Classic** (existing 2D hex board) vs **Modern** (3D battlefield), a Settings → Graphics toggle. **Initial build scope = canonical (pantheon) battles first**, build out to all 84 once the look is refined. Locks + Why:
- **Classic/Modern toggle (LOCKED).** Why: lets Aaron judge by playing both instead of choosing blind; plain-English naming over "2.5D/full-3D" jargon; 2.5D-vs-full-3D becomes Modern's progressive fidelity, not a user-facing third thing.
- **Run via local server (LOCKED) — best practice.** Three.js loads `.glb`/HDRI via fetch, blocked on `file://`. `play.command` written (double-click → `python3 -m http.server` + opens browser) so it stays one action. Hosting (GitHub Pages) is the answer if sharing ever matters. (Embed-base64 rejected as a hack.)
- **Honest pushback delivered + overruled:** I told Aaron full-3D is NOT "best for the goal + efficiency" — the game's value is systems/content breadth across 84 battles, and 3D is a permanent content tax + the biggest tech risk + asset-labor-gated + bounded by AI-3D quality on niche period units; recommended 2.5D. He chose "build both." Recorded; honored.

**BUILT this session (`§23 MODERN 3D RENDERER`, ~280 lines; parse + jsdom smoke + full regression PASS):** WebGL/Three.js renderer loaded from **jsdelivr** (not cdnjs — the game runs in Aaron's browser, so addons like OrbitControls are available). `__M3D` state; `_m3dActivate` (async script-load → init → show, reverts to Classic + toast on any failure), `_m3dInit` (scene/camera/OrbitControls/sun+hemi light/fog/raycaster), `_m3dBuildTerrain` (per-hex hexagonal prism, height from `tile.elev`, PALETTE color, centered + camera-framed), `_m3dBuildUnits` (3D token: cylinder body + flag + selection ring, side-colored, `userData.unit`), `_m3dPointerUp` (raycast → `onHexClick`), `_m3dSync` (rebuild on draw), `_m3dResize`, render loop. Integration: `G.settings.gfx` ("classic" default), Settings → Graphics toggle, `draw()` early-returns to `_m3dSync`+`drawMini` when Modern active (HUD/minimap stay DOM/2D), `resize()` + boot both call into it. **All guarded** — Three absent or `__M3D` not-yet-initialized → no crash, Classic unaffected.
- **Two boot crashes caught by smoke (root cause: module spliced near EOF, so its `var __M3D` is `undefined` when `init()→resize()→_m3dResize()` runs at boot — a throw there aborted the rest of script eval).** Fix: guard `_m3dResize` and the `draw()` Modern-guard against `__M3D` being undefined. LESSON (banked): appended-at-EOF modules whose vars are touched by the early `init()` path must guard for `undefined`/TDZ — same class as the `TILE_SRC` setTimeout fix. Static parse never catches it; jsdom boot-smoke does.
- **⚠ Hard limit:** Fable cannot see WebGL output (no GPU in the build sandbox). Verifiable here = parse + boot-smoke (Three-absent fallback). The actual 3D look is Aaron's browser QA loop (screenshot → Fable iterates). Modern v1 is intentionally simple (colored terrain + token units) — a correct, low-risk foundation to tune from, not the finished look.

**STILL OPEN:** Aaron opens `play.command`, flips Settings → Graphics → Modern, screenshots the 3D battlefield; Fable tunes from there. Fidelity ladder: tokens → painted billboards → Meshy `.glb` models; PALETTE terrain → Poly Haven PBR; flat sky → HDRI. Painted-2D tiles remain the Classic/fallback skin. F2+ pantheon authored maps still queued (now feed both renderers — Antietam already renders in Modern).

## Session 2026-06-14d — FABLE GOT EYES ON WEBGL + Modern fidelity + 3 pantheon maps (autonomous overnight)

Aaron granted full autonomy ("pre-approve all bash", went to bed). Locks + Why:

- **CORRECTION TO THE PRIOR LOCK: Fable CAN see the WebGL/Modern renderer now.** Why: the prior "no GPU in sandbox, 3D look is Aaron-only QA" assumed the Playwright MCP. The MCP isn't exposed to the VS Code Claude Code session and no PW browsers were cached — so I drive the *installed Google Chrome* directly via `playwright-core` (no browser download) + SwiftShader software-WebGL, screenshot, and read the pixels myself. Tool: **`tools/shot.mjs` + `tools/shots.json`** (named scenes, one-command re-shoot, console dump). The 3D-look screenshot loop is no longer Aaron-gated — Fable iterates shot→fix→shot solo. `playwright-core` is a **dev** dep only.
- **Modern verdict (LOCKED, evidence-based):** at the token tier Modern was a tech demo; after this session's tune + **painted billboards** (reusing the 2D regiment art as `THREE.Sprite`s) it **matches Classic's unit fidelity and adds 3D ground/elevation/shadow** → demo-ready and worth shipping opt-in. Why default stays Classic for now: billboards lack the live badges (morale/ammo/xp) + unit-name + named-feature labels Classic draws; once those reach 3D, flip the default. Ceiling = Meshy `.glb` + PBR terrain + HDRI (loaders already wired).
- **Renderer geometry fix (LOCKED):** terrain tiles must use `CylinderGeometry` radius = hex **circumradius** (`HEX*S`), not the inradius (`hexW/2`) — the inradius is what left the gaps. Units stand on `_m3dTileH(elev)` (shared with terrain), not `elev*EH`.
- **Asset drop-in is live (LOCKED):** `assets/3d/models/units/<name>.glb` (`soldier_us/cs`, `cavalry_*`, `cannon_*`, `general_*`, …) + `assets/3d/env/sky_day.hdr` load automatically when present (GLTFLoader/RGBELoader from jsdelivr, optional, non-fatal). Per-unit ladder: model → billboard → token. The ~7× `404` at battle start is the *expected* one-time absence probe, not an error.
- **Mobile tier (LOCKED):** `gfxQuality` Auto/High/Low (Settings → Graphics → 3D Quality); Auto → Low on ≤720px / coarse-pointer (pixelRatio 1, no AA, no shadows, fewer figures). `_m3dLowTier()` is the single resolver.
- **Pantheon maps authored (Fable; `AUTHORED_MAPS` literal; Verified/Inferred discipline):** **Gettysburg, Shiloh, Fredericksburg** — all render in Classic AND Modern, deploy zones + "The Ground" verified by screenshot. Generators kept (`tools/build_<battle>.mjs`) — they validate row widths and are re-runnable for tuning. Authored order remaining: Chickamauga, Bull Runs, Franklin, Vicksburg, Chancellorsville.
- **T1 systems executor wave DEFERRED last run (Why):** didn't splice *new systems* (War Room / 1864 Clock / Muster Roll) unattended — violates "own every merge" with Aaron asleep; authored maps (self-verifiable) instead.
- **T1 design authority — LOCKED 2026-06-14 (Aaron):** for the next run, **Fable designs the T1 systems on best judgment; Aaron corrects after.** Why: he wants forward progress and is fine reviewing post-build rather than spec'ing each up front. Guardrail unchanged: full adversarial audit + parse + smoke + screenshot before any splice — never blind-splice; log each design choice in RUN-LOG for his course-correction.
- **Hosting scaffolded, NOT published (HALT — `PHASE4_HALT.md`):** local git + `index.html` redirect + `tools/deploy.sh` (default-safe; `remote` gated behind typing `PUBLISH`). `gh` present. Aaron runs `DEPLOY.md` to go live.
- **Blender MCP:** `uv`/`uvx` installed + addon fetched, but **Blender app not installed** → MCP can't connect this session (`BLENDER-CONNECT-STEPS.md`); didn't block.

## Session 2026-06-14e — PANTHEON MAPS COMPLETE + T1 WAR DEPARTMENT (Fable autonomous; workflow-orchestrated)

Full autonomy + Ultracode. Two background workflows up front (6-agent battlefield research; 3-build + 3-adversarial-audit T1 wave). Aaron mid-run broadened permissions (all bash + URL searches). Locks + Why:

- **All nine pantheon battlefields now hand-authored (LOCKED).** Added the final six — **First & Second Bull Run, Chancellorsville, Vicksburg, Chickamauga, Franklin** — to `AUTHORED_MAPS` (22×20 each), drawn to the real ground from parallel web-research briefs (NPS / American Battlefield Trust / LoC), Verified/Inferred tagged, "The Ground" prose. Generator `tools/build_pantheon2.mjs` (self-validating) + briefs banked. All 12 classic+modern renders READ + verified; Classic regression clean. Why: completes the R46 pantheon-first batch; rolling authoring continues to all 84.
- **T1 "War Department" v1.5 systems SHIPPED (LOCKED; Fable's best-judgment design per Aaron's 2026-06-14 authority grant).** 1864 Clock + Muster Roll + War Room as one tabbed shell, reachable from the newspaper menu ("THE WAR DEPARTMENT CONVENES"). Namespaced append-only chunks (`clk`/`mr`/`wr`) + Fable glue; state under `G.campaign.{clock,muster,warroom}` (rides saves, defensive init, no `_SAVE_VER` bump); ticks off `campaignAdvance`. **Design choices + course-correct notes in RUN-LOG run-e** (esp.: v1 War Room is campaign-economy-only by design — no in-battle combat effect yet; 1864 election is a recorded verdict, not game-over). Why this scope: additive, fully verifiable, Classic never regresses.
- **Adversarial-audit discipline paid off (LOCKED lesson):** the workflow's auditor caught 2 real Muster-Roll bugs my own read missed — period names clobbered by the engine's generic in-battle label (gate on `u.vetName` not `u.name`), and per-battle kills under-counted by `Math.max` (accumulate). Both **verified against live engine** before fixing (audit-vs-runtime rule). Trust no executor *and no auditor* claim without re-derivation; the second opinion is still worth running.
- **Verification mechanism extended:** `tools/t1probe.mjs` (drives a real campaign through the systems, writes results to disk) + `tools/menuprobe.mjs` (menu-entry check). Both bypass the (flaky, quota-limited) command-stdout capture by writing to `tools/shots/*.json` + PNGs that Fable reads directly.
- **Env note:** the harness command-output tmpfs hit a 0MB quota repeatedly this run (a 454KB `/tmp` scratch file + accumulated capture files); worked around by routing scratch to project `.scratch/` and silencing stdout. If it recurs, set `CLAUDE_CODE_TMPDIR` to a roomier path.

## Session 2026-06-13f — MODERN DEFAULT + AUDIO SCORE (Opus 4.8 autonomous; Fable persona retired)

Persona retired (project + standards kept). Two opening 3-question rounds locked these directions:
- **Round 1 (executed this run):** flip Modern to default ✅; install+open Blender to open the 3D-asset ceiling (Aaron-gated, pending); full adaptive period score ✅.
- **Round 2 (next directions):** **(a) NEXT LEAD = push the Modern look further** (day-phase lighting, weather in 3D, smoke banks, regimental/objective flags, animated billboard poses); **(b) IDENTITY = Create-a-General + family founding** (name/home-state/procedural portrait/one trait at first muster — the founder the saga references); **(c) ASSET AMBITION = full battlefield kit** once Blender connects (PolyHaven PBR + HDRIs + Sketchfab CC0 + Hyper3D props + core unit .glb, batch to assets/3d/).

**SHIPPED + verified (full parse + hex + headless-Chrome probes READ; Classic no-regression):**
- **Modern 3D is the DEFAULT renderer.** Parity gaps closed (`M3D_PARITY.js`): 3D feature-label plaques (Verified/Inferred), live unit badges (name+strength bar+morale/ammo/xp), 3D battle FX (muzzle/smoke/−casualty numbers) off the shared `G.fx`. `G.settings.gfx` default→"modern"; saved "classic" wins; offline reverts. Classic pixel-unchanged.
- **Adaptive period score** (`AUDIO_SCORE.js`+`AUDIO_WIRE.js`): fife-and-drum / battle drone+din(intensity-scaled) / camp air / harmonic-series bugle calls; Settings **Music** toggle; fixed latent "ambient never started in battle". Aaron ear-test pending (musicality unverifiable by me).
- **LESSON (recurring, banked):** `G`/`HEX` are declared `const`/`let` at script top → **lexical globals, NOT on `window`**. Appended chunks must read them by **bare name**; `window.G` is `undefined` (it silently muted the whole audio module until caught by `tools/audioprobe.mjs`). Same trap to avoid in every future chunk + probe.
- New verification tools: `tools/bootprobe.mjs` (default-path boot), `tools/audioprobe.mjs` (WebAudio API). Details in RUN-LOG run-f.

## Defaults left to Claude

Parchment + blue/gray palette; guided tutorial on first battle of each track; standard hex UI. Series title treatment, controller button mapping, Élan meter visuals, card layouts: Claude's call at build time, 125/100 bar.
