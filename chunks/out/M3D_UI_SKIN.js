/* ===== M3D_UI_SKIN.js — additive period-engraving HUD polish (append-only) ===========
   G8 (conservative): elevate the 2D HUD to sit beside the cinematic 3D, WITHOUT touching
   the existing (already cohesive) period design system or any layout/logic. Pure additive
   CSS injected as one <style> — engraved brass hairlines on the command panels, a struck
   metal sheen on the top bar + buttons, and a letterpress depth on display headings. Every
   rule re-states the original box-shadow then ADDS an inset (no layout shift), so it's fully
   reversible (delete the <style id="m3dUiSkin">). Bare globals; idempotent; never throws.
   ------------------------------------------------------------------------------------ */
(function _m3dInstallUiSkin() {
  try {
    if (typeof document === "undefined") return;
    if (document.getElementById("m3dUiSkin")) return;       // idempotent
    var css = [
      /* top command bar — struck-brass plate: inner sheen + engraved base rule */
      "#topbar{box-shadow:var(--shadow),inset 0 1px 0 rgba(214,182,120,.16),inset 0 -3px 5px rgba(0,0,0,.34)!important;",
      "  border-bottom-width:1px!important;border-image:linear-gradient(90deg,transparent,var(--brass),transparent) 1!important}",
      "#topbar .crest{text-shadow:0 1px 0 #000,0 0 10px rgba(181,138,60,.25)}",
      /* command panels — engraved inset brass frame (no layout change) */
      "#info,#objbar,#turnstrip{box-shadow:var(--shadow),inset 0 0 0 1px rgba(156,122,60,.22),inset 0 1px 0 rgba(214,182,120,.10)!important}",
      "#log{box-shadow:var(--shadow),inset 0 0 0 1px rgba(120,96,52,.18)!important}",
      "#info .hd,#objbar .hd{background:linear-gradient(#33260f,#241a10)!important;box-shadow:inset 0 -1px 0 rgba(0,0,0,.4)}",
      /* buttons — subtle struck-metal top sheen + crisper engraved hover */
      ".tbtn,.obtn,.mbtn{box-shadow:inset 0 1px 0 rgba(214,182,120,.10),inset 0 -2px 4px rgba(0,0,0,.28)}",
      ".tbtn:hover,.obtn:hover{box-shadow:inset 0 1px 0 rgba(214,182,120,.18),0 0 0 1px rgba(181,138,60,.35)}",
      ".tbtn.go{box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 0 12px rgba(90,138,78,.4)}",
      /* lead badge — brass plate with engraved left rule */
      ".lead-badge{box-shadow:inset 0 0 0 1px rgba(156,122,60,.20),inset 3px 0 0 rgba(181,138,60,.5)}",
      /* display headings — period letterpress depth */
      ".title-xl{text-shadow:0 1px 0 #000,0 2px 1px rgba(0,0,0,.5),0 0 18px rgba(181,138,60,.18)}",
      ".sidechip{box-shadow:inset 0 1px 0 rgba(255,255,255,.12),inset 0 -2px 3px rgba(0,0,0,.3)}",
      /* minimap + info bars get a hairline brass key-line */
      "#minicv{box-shadow:var(--shadow),inset 0 0 0 1px rgba(156,122,60,.25)}",
      ".bar{box-shadow:inset 0 1px 2px rgba(0,0,0,.55)}"
    ].join("\n");
    var st = document.createElement("style");
    st.id = "m3dUiSkin";
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
  } catch (e) {}
})();
