# Open History / Mayhem Mode — dual-ruleset design

**Status:** D416 planning law. Runtime is not yet authorized.

**Owner:** LANE-007 (`open-history-mayhem`).

**Supersedes:** D382's universal consequence-only / never-scored interpretation and the
short-lived surrender-consequences contract committed at `41b6051`. No runtime or probe teeth
landed under that contract.

**Reuses:** `GRAND-STRATEGY-PLAN.md` §§0, 5-6, 9-11, 27; the shipped wildcard/divergence,
campaign, tactical, save, and After Action seams. This is not a second game.

---

## 1. Decision in one page

The game has two campaign rulesets:

1. **Historical** — the current teaching wargame. Historical scenarios, sourced claims,
   period availability, dignity restrictions, and consequence-only handling continue unchanged.
2. **Mayhem** — an opt-in, high-agency alternate-history sandbox. All historical gameplay
   guardrails are unlocked. The player may combine people, formations, sides, eras, technology,
   policies, actions, rewards, and outcomes without a plausibility rail or moral report card.

These are rulesets, not difficulty levels. A player may choose Historical + easy, Historical +
brutal, Mayhem + easy, or Mayhem + brutal. The existing `playStyle` and
`altHistoryEmergentOnly` settings remain separate preferences.

Mayhem is allowed to be mechanically consequential. A declared Mayhem action may change or grant:

- battlefield, phase, objective, campaign, or style score;
- casualties and casualty credit;
- winner/result classification and victory progress;
- enemy will, morale, discipline, press, diplomacy, or political state;
- resources, loot, weapons, technology, promotions, reputation/notoriety, and achievements;
- unit, side, faction, leader, policy, timeline, cultural, or identity-tag advantages;
- scenario availability, OOB membership, reinforcements, terrain, and timeline branches.

This is the binding reversal of the prior restriction:

`MAYHEM_MODE_BIND:DECLARED_ACTIONS_MAY_SCORE_CREDIT_AND_GRANT_TAGGED_ADVANTAGE`

Mayhem does not issue a moral GPA or a plausibility grade. It tells the player what the declared
rules did and records the resulting timeline. Historical comparison is optional and off by
default in Mayhem.

The only global constraints retained are engineering and product-truth constraints:

- one campaign, one battle engine, one result bridge, one save envelope, and one effect pipeline;
- no hidden one-off battle hacks when a declared data-driven effect can express the rule;
- no arbitrary code from imported content;
- fiction is never silently presented as a Verified historical claim;
- accessibility, save isolation, deterministic replay, and probe coverage remain mandatory.

Those constraints do not judge the player's choices and do not limit Mayhem's authored outcomes.

---

## 2. Player-facing mode contract

### 2.1 Public names and copy

Use original public copy. `Borderlands-like` is an internal tone reference, not a title, asset
source, or license.

**Historical Campaign**

> Fight the documented war. Historical forces, timing, choices, and teaching context remain in
> force, while your battlefield performance determines the result.

**Mayhem Campaign — Break the Timeline**

> Mix eras, people, weapons, policies, rewards, and outcomes. The game tracks what happens; it
> does not grade your morality or historical plausibility.

Both cards receive equal visual weight. Historical is the compatibility fallback, not the
morally preferred button. Mayhem is neither hidden behind an advanced menu nor labeled an easier
or superior reward mode.

### 2.2 Mode matrix

