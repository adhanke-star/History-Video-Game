/* ============================================================================
   54-arms-imagery.js  —  H1 : PD ARMS IMAGERY ON THE ARMORY / CANNON-CORPS CARDS
   ----------------------------------------------------------------------------
   A tiny shared presentation helper: given a category ("weapons"/"artillery") and
   a model id, return the period-framed <img> HTML for the build-embedded PD photo
   (from the __ASSETS offline tier, D71/D133), or "" when none is embedded. The
   Armory (55-weapons) and Cannon-Corps (56-artillery) card renders call it.

   PD imagery: Smithsonian-NMAH transparent-PNG cutouts for the small arms + PD
   period photographs / an Edwin Forbes sketch for the field guns (sources + licence
   + period-accuracy recorded in assets/arms-imagery-provenance.json). Two models
   (the Richmond rifle, the Model 1841 howitzer) have no clean PD image and render
   WITHOUT a photo — this helper returns "" and the card is unchanged.

   PRESENTATION-ONLY / combat byte-identical (D74): reads ONLY the __ASSETS global,
   returns a string, touches no sim/data/save, never fldRng. When __ASSETS holds no
   arms tier the helper returns "" -> the cards render exactly as before (byte-identical).
   The img carries alt text (the model name) and a light parchment backing so the
   gun/photo reads on the card; static, so reduceMotion is moot.
   ========================================================================== */
function armsImageHtml(cat, id, name) {
  try {
    var src = (typeof __ASSETS !== "undefined" && __ASSETS && __ASSETS[cat + "/" + id]) || "";
    if (!src) return "";
    // DECORATIVE: the model name + specs are printed in the card text right beside this image, so the
    // photo is redundant for assistive tech -> alt="" (a duplicate alt is screen-reader noise; bug-hunt
    // FINDER#6). aria-hidden keeps it out of the a11y tree entirely.
    return '<div class="arms-img" aria-hidden="true" style="margin:-1px 0 6px;padding:5px 7px;'
      + 'background:linear-gradient(180deg,#efe6cf,#e0d3b0);border:1px solid rgba(120,92,44,.35);'
      + 'border-radius:4px;text-align:center">'
      + '<img src="' + src + '" alt="" loading="lazy" '
      + 'style="width:100%;height:auto;max-height:58px;object-fit:contain;display:block;margin:0 auto">'
      + '</div>';
  } catch (e) { return ""; }
}
