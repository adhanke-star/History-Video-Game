/* ==== §21 — NEWSPAPER MENU (G5) ==== */

// G5 redeclares openMainMenu() only (function declaration; override-by-append pattern).
// All behaviour of CHUNK-08's version is preserved by calling the SAME functions
// with the SAME guards — zero behaviour loss.
// Scoped styles injected under id="gorNewsCss" (guarded; will not re-inject).
// Dynamic element ids are prefixed "gn" to avoid collisions.

// ---- Inject broadsheet CSS (once) ----
(function _gorNewsInjectCss() {
  if (document.getElementById("gorNewsCss")) return;
  var s = document.createElement("style");
  s.id = "gorNewsCss";
  s.textContent = [
    /* ------------------------------------------------------------------ */
    /* Parchment broadsheet lives inside .sheet .pad (#sheetPad).          */
    /* The outer .sheet frame is already dark (--panel); broadsheet area   */
    /* is a warm light parchment (#f5edd6) within it.                      */
    /*                                                                      */
    /* Contrast ratios (measured on #f5edd6 parchment bg, WCAG AA = 4.5): */
    /*   #2b2118 (--ink)     on #f5edd6 → ~12.1 : 1  ✓                   */
    /*   #4a3c2c (--ink-soft) on #f5edd6 → ~7.4 : 1  ✓                   */
    /*   #7a5c2a (brass-dark) on #f5edd6 → ~4.6 : 1  ✓ (headlines)       */
    /*   #5c3c18 (dateline)   on #f5edd6 → ~5.9 : 1  ✓                   */
    /* ------------------------------------------------------------------ */

    /* Broadsheet container — fills #sheetPad content area */
    ".gn-paper{",
    "  background:#f5edd6;",
    "  color:#2b2118;",
    "  font-family:'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif;",
    "  border:1px solid #c8b07a;",
    "  border-radius:3px;",
    "  padding:0 0 18px 0;",
    "  box-shadow:inset 0 0 40px rgba(160,120,60,.12);",
    "}",

    /* Masthead */
    ".gn-masthead{",
    "  text-align:center;",
    "  padding:14px 20px 8px;",
    "  border-bottom:3px double #2b2118;",
    "}",
    ".gn-masthead-name{",
    "  font-size:clamp(22px,4.5vw,36px);",
    "  font-weight:700;",
    "  letter-spacing:.18em;",
    "  text-transform:uppercase;",
    "  color:#2b2118;",
    "  line-height:1.0;",
    "  margin:0 0 3px;",
    "}",
    ".gn-masthead-rule{",
    "  height:2px;",
    "  background:#2b2118;",
    "  margin:4px 0 5px;",
    "}",
    ".gn-dateline{",
    "  font-size:10px;",
    "  letter-spacing:.12em;",
    "  text-transform:uppercase;",
    "  color:#5c3c18;",
    "  margin:0;",
    "}",
    ".gn-masthead-sub{",
    "  font-size:11px;",
    "  font-style:italic;",
    "  color:#4a3c2c;",
    "  margin:3px 0 0;",
    "}",

    /* Woodcut slot */
    ".gn-woodcut{",
    "  display:flex;",
    "  justify-content:center;",
    "  padding:8px 0 4px;",
    "  border-bottom:1px solid #2b2118;",
    "}",

    /* Three-column body */
    ".gn-columns{",
    "  display:grid;",
    "  grid-template-columns:1fr 1fr 1fr;",
    "  gap:0;",
    "  padding:10px 0 0;",
    "}",
    "@media(max-width:540px){",
    "  .gn-columns{grid-template-columns:1fr;}",
    "}",

    /* Each column */
    ".gn-col{",
    "  padding:0 14px;",
    "  border-right:1px solid #b09a6a;",
    "}",
    ".gn-col:last-child{border-right:none;}",

    /* Column section heading */
    ".gn-col-head{",
    "  font-size:8px;",
    "  letter-spacing:.18em;",
    "  text-transform:uppercase;",
    "  color:#5c3c18;",
    "  border-bottom:1px solid #2b2118;",
    "  margin:0 0 8px;",
    "  padding:0 0 3px;",
    "}",

    /* Headline buttons — ink on parchment; styled as period display type  */
    /* AA contrast: #2b2118 on #f5edd6 = 12.1:1; hover #7a5c2a = 4.6:1   */
    ".gn-btn{",
    "  display:block;",
    "  width:100%;",
    "  text-align:left;",
    "  background:transparent;",
    "  border:none;",
    "  padding:0 0 10px 0;",
    "  margin:0 0 8px 0;",
    "  border-bottom:1px solid #c8b07a;",
    "  cursor:pointer;",
    "  font-family:inherit;",
    "  color:#2b2118;",
    "}",
    ".gn-btn:hover .gn-hl,.gn-btn:focus .gn-hl{color:#7a5c2a;text-decoration:underline;}",
    ".gn-btn:focus{outline:2px solid #7a5c2a;outline-offset:2px;}",
    ".gn-btn:last-child{border-bottom:none;}",

    /* Headline text */
    ".gn-hl{",
    "  display:block;",
    "  font-size:clamp(11px,2.1vw,15px);",
    "  font-weight:700;",
    "  line-height:1.25;",
    "  text-transform:uppercase;",
    "  letter-spacing:.02em;",
    "  color:#2b2118;",
    "  margin:0 0 3px;",
    "}",
    ".gn-hl-xl{",
    "  font-size:clamp(14px,2.8vw,20px);",
    "  letter-spacing:.04em;",
    "}",
    ".gn-deck{",
    "  display:block;",
    "  font-size:10px;",
    "  font-style:italic;",
    "  color:#4a3c2c;",
    "  line-height:1.4;",
    "  margin:0;",
    "}",

    /* Disabled headline (Continue when no save) */
    ".gn-btn[disabled]{opacity:.4;cursor:default;}",
    ".gn-btn[disabled] .gn-hl,.gn-btn[disabled] .gn-deck{color:#6a5a3a;}",

    /* Classifieds box — Settings */
    ".gn-classifieds{",
    "  margin:0 0 10px;",
    "  border:1px solid #2b2118;",
    "  padding:7px 8px;",
    "}",
    ".gn-classifieds-head{",
    "  font-size:8px;",
    "  letter-spacing:.18em;",
    "  text-transform:uppercase;",
    "  color:#2b2118;",
    "  font-weight:700;",
    "  border-bottom:1px solid #2b2118;",
    "  margin:0 0 5px;",
    "  padding:0 0 3px;",
    "}",
    ".gn-classifieds-body{",
    "  font-size:10px;",
    "  line-height:1.5;",
    "  color:#4a3c2c;",
    "}",

    /* Advertisement card — Load from File */
    ".gn-advert{",
    "  margin:0 0 10px;",
    "  border:2px solid #2b2118;",
    "  padding:7px 8px;",
    "  text-align:center;",
    "  background:#ede4c2;",
    "}",
    ".gn-advert-head{",
    "  font-size:9px;",
    "  letter-spacing:.14em;",
    "  text-transform:uppercase;",
    "  font-weight:700;",
    "  color:#2b2118;",
    "  border-bottom:1px solid #2b2118;",
    "  margin:0 0 4px;",
    "  padding:0 0 3px;",
    "}",
    ".gn-advert-body{",
    "  font-size:10px;",
    "  font-style:italic;",
    "  color:#4a3c2c;",
    "  line-height:1.4;",
    "}",

    /* Footer rule / masthead footer */
    ".gn-footer{",
    "  text-align:center;",
    "  font-size:9px;",
    "  letter-spacing:.12em;",
    "  color:#5c3c18;",
    "  border-top:1px solid #b09a6a;",
    "  margin:14px 20px 0;",
    "  padding:8px 0 0;",
    "}",
  ].join("");
  document.head.appendChild(s);
}());