| Rule | Historical | Mayhem |
|---|---|---|
| Historical OOB, rank, date, and availability locks | Enforced | Optional or replaceable |
| Plausibility tiers | Labeled and taught | No gameplay gate |
| Previously teaching-only people/events/battles | Existing exclusions remain | May be authored as playable content |
| Surrender/no-quarter/atrocity handling | Existing consequence-only/no-reward law | May be playable, scored, rewarded, and linked to authored advantages |
| Score and casualty credit | Existing resolver | Declared effects may add, remove, redirect, or replace credit |
| Result/winner | Earned through the Historical engine | Earned normally or explicitly modified by a visible Mayhem effect |
| Faction/identity powers | Historical inputs only | Authored asymmetric tag abilities allowed |
| Symmetry | Historical asymmetry with normal balance law | Not required; each content pack owns its balance target |
| Citation gate | Required for factual claims | Not required for fiction; historical claims still sourced |
| ALT-HISTORY labels | Existing per-content labels | One persistent Mayhem ruleset label; no warning on every card |
| AAR | Existing graded teaching report | Performance/reward/style readout; no moral or plausibility GPA |
| Compare to real history | Current teaching payoff | Optional, off by default |
| Difficulty/realism | Independent | Independent |

### 2.3 Tone

Mayhem is quick, legible, colorful, and generous with agency: bold cards, exaggerated but original
headlines, punchy rewards, strong silhouettes, short mechanical copy, and celebratory feedback.
It does not require gore or grim spectacle to communicate power. Content can be serious, absurd,
heroic, ruthless, or chaotic; the interface reports mechanics rather than assigning virtue.

---

## 3. Canonical state and lifecycle

### 3.1 One owner

The canonical campaign owner is:

```js
C.ruleset = {
  id: "historical" | "mayhem",
  version: 1
};
```

No live combat, score, action-availability, or AAR rule reads `G.settings` to determine the mode.
`G.settings.playStyle`, `G.settings.altHistoryEmergentOnly`, tactical presets, difficulty, realism,
accessibility, and audio remain independent.

The public readers are pure:

- `mayhemRuleset(C)` returns a sanitized `{id, version}` view;
- `mayhemIsActive(C)` returns true only for a valid `mayhem` campaign;
- `mayhemCan(actionId, context)` evaluates a registered action against the current ruleset;
- `mayhemModeLabel(C)` returns the visible label.

The only initializer/sanitizer is `mayhemInit(C, requestedId, phase)`:

- `phase="new"` accepts an explicit picker value before the first campaign battle;
- `phase="load"` preserves an exact valid value and defaults missing/malformed values to
  Historical;
- `phase="fork"` may create a new Mayhem timeline from a Historical snapshot;
- every other call is idempotent and cannot change an existing valid ruleset.

### 3.2 New campaigns

Every Union and Confederate new-campaign path passes through the same accessible ruleset picker,
then the existing Standard/Iron muster choice. The ruleset is attached before `_t1InitAll(C)` and
before the first battle launches.

The frozen `build/base.html` remains untouched. A late additive module wraps the live
`_openMusterChoice` and `startCampaign` bindings and carries a bounded pre-start selection into an
`_t1InitAll` wrapper. Calling `startCampaign(side, iron)` without an explicit selection remains
Historical, preserving existing probes and legacy integrations.

The pending pre-start value is cleared in a `finally` path after campaign creation and is never a
runtime authority.

### 3.3 Saves, loads, and named timelines

`serializeSave()` already serializes all of `G.campaign`, so the ruleset rides in `_SAVE_VER=1`.
`src/105-save-guard.js` calls the idempotent sanitizer after a successful campaign restore.
`src/91-save-slots.js` uses the pure reader for slot labels, default names, import preview, undo,
and fork metadata.

Required behavior:

- old save with no ruleset -> Historical;
- malformed/unknown ruleset -> Historical;
- valid Historical save -> Historical after any load/import/undo path;
- valid Mayhem save -> Mayhem after any load/import/undo path;
- loading save A after save B cannot retain B's mode;
- in-run UI and settings cannot mutate the campaign ruleset;
- Historical -> Mayhem requires a newly named forked timeline;
- Mayhem -> Historical conversion is rejected; start or load a Historical timeline instead.

This is an offline, user-owned save file, not a security boundary. A person who hand-edits a valid
local save can alter game state. The fail-closed contract prevents accidental corruption,
cross-save leakage, and UI mutation; it does not pretend to cryptographically authenticate local
JSON.

