/* ==== §16 — MENUS & BOOT (CHUNK-08) ==== */

// ---- openMainMenu() ----
// Sets mode=menu, hides HUD, builds the main menu sheet with dynamic ids prefixed "mm".
function openMainMenu() {
  G.mode = "menu";
  hideHud();

  // Check for a resumable campaign save — hasSave() only tells us a save exists;
  // we must inspect the campaign field to conditionally show Continue.
  var sv = loadLocal();
  var hasCampaignSave = !!(sv && sv.campaign);

  var continueHtml = "";
  if (hasCampaignSave) {
    continueHtml =
      '<button class="mbtn" id="mmContinue">' +
        '<span class="ic us" style="font-size:16px">★</span>' +
        '<span><div class="t">Continue Campaign</div>' +
        '<div class="d">Resume where you left off</div></span>' +
      '</button>';
  }

  var html =
    '<h1 class="title-xl">GENERALS OF THE REPUBLIC</h1>' +
    '<p class="title-sub">A War Saga &mdash; Vol. I: The Civil War</p>' +
    '<hr class="rule">' +
    '<div class="menu-grid">' +
      continueHtml +
      '<button class="mbtn" id="mmNewUS">' +
        '<span class="ic us">★</span>' +
        '<span><div class="t">New Campaign &mdash; Union</div>' +
        '<div class="d">Lead the Federal armies to reunion</div></span>' +
      '</button>' +
      '<button class="mbtn" id="mmNewCS">' +
        '<span class="ic cs">✪</span>' +
        '<span><div class="t">New Campaign &mdash; Confederate</div>' +
        '<div class="d">Defend Southern independence</div></span>' +
      '</button>' +
      '<button class="mbtn" id="mmFree">' +
        '<span class="ic pick">⚔</span>' +
        '<span><div class="t">Free Battle</div>' +
        '<div class="d">Choose any engagement from the roster</div></span>' +
      '</button>' +
      '<button class="mbtn" id="mmLoad">' +
        '<span class="ic load">↑</span>' +
        '<span><div class="t">Load from File</div>' +
        '<div class="d">Import a previously exported save</div></span>' +
      '</button>' +
      '<button class="mbtn" id="mmSettings">' +
        '<span class="ic set">⚙</span>' +
        '<span><div class="t">Settings</div>' +
        '<div class="d">Difficulty, map style, sound</div></span>' +
      '</button>' +
    '</div>' +
    '<p class="hint">A Civil War hex wargame. Seize objectives &mdash; your veterans remember.</p>';

  openSheet(html);

  // Continue: save was already applied at boot; applySave not needed again.
  // Just check that the live G.campaign is non-null (it was set by applySave at init).
  if (hasCampaignSave) {
    var btnContinue = document.getElementById("mmContinue");
    if (btnContinue) {
      btnContinue.addEventListener("click", function () {
        // applySave was called at boot, so G.campaign is already live.
        // If somehow it's null (e.g. player returned to menu during a session),
        // re-apply to be safe.
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

  // New Campaign — Union: show muster-choice sheet
  var btnNewUS = document.getElementById("mmNewUS");
  if (btnNewUS) {
    btnNewUS.addEventListener("click", function () {
      _openMusterChoice("US");
    });
  }

  // New Campaign — Confederate: show muster-choice sheet
  var btnNewCS = document.getElementById("mmNewCS");
  if (btnNewCS) {
    btnNewCS.addEventListener("click", function () {
      _openMusterChoice("CS");
    });
  }

  // Free Battle
  var btnFree = document.getElementById("mmFree");
  if (btnFree) {
    btnFree.addEventListener("click", function () {
      openPicker();
    });
  }

  // Load from File
  var btnLoad = document.getElementById("mmLoad");
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

  // Settings
  var btnSettings = document.getElementById("mmSettings");
  if (btnSettings) {
    btnSettings.addEventListener("click", function () {
      openSettings();
    });
  }
}

// ---- _openMusterChoice(side) ----
// Inline muster-choice sheet: Iron vs Standard, each → startCampaign(side, iron).
// Dynamically-generated sheet with ms-prefix ids.
function _openMusterChoice(side) {
  var sideLabel = side === "US" ? "Union" : "Confederate";
  var html =
    '<h1 class="title-xl">' + sideLabel + ' Campaign</h1>' +
    '<p class="title-sub">Choose Your Terms of Service</p>' +
    '<hr class="rule">' +
    '<p class="lede">Select the campaign difficulty terms. This choice is permanent for the run.</p>' +
    '<div class="menu-grid">' +
      '<button class="mbtn" id="msMuster">' +
        '<span class="ic ' + (side === "US" ? "us" : "cs") + '">' + (side === "US" ? "★" : "✪") + '</span>' +
        '<span><div class="t">Standard Campaign</div>' +
        '<div class="d">Defeat opens a recovery battle before the campaign continues. Recommended for new commanders.</div></span>' +
      '</button>' +
      '<button class="mbtn" id="msIron">' +
        '<span class="ic set">⚑</span>' +
        '<span><div class="t">Iron Brigade (Ironman)</div>' +
        '<div class="d">No recovery. A defeat ends the campaign. For veterans only.</div></span>' +
      '</button>' +
      '<div class="btn-row">' +
        '<button class="ghostbtn" id="msBack">Back</button>' +
      '</div>' +
    '</div>';

  openSheet(html);

  var btnStd = document.getElementById("msMuster");
  if (btnStd) {
    btnStd.addEventListener("click", function () {
      startCampaign(side, false);
      maybeTutorial();
    });
  }

  var btnIron = document.getElementById("msIron");
  if (btnIron) {
    btnIron.addEventListener("click", function () {
      startCampaign(side, true);
      maybeTutorial();
    });
  }

  var btnBack = document.getElementById("msBack");
  if (btnBack) {
    btnBack.addEventListener("click", function () {
      openMainMenu();
    });
  }
}

// ---- openPicker() ----
// Tab row All/E/W/TM/N + Back; .blist of battle rows; click → side-choice mini-sheet.
// Dynamic ids prefixed "pk".
function openPicker() {
  _renderPicker("All");
}

// Internal: renders the picker with the given theater filter active.
function _renderPicker(activeTab) {
  var tabs = ["All", "E", "W", "TM", "N"];
  var tabLabels = { All: "All", E: "Eastern", W: "Western", TM: "Trans-Miss.", N: "Naval" };

  var tabsHtml = "";
  for (var ti = 0; ti < tabs.length; ti++) {
    var t = tabs[ti];
    var on = t === activeTab ? " on" : "";
    tabsHtml += '<button class="tab' + on + '" id="pkTab_' + t + '">' + (tabLabels[t] || t) + '</button>';
  }
  tabsHtml += '<button class="tab" id="pkBack">Back</button>';

  // Filter BATTLES
  var filtered = BATTLES.filter(function (bd) {
    if (activeTab === "All") return true;
    if (activeTab === "N") return !!bd.nav;
    return bd.th === activeTab;
  });

  var rowsHtml = "";
  for (var bi = 0; bi < filtered.length; bi++) {
    var bd = filtered[bi];
    var navalTag = bd.nav ? '<span class="tagn">NAVAL</span>' : "";
    var thLabel = bd.th === "E" ? "Eastern" : bd.th === "W" ? "Western" : bd.th === "TM" ? "Trans-Miss." : "Naval";
    rowsHtml +=
      '<div class="brow" id="pkRow_' + bd.id + '" data-bdid="' + bd.id + '">' +
        '<span class="bn">' + bd.name + navalTag + '</span>' +
        '<span class="bmeta">' + (bd.cmdUS || "—") + ' <small>vs</small> ' + (bd.cmdCS || "—") + '</span>' +
        '<span class="byr">' + bd.year + '</span>' +
        '<span class="bth">' + thLabel + '</span>' +
      '</div>';
  }

  if (!rowsHtml) {
    rowsHtml = '<p class="hint">No battles in this theater.</p>';
  }

  var html =
    '<h1 class="title-xl">Battle Roster</h1>' +
    '<p class="title-sub">84 engagements &mdash; choose your ground</p>' +
    '<hr class="rule">' +
    '<div class="tabs" id="pkTabs">' + tabsHtml + '</div>' +
    '<div class="blist" id="pkList">' + rowsHtml + '</div>';

  openSheet(html);

  // Wire tab buttons
  for (var ti2 = 0; ti2 < tabs.length; ti2++) {
    (function (tabVal) {
      var btn = document.getElementById("pkTab_" + tabVal);
      if (!btn) return;
      btn.addEventListener("click", function () {
        _renderPicker(tabVal);
      });
    })(tabs[ti2]);
  }

  var btnBack = document.getElementById("pkBack");
  if (btnBack) {
    btnBack.addEventListener("click", function () {
      openMainMenu();
    });
  }

  // Wire battle row clicks
  for (var bi2 = 0; bi2 < filtered.length; bi2++) {
    (function (bdRef) {
      var row = document.getElementById("pkRow_" + bdRef.id);
      if (!row) return;
      row.addEventListener("click", function () {
        _openSideChoice(bdRef);
      });
    })(filtered[bi2]);
  }
}

// ---- _openSideChoice(bd) ----
// Small sheet: Fight as Union / Fight as Confederate / Back.
// Dynamic ids prefixed "pk".
function _openSideChoice(bd) {
  var html =
    '<h1 class="title-xl">' + bd.name + '</h1>' +
    '<p class="title-sub">' + bd.year + ' &mdash; ' +
      (bd.th === "E" ? "Eastern" : bd.th === "W" ? "Western" : bd.th === "TM" ? "Trans-Mississippi" : "Naval") +
      ' Theater' +
    '</p>' +
    '<hr class="rule">' +
    '<p class="lede">' + (bd.res || "") + '</p>' +
    '<div class="menu-grid">' +
      '<button class="mbtn" id="pkFightUS">' +
        '<span class="ic us">★</span>' +
        '<span><div class="t">Fight as Union</div>' +
        '<div class="d">Cmd: ' + (bd.cmdUS || "—") + '</div></span>' +
      '</button>' +
      '<button class="mbtn" id="pkFightCS">' +
        '<span class="ic cs">✪</span>' +
        '<span><div class="t">Fight as Confederate</div>' +
        '<div class="d">Cmd: ' + (bd.cmdCS || "—") + '</div></span>' +
      '</button>' +
      '<div class="btn-row">' +
        '<button class="ghostbtn" id="pkSideBack">Back</button>' +
      '</div>' +
    '</div>';

  openSheet(html);

  var btnUS = document.getElementById("pkFightUS");
  if (btnUS) {
    btnUS.addEventListener("click", function () {
      closeSheet();
      showHud();
      startBattleRuntime(bd, "US", false);
      maybeTutorial();
    });
  }

  var btnCS = document.getElementById("pkFightCS");
  if (btnCS) {
    btnCS.addEventListener("click", function () {
      closeSheet();
      showHud();
      startBattleRuntime(bd, "CS", false);
      maybeTutorial();
    });
  }

  var btnBack = document.getElementById("pkSideBack");
  if (btnBack) {
    btnBack.addEventListener("click", function () {
      openPicker();
    });
  }
}

// ---- openSettings() ----
// Settings sheet with seg rows for Difficulty, Map Style, Sound; Export; Back.
// Dynamic ids prefixed "st".
function openSettings() {
  _renderSettings();
}

function _renderSettings() {
  // Difficulty seg
  var diffSegs = "";
  for (var di = 0; di < DIFF.length; di++) {
    var on = G.settings.diff === di ? " on" : "";
    diffSegs += '<button class="' + on + '" id="stDiff_' + di + '">' + DIFF[di].name + '</button>';
  }

  // Map Style seg
  var renderSegs = "";
  for (var ri = 0; ri < RENDER_NAMES.length; ri++) {
    var ron = G.settings.render === ri ? " on" : "";
    renderSegs += '<button class="' + ron + '" id="stRender_' + ri + '">' + RENDER_NAMES[ri] + '</button>';
  }

  // Sound seg
  var sOn  = G.settings.sound ? " on" : "";
  var sOff = G.settings.sound ? "" : " on";

  var html =
    '<h1 class="title-xl">Settings</h1>' +
    '<p class="title-sub">Field Orders &amp; Preferences</p>' +
    '<hr class="rule">' +

    '<div class="setrow">' +
      '<div><div class="sl">Difficulty</div>' +
      '<div class="sd">Affects fog, AI aggression, supply, and casualties</div></div>' +
      '<div class="seg" id="stDiffSeg">' + diffSegs + '</div>' +
    '</div>' +

    '<div class="setrow">' +
      '<div><div class="sl">Map Style</div>' +
      '<div class="sd">Visual skin for the battlefield</div></div>' +
      '<div class="seg" id="stRenderSeg">' + renderSegs + '</div>' +
    '</div>' +

    '<div class="setrow">' +
      '<div><div class="sl">Sound</div>' +
      '<div class="sd">Synthesised SFX &amp; ambient wind</div></div>' +
      '<div class="seg" id="stSoundSeg">' +
        '<button class="' + sOn + '" id="stSoundOn">On</button>' +
        '<button class="' + sOff + '" id="stSoundOff">Off</button>' +
      '</div>' +
    '</div>' +

    '<hr class="rule">' +
    '<div class="btn-row">' +
      '<button class="ghostbtn" id="stExport">Export Save</button>' +
      '<button class="bigbtn" id="stBack">Back</button>' +
    '</div>' +
    '<p class="hint">Settings are saved automatically on each change.</p>';

  openSheet(html);

  // Wire difficulty buttons
  for (var di2 = 0; di2 < DIFF.length; di2++) {
    (function (idx) {
      var btn = document.getElementById("stDiff_" + idx);
      if (!btn) return;
      btn.addEventListener("click", function () {
        G.settings.diff = idx;
        saveLocal();
        if (G.mode === "battle") draw();
        _renderSettings();
      });
    })(di2);
  }

  // Wire render buttons
  for (var ri2 = 0; ri2 < RENDER_NAMES.length; ri2++) {
    (function (idx) {
      var btn = document.getElementById("stRender_" + idx);
      if (!btn) return;
      btn.addEventListener("click", function () {
        G.settings.render = idx;
        saveLocal();
        if (G.mode === "battle") draw();
        _renderSettings();
      });
    })(ri2);
  }

  // Wire sound On
  var btnSoundOn = document.getElementById("stSoundOn");
  if (btnSoundOn) {
    btnSoundOn.addEventListener("click", function () {
      G.settings.sound = true;
      if (G.mode === "battle") ambientStart();
      saveLocal();
      if (G.mode === "battle") draw();
      _renderSettings();
    });
  }

  // Wire sound Off
  var btnSoundOff = document.getElementById("stSoundOff");
  if (btnSoundOff) {
    btnSoundOff.addEventListener("click", function () {
      G.settings.sound = false;
      ambientStop();
      saveLocal();
      if (G.mode === "battle") draw();
      _renderSettings();
    });
  }

  // Export Save
  var btnExport = document.getElementById("stExport");
  if (btnExport) {
    btnExport.addEventListener("click", function () {
      exportSave();
    });
  }

  // Back
  var btnBack = document.getElementById("stBack");
  if (btnBack) {
    btnBack.addEventListener("click", function () {
      openMainMenu();
    });
  }
}

// ---- maybeTutorial() ----
// Fires the 5-step tutorial the first time a battle starts.
// Guard: only when !G.settings.tutDone AND G.mode==="battle".
// coachShow steps use {title, body} per §9 _coachRender() signature.
function maybeTutorial() {
  if (G.settings.tutDone) return;
  if (G.mode !== "battle") return;

  var steps = [
    {
      title: "Select a Unit",
      body:  "Tap any blue unit on the map to select it. Its movement range will glow green."
    },
    {
      title: "March",
      body:  "Click a reachable hex to move your unit. Green hexes show where it can go this turn."
    },
    {
      title: "Fire",
      body:  "Press Fire, then click a glowing enemy to shoot. Artillery reaches further than infantry."
    },
    {
      title: "End Turn",
      body:  "When all units have acted, press End Turn (or hit Enter). The enemy phase begins."
    },
    {
      title: "Hold Objectives",
      body:  "★ hexes score points each turn. Hold more than your enemy when time runs out to win."
    }
  ];

  G.settings.tutDone = true;
  saveLocal();
  coachShow(steps);
}

// ---- init() ----
// Wires all persistent DOM button handlers. Must be the LAST function called.
// Nothing here touches the DOM before init() runs; all wiring is inside init().
function init() {

  // ---- #btnEndTurn ----
  var btnEndTurn = document.getElementById("btnEndTurn");
  if (btnEndTurn) {
    btnEndTurn.addEventListener("click", function () {
      if (G.mode !== "battle") return;
      if (!G.battle) return;
      if (G.battle.over) return;
      endPlayerTurn();
    });
  }

  // ---- #btnMenu (in-battle pause sheet) ----
  var btnMenu = document.getElementById("btnMenu");
  if (btnMenu) {
    btnMenu.addEventListener("click", function () {
      if (G.mode !== "battle" || !G.battle) return;
      _openPauseSheet();
    });
  }

  // ---- Order buttons ----

  // #obMove
  var btnMove = document.getElementById("obMove");
  if (btnMove) {
    btnMove.addEventListener("click", function () {
      if (G.mode !== "battle" || !G.battle) return;
      var u = G.sel;
      if (!u) return;
      if (u.side !== G.battle.playerSide) return;
      setOrder("move");
    });
  }

  // #obFire
  var btnFire = document.getElementById("obFire");
  if (btnFire) {
    btnFire.addEventListener("click", function () {
      if (G.mode !== "battle" || !G.battle) return;
      var u = G.sel;
      if (!u) return;
      if (u.side !== G.battle.playerSide) return;
      setOrder("fire");
    });
  }

  // #obCharge
  var btnCharge = document.getElementById("obCharge");
  if (btnCharge) {
    btnCharge.addEventListener("click", function () {
      if (G.mode !== "battle" || !G.battle) return;
      var u = G.sel;
      if (!u) return;
      if (u.side !== G.battle.playerSide) return;
      setOrder("charge");
    });
  }

  // #obEntrench — guard: sel, playerSide, !done, type not in cav/nav/hq, ent < 3
  var btnEntrench = document.getElementById("obEntrench");
  if (btnEntrench) {
    btnEntrench.addEventListener("click", function () {
      if (G.mode !== "battle" || !G.battle) return;
      var u = G.sel;
      if (!u) return;
      if (u.side !== G.battle.playerSide) return;
      if (u.done) return;
      if (u.type === "cav" || u.type === "nav" || u.type === "hq") return;
      if (u.ent >= 3) return;
      u.ent = Math.min(3, u.ent + 1);
      u.done = true;
      playSfx("march");
      clearSelection();
      refreshUI();
      draw();
    });
  }

  // #obDone — guard: sel, playerSide, mode=battle
  var btnDone = document.getElementById("obDone");
  if (btnDone) {
    btnDone.addEventListener("click", function () {
      if (G.mode !== "battle" || !G.battle) return;
      var u = G.sel;
      if (!u) return;
      if (u.side !== G.battle.playerSide) return;
      u.done = true;
      clearSelection();
      selectNextUnit();
    });
  }

  // ---- Boot sequence ----
  resize();
  var sv = loadLocal();
  if (sv) applySave(sv);
  openMainMenu();
}

// ---- _openPauseSheet() ----
// In-battle pause: Resume / Settings / Abandon Battle.
// Abandon in campaign counts as loss via campaignAdvance(enemySide, "win").
function _openPauseSheet() {
  var fromCampaign = !!(G.battle && G.battle.fromCampaign);

  var html =
    '<h1 class="title-xl">Pause</h1>' +
    '<p class="title-sub">' + (G.battle ? G.battle.bd.name : "Battle") + '</p>' +
    '<hr class="rule">' +
    '<div class="menu-grid">' +
      '<button class="mbtn" id="pauseResume">' +
        '<span class="ic set">▶</span>' +
        '<span><div class="t">Resume</div>' +
        '<div class="d">Return to the battle</div></span>' +
      '</button>' +
      '<button class="mbtn" id="pauseSettings">' +
        '<span class="ic set">⚙</span>' +
        '<span><div class="t">Settings</div>' +
        '<div class="d">Adjust difficulty, map style, sound</div></span>' +
      '</button>' +
      '<button class="mbtn" id="pauseAbandon">' +
        '<span class="ic load" style="color:var(--blood-lt)">✕</span>' +
        '<span><div class="t">Abandon Battle</div>' +
        '<div class="d">' + (fromCampaign ? "Counts as a defeat in your campaign" : "Return to main menu") + '</div></span>' +
      '</button>' +
    '</div>';

  openSheet(html);

  var btnResume = document.getElementById("pauseResume");
  if (btnResume) {
    btnResume.addEventListener("click", function () {
      closeSheet();
    });
  }

  var btnSettings = document.getElementById("pauseSettings");
  if (btnSettings) {
    btnSettings.addEventListener("click", function () {
      openSettings();
    });
  }

  var btnAbandon = document.getElementById("pauseAbandon");
  if (btnAbandon) {
    btnAbandon.addEventListener("click", function () {
      _confirmAbandon(fromCampaign);
    });
  }
}

// ---- _confirmAbandon(fromCampaign) ----
// Confirm dialog before abandoning. If campaign, calls campaignAdvance(enemySide, "win").
function _confirmAbandon(fromCampaign) {
  var html =
    '<h1 class="title-xl">Abandon Battle?</h1>' +
    '<hr class="rule">' +
    '<p class="lede">' +
      (fromCampaign
        ? 'Abandoning counts as a defeat. Your campaign will enter recovery. Are you sure?'
        : 'You will lose all progress in this engagement. Return to the main menu?') +
    '</p>' +
    '<div class="btn-row">' +
      '<button class="bigbtn" id="abandonConfirm">Abandon</button>' +
      '<button class="ghostbtn" id="abandonCancel">Cancel</button>' +
    '</div>';

  openSheet(html);

  var btnConfirm = document.getElementById("abandonConfirm");
  if (btnConfirm) {
    btnConfirm.addEventListener("click", function () {
      if (fromCampaign && G.battle) {
        // Mark over so AI/event guards stop
        G.battle.over = true;
        var enemySide = G.battle.enemySide;
        hideHud();
        campaignAdvance(enemySide, "win");
      } else {
        hideHud();
        openMainMenu();
      }
    });
  }

  var btnCancel = document.getElementById("abandonCancel");
  if (btnCancel) {
    btnCancel.addEventListener("click", function () {
      // Go back to the pause sheet rather than directly closing
      _openPauseSheet();
    });
  }
}

init();
