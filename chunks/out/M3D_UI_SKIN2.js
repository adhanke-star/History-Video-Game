/* ===== M3D_UI_SKIN2.js — fuller art-directed HUD pass (append-only) ===================
   Locked round-2 item 3: a richer, deliberate period pass ON TOP of the conservative
   M3D_UI_SKIN base — still 100% additive CSS in one injected <style id="m3dUiSkin2">,
   no layout logic touched, fully reversible (delete the node). Self-verified via GPU shots
   since Aaron isn't testing. Bare globals; idempotent; never throws.

     1. DRAWN ORDER-ICONS — engraved line glyphs above each order button (March = advancing
        chevrons, Fire = crossed muskets, Charge = cavalry saber, Entrench = spade, Stand
        Down = furled colors). Buttons become small icon-over-label tiles.
     2. RICHER ENGRAVED FRAMES — command panels (#info/#objbar/#log/#turnstrip) gain a
        double inset rule + a brass border-image top accent (struck-plate read).
     3. PERIOD DISPLAY TYPE — panel headings + the crest get small-caps tracking + letterpress
        depth + a brass underline, like an 1860s broadside masthead.
     4. PORTRAIT MAT — the .lead-badge portrait (now a real PD photo) sits in a brass mat.
     5. CARD LANGUAGE — chips (.sidechip/.wxchip) struck-brass; buttons crisper struck metal.
   ------------------------------------------------------------------------------------ */
(function _m3dInstallUiSkin2() {
  try {
    if (typeof document === "undefined") return;
    if (document.getElementById("m3dUiSkin2")) return;            // idempotent
    // engraved line icons (brass-lt #c9a85f stroke), URL-encoded inline SVG
    var ic = function (body) {
      return "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23c9a85f' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'>" + body + "</svg>\")";
    };
    var ICON_MARCH    = ic("<path d='M4 5l6 7-6 7M12 5l6 7-6 7'/>");                              // advancing chevrons
    var ICON_FIRE     = ic("<path d='M4 20L20 5M20 20L4 5'/><path d='M3 18l3 2M21 18l-3 2'/>");   // crossed muskets
    var ICON_CHARGE   = ic("<path d='M3 21c7-2 13-9 17-18'/><path d='M16 3h5v5'/><path d='M3 21l5-4'/>"); // saber
    var ICON_ENTRENCH = ic("<path d='M12 3v8'/><path d='M9 11h6v3a3 3 0 0 1-6 0z'/><path d='M4 21h16'/>"); // spade + line
    var ICON_DONE     = ic("<path d='M7 3v18'/><path d='M7 4c4-2 8 2 12 0v7c-4 2-8-2-12 0'/>");   // furled colors

    var css = [
      /* ---- 1. order buttons -> icon-over-label tiles ---- */
      ".obtn{display:flex!important;flex-direction:column;align-items:center;justify-content:center;gap:3px;",
      "  background:linear-gradient(#2a1f12,#1d150c)!important;box-shadow:inset 0 1px 0 rgba(214,182,120,.14),inset 0 -3px 5px rgba(0,0,0,.34)!important}",
      ".obtn::before{content:'';display:block;width:18px;height:18px;background:no-repeat center/contain;opacity:.92}",
      "#obMove::before{background-image:" + ICON_MARCH + "}",
      "#obFire::before{background-image:" + ICON_FIRE + "}",
      "#obCharge::before{background-image:" + ICON_CHARGE + "}",
      "#obEntrench::before{background-image:" + ICON_ENTRENCH + "}",
      "#obDone::before{background-image:" + ICON_DONE + "}",
      ".obtn[disabled]::before{opacity:.3}",
      ".obtn:hover{box-shadow:inset 0 1px 0 rgba(214,182,120,.22),0 0 0 1px rgba(181,138,60,.4)!important}",

      /* ---- 2. command panels: double engraved rule + brass top accent ---- */
      "#info,#objbar,#log,#turnstrip{box-shadow:var(--shadow),inset 0 0 0 1px rgba(156,122,60,.30),inset 0 0 0 3px rgba(20,14,8,.55),inset 0 2px 0 rgba(214,182,120,.10)!important;",
      "  border-image:linear-gradient(180deg,var(--brass-lt),var(--brass) 14%,transparent 40%) 1!important}",
      "#minicv{box-shadow:var(--shadow),inset 0 0 0 1px rgba(156,122,60,.32)!important}",

      /* ---- 3. period display type on headings + crest ---- */
      "#info .hd,#objbar .hd,#log .hd{font-variant:small-caps!important;letter-spacing:.12em!important;",
      "  text-shadow:0 1px 0 #000,0 -1px 0 rgba(0,0,0,.4)!important;",
      "  background:linear-gradient(#34270f,#221910)!important;",
      "  box-shadow:inset 0 -1px 0 rgba(0,0,0,.5),inset 0 -2px 0 -1px var(--brass)!important}",
      "#topbar .crest{font-variant:small-caps;letter-spacing:.08em;",
      "  text-shadow:0 1px 0 #000,0 2px 2px rgba(0,0,0,.5),0 0 12px rgba(181,138,60,.30)}",

      /* ---- 4. lead-badge portrait mat (brass) ---- */
      ".lead-badge{box-shadow:inset 0 0 0 1px rgba(156,122,60,.28),inset 3px 0 0 rgba(181,138,60,.6)!important;",
      "  background:linear-gradient(#251c10,#1c150c)!important}",
      ".lead-badge img{box-shadow:0 0 0 1px #000,0 0 0 3px var(--brass),0 0 0 4px rgba(201,168,95,.4)!important;",
      "  border:0!important;border-radius:2px!important}",
      ".lead-badge .lnm{font-variant:small-caps;letter-spacing:.04em}",

      /* ---- 5. chips + top buttons: struck brass ---- */
      ".sidechip{box-shadow:inset 0 1px 0 rgba(255,255,255,.14),inset 0 -2px 3px rgba(0,0,0,.34),0 0 0 1px rgba(181,138,60,.25)!important}",
      ".wxchip{box-shadow:inset 0 1px 0 rgba(214,182,120,.12),inset 0 -1px 2px rgba(0,0,0,.3)}",
      ".tbtn{background:linear-gradient(#2a1f12,#1d150c)!important;box-shadow:inset 0 1px 0 rgba(214,182,120,.12),inset 0 -2px 4px rgba(0,0,0,.3)}",
      ".tbtn.go{box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 0 12px rgba(90,138,78,.45)!important}",
      "#turnstrip .tn b{text-shadow:0 1px 0 #000}"
    ].join("\n");

    var st = document.createElement("style");
    st.id = "m3dUiSkin2";
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
  } catch (e) {}
})();