### 3.4 Standalone launches

Free battle, skirmish, and custom battle have no campaign `C`. Their launch options carry a
sanitized snapshot:

```js
opts.ruleset = { id: "historical" | "mayhem", version: 1 };
```

Missing/malformed values default Historical. The ruleset is copied into the live battle state at
launch and cannot be changed mid-battle. A campaign battle always derives this snapshot from
`C.ruleset`; a global preference cannot override it.

---

## 4. Central Mayhem effect architecture

### 4.1 One declared pipeline

The new module `src/107-mayhem-rules.js` owns ruleset sanitation, action registration, validation,
effect application, deterministic receipts, and mode labels. Content data supplies action and
effect declarations. Domain modules retain their existing state and mutators.

An action declaration has a closed shape:

```js
{
  id: "no-quarter",
  ruleset: "mayhem",
  availableWhen: { /* allowlisted predicates */ },
  actorTagsAny: ["side:US", "side:CS"],
  effects: [ /* allowlisted operations */ ],
  presentation: { label, summary, tone, icon }
}
```

No function body, source string, dynamic property path, `eval`, constructor, or arbitrary import
callback is legal in data or custom content.

### 4.2 Allowed operation families

The Mayhem engine is deliberately broad. The allowlist may include:

- `battle.score.add`, `phase.score.add`, `objective.resolve`;
- `casualty.apply`, `casualty.credit`, `capture.credit`;
- `result.declare`, `result.reclassify`, `campaign.victoryProgress.add`;
- `enemyWill.add`, `morale.add`, `discipline.add`, `press.add`, `diplomacy.add`;
- `funds.add`, `resource.add`, `loot.grant`, `technology.unlock`, `weapon.grant`;
- `career.promote`, `reputation.add`, `notoriety.add`, `achievement.unlock`;
- `modifier.add` for side/faction/unit/identity/leader/policy/timeline tags;
- `roster.add`, `roster.transfer`, `reinforcement.add`, `scenario.unlock`;
- `timeline.branch`, `chronicle.event`.

Historical rejects Mayhem-only operations before mutation. Mayhem may use every declared family.
The operation list is extensible through reviewed code, not arbitrary imported JSON.

### 4.3 Transaction and receipt law

`mayhemApply(actionId, context)` follows one transaction:

1. sanitize ruleset and context;
2. resolve one registered action;
3. validate every predicate and operation without mutation;
4. derive a deterministic receipt id from timeline, battle, phase, actor, action, and sequence;
5. reject stale, duplicate, wrong-mode, wrong-side, forged, or already-consumed receipts;
6. call domain-owned adapters in a fixed documented order;
7. persist one bounded receipt with the declared effects and resulting values;
8. render the same receipt in the result/AAR/Chronicle surfaces.

If any operation is invalid, nothing applies. Retry/load is idempotent. Derived permissions are
recomputed; saved `allowed`, `scored`, or `applied` booleans are never authority.

### 4.4 D74 after D416

D74 remains the single-engine rule, not a ban on Mayhem power. Historical has an empty Mayhem
modifier set and must remain byte-equivalent. Mayhem effects enter through one visible pipeline;
they may change inputs, score, casualties, rewards, or the declared result, including effects that
would be forbidden in Historical. A scattered `if (battleId === ...)` damage/winner hack remains
illegal because it is invisible, untestable, and impossible to compose—not because the outcome is
ahistorical.

---

## 5. Faction, cultural, and identity-tag powers

Mayhem can grant unique powers to racially or culturally identified formations, factions, sides,
leaders, and alliances. The data model uses composable tags rather than a single universal `race`
number:

```text
side:US
side:CS
faction:union
faction:confederacy
unit:usct
identity:black-soldiers
identity:immigrant-brigade
identity:native-alliance
leader:<stable-id>
policy:<stable-id>
timeline:<stable-id>
```

