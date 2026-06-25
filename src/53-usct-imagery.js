/* ============================================================================
   53-usct-imagery.js  —  H1 : PD USCT IMAGERY ON THE TEACHING CARDS (D135)
   ----------------------------------------------------------------------------
   A tiny shared presentation helper: given a CODEX entry id (the asset is keyed by
   it), return a period-framed, CAPTIONED <figure> for the build-embedded PD
   photograph (from the __ASSETS offline tier, D71/D133), or "" when none is
   embedded. The Codex cards (84-codex) and "The Ranks" manpower block (70-manpower)
   call it.

   PD imagery: famous Library-of-Congress / National-Archives photographs + an 1864
   Harper's Weekly engraving + an 1863 recruitment broadside of the U.S. Colored
   Troops and the people of their story (sources + licence + period-accuracy recorded
   in assets/usct-imagery-provenance.json; every item is an 1863-69 PD work).

   WHY a CAPTION + descriptive ALT here (vs. the arms cutouts' alt="" decorative
   treatment, 54-arms-imagery): these are INFORMATIVE historical photographs — they
   show the actual soldiers, leaders, and events the prose teaches — so they carry a
   real descriptive alt (announced to assistive tech) AND a visible <figcaption>
   naming the subject + the holding institution (citation-grade, on the card).

   PRESENTATION-ONLY / combat byte-identical (D74): reads ONLY the __ASSETS global +
   the USCT_IMG static meta below, returns a string, touches no sim/data/save, never
   fldRng. When __ASSETS holds no usct tier the helper returns "" -> every card
   renders exactly as before (byte-identical). Static image -> reduceMotion moot.
   CVD-safe (no colour-encoded meaning).
   ========================================================================== */

/* Curated alt/caption/credit per embedded id (sourced from assets/usct-imagery-provenance.json;
   kept inline so this module is a pure read-out of __ASSETS + a constant — no GAME_DATA dependency).
   `credit` is the holding institution / period source, shown small under the caption. */
var USCT_IMG = {
  "united-states-colored-troops": {
    alt: "A full company of Black Union soldiers of the 4th U.S. Colored Infantry standing at attention in two ranks before a fort, c.1864.",
    caption: "Company E, 4th U.S. Colored Infantry, in the defenses of Washington, c.1864.",
    credit: "Library of Congress"
  },
  "54th-massachusetts-infantry": {
    alt: "Sergeant William H. Carney of the 54th Massachusetts in uniform, holding the United States flag he carried at the assault on Fort Wagner.",
    caption: "Sgt. William H. Carney, 54th Massachusetts — first Black soldier whose deeds earned the Medal of Honor, with the colors he saved at Fort Wagner.",
    credit: "Public domain (1860s)"
  },
  "robert-gould-shaw": {
    alt: "A seated portrait photograph of the young Union colonel Robert Gould Shaw in his uniform and kepi.",
    caption: "Col. Robert Gould Shaw, commander of the 54th Massachusetts, killed leading its assault on Battery Wagner, July 18, 1863.",
    credit: "Public domain (wartime)"
  },
  "frederick-douglass": {
    alt: "A formal carte-de-visite portrait of Frederick Douglass in the 1860s, in a dark suit.",
    caption: "Frederick Douglass — the formerly enslaved abolitionist whose “Men of Color, To Arms!” helped raise the USCT.",
    credit: "Public domain (1860s)"
  },
  "harriet-tubman": {
    alt: "A carte-de-visite portrait of Harriet Tubman, seated with one arm resting on a chair back.",
    caption: "Harriet Tubman, who guided the 1863 Combahee River Raid that freed some 750 enslaved people.",
    credit: "Public domain (1860s)"
  },
  "nathan-bedford-forrest": {
    alt: "An 1864 Harper's Weekly engraving showing Confederate troops killing surrendering Black Union soldiers at Fort Pillow.",
    caption: "The Northern press depicts the massacre of surrendering U.S. Colored Troops at Fort Pillow, April 12, 1864.",
    credit: "Harper's Weekly, April 30, 1864"
  },
  "system-manpower-pool-usct": {
    alt: "An 1863 recruitment broadside showing Black Union soldiers in formation beside the United States flag, captioned “Come and Join Us Brothers”.",
    caption: "“Come and Join Us Brothers” — an 1863 broadside of the Supervisory Committee for Recruiting Colored Regiments.",
    credit: "Public domain (1863)"
  }
};

var _usctEsc = (typeof htmlEsc === "function") ? htmlEsc : function (s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
};

/* usctImageHtml(id) -> a captioned <figure> for the embedded PD image, or "" when none. */
function usctImageHtml(id) {
  try {
    var src = (typeof __ASSETS !== "undefined" && __ASSETS && __ASSETS["usct/" + id]) || "";
    if (!src) return "";
    var m = USCT_IMG[id] || {};
    var alt = m.alt || "Period photograph";
    var cap = m.caption || "";
    var credit = m.credit || "";
    return '<figure class="usct-img" style="margin:0 0 9px;padding:7px;'
      + 'background:linear-gradient(180deg,#efe6cf,#e3d6b4);border:1px solid rgba(120,92,44,.4);'
      + 'border-radius:5px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.35)">'
      + '<img src="' + src + '" alt="' + _usctEsc(alt) + '" loading="lazy" '
      + 'style="width:100%;height:auto;max-height:230px;object-fit:contain;display:block;margin:0 auto;'
      + 'border:1px solid rgba(70,52,24,.45);background:#2a2118">'
      + (cap ? '<figcaption style="margin-top:5px;font-size:11px;line-height:1.4;color:#4a3a1e;font-style:italic;text-align:center">'
            + _usctEsc(cap)
            + (credit ? '<span style="display:block;margin-top:2px;font-size:10px;font-style:normal;color:#5a4a2c;letter-spacing:.02em">' + _usctEsc(credit) + '</span>' : "")
            + '</figcaption>' : "")
      + '</figure>';
  } catch (e) { return ""; }
}
