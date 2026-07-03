/* ============================================================================
   100-h0-battle-briefing.js -- H0 prototype slice: battle briefing / side choice
   ----------------------------------------------------------------------------
   Late-bound presentation pass for the two pre-field choice surfaces:
   - campaign bridge briefing (army, prep, Auto/Real-Time/Classic)
   - tactical scenario side choice (command either army)

   Assignment overrides only. Existing ids, callbacks, scene-imagery contract,
   bridgeWireBriefing, and data-brside launcher contract stay intact.
   ========================================================================== */
(function h0BattleBriefingModule() {
  function h0bEsc(v) {
    return (typeof htmlEsc === "function") ? htmlEsc(v)
      : String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function h0bSideName(side) {
    return side === "CS" ? "Confederate" : "Union";
  }

  function h0bShortSide(side) {
    return side === "CS" ? "CS" : "US";
  }

  function h0bBattleName(bd) {
    return (bd && bd.name) ? bd.name : "The next engagement";
  }

  function h0bYear(bd) {
    return (bd && bd.year) ? String(bd.year) : "";
  }

  function h0bRole(C, bd) {
    if (!C || !bd) return "Await orders";
    return bd.atk === C.side ? "Attack ordered" : "Defensive stand";
  }

  function h0bTone(v, highIsBad) {
    v = Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
    if (highIsBad) {
      if (v >= 68) return "bad";
      if (v >= 38) return "warn";
      return "good";
    }
    if (v >= 68) return "good";
    if (v >= 38) return "warn";
    return "bad";
  }

  function h0bWord(v, highIsBad) {
    var tone = h0bTone(v, highIsBad);
    if (tone === "good") return highIsBad ? "Controlled" : "Strong";
    if (tone === "warn") return highIsBad ? "Costly" : "Uneven";
    return highIsBad ? "Severe" : "Strained";
  }

  function h0bMeter(label, v, highIsBad) {
    var n = Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
    var tone = h0bTone(n, highIsBad);
    return '<div class="h0-brief-meter h0-meter-' + tone + '">'
      + '<div class="h0-brief-meter-label"><span>' + h0bEsc(label) + '</span><b>' + n + ' &middot; ' + h0bEsc(h0bWord(n, highIsBad)) + '</b></div>'
      + '<div class="h0-brief-meter-track" aria-hidden="true"><span style="width:' + n + '%"></span></div>'
      + '</div>';
  }

  function h0bStat(label, value, tone) {
    return '<div class="h0-brief-stat h0-stat-' + (tone || "neutral") + '"><span>' + h0bEsc(label) + '</span><b>' + h0bEsc(value) + '</b></div>';
  }

  function h0bCommandFigure(bd) {
    var fig = (typeof sceneImageHtml === "function") ? sceneImageHtml(bd && bd.id) : "";
    if (fig) return '<div class="h0-brief-scene-wrap">' + fig + '</div>';
    return '<div class="h0-brief-map-fallback" aria-hidden="true"><span></span><span></span><span></span><span></span></div>';
  }

  function h0bPrepRows(C) {
    var bp = (C && C.battlePrep) || {};
    var rows = "";
    var list = (typeof _brgPREP !== "undefined" && _brgPREP && _brgPREP.length) ? _brgPREP : [];
    for (var i = 0; i < list.length; i++) {
      var p = list[i], on = !!bp[p.key];
      rows += '<div class="h0-prep-row' + (on ? ' is-on' : '') + '">'
        + '<div><b>' + h0bEsc(p.label) + '</b><span>' + h0bEsc(p.hint) + '</span></div>'
        + '<button id="brg_' + h0bEsc(p.key) + '" type="button" class="upg h0-prep-toggle" aria-pressed="' + (on ? "true" : "false") + '">' + (on ? 'Ordered &check;' : 'Order') + '</button>'
        + '</div>';
    }
    return rows;
  }

  function h0bCss() {
    if (typeof document === "undefined" || document.getElementById("h0BattleBriefingCss")) return;
    var s = document.createElement("style");
    s.id = "h0BattleBriefingCss";
    s.textContent = [
      "#overlay .sheet:has(.h0-brief-shell),#overlay .sheet:has(.h0-side-shell){width:min(1180px,96vw);background:#080c0d;border-color:#6f8069;border-radius:8px;}",
      "#overlay .sheet:has(.h0-brief-shell)::before,#overlay .sheet:has(.h0-side-shell)::before{border-color:rgba(216,180,88,.30);}",
      ".h0-brief-shell,.h0-side-shell{--h0b-bg:#080c0d;--h0b-panel:#111918;--h0b-panel2:#17231f;--h0b-ink:#f2eee3;--h0b-muted:#c5cdc3;--h0b-brass:#d8b458;--h0b-blue:#5d86b7;--h0b-red:#b35a50;--h0b-green:#5f9273;--h0b-warn:#d0a047;--h0b-line:rgba(216,180,88,.27);--h0b-focus:#ffe27a;color:var(--h0b-ink);font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:linear-gradient(135deg,#070a0b 0%,#13201d 48%,#090e11 100%);border:1px solid rgba(216,180,88,.42);border-radius:8px;overflow:hidden;position:relative;box-shadow:0 24px 70px rgba(0,0,0,.58),inset 0 0 0 1px rgba(255,255,255,.05);}",
      ".h0-brief-shell *,.h0-side-shell *{box-sizing:border-box;letter-spacing:0;}",
      ".h0-brief-shell::before,.h0-side-shell::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.032) 0,rgba(255,255,255,.032) 1px,transparent 1px,transparent 26px),repeating-linear-gradient(90deg,rgba(216,180,88,.052) 0,rgba(216,180,88,.052) 1px,transparent 1px,transparent 30px);opacity:.48;pointer-events:none;}",
      ".h0-brief-head,.h0-brief-grid,.h0-brief-actions,.h0-side-head,.h0-side-grid,.h0-side-foot{position:relative;z-index:1;}",
      ".h0-brief-head,.h0-side-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;padding:16px;border-bottom:1px solid var(--h0b-line);background:linear-gradient(90deg,rgba(216,180,88,.12),rgba(93,134,183,.08),rgba(0,0,0,.18));}",
      ".h0-brief-kicker{margin:0 0 4px;color:var(--h0b-brass);font-size:11px;text-transform:uppercase;font-weight:900;}",
      ".h0-brief-head h1,.h0-side-head h1{margin:0;color:#fff8dc;font-size:34px;line-height:1;font-weight:950;}",
      ".h0-brief-sub,.h0-side-sub{margin:6px 0 0;color:var(--h0b-muted);font-size:13px;line-height:1.4;}",
      ".h0-brief-chips{display:flex;gap:8px;flex-wrap:wrap;align-items:flex-start;justify-content:flex-end;}",
      ".h0-brief-chip{min-height:34px;display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border:1px solid rgba(216,180,88,.28);border-radius:8px;background:rgba(255,255,255,.06);font-size:12px;font-weight:850;}",
      ".h0-brief-chip b{color:var(--h0b-brass);font-size:10px;text-transform:uppercase;}",
      ".h0-brief-grid{display:grid;grid-template-columns:minmax(320px,1.1fr) minmax(320px,1fr);gap:12px;padding:12px;}",
      ".h0-brief-panel,.h0-side-card{background:linear-gradient(180deg,rgba(23,35,31,.97),rgba(10,15,17,.97));border:1px solid var(--h0b-line);border-radius:8px;box-shadow:0 14px 28px rgba(0,0,0,.34);min-width:0;}",
      ".h0-brief-panel-head{display:flex;align-items:center;gap:9px;padding:12px 12px 0;}",
      ".h0-brief-icon{width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px;background:#44514d;color:#fff;font-size:11px;font-weight:950;border:1px solid rgba(255,255,255,.16);}",
      ".h0-brief-panel-head h2,.h0-side-card h2{margin:0;color:#fff3d1;font-size:16px;line-height:1.15;font-weight:950;}",
      ".h0-brief-panel-body{padding:11px 12px 12px;}",
      ".h0-brief-scene-wrap{margin:11px 12px 0;border-radius:8px;overflow:hidden;border:1px solid rgba(216,180,88,.32);background:#050607;}",
      ".h0-brief-shell .scene-img{margin:0!important;padding:0!important;background:#050607!important;border:0!important;border-radius:0!important;box-shadow:none!important;}",
      ".h0-brief-shell .scene-img img{width:100%!important;height:230px!important;max-height:none!important;object-fit:cover!important;display:block!important;margin:0!important;border:0!important;filter:grayscale(.12) contrast(1.18) brightness(.74)!important;}",
      ".h0-brief-shell .scene-img figcaption{margin:0!important;padding:8px 10px!important;background:rgba(0,0,0,.82)!important;color:#f4e4c2!important;font-style:normal!important;text-align:left!important;font-size:10px!important;line-height:1.35!important;}",
      ".h0-brief-map-fallback{height:230px;margin:11px 12px 0;border:1px solid rgba(216,180,88,.32);border-radius:8px;background:linear-gradient(135deg,#12191b,#20372e);display:grid;grid-template-columns:1fr 1fr;gap:2px;padding:12px;}",
      ".h0-brief-map-fallback span{border-radius:5px;background:linear-gradient(180deg,rgba(216,180,88,.18),rgba(93,134,183,.15));}",
      ".h0-brief-stat-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:10px;}",
      ".h0-brief-stat{min-height:48px;border:1px solid rgba(216,180,88,.22);border-radius:8px;padding:8px 9px;background:rgba(255,255,255,.055);display:flex;flex-direction:column;justify-content:center;gap:2px;}",
      ".h0-brief-stat span{color:var(--h0b-muted);font-size:10px;text-transform:uppercase;font-weight:900;}.h0-brief-stat b{color:var(--h0b-ink);font-size:14px;line-height:1.12;overflow-wrap:anywhere;}",
      ".h0-stat-good{border-color:rgba(95,146,115,.5);background:rgba(95,146,115,.13);}.h0-stat-warn{border-color:rgba(208,160,71,.5);background:rgba(208,160,71,.13);}.h0-stat-field{border-color:rgba(93,134,183,.55);background:rgba(93,134,183,.13);}",
      ".h0-brief-meter{margin-top:8px;}.h0-brief-meter-label{display:flex;justify-content:space-between;gap:8px;color:var(--h0b-muted);font-size:12px;font-weight:800;}.h0-brief-meter-label b{color:var(--h0b-ink);}",
      ".h0-brief-meter-track{height:9px;margin-top:5px;background:rgba(0,0,0,.34);border:1px solid rgba(216,180,88,.25);border-radius:999px;overflow:hidden;}.h0-brief-meter-track span{display:block;height:100%;border-radius:999px;background:var(--h0b-green);}.h0-meter-warn .h0-brief-meter-track span{background:var(--h0b-warn);}.h0-meter-bad .h0-brief-meter-track span{background:var(--h0b-red);}",
      ".h0-prep-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 0;border-bottom:1px dotted rgba(216,180,88,.28);}.h0-prep-row:first-child{padding-top:0;}.h0-prep-row b{display:block;color:#fff3d1;font-size:13px;}.h0-prep-row span{display:block;color:var(--h0b-muted);font-size:11px;line-height:1.35;margin-top:2px;}.h0-prep-row.is-on{background:linear-gradient(90deg,rgba(95,146,115,.15),transparent);padding-left:8px;border-radius:8px;}.h0-prep-toggle{border-radius:8px!important;min-width:82px!important;}",
      ".h0-brief-actions{border-top:1px solid var(--h0b-line);padding:11px 12px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;background:rgba(0,0,0,.24);}",
      ".h0-brief-actions button,.h0-side-shell button{border-radius:8px!important;font-family:inherit!important;min-height:42px!important;white-space:normal!important;}",
      ".h0-brief-actions .h0-primary{background:linear-gradient(180deg,rgba(216,180,88,.28),rgba(216,180,88,.08))!important;border-color:rgba(216,180,88,.58)!important;color:#fff6dc!important;}",
      ".h0-brief-actions .h0-field{background:linear-gradient(180deg,rgba(95,146,115,.34),rgba(95,146,115,.12))!important;border-color:rgba(95,146,115,.62)!important;color:#fff!important;}",
      ".h0-brief-actions button:focus-visible,.h0-side-shell button:focus-visible{outline:3px solid var(--h0b-focus)!important;outline-offset:3px!important;}",
      ".h0-side-grid{display:grid;grid-template-columns:repeat(2,minmax(250px,1fr));gap:12px;padding:12px;}",
      ".h0-side-card{cursor:pointer;text-align:left;padding:14px 15px;display:flex;flex-direction:column;gap:9px;color:var(--h0b-ink);border-left:5px solid var(--h0b-blue);}",
      ".h0-side-card[data-brside='CS']{border-left-color:var(--h0b-red);}.h0-side-card:hover{border-color:var(--h0b-brass);box-shadow:0 18px 34px rgba(0,0,0,.42);}.h0-side-card:focus-visible{outline:3px solid var(--h0b-focus);outline-offset:3px;}",
      ".h0-side-badge{width:max-content;max-width:100%;padding:5px 8px;border:1px solid rgba(216,180,88,.30);border-radius:8px;background:rgba(255,255,255,.07);color:var(--h0b-brass);font-size:11px;font-weight:950;text-transform:uppercase;}",
      ".h0-side-card p{margin:0;color:var(--h0b-muted);font-size:12px;line-height:1.45;}.h0-side-role{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:auto;}.h0-side-role span{border:1px solid rgba(216,180,88,.20);border-radius:8px;padding:7px 8px;color:var(--h0b-muted);font-size:10px;text-transform:uppercase;font-weight:900;}.h0-side-role b{display:block;color:var(--h0b-ink);font-size:12px;text-transform:none;margin-top:2px;overflow-wrap:anywhere;}",
      ".h0-side-matchup{padding:0 12px 12px;}.h0-side-matchup .lede{color:var(--h0b-muted);}.h0-side-foot{border-top:1px solid var(--h0b-line);padding:11px 12px;display:flex;justify-content:space-between;gap:10px;align-items:center;background:rgba(0,0,0,.24);}.h0-side-foot p{margin:0;color:var(--h0b-muted);font-size:11px;line-height:1.35;}",
      "@media (max-width:900px){#overlay .sheet:has(.h0-brief-shell),#overlay .sheet:has(.h0-side-shell){width:min(820px,96vw);}.h0-brief-head,.h0-side-head{grid-template-columns:1fr;}.h0-brief-chips{justify-content:flex-start;}.h0-brief-grid,.h0-side-grid{grid-template-columns:1fr;}.h0-brief-actions{grid-template-columns:repeat(2,minmax(0,1fr));}.h0-brief-shell .scene-img img,.h0-brief-map-fallback{height:205px!important;}}",
      "@media (max-width:540px){.sheet .pad{padding:10px;}.h0-brief-head,.h0-side-head{padding:13px;}.h0-brief-head h1,.h0-side-head h1{font-size:28px;}.h0-brief-grid,.h0-side-grid{padding:10px;gap:10px;}.h0-brief-stat-grid,.h0-side-role{grid-template-columns:1fr;}.h0-prep-row{grid-template-columns:1fr;}.h0-prep-toggle{width:100%;}.h0-brief-actions{grid-template-columns:1fr;padding:10px;}.h0-brief-shell .scene-img img,.h0-brief-map-fallback{height:168px!important;}.h0-side-foot{display:block;}.h0-side-foot button{width:100%;margin-top:8px;}}",
      "html[data-a11y-contrast='high'] .h0-brief-shell,html[data-a11y-contrast='high'] .h0-side-shell,html[data-a11y-contrast='high'] .h0-brief-panel,html[data-a11y-contrast='high'] .h0-side-card,html[data-a11y-contrast='high'] .h0-brief-stat{background:#000!important;color:#fff!important;border-color:#ffe27a!important;}",
      "html[data-a11y-contrast='high'] .h0-brief-sub,html[data-a11y-contrast='high'] .h0-side-sub,html[data-a11y-contrast='high'] .h0-prep-row span,html[data-a11y-contrast='high'] .h0-side-card p{color:#f2e6c8!important;}"
    ].join("");
    document.head.appendChild(s);
  }

  h0bCss();

  bridgeBriefingHTML = function (C) {
    if (!C) return "";
    if (typeof bridgeInit === "function") bridgeInit(C);
    var a = (typeof bridgeArmy === "function") ? bridgeArmy(C) : {};
    var bd = (typeof _brgNextBattle === "function") ? _brgNextBattle(C) : null;
    var year = h0bYear(bd);
    var role = h0bRole(C, bd);
    return '<section class="h0-brief-shell" role="region" aria-label="Pre-Battle Briefing command surface">'
      + '<header class="h0-brief-head">'
        + '<div><p class="h0-brief-kicker">Pre-Battle Briefing</p><h1>' + h0bEsc(h0bBattleName(bd)) + '</h1>'
        + '<p class="h0-brief-sub">' + h0bEsc(year ? year + " campaign field" : "Campaign field") + ' &middot; ' + h0bEsc(role) + ' &middot; choose the army, orders, and battle mode before the first shot.</p></div>'
        + '<div class="h0-brief-chips" aria-label="Battle status">'
          + '<span class="h0-brief-chip"><b>Side</b>' + h0bEsc(h0bSideName(C.side)) + '</span>'
          + '<span class="h0-brief-chip"><b>Overall</b>' + h0bEsc(Math.round(a.overall || 0)) + '</span>'
          + '<span class="h0-brief-chip"><b>Mode</b>Auto / Real-Time / Classic</span>'
        + '</div>'
      + '</header>'
      + h0bCommandFigure(bd)
      + '<div class="h0-brief-actions" aria-label="Battle launch options">'
        + '<button id="brgBack" type="button" class="upg">Back</button>'
        + '<button id="brgAuto" type="button" class="upg h0-primary" title="Resolve from the army you fielded, without fighting the battle">Auto-resolve</button>'
        + '<button id="brgRealTime" type="button" class="upg h0-field" title="Fight this battle in the real-time tactical engine">Fight in real time</button>'
        + '<button id="brgToField" type="button" class="bigbtn" title="Fight on the Classic hex map">To the Field (Classic)</button>'
      + '</div>'
      + '<div class="h0-brief-grid">'
        + '<section class="h0-brief-panel h0-army-panel" aria-labelledby="h0ArmyTitle">'
          + '<div class="h0-brief-panel-head"><span class="h0-brief-icon" aria-hidden="true">HQ</span><h2 id="h0ArmyTitle">The army you field</h2></div>'
          + '<div class="h0-brief-panel-body">'
            + '<div class="h0-brief-stat-grid">'
              + h0bStat("Overall", Math.round(a.overall || 0), "field")
              + h0bStat("Leadership", Math.round(a.leadership || 0), "neutral")
              + h0bStat("Fatigue", Math.round(a.fatigue || 0), (a.fatigue || 0) > 34 ? "warn" : "good")
            + '</div>'
            + h0bMeter("Strength", a.strength, false)
            + h0bMeter("Firepower", a.firepower, false)
            + h0bMeter("Artillery", a.artillery, false)
            + h0bMeter("Engineering", a.engineering, false)
            + h0bMeter("Equipment", a.equip, false)
            + h0bMeter("Supply", a.supply, false)
            + h0bMeter("Fatigue load", a.fatigue, true)
          + '</div>'
        + '</section>'
        + '<section class="h0-brief-panel h0-orders-panel" aria-labelledby="h0OrdersTitle">'
          + '<div class="h0-brief-panel-head"><span class="h0-brief-icon" aria-hidden="true">OR</span><h2 id="h0OrdersTitle">Your orders for the day</h2></div>'
          + '<div class="h0-brief-panel-body">' + h0bPrepRows(C) + '</div>'
        + '</section>'
      + '</div>'
      + '</section>';
  };

  fldScenarioSideChoice = function (id, go) {
    if (typeof openSheet !== "function") { go("US"); return; }
    var sd = (typeof fldScenarioData === "function") ? fldScenarioData(id) : null;
    var objName = (sd && sd.objective && sd.objective.name) ? sd.objective.name : "the objective";
    var sides = (sd && sd.sides) ? sd.sides : null;
    var atkSide = (sd && sd.attacker) ? sd.attacker : "US";
    var defSide = (atkSide === "CS") ? "US" : "CS";
    var heading = (sides && sides.heading) ? sides.heading : ((sd && sd.name ? String(sd.name).split(" -- ")[0] : "Battle") + " -- Take Which Command?");
    var intro = (sides && sides.intro) ? sides.intro : ((sd && sd.date ? sd.date + " · " : "") + "Lead the army of your choosing.");
    var foot = (sides && sides.foot) ? sides.foot : ("The other army is commanded by the AI. Fog is " + ((sd && sd.defaultFog) ? "on" : "off") + " by default.");

    function h0bSideCard(side) {
      var s = (sides && sides[side]) ? sides[side] : {};
      var attacking = (atkSide === side);
      var title = s.title || (attacking ? ("Lead the " + h0bSideName(side)) : ("Hold for the " + h0bSideName(side)));
      var badge = s.badge || (attacking ? "ATTACK" : "DEFEND");
      var deck = s.deck || (attacking
        ? ("Take the offensive and seize " + objName + " before the enemy reserves can arrive.")
        : ("Stand on " + objName + " and deny it to the enemy assault until the clock runs out."));
      var cleanDeck = String(deck).replace(/<[^>]+>/g, "");
      var cleanBadge = String(badge).replace(/<[^>]+>/g, "").replace(/&#[0-9]+;/g, "").replace(/&[a-z]+;/g, "").replace(/\s+/g, " ").trim();
      if (!cleanBadge) cleanBadge = attacking ? "ATTACK" : "DEFEND";
      return '<button type="button" data-brside="' + h0bEsc(side) + '" class="h0-side-card" aria-label="' + h0bEsc(title + " -- " + (attacking ? "attack" : "defend") + ". " + cleanDeck) + '">'
        + '<span class="h0-side-badge">' + h0bEsc(cleanBadge) + '</span>'
        + '<h2>' + h0bEsc(title) + '</h2>'
        + '<p>' + deck + '</p>'
        + '<div class="h0-side-role" aria-hidden="true">'
          + '<span>Command<b>' + h0bEsc(h0bShortSide(side)) + '</b></span>'
          + '<span>Role<b>' + (attacking ? 'Attack' : 'Defend') + '</b></span>'
        + '</div>'
        + '</button>';
    }

    var html = '<section class="h0-side-shell" role="region" aria-label="Choose the army you will command">'
      + '<header class="h0-side-head">'
        + '<div><p class="h0-brief-kicker">Side Choice</p><h1>' + h0bEsc(heading) + '</h1>'
        + '<p class="h0-side-sub">' + h0bEsc(intro) + '</p></div>'
        + '<div class="h0-brief-chips">'
          + '<span class="h0-brief-chip"><b>Objective</b>' + h0bEsc(objName) + '</span>'
          + '<span class="h0-brief-chip"><b>Attacker</b>' + h0bEsc(h0bShortSide(atkSide)) + '</span>'
        + '</div>'
      + '</header>'
      + '<div class="h0-side-grid" role="group" aria-label="Choose the army you will command">' + h0bSideCard(atkSide) + h0bSideCard(defSide) + '</div>'
      + '<div class="h0-side-matchup">' + ((typeof fldMatchupHtml === "function") ? fldMatchupHtml(sd) : "") + '</div>'
      + '<footer class="h0-side-foot"><p>' + h0bEsc(foot) + '</p><button id="fldBrSideBack" type="button" class="upg">Back</button></footer>'
      + '</section>';

    openSheet(html);
    var cards = document.querySelectorAll("[data-brside]");
    for (var i = 0; i < cards.length; i++) {
      (function (c) {
        c.addEventListener("click", function () {
          var side = c.getAttribute("data-brside");
          try { if (typeof closeSheet === "function") closeSheet(); } catch (e) {}
          go(side === "CS" ? "CS" : "US");
        });
      })(cards[i]);
    }
    var back = document.getElementById("fldBrSideBack");
    if (back) back.addEventListener("click", function () { if (typeof openMainMenu === "function") openMainMenu(); });
    try { var first = document.querySelector("[data-brside]"); if (first) first.focus(); } catch (e) {}
  };
})();