An ability targets a declared tag expression and names its effect. Examples of supported shapes:

- a USCT-tagged formation gains a Mayhem-only resolve and promotion engine;
- a Native-alliance tag unlocks a distinct scouting or terrain kit;
- a faction policy grants loot or score for a specified action;
- a leader tag changes reinforcement, technology, or result options;
- a timeline tag creates a cumulative bonus after a chain of wild choices.

This fulfills the requested racial/identity and faction advantage authority while keeping powers
inspectable, stackable, removable, and isolated from Historical. No universal symmetry rule
requires an opposite-side mirror. Each content pack states its own balance target and counters.

---

## 6. First proving content: surrender / no-quarter vertical slice

The first Mayhem content slice uses the user's rejected restriction as its proof case.

### Historical

- existing surrender and capture behavior remains unchanged;
- any future Historical no-quarter teaching follows the prior consequence-only/no-reward law;
- no Mayhem action, receipt, score, casualty credit, reward, or tag modifier is reachable.

### Mayhem

- a valid surrender/capture context may expose a `No Quarter` action for either side;
- the card states all mechanical effects before confirmation;
- the action may turn captured/surrendering troops into casualties, award casualty and score
  credit, alter objective/result/victory progress, grant loot or reputation/notoriety, and apply
  a side/faction/identity-tag advantage;
- those are legal rewards, not hidden consequences;
- the result receipt identifies exactly which values came from ordinary battle resolution and
  which came from the Mayhem action;
- the AAR describes the action and effects without a moral or plausibility grade.

Final numeric values are a runtime balance decision after deterministic A/B evidence. The first
probe fixture must exercise at least score, casualty credit, one reward, and one tagged advantage
through the production pipeline. It must also prove a declared result override can be represented,
even if the initial production card does not use that operation.

The action does not require Fort Pillow or any other named historical event as a hard-coded combat
branch. Mayhem content packs may later make previously excluded events playable through the same
scenario/action schemas.

---

## 7. Exact live seam inventory

| Owner | Existing seam | Mayhem responsibility |
|---|---|---|
| Frozen base | `startCampaign(side, iron)` | Wrapped late; no base edit |
| Frozen base | `campaignAdvance(winnerSide, type)` | Existing resolver remains canonical; outer Mayhem adapter may transform a validated result receipt before delegation |
| Frozen base | `serializeSave()` / `_SAVE_VER=1` | `C.ruleset` serializes wholesale; no envelope bump |
| `src/105-save-guard.js` | `applySave(sv)` | Call idempotent campaign ruleset sanitizer after accepted restore |
| `src/91-save-slots.js` | `_slValidSave`, `_slCampaignPoisoned`, `_slMeta`, `_slDefaultSlotName`, import/export/undo | Preserve validation; show ruleset; prove cross-slot isolation and named fork |
| `src/98-h0-main-menu.js` + base muster | H0 new campaign buttons -> `_openMusterChoice(side)` | Both sides traverse one ruleset picker; visible mode chip on current save |
| `src/95-playstyle.js` | `G.settings.playStyle` | Presentation emphasis only; never mode authority |
| `src/81-divergence.js` | `divEmergentOnly()` | Historical sub-preference only; optional comparison source for Mayhem |
| `src/80-victory.js` | `_vicApplyWild`, `vicOnResolve` | Existing wildcard catalog is reused; Mayhem effects may add declared wild/result operations |
| `src/90-president-register.js` | `_t1InitAll`, `_t1Resolve` registry | Attach ruleset before initialization; route domain adapters without a second tick |
| `src/tactical/T0-field-sandbox.js` | `fldInitSim(opts)`, `fldLaunchSandbox(opts)` | Sanitize one per-battle ruleset snapshot |
| `src/tactical/T2-campaign-link.js` | `fldLaunchCampaignBattle(C)`, `fldCampaignApplyOutcome(o)` | Carry campaign ruleset and validated Mayhem receipts across the one bridge |
| `src/tactical/T11-custom-battle.js` | custom draft/import/launch | Add enum only; imports reference allowlisted ids, never code |
| `src/tactical/T25-surrender.js` | surrender/captured/missing state | Emit the real action context; do not create a second surrender simulation |
| `src/82-after-action.js` | `_aarDomains`, `aarRenderReport` | Historical unchanged; Mayhem selects the non-moral performance/reward readout |
| `src/103-h0-after-action.js` | H0 AAR shell | Show the ruleset and Mayhem receipts using the shared AAR owner |
| `src/37-loot-survival.js`, `src/35-command.js`, `src/106-war-career.js` | loot, reputation/command, promotion/career | Domain adapters consume validated effect operations; Mayhem engine does not duplicate their ledgers |

