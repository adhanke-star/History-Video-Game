/* ============================================================================
   52-leaders-imagery.js  —  H1 : PD LEADERS-IN-THE-FIELD IMAGERY ON THE CODEX (D136)
   ----------------------------------------------------------------------------
   The sibling of 53-usct-imagery.js. Given a CODEX "People" entry id, return a
   period-framed, CAPTIONED <figure> for the build-embedded PD photograph (from the
   __ASSETS offline tier, D71/D133), or "" when none is embedded. The Codex People
   cards (84-codex `_cxEntryHTML`) call it AFTER usctImageHtml, so the 4 figures that
   carry a USCT image (Douglass / Tubman / Shaw / Forrest) keep that one and the
   other ~20 leaders get their famous wartime / in-the-field portrait here.

   PD imagery: famous Brady / Gardner / Library-of-Congress / National-Archives /
   National-Portrait-Gallery photographs of the war's leaders and figures (Lincoln at
   Antietam, Grant at Cold Harbor, Lee, Davis, Sherman, Jackson, Meade, Thomas,
   Sheridan, Cleburne, Farragut, Barton, Dix, Walker, ...). Sources + licence +
   period-accuracy recorded in assets/leaders-imagery-provenance.json; every item is a
   PD/CC0 wartime-era work, each VIEWed before embed (the discipline caught 11 wrong
   pulls this milestone — a Stanton that was a USCT family, a "Jefferson Davis" that was
   the UNION general Jefferson C. Davis, group photos, and engravings).

   DELIBERATE COMPLEMENTARITY (not the 128px badge `portraits` tier): the game already
   embeds 155 tiny badge portraits (D133, keyed by portrait key). This `leaders`
   category is a separate, larger (400px) CODEX-resolution tier keyed by CODEX ENTRY ID
   and biased to "leader in the field" wartime photographs — complementary, not a dup.

   WHY a CAPTION + descriptive ALT (vs. the arms cutouts' decorative alt=""): these are
   INFORMATIVE teaching photographs — they show the actual people the prose teaches — so
   each carries a real descriptive alt (announced to assistive tech) AND a visible
   <figcaption> naming the subject + the holding institution (citation-grade, anti-Lost-
   Cause: the captions name slavery as the Confederacy's cause, Stephens' Cornerstone
   Speech, Cleburne's emancipation proposal, Longstreet's postwar vilification, Thomas
   the loyal Virginian).

   PRESENTATION-ONLY / combat byte-identical (D74): reads ONLY the __ASSETS global +
   the LEADER_IMG static meta below, returns a string, touches no sim/data/save, never
   fldRng. When __ASSETS holds no leaders tier the helper returns "" -> every card
   renders exactly as before (byte-identical). Static image -> reduceMotion moot.
   CVD-safe (no colour-encoded meaning).
   ========================================================================== */

/* Curated alt/caption/credit per embedded id (= codex People entry id), sourced from
   assets/leaders-imagery-provenance.json; kept inline so this module is a pure read-out
   of __ASSETS + a constant. `credit` is the holding institution, shown small under the caption. */
