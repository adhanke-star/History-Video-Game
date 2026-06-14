# BUILD-PLAN — Generals of the Republic v1.0
**Pipeline:** Fable plans → small coding models execute one chunk each → Fable audits, splices, parse-gates, rebalances. Executors NEVER edit `civil_war_generals.html` directly; they write bare JS to `chunks/out/CHUNK-XX.js`. Fable integrates in dependency order at the `/*__ENGINE7__*/` marker and owns every merge.

**Executor rules (apply to every chunk):**
1. Output = ONE file, pure JavaScript, no `<script>` tags, no markdown fences, no HTML, no CSS.
2. Open with a banner comment: `/* ==== §N — NAME (CHUNK-XX) ==== */`.
3. Vanilla ES2020. No libraries, no imports, no fetch, no async unless the contract says so. Strict-mode compatible (file runs inside an existing `"use strict"` script).
4. NEVER redefine anything that exists: functions, consts, globals. The source is canonical — read it first. If the contract conflicts with the source, the SOURCE wins; note the conflict in your final report instead of "fixing" engine code.
5. Use ONLY whitelisted DOM ids/classes (per chunk below). Inventing an id = automatic audit failure.
6. `localStorage` is allowed ONLY in CHUNK-07, always inside try/catch.
7. No TODOs, no placeholders, no stubs. Ship working code. Stay within the size budget.
8. End your run by reporting: what you defined, any contract ambiguities, any engine bugs noticed (report only — do not fix).

