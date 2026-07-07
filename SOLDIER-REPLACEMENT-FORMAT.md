# Soldier Replacement Format

**Status:** D290 (twenty-two `Verified` records). This is the import lane for replacing generated Soldier's Story representative rows with sourced named people. D152 shipped the empty tooling lane; D154-D158 added the first five narrow sourced replacement slices, D172 added Strong Vincent as the sixth, D214 added Leander Stillwell as the seventh, D215 added John Cook as the eighth, D216 added Orion P. Howe as the ninth, D217 added Francis A. Waller as the tenth, D218 added Samuel N. Benjamin as the eleventh, D219 added Francis C. Barlow as the twelfth, D220 added John H. Worsham as the thirteenth, D221 added Sullivan Ballou as the fourteenth, D222 added Alexander S. Webb as the fifteenth, D239 added John O. Casler as the sixteenth (the first Chancellorsville record), and D289 added three at once — Henry M. Stanley (seventeenth; the first Western-CS record, a Shiloh / 6th Arkansas "Dixie Grays" private), John Dooley (eighteenth; the first Confederate Gettysburg record, a 1st Virginia / Kemper's Brigade lieutenant in Pickett's Charge, in the officer `:cmd` slot), and Joseph H. De Castro (nineteenth; a 19th Massachusetts / Hall's Brigade corporal at the Angle). **D290 added three more at once, a CS-weighted theater-balancing slice** — Berry Benson (twentieth; a 1st South Carolina corporal in McGowan's Bde / A. P. Hill's Light Division at Chancellorsville, `cs_ap_hill_div:nco`), John W. "Johnny" Green (twenty-first; an enlisted man of the 9th Kentucky "Orphan Brigade" at Chickamauga, Breckinridge's Division, `cs_breck_rock:nco` — placed in the NCO slot per the D92 no-deflation rule, since his exact Chickamauga grade is undocumented but he rose to regimental Sergeant-Major), and William H. Tunnard (twenty-second; a sergeant of the 3rd Louisiana who held the Vicksburg 3rd Louisiana Redan, `cs_3rd_louisiana:nco` — the first Vicksburg Confederate record). Side balance is now **14US/8CS**. Haley (US Gettysburg) remains a vetted-and-held candidate (deferred because it works against the side balance); theater balance still favors more Western/CS records.

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
- A canonical record should be added only after the source trail, CLI, build gate, focused browser probe, relevant adjacent probes, JSON/pageerror readback, and `git diff --check` pass. Full no-regression remains a batch/release or explicit-request gate under D176.
