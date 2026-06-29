# Soldier Replacement Format

**Status:** D157. This is the import lane for replacing generated Soldier's Story representative rows with sourced named people. D152 shipped the empty tooling lane; D154 added the first narrow sourced replacement slice, D155 added the second, D156 added the third, and D157 adds the fourth.

Canonical file: `data/soldier-replacements.json`

Validator/importer:

```bash
node tools/import-soldier-replacements.mjs
node tools/import-soldier-replacements.mjs --check candidate-pack.json
node tools/import-soldier-replacements.mjs --import candidate-pack.json
node tools/import-soldier-replacements.mjs --import candidate-pack.json --write
```

`--import` is a dry run unless `--write` is present. The write path only updates the fixed canonical file and first writes a backup under `.tmp/soldier-replacement-backups/`.

## Schema

Top level:

```json
{
  "schema": "cw_soldier_replacements_v1",
  "records": []
}
```

Each record replaces exactly one generated slot:

```json
{
  "pid": "person_bullrun_us_2ri_example",
  "replacePid": "ss:bullrun1:US:us_burnside:pvt",
  "name": "Full sourced name",
  "side": "US",
  "rank": "Private",
  "branch": "inf",
  "role": "private soldier",
  "year": 1861,
  "provenance": "Verified",
  "team": {
    "side": "US",
    "army": "Army of Northeastern Virginia",
    "corps": "",
    "division": "Hunter's Division",
    "brigade": "Burnside's Brigade",
    "regiment": "2nd Rhode Island Infantry",
    "company": "Company A"
  },
  "persona": {
    "tactical": 64,
    "command": 64,
    "initiative": 64,
    "resolve": 64,
    "discipline": 64,
    "marksmanship": 64,
    "vigor": 64,
    "charisma": 64,
    "aggression": 64,
    "grit": 64,
    "logistics": 64,
    "engineering": 64,
    "cavalry": 64,
    "artillery": 64,
    "political": 64
  },
  "sources": [
    {
      "title": "Source title",
      "author": "Author or compiler",
      "repository": "Archive, publisher, or collection",
      "locator": "Page, roster line, OR volume, card number, or URL locator",
      "url": "Optional URL",
      "type": "primary",
      "note": "What this source supports"
    },
    {
      "title": "Independent second source",
      "repository": "Archive, publisher, or collection",
      "locator": "Locator",
      "type": "secondary",
      "note": "What this source supports"
    }
  ],
  "sourceNote": "Short rationale tying the sources to identity, rank, unit, and ratings.",
  "portrait": {
    "assetKey": "portraits/<embedded-key-without-extension>",
    "alt": "Descriptive alt text.",
    "caption": "Visible caption, including any rank/date caveat.",
    "credit": "Holding institution.",
    "rights": "Rights statement.",
    "url": "https://example.org/source"
  },
  "bio": "Optional short sourced note."
}
```

The example above is a placeholder shape only. Do not import it as content.

## Gate Rules

- `pid` is the new stable sourced-person id. It must not use the generated `ss:` namespace.
- `replacePid` is the current generated representative row to replace. It must start with `ss:` and must target a generated row in the live registry.
- `provenance` must be `Verified` or `Disputed`. `Verified` requires at least two independent sources. `Disputed` also requires at least two sources plus `disputeNote`.
- `persona` must include every rating attribute. Missing attributes are rejected so a neutral default cannot be mistaken for sourced ratings.
- `portrait` is optional. If present, `assetKey` must point to an embedded `portraits/<key>` asset, and `alt`, `caption`, and `credit` are required. Caption any rank/date caveat honestly; a later officer portrait must not be implied to show the soldier at the replacement rank.
- `generated: true`, `source: "Generated"`, prototype keys, duplicate `pid`, duplicate `replacePid`, malformed teams, and under-cited records are rejected.
- A canonical record should be added only after the source trail, CLI, build gate, focused browser probe, and no-regression gate pass.
