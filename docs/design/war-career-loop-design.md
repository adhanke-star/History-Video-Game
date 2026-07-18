# War Career Loop — Runtime Contract (D399)

**Status:** D407 Slice D SHIPPED. D405's dual-reference receipt prerequisite and D404's source-vs-
timeline law remain intact; D406 adds ledger-derived advancement, journey-owned billets, pure
field/general authority selectors, and one bounded command projection, while D407 adds only bounded
source-honest high-command relationship memory under Your Timeline. Slice E late-war political pull
is the next separate take. No save-version, combat, political-engine, data, or tactical-producer
change belongs to D407. The D404 CONTRACTED planning boundary remains the receipt law, and the original scope law
remains exact: No runtime, save-version, generated-game, or political-engine change belongs to D399.
**Lane:** `COORDINATION.md` LANE-005.
**Decision law:** D382 item 4, D360, D151, D119, D105, D94, D74, D92, D35, D146,
E41, E50, and E71 fixed in D400.
**Product sentence:** one person enters the war at soldier or junior-officer scale, earns wider
responsibility through distinct resolved results, carries a remembered human network across roles,
and either reaches the war's end or leaves a comrade to carry that memory forward.

The contract deliberately extends the shipped game by small adapters. It does not revive the retired
S3-S5 grand-strategy monolith, replace the battle ladder, or turn alternate history into historical
fact.

---

## 1 · Live overlap inventory

The runtime inventory was read from the D398 release boundary. Copy and UI promises were treated as
claims until a matching state transition was found.

| Domain | Live owner / symbols | What is reusable | Collision or missing law |
|---|---|---|---|
| Active personal journey | `src/37-loot-survival.js`: `lootInit`, `_ssCleanJourney`, `ssStartJourney`, `ssJourneyOnResolve` | One saveable active person, identity snapshot, status, battle log, promotion count, AAR output | Status rejects death; history is capped; every campaign battle is credited without participation; starting a journey forces survival |
| Army Register | `ssPersonRegistry`, `ssFindPerson`, `_ssUnitSpecs` | Stable selection catalog, provenance, team hierarchy, sourced replacement overlay | Rebuilt catalog is not mutable survival truth; generated representatives are inferred; duplicate historical identities exist across namespaces |
| Ratings / tactical people | `src/tactical/T14-ratings.js`: `fldPersonTeam`, `fldMaterializePerson`, `fldPromotePerson`, `fldBrigadeMuster` | Pure person materialization, hierarchy, rank/rating transform | Tactical muster is transient; rank is not role or billet |
| Tactical officer fate | `src/tactical/T3-officers.js` leader state and seeded fall/wound resolution | Explicit realtime officer casualty evidence | The result is transient and is not linked to the selected career person |
| Campaign transition | `build/base.html`: `campaignAdvance`; `src/tactical/T2-campaign-link.js` | Classic, Auto, and realtime converge on one result authority | Recovery retries can farm time, system ticks, and raw battle/win counters |
| T1 resolution bridge | `src/90-president-register.js`: `_t1InitAll`, `_t1Resolve` | One ordered post-battle subsystem transition; `lootOnResolve` already reaches the journey | Career consequence currently runs before the base loss/recovery branch; terminal handling is split |
| Campaign roster | `G.campaign.roster` and legacy `C.muster` | Persistent unit-level campaign and casualty summaries | These are `R#` unit namespaces, not person identities |
| High command | `src/35-command.js`: `P.command`, `cmdOnResolve`, `commandLeadership`, `cmdPromote`, `cmdAppoint` | Existing field-general appointments, seniority, capital, billets, and leadership projection | Reputation and promotions belong to NPC general ids; copying them into a player career would double-award and alias people |
| Political world | `src/10-president-state.js`, `31-cabinet.js`, `32-decisions.js`, `33-morale.js`, `34-press.js` | The world can keep ticking; existing resources, decisions, delegation, cabinet, morale, press, and capital are reusable | The game exposes presidential authority from turn 0; inaccessible decisions would accumulate without a deferral rule |
| Political presentation | `src/30-president-shell.js`, `99-h0-president-desk.js`, `101-h0-between-battle.js` | Existing readouts and action surfaces | Hiding one button is not a capability boundary; the H0 catalog, refresh dispatcher, interstitial, and mutating actions all require the same selector |
| After Action | `src/82-after-action.js` and `103-h0-after-action.js` | Pure report composition already embeds `ssJourneyReportHTML` | Final victory nulls `G.campaign` after rendering; any franchise record must be captured first |
| Save integrity | `serializeSave` / `applySave`, `src/91-save-slots.js`, `105-save-guard.js` | The full campaign is saved wholesale under `_SAVE_VER = 1`; named slots and tamper guards already exist | There is no migration layer or franchise/profile store |
| Ironman | `C.iron`, save-slot undo guard, menu copy | Existing mode flag and no-undo rule | E71: copy promises terminal defeat, but every loss enters recovery, saves, and opens upgrades |
| Relationships | no mutable player relationship owner | Press favor is a bounded-map pattern only | A player relationship graph is net-new; authored and emergent ties need different provenance |

### Identity namespaces that remain separate

1. `G.campaign.roster`: persistent generic `R#` campaign units.
2. Legacy `C.muster`: unit battle, kill, status, and fallen history.
3. Army Register: `ss:`, replacement, ratings-persona, and strategic-general catalog rows.
4. Tactical muster: transient `<unit-id>:cmd|nco|pvt` representatives.
5. Strategic command: general ids in `data/generals.json` and `P.command`.

No name-based join is legal. A later identity adapter must map explicit ids and state why the mapping is
safe. If no safe link exists, participation, personal fate, appointment, or comrade selection fails
closed.

---

## 2 · One canonical career

**Bind token:** CAREER_CANONICAL_OWNER:C.loot.journey

The shipped active journey becomes the sole mutable war-career record. This choice minimizes migration
of the live writers and readers; the wholesale campaign save envelope does not itself require this
path. Moving to a new `C.career` would be legal only as one atomic conversion of every writer and
projection, which is larger and riskier than the first slices. No `C.career`, `C.warCareer`, second
local-storage career record, or parallel command-career truth may exist.

Authority rules:

- `journey.person` is the current identity snapshot. The Army Register and ratings records are
  immutable catalogs used to materialize or verify it.
- `journey.lineage` is an ordered list of prior identities and hand-offs. It never makes two people
  active.
- `journey.events` is a bounded narrative ring; `journey.creditLedger` is the finite, keyed
  advancement truth. The old `career` and `log` arrays remain compatibility projections until every
  reader moves; they are not independent writable truth.
- `C.loot.people` remains a bounded derived roster/cache, never the owner of active reputation,
  relationships, rank, role, or life state.
- `P.command` remains authoritative for NPC command appointments. It may hold a reference to the
  active career person, never a copied player-career reputation or promotion ledger.
- Role and capability are pure selectors derived from the canonical person's rank, earned merit,
  service evidence, war date, life state, and current billet. They are not separately mutable flags.
- `ss*` functions remain compatibility adapters during migration. Player copy may say “War Career,”
  but an API rename cannot create another state path.
- `C.runId` is a technical campaign-lineage id used by terminal persistence and credit keys. It is not
  a person/career owner and is required even when an Ironman campaign has no active War Career.

### Lazy additive shape

The first career migration may add plain JSON-safe fields inside the existing journey:

`careerVersion`, `merit`, `reputation`, `eventOrdinal`, `events`, `creditLedger`,
`roleHistory`, `relationships`, `lineage`, `terminal`, and `currentBillet`.

`src/37-loot-survival.js` must carry compatibility marker
`WAR_CAREER_JOURNEY_ADAPTER_V1` and expand `_ssCleanJourney`; otherwise its current whitelist erases
every new field on init and every result. `ssJourneyOnResolve` becomes an adapter into the canonical
resolver/projections rather than a second promotion writer. Every career reader calls an idempotent
`warCareerInit(C)` first because `applySave` replaces `G.campaign` wholesale without rerunning module
initializers. Running init twice yields the same bytes after serialization. Missing fields receive
deterministic defaults; malformed entries are rejected or reduced to safe values; duplicate credit,
relationship, and lineage ids collapse deterministically. Legacy saves remain playable.

`careerVersion:1` is explicit War Career opt-in. Existing journeys without that marker remain the D360
legacy Journey behavior and are never silently converted, demoted, or allowed to unlock new career
roles. `ssStartJourney` remains available at any historical rank for that compatibility path.
`warCareerCanStart(pid)` and `warCareerStart(pid)` are separate Slice-A entry points: only Private
through Captain, matching campaign side, with a stable team anchor. An eligible legacy journey may be
copied into v1 only through an explicit one-time player choice; an ineligible high-rank journey stays
legacy.

The existing survival toggle is no longer an implicit definition of whether a career exists. Career
state and survival conditioning become separate selectors, while legacy enabled journeys retain their
shipped conditioning behavior until a dedicated compatibility probe proves the separation.

---

## 3 · Roles, billets, and advancement

Rank, role, and billet are distinct:

| Career band | Typical rank | Player responsibility | Capability |
|---|---|---|---|
| Rank and file | Private–Corporal | Survive, follow orders, preserve the unit | personal story and unit-ground readouts |
| Junior command | Sergeant–Captain | Lead company-scale people and accept local risk | local order and comrade decisions |
| Field command | Major–Colonel | Shape regimental/brigade action | bounded tactical command and appointment choices |
| General command | Brigadier–General | Direct formations and advise high command | explicit adapter into existing command/billet systems |
| Political-strategic overlay | earned late-war general/command role | advise or exercise bounded national authority | selected existing Desk capabilities; never a fictional rank |

The political-strategic overlay requires all of:

1. year 1864 or later;
2. a qualifying general-command role or explicitly sourced political billet;
3. earned reputation and at least one qualifying credit whose recorded event date is 1864 or later;
4. alive, present, and not captured;
5. a capability named by a shipped adapter.

Date alone never unlocks authority. The selector reads the recorded date on the latest qualifying
credit, not the live clock that `_t1Resolve` advances on recovery retries.

### Result and merit law

Every resolved observation receives a bounded narrative `eventId` from `C.runId` plus an
idempotently stored `eventOrdinal`. Advancement uses a different stable `creditKey` derived from
`C.runId`, side, campaign chain position, and canonical scenario. Every recovery attempt on the same
chain rung shares that key until the chain genuinely advances; save/load cannot mint another.
`events` retains at most 96 observations. `creditLedger` has at most one row per finite campaign rung.

The credit row may improve only to a strictly higher declared outcome class for that rung; totals are
recomputed from the ledger instead of incremented from button presses. A loss followed by an eventual
win can therefore become one winning credit, but repeated losses/wins cannot stack.

Merit can move only from declared facts: objective/result, role-appropriate losses and preservation,
explicit participation, and documented appointment/service events. It may never read or modify
casualty multipliers, winner selection, score, objective clocks, reinforcement timing, AI, morale
damage, or battle balance. At most one merit/promotion credit is granted per `creditKey`.

Slice A has no person↔unit participation authority. Its observations and credit rows are therefore
`qualifying:false` and move zero merit, reputation, promotion, or role access. Slice B may turn a row
qualifying only from explicit participation evidence. Legacy Journey promotion continues solely in
the legacy projection and cannot unlock War Career roles.

Promotion is deterministic and role-aware. A threshold creates eligibility, not an automatic
historical rewrite: the transition must pass service-window, identity, billet, and rank-sequence
guards. Real people keep their historical grade in source views; an alternate promotion is labeled
“Your Timeline.” Generated people remain Inferred. No victory, death, capture, or hand-off may improve
OVR merely because the state transition occurred.

