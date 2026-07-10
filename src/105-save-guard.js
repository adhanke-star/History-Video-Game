/* ===========================================================================
   J-polish · 105-save-guard.js — E13 SAVE-TAMPER GUARD (D244) + E50 CAMPAIGN
   ENVELOPE DEEP GUARD (D353).

   OVERRIDES (listed in manifest `overrides`; base fns shadowed by
   redeclaration, the D44-class frozen-engine override pattern):

     loadLocal — base.html:3130. Byte-for-byte the base validation PLUS one
                 added rejection: a settings object carrying an OWN enumerable
                 "hasOwnProperty" key (the same posture D234's _slValidSave
                 already takes on every slot/import lane) now reads as corrupt.
                 Every failure path still returns null, exactly like base.

     applySave — base.html:3156. Same merge semantics, two hardenings: the
                 for..in walk tests keys via Object.prototype.hasOwnProperty
                 .call (the tamper-proof form — base called src.hasOwnProperty,
                 which a tampered save shadows with a non-callable and throws),
                 and the pollution skip-list gains "hasOwnProperty" so the
                 shadow key can never land on G.settings, where the base
                 engine's own settings iteration would later call it.

   WHY REDECLARATION, NOT THE 91-save-slots REASSIGNMENT-WRAPPER IDIOM: the
   base boot lane (base.html:3983 `var sv = loadLocal(); … if (sv)
   applySave(sv);`) executes at SCRIPT-EVALUATION time, mid-file — before any
   module IIFE runs — so a wrapper assigned at module eval would arrive too
   late and a tampered autosave would still crash the boot. Top-level
   duplicate function declarations are hoisted at script instantiation with
   last-in-source winning, so these declarations are already the live
   bindings when the boot lane executes.

   BYTE-IDENTITY (the guarded-seam law): a legitimate save — any object
   JSON.parse produces from serializeSave output — never carries an own
   "hasOwnProperty", so both functions behave exactly as base on every save
   the game itself ever wrote. Only a hand-tampered payload diverges: reject
   at load (the autosave reads as absent, like every other corruption mode),
   sanitize at apply (skip the poison key, never throw). The remaining accept
   lanes (slots, import, paste) were already guarded by D234's _slValidSave.

   E50 (D353): the D244 screens covered ONLY sv.settings — the campaign
   envelope was accepted wholesale (`G.campaign = sv.campaign || null`), and
   ~20 downstream sites iterate save-derived campaign sub-objects with the
   callable form `raw.hasOwnProperty(k)` (the D323 Transfer sink
   `raw.ids.hasOwnProperty(k)` in 35-command.js is the directly verified
   crash: a tampered save shadows it with a non-callable own property and
   command initialization throws on the first Command-tab open). The fix is
   a DEEP own-"hasOwnProperty" scan of the whole campaign envelope, enforced
   at every accept lane:

     loadLocal    — a deep-poisoned campaign autosave reads as corrupt (null),
                    so hasSave() is false and the boot stays on the menu.
     applySave    — ATOMIC: the campaign envelope is scanned BEFORE the
                    settings loop, so a rejected payload applies NOTHING
                    (no partial settings, no campaign replacement).
     _slValidSave — (91-save-slots.js) the slot-read / import / undo lanes
                    reject the same way.

   The scanner itself — _slCampaignPoisoned — lives in 91-save-slots.js (this
   module stays override-only, exactly the two redeclarations; the D244 static
   tooth pins that). Function-declaration hoisting makes it live before the
   eval-time boot lane runs, the same mechanism these overrides rely on.

   A legitimate save — anything serializeSave ever wrote — never carries an
   own "hasOwnProperty" at any depth (JSON.parse of game output cannot
   produce one), so every legit save stays byte-identical through all lanes.

   Touches NO combat knob, NO RNG, NO G.battle; never bumps _SAVE_VER.
   =========================================================================== */

/* ---- loadLocal OVERRIDE (base.html:3130 + the E13 tamper rejection) ---- */
function loadLocal() {
  try {
    var raw = localStorage.getItem(_SAVE_KEY);
    if (raw === null || raw === undefined) return null;
    var sv;
    try {
      sv = JSON.parse(raw);
    } catch (parseErr) {
      return null;
    }
    // Version gate (strict equality — future versions must bump ver)
    if (!sv || sv.ver !== _SAVE_VER) return null;
    // Shape gate — settings must be an object (not null, not array)
    if (!sv.settings || typeof sv.settings !== "object" || Array.isArray(sv.settings)) return null;
    // E13 (D244): a settings object whose OWN "hasOwnProperty" shadows the prototype
    // method is a tampered payload — treat it exactly like corrupt JSON.
    if (Object.prototype.hasOwnProperty.call(sv.settings, "hasOwnProperty")) return null;
    // E50 (D353): the same posture, DEEP, on the whole campaign envelope — a
    // shadow anywhere inside it would crash a downstream callable-form iterator
    // (the D323 raw.ids Transfer sink is the verified case).
    if (_slCampaignPoisoned(sv.campaign)) return null;
    return sv;
  } catch (e) {
    // localStorage.getItem itself can throw on file:// in Safari
    return null;
  }
}

/* ---- applySave OVERRIDE (base.html:3156, tamper-proof iteration) ---- */
function applySave(sv) {
  // E50 (D353): ATOMIC rejection — scan the campaign envelope BEFORE any
  // mutation, so a deep-poisoned payload applies neither settings nor campaign.
  if (_slCampaignPoisoned(sv && sv.campaign)) return;
  var src = sv.settings;
  var own = Object.prototype.hasOwnProperty;
  for (var k in src) {
    if (!own.call(src, k)) continue;
    // Pollution skip-list: the base trio, plus E13's "hasOwnProperty" so the
    // shadow key can never be copied onto G.settings.
    if (k === "__proto__" || k === "constructor" || k === "prototype" || k === "hasOwnProperty") continue;
    G.settings[k] = src[k];
  }
  G.campaign = sv.campaign || null;
}