**Read-first list for every executor:** this file (your chunk's section), then `civil_war_generals.html` — at minimum §2 state, §5 runtime, §6 combat, §8 input, plus whatever your contract flags.

**Audit gates (Fable, per chunk):** contract grep (no redefinitions; DOM whitelist; banned APIs) → splice into working copy → extract `<script>` → `node --check` parse gate → chunk-specific functional greps (listed per chunk) → cumulative integration review. Full checklist in `AUDIT-PROTOCOL.md`.

**Waves:** W1 = C1, C2, C3 (parallel). W2 = C4, C5 (parallel after W1 integrates). W3 = C6, C7 (after C5). W4 = C8 (after all), then C9 Fable playtest-fix pass. W5 = C10, C11 (loot/boost cards — still v1.0). Don't start a wave until the prior wave passed audit.

---

## Engine facts every chunk relies on (verified against source)

- Global `G`: `mode("menu"/"battle"/"upgrade"/"result"), settings{diff,render,sound,tutDone}, cam, campaign, battle, sel, order, reach(Map), fireT/chargeT(Set), hover, anim[], tut`.
- `G.battle` (`B`): `bd, M{GW,GH,map,key(c,r),objs[],naval}, units[], turn, maxTurns, wx, playerSide, enemySide, atkSide, log[], over, casualties{US,CS}, infl{US,CS}, vis(Set), suppliedSide, phase, fromCampaign, _start0`.
- Unit `u`: `id, side, type(inf/cav/art/nav/fort/hq), weapon, strength, maxStr, morale, maxMor, xp(0-5), c, r, mp, moved, fired, done, ent(0-3), leader{name,trait,radius,cmd,alive}|null, routed, alive, spotted, ammo, maxAmmo, name, kills, supplied, vetId, vetName`.
- Existing callables: `logMsg` ❌(C1 defines), `refreshUI` ❌(C1), `toast` ❌(C1), `playSfx` ❌(C2), `runAI` ❌(C3), `endBattle` ❌(C4) — everything else EXISTS: `unitAt(c,r), tileAt(c,r), enemyOf(side), combatUnits(side), alive(side), reachable(u)→Map("c,r"→cost), doMove(u,c,r), fireTargets(u)→Set, chargeTargets(u)→Set, resolveFire(u,c,r), resolveCharge(u,c,r), moraleCheck, retreatHex, killUnit, checkVictory, resolveByScore, sideScore, startStrength, curStrength, beginTurn(side,isPlayer), endPlayerTurn, computeVisibility, computeSupply, updateObjOwners, stepWeather, startBattleRuntime(bd,playerSide,fromCampaign), genMap, genForce, nameForce, unitLabel(u), nearLeaderBonus(u), leaderlessPenalty(side), draw, drawMini, fitCamera, resize, flash(c,r,type), clearSelection, setSel, setOrder, onHexClick, selectNextUnit, centerOn, hexDist([c,r],[c,r]), neighbors(c,r), clamp, rint, pick, chance, mulberry, hashStr`.
- Data tables: `TERRAIN, WEAPONS{rng,pow,era,cost,arm}, TRAITS, GEN_NAMES, BATTLES(84: id,name,year,th,atk,us,cs,feat,obj,wx,nav,res,cmdUS,cmdCS), CHAINS{US[],CS[]}, DIFF[4]{name,fog,aiAgg,supply,casMult,skill}, RENDER_NAMES, WX, WX_TRANS, MAXAMMO, ARM, SHIP_NAMES`.
- **Trap:** `doMove(u,c,r)` validates against the GLOBAL `G.reach`. AI must set `G.reach = reachable(u)` before each `doMove`, and set `G.reach = null` when done.
- **Trap:** `endPlayerTurn()` already calls `beginTurn("enemy",false)` then `runAI(cb)`; the `cb` increments `B.turn`, checks `maxTurns→resolveByScore()`, then `beginTurn("player",true)`. C3 must call `cb()` exactly once on EVERY path.
- **Trap:** `checkVictory()` (called inside combat resolution) invokes `endBattle(...)` and sets `B.over`. AI must re-check `B.over` before every action and inside every timeout.
- DOM ids (the ONLY ones that exist): `#stage #map #minicv #mini #topbar #tbBattle #tbYear #tbWx #tbSide #btnMenu #objbar #objList #info #ufFlag #ufName #ufRole #ufBody #orders #obMove #obFire #obCharge #obEntrench #obDone #log #logBody #turnstrip #tsTurn #tsMax #btnEndTurn #toast #coach #overlay #sheetPad`. Overlay pattern: fill `#sheetPad` HTML, toggle `.hidden` on `#overlay`. CSS classes ready for: menus (`menu-grid mbtn ic us/cs/pick/load/set t d`), picker (`tabs tab on blist brow bn bmeta byr bth tagn`), settings (`setrow sl sd seg on`), upgrade (`fundbar coin regtable upg xp off`), result (`verdict win/lose/draw benchbox hi castable c big lb`), shared (`title-xl title-sub rule lede btn-row bigbtn ghostbtn hint hidden`).

---

## CHUNK-01 — §9 UI CORE (`chunks/out/CHUNK-01.js`) — ~120–180 lines

Mission: the five UI helpers everything else calls.
DEFINE exactly: 
- `logMsg(msg, cls)` — prepend-or-append a `div.e` (+cls among `hit/rout/sys/""`) to `#logBody`; newest visible (append + scroll to bottom); cap stored nodes at 80; also push to `G.battle.log` when a battle exists.
- `toast(msg, ms=1900)` — set `#toast` text, add `.show`, clear prior timer, remove after `ms`.
- `showHud()` / `hideHud()` — toggle `.hidden` on `#topbar #objbar #info #orders #log #mini #turnstrip` (showHud hides `#info` until a unit is selected — refreshUI manages it).
- `refreshUI()` — no-op unless `G.battle`. Update: `#tbBattle`=bd.name, `#tbYear`=bd.year, `#tbWx`=`WX[B.wx].ico+" "+WX[B.wx].name`, `#tbSide` text/class per `B.playerSide`; `#tsTurn/#tsMax`; objectives list into `#objList` (one `.ob` per `B.M.objs`: dot class `held-US/held-CS/held-0`, label `"Objective ★val"` + terrain name); unit info panel: if `G.sel` show `#info` (flag bg union/reb, `#ufName`=unitLabel, `#ufRole`=ARM name + weapon name, `#ufBody` = bars for strength/morale/ammo using existing `.stat/.bar/.fill-*` markup + kv rows: XP pips, entrench, supplied Yes/No, leader badge if `u.leader`), else hide `#info`; order buttons: disable per state (`obMove` if mp<=0/done/routed/fort; `obFire` if fired/done/ammo<=0/no weapon; `obCharge` if done or type in art/nav/fort; `obEntrench` if done or type in cav/nav/hq or ent>=3; `obDone` if done) — disabled = `disabled` attr; highlight active `G.order` button via inline style border.
- `coachShow(steps)` / `coachNext()` / `coachEnd()` — minimal coachmark walker over `#coach` (title, body, Next/Done button, step i/n), fixed position near center-bottom; used by C8 tutorial; gate nothing here.
MAY call: existing engine reads only. MUST NOT: touch canvas, call draw(), define sounds, campaign, or menus. DOM whitelist: all ids above. 
Audit greps: no `draw(` calls; only whitelisted ids; `refreshUI` guards `!G.battle`.

## CHUNK-02 — §10 SOUND (`chunks/out/CHUNK-02.js`) — ~90–140 lines

Mission: synthesized Web Audio SFX + ambient. No files.
DEFINE: `playSfx(name)` for `volley`(white-noise burst 0.18s bandpassed ~1.8kHz), `cannon`(low sine+noise thump 0.5s, ~70Hz), `march`(two soft ticks), `charge`(rising triad + noise swell 0.7s), `rout`(falling tone 0.6s), `bugle`(three-note call, square-ish, quiet), `click`(10ms tick for UI); `ambientStart()`/`ambientStop()` — very quiet looping filtered brown-noise bed (wind) via Scriptless nodes (looped buffer), gain ~0.05.
Rules: lazy-init a single shared `AudioContext` (`window.AudioContext||window.webkitAudioContext`) on first call; if `ctx.state==="suspended"` call `resume()` (Safari gesture policy — first call will come from a click); every voice built from oscillators/buffers + gain envelopes; hard-cap concurrent voices at 8 (drop oldest); ALL functions no-op silently when `!G.settings.sound` (ambient additionally stops); total runtime per sfx < 1s; wrap body in try/catch (audio must never crash the game).
MUST NOT: external URLs, `<audio>`, autoplay on load, touching G beyond reading `G.settings.sound`. 
Audit greps: `webkitAudioContext` fallback present; `G.settings.sound` gate present; try/catch present; no `new Audio`.

## CHUNK-03 — §11 AI (`chunks/out/CHUNK-03.js`) — ~150–220 lines

Mission: `runAI(cb)` — the enemy phase. Competent, readable, never hangs.
Behavior: collect `B.units` where `side===B.enemySide && alive`. Order: artillery/nav first (fire from range), then infantry, cavalry, hq last. Process one unit per tick via `setTimeout(step, 150)` chain (readability + lets canvas update); EVERY tick starts: `if(G.battle!==B || B.over){ cb(); return; }` (guard once — make sure cb fires exactly once total; use a `done` flag).
Per unit policy (scaled by `DIFF[G.settings.diff]`, `A=aiAgg, S=skill`):
- routed → `retreatHex(u)`, continue.
- hq → stay/move toward friendly combat-unit centroid, never adjacent to enemy if avoidable.
- If `fireTargets(u)` nonempty → pick best target: lowest `strength*TERRAIN def` weighted by `chance(S)` (else random) → `resolveFire(u,tc,tr)`.
- Else if `chargeTargets(u)` nonempty AND estimated ratio favorable (`u.strength*ARM[u.type].melee*(u.morale/u.maxMor)` vs `tgt.strength*ARM def*terrain def*(1+ent*0.3)`) > (1.25 − 0.35*A) → `resolveCharge`.
- Else move: `G.reach = reachable(u)`; choose reach hex minimizing `hexDist` to goal, where goal = nearest objective not owned by `B.enemySide` (attacker mindset when `B.atkSide===B.enemySide`) else nearest visible-to-AI player unit (AI sees all — fog is player-only) else hold; tie-break prefer terrain `def`; `doMove(u, c, r)`; then `G.reach=null`; after moving, if now `fireTargets` nonempty and `!u.fired` → fire (same selection).
- Defensive posture (defender + not aggressive roll): units already on objective/fort hexes with enemies >2 hexes away hold ground; `chance(0.5)` entrench: `u.ent=Math.min(3,u.ent+1); u.done=true`.
- Mark `u.done=true` when finished.
After last unit: a single final `setTimeout(()=>{ if(!fired){fired=true; cb();} }, 200)`. `refreshUI(); draw();` after each action (they exist by integration time; still guard `typeof draw==="function"`).
MUST NOT: define helper names that exist; touch player units; modify `B.turn` (cb's job); call `endPlayerTurn`.
Audit greps: exactly-one-cb pattern (`done`/`fired` flag), `G.reach = reachable` + `G.reach=null` pairing, `B.over` guard inside the timeout loop, no `while(true)`.

## CHUNK-04 — §12 RESULT (`chunks/out/CHUNK-04.js`) — ~110–160 lines

Mission: `endBattle(side, type)` + result overlay.
Behavior: set `B.over=true; G.mode="result"; clearSelection(); hideHud();` Verdict mapping (player perspective `win = side===B.playerSide`): `decisive`→"Decisive Victory"/"Decisive Defeat", `win`→"Victory"/"Defeat", `objwin`→"Objectives Carried", `objloss`→"Objectives Lost", `draw`(side null)→"Drawn Battle". Build into `#sheetPad` using existing CSS: `.verdict` (+`win/lose/draw` class), battle name/year sub, `.castable` casualty columns (yours vs enemy, from `B.casualties` keyed by side), inflicted line, `.benchbox`: italic `bd.res` quote + one comparative line — compute player casualty % vs enemy % and print e.g. "History: <res>. Your field: inflicted N (X%), suffered M (Y%) — better/worse exchange than the day deserved." Buttons (`.btn-row`): campaign → `bigbtn` "Continue Campaign" calling `campaignAdvance(side,type)` (exists after C5; guard `typeof`==="function" else back to menu); free battle → "Replay Battle" (`startBattleRuntime(B.bd, B.playerSide, false)` + hide overlay + showHud) and "Main Menu" (`ghostbtn`, calls `openMainMenu()` if defined else just overlay text fallback). Iron-rule hook: if `G.campaign && G.campaign.iron && !win` → no replay path (Continue only; C5 handles recovery). `playSfx(win?"bugle":"rout")`.
Also DEFINE small shared helpers used later: `openSheet(html)` (fill #sheetPad, unhide #overlay) and `closeSheet()`.
MUST NOT: modify roster/funds (C5's job); assume campaign exists.
Audit greps: `B.over=true` set; `openSheet/closeSheet` defined once; guards on `campaignAdvance`/`openMainMenu`.

## CHUNK-05 — §13 CAMPAIGN (`chunks/out/CHUNK-05.js`) — ~140–200 lines

Mission: campaign lifecycle.
DEFINE:
- `startCampaign(side, iron)` — `G.campaign={side, iron:!!iron, idx:0, funds:300, recovery:false, completed:[], roster:[], nextId:1}`; roster = 8 inf, 2 art, 2 cav entries `{id:"R"+nextId++, type, weapon:defaultFor(type,1861,side), xp:0, name:null}` (use `infWeapon/artWeapon/cavWeapon` with year of first chain battle); then `launchCampaignBattle()`.
- `launchCampaignBattle()` — `bd = BATTLES.find(b=>b.id===CHAINS[side][idx])`; closeSheet, showHud, `startBattleRuntime(bd, side, true)`.
- `campaignAdvance(winnerSide, type)` — reconcile roster from `B.units` (match `u.vetId`): dead → remove; survivors → `xp=Math.min(5,xp+1+(u.kills>=2?1:0))`, carry `weapon`, set `name=u.name`; units without vetId that survived and were player side → append as new roster entries (they were auto-generated fill). Funds award: decisive 500, win/objwin 350, draw 200, loss/objloss 120; + `Math.round(B.infl[player]/40)` efficiency bonus. Win path: `completed.push(bd.id)`, `recovery=false`, `idx++`; if `idx>=CHAINS[side].length` → `warWonScreen()` (simple openSheet verdict: war summary — battles won, total inflicted/suffered, Muster Roll count placeholder). Loss path: `recovery=true` (do NOT advance idx) — recovery battle = same bd with roles flipped feel: store `G.campaign.recoveryMode=true`; relaunch same battle with player as DEFENDER if player was attacker (pass same bd — `startBattleRuntime` uses `bd.atk`; flip by temporarily setting a `G.campaign.flipAtk=true` consumed in `launchCampaignBattle` → if set, clone bd object with `atk` flipped before passing; never mutate BATTLES). Win the recovery → normal advance. Lose recovery → funds 80, try again (no death spiral: third+ consecutive loss adds +150 relief funds, log it).
- After reconcile: `openUpgrade()` if defined (C6) else `launchCampaignBattle()` directly.
- `defaultFor(type,year,side)` helper local.
MUST NOT: build UI beyond warWonScreen sheet; touch localStorage.
Audit greps: BATTLES never mutated (clone on flip); idx bounds checked; roster ids unique.

## CHUNK-06 — §14 UPGRADE (`chunks/out/CHUNK-06.js`) — ~150–210 lines

Mission: between-battle quartermaster screen.
DEFINE `openUpgrade()` — `G.mode="upgrade"; hideHud();` next `bd` = upcoming chain battle (recovery-aware). openSheet with: title "Winter Quarters" sub "Quartermaster & Muster — before <bd.name>, <bd.year>"; `.fundbar` funds `.coin "$"+funds`; `.regtable` — one row per roster entry: name (or "<ord> <Arm>" placeholder), type, XP pips (`.xp`/`.xp.off` ×5), current weapon name, upgrade cell: next-tier weapon for that arm with `WEAPONS[w].era<=bd.year` sorted by pow — button `.upg` "$cost → Name" (disabled if `funds<cost`), click = deduct, set roster.weapon, re-render; Recruit row buttons: "+Infantry $200 / +Cavalry $260 / +Battery $300" (append roster entry, weapon = defaultFor(type, bd.year)); cap roster 16 (toast if full); "Take the Field" `bigbtn` → `launchCampaignBattle()`; "Save & Menu" `ghostbtn` → `saveLocal&&saveLocal(); openMainMenu&&openMainMenu()`.
Buy logic shared helper `nextWeaponsFor(type, year)` (exported for C10 reuse). Funds floor 0 enforced.
MUST NOT: localStorage directly (call `saveLocal` if defined); cards/rarity (C10).
Audit greps: era gate present; funds can't go negative; re-render after every purchase.

## CHUNK-07 — §15 SAVE/LOAD (`chunks/out/CHUNK-07.js`) — ~100–150 lines

Mission: persistence. Between-battle saves only (no mid-battle state in v1).
DEFINE: `serializeSave()` → `{ver:1, when:Date.now(), settings:G.settings, campaign:G.campaign}` (null campaign fine); `saveLocal()` try/catch `localStorage.setItem("gor_save", JSON.stringify(...))`, toast on success/quiet on fail (file:// may block); `loadLocal()` try/catch get/parse/validate `ver===1` → returns object or null; `applySave(sv)` — `G.settings=Object.assign(G.settings, sv.settings); G.campaign=sv.campaign||null;`; `exportSave()` — Blob + temp `<a download="generals_of_the_republic_save.json">` click + revoke; `importSave(onDone)` — temp `<input type=file accept=.json>` change → read → parse → validate → `applySave` → `onDone(true|false)`; `hasSave()`.
Auto-save hooks: NONE here — C5/C6/C8 call `saveLocal()` at: campaignAdvance end, upgrade purchases, settings change. (Document; do not monkey-patch.)
MUST NOT: serialize `G.battle` (cyclic-ish, big); silent throw.
Audit greps: every localStorage touch inside try/catch; `ver` check; no battle serialization.

## CHUNK-08 — §16 MENUS & BOOT (`chunks/out/CHUNK-08.js`) — ~180–250 lines

Mission: everything the player touches outside battle. Last chunk — wires all.
DEFINE:
- `openMainMenu()` — `G.mode="menu"; hideHud();` openSheet: title "GENERALS OF THE REPUBLIC", sub "A War Saga — Vol. I: The Civil War"; `.menu-grid` mbtns: Continue (only if `hasSave()` and campaign — resumes to `openUpgrade()`), New Campaign — Union (`ic us` ★), New Campaign — Confederate (`ic cs` ✪) [each → muster choice sheet: Iron vs Standard, two bigbtn/ghostbtn → `startCampaign(side, iron)`], Free Battle (`ic pick`) → `openPicker()`, Load from File (`ic load`) → `importSave(ok=>{ok?toast("Save loaded"):toast("Import failed"); openMainMenu();})`, Settings (`ic set`) → `openSettings()`. Footer hint line.
- `openPicker()` — tabs All/E/W/TM/N (+ back); `.blist` rows from BATTLES filtered: `.bn` name + `tagn "NAVAL"` if nav, `.bmeta` `cmdUS vs cmdCS`, `.byr` year, `.bth` theater; click → side-choice mini-sheet (Union/Confederate buttons) → closeSheet, showHud, `startBattleRuntime(bd, side, false)`.
- `openSettings()` — setrows: Difficulty seg from DIFF names; Map Style seg from RENDER_NAMES; Sound seg On/Off (toggles + `ambientStart/Stop`); Export Save button (`exportSave`); rows write `G.settings`, `saveLocal()`, re-render seg `.on`; Back → main menu. Settings changes while in battle: also `draw()`.
- `init()` — wire `#btnEndTurn`→`endPlayerTurn` (guard mode/over), `#btnMenu`→ confirm-ish sheet (Resume / Abandon to Menu), order buttons: `#obMove/#obFire/#obCharge`→`setOrder("move"/"fire"/"charge")`, `#obEntrench`→ if sel valid `{sel.ent=Math.min(3,sel.ent+1); sel.done=true; playSfx("march"); clearSelection(); refreshUI(); draw();}`, `#obDone`→`{sel.done=true; clearSelection(); selectNextUnit();}` (all guarded on `G.sel` + playerSide + mode==="battle"); `resize()`; `const sv=loadLocal(); if(sv) applySave(sv);` `openMainMenu()`. Tutorial: in `startBattleRuntime` aftermath C8 may NOT patch engine — instead `launchCampaignBattle`/picker paths call `maybeTutorial()` after starting first battle: if `!G.settings.tutDone` run `coachShow` 5 steps (select unit → March → Fire → End Turn → objectives), set `tutDone`, `saveLocal()`.
- Last line: `init();`
MUST NOT: redefine startCampaign etc. — call them; no new ids.
Audit greps: `init()` invoked once at EOF; every wired id exists; guards on every battle-control handler.

## CHUNK-09 — Fable integration/playtest pass (no executor)
Splice order C1→C8, parse gate, then Safari playtest by Aaron + Fable fix list. Exit = full loop: menu → campaign → battle → AI → result → upgrade → next battle → save → reload → continue. Tag release `v1.0-core`.

## CHUNK-10 — §17 LOOT CARDS (post-loop, still v1.0) — weapon rarity tiers (Surplus/Standard/Fine/Presentation/Legendary), manufacturer brands + quirks, procedural rolls within type, capture-on-rout hook in `killUnit`/rout path (player side only gains), weapon-card render in upgrade screen + unit info. Contract drafted by Fable AFTER C9 (needs live balance numbers).
## CHUNK-11 — §18 RATINGS CARDS — regiment OVR (Firepower/Discipline/Mobility/Élan/Stamina derived from stats+xp+weapon), dev traits N/S/SS/XF with winter-camp pops, X-Factor procs for storied units. Contract after C9.

---

## G-WAVE CONTRACTS (graphics overhaul — locked rounds 39–46; supersedes "Executor rule 4" ONLY as stated in the override pattern below)

**Override-by-append pattern (ALL G-chunks):** chunks splice before the `/*__ENGINE_END__*/` marker; a LATER `function draw(){...}` declaration legally supersedes the earlier one (JS hoisting) — so REDECLARE the functions your contract names (and ONLY those) instead of editing old code. NEVER redeclare a `const`/`let` (a second `const TCOL` = instant parse error) — new data tables get NEW names. Old code remains as dead fallback; intentional.

**Locked art direction (no deviation):** sunlit painterly battlefield — warm daylight, green-gold fields, drama from shadow not gloom; surrounding UI stays dark map-room. Subtle AXONOMETRIC TILT: terrain drawn with vertical squash ~0.86 + per-elevation y-offset (≈ elev × −7px at zoom 1) + soft SE drop shadows on raised hexes; units upright billboards; hex picking and grid math UNCHANGED (`pixelToColrow` untouched — tilt is paint-only). Sprite theater 20+ figures/regiment with LOD (full at zoom ≥0.9; ~10 figures 0.55–0.9; massed block + flag below 0.55; `G.lodBias` 0–2 steps tiers down when frames run >22ms for 30 consecutive frames). Smoke = transient puffs ONLY (≤1.4s, no accumulation). Reduced-motion: every animation honors `G.settings.reduceMotion` (collapse to instant/static).

**Cross-chunk seams (typeof-guarded so chunks land independently):** G1's `draw()` calls `drawUnitSprite(u,sx,sy,rad,skin)` if defined (G2's; else falls back to legacy `drawUnit`), then `drawFX()` if defined (G3's), then `drawMini()` (G4 redeclares it). `PALETTE` (G1's) read by others via typeof with fallback to old `TCOL`. `portraitFor` (G6) used only if defined. Fable wires all engine-side call sites post-merge — executors do NOT touch engine internals.

### G1 — §17 TERRAIN & LIGHT (`chunks/out/G1.js`) ~400–550 lines
Redeclare `draw()`. Define `PALETTE` (3 skins × all 13 TERRAIN keys; skin 0 sunlit painterly: clear≈#d9cf9e, field≈#cfc17f, woods #6e8f52 canopy over #9eb077 floor, hills #d2b97f, ridge #c4a76a, river #5d93b8, ford lighter, town warm stone, road dust, swamp #8d9a6b, fort earth, water/shoal naval blues — tune for AA-readability of units on top). Per-hex paint: tilt transform (squash 0.86, elev y-offset, SE shadow gradient under hills/ridge), pre-rendered seeded grain pattern tile (offscreen, NEVER per-frame random), woods = 3–6 canopy blobs w/ dark rims, river = banded water + bank lip + ford stones, town = 2–4 tiny gabled buildings (roof face visible per tilt), fort = earthwork ridges, road = double wheel-ruts, swamp = reed ticks. Micro-dressing seeded per battle: snake-rail fences along field edges, stone walls on ridge lines, orchard rows, farmstead, church + steeple, small graveyard. Define `FAMOUS_FEATURES` = {battleId:[{near:"terrainTag-or-objIndex", label}]} for ≥10 marquee battles (Antietam: The Cornfield, Dunker Church, Burnside's Bridge, Sunken Road; Gettysburg: Peach Orchard, Little Round Top, Cemetery Ridge, Devil's Den; Shiloh: Hornet's Nest, Pittsburg Landing, Bloody Pond; Fredericksburg: Marye's Heights, Stone Wall; etc.) — resolve to plausible hexes from the generated map's features (ford→bridge label, ridge→heights, field→cornfield); paint as small period-hand labels w/ leader lines. Map furniture: compass rose, scale bar, parchment battle-name cartouche (name + year). MANDATORY perf: render full terrain ONCE per (battle, zoom-bucket, fog-state, obj-owner-state) to an offscreen canvas; per-frame = blit + dynamic layers only. Preserve from old draw (copy + restyle): fog veil (cool blue-grey soft wash, not black), objective flags, reach overlay, fire/charge reticles, selection/hover rings. Audit greps: `PALETTE` defined / `TCOL` NOT redeclared; offscreen cache (`createElement("canvas")`) present; no `Math.random` in the draw path; typeof guards for drawUnitSprite/drawFX.

### G2 — §18 SPRITE THEATER (`chunks/out/G2.js`) ~450–600 lines
Define `drawUnitSprite(u, sx, sy, rad, skin)` — do NOT redeclare `drawUnit` or `draw`. Vector figures only (no images): infantry ≈9–13px tall at zoom 1 — kepi, coat (Union #2b4d7e, CS butternut #8a7d66), trousers, musket stroke; per-figure seeded jitter (±1px stance, shade) so ranks read human. Formations: inf = two ranks ≤11 wide (20+ total) behind the colors; cav = two staggered rows mounted (horse silhouette + rider); art = 2–3 guns w/ 3 crew each; nav = hull + casemate/stack + wake; fort = parapet + gun + crew; hq = mounted officer + standard bearer w/ oversized flag. Colors: national + regimental on staff, 2-segment sine ripple, honor ticks when xp≥2. LOD per art direction + `G.lodBias`. Strength thins figure count proportionally (floor 4 before block mode); routed = scattered fleeing poses + dropped colors; acted = alpha 0.82; ent>0 = spadework ridge before front rank; ammo 0 = distinct held-fire pose tint. Keep morale/ammo/xp badges compact above formation. Idle motion (flag ripple, 1px breathe) only when battle active AND !reduceMotion — set `G.spriteAnim=true` and rely on G3's loop (typeof-guard: static if absent). G1 owns rings/overlays — draw ONLY the unit body. MANDATORY perf: pre-render each (type×side×LOD×pose-bucket) to an offscreen sprite, Map cache ≤64, blit; expose `spriteBudgetCheck(dt)` implementing the 22ms/30-frame lodBias step. Audit greps: sprite cache Map present; lodBias honored; no redeclaration of draw/drawUnit; no Math.random (seeded only).

### G3 — §19 FX, SPEED, CAMERA, LOOP (`chunks/out/G3.js`) ~300–420 lines
Define `emitFX(type,c,r,data)` + `drawFX()` rendering `G.fx[]`: muzzle flash (2-frame star), smoke puff (3–5 grey-white circles drifting downwind, fade ≤1.4s, TRANSIENT), melee dust, floating casualty numbers ("−142", period serif, rise 14px, fade ≤1.1s; reduceMotion → skip, log carries it). Redeclare `flash(c,r,type)` as a thin wrapper into emitFX (signature preserved — engine call sites keep working). Loop: install ONE continuous rAF driver (guard `window.__gorLoop`), active in battle mode only, 30fps idle throttle / 60 when `G.fx.length||G.spriteAnim`, calling `draw()`; neutralize the old anim-only loop's double-draw (leave `G.anim` array supported but empty-migrated). Speed: `G.speed∈{1,2,4}` default 1 + a small segmented control inserted into `#turnstrip` before the End-Turn button (dynamic id stSpeed); all FX durations ÷ G.speed; expose `aiDelay()=Math.max(40,150/G.speed)` (Fable wires into runAI). Camera: `glideTo(c,r,ms)` eased (instant under reduceMotion); `followAction(u)` = glide when u offscreen >30% and `G.settings.follow!==false`. Audit greps: single-driver guard present; reduceMotion in fxNum+glideTo; flash wrapper keeps 3-arg signature; no engine edits; speed control inserted idempotently.

### G4 — §20 UI POLISH + MINIMAP (`chunks/out/G4.js`) ~200–300 lines
One injected `<style>` (guarded, single): typography (letterspaced small-caps labels, heading polish), engraved double-border panel frames (layered box-shadows), button hover lift + brass `:focus-visible` outlines (a11y), scrollbar polish — UI stays dark map-room; NO battlefield/canvas CSS. Redeclare `drawMini()`: PALETTE-based terrain (typeof fallback TCOL), fog wash, objective dots, unit dots (2px ring on spotted enemies), and the MISSING viewport rectangle (project screen corners→map fraction, clamp, 1px parchment strokeRect — fixes the known dead code). Order buttons: prepend small inline data-URI SVG icons (march arrow, fire burst, sabre, spade, halt) keeping text labels. Comments must state contrast ratios for changed colors (target AA on panel bg). Audit greps: style-injection guard; strokeRect in drawMini; icons additive (labels intact).

### G5 — §21 NEWSPAPER MENU (`chunks/out/G5.js`) ~250–350 lines
Redeclare `openMainMenu()` rendering the locked side-specific broadsheet into `#sheetPad` (DOM/CSS only): masthead by last campaign side (US default — "THE UNION STANDARD" / CS "THE RICHMOND DISPATCH"), advancing dateline, rules, 3-column front page where headlines ARE the mode buttons (real `<button>` elements styled as headlines, keyboard-focusable, aria-labels, AA contrast on parchment): Continue ("GEN. RETURNS TO THE FIELD" — only under the EXACT same hasSave/campaign gating as C8's version — read it first), New Campaign Union/Confederate → `_openMusterChoice(side)`, Free Battle → `openPicker()`, Load → `importSave(...)` same callback shape, Settings → `openSettings()` as a NOTICES classifieds box; woodcut art slot = inline hatched SVG (crossed flags/eagle). Every C8 behavior preserved by CALLING the existing functions — zero behavior loss. Audit greps: all five-plus actions reachable; Continue gating intact; `<button>` elements; no canvas.

### G6 — §22 PORTRAIT ENGRAVINGS (`chunks/out/G6.js`) ~250–350 lines
Define `portraitFor(name, side, opts={})` → cached dataURL (Map ≤96): 96×120 offscreen engraving bust seeded by `hashStr(name+side)` — face oval w/ 3-pass directional hatching, 5 hair × 6 beard period styles, uniform collar/shoulder boards by side (+stars when opts.cmd), fine cross-hatch ground, oval vignette + brass border, engraved nameplate when opts.named; sepia ink on parchment; deterministic forever (NO Math.random). `opts.tintype` variant (darker plate, soft vignette) for the player's line. Wiring (additive DOM only): a guarded MutationObserver on `#ufBody` inserts the portrait into `.lead-badge` when a leader is shown (no self-trigger loops, check for existing img). Audit greps: determinism (no Math.random); cache cap; observer guard; dataURLs only.

### Fable post-merge patch list (mine, after splice, before parse gate)
1. runAI stagger → `(typeof aiDelay==="function"?aiDelay():150)` at both timeout sites. 2. resolveFire after `flash(tc,tr,"fire")`: `if(typeof emitFX==="function"){emitFX("smoke",tc,tr);emitFX("num",tc,tr,{n:cas});}` + return-volley num at attacker hex; resolveCharge: dust + both nums. 3. runAI unit-processing start: `if(typeof followAction==="function") followAction(u);`. 4. `G.settings` literal gains `reduceMotion:false, follow:true, speed:1`-adjacent fields (speed lives on G). 5. Single-rAF verification (no double draw). 6. Parse gate + jsdom smoke; screenshots = Aaron's eyeball gate next session.

## Risk register (why the audit gates exist)
Small-model failure modes seen in the wild: redefining `clamp/pick/toast`; inventing `#sidebar`-style ids; `cb()` never firing (AI hang) or firing twice (turn skip); `doMove` without setting `G.reach`; localStorage outside try/catch crashing `file://`; markdown fences left in output; "improving" engine code mid-chunk; infinite AI loops when no path exists. Every one has a named grep above.