---

## 4 · Life state, terminal results, and COMRADE HAND-OFF

Legal life states are `alive`, `wounded`, `captured`, `fallen`, `retired`, and `war-ended`.
Dead, captured, retired, and service-window-expired actors cannot command or exercise political
authority.

### Personal fate evidence

A personal fate is legal only when a stable person-to-participating-unit link exists for that result.
Realtime officer-fate output may be consumed only when the selected person id is explicitly linked to
that leader. Classic/Auto may consume a deterministic career-fate input only after the same
participation link exists. Aggregate player-side casualties alone may produce a clearly labeled
pressure or wound-risk narrative; it may not assert that a named person died.

Legacy journeys without a stable unit link may retain their shipped narrative entries and D360
promotion display, but they earn no War Career merit, reputation, or role access. A v1 career may log
nonqualifying observations in Slice A; personal fate and qualifying advancement remain disabled
fail-closed until Slice B establishes a participation link. This is preferable to inventing a casualty.

### One terminal dispatcher

E71 and career death share one source-owned terminal-result dispatcher. The first runtime marker is
`WAR_CAREER_RUNTIME_V1` in `src/106-war-career.js`, loaded after save wrappers. It installs one
assignment wrapper around the live `campaignAdvance(winnerSide, type)` reference; because
`src/91-save-slots.js` loads earlier, the captured nonterminal function still owns undo capture. The
assignment wrapper is not a manifest declaration override.

Before any write, the wrapper performs a pure classification from the live inputs:
`C && C.iron && B && B.fromCampaign && winnerSide !== null &&
winnerSide !== (B.playerSide || C.side)`. Draws are nonterminal. Free-battle result buttons are
nonterminal even while an Ironman campaign exists. The `type` string is never treated as player
outcome because realtime losses may legitimately pass `"win"` or `"decisive"` as the enemy's tier.

The dispatcher delegates every nonterminal call without a pre-delegation ordinal, result, or career
write. The earlier wrapper captures undo first; canonical nonterminal event commits happen later inside
the `_t1Resolve → lootOnResolve → ssJourneyOnResolve` seam. It short-circuits only a proved terminal
condition:

- the exact Ironman campaign-loss predicate above: campaign defeat is terminal, with no recovery,
  retry, live save, upgrade screen, stats/roster/system tick, funds/reputation/promotion reward, or
  undo snapshot;
- active-career `fallen` in optional career Ironman: the same terminal result path, with the same
  no-reward and no-recovery guarantees.
- normal-career `fallen`: no campaign terminal; enter COMRADE HAND-OFF.

Slice B must add a pure preflight fate classifier before delegation, based only on explicit
participation/fate evidence, then commit nonterminal fate in the post-undo resolution seam. Discovering
death inside the current late `ssJourneyOnResolve` and attempting to roll back prior stats, roster,
clock, economy, command, or camp writes is forbidden.

The dispatcher is idempotently installed and preserves all nonterminal output/side effects
byte-for-byte. It owns no combat calculation.

### Terminal persistence

`warCareerTerminalPersist` captures a sanitized immutable terminal snapshot for the terminal screen,
then removes `gor_save` and `gor_undo_last`, invalidates any validated local named slot whose
`campaign.runId` matches the terminated run, sets `G.campaign = null`, and proves `loadLocal()` exposes
no resumable campaign. It never deletes an unrelated slot. Ironman may not create a new named slot
while active; importing an external file is an explicit new/restarted run, not Continue.

Legacy Ironman saves receive a `C.runId` lazily before their next save. A terminal run without a
stable id fails closed by clearing autosave/undo and refusing to delete ambiguous named slots. Slice A
must test storage state, the main-menu Continue affordance, matching/unrelated slots, and direct
load—not merely count calls to `saveLocal`.

### Comrade selection

Eligible comrades:

1. are alive and present;
2. share the most specific stable unit hierarchy available at the fallen person's last qualifying
   result (company, then regiment, then brigade);
3. match side;
4. are not already in the lineage;
5. have a unique, provenance-bearing Army Register identity;
6. are inside any known service window.

Selection is a stable sort by hierarchy distance, documented-before-generated provenance, rank
distance, then person id. The player may choose among the first bounded candidates, but the candidate
set and order are deterministic and survive reload. Rerolling a save cannot produce a stronger set.

If no candidate exists, the career ends with a truthful “No eligible comrade could be identified”
record. The game does not fabricate a person. A hand-off copies shared lineage, remembered
relationships, and campaign context; it does not copy rank, OVR, wounds, personal merit, or grant a
reward. The old identity becomes immutable in `lineage` and the new identity is the sole active
`journey.person`.

---

## 5 · Reputation and relationships

Player reputation is a bounded scalar owned only by the canonical journey. It represents how the
career's conduct is remembered in this playthrough, not an objective historical rating. Declared
result rules move it once per qualifying `creditKey`; retries, hand-offs, death, and load cycles
cannot award it.

Relationships are a bounded map keyed by explicit stable ids. Each edge stores:

- target id and target namespace;
- signed rapport in a fixed bounded range;
- last unique event id and qualifying credit key;
- a short event-code history;
- origin `historical-authored` or `emergent-timeline`;
- source references when historical-authored.

Historical-authored ties require normal citation law and cannot be inferred from a tag, surname, or
proximity. Emergent ties render as “Your Timeline,” never “Historical.” A hand-off preserves the
network as remembered unit history but begins the successor's personal rapport at a declared neutral
or inherited-memory value; it never impersonates the fallen person's friendships.

The existing press favor map is only a storage pattern. `P.command.reputation` remains NPC-general
state. Neither may be aliased or silently synchronized with player reputation.

---

## 6 · Pull-based political access

The political world continues to initialize and resolve so the war does not freeze while the player
serves below national command. The career layer controls authority, not existence or visibility.

Three pure adapters govern every surface:

- `warCareerRole(C)`: current role band and reason.
- `warCareerCapabilities(C)`: named read/write capabilities and locked explanations.
- `warCareerCommandProjection(C)`: bounded player contribution for the existing
  `commandLeadership` seam.

Read-only teaching, sources, strategic situation, and public-war readouts remain visible. Mutating
cabinet, appointment, promotion, delegation, decision-resolution, and national-resource actions require
an explicit capability. The selector is consumed consistently by `_wdRefresh`, both `openWarDept`
implementations, the H0 tab catalog, between-battle actions, decision resolution, and command actions.
Hiding a control without guarding its underlying function fails the contract.

Pending national decisions below the unlock do not silently accumulate forever or resolve in the
player's name. Each future decision adapter must choose one of: visible defer, historically sourced
automatic administration, or explicit unavailable-with-consequence. Until that rule exists for a
decision, the action remains in the legacy campaign path and is not claimed as career-owned.

This is the pull law: each promoted role requests one narrow capability from existing modules. No
replacement President simulation, cabinet engine, economy, diplomacy layer, divergence engine, ending
engine, or S3-S5 umbrella module may be created.

Legacy campaigns with no active war career retain the shipped President experience exactly. Career
mode gates authority only after an explicit opt-in/migration marker, so this feature does not remove
existing content from players who want the current strategy game.

---

## 7 · After Action, end of war, and franchise carry

Career report readers remain pure and are composed into `src/82-after-action.js` beside the shipped
Soldier's Story section. The report distinguishes:

- documented identity and service facts;
- “Your Timeline” promotions, relationships, wounds, and hand-offs;
- inferred/generated representatives;
- retry/recovery events that earned no duplicate credit.

The H0 module stays a presentation wrapper. A rank-and-file career is not graded as if it personally
controlled treasury, diplomacy, or cabinet outcomes.

Active-career additions remain lazy fields inside the campaign and may stay on `_SAVE_VER = 1` only
while old saves load idempotently and malformed career fields fail safely. The named franchise /
Chronicle gallery is a later outer-save feature. It must capture an immutable sanitized career archive
before `warWonScreen` clears `G.campaign`.

If the archive cannot fit the existing envelope honestly, its implementation must bump the one save
version and ship, in the same commit: idempotent v1→v2 migration, `serializeSave`/`applySave` support,
E41/E50 guard updates, named-slot migration, malformed/old/future-version negatives, and rollback
documentation. A secret second local-storage store is forbidden.

---

## 8 · Four-player acceptance matrix

| Lens | Concrete successful path | Guard against failure/exploit |
|---|---|---|
| Newcomer | Start as a named or clearly Inferred Private/Captain; see one current responsibility, one next threshold, and a plain-language reason after each result | No unexplained resource wall; no hidden permanent choice; keyboard/screen-reader path; resume at the same decision |
| History buff / teacher | Inspect identity, unit, source/provenance, historical service window, and a separately labeled alternate career timeline | No invented relationship or death; source facts never overwritten by a promotion; printable AAR separates history from play |
| Wargame veteran | Earn wider tactical/command authority from role-appropriate, distinct results and see exactly which existing system a new capability controls | No universal stat buff; no flattening of command friction; legacy campaign remains available |
| Game-theory min-maxer | Understand deterministic thresholds, candidate order, and bounded reputation changes | Stable credit ledger blocks retry/save farming; no death reward; no hand-off reroll; live date alone cannot unlock politics; no duplicated NPC/player reputation |

---

## 9 · Accessibility and session respect

- Every role, life-state, promotion, and relationship change is text, not color alone.
- Career progress and candidate lists use semantic headings/lists; controls are native buttons with
  visible focus, at least 24×24 CSS pixels, and accurate disabled/expanded/current state.
- Hand-off and terminal copy is concise, dignified, dismissible only after the consequence is
  understood, and never animated as spectacle. Reduced-motion settings apply.
- A player may stop after any battle. Save/load returns to the same unresolved hand-off or role
  decision without rerolling candidates or double-awarding results.
- No surprise modal chain. The AAR states what changed, why, and which choice can wait.
- Career history remains readable at 200% zoom and in a print-safe after-action view.

---

## 10 · Incremental implementation ladder

Each slice takes a fresh committed LANE-005 DRIVE lock, ships independently, and returns the lane to
CONTRACT/unowned. No slice may borrow another lane's files without its owner.

### Slice A — terminal honesty + minimal canonical spine (exact next runtime)

Add `src/106-war-career.js` with marker `WAR_CAREER_RUNTIME_V1` and a normal manifest module entry
after `105-save-guard.js`; do not add `campaignAdvance` to manifest `overrides`. The same slice
must narrowly update `src/37-loot-survival.js` with marker
`WAR_CAREER_JOURNEY_ADAPTER_V1`, its whitelist/compatibility writers and Army Register start UI;
`src/82-after-action.js` with a guarded career-report composition; and `src/91-save-slots.js` with
the declared Ironman named-slot law. Add `tools/probe-war-career.mjs` to the release suite
(129→130). It must:

1. create/persist `C.runId` and idempotently sanitize the additive canonical-journey v1 shape
   through `_ssCleanJourney`/`warCareerInit` without moving `_SAVE_VER`; expand `_ssStatus` to
   preserve all six legal life states, while Slice A emits no new personal fate;
2. retain `ssStartJourney`/D360 high-rank legacy behavior, while
   `warCareerCanStart`/`warCareerStart` enforce explicit opt-in, Private-through-Captain, matching
   side, and stable team;
3. expose pure role/capability summaries with no political mutation;
4. create the 96-event ring and finite `creditLedger`; Slice-A rows stay
   `qualifying:false` and prove recovery retries cannot award or duplicate credit;
5. install the pure-first assignment dispatcher, close E71 using the exact
   `B.fromCampaign`/winner-side predicate, and enforce terminal persistence across autosave, undo,
   matching/unrelated slots, direct load, and Continue;
