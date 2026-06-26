/* ============================================================================
   51-scenes-imagery.js  —  H1 : PD BATTLE-SCENE IMAGERY ON THE PRE-BATTLE BRIEFING (D137)
   ----------------------------------------------------------------------------
   The sibling of 52-leaders-imagery.js / 53-usct-imagery.js. Given a CAMPAIGN BATTLE
   id, return a period-framed, CAPTIONED <figure> banner for the build-embedded PD
   photograph of that ACTUAL FIELD (from the __ASSETS offline tier, D71/D133), or "" when
   none is embedded. bridgeBriefingHTML (85-battle-bridge) calls it once, at the head of
   the briefing, keyed by the next campaign battle's id (bd.id) — the player sees the real
   ground before they fight on it.

   PD imagery: famous Gardner / O'Sullivan / Barnard / Russell Library-of-Congress
   photographs of the war's fields — the Sunken Road dead at Antietam, the stone-wall dead
   at Marye's Heights, "A Harvest of Death" at Gettysburg, the Rappahannock pontoon
   bridges, the Vicksburg siege lines, Sudley Ford at Bull Run. Sources + licence +
   period-accuracy recorded in assets/scenes-imagery-provenance.json; every item is a
   PD wartime-era PHOTOGRAPH, each VIEWed before embed (the discipline caught a 1917
   birdseye panorama, two battle maps, and a book engraving this milestone -> those fields
   are documented IMAGELESS rather than shown a non-photograph).

   DIGNITY-SENSITIVE (the D135 Fort-Pillow precedent). The only period photographs of
   several of these fields ARE the photographs of the dead — among the first images of
   the American dead ever shown to the public. They are chosen deliberately and framed
   honestly: the captions name the cost plainly and never glorify; the right plate is
   matched to the right field (no staging one battle's dead onto another).

   WHY a CAPTION + descriptive ALT (vs. the arms cutouts' decorative alt=""): these are
   INFORMATIVE teaching photographs — they show the actual field the briefing precedes —
   so each carries a real descriptive alt (announced to assistive tech) AND a visible
   <figcaption> naming the scene + the holding institution (citation-grade).

   PRESENTATION-ONLY / combat byte-identical (D74): reads ONLY the __ASSETS global + the
   SCENE_IMG static meta below, returns a string, touches no sim/data/save, never fldRng.
   When __ASSETS holds no scenes tier (or the id is unmapped) the helper returns "" -> the
   briefing renders exactly as before (byte-identical). The briefing is a strategy-layer
   screen, not the combat path; seed-for-seed combat byte-identity stays owned by
   probe-presets. Static image -> reduceMotion moot. CVD-safe (no colour-encoded meaning).
   ========================================================================== */

/* Curated alt/caption/credit per embedded id (= campaign battle id), sourced from
   assets/scenes-imagery-provenance.json; kept inline so this module is a pure read-out of
   __ASSETS + a constant. `credit` is the holding institution, shown small under the caption.
   Only the 6 MARQUEE ids with a VIEW-verified PD wartime photograph appear here; malvern /
   shiloh / chickamauga are documented IMAGELESS in the provenance (no clean PD photo exists)
   and simply have no entry -> the helper returns "" for them. */
var SCENE_IMG = {
  "bullrun1": {
    alt: "A wartime photograph of Sudley Ford on Bull Run near Manassas, Virginia, with a stone ford crossing, a soldier, a wagon, and a house on the hill beyond.",
    caption: "Sudley Ford on Bull Run, where McDowell’s flanking column crossed to open the first great battle of the war in July 1861 — a Union rout that taught the North the war would be long.",
    credit: "Library of Congress"
  },
  "antietam": {
    alt: "A wartime photograph of Confederate soldiers lying dead along the Sunken Road (“Bloody Lane”) at the Antietam battlefield.",
    caption: "Confederate dead along the Sunken Road (“Bloody Lane”) at Antietam, September 1862 — the bloodiest single day in American history, and among the first photographs of the American dead ever shown to the public.",
    credit: "Library of Congress (Alexander Gardner)"
  },
  "fredericksburg": {
    alt: "A wartime photograph of Union pontoon bridges spanning the Rappahannock River at Fredericksburg, Virginia.",
    caption: "Union pontoon bridges across the Rappahannock at Fredericksburg, 1862 — Burnside’s army crossed here to be cut down in futile charges against the stone wall at Marye’s Heights.",
    credit: "Library of Congress (T. H. O’Sullivan / A. Gardner)"
  },
  "chancellorsville": {
    alt: "A wartime photograph of Confederate dead lying behind the stone wall at the foot of Marye’s Heights, Fredericksburg, in May 1863.",
    caption: "Confederate dead behind the stone wall at Marye’s Heights, May 3, 1863 — Sedgwick’s corps stormed the heights at Second Fredericksburg during the Chancellorsville campaign, taking ground that had been a slaughter-pen five months before.",
    credit: "Library of Congress (Andrew J. Russell)"
  },
  "vicksburg": {
    alt: "A wartime photograph of the Shirley House standing on a hillside amid the dug-in Union siege lines at Vicksburg, Mississippi.",
    caption: "The Shirley House amid the Union siege works at Vicksburg, 1863 — Grant’s army dug in around the city until its July 4 surrender split the Confederacy along the Mississippi.",
    credit: "Library of Congress"
  },
  "gettysburg": {
    alt: "A wartime photograph titled “A Harvest of Death” showing soldiers lying dead in a field at Gettysburg, Pennsylvania, in July 1863.",
    caption: "Timothy O’Sullivan’s “A Harvest of Death” — the dead on the field at Gettysburg, July 1863. The war’s turning point cost some 50,000 casualties in three days.",
    credit: "Smithsonian American Art Museum (T. H. O’Sullivan / A. Gardner)"
  }
};

var _scnEsc = (typeof htmlEsc === "function") ? htmlEsc : function (s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
};

/* sceneImageHtml(battleId) -> a captioned <figure> banner for the embedded PD field
   photograph, or "" when none (unmapped id, no embed, or a falsy id) -> byte-identical. */
function sceneImageHtml(battleId) {
  try {
    if (!battleId) return "";
    var src = (typeof __ASSETS !== "undefined" && __ASSETS && __ASSETS["scenes/" + battleId]) || "";
    if (!src) return "";
    var m = SCENE_IMG[battleId] || {};
    var alt = m.alt || "A wartime photograph of the battlefield.";
    var cap = m.caption || "";
    var credit = m.credit || "";
    return '<figure class="scene-img" style="margin:0 0 12px;padding:8px;'
      + 'background:linear-gradient(180deg,#efe6cf,#e3d6b4);border:1px solid rgba(120,92,44,.4);'
      + 'border-radius:5px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.35)">'
      + '<img src="' + src + '" alt="' + _scnEsc(alt) + '" loading="lazy" '
      + 'style="width:100%;height:auto;max-height:300px;object-fit:contain;display:block;margin:0 auto;'
      + 'border:1px solid rgba(70,52,24,.45);background:#2a2118">'
      + (cap ? '<figcaption style="margin-top:6px;font-size:11px;line-height:1.45;color:#4a3a1e;font-style:italic;text-align:center">'
            + _scnEsc(cap)
            + (credit ? '<span style="display:block;margin-top:2px;font-size:10px;font-style:normal;color:#5a4a2c;letter-spacing:.02em">' + _scnEsc(credit) + '</span>' : "")
            + '</figcaption>' : "")
      + '</figure>';
  } catch (e) { return ""; }
}