var LEADER_IMG = {
  "abraham-lincoln": {
    alt: "President Abraham Lincoln, in a tall hat, standing among Union officers before the tents at Antietam in October 1862.",
    caption: "President Abraham Lincoln with Gen. McClellan and officers at Antietam, October 1862 — Lincoln pressed his cautious general to pursue Lee.",
    credit: "Library of Congress (Alexander Gardner)"
  },
  "jefferson-davis": {
    alt: "A wartime carte-de-visite portrait of Jefferson Davis, President of the Confederacy.",
    caption: "Jefferson Davis, President of the Confederacy — the government its own leaders founded to preserve and extend slavery.",
    credit: "Library of Congress"
  },
  "robert-e-lee": {
    alt: "A full-length wartime portrait of Gen. Robert E. Lee standing in his Confederate uniform.",
    caption: "Gen. Robert E. Lee, commander of the Army of Northern Virginia, in an 1863 wartime portrait.",
    credit: "Minnis & Cowell, 1863"
  },
  "ulysses-s-grant": {
    alt: "A photograph of Lt. Gen. Ulysses S. Grant standing beside a tree before his headquarters tents at Cold Harbor.",
    caption: "Lt. Gen. Ulysses S. Grant at his Cold Harbor headquarters, 1864 — the general who pressed the war relentlessly to its end.",
    credit: "National Archives (Brady)"
  },
  "william-tecumseh-sherman": {
    alt: "A wartime portrait photograph of Maj. Gen. William T. Sherman in uniform.",
    caption: "Maj. Gen. William T. Sherman, whose 1864 campaigns through Georgia and the Carolinas broke the Confederacy’s war-making capacity.",
    credit: "National Archives"
  },
  "thomas-stonewall-jackson": {
    alt: "A wartime portrait photograph of Lt. Gen. Thomas “Stonewall” Jackson in a Confederate uniform coat.",
    caption: "Lt. Gen. Thomas “Stonewall” Jackson, photographed in 1863, weeks before he was mortally wounded by his own men at Chancellorsville.",
    credit: "Public domain (1863)"
  },
  "james-longstreet": {
    alt: "A wartime carte-de-visite of Lt. Gen. James Longstreet in a Confederate uniform.",
    caption: "Lt. Gen. James Longstreet, Lee’s senior corps commander; after the war he became a Republican and was vilified by Lost Cause writers seeking a scapegoat.",
    credit: "Public domain (wartime CDV)"
  },
  "george-b-mcclellan": {
    alt: "A wartime portrait photograph of Maj. Gen. George B. McClellan, seated in uniform.",
    caption: "Maj. Gen. George B. McClellan, organizer of the Army of the Potomac, whose caution let Lee escape after Antietam.",
    credit: "Library of Congress (Brady)"
  },
  "george-g-meade": {
    alt: "A wartime portrait photograph of Maj. Gen. George G. Meade in uniform.",
    caption: "Maj. Gen. George G. Meade, who took command of the Army of the Potomac days before defeating Lee at Gettysburg.",
    credit: "Library of Congress (Brady)"
  },
  "george-h-thomas": {
    alt: "A wartime portrait photograph of Maj. Gen. George H. Thomas in uniform.",
    caption: "Maj. Gen. George H. Thomas, the “Rock of Chickamauga” — a Virginian who stayed loyal to the Union and shattered the Army of Tennessee at Nashville.",
    credit: "Library of Congress (Brady)"
  },
  "philip-sheridan": {
    alt: "A wartime portrait photograph of Maj. Gen. Philip H. Sheridan in uniform.",
    caption: "Maj. Gen. Philip H. Sheridan, whose 1864 Shenandoah Valley campaign stripped the Confederacy of one of its last granaries.",
    credit: "Library of Congress (Brady)"
  },
  "braxton-bragg": {
    alt: "A wartime portrait photograph of Gen. Braxton Bragg in a Confederate uniform.",
    caption: "Gen. Braxton Bragg, the contentious commander of the Confederate Army of Tennessee.",
    credit: "Library of Congress"
  },
  "patrick-cleburne": {
    alt: "A wartime portrait of Maj. Gen. Patrick Cleburne in a Confederate uniform.",
    caption: "Maj. Gen. Patrick Cleburne, the “Stonewall of the West,” who in 1864 proposed arming and freeing enslaved men for the Confederacy — and was never promoted again.",
    credit: "Public domain (wartime)"
  },
  "david-farragut": {
    alt: "A wartime portrait photograph of Rear Adm. David G. Farragut in a naval uniform.",
    caption: "Rear Adm. David G. Farragut, who forced Mobile Bay in 1864 — “Damn the torpedoes, full speed ahead.”",
    credit: "Library of Congress"
  },
  "edwin-m-stanton": {
    alt: "A wartime portrait photograph of Edwin M. Stanton, bearded and wearing spectacles.",
    caption: "Edwin M. Stanton, Lincoln’s resolute Secretary of War, who organized the Union’s vast war machine.",
    credit: "Library of Congress (Brady)"
  },
  "william-h-seward": {
    alt: "A wartime portrait photograph of William H. Seward, seated in profile holding a top hat.",
    caption: "William H. Seward, Secretary of State, whose diplomacy kept Britain and France from recognizing the Confederacy.",
    credit: "Library of Congress (Brady)"
  },
  "alexander-h-stephens": {
    alt: "A wartime portrait photograph of the thin, youthful-looking Alexander H. Stephens.",
    caption: "Alexander H. Stephens, Confederate Vice President, whose 1861 “Cornerstone Speech” declared slavery the cornerstone of the new government.",
    credit: "Library of Congress"
  },
  "clara-barton": {
    alt: "A Civil War portrait of Clara Barton in profile — the likeness she authorized.",
    caption: "Clara Barton, the “Angel of the Battlefield,” who carried supplies and nursed the wounded at Antietam and Fredericksburg.",
    credit: "Library of Congress"
  },
  "dorothea-dix": {
    alt: "A daguerreotype of Dorothea Dix, seated at a writing desk.",
    caption: "Dorothea Dix, Superintendent of Army Nurses for the Union, who built the army nursing corps.",
    credit: "National Portrait Gallery, Smithsonian"
  },
  "mary-edwards-walker": {
    alt: "A full-length portrait photograph of Dr. Mary Edwards Walker in her reform dress.",
    caption: "Dr. Mary Edwards Walker, Union army surgeon and the only woman ever awarded the Medal of Honor.",
    credit: "National Portrait Gallery, Smithsonian"
  }
};

var _ldrEsc = (typeof htmlEsc === "function") ? htmlEsc : function (s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
};

/* leaderImageHtml(id) -> a captioned <figure> for the embedded PD image, or "" when none. */
function leaderImageHtml(id) {
  try {
    var src = (typeof __ASSETS !== "undefined" && __ASSETS && __ASSETS["leaders/" + id]) || "";
    if (!src) return "";
    var m = LEADER_IMG[id] || {};
    var alt = m.alt || "Period photograph";
    var cap = m.caption || "";
    var credit = m.credit || "";
    return '<figure class="leader-img" style="margin:0 0 9px;padding:7px;'
      + 'background:linear-gradient(180deg,#efe6cf,#e3d6b4);border:1px solid rgba(120,92,44,.4);'
      + 'border-radius:5px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.35)">'
      + '<img src="' + src + '" alt="' + _ldrEsc(alt) + '" loading="lazy" '
      + 'style="width:100%;height:auto;max-height:230px;object-fit:contain;display:block;margin:0 auto;'
      + 'border:1px solid rgba(70,52,24,.45);background:#2a2118">'
      + (cap ? '<figcaption style="margin-top:5px;font-size:11px;line-height:1.4;color:#4a3a1e;font-style:italic;text-align:center">'
            + _ldrEsc(cap)
            + (credit ? '<span style="display:block;margin-top:2px;font-size:10px;font-style:normal;color:#5a4a2c;letter-spacing:.02em">' + _ldrEsc(credit) + '</span>' : "")
            + '</figcaption>' : "")
      + '</figure>';
  } catch (e) { return ""; }
}