6. preserve legacy/no-career, normal win, draw, normal loss/recovery, free-battle result, Auto,
   Classic, realtime handback, save undo, and every nonterminal side effect;
7. render a minimal AAR War Career summary through the guarded core seam while old Journey output
   remains compatible;
8. add no personal death roll, qualifying advancement, relationship mutation, political gate,
   command bonus, or franchise archive.

The runtime plan probe switches modes only when the marker appears. Half-registration fails closed.
E71 moves to FIXED only when the focused loss-path tooth proves zero recovery, zero upgrade, zero
live/Continue save, zero stats/roster/system tick, zero reward/undo, matching-slot invalidation with
unrelated-slot preservation, and exactly one terminal render for Ironman. Non-Ironman recovery and
all noncampaign/free-battle calls remain byte-equivalent.

### Slice B — participation and personal fate

Add explicit person↔unit identity links and mode-parity participation evidence. Only then add wounded,
captured recovery, fallen, and deterministic COMRADE HAND-OFF. Career Ironman uses a pure preflight
classifier before the Slice-A dispatcher delegates; nonterminal fate commits afterward. No second
terminal system and no rollback-after-`_t1Resolve` path are legal.

### Receipt-continuity prerequisite — dual-reference participation-v2 (exact next runtime; D405 SHIPPED)

Before Slice C, D405 implemented only the §14 coexisting `cw_war_career_participation_v2` receipt
path and its exact Haley Gettysburg→Chickamauga proof. D401 v1 receipts remain unchanged. The bounded runtime
surface is `src/106-war-career.js`, `src/37-loot-survival.js`, and
`tools/probe-war-career.mjs`; the existing manifest entry remains unchanged. The planning guard
`tools/probe-war-career-loop-plan.mjs` moved only to replace its D404 planning hashes/absence teeth
with exact receipt-prerequisite completion teeth. Its original ten
step names, runtime mode, suite exclusion, and all nine D404 step names remain fixed. The first proof
is Classic consequence-only and does not authorize T2, T3, Auto, command projection, rank movement,
combat movement, or a new data file. Build the generated game only from source after those focused
files are green. If the three-runtime-file boundary plus its plan-guard transition cannot prove the
full §14 sanitation and compatibility matrix, HALT with the exact missing seam instead of entering
Slice C or broadening silently.

### Slice C — field/general command projection

Add billet history and the narrow `warCareerCommandProjection` adapter. Prove player and NPC
reputation/promotion ledgers remain isolated and no command effect is double-counted.

### Slice D — relationship memory

Add the bounded provenance-bearing ledger and a small set of event-code transitions. No prose-authored
historical tie ships without sources; no generated edge presents as history.

### Slice E — late-war political pull

Add one named capability at a time to all UI and underlying action seams. Define decision
defer/delegate behavior before gating resolution. Read-only education remains visible.

### Slice F — war end and franchise archive

Capture before campaign nullification, then add the Chronicle gallery. Perform a save-version migration
only if the outer archive cannot remain honest inside the existing envelope.

---

## 11 · Probe and gate contract

### D399 planning boundary

- `node --check tools/probe-war-career-loop-plan.mjs`
- `node tools/probe-war-career-loop-plan.mjs`; read
  `tools/shots/probe-war-career-loop-plan.json`
- negative bind: change only the §2 Bind token's owner path from `journey` to `career`; exactly
  `STATE OWNERSHIP` fails with exit 1; restore the
  spec byte-for-byte and prove its original md5
- run every existing relay-lane plan probe after the final LANE-005 rewrite
- `node tools/build.mjs` must print `GATE OK` and leave generated HTML md5
  `e669982913feb54032253bf19bcd2b8b`
- frozen `build/base.html` remains `c9db83fa99230ffb95bdfdfe059f3fb9`
- `git diff --check`

Historical D399 planning pins: 24 scenarios, 54 schema rows, Army Register 1512, release suite 129, no
`src/106-war-career.js`, no `WAR_CAREER_JOURNEY_ADAPTER_V1` in the legacy module, no focused
career probe, no manifest marker, no save-version movement, and E71 still pending.

### D404 receipt-continuity planning boundary

- `node --check tools/probe-war-career-loop-plan.mjs`
- `node tools/probe-war-career-loop-plan.mjs`; read all nineteen named rows in
  `tools/shots/probe-war-career-loop-plan.json`; the original ten names and runtime mode remain
  unchanged
- run and read all thirteen coordination-sensitive plan probes after the final LANE-005 rewrite;
  the D404 total is 155/155 named rows
- negative bind: change only `NEVER` to `MAY` inside the unique §14 source/timeline Bind token;
  exactly `SOURCE VS YOUR TIMELINE` fails with exit 1 and every other one of the nineteen War Career
  plan rows stays green; apply the inverse patch and prove both design and probe return to their
  pre-bind md5 values
- `node tools/build.mjs` prints `GATE OK`; generated HTML remains
  `4560dfc4f22b5907429e6a5c7d303e4f`; frozen base remains
  `c9db83fa99230ffb95bdfdfe059f3fb9`
- locked read-only hashes remain: `src/106-war-career.js`
  `c69f405c0469abe7eca67fc0fff99575`, `src/37-loot-survival.js`
  `d526f33a7649d378d2062b931b933884`, `src/35-command.js`
  `55bd7b5a30f22470e1abd7a993b3cbb4`, `src/tactical/T2-campaign-link.js`
  `feef8a3c1ecf5fb28a120d2398ee61fc`, `src/tactical/T3-officers.js`
  `56e2cd1060a40eb0754b19e8d56bacdb`, `src/87-auto-resolve.js`
  `4f0bd0970ef96c09b62ea44694387f80`, `tools/probe-war-career.mjs`
  `54e6a095eb81095ede3d46e5bd523f62`, and `tools/probe-command.mjs`
  `bbfeaa69db333fddee2741882abff245`
- the complete `src/` tree remains `c0e7fbbd36d59f1fe53147f9561b9954`; the plan probe also reads
  `git diff HEAD` plus nonignored untracked files and rejects every path outside the eleven-file
  D404 planning allowlist, so After-Action, President Register, save slots, every tactical module,
  and any other source file cannot move behind a partial hash list
- current baselines remain 24 scenarios, schema 54, Army Register 1512, coverage 24, suite 130,
  sweep 24, War Career suite row 38, `_SAVE_VER=1`, and data-tree md5
  `b0d7f440836b60a4f18401b2d7b03f48`; D398 remains the latest full release battery
- `git diff --check`; commit and push only the allowed planning files; return LANE-005 to
  CONTRACT/unowned; do not run `npm run vet:noreg` in this docs/tool-only slice

### D405 receipt-complete runtime boundary

- Keep all nineteen D404 plan-step names and runtime mode. Replace only the planning absence/hash
  expectations with exact receipt-complete runtime, focused-probe, source-tree, and generated-game
  hashes; keep the changed-file allowlist fail closed.
- `tools/probe-war-career.mjs` retains every D401 row and static wall, then adds the nine §14
  receipt controls. The final focused contract is 34/34 browser/runtime rows plus 29/29 static
  assertions, with zero `pageerrors` and zero `realErrors`.
- Run syntax checks for `src/106-war-career.js`, `src/37-loot-survival.js`,
  `tools/probe-war-career.mjs`, and `tools/probe-war-career-loop-plan.mjs`; build only from source;
  run and read War Career, loot/survival, save-slots, command, full-campaign, and plan artifacts.
- Repeat D404's unique `NEVER`→`MAY` source/timeline negative bind. It must exit 1 with exactly
  `SOURCE VS YOUR TIMELINE` red and eighteen green, then restore both design and plan-probe files
  byte-for-byte before the final 19/19 run.
- After the final LANE-005 release rewrite, run and read all thirteen coordination-sensitive plan
  probes. The current corpus has 155 named artifact rows; D404's retained 192 count belongs to the
  D398 24×8 battle sweep, not to the plan-probe artifacts.
- Preserve 24 scenarios, schema 54, Army Register 1512, coverage 24, suite 130, sweep 24, War Career
  suite row 38, `_SAVE_VER=1`, frozen base `c9db83fa99230ffb95bdfdfe059f3fb9`, data tree
  `b0d7f440836b60a4f18401b2d7b03f48`, command `55bd7b5a30f22470e1abd7a993b3cbb4`,
  T2 `feef8a3c1ecf5fb28a120d2398ee61fc`, T3 `56e2cd1060a40eb0754b19e8d56bacdb`,
  Auto `4f0bd0970ef96c09b62ea44694387f80`, and command probe
  `bbfeaa69db333fddee2741882abff245`. D398 remains the latest full release battery; do not run
  `npm run vet:noreg` for this focused prerequisite.

### Slice-A focused and adjacent gate

- syntax/preparse for every touched JS/MJS; build `GATE OK`
- plan probe in complete runtime mode
- focused `probe-war-career` with explicit binds for the exact campaign-loss predicate, pure-before-
  delegate ordering, terminal storage/Continue state, event-vs-credit dedupe, role selector, sanitizer
  idempotence, explicit start modes, and legacy parity
- `probe-loot-survival`, `probe-save-slots`, `probe-full-campaign`,
  `probe-campaign-link`, `probe-afteraction`, `probe-h0-after-action`, and `probe-playstyle`
- Auto, Classic, and realtime terminal/nonterminal matrix; inspect every JSON and pageerror field
- runtime negative binds: disable the dispatcher install, remove the journey-adapter marker, and turn
  one nonqualifying observation into a merit award; each perturbation fails only its declared teeth and
  restores byte-for-byte
- suite list 130; do not run the full release battery unless its checkpoint is separately due
- docs/ledger sync, `git diff --check`, commit, push, release

Later slices extend `probe-ratings`, `probe-officers`, `probe-command`, cabinet/decisions/Desk/
between-battle probes, save guards, and final-report probes only when they consume those seams.

---

## 12 · Exclusions and HALT conditions

Forbidden throughout:

- a second mutable career owner or name-based identity join;
- hand-editing `build/base.html` or generated HTML;
- changing combat, casualty, winner, score, AI, objective, reinforcement, or balance inputs for career
  progression;
- inventing a historical promotion, relationship, quotation, service, death, or comrade;
- rewarding death, capture, terminal loss, restart, or repeated recovery;
- allowing dead/captured/service-window-ended people to command;
- using date alone for political access;
- rebuilding President, cabinet, economy, diplomacy, divergence, ending, or S3-S5 systems;
- save-version movement without the complete same-commit migration contract;
- silently disabling current educational/read-only content;
- entering LANE-002 or LANE-003 files without their own relay contract.

HALT instead of guessing when: a person cannot be linked to participation; two ids may represent the
same historical person without an explicit mapping; no same-unit comrade is eligible; a political
decision lacks a defer/delegate law; a legacy save cannot be migrated idempotently; a focused gate
fails outside the active slice; or source evidence contradicts a proposed historical label.

---

## 13 · D403 option-1 feasibility boundary — receipt evolution required

Aaron selected exact stable-id cross-rung service assignment. The planning inventory stopped before
contracting it because the unchanged D401 receipt has one field tuple serving two incompatible jobs:
canonical source identity and current-rung participation.

- `_wcActiveLink` rejects before any assignment exists unless the person's immutable canonical
  `unitRef.battleId` is the live campaign battle and current chain rung.
- D401 `explicit-career-assignment` is created only after that gate. It maps the already-accepted
  source slot to one current field-unit id; it has no future scenario, target slot, chain index, or
  service window.
- `_wcResultEvidence` and `warCareerParticipationEvidence` require the result battle and participant
  tuple to remain that canonical source reference.