The Living War Chronicle is planned by D382 but not yet a shipped runtime owner. Until it exists,
Mayhem receipts ride the existing divergence/AAR surfaces. The Chronicle later consumes those
receipts; it does not become a second source of truth.

---

## 8. UX and accessibility

### 8.1 Picker

- real buttons or radio-group controls with accessible names and `aria-checked`/`aria-pressed`;
- mode name and full short description in text, not color or icon only;
- visible focus, logical tab order, Escape/Back, and focus restoration;
- selected state announced once through `a11yAnnounce`, never on every render;
- 200% zoom, narrow phone width, high contrast, and reduced motion supported;
- Mayhem confirmation reads `Start Mayhem Campaign`; Historical reads `Start Historical Campaign`;
- no preselected moral framing. Legacy/direct starts fail closed Historical.

### 8.2 Persistent labels

Show a compact text chip on:

- current-campaign main menu/Continue;
- save-slot, export, import preview, and timeline-gallery rows;
- President's Desk header;
- battle briefing and result/AAR;
- custom/free-battle launch and result.

The chip is the standing fiction boundary. Mayhem content does not repeat an ALT-HISTORY warning
on every card.

### 8.3 AAR

Historical retains the current report. Mayhem replaces moral/plausibility grading with:

- result and score;
- casualties and credited casualties;
- spoils and unlocks;
- wild effects and active tag powers;
- notable choices and named timeline changes;
- optional `Compare with documented history` disclosure, closed by default.

Mayhem may grade battlefield skill, strategy, build synergy, speed, or style. It may not grade the
player as morally good/bad or historically plausible/implausible.

---

## 9. Persona success paths and exploit guards

| Persona | Success path | Exploit/confusion guard |
|---|---|---|
| Newcomer | Two clear mode cards; Mayhem copy promises freedom; defaults remain playable | Mode, difficulty, and Ironman are separate steps; no jargon-only description |
| History buff / teacher | Historical remains intact; Mayhem can optionally compare a timeline to the record | Mayhem fiction never receives a Verified badge or fabricated citation |
| Wargame veteran | Historical baseline remains deterministic; Mayhem declares every modifier and result operation | No invisible battle-id branch; receipts expose origin and stacking order |
| Game-theory min-maxer | Mayhem rewards and tag synergies are real, stackable, and inspectable | All stacking, caps, duplicate receipts, reload, and cross-save paths are probe-locked |

---

## 10. Verification matrix

### Mode and save isolation

1. Direct/legacy `startCampaign(side, iron)` creates Historical.
2. Both H0 Union/Confederate buttons and both legacy-menu paths reach the picker.
3. Historical and Mayhem choices attach before `_t1InitAll` and first battle launch.
4. `C.ruleset` survives autosave, named slot, export/import, undo, Continue, and reload.
5. Missing/unknown/malformed values resolve Historical at `_SAVE_VER=1`.
6. Save A Historical -> load B Mayhem -> reload A remains Historical.
7. UI/global settings cannot mutate the active mode.
8. Historical -> Mayhem works only as a new named fork; Mayhem -> Historical is rejected.
9. Free/custom/skirmish missing ruleset defaults Historical and explicit Mayhem remains local.