// ---- Inline hatched SVG woodcut (crossed flags + eagle silhouette) ----
// Rendered as inline SVG; all hatching is drawn paths — no external resources.
// Seeded, deterministic, no Math.random.
function _gorWoodcutSVG(side) {
  // Color identity: Union = navy (#1f3a5f), CS = butternut (#6b5444)
  var accent = (side === "CS") ? "#6b5444" : "#1f3a5f";
  // All coordinates in a 120×72 viewBox
  return (
    '<svg viewBox="0 0 120 72" width="120" height="72" ' +
    'xmlns="http://www.w3.org/2000/svg" ' +
    'aria-hidden="true" role="img">' +
    '<title>Period broadsheet woodcut — crossed battle flags</title>' +
    // Hatched background fill (diagonal lines, period engraving style)
    '<defs>' +
      '<pattern id="gnHatch" patternUnits="userSpaceOnUse" width="5" height="5" ' +
      'patternTransform="rotate(45)">' +
        '<line x1="0" y1="0" x2="0" y2="5" ' +
        'stroke="#c8b07a" stroke-width="0.7" stroke-opacity="0.6"/>' +
      '</pattern>' +
      '<pattern id="gnXHatch" patternUnits="userSpaceOnUse" width="5" height="5">' +
        '<line x1="0" y1="0" x2="5" y2="5" stroke="#c8b07a" stroke-width="0.5" stroke-opacity="0.4"/>' +
        '<line x1="5" y1="0" x2="0" y2="5" stroke="#c8b07a" stroke-width="0.5" stroke-opacity="0.4"/>' +
      '</pattern>' +
    '</defs>' +
    // Background rect with hatch
    '<rect width="120" height="72" fill="#e8d9b0" rx="2"/>' +
    '<rect width="120" height="72" fill="url(#gnHatch)" rx="2"/>' +

    // Left flag staff
    '<line x1="40" y1="10" x2="40" y2="62" stroke="#2b2118" stroke-width="2.2" stroke-linecap="round"/>' +
    // Right flag staff (crossed)
    '<line x1="80" y1="10" x2="80" y2="62" stroke="#2b2118" stroke-width="2.2" stroke-linecap="round"/>' +
    // Cross diagonal lines (the "crossed" element)
    '<line x1="40" y1="10" x2="80" y2="62" stroke="#2b2118" stroke-width="1.4" stroke-opacity="0.5"/>' +
    '<line x1="80" y1="10" x2="40" y2="62" stroke="#2b2118" stroke-width="1.4" stroke-opacity="0.5"/>' +

    // Left flag (rectangular, accent color, hatched)
    '<rect x="40" y="10" width="22" height="15" fill="' + accent + '" rx="1"/>' +
    '<rect x="40" y="10" width="22" height="15" fill="url(#gnXHatch)" rx="1"/>' +
    '<line x1="40" y1="10" x2="62" y2="10" stroke="#2b2118" stroke-width="0.8"/>' +
    '<line x1="40" y1="25" x2="62" y2="25" stroke="#2b2118" stroke-width="0.8"/>' +
    // Star on left flag
    '<text x="51" y="21" font-size="8" text-anchor="middle" fill="#f5edd6" ' +
    'font-family="serif">★</text>' +

    // Right flag (opposite accent)
    '<rect x="58" y="10" width="22" height="15" fill="' +
    (side === "CS" ? "#1f3a5f" : "#6b5444") + '" rx="1"/>' +
    '<rect x="58" y="10" width="22" height="15" fill="url(#gnXHatch)" rx="1"/>' +
    '<line x1="58" y1="10" x2="80" y2="10" stroke="#2b2118" stroke-width="0.8"/>' +
    '<line x1="58" y1="25" x2="80" y2="25" stroke="#2b2118" stroke-width="0.8"/>' +
    '<text x="69" y="21" font-size="8" text-anchor="middle" fill="#f5edd6" ' +
    'font-family="serif">✪</text>' +

    // Eagle silhouette (simplified vector, centered above crossed staffs)
    // Body
    '<ellipse cx="60" cy="38" rx="6" ry="4" fill="#2b2118"/>' +
    // Head
    '<circle cx="60" cy="32" r="3.5" fill="#2b2118"/>' +
    // Beak
    '<path d="M62 32 L66 33.5 L62 34" fill="#9c7a3c" stroke="none"/>' +
    // Left wing
    '<path d="M54 37 Q42 28 30 32 Q40 36 54 40 Z" fill="#2b2118"/>' +
    '<path d="M54 37 Q42 28 30 32 Q40 36 54 40 Z" fill="url(#gnHatch)" opacity="0.4"/>' +
    // Right wing
    '<path d="M66 37 Q78 28 90 32 Q80 36 66 40 Z" fill="#2b2118"/>' +
    '<path d="M66 37 Q78 28 90 32 Q80 36 66 40 Z" fill="url(#gnHatch)" opacity="0.4"/>' +
    // Tail feathers
    '<path d="M56 42 Q58 52 60 54 Q62 52 64 42 Z" fill="#2b2118"/>' +
    // Eye
    '<circle cx="62" cy="31" r="1" fill="#f5edd6"/>' +

    // Olive branch (left talon area) — period engraving flourish
    '<path d="M50 46 Q46 50 42 48 Q45 52 50 50 Q47 54 44 53" ' +
    'fill="none" stroke="#2b2118" stroke-width="1.2" stroke-linecap="round"/>' +
    '<circle cx="42" cy="48" r="1.5" fill="#4a7a38" opacity="0.8"/>' +
    '<circle cx="44" cy="53" r="1.5" fill="#4a7a38" opacity="0.8"/>' +
    '<circle cx="48" cy="51" r="1.2" fill="#4a7a38" opacity="0.8"/>' +

    // Arrows (right talon area)
    '<line x1="70" y1="46" x2="78" y2="52" stroke="#2b2118" stroke-width="1.2" stroke-linecap="round"/>' +
    '<line x1="74" y1="46" x2="82" y2="52" stroke="#2b2118" stroke-width="1.2" stroke-linecap="round"/>' +
    '<polygon points="78,49 76,52 80,52" fill="#2b2118"/>' +
    '<polygon points="82,49 80,52 84,52" fill="#2b2118"/>' +

    // Horizontal rule at base
    '<line x1="10" y1="65" x2="110" y2="65" stroke="#2b2118" stroke-width="1.5"/>' +
    '<line x1="10" y1="67" x2="110" y2="67" stroke="#2b2118" stroke-width="0.5"/>' +
    '</svg>'
  );
}