- `_ssCareerParticipation` uses the same receipt tuple to prove the campaign chain index,
  `creditKey`, canonical person, and canonical Army Register slot.

A result-independent assignment ledger inside `C.loot.journey` would therefore remain unusable while
the D401 receipt is unchanged. Honest cross-rung continuity needs a dual-reference receipt contract:
one immutable canonical source reference for identity/provenance and one exact “Your Timeline”
assignment reference for the live result/rung. D403 deliberately stopped before choosing that
receipt. Aaron authorized the planning-only choice on 2026-07-15. Section 14 supersedes the unresolved
sentence without erasing this measured boundary.

No D403 runtime contract followed from this section. The shipped ten-step D399-D401 plan guard and
all D401 runtime bytes remained unchanged at that stop. Slice C and T2/T3/Auto stayed closed.

---

## 14 · D404 dual-reference receipt contract

### Receipt choice

| Alternative | Compatibility shape | Sanitation consequence | Decision |
|---|---|---|---|
| A — extend `cw_war_career_participation_v1` | Old flat v1 and new dual-reference v1 share one schema string | Every validator must infer which of two meanings “v1” has from optional-field presence; a partial or forged hybrid becomes a third shape | Rejected |
| B — coexist with `cw_war_career_participation_v2` | D401 v1 retains its exact field set, result-id algorithm, and same-source-rung meaning; v2 is required only for an exact cross-rung assignment | Schema dispatch is explicit; v1 never upgrades implicitly; malformed v2 cannot fall back to v1 | **Selected** |

Alternative B is the smaller compatibility risk even though it adds one parser branch. It preserves
the D401 contract byte-for-byte and makes fail-closed sanitation decidable from the schema, rather
than from the presence of optional authority fields. The save envelope and journey remain version 1:
`_SAVE_VER=1` and `careerVersion:1`. A versioned receipt nested inside the already-whitelisted
journey does not itself require a save-envelope migration.

**Bind token:** WAR_CAREER_RECEIPT_BIND:SOURCE_REF_NEVER_EQUALS_TIMELINE_AUTHORITY

Changing canonical source history is not alternate-timeline gameplay. The source reference proves
who the person is and what the historical record says. The timeline assignment proves where that
same person is allowed to participate in the player's current rung. Neither can be inferred from,
rewritten as, or substituted for the other.

### Coexisting receipt schemas

D401 `cw_war_career_participation_v1` remains legal only in its shipped flat shape:

`schema, resultId, mode, runId, creditKey, personId, chainIndex, battleId, side, unitId, slot,`
`slotPid, routeUnitId, mapping, assignmentId, battleYear, rankAtResult`.

Its existing `_wcResultId(..., "result-v1")`, `_wcAssignmentId(..., "assignment-v1")`, exact
same-source-rung validation, fate, credit, lineage, and hand-off semantics remain unchanged. No load
path may add v2 fields, relabel it, or synthesize a timeline assignment for it.

A new dual-reference result uses ephemeral schema `cw_war_career_result_v2`; its persisted
participation uses `cw_war_career_participation_v2`. The sanitized persisted shape is exactly:

- `schema`, `resultId`, `mode`, `runId`, `creditKey`, and stable `personId`;
- current-rung projections `chainIndex`, `battleId`, and `side`, which must equal the timeline
  assignment fields rather than the canonical source battle;
- immutable `sourceRef`;
- exact `timelineAssignmentRef`;
- `representedFieldUnitId` and `fieldMapping:"exact-timeline-unit"`;
- `battleYear` and `rankAtResult`.

`sourceRef` is reconstructed from the unique live Army Register identity and contains exactly:
`battleId, side, unitId, slot, slotPid, sourceGrade, serviceStart, serviceEnd, serviceYear,`
`provenance`. Null service bounds remain explicit nulls. It never reads the current battle to fill a
source field, and `journey.person.unitRef` is never rewritten.

`timelineAssignmentRef` is reconstructed from one immutable exact-id mapping row and contains
exactly: `assignmentId, scenarioId, side, unitId, slot, slotPid, chainIndex, serviceStart,`
`serviceEnd, serviceYear, timelineGrade, provenance, label`. Its label is exactly
`Your Timeline`; its assignment provenance is `Inferred` unless a later contract supplies evidence
for the assignment itself. The historical provenance of the target unit does not make the person's
alternate placement Verified.

Rank, role, billet, source grade, timeline grade, and assignment are six distinct concepts.
`rankAtResult` snapshots the journey's gameplay rank. `sourceGrade` remains the historical grade.
`timelineGrade` states the authored grade compatibility of that target slot. An assignment neither
promotes the person nor creates a billet, role, command projection, merit award, or historical claim.

### One immutable mapping input, not a second registry

The exact next runtime may add one frozen `_WC_TIMELINE_ASSIGNMENTS_V1` config inside
`src/106-war-career.js`. It is an immutable array of authored exact-id mappings and is never saved,
mutated, appended from a result, or queried by name/rank/proximity. It is not a person registry or a
second career ledger. `C.loot.journey` remains the sole mutable player-career owner; receipts remain
inside its events, credit ledger, and last-participation projection. `P.command` remains the separate
NPC command owner.

Lookup key is exactly `personId + side + chainIndex + scenarioId`. Exactly one config row must match.
The row's source slot pid must match the unique canonical Army Register person, and its target slot pid
must match the canonical `ss:<scenarioId>:<side>:<unitId>:<slot>` form. The scenario must occupy the
declared chain index, the target unit id must occur exactly once in the declared phase/result field,
and both the person and assignment must admit the battle year.

The deterministic timeline assignment id is:

`wcta-` + base-36 `_wcHash([personId, sourceSlotPid, scenarioId, side, unitId, slot, slotPid,`
`chainIndex, serviceStart-or-empty, serviceEnd-or-empty, serviceYear-or-empty, timelineGrade,`
`"timeline-assignment-v1"].join("|"))`.

This `wcta-` namespace is distinct from D401's `wca-` tactical-representation id. The old
`_wcAssignmentId` keeps its existing meaning and bytes.

### Exact alternate-timeline fixture

The first mapping is a proof fixture, not a claim that John W. Haley served at Chickamauga:

| Field | Exact value |
|---|---|
| `personId` | `person_gettysburg_us_17me_haley` |
| Canonical person | John W. Haley, Private, Verified replacement record |
| `sourceRef.battleId / side` | `gettysburg / US` |
| `sourceRef.unitId / slot` | `us_birney_iii / pvt` |
| `sourceRef.slotPid` | `ss:gettysburg:US:us_birney_iii:pvt` |
| Source phase / US chain index | `day2 / 15` |
| Source service bounds | `serviceStart:null, serviceEnd:null, serviceYear:1863` |
| Target scenario / phase | `chickamauga / snodgrass-horseshoe` |
| Target `side / unitId / slot` | `US / us_harker_rock / pvt` |
| Target `slotPid` | `ss:chickamauga:US:us_harker_rock:pvt` |
| Target US chain index / year | `16 / 1863` |
| Target service bounds | `serviceStart:null, serviceEnd:null, serviceYear:1863` |
| `timelineGrade / provenance / label` | `Private / Inferred / Your Timeline` |
| `assignmentId` | `wcta-1pav4ac` |

The source replacement is unique by `pid` and `replacePid`, has six source entries, and remains
Verified. The target unit is unique in the named Chickamauga phase and its private slot has no
replacement record. Both exact rungs are 1863, so the live `serviceYear:1863` admits the proof
without expanding the runtime record to Haley's wider documented 1862-1865 service. The target unit's
identity is sourced; Haley's placement there remains explicitly alternate.

### Result identity and two independent validators

Add `_wcTimelineAssignmentId` and `_wcResultIdV2`; do not change the old id functions. The v2
result id is a fixed-order hash over:

1. `"participation-v2"`, `runId`, `creditKey`, `mode`, and stable `personId`;
2. every exact `sourceRef` field in its declared order;
3. every exact `timelineAssignmentRef` field in its declared order, including the deterministic
   assignment id;
4. `representedFieldUnitId`, `fieldMapping`, `battleYear`, and `rankAtResult`.

The canonical-source validator independently requires one registry person for `personId`, exact
source-field equality, canonical slot-pid reconstruction, same-side identity, unchanged source grade,
service bounds, and provenance. It does not require the source battle to equal the current rung.

The timeline validator independently requires one immutable mapping row, exact assignment-id
recomputation, exact current `creditKey`, current side/rung/scenario/year, exact target slot and one
represented non-HQ field unit with `representedFieldUnitId === timelineAssignmentRef.unitId`, legal
service window, alive or wounded status, no unresolved hand-off, and compatible timeline grade. It
does not accept canonical source equality as current-rung proof. Both validators must pass before a
v2 result can qualify.

Absent, duplicate, malformed, unknown-schema, stale-rung, stale-run, wrong-credit, wrong-side,
wrong-scenario, wrong-chain-index, wrong-unit, wrong-slot, wrong-slot-pid, wrong-assignment-id,
outside-service, foreign-person, fallen, captured, retired, war-ended, unresolved-hand-off, or
cross-reference-mismatched input produces no qualifying receipt, personal fate, capture recovery,
merit, reputation, promotion, lineage, hand-off, billet, or command authority. Names, ranks,
namespaces, aliases, proximity, aggregate casualties, or a historical-service guess never repair it.

### Save sanitation, credits, and hand-off isolation

`_ssCareerParticipation` becomes an explicit schema dispatcher. Its v1 branch preserves the D401
parser and result-id calculation exactly. Its v2 branch reconstructs only the declared v2 keys,
validates the source and mapping independently, recomputes both ids, and rejects a partial/hybrid
shape. Unknown fields are stripped through reconstruction. Event, credit, and
`lastParticipation` copies must use the same schema and exact result id; cross-schema copies cannot
cross-validate.

Init/load performs sanitation eagerly. One pass converges to canonical bytes; a second
`warCareerInit` and save/apply/init cycle produce the same bytes. No lazy authority repair is
allowed. A bad v2 row is demoted to a nonqualifying narrative with fate and hand-off authority
removed; it cannot erase or rewrite a valid D401 v1 receipt on another credit key. `_SAVE_VER=1`
remains exact.

The existing `creditKey` remains the one-credit-per-rung owner across both receipt schemas. A v1 and
v2 row cannot claim the same key twice. Once one qualifying result owns the rung, retry, mode switch,
save/load, a better outcome, or a successor cannot replace its receipt or reroll fate.

COMRADE HAND-OFF stores the result-location reference appropriate to the owning receipt, but it never
copies a mapping row. A successor is re-resolved as a unique canonical person and may use only that
successor's own exact mapping. The fallen person's future assignments, source reference, timeline
grade, receipts, merit, reputation, rank, billet, and authority never transfer. If the successor has
no exact current-rung mapping, participation fails closed; the game does not borrow the prior
identity's assignment.

### Exact next runtime proof and closed seams — D405 SHIPPED

The receipt-continuity prerequisite extends the focused War Career probe with all of these controls
before Slice C:

1. Haley's canonical `sourceRef` is byte-identical before and after a Chickamauga result.
2. The exact `wcta-1pav4ac` Chickamauga assignment qualifies once and stores v2 in event, credit,
   and last-participation copies.
3. Each malformed-reference/service/status class above fails without authority.
4. Init twice and save/apply/init are byte-idempotent.
5. Same-rung retry does not duplicate or replace credit or fate.
6. A fallen-person hand-off gives the successor no Haley assignment.
7. Fallen, captured, retired, war-ended, and out-of-service identities cannot qualify.
8. Every existing D401 v1 receipt fixture remains valid with the same result id and bytes.
9. `src/35-command.js` and `tools/probe-command.mjs` remain hash-identical; combat, casualty,
   winner, score, AI, objective, reinforcement, balance, merit, reputation, promotion, role, billet,
   and `warCareerCommandProjection` do not move.

