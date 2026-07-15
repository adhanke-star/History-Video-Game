# War Career Loop — Runtime Contract (D399)

**Status:** D404 dual-reference receipt CONTRACTED planning boundary. The original law remains true:
No runtime, save-version, generated-game, or political-engine change belongs to D399. D404 likewise
authorizes planning only; it does not authorize receipt runtime or Slice C.
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

### Receipt-continuity prerequisite — dual-reference participation-v2 (exact next runtime)

Before Slice C, implement only the §14 coexisting `cw_war_career_participation_v2` receipt path and
its exact Haley Gettysburg→Chickamauga proof. Preserve D401 v1 receipts unchanged. The bounded runtime
surface is `src/106-war-career.js`, `src/37-loot-survival.js`, and
`tools/probe-war-career.mjs`; the existing manifest entry remains unchanged. The planning guard
`tools/probe-war-career-loop-plan.mjs` may also move in that same commit only to replace its D404
planning hashes/absence teeth with exact receipt-prerequisite completion teeth. Its original ten
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

### Exact next runtime proof and closed seams

The receipt-continuity prerequisite must extend the focused War Career probe with all of these
controls before Slice C:

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