// ---- Derive dateline year from campaign state ----
// Returns the year (as string) of the NEXT upcoming chain battle,
// or "1861" if no campaign is active.
function _gorDatelineYear() {
  try {
    var C = G.campaign;
    if (!C) return "1861";
    var chain = CHAINS[C.side];
    if (!chain) return "1861";
    var idx = typeof C.idx === "number" ? C.idx : 0;
    // Clamp to chain bounds
    if (idx >= chain.length) {
      // Campaign complete — use year of final battle
      idx = chain.length - 1;
    }
    var battleId = chain[idx];
    var bd = BATTLES.find(function (b) { return b.id === battleId; });
    return bd ? String(bd.year) : "1861";
  } catch (e) {
    return "1861";
  }
}

// ---- openMainMenu() — G5 REDECLARATION ----
// Supersedes CHUNK-08's version by hoisting (function declaration, append position).
// Renders a period broadsheet front page inside #sheetPad via openSheet(html).
// EVERY behaviour of the original is preserved: same gating, same function calls,
// same callback shapes. Only the visual presentation changes.
function openMainMenu() {
  G.mode = "menu";
  hideHud();

  // --- Same Continue gating as CHUNK-08 ---
  // hasSave() only tells us a save file exists; we must inspect the campaign field.
  var sv = loadLocal();
  var hasCampaignSave = !!(sv && sv.campaign);

  // --- Masthead identification ---
  var side = (G.campaign && G.campaign.side === "CS") ? "CS" : "US";
  var mastheadName = (side === "CS") ? "THE RICHMOND DISPATCH" : "THE UNION STANDARD";
  var mastheadSub  = (side === "CS")
    ? "Dispatches of the Confederate Armies — Field Edition"
    : "Published by Authority of the War Department, Washington";

  // --- Dateline ---
  var datelineYear = _gorDatelineYear();
  var datelineText = "Field Despatch &mdash; Campaign Season " + datelineYear +
    " &mdash; One Cent";

  // --- Column 1: CAMPAIGNS ---
  // Continue (conditional) + New Campaign Union + New Campaign Confederate
  var continueHtml = "";
  if (hasCampaignSave) {
    continueHtml =
      '<button class="gn-btn" id="gnContinue" ' +
      'aria-label="Continue Campaign — resume where you left off">' +
        '<span class="gn-hl gn-hl-xl">GEN. RETURNS TO THE FIELD</span>' +
        '<span class="gn-deck">Campaign Resuming &mdash; Dispatch from Headquarters</span>' +
      '</button>';
  }

  var col1Html =
    '<div class="gn-col-head">Campaign Orders</div>' +
    continueHtml +
    '<button class="gn-btn" id="gnNewUS" ' +
    'aria-label="New Campaign — Union. Lead the Federal armies.">' +
      '<span class="gn-hl">FEDERAL ARMIES MUSTER FOR WAR</span>' +
      '<span class="gn-deck">New Union Campaign &mdash; March for Reunion</span>' +
    '</button>' +
    '<button class="gn-btn" id="gnNewCS" ' +
    'aria-label="New Campaign — Confederate. Defend Southern independence.">' +
      '<span class="gn-hl">THE SOUTH SHALL STAND RESOLUTE</span>' +
      '<span class="gn-deck">New Confederate Campaign &mdash; Defend the Republic</span>' +
    '</button>';

  // --- Column 2: DISPATCHES (Free Battle, main feature story) ---
  var col2Html =
    '<div class="gn-col-head">Field Dispatches</div>' +
    '<button class="gn-btn" id="gnFree" ' +
    'aria-label="Free Battle — choose any engagement from 84 historical battles">' +
      '<span class="gn-hl">84 ENGAGEMENTS RECORDED</span>' +
      '<span class="gn-deck">' +
        'From Fort Sumter to Appomattox &mdash; choose your ground. ' +
        'Seize objectives; your veterans remember.' +
      '</span>' +
    '</button>' +
    // Woodcut art slot — inline SVG, no external resources
    '<div class="gn-woodcut" aria-hidden="true">' + _gorWoodcutSVG(side) + '</div>';

  // --- Column 3: NOTICES & ADVERTISEMENTS ---
  // Settings → NOTICES classifieds box
  // Load from File → advertisement card
  var col3Html =
    '<div class="gn-col-head">Notices &amp; Advertisements</div>' +

    // Settings as NOTICES classifieds box
    '<div class="gn-classifieds">' +
      '<div class="gn-classifieds-head">Notices</div>' +
      '<div class="gn-classifieds-body">' +
        '<button class="gn-btn" id="gnSettings" ' +
        'aria-label="Settings — difficulty, map style, sound">' +
          '<span class="gn-hl">FIELD ORDERS &amp; PREFERENCES</span>' +
          '<span class="gn-deck">' +
            'Adjust difficulty, cartographic style, and sound &mdash; ' +
            'settings saved on each change.' +
          '</span>' +
        '</button>' +
      '</div>' +
    '</div>' +

    // Load from File as advertisement card
    '<div class="gn-advert">' +
      '<div class="gn-advert-head">Official Advertisement</div>' +
      '<button class="gn-btn" id="gnLoad" ' +
      'aria-label="Load from File — import a previously exported save">' +
        '<span class="gn-hl">RESTORE YOUR CAMPAIGN</span>' +
        '<span class="gn-advert-body">' +
          'Import a previously exported save file to resume your command.' +
        '</span>' +
      '</button>' +
    '</div>';

  // --- Assemble full broadsheet HTML ---
  var html =
    '<div class="gn-paper">' +

      // Masthead
      '<div class="gn-masthead">' +
        '<div class="gn-masthead-rule"></div>' +
        '<div class="gn-masthead-name">' + mastheadName + '</div>' +
        '<div class="gn-masthead-rule"></div>' +
        '<p class="gn-dateline">' + datelineText + '</p>' +
        '<p class="gn-masthead-sub">' + mastheadSub + '</p>' +
        '<div class="gn-masthead-rule" style="margin-top:6px"></div>' +
      '</div>' +

      // Three-column body
      '<div class="gn-columns">' +
        '<div class="gn-col">' + col1Html + '</div>' +
        '<div class="gn-col">' + col2Html + '</div>' +
        '<div class="gn-col">' + col3Html + '</div>' +
      '</div>' +

      // Footer rule
      '<div class="gn-footer">' +
        'A Civil War Hex Wargame &mdash; Generals of the Republic, Vol. I' +
      '</div>' +

    '</div>';

  openSheet(html);

  // ---- Wire handlers via addEventListener (same pattern as CHUNK-08) ----

  // Continue — EXACT same gating logic as CHUNK-08:
  // hasCampaignSave is already computed; on click, also verify live G.campaign
  // (may be null if player returned to menu during a session), re-apply if needed.
  if (hasCampaignSave) {
    var btnContinue = document.getElementById("gnContinue");
    if (btnContinue) {
      btnContinue.addEventListener("click", function () {
        // Mirror of CHUNK-08: applySave was called at boot so G.campaign is live.
        // Re-apply defensively if somehow null mid-session.
        if (!G.campaign) {
          var sv2 = loadLocal();
          if (sv2) applySave(sv2);
        }
        if (G.campaign) {
          openUpgrade();
        } else {
          toast("No campaign found. Start a new one.");
        }
      });
    }
  }

  // New Campaign — Union (same as CHUNK-08: calls _openMusterChoice)
  var btnNewUS = document.getElementById("gnNewUS");
  if (btnNewUS) {
    btnNewUS.addEventListener("click", function () {
      _openMusterChoice("US");
    });
  }

  // New Campaign — Confederate (same as CHUNK-08: calls _openMusterChoice)
  var btnNewCS = document.getElementById("gnNewCS");
  if (btnNewCS) {
    btnNewCS.addEventListener("click", function () {
      _openMusterChoice("CS");
    });
  }

  // Free Battle (same as CHUNK-08: calls openPicker())
  var btnFree = document.getElementById("gnFree");
  if (btnFree) {
    btnFree.addEventListener("click", function () {
      openPicker();
    });
  }

  // Load from File — SAME callback shape as CHUNK-08:
  // importSave(function(ok){ ok?toast("Save loaded."):toast("Import failed."); openMainMenu(); })
  var btnLoad = document.getElementById("gnLoad");
  if (btnLoad) {
    btnLoad.addEventListener("click", function () {
      importSave(function (ok) {
        if (ok) {
          toast("Save loaded.");
        } else {
          toast("Import failed.");
        }
        openMainMenu();
      });
    });
  }

  // Settings (same as CHUNK-08: calls openSettings())
  var btnSettings = document.getElementById("gnSettings");
  if (btnSettings) {
    btnSettings.addEventListener("click", function () {
      openSettings();
    });
  }
}