The prerequisite may edit only the three runtime/proof files `src/106-war-career.js`,
`src/37-loot-survival.js`, and `tools/probe-war-career.mjs`; it may also update
`tools/probe-war-career-loop-plan.mjs` solely for the declared planning-lock→receipt-complete guard
transition, plus generated output and live documentation after focused gates. It may not rename or
remove any of the plan probe's nineteen steps, enroll that plan probe in the suite, or weaken a D404
tooth. It may not edit T2, T3, Auto, data, the manifest, the suite manifest,
`src/35-command.js`, or `tools/probe-command.mjs`. Slice C remains a separate future DRIVE take after
this prerequisite is green, committed, pushed, and released. If this boundary cannot prove the exact
fixture in Classic without broadening, HALT with the missing seam and the narrowest alternatives.

### D405 shipped receipt-complete boundary

D405 implements the selected schema without changing D401's v1 helpers or receipt bytes. The frozen
`_WC_TIMELINE_ASSIGNMENTS_V1` contains only the exact Haley mapping. Canonical reconstruction keeps
Gettysburg, `sourceGrade:"Private"`, `serviceYear:1863`, and `provenance:"Verified"`; result-location
reconstruction separately keeps Chickamauga rung 16, the Harker/Rock private slot,
`timelineGrade:"Private"`, `provenance:"Inferred"`, label `Your Timeline`, and assignment
`wcta-1pav4ac`. The Soldier replacement adapter now takes a sourced replacement record's validated
`year` as its service year instead of inheriting the campaign-clock year; no data record changed.

The final receipt-complete locks are `src/106-war-career.js`
`9eba476afa0b46e04c7060d7c7dbde64`, `src/37-loot-survival.js`
`cd41b69d7e08486fac15e0d68a5d9597`, `tools/probe-war-career.mjs`
`bfb97971b867ff7e93758b84b5cb3c0e`, complete `src/` tree
`2fa3cec836ab89026a416bd71bb6ddd4`, and generated HTML
`74d5abd5196f7bdd7998e4d84573a925`. The plan guard pins those receipts while keeping
`warCareerCommandProjection()` at zero, all command/combat files closed, `_SAVE_VER=1`, and Slice C
unstarted.

---

## 15 · D406 Slice C runtime contract

### Ledger-derived advancement, not mutable reward state

D406 activates Slice C without changing either receipt schema. Only one canonical, qualifying,
current-person receipt whose fate is `alive` can score. The deterministic Inferred gameplay table is:

| Result | Merit | Reputation |
|---|---:|---:|
| decisive victory | 4 | +3 |
| other victory | 3 | +2 |
| draw | 1 | 0 |
| defeat | 0 | -1 |

Current-person totals are reconstructed in credit-ledger order and clamped to merit `0..128` and
reputation `-64..96`. Current-person event and credit copies receive the same reconstructed award.
Lineage, foreign-person, nonqualifying, wounded, captured, fallen, retry, recovery, hand-off, and
narrative-only rows score zero. Saved totals are projections and never authority.

The legal Slice-C ladder is Private/Corporal → Sergeant; Sergeant/Lieutenant → Captain; Captain →
Major; Major → Lt. Col.; Lt. Col. → Colonel; Colonel → Brig. Gen. One receipt can cross only one
step. Promotion requires cumulative merit `4 * (prior promotions + 1)`, nonnegative reputation,
exact current-person/service/receipt ownership, and a compatible result slot. Private/Corporal to
Sergeant accepts `pvt|nco|cmd`; Sergeant to Captain accepts `nco|cmd`; Lieutenant to Captain and
every higher move require `cmd`. These thresholds are Inferred balance law, not historical claims.
No promotion, death, capture, or hand-off changes canonical source grade or OVR.

### Journey-owned billets and Your Timeline reachability

`C.loot.journey` remains the sole mutable player-career owner. Sanitation reconstructs a bounded
`roleHistory` and `currentBillet`; it never trusts saved rank, totals, promotion count, billet, or
authority. Each `cw_war_career_billet_v1` row contains exactly `schema, billetId, ordinal, personId,
side, rank, roleId, billetCode, label, provenance, timelineLabel, authority, creditKey, eventId,
chainIndex, scenarioId, battleYear`. The first row is Inferred `Your Timeline` with
`authority:"career-start"`; every later row binds one qualifying current-person receipt with
`authority:"qualifying-credit"`. `currentBillet` is an exact copy of the final reconstructed row.

The billet codes are `company-ranks`, `company-nco`, `company-officer`, `field-officer`, and
`general-officer`. Their role bands are `rank-and-file`, `junior-command`, `field-command`, and
`general-command`. Field authority begins at Major only with an exact field-officer receipt; general
authority begins at Brig. Gen. only with an exact general-officer receipt.

The reachable proof starts with canonical Captain
`ss:chancellorsville:US:us_battery_chanc:cmd`. Three frozen, Inferred, `Your Timeline` mappings add
only result-location authority: Vicksburg `ss:vicksburg:US:us_deg_battery:cmd`, Major,
`wcta-144pyv4`; Gettysburg `ss:gettysburg:US:us_hall_battery:cmd`, Lt. Col., `wcta-11pxx98`; and
Chickamauga `ss:chickamauga:US:us_lilly_battery:cmd`, Colonel, `wcta-9be2qw`. Four decisive/alive
qualifying credits prove Captain → Major → Lt. Col. → Colonel → Brig. Gen. The canonical
Chancellorsville source slot, source grade, source OVR, provenance, and `serviceYear:1863` never
move. The generated-person adapter derives source year and OVR from the authored source battle,
not the mutable campaign clock, so reload cannot rewrite source history.

### One bounded pull into command

`warCareerRole(C)`, `warCareerCapabilities(C)`, `warCareerStrategicGeneral(C)`, and
`warCareerCommandProjection(C)` are pure selectors. Field command returns
`min(2, 1 + floor(max(0,reputation)/4))`; general command returns
`min(4, 2 + floor(max(0,reputation)/4))`; every excluded or malformed state returns zero. The pure
strategic identity adapter uses schema `cw_war_career_strategic_general_v1` and exposes only the
exact journey person, side, gameplay rank, role, billet id, Inferred provenance, and `Your Timeline`
label.

`commandLeadership(C)` calls `warCareerCommandProjection(C)` exactly once in its existing
general-present path, clamps that contribution to `0..4`, adds it once immediately before the
existing final `42..88` clamp, and writes nothing. The no-general fallback remains byte-identical.
`P.command` remains the separate NPC command owner: no player merit, reputation, promotion, billet,
adapter, appointment, corps, division, development, or history value is copied or aliased there.

COMRADE HAND-OFF retains shared evidence but reconstructs the successor from the successor's own
canonical start rank and qualifying receipts. The fallen identity transfers no merit, reputation,
promotion, gameplay rank, billet, role history, mapping, or command authority. Init/load sanitation
is eager, deterministic, byte-idempotent on the second pass, and remains inside `_SAVE_VER=1`.

The focused proof keeps all prior rows and adds exactly four War Career rows—`D406 LEDGER-DERIVED
ADVANCEMENT`, `D406 REACHABLE FIELD + GENERAL COMMAND`, `D406 BILLET SANITATION + ZERO MATRIX`, and
`D406 HANDOFF + NO-STACK ISOLATION`—plus four Command rows for zero compatibility, exactly-once
consumption, authoritative clamp, and player/NPC owner separation. T2, T3, Auto, data, combat,
casualty, winner, score, AI, objective, reinforcement, balance, politics, relationships, Slice D-F,
franchise/archive, manifest, suite enrollment, and save-version movement remain closed.

### D406 shipped boundary

The final candidate is green at War Career `38/38`, Command `94/94`, and War Career plan `19/19`
runtime mode. Adjacent browser proof is loot/survival `12/12`, save slots `16/16`, full campaign
`4/4`, campaign link `19/19`, After Action `15/15`, H0 After Action `3/3` viewports, playstyle
`14/14`, Auto Resolve `10/10`, officers `20/20`, ratings `22/22`, and visible/nonblank Classic
paint; every present error array is empty. The manifest remains exactly 130 commands with War Career
at row 38. D398 remains the latest complete release battery; D406 deliberately did not run
`npm run vet:noreg`. After lane release, all thirteen coordination-sensitive plan artifacts are
green at `155/155` named rows.

All four declared binds bit only their contracted scopes. Missing and doubled command consumers each
reddened only the exact-once Command row while War Career stayed `38/38`; the forbidden `P.command`
alias reddened only player/NPC owner separation; the captured-status relaxation reddened only War
Career billet sanitation/zero matrix and Command legacy/excluded zero compatibility. Every inverse
restore returned source and generated bytes exactly before rebuilt green reruns. Final MD5s are
`src/106-war-career.js` `d54ad18271de8d2af33be909be8251ed`, `src/35-command.js`
`8f12c49f7129b3a9be0203677822e048`, `src/37-loot-survival.js`
`4221eb61fee1c209ebc85d2fc1636a17`, focused War Career probe
`c19cffcba98e356faf2679076aa798b8`, Command probe `5ffd40fd221179f2e01cad59ef43bf7d`,
generated HTML `32dcc03e25e080aa4e7addd26a1c5f99`, and frozen base
`c9db83fa99230ffb95bdfdfe059f3fb9`.

---

## 16 · D407 Slice D runtime contract

### Exact result target and one owner

Slice D begins with one relationship class only: the active journey person's emergent high-command
response after a qualifying campaign result. The existing resolve order is the identity seam:
`cmdOnResolve` runs before `lootOnResolve`, resolves the appointed or historical-default command
general by stable id, and stores that exact id in `P.command._activeId`; the War Career observer then
commits its event and credit. A transition is legal only when all of these remain true:

1. the event and credit are the exact qualifying pair for the current person and both say
   `fate:"alive"`;
2. `_activeId` equals `cmdActiveId(C)` and `cmdActiveGeneral(C).id`;
3. the id resolves once, on the same side, as an Army Register person whose role is
   `army commander`;
4. the target is not the actor; and
5. canonical service and participation validation already accepted the receipt.

This is an Inferred **high-command response in Your Timeline**. It is never rendered as friendship,
physical contact, patronage, or a documented historical opinion. The target id is the only command
value Slice D reads. `P.command.reputation`, development, appointment, corps, division, history, and
every other command field remain independent NPC state. `C.loot.journey.relationships` remains the
only mutable player relationship owner; no alias is legal under `P.command` or elsewhere.

### Exact schemas, numeric law, and provenance

The relationship map key is `command-general-v1|<targetId>` and the target namespace is
`command-general-v1`. The event and credit carry matching optional transition copies in the exact
fields `event.relationshipSignal` and `credit.relationshipSignal`:

```text
cw_war_career_relationship_signal_v1 = {
  schema, transitionId, actorPersonId, targetId, targetNamespace,
  eventCode, rapportDelta, origin, timelineLabel, sourceRefs
}
```

The rebuilt map value is:

```text
cw_war_career_relationship_edge_v1 = {
  schema, targetId, targetNamespace, rapport, rememberedRapport,
  lastEventId, lastCreditKey, eventHistory, origin, timelineLabel, sourceRefs
}

eventHistory row = {
  transitionId, eventId, creditKey, actorPersonId, eventCode, rapportDelta
}
```

