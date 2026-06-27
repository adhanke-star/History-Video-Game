# CUSTOM-SCENARIO-FORMAT.md

Versioned custom battle JSON for the Custom Battle Builder.

## Scope

Custom battles are player-authored, single-phase tactical scenarios for the shared `__FIELD` engine. They are local/shareable data, not canonical historical registry entries. A custom scenario must use an id that starts with `custom_`; it launches only when loaded from the builder, a local slot, or an imported pack.

Phase authoring is deliberately deferred. The live multi-phase engine is for vetted authored historical battles until a phase editor can be probed safely.

## Single Scenario

Top-level shape:

```json
{
  "schema": "cw_custom_battle_v1",
  "scenario": {
    "id": "custom_crossroads_ridge",
    "name": "Crossroads Ridge",
    "date": "Summer 1863",
    "place": "Virginia crossroads",
    "provenance": "Player-authored custom scenario.",
    "attacker": "US",
    "defender": "CS",
    "defaultFog": false,
    "assaultDoctrine": "standard",
    "field": { "w": 1200, "h": 900 },
    "timeLimitSec": 540,
    "holdToWinSec": 100,
    "objective": { "name": "Crossroads Ridge", "x": 600, "z": 445, "r": 125 },
    "terrain": { "hills": [], "woods": [], "walls": [], "markers": [] },
    "oob": { "US": [], "CS": [] },
    "reinforcements": [],
    "leaders": { "US": [], "CS": [] },
    "supply": {
      "US": { "name": "Union ammunition train", "x": 585, "z": 850 },
      "CS": { "name": "Confederate ammunition train", "x": 615, "z": 70 }
    }
  }
}
```

The builder can also import a bare scenario object or `{ "customBattle": { ... } }`; exports use the wrapped schema above.

## Scenario Pack

Use packs to share multiple custom battles at once:

```json
{
  "schema": "cw_custom_battle_pack_v1",
  "format": "cw_custom_battle_v1",
  "title": "My Custom Battle Pack",
  "scenarios": [
    { "id": "custom_first_field", "name": "First Field" },
    { "id": "custom_second_field", "name": "Second Field" }
  ]
}
```

The pack importer validates every scenario before installing anything. It installs only into empty local custom-battle slots, refuses duplicate ids, refuses packs larger than the six local slots, and never adds custom ids to the historical battle registry.

## Guardrails

- Custom data cannot define `phases[]`.
- Prototype-pollution keys are scrubbed during import.
- Battle-specific combat tuning keys such as `damage`, `fireScale`, `killScale`, `casualtyScale`, `lethality`, and `gunFireWeight` are rejected.
- Artillery must use the universal gun model: `guns` plus a realistic crew count of 12-40 men per gun.
- Validation normalizes field sizes, coordinates, unit ids, terrain marks, and text lengths into bounded values.
- Custom scenarios may add terrain/OOB/timing/doctrine data, but they do not create per-battle damage rules.

## UI

Open **Custom Battle Builder** from the main menu. Use **Template** for a pasteable starter, **Export Scenario** for one battle, **Export Pack** for the current valid draft plus saved slots, and **Import Pack to Slots** to install shared scenarios into empty local slots.
