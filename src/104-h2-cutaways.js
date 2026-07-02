var h2CutawayRecordForBattle = null;
var h2ShowCutaway = null;
var h2CutawayKeyHandler = null;

/* ============================================================================
   Phase H2 · 104-h2-cutaways.js — skippable field cutaways.

   D170 scope: prove the H2 cutaway UX and offline fallback path without fetching,
   streaming, embedding, or licensing any new moving-image asset. Runtime uses an
   existing PD scene still when one is already embedded, otherwise procedural map
   art. Actual video slots stay disabled until provenance is explicit.
   ========================================================================== */
(function h2CutawayModule() {
  function h2Esc(v) {
    return (typeof htmlEsc === "function") ? htmlEsc(v)
      : String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function h2Data() { return (typeof gameData === "function" ? gameData("footage-cutaways") : null) || {}; }
  function h2Records() { var D = h2Data(); return Array.isArray(D.records) ? D.records : []; }

  function h2RecordForBattle(id) {
    var rows = h2Records();
    for (var i = 0; i < rows.length; i++) {
      if (rows[i] && rows[i].battleId === id) return rows[i];
    }
    return null;
  }

  function h2Battle(C) {
    try { return (typeof _brgNextBattle === "function") ? _brgNextBattle(C) : null; }
    catch (e) { return null; }
  }

  function h2Css() {
    if (typeof document === "undefined" || document.getElementById("h2CutawayCss")) return;
    var s = document.createElement("style");
    s.id = "h2CutawayCss";
    s.textContent = [
      ".h0-brief-actions.h2-cutaway-ready{grid-template-columns:repeat(5,minmax(0,1fr));}",
      ".h2-cutaway-btn{background:linear-gradient(180deg,rgba(93,134,183,.34),rgba(93,134,183,.10))!important;border-color:rgba(93,134,183,.64)!important;color:#fff!important;}",
      ".h2-cutaway-overlay{position:fixed;inset:0;z-index:99999;background:rgba(3,5,6,.82);display:flex;align-items:center;justify-content:center;padding:clamp(8px,2vw,18px);color:#f3efe2;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}",
      ".h2-cutaway-card{width:min(980px,calc(100vw - 24px));max-height:min(94vh,820px);overflow:auto;overscroll-behavior:contain;background:linear-gradient(135deg,#071013,#15201c 48%,#090d10);border:1px solid rgba(216,180,88,.44);border-radius:8px;box-shadow:0 28px 90px rgba(0,0,0,.72),inset 0 0 0 1px rgba(255,255,255,.05);position:relative;}",
      ".h2-cutaway-card::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0,rgba(255,255,255,.025) 1px,transparent 1px,transparent 24px),repeating-linear-gradient(90deg,rgba(216,180,88,.04) 0,rgba(216,180,88,.04) 1px,transparent 1px,transparent 28px);pointer-events:none;}",
      ".h2-cutaway-card>*{position:relative;z-index:1;}.h2-cutaway-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;padding:16px;border-bottom:1px solid rgba(216,180,88,.28);background:linear-gradient(90deg,rgba(216,180,88,.12),rgba(93,134,183,.08));}",
      ".h2-cutaway-kicker{margin:0 0 4px;color:#d8b458;font-size:11px;font-weight:950;text-transform:uppercase;}.h2-cutaway-head h1{margin:0;color:#fff7d8;font-size:clamp(23px,3vw,32px);line-height:1.06;font-weight:950;letter-spacing:0;overflow-wrap:anywhere;}.h2-cutaway-sub{margin:6px 0 0;color:#cbd5c9;font-size:13px;line-height:1.4;}",
      ".h2-cutaway-close{min-height:42px;border-radius:8px!important;}.h2-cutaway-body{display:grid;grid-template-columns:minmax(300px,1.15fr) minmax(240px,.85fr);gap:12px;padding:12px;}",
      ".h2-cutaway-frame,.h2-cutaway-notes{background:linear-gradient(180deg,rgba(22,33,30,.96),rgba(8,12,14,.96));border:1px solid rgba(216,180,88,.28);border-radius:8px;overflow:hidden;}",
      ".h2-cutaway-frame .scene-img{margin:0!important;padding:0!important;background:#050607!important;border:0!important;border-radius:0!important;box-shadow:none!important;}.h2-cutaway-frame .scene-img img{width:100%!important;height:clamp(220px,42vh,390px)!important;max-height:none!important;object-fit:cover!important;display:block!important;border:0!important;filter:grayscale(.08) contrast(1.2) brightness(.76)!important;}.h2-cutaway-frame .scene-img figcaption{box-sizing:border-box!important;margin:0!important;padding:10px 12px!important;background:rgba(0,0,0,.88)!important;color:#f1dfba!important;text-align:left!important;font-style:normal!important;font-size:12px!important;line-height:1.45!important;}",
      ".h2-cutaway-proc{height:clamp(220px,42vh,390px);position:relative;overflow:hidden;background:radial-gradient(circle at 22% 26%,rgba(216,180,88,.22),transparent 18%),radial-gradient(circle at 74% 58%,rgba(93,134,183,.22),transparent 21%),linear-gradient(135deg,#152018,#253b2f 52%,#10181b);}",
      ".h2-cutaway-proc::before{content:'';position:absolute;inset:12%;border:2px dashed rgba(237,218,170,.46);border-radius:48% 52% 42% 58%;transform:rotate(-12deg);}.h2-cutaway-proc::after{content:'';position:absolute;left:10%;right:8%;top:48%;height:9px;background:linear-gradient(90deg,transparent,rgba(237,218,170,.64),transparent);transform:rotate(-7deg);box-shadow:0 42px 0 rgba(93,134,183,.38),0 -58px 0 rgba(85,118,86,.36);}",
      ".h2-cutaway-proc span{position:absolute;left:22px;bottom:20px;right:22px;color:#fff0c8;font-size:13px;line-height:1.45;text-shadow:0 2px 8px #000;}",
      ".h2-cutaway-notes{padding:14px;}.h2-cutaway-note{border:1px solid rgba(216,180,88,.22);border-radius:8px;padding:10px;margin-bottom:9px;background:rgba(255,255,255,.055);}.h2-cutaway-note b{display:block;color:#fff1c8;font-size:12px;text-transform:uppercase;margin-bottom:3px;}.h2-cutaway-note span{display:block;color:#cbd5c9;font-size:13px;line-height:1.44;}",
      ".h2-cutaway-foot{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:12px 16px;border-top:1px solid rgba(216,180,88,.28);background:rgba(0,0,0,.24);}.h2-cutaway-foot p{margin:0;color:#cbd5c9;font-size:12px;line-height:1.4;}.h2-cutaway-foot button{min-height:42px;border-radius:8px!important;}",
      ".h2-cutaway-overlay button:focus-visible{outline:3px solid #ffe27a!important;outline-offset:3px!important;}@media (prefers-reduced-motion:no-preference){.h2-cutaway-frame .scene-img img{animation:h2StillPan 16s ease-in-out infinite alternate;}@keyframes h2StillPan{from{transform:scale(1.01) translateX(-1%);}to{transform:scale(1.07) translateX(1%);}}}",
      "@media (max-width:840px){.h0-brief-actions.h2-cutaway-ready{grid-template-columns:repeat(2,minmax(0,1fr));}.h2-cutaway-body{grid-template-columns:1fr;}.h2-cutaway-frame .scene-img img,.h2-cutaway-proc{height:300px!important;}}@media (max-width:540px){.h0-brief-actions.h2-cutaway-ready{grid-template-columns:1fr;}.h2-cutaway-overlay{align-items:flex-start;}.h2-cutaway-card{width:calc(100vw - 16px);max-height:calc(100vh - 16px);}.h2-cutaway-head,.h2-cutaway-foot{display:block;padding:12px;}.h2-cutaway-body{padding:10px;gap:10px;}.h2-cutaway-close,.h2-cutaway-foot button{width:100%;margin-top:8px;}.h2-cutaway-head h1{font-size:24px;}.h2-cutaway-frame .scene-img img,.h2-cutaway-proc{height:210px!important;}.h2-cutaway-proc span{left:14px;right:14px;bottom:14px;font-size:12px;}}",
      "html[data-a11y-contrast='high'] .h2-cutaway-card,html[data-a11y-contrast='high'] .h2-cutaway-frame,html[data-a11y-contrast='high'] .h2-cutaway-notes,html[data-a11y-contrast='high'] .h2-cutaway-note{background:#000!important;color:#fff!important;border-color:#ffe27a!important;}html[data-a11y-contrast='high'] .h2-cutaway-sub,html[data-a11y-contrast='high'] .h2-cutaway-note span,html[data-a11y-contrast='high'] .h2-cutaway-foot p{color:#f2e6c8!important;}"
    ].join("");
    document.head.appendChild(s);
  }

  function h2Visual(rec) {
    var id = rec && rec.battleId;
    var fig = (typeof sceneImageHtml === "function") ? sceneImageHtml(id) : "";
    if (fig) return '<div class="h2-cutaway-frame h2-has-still" data-h2-fallback="embedded-scene-still">' + fig + '</div>';
    return '<div class="h2-cutaway-frame h2-has-procedural" data-h2-fallback="procedural-map">'
      + '<div class="h2-cutaway-proc" role="img" aria-label="Procedural field sketch fallback for this battle">'
      + '<span>No verified moving-image asset is enabled for this field. The cutaway falls back to local procedural map art until public-domain provenance is reviewed.</span></div></div>';
  }

  function h2CutawayHTML(C) {
    var bd = h2Battle(C) || {};
    var rec = h2RecordForBattle(bd.id) || { battleId: bd.id || "", title: bd.name || "Field Cutaway", beat: "Offline procedural fallback", fallback: "procedural-map", video: { enabled: false } };
    var video = rec.video || {};
    var videoState = video.enabled === true ? "Enabled" : "Disabled pending provenance";
    var title = rec.title || bd.name || "Field Cutaway";
    var beat = rec.beat || "Before the order is given";
    return '<div class="h2-cutaway-overlay" role="dialog" aria-modal="true" aria-labelledby="h2CutawayTitle" aria-describedby="h2CutawaySub">'
      + '<section class="h2-cutaway-card">'
      + '<header class="h2-cutaway-head"><div><p class="h2-cutaway-kicker">Skippable Field Cutaway</p><h1 id="h2CutawayTitle">' + h2Esc(title) + '</h1>'
      + '<p id="h2CutawaySub" class="h2-cutaway-sub">' + h2Esc(beat) + ' &middot; ' + h2Esc(bd.name || "campaign field") + '</p></div>'
      + '<button id="h2CutawayClose" type="button" class="upg h2-cutaway-close">Skip</button></header>'
      + '<div class="h2-cutaway-body">' + h2Visual(rec)
      + '<aside class="h2-cutaway-notes" aria-label="Cutaway asset status">'
      + '<div class="h2-cutaway-note"><b>Runtime source</b><span>' + h2Esc(rec.fallback === "embedded-scene-still" ? "Existing embedded PD scene still" : "Procedural offline field sketch") + '</span></div>'
      + '<div class="h2-cutaway-note"><b>Moving image</b><span>' + h2Esc(videoState) + '. No video tag, account, stream, or runtime web dependency is used in this build.</span></div>'
      + '<div class="h2-cutaway-note"><b>Player control</b><span>This cutaway is optional and skippable. It does not advance the campaign, launch a battle, or change battle prep.</span></div>'
      + '</aside></div>'
      + '<footer class="h2-cutaway-foot"><p>H2 is a provenance-gated media shell: real footage can be added only after asset review; this fallback keeps the single-file game complete offline.</p>'
      + '<button id="h2CutawayDone" type="button" class="bigbtn">Return to briefing</button></footer>'
      + '</section></div>';
  }

  function h2CloseCutaway() {
    var o = document.getElementById("h2CutawayOverlay");
    if (o && o.parentNode) o.parentNode.removeChild(o);
    if (h2CutawayKeyHandler) {
      document.removeEventListener("keydown", h2CutawayKeyHandler);
      h2CutawayKeyHandler = null;
    }
    try { var b = document.getElementById("h2CutawayBtn"); if (b) b.focus(); } catch (e) {}
  }

  function h2OpenCutaway(C) {
    if (typeof document === "undefined") return;
    h2Css();
    h2CloseCutaway();
    var wrap = document.createElement("div");
    wrap.id = "h2CutawayOverlay";
    wrap.innerHTML = h2CutawayHTML(C);
    document.body.appendChild(wrap);
    var close = document.getElementById("h2CutawayClose");
    var done = document.getElementById("h2CutawayDone");
    if (close) close.addEventListener("click", h2CloseCutaway);
    if (done) done.addEventListener("click", h2CloseCutaway);
    wrap.addEventListener("click", function (ev) { if (ev.target && ev.target.className === "h2-cutaway-overlay") h2CloseCutaway(); });
    h2CutawayKeyHandler = function h2Key(ev) {
      if (ev && ev.key === "Escape") { h2CloseCutaway(); document.removeEventListener("keydown", h2Key); }
    };
    document.addEventListener("keydown", h2CutawayKeyHandler);
    try { if (close) close.focus(); } catch (e) {}
  }

  function h2WireCutawayButton(C) {
    if (typeof document === "undefined" || !C) return;
    h2Css();
    if (document.getElementById("h2CutawayBtn")) return;
    var actions = document.querySelector(".h0-brief-actions") || document.querySelector(".btn-row");
    if (!actions) return;
    actions.classList.add("h2-cutaway-ready");
    var btn = document.createElement("button");
    btn.id = "h2CutawayBtn";
    btn.type = "button";
    btn.className = "upg h2-cutaway-btn";
    btn.textContent = "Field cutaway";
    btn.title = "Open a skippable offline field cutaway before choosing how to fight";
    btn.addEventListener("click", function () { h2OpenCutaway(C); });
    var before = document.getElementById("brgRealTime") || document.getElementById("brgToField");
    if (before && before.parentNode === actions) actions.insertBefore(btn, before);
    else actions.appendChild(btn);
  }

  if (typeof bridgeWireBriefing === "function" && !bridgeWireBriefing._h2cutaway) {
    var _h2OldBridgeWire = bridgeWireBriefing;
    bridgeWireBriefing = function (C, onBack, onField) {
      _h2OldBridgeWire(C, onBack, onField);
      h2WireCutawayButton(C);
    };
    bridgeWireBriefing._h2cutaway = true;
  }

  h2CutawayRecordForBattle = h2RecordForBattle;
  h2ShowCutaway = h2OpenCutaway;
})();