Personal and remembered rapport clamp separately to `-8..8`. At most 24 edges survive, matching the
existing bounded lineage/save precedent; each retains its latest four event-history rows so the recent
story stays legible and the save stays bounded. These are Inferred gameplay limits, not
social-history claims.
The permitted event table is exact:

| Exact event code | Trigger | Rapport delta |
|---|---|---:|
| `high-command-decisive-victory` | qualifying alive decisive victory | +2 |
| `high-command-victory` | qualifying alive other victory | +1 |
| `high-command-draw` | qualifying alive draw | 0 |
| `high-command-defeat` | qualifying alive other defeat | -1 |
| `high-command-decisive-defeat` | qualifying alive decisive defeat | -2 |

The transition id hashes `runId, creditKey, eventId, actorPersonId, targetNamespace, targetId,
eventCode`. It deliberately excludes event ordinal because sanitation renumbers ordinals. D407 emits
only `origin:"emergent-timeline"`, `timelineLabel:"Your Timeline"`, and `sourceRefs:[]`.

No historical-authored relationship ships. A future authored edge requires both an immutable exact-id
relationship claim and 2–12 independent normalized source objects with fields `title, author,
repository, locator, url, type, note`. Each source needs a title or repository and a locator or
HTTP(S) URL; the lowercased `title|repository|locator|url` tuple must be unique. Citations cannot be
inferred from a name, surname, rank, tag, unit proximity, casualty aggregate, command result, or
narrative. Without the immutable claim, sanitation strips unsupported historical labeling and sources;
a valid result transition remains only emergent Your Timeline memory.

### Deterministic reconstruction, cap, and hand-off

Sanitation accepts only a matching signal on the exact owner event and credit. It first validates
both independently, requires byte-equal normalized copies, then iterates the two copies through one
shared relationship-specific key that dedupes both the event/credit copies and transition ids. Valid transitions
sort by sanitized event ordinal and transition id before accumulation. For each edge, all valid deltas
contribute to its bounded scalar while only the newest four history rows persist, in chronological
order. Edges rank for retention by last ordinal descending and canonical key ascending; keeping the
first 24 deterministically evicts the oldest edge, then the lexically greater key on an ordinal tie.
Retained map keys serialize lexically.

Saved relationship maps, scalar rapport, remembered rapport, history, unknown fields, origin, source
claims, and aliases are never authority. Every init/load rebuilds from the sanitized event/credit
pairs. Retry returns before transition creation; recovery and nonqualifying observations carry no
signal; duplicate event/credit copies apply once; load, repeated init, selectors, and rendering are
pure. Wounded, captured, fallen, stale-service, foreign-person, malformed, unproved, and self-target
events create no edge. One sanitation pass converges, a second pass and save/apply/init preserve
bytes, `_SAVE_VER` remains `1`, and no relationship state reaches combat or strategy calculations.

An edge may contain transitions from more than one career identity. Deltas whose `actorPersonId`
equals the active `journey.personId` reconstruct `rapport`. Deltas whose actor is an exact member of
the validated lineage reconstruct only `rememberedRapport`. COMRADE HAND-OFF therefore changes the
classification of the predecessor's history without copying its personal scalar: the successor starts
at personal zero, sees a labeled Remembered network, and can build new personal rapport only through
the successor's later qualifying results. Candidate generation itself is never relationship evidence.

### Report, proof, and negative binds

`warCareerReportHTML` remains the one After Action seam. It renders a semantic relationship section
under **Your Timeline** with exact target display, signed Personal rapport, signed Remembered network,
and the newest event-code label. Escaping, wrapping, hierarchy, and text—not color—carry meaning at
200% zoom. Repeated direct and composed report reads must preserve campaign bytes. `src/82-after-action.js`
stays unchanged.

The focused browser probe preserves all existing rows and 29 static walls and adds exactly:

1. `D407 RELATIONSHIP TRANSITIONS + ONE-CREDIT`;
2. `D407 PROVENANCE + SOURCE HONESTY`;
3. `D407 SANITATION + BOUNDED DEDUPE`; and
4. `D407 HANDOFF MEMORY + OWNER ISOLATION + AAR`.

The target is War Career `42/42`, Command byte-identical and `94/94`, plan `19/19` with every name
unchanged, and the serialized adjacent browser set. The command-owner static wall narrows only enough
to permit the single read-only `_activeId` target selector while still rejecting command reputation,
writes, and aliases.

The four surgical binds are predeclared. A removes the sole production transition call; only row 1
may red. B bypasses the relationship-specific event/credit-copy dedupe so the pair applies twice;
only row 1 may red. C changes the one production `emergent-timeline` token to unsourced
`historical-authored`; only row 2 may red because sanitation strips the unsupported claim while
preserving the structural emergent result. D classifies predecessor delta as successor-personal;
only row 4 may red. Every mutation uses focused probes serially, every complete artifact is read, and
the inverse must restore source and generated hashes exactly before a green rerun. No red tooth may
land in git. Slice E politics, Slice F archive, data, combat, T2/T3/Auto, save version, command
runtime/probe, and After Action composition remain closed.

### Shipped boundary

D407 implements this contract without widening it. War Career is 42/42 browser plus 29/29 static,
Command remains byte-identical at 94/94, and the plan remains 19/19. The four predeclared binds each
bit only its named scope: A and B row 1, C row 2, and D row 4; every inverse restored exact bytes
before rebuilt green reruns. `C.loot.journey` remains the sole mutable relationship owner, Command is
read only through the exact target selector, source history is unchanged, and `_SAVE_VER` remains 1.
Slice E late-war political pull is a separate, untouched take; Slice F and all combat/data/tactical
producer expansion remain closed.

## 17 · D408 Slice E political-pull contract

### Inventory and selected rung

D408 is planning only. It inventories the production authority paths and selects exactly one first
capability. `warCareerCapabilities` has no production consumer at this boundary; every political key
is still `false` and no UI or mutator reads it.

| Surface | Rendering entrypoint | Wiring entrypoint | Underlying mutator | Current capability owner | Career / no-career behavior | Candidate guard |
|---|---|---|---|---|---|---|
| Decisions desk | `_wdRefresh` → `decRenderTab` through both `openWarDept` shells | `decWireTab` → `_decWireCards` | `decResolve` → `_decApply` | `nationalDecisions` | Career currently equals legacy; no consumer exists | shared decision access reader in render, wire, and `decResolve` |
| Between-battle decisions | `h0iDecisions` and legacy interstitial → `decInterstitialHTML` | `decWireInterstitial` → `_decWireCards` | `decResolve` → `_decApply` | `nationalDecisions` | Career currently equals legacy | same shared decision access reader |
| Cabinet delegation/advice | `presRenderCabinet` | `presWireCabinet` and `cabWire` | delegated flags and `cabHeed` | `cabinetMutation` | Career currently equals legacy | every legacy and full-cabinet handler plus direct mutators |
| High-command appointments | command tab/card renderers | command UI handlers | `cmdAppoint`, `cmdPromote`, `cmdTransfer`, `cmdCommission`, `cmdSeatCorps`, `cmdSeatDivision` | `appointmentMutation` | Career currently equals legacy | every command handler and all six direct mutators |
| Treasury, diplomacy, armory, and war-effort actions | their `_wdRefresh` render branches | module-specific wire functions | multiple resource/state mutators | `resourceMutation` | Career currently equals legacy | each module handler and direct mutator family |

`nationalDecisions`, human-facing **Matters of State**, is selected. It is the smallest complete rung
because both visible paths converge on one renderer/wirer family and one direct mutator in
`src/32-decisions.js`. `appointmentMutation` spans six direct command functions and their handlers;
`cabinetMutation` spans both the legacy and full-cabinet delegation/advice paths; `resourceMutation`
spans several independent systems. Those keys remain false and unconsumed.

### Date plus earned authority

`WAR_CAREER_POLITICAL_DATE_BIND:QUALIFYING_RECEIPT_YEAR_1864_OR_LATER`

Matters of State require both conditions:

1. `warCareerRole(C).id === "general-command"`, including its existing reconstructed current-person
   billet, alive/present, hand-off, service-window, and qualifying-credit proof; and
2. the latest sanitized qualifying credit owned by the current person has an independently validated
   participation receipt whose canonical `battleYear >= 1864`.

The receipt's `battleYear` is the date authority. The live `C.clock.year`,
`C.president.date`, battle surname, chain aggregate, saved capability boolean, saved scalar, rank text,
rapport, command projection, or source-history rewrite cannot satisfy it. Date alone cannot unlock
politics, and General Command earned before 1864 remains locked until a qualifying 1864-or-later
receipt exists. A live clock advanced into 1864 without that receipt remains locked. The shared pure
reader returns capability, missing-date, and missing-authority reasons separately so UI and direct
calls enforce the same law.

### Visible defer and complete guard

Before unlock, every pending decision remains visible in the Decisions tab and between-battle
surface as a **Visible defer**. Situation, options, historical notes, teaching, provenance, and
sources remain readable. Each Decide control remains a native focusable button with visible text,
`aria-disabled="true"`, an activation guard, and a nearby explanation naming the missing late-war date,
earned General Command authority, or both. Text and semantic state carry the lock; color never does.
No pending card resolves automatically, disappears because of the career, or resolves in the
player's name. `decOnResolve` continues to initialize, expire, and enqueue cards under the shipped
strategic law, so the war cannot freeze and the defer is visible rather than silent accumulation.

After unlock, the shipped choice/effect behavior is unchanged. Read-only teaching, sources,
strategic situation, public-war readouts, resolved history, every H0 tab, and both President's Desk
shells remain visible. Both `openWarDept` implementations and `_wdRefresh` continue to route the
Decisions tab; `H0_DESK_TABS` retains it; `h0iDecisions`, `decRenderTab`, and
`decInterstitialHTML` use the shared access reader; `_decWireCards` refuses a locked activation; and
`decResolve` guards before `_decApply`. Direct calls therefore cannot bypass a disabled UI.

Legacy or no-career campaigns bypass the capability gate and remain byte-equivalent to the shipped
President experience. Malformed, inactive, unavailable, fallen, captured, retired, war-ended,
pending-hand-off, foreign-person, stale-service, stale-run, wrong-side, nonqualifying, pre-1864, or
unproved career state fails closed. Sanitation derives access from existing validated receipts on
every read/load; it persists no new authority field and keeps `_SAVE_VER=1`.

### Future runtime boundary and proof

The separate runtime slice may edit only:

- `src/106-war-career.js` for the pure receipt-derived capability reader;
- `src/32-decisions.js` for the shared visible-defer UI/wiring and direct-mutator guard;
- `tools/probe-war-career.mjs` for focused browser/static proof;
- `tools/probe-war-career-loop-plan.mjs` only to convert this D408 contract boundary to a shipped
  Slice-E boundary after runtime is complete;
- `civil_war_generals.html` only as generated output from `node tools/build.mjs`; and
- canonical status, decision, design, run-log, and coordination docs.

Do not touch `src/30-president-shell.js`, `src/99-h0-president-desk.js`,
`src/101-h0-between-battle.js`, or `src/20-president-render.js`: their existing routing must be proven
through the shared decision seam, not rewritten. Also forbidden are data, manifest, frozen base,
suite manifest, Command runtime/probe, cabinet runtime, Treasury, Diplomacy, Armory, War Effort,
T2/T3/Auto, After Action, combat, casualty, winner, score, AI, objective, reinforcement, balance,
relationships, save version, Slice F, and every other lane.

The focused probe adds one bounded D408 browser row and the minimum static walls needed to prove all
render, wire, and direct-call paths. Five byte-restored negative binds are mandatory:

