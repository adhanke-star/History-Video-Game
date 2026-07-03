/* ============================================================================
   102-h0-tactical-hud.js -- H0 prototype slice: tactical HUD + settings
   ----------------------------------------------------------------------------
   Late-bound presentation pass for the real-time field overlay. It preserves the
   existing tactical ids, hotkeys, click handlers, drawer wiring, and sim path.
   ========================================================================== */
(function h0TacticalHudModule() {
  function h0fEsc(v) {
    return (typeof htmlEsc === "function") ? htmlEsc(v)
      : String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function h0fCss() {
    if (typeof document === "undefined" || document.getElementById("h0TacticalHudCss")) return;
    var s = document.createElement("style");
    s.id = "h0TacticalHudCss";
    s.textContent = [
      "#fldRoot.h0f-root{font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif!important;color:#f4efe2!important;background:#080c10!important;letter-spacing:0;}",
      "#fldRoot.h0f-root *{box-sizing:border-box;letter-spacing:0;}",
      "#fldRoot.h0f-root::before{content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 25%,rgba(93,134,183,.12),transparent 42%),repeating-linear-gradient(0deg,rgba(255,255,255,.022) 0,rgba(255,255,255,.022) 1px,transparent 1px,transparent 28px),repeating-linear-gradient(90deg,rgba(216,180,88,.035) 0,rgba(216,180,88,.035) 1px,transparent 1px,transparent 34px);z-index:1;}",
      "#fldRoot.h0f-root #fldGl{z-index:0;}",
      "#fldRoot.h0f-root #fldTop{top:10px!important;left:12px!important;right:12px!important;padding:9px 10px!important;gap:8px!important;background:linear-gradient(90deg,rgba(7,10,12,.92),rgba(20,32,34,.80),rgba(7,10,12,.78))!important;border:1px solid rgba(216,180,88,.30)!important;border-radius:8px!important;box-shadow:0 12px 34px rgba(0,0,0,.36)!important;pointer-events:none!important;font-family:inherit!important;color:#f4efe2!important;z-index:5!important;}",
      "#fldRoot.h0f-root #fldTitle{font-family:inherit!important;font-size:13px!important;max-width:34vw!important;color:#fff3cf!important;text-transform:uppercase!important;font-weight:950!important;}",
      "#fldRoot.h0f-root #fldClock,#fldRoot.h0f-root #fldSector,#fldRoot.h0f-root #fldObj,#fldRoot.h0f-root #fldPhase{font-family:inherit!important;background:rgba(18,28,30,.86)!important;border:1px solid rgba(216,180,88,.32)!important;border-radius:8px!important;color:#f1eadb!important;padding:5px 8px!important;font-weight:800!important;}",
      "#fldRoot.h0f-root #fldPhase{color:#cfe1ff!important;border-color:rgba(93,134,183,.45)!important;}",
      "#fldRoot.h0f-root #fldHud{left:auto!important;right:12px!important;top:74px!important;bottom:auto!important;min-width:280px!important;max-width:360px!important;max-height:calc(100vh - 178px)!important;overflow:auto!important;background:linear-gradient(180deg,rgba(16,25,27,.95),rgba(6,9,12,.95))!important;border:1px solid rgba(216,180,88,.36)!important;border-radius:8px!important;padding:12px!important;font-family:inherit!important;font-size:13px!important;color:#f4efe2!important;box-shadow:0 18px 42px rgba(0,0,0,.50)!important;z-index:6!important;}",
      "#fldRoot.h0f-root #fldHud b,#fldRoot.h0f-root #fldHud strong{color:#fff4d2;}",
      "#fldRoot.h0f-root #fldBar{left:50%!important;right:auto!important;bottom:12px!important;transform:translateX(-50%)!important;display:flex!important;flex-wrap:wrap!important;align-items:center!important;justify-content:center!important;gap:7px!important;max-width:calc(100vw - 24px)!important;padding:8px!important;background:rgba(5,8,10,.86)!important;border:1px solid rgba(216,180,88,.32)!important;border-radius:8px!important;box-shadow:0 18px 42px rgba(0,0,0,.48)!important;z-index:7!important;}",
      "#fldRoot.h0f-root #fldBar button,#fldRoot.h0f-root #fldDrawer button{font-family:inherit!important;font-size:12px!important;line-height:1.1!important;min-height:38px!important;border-radius:8px!important;border:1px solid rgba(216,180,88,.36)!important;background:linear-gradient(180deg,rgba(32,42,43,.96),rgba(13,19,21,.96))!important;color:#f4efe2!important;padding:7px 10px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.06)!important;cursor:pointer!important;}",
      "#fldRoot.h0f-root #fldBar button[aria-pressed='true'],#fldRoot.h0f-root #fldDrawer button[aria-pressed='true']{border-color:rgba(95,146,115,.72)!important;background:linear-gradient(180deg,rgba(95,146,115,.38),rgba(16,27,24,.96))!important;color:#fff!important;}",
      "#fldRoot.h0f-root #fldBtnPlay{border-color:rgba(95,146,115,.72)!important;min-width:82px!important;}",
      "#fldRoot.h0f-root #fldBtnSettings,#fldRoot.h0f-root #fldBtnAudio{border-color:rgba(93,134,183,.62)!important;}",
      "#fldRoot.h0f-root #fldBtnExit{border-color:rgba(179,90,80,.56)!important;}",
      "#fldRoot.h0f-root button:focus-visible,#fldRoot.h0f-root #fldBar button:focus-visible,#fldRoot.h0f-root #fldEnd button:focus-visible,#fldRoot.h0f-root #fldBrief button:focus-visible,#fldRoot.h0f-root #fldAudioPanel button:focus-visible,#fldRoot.h0f-root #fldDrawer button:focus-visible{outline:3px solid #ffe27a!important;outline-offset:3px!important;}",
      ".h0f-meter{display:grid;grid-template-columns:72px minmax(96px,1fr) 42px;align-items:center;gap:8px;margin:5px 0;color:#ece6d8;font-size:12px;}.h0f-meter-label{font-weight:850;color:#d8cda9;}.h0f-meter-track{height:10px;background:#171f22;border:1px solid rgba(216,180,88,.30);border-radius:999px;overflow:hidden;}.h0f-meter-fill{display:block;height:100%;border-radius:999px;}.h0f-meter-val{text-align:right;color:#f4efe2;font-weight:850;}",
      "#fldRoot.h0f-root #fldElevLegend{font-family:inherit!important;background:rgba(5,8,10,.90)!important;border-color:rgba(216,180,88,.38)!important;border-radius:8px!important;color:#f4efe2!important;box-shadow:0 18px 42px rgba(0,0,0,.48)!important;}",
      "#fldRoot.h0f-root #fldElevLegend button{font-family:inherit!important;border-radius:7px!important;}",
      "#fldRoot.h0f-root #fldDrawer{font-family:inherit!important;background:rgba(0,0,0,.70)!important;backdrop-filter:blur(2px);}",
      /* S09 (D232): phone-only minimize toggle for the selected-unit HUD — the panel + top bar left only a
         narrow strip for the core drag-to-order gestures. Mirrors the terrain legend's collapse affordance;
         hiding #fldHud also lets the S04 strip math recenter the 2D field over the reclaimed space. */
      "#h0fHudMin{display:none;position:absolute;right:10px;bottom:44px;z-index:8;min-height:32px;align-items:center;gap:4px;padding:5px 9px;font-family:inherit;font-size:11px;font-weight:800;color:#f4efe2;background:rgba(5,8,10,.88);border:1px solid rgba(216,180,88,.36);border-radius:8px;cursor:pointer;}",
      "#fldRoot.h0f-root.h0f-hudmin #fldHud{display:none!important;}",
      "@media (max-width:760px){#fldRoot.h0f-root #h0fHudMin{display:inline-flex;}}",
      ".h0f-drawer-card{width:min(460px,92vw);color:#f4efe2;background:linear-gradient(180deg,#141f21,#070b0d);border:1px solid rgba(216,180,88,.42);border-radius:8px;padding:16px;box-shadow:0 28px 70px rgba(0,0,0,.62),inset 0 0 0 1px rgba(255,255,255,.05);}",
      ".h0f-drawer-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;}.h0f-drawer-kicker{margin:0 0 3px;color:#d8b458;font-size:11px;text-transform:uppercase;font-weight:950;}.h0f-drawer-head h2{margin:0;color:#fff4d2;font-size:22px;line-height:1;font-weight:950;}.h0f-drawer-sub{margin:6px 0 0;color:#c6d1ca;font-size:12px;line-height:1.35;}",
      ".h0f-setting{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:8px 0;padding:10px;border:1px solid rgba(216,180,88,.22);border-radius:8px;background:rgba(255,255,255,.045);}.h0f-setting span{display:block;}.h0f-setting b{font-size:13px;color:#fff4d2;}.h0f-setting em{display:block;margin-top:2px;color:#c6d1ca;font-style:normal;font-size:11px;line-height:1.3;}.h0f-preset{border:1px solid rgba(93,134,183,.34);border-radius:8px;background:rgba(93,134,183,.10);padding:10px;margin-bottom:10px;font-size:12px;color:#d5e3f4;}.h0f-drawer-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px;}",
      "@media (min-width:761px) and (max-width:900px){#fldRoot.h0f-root #fldBar{left:12px!important;right:258px!important;transform:none!important;max-width:none!important;justify-content:flex-start!important;}}",
      "@media (max-width:760px){#fldRoot.h0f-root #fldTop{top:8px!important;left:8px!important;right:8px!important;flex-wrap:wrap!important;}#fldRoot.h0f-root #fldTitle{max-width:100%!important;flex-basis:100%;}#fldRoot.h0f-root #fldSector,#fldRoot.h0f-root #fldObj{max-width:calc(50vw - 18px)!important;}#fldRoot.h0f-root #fldHud{left:10px!important;right:10px!important;top:auto!important;bottom:150px!important;min-width:0!important;max-width:none!important;max-height:28vh!important;padding:10px!important;font-size:12px!important;}#fldRoot.h0f-root #fldBar{left:10px!important;right:86px!important;bottom:8px!important;transform:none!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;align-items:stretch!important;align-content:start!important;max-width:none!important;max-height:132px!important;overflow:auto!important;justify-content:normal!important;}#fldRoot.h0f-root #fldBar button{min-height:34px!important;width:100%!important;padding:6px 8px!important;font-size:11px!important;}#fldRoot.h0f-root #fldElevLegend{right:10px!important;bottom:8px!important;min-width:0!important;max-width:124px!important;padding:6px 7px!important;font-size:11px!important;}.h0f-meter{grid-template-columns:64px minmax(70px,1fr) 38px;}}",
      "html[data-a11y-contrast='high'] #fldRoot.h0f-root #fldTop,html[data-a11y-contrast='high'] #fldRoot.h0f-root #fldHud,html[data-a11y-contrast='high'] #fldRoot.h0f-root #fldBar,html[data-a11y-contrast='high'] .h0f-drawer-card,html[data-a11y-contrast='high'] .h0f-setting{background:#000!important;color:#fff!important;border-color:#ffe27a!important;}html[data-a11y-contrast='high'] #fldRoot.h0f-root button{background:#000!important;color:#fff!important;border-color:#ffe27a!important;}"
    ].join("");
    document.head.appendChild(s);
  }

  function h0fApplyShell() {
    if (typeof document === "undefined") return;
    h0fCss();
    var root = document.getElementById("fldRoot");
    if (root) {
      root.classList.add("h0f-root");
      root.setAttribute("aria-label", "Tactical field command view");
    }
    var bar = document.getElementById("fldBar");
    if (bar) bar.setAttribute("aria-label", "Tactical command controls");
    var hud = document.getElementById("fldHud");
    if (hud) hud.setAttribute("aria-label", "Tactical unit status");
    // S09 (D232): inject the phone HUD-minimize toggle once (a #fldRoot sibling of #fldHud — the HUD's own
    // innerHTML is rebuilt every fldRenderHud, so the control must live outside it).
    if (root && !document.getElementById("h0fHudMin")) {
      var mb = document.createElement("button");
      mb.id = "h0fHudMin"; mb.type = "button";
      mb.setAttribute("aria-pressed", "false");
      mb.setAttribute("aria-label", "Minimize the unit status panel to enlarge the battlefield");
      mb.innerHTML = "&#9660; Unit";
      mb.addEventListener("click", function () {
        var min = root.classList.toggle("h0f-hudmin");
        mb.setAttribute("aria-pressed", String(min));
        mb.innerHTML = min ? "&#9650; Unit" : "&#9660; Unit";
        mb.setAttribute("aria-label", (min ? "Show" : "Minimize") + " the unit status panel");
        if (typeof fldResizeCanvas === "function") fldResizeCanvas();   // recenter the 2D field band (S04)
      });
      root.appendChild(mb);
    }
    if (typeof window !== "undefined" && window.innerWidth <= 760 && typeof FLDTR_S !== "undefined"
      && FLDTR_S && FLDTR_S.collapsed !== true && document.getElementById("fldElevLegend")
      && typeof fldTrRefreshLegend === "function") {
      FLDTR_S.collapsed = true;
      fldTrRefreshLegend();
    }
  }

  if (typeof fldBuildDom === "function" && !fldBuildDom._h0f) {
    var h0fOrigBuildDom = fldBuildDom;
    fldBuildDom = function () {
      var r = h0fOrigBuildDom.apply(this, arguments);
      h0fApplyShell();
      return r;
    };
    fldBuildDom._h0f = true;
  }

  if (typeof fldRenderTop === "function" && !fldRenderTop._h0f) {
    var h0fOrigRenderTop = fldRenderTop;
    fldRenderTop = function () {
      var r = h0fOrigRenderTop.apply(this, arguments);
      h0fApplyShell();
      return r;
    };
    fldRenderTop._h0f = true;
  }

  if (typeof fldBar === "function" && !fldBar._h0f) {
    fldBar = function (label, val, max, col) {
      var value = (typeof val === "number" && isFinite(val)) ? val : 0;
      var denom = (typeof max === "number" && isFinite(max) && max > 0) ? max : 1;
      var pct = Math.round(fldClamp(value / denom, 0, 1) * 100);
      var color = col || "#d8b458";
      return '<div class="h0f-meter"><span class="h0f-meter-label">' + h0fEsc(label) + '</span>'
        + '<span class="h0f-meter-track"><span class="h0f-meter-fill" style="width:' + pct + '%;background:' + color + ';"></span></span>'
        + '<span class="h0f-meter-val">' + h0fEsc(Math.round(value)) + '</span></div>';
    };
    fldBar._h0f = true;
  }

  if (typeof _fldDrawerHTML === "function" && !_fldDrawerHTML._h0f) {
    _fldDrawerHTML = function () {
      var c = (typeof fldPresetResolve === "function" ? fldPresetResolve() : null) || (typeof fldPresetNeutral === "function" ? fldPresetNeutral() : {});
      var ai = (typeof FLDP !== "undefined" && FLDP.ai && c.ai) ? FLDP.ai[c.ai] : null;
      var rm = (typeof FLDP !== "undefined" && FLDP.realism && c.realism) ? FLDP.realism[c.realism] : null;
      var presetLine = (ai ? ai.label : "Custom") + " &times; " + (rm ? rm.label : "Custom");
      var elev = (typeof fldElevModeLabel === "function") ? fldElevModeLabel() : "Hillshade";
      function h0fToggleRow(id, label, on, hint) {
        return '<div class="h0f-setting"><span><b>' + h0fEsc(label) + '</b><em>' + h0fEsc(hint) + '</em></span>'
          + '<button id="' + id + '" type="button" aria-pressed="' + (on ? "true" : "false") + '">' + (on ? "On" : "Off") + '</button></div>';
      }
      return '<div class="h0f-drawer-card">'
        + '<div class="h0f-drawer-head"><div><p class="h0f-drawer-kicker">Field command</p><h2>Battle Settings</h2>'
        + '<p class="h0f-drawer-sub">Live battlefield controls. The campaign difficulty profile stays anchored to Command &amp; Realism.</p></div>'
        + '<button id="fldDrawerClose" type="button" aria-label="Close settings">&times;</button></div>'
        + '<div class="h0f-preset"><b>Difficulty:</b> ' + h0fEsc(presetLine) + '<br><span>Preset changes belong on the main-menu Command &amp; Realism surface.</span></div>'
        + h0fToggleRow("fldDrawerFog", "Fog of war", !!(__FIELD && __FIELD.fog), "Line-of-sight scouting (V)")
        + h0fToggleRow("fldDrawerAuto", "Active auto-pause", !!(__FIELD && __FIELD.autoPause), "Pause at key moments (P)")
        + '<div class="h0f-setting"><span><b>Elevation display</b><em>High and low ground (R)</em></span>'
        + '<button id="fldDrawerElev" type="button" aria-label="Elevation display: ' + h0fEsc(elev) + ' - click to cycle">' + h0fEsc(elev) + '</button></div>'
        + '<div class="h0f-setting"><span><b>Speed</b><em>Cycle 1x, 2x, 4x</em></span>'
        + '<button id="fldDrawerSpd" type="button" aria-label="Battle speed ' + h0fEsc((__FIELD && __FIELD.speed) || 1) + 'x - click to cycle">' + h0fEsc((__FIELD && __FIELD.speed) || 1) + '&times;</button></div>'
        + '<div class="h0f-drawer-actions"><button id="fldDrawerDone" type="button">Resume</button></div>'
        + '</div>';
    };
    _fldDrawerHTML._h0f = true;
  }

  h0fCss();
})();