### Historical byte-equivalence

10. Same seed/settings/input under the old default and explicit Historical produce identical
    campaign, battle, score, casualty, reward, AAR, and save vectors.
11. Existing 24-scenario registry and both exact `EXPECTED` baselines remain unchanged.
12. Existing wildcard, divergence, play-style, preset, full-campaign, save-slot, field, custom
    builder, AAR, H0, and War Career probes stay green.

### Mayhem authority

13. Historical rejects a Mayhem action before mutation; Mayhem accepts the identical context.
14. One production action applies score, casualty credit, reward, and tagged advantage exactly
    once; save/reload cannot duplicate it.
15. A visible declared result override passes through the same pipeline and receipt model.
16. Wrong side, wrong battle, stale phase, duplicate id, malformed operation, forged tag, and
    unknown action all fail atomically.
17. Side/faction/identity modifiers never leak into Historical or a second save.
18. Mayhem AAR reports every effect and has no moral/plausibility grade.

### Accessibility

19. Keyboard-only picker, confirmation, save fork, action card, AAR, and optional comparison.
20. Screen-reader state/description/focus announcements; no color-only state.
21. Phone + desktop at 200% zoom, high contrast, reduced motion, and no focus trap.

---

## 11. Runtime implementation ladder

Each slice is a separately green commit. Slices A-C are one public feature bundle; do not stop
with a visible Mayhem picker that has no Mayhem authority. Slice A builds and probes the picker
behind one fail-closed `MAYHEM_PUBLIC_READY=false` publication gate; Slice C flips that gate only
after the first real action, rewards, and no-judgment result readout are green.

### Slice A — ruleset kernel, picker, and save isolation

**Files:** `src/107-mayhem-rules.js`, `src/00-manifest.json`, `src/105-save-guard.js`,
`src/91-save-slots.js`, `src/98-h0-main-menu.js`, generated game,
`tools/probe-mayhem-mode.mjs`, suite manifest, canonical docs.

**Delivers:** canonical state/readers/sanitizer; gated new-campaign picker; both-side/H0/legacy
coverage; save labels; load/import/undo isolation; Historical fallback; mode chip. No content
effect yet, and the normal public path stays Historical while `MAYHEM_PUBLIC_READY=false`.

**Gates:** build; `node --check` touched JS/probe; focused Mayhem probe; save-slots; H0 main menu;
play-style; divergence; full campaign; suite list; `git diff --check`. Negative binds: default
Historical removed, mode attached after first launch, mid-run mutation accepted, cross-save mode
leak, and one new-campaign route bypasses the picker.

### Slice B — effect schema, atomic pipeline, and receipts

**Files:** `data/mayhem-rules.json`, `src/107-mayhem-rules.js`, schema validator,
`tools/probe-mayhem-mode.mjs`, generated game, canonical docs.

**Delivers:** closed action/effect schema, operation registry, atomic validation/apply, deterministic
idempotent receipts, domain-adapter interface, and test fixtures for every operation family. No
public action is enabled until Slice C.

**Gates:** importer/schema; build; focused probe; forged/duplicate/partial-transaction binds;
Historical byte-equivalence; adjacent save/full-campaign probes.

### Slice C — first public Mayhem action and no-judgment result readout

**Files:** `src/tactical/T25-surrender.js`, `src/tactical/T2-campaign-link.js`,
`src/107-mayhem-rules.js`, `src/80-victory.js` only if its domain adapter is required,
`src/82-after-action.js`, `src/103-h0-after-action.js`, `data/mayhem-rules.json`, focused probe,
generated game, canonical docs. Do not edit frozen base.

**Delivers:** the two-side `No Quarter` Mayhem card; real surrendered/captured context; score,
casualty credit, reward, and one faction/identity-tag advantage; one receipt; non-moral Mayhem AAR;
Historical action absence and byte-equivalence. The mode becomes a complete public feature here.