1. remove only the UI focusable semantic lock while leaving `decResolve` guarded; only the D408 row reds;
2. weaken `battleYear >= 1864` to admit 1863; only the D408 row reds;
3. weaken General Command/current-person receipt authority; only the D408 row reds;
4. gate the legacy/no-career path; only the D408 row reds; and
5. bypass visible defer by resolving, dropping, or applying a pending choice while locked; only the D408 row reds.

Each inverse restores source and generated hashes byte-for-byte before the next green rerun. Runtime
must retain every D400-D407 row, 29 static walls, Command 94/94, plan 19/19 names/order, suite 130
with War Career row 38, 24/54/1512/24 integration, sweep 24, and `_SAVE_VER=1`. Slice F stays closed.

### D409 reachability halt — the unlock needs a lawful multi-year person first

The first runtime take (2026-07-16) verified this contract against the live built game before any
runtime edit and HALTED. Empirically: all 1,465 career-startable Army Register people carry a
single-year service window (generated slot people take the scenario year unconditionally;
replacement records override with one documented `year`); §14/§15 law bounds alternate-timeline
service by the canonical window and restricts authored cross-rung targets to `phases[]`-registered
exact chain rungs, whose complete live set is US antietam/vicksburg/gettysburg/chickamauga/
chattanooga/nashville and CS antietam/gettysburg/chickamauga/chattanooga/nashville — the only 1864
member being nashville; and General Command needs four promotions while a single-1864-window person
can reach at most two qualifying rungs. The two unlock conditions above are therefore mutually
exclusive for every person the game can currently produce: the focused "unlocks" proof cannot be
built inside this section's runtime allowlist, and shipping the gate would permanently lock every
Matters-of-State decision for every career player. DECISIONS D409 records the halt and four options;
the recommendation is a separate planning-first reachability contract (citation-grade multi-year
`serviceStart`/`serviceEnd` bounds on documented replacement records such as Elisha Hunt Rhodes
1861-1865, the narrow src/37 replacement-adapter carry, and the authored nashville-1864 assignment
ladder) before a fresh DRIVE take implements this §17 contract unchanged. Nothing in this section's
law moved at the halt.

---

## 18 · D410 reachability contract (the Slice-E unlock becomes lawfully earnable)

### Approval and scope

Approval provenance, verbatim: "Aaron approved DECISIONS.md D409 option 1 on 2026-07-16: a
separate planning-first reachability contract (citation-grade multi-year service bounds on a
documented replacement record, the narrow src/37 replacement-adapter carry, and an authored
nashville-1864 assignment ladder), then a fresh DRIVE take implementing the unchanged D408 §17
runtime."

That approval line is the authorization the D411 reachability runtime cites for its data-lane
movement. D411's exact runtime surface is three files plus proof and docs:
`data/soldier-replacements.json` (the Rhodes service bounds and one new end-bound source row),
`src/37-loot-survival.js` (the record-level bounds carry), and `src/106-war-career.js` (six
authored `_WC_TIMELINE_ASSIGNMENTS_V1` rows), plus `tools/probe-war-career.mjs` (one new browser
row and one new static wall), the `tools/probe-war-career-loop-plan.mjs` transition, generated
`civil_war_generals.html` from `node tools/build.mjs`, and canonical docs. D411 gets its own fresh
committed LANE-005 DRIVE take; **D410 ships none of it** — D410 is planning only and moves no
runtime, data, probe-suite, or generated byte. After D411 is green, committed, pushed, and
released, a further separate take implements the D408 §17 Matters-of-State runtime unchanged.

### Source-bounded service law

`WAR_CAREER_REACHABILITY_BIND:SERVICE_BOUNDS_ARE_SOURCED_NEVER_INVENTED`

Service bounds are documented facts, never invented. `serviceStart`/`serviceEnd` may enter a
replacement record only with an exact supporting source using the existing normalized citation
fields (`title, author, repository, locator, url, type, note`). The single-year window the D409
halt exposed is a registry artifact, not a sourced claim; replacing it with documented bounds is
source honesty, not reach.

For Elisha Hunt Rhodes (`pid person_bullrun_us_2ri_rhodes`, replacing
`ss:bullrun1:US:us_burnside:pvt`): he enlisted as a private in the 2nd Rhode Island Infantry on
June 5, 1861, and served through the war, mustering out in 1865 as colonel of the regiment. The
bounds are therefore exactly `serviceStart:1861, serviceEnd:1865`. The record's existing four
sources were verified against the live record at D410: the Rhode Island Historical Society finding
aid (MSS 1089) and the Rhode Island Heritage Hall of Fame biography document the June 5, 1861
enlistment — the 1861 start bound is already supported — but **no existing source row states the
1865 muster-out, so D411 must add exactly one normalized citation-grade source row for the end
bound**, named exactly:

| Field | Exact value |
|---|---|
| `title` | `All for the Union: The Civil War Diary and Letters of Elisha Hunt Rhodes` |
| `author` | `Elisha Hunt Rhodes; Robert Hunt Rhodes, ed.` |
| `repository` | `Vintage Books (Vintage Civil War Library)` |
| `locator` | `ISBN 0-679-73828-2` |
| `type` | `primary` |
| `note` | The note must state the documented claim: Rhodes's diary runs from his June 1861 enlistment through the 2nd Rhode Island's 1865 muster-out, which he ended as the regiment's colonel. |

D411 must verify that claim through the normal citation pipeline before landing it. The record's
`year:1861` (the Bull Run source-battle year), `rank:"Private"`, provenance, persona, portrait,
team, and every other field stay byte-identical; the bounds and the one source row are the entire
data movement. If the sources genuinely cannot support an exact bound, D411 must HALT — a bound is
never rounded, widened, or inferred from narrative.

### Adapter carry law (the contract for D411's src/37 change)

A replacement record carrying valid `serviceStart` AND `serviceEnd` yields a materialized person
with those exact own-property bounds and **no `serviceYear` pin**; every record without both valid
bounds keeps today's single-`year` law byte-for-byte.

Exact validity, precedence, and fail-closed law:

1. **Validity.** Bounds are valid only as a pair: both present, both finite integers within
   `1800-1900`, `serviceStart <= serviceEnd`, and the record's required single `year` inside
   `[serviceStart, serviceEnd]`. `ssValidateSoldierReplacementPack` carries a valid pair into the
   clean record; the clean-record shape gains only these two optional fields.
2. **Precedence.** In `_ssApplySoldierReplacements`, a clean record with a valid bounds pair sets
   `p.serviceStart`/`p.serviceEnd` to exactly those integers and sets no `p.serviceYear` (the
   replaced generated slot's `serviceYear` is not carried and the record `year` pin is skipped).
   The existing replaced-person bounds carry and the existing
   `if (r.year != null) p.serviceYear = r.year;` single-year law remain byte-identical on the
   no-bounds path — that literal line must survive so the shipped focused static wall holds.
3. **Fail closed, never widened.** Malformed bounds (only one of the pair, non-integer, outside
   `1800-1900`, `start > end`, or `year` outside the pair) are dropped through reconstruction: the
   clean record carries no bounds and the person receives exactly today's single-`year` window. An
   invalid bound can therefore never widen a window, and no other record's behavior may move.
4. **No semantics change.** `_wcServiceWindowValid` and every validator keep their exact shipped
   semantics: a bounds-pair person is valid for every year inside `[start, end]` and nothing
   outside; this is existing law (verified live at D410: bounds `1861-1865` admit 1861-1865 and
   reject 1860/1866), not new law.

Complete consumer enumeration (every site reading person service fields across `src/` and
`tools/`, verified by grep at D410 — D411 must prove non-Rhodes people and all existing probes
remain byte-identical across all of them):

- `src/37-loot-survival.js`: `_ssUnitSpecs` (generated slot `serviceYear:<scenario year>`,
  unchanged), `_ssAddPerson` (spec→person carry of all three fields, already bounds-capable),
  `_ssApplySoldierReplacements` (THE D411 edit site), the record cleaner inside
  `ssValidateSoldierReplacementPack` (THE D411 edit site), `_ssJourneySnapshot` and
  `_ssCleanJourney` (save/load sanitation already carries bounds), `_ssCareerParticipationV1`'s
  v2 `sourceKeys`/`timelineKeys` lists, and `_ssCareerBattleYear` (canonical year, person-free).
- `src/106-war-career.js`: `_wcServiceValue`/`_wcServiceWindowValid` (window law, untouched),
  `_wcCleanSourceRef`/`_wcSourceRefFromPerson` (bounds flow into `sourceRef`),
  `_wcTimelineAssignmentId` (bounds are id inputs), `_wcTimelineRefFromRow`/`_wcCleanTimelineRef`,
  `_wcCalculateAdvancement` (career-start year `serviceYear` fallback; Rhodes uses canonical
  bullrun1 1861), `warCareerDeriveAdvancement` (copies canonical service keys onto `J.person`,
  deleting absent keys — a bounds person therefore carries no stale `serviceYear`),
  `_wcKnownPresent` (comrade eligibility already respects bounds), and the
  `_WC_SOURCE_REF_KEYS`/`_WC_TIMELINE_REF_KEYS` lists.
- `tools/probe-war-career.mjs`: the static wall pinning the single-year replacement law, the D360
  snapshot leak wall covering `serviceStart`/`serviceEnd`, and the existing service fixtures and
  malformed-service matrix — all existing rows must stay green unchanged.
- `tools/probe-war-career-loop-plan.mjs`: the D404/D405 fixture pins and reference key lists
  (planning-side; they transition at D411 with documented history).

The Army Register count stays exactly **1512** — the bounds change a replacement in place; no new
person, row, or slot is created.

### Ladder fixture — verified against the live registry at D410, no guessing

The exact seven-rung Rhodes path on the US chain. Rung 1 is the v1 own-source receipt at Rhodes's
canonical slot; rungs 2-7 are authored `_WC_TIMELINE_ASSIGNMENTS_V1` rows, each with
`personId:"person_bullrun_us_2ri_rhodes"`, `sourceSlotPid:"ss:bullrun1:US:us_burnside:pvt"`,
`side:"US"`, `slotPid` in canonical `ss:<scenarioId>:US:<unitId>:<slot>` form, `chainIndex` as
listed, `serviceStart:null, serviceEnd:null, serviceYear:<rung year>`, `timelineGrade` as listed,
`provenance:"Inferred"`, and `label:"Your Timeline"`. Every target was verified live at D410 as a
unique non-hq `_wcTimelineTarget` (unit id occurring exactly once across ALL phases of its
scenario, in exactly one named `phaseId`), with an open slot (no replacement record occupies it),
a valid service window at the rung year, and rank-compatible grade:

| Rung | Chain idx | Scenario | Phase | Unit / slot | Grade at result | Year | Assignment id |
|---|---|---|---|---|---|---|---|
| 1 | 1 | `bullrun1` | (own v1 source slot) | `us_burnside` / `pvt` | Private → Sergeant | 1861 | (none — v1 receipt) |
| 2 | 9 | `antietam` | `sunkenroad` | `us_french` / `nco` | Sergeant → Captain | 1862 | `wcta-fa53w4` |
| 3 | 14 | `vicksburg` | `forlorn-hope` | `us_deg_battery` / `cmd` | Captain → Major | 1863 | `wcta-inib47` |
| 4 | 15 | `gettysburg` | `day1` | `us_hall_battery` / `cmd` | Major → Lt. Col. | 1863 | `wcta-154xy3w` |
| 5 | 16 | `chickamauga` | `the-woods` | `us_lilly_battery` / `cmd` | Lt. Col. → Colonel | 1863 | `wcta-azt21w` |
| 6 | 17 | `chattanooga` | `missionary-ridge` | `us_hazen_mr` / `cmd` | Colonel → Brig. Gen. | 1863 | `wcta-7u1ul0` |
| 7 | 27 | `nashville` | `redoubts-montgomery-hill` | `us_r_battery` / `cmd` | Brig. Gen. (no further promotion) | 1864 | `wcta-9cpe74` |

This satisfies the D406 promotion law exactly: seven decisive victories at 4 merit each reach the
`4 * (promotions + 1)` thresholds 4/8/12/16/20/24 on rungs 1-6, reputation (+3 per decisive
victory) never goes negative, Private→Sergeant accepts the `pvt` slot, Sergeant→Captain accepts
`nco`, and every later promotion uses `cmd`. The latest qualifying receipt after rung 7 carries
canonical `battleYear 1864` while reconstructed authority is General Command — exactly the two
§17 unlock conditions. Antietam's `us_french` (French's Division, II Corps, the Sunken Road
infantry fight) and Chattanooga's `us_hazen_mr` (Hazen and Willich's momentum line at Missionary
Ridge, where regimental colonels led the charge) were discovered live because multi-phase T8
scenarios repeat most unit ids across phases; a repeated id fails `_wcTimelineTarget`. Vicksburg
`us_deg_battery`, Gettysburg `us_hall_battery`, Chickamauga `us_lilly_battery`, and Nashville
`us_r_battery` were already validated timeline targets at D406 and the D409 halt; per-person row
uniqueness (`personId + side + chainIndex + scenarioId`) makes their reuse beside the D406
battery-captain rows legal. Every placement is explicitly alternate — Inferred, "Your Timeline" —
and claims nothing about Rhodes's documented service beyond the sourced bounds.