**Gates:** build; node checks; focused mode/action probe; surrender; campaign-link; victory;
after-action + H0 AAR; field; presets; full campaign; save slots; exact A/B vectors; result-override
fixture; five atomic-failure binds; JSON/pageerror readback.

### Slice D — procedural, custom, and free-battle unlocks

**Files:** T0, T2, T11, `src/107`, custom format doc/data as required, focused/custom/field/preset
probes, generated game, canonical docs.

**Delivers:** explicit standalone ruleset choice; Mayhem mixing across era/side/leader/weapon/
technology; allowlisted imported action ids; local Mayhem scenarios without polluting the canonical
24-scenario historical registry.

### Slice E — Mayhem AAR, timeline gallery, and Living War Chronicle

**Files:** `src/81-divergence.js`, `src/82-after-action.js`, `src/103-h0-after-action.js`, save-slot
timeline surfaces, a new Chronicle module/data only after its own narrow contract, focused probes,
generated game, canonical docs.

**Delivers:** named Mayhem timelines; receipts rendered as an in-universe chronicle; optional
history comparison off by default; performance/reward/style grading only.

### Slice F — content packs and balance

Build separately testable packs: wild technology, leader/side swaps, faction/identity ability
kits, policy and diplomacy extremes, previously excluded event/battle treatments, extended-war and
postwar timelines, and New Game+ carry. Each pack declares its balance target, counters, effect
ops, tags, source/fiction status, and exact focused gates. No pack gets a hidden runtime branch.

After A-C, run the planned release battery before starting D-F if the suite or browser footprint
has grown materially.

---

## 12. Exclusions and HALT conditions

This planning slice changes no runtime, data, manifest, suite, generated HTML, frozen base,
existing probe, save version, combat value, score, or content availability.

Runtime must HALT before commit if:

- Historical is not byte-equivalent in its declared A/B vector;
- any mode reads a mutable global setting as live authority;
- a valid save can inherit the previously loaded save's mode;
- Mayhem effects require a second result resolver or second campaign tick;
- imported JSON can execute code or name an arbitrary property path;
- a partial effect transaction can land;
- a hidden battle-specific branch replaces the declared effect pipeline;
- the first public release exposes Mayhem without at least one real Mayhem-authority action;
- `_SAVE_VER` must change without a separate migration contract;
- accessibility or browser artifacts are red;
- runtime scope must expand beyond the current slice's committed file/operation allowlist.

---

## 13. Planning baselines and bind

The planning slice freezes:

- 24 historical scenarios and 24-scenario custom-builder baseline;
- 54 data JSON files;
- Army Register 1512;
- tactical coverage 24 and sweep 24;
- suite 130 with War Career row 38;
- `_SAVE_VER=1`;
- generated game `9d7d91078dd8fceea847f1c2aff4dc5f`;
- frozen base `c9db83fa99230ffb95bdfdfe059f3fb9`;
- manifest `7924da858de403cac58caabf8c9fcce8`;
- suite file `4bcdc6f252389a4bfd6bed269b52f8f0`.

`tools/probe-open-history-mayhem-plan.mjs` is suite-excluded and must finish 13/13. Its declared
negative bind changes only `DECLARED_ACTIONS_MAY_SCORE` to `DECLARED_ACTIONS_NEVER_SCORE` in this
file. Exactly `MAYHEM AUTHORITY` must fail; all other steps stay green. Restore this file and the
probe byte-identically before the final run.

---

## 14. Release state after this planning slice

LANE-007 returns to CONTRACT/unowned. The exact next bounded runtime task is Slice A, with Slices
A-C treated as one public feature bundle. No surrender research packet is required before Slice A;
historical sourcing becomes relevant only when a Historical claim or named historical scenario is
authored. Mayhem fiction does not need manufactured citations.