The verified all-alive fixture run id is **`run-us-d410-1`** (the first candidate in the bounded
scan): its seven deterministic fate rolls under decisive victory, computed live via `_wcHash`
(`[runId, creditKey, personId, slotPid, "personal-fate"]` mod 1000, alive at `>= 100`), are
`196, 204, 264, 380, 855, 688, 736` for rungs 1-7. Canonical rung years were verified live as
`1861, 1862, 1863, 1863, 1863, 1863, 1864`, and `_wcServiceWindowValid` with bounds `1861-1865`
passes every rung year. The full artifact is `.tmp/d410-reachability-fixture.json` (gitignored;
`ok:true`, zero errors, zero pageerrors, register 1512, Rhodes unique by person and slot).

### Count and pin transitions (declared now so no later session trips)

- **Move at D411, with documented history:** the plan probe's `srcTree`
  (`13544d1904aaa1ff3ade0c6deaa2f2d5`), `runtime`/106 (`adc2dd9583c85cde86bbfb142cb6d666`),
  `journey`/37 (`d9bc846734683c4ebcb00babbcc161ab`), `focused` (`23e67503bed073d46f9f31ff3b715012`),
  `dataTree` (`b0d7f440836b60a4f18401b2d7b03f48`), and `game` HTML
  (`502aee3fc5867b970225a59c06cd6102`) pins.
- **Never move:** `base` (`c9db83fa99230ffb95bdfdfe059f3fb9`), `manifest`
  (`7924da858de403cac58caabf8c9fcce8`), `suite` (`4bcdc6f252389a4bfd6bed269b52f8f0`), T2
  (`feef8a3c1ecf5fb28a120d2398ee61fc`), T3 (`56e2cd1060a40eb0754b19e8d56bacdb`), Auto
  (`4f0bd0970ef96c09b62ea44694387f80`), After Action (`e2a4739946b20b1a725a08d55b4825f6`),
  Command (`8f12c49f7129b3a9be0203677822e048`), and Command probe
  (`5ffd40fd221179f2e01cad59ef43bf7d`).
- **Focused rows:** D411 adds exactly one browser row — reachability: Rhodes reaches Brig. Gen.
  with a latest nashville-1864 receipt, byte-idempotent sanitation, and no non-Rhodes movement —
  so War Career becomes **43/43** browser; D411 adds exactly one static wall pinning the
  bounds-carry branch, so static walls become **30/30**. The subsequent D408 §17 re-take then adds
  its Matters-of-State row for **44/44** browser — this supersedes the stale "43/43" implied by
  the original D408 expectation (§17's other baselines transition the same way: "29 static walls"
  reads 30 and "plan 19/19" reads the D410 step count with the original 19 names retained; §17's
  law itself is untouched).
- **Unchanged throughout D410 and D411:** suite 130 with War Career row 38; 24 scenarios;
  54 schemas; Army Register 1512; coverage 24; `_SAVE_VER=1`; Command 94/94; D398 remains the
  latest full release battery; `npm run vet:noreg` is NOT run in D410 or D411.

### Exclusions

No new person. No OVR or persona change. No rank rewrite of the source record — Rhodes's Army
Register rank and `sourceGrade` stay Private; Colonel-by-1865 is service-bound documentation and
"Your Timeline" ladder law, never a canonical grade change. No combat, casualty, winner, score,
AI, objective, reinforcement, balance, Command, T2/T3/Auto, After Action, relationship, or
save-version movement. No Slice F. No second career owner. No change to `_wcServiceWindowValid`
or any validator's semantics. D410 itself edits only the planning allowlist (this document, the
appended plan-probe steps, and canonical docs); if any gate cannot hold these locks, HALT.

### D411 shipped (boundary note; the contract text above is retained unchanged)

DECISIONS D411 (2026-07-16, Claude Code Fable, LANE-005 take
`acb8ac5034560414d283a1a673ff12c8248b6435`) implemented this section exactly: the sourced Rhodes
bounds with the one verified "All for the Union" end-bound source row, the fail-closed src/37
adapter carry, the six frozen ladder rows with every assignment id proven equal to its pin, one
focused reachability browser row (War Career **43/43**) and one bounds-carry static wall
(**30/30**), and the declared plan-probe transition (24/24, names/order exact). The "Move at
D411" pins above moved exactly once, documented in D411 and the plan probe: game →
`7de51b310e09a710eb83ade276952203`, dataTree → `3250a3f555de5e648471897978646daf`, srcTree →
`a48ceb72a951d516404f5eec29ec2d2b`, runtime → `91bd8cd3c80e59b510726e29a16c89bb`, journey →
`25c1226edb05f9a1186d0ae4f301656d`, focused → `5e856b3f21e371f867ce99f848c0a155`; every
never-move pin stands. Three byte-restored negative binds bit exactly their declared teeth. The
§17 Matters-of-State runtime remains unimplemented and is the exact next take, unchanged, at
**44/44**.

---

## 19 · D438 Slice F contract — war end and franchise archive

**Status:** contracted 2026-07-18 under LANE-010 (the D431/D432 overnight run); the §10 Slice-F
reservation ("capture before campaign nullification, then add the Chronicle gallery; perform a
save-version migration only if the outer archive cannot remain honest inside the existing
envelope") is scoped here from the D399 pillar: the one remaining career capability after
Matters of State is that a finished war LEAVES A RECORD. The runtime in the same D438 slice
implements exactly this section. VETTING DEFERRED (D431); the probe teeth below are AUTHORED,
not run, and the audit session settles them (AUDIT-DEBT AD-6).

### One archive owner, outside the save envelope

**Bind token:** ARCHIVE_CANONICAL_OWNER:localStorage.cw_career_archive_v1

- The franchise archive lives in ONE device-local store, `localStorage["cw_career_archive_v1"]`
  — deliberately OUTSIDE the campaign save envelope, so `_SAVE_VER` stays 1, nothing rides the
  save, legacy campaigns and every existing save/import/undo vector remain byte-equivalent, and
  the §10 migration clause is discharged without a migration.
- Shape: `{ version: 1, records: [...] }`, newest first, capped at 20 records (oldest dropped).
  Read-side sanitation mirrors the campaign-envelope law: a malformed store or record is
  DROPPED, never repaired; a poisoned/unsafe-key store reads as empty; a localStorage failure
  (private mode, quota) is silently safe in BOTH directions — capture failure never blocks the
  war-end screen, read failure renders no gallery.

### The capture point and the closed record shape

- Capture fires at the SINGLE war-end chokepoint — a `warWonScreen` wrapper installed by
  `src/106-war-career.js` (the shipped D425 wrapper idiom: markers/delegate propagated so no
  probe tooth is blinded) — BEFORE the base nullifies `G.campaign`, and works for both the
  chain-completion and the D119 strategic-conclusion paths (`aarConcludeWar` funnels through
  `warWonScreen`). There is no defeat-side capture because there is no defeat screen (losses
  enter recovery); recorded as the v1 bound.
- The record is a CLOSED shape, `archiveVersion: 1`, assembled by PURE reads (every subsystem
  guarded; a missing reader yields null, never a throw):
  `side` · `final` (true) · `endReason` ("chain" | "will" | "recognition" — the D119 one-shot,
  read before the base consumes it) · `battles`/`won`/`suff`/`infl` (C.stats) · `gradeLetter`
  (aarOverall over _aarDomains, null if unavailable) · `iron` · `ruleset` (the campaign owner's
  id via mayhemRuleset, "historical" fail-closed) · `timelineName` (sanitized or null) ·
  `career` (null unless `C.loot.journey.careerVersion === 1`: `{ name, rank, role, promotions,
  credits, lineageLen, handoffState, mattersOfState }` — all read from the journey's own
  projections, no name-based joins, no new identity namespace) · `capturedAt` (epoch ms).
- NO secrets (never a `cw_llm_*` value), no free-text user input beyond the already-sanitized
  timeline/person names, no receipt bodies (the Mayhem Chronicle owns those in-campaign).

### The Franchise Record gallery

- `warCareerArchiveHTML()` renders the gallery: a compact numbered list (side, end reason,
  grade, battles, the career line when present), newest first, aria-labelled, no interactivity
  beyond reading. v1 surfaces it in ONE place: appended below the war-end report (`#wwReport`'s
  sheet) by the same wrapper AFTER the base renders — the moment the record it just captured is
  most meaningful. A main-menu/desk gallery surface is a deliberate later bound, recorded here.
- The gallery renders ONLY what the sanitized read returns; an empty/unreadable archive renders
  nothing (no empty-state chrome on the war-end screen).

### Exclusions and invariants

No save-version movement; no combat, political, decision, appointment, or resource change; no
new identity namespace or name-based join; no second archive owner; no change to the D408 §17
capabilities, the D410 reachability law, or any shipped Slice A-E surface beyond the wrapper;
Historical/Mayhem both archive (the record carries the ruleset honestly); the frozen base is
untouched (the wrapper is the authorized src-side override idiom already carried by
82/106/107).

### Probe teeth (AUTHORED into tools/probe-war-career.mjs; the audit session runs them)

1. Wrapper install: `warWonScreen._warCareerArchiveWrapped === true` with the base delegate
   propagated; the D425 marker teeth still see every prior wrapper marker.
2. Capture: a finished career campaign (careerVersion 1) run through `warWonScreen` writes
   exactly one record with the closed shape (own-keys check), correct side/battles/grade/career
   fields, and `G.campaign` still nullified after.
3. Strategic end: `aarConcludeWar("will")` captures `endReason:"will"`.
4. Cap + order: 21 captures keep 20, newest first.
5. Sanitation: a malformed store (`"{"`), a record with an extra key, and an unsafe-key store
   each read as empty/dropped; capture into a full/failing localStorage does not throw and the
   war-end screen still renders.
6. Legacy purity: a no-career campaign archives `career: null`; a fresh campaign's serialized
   save is byte-identical to pre-D438 (nothing rides the save).
7. Gallery: after a capture, the war-end sheet contains the Franchise Record section listing
   the new record; with an empty archive the section is absent.
