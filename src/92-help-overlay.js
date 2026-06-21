/* ===========================================================================
   J-polish · 92-help-overlay.js — HOW TO PLAY help overlay + first-launch
   welcome card + tactical hotkeys reference.

   Adds:
   (1) A first-launch welcome card (shown ONCE per browser, stored in
       localStorage "gor_welcomed") that orients a new player.
   (2) A "?" hotkey + button (injected into the main-menu Notices column)
       that opens a full How-to-Play reference covering BOTH layers.
   (3) An in-battle "?" button (injected into the tactical HUD control bar)
       showing tactical controls/hotkeys.
   (4) An enhanced pause indicator for the tactical layer.

   Bare-name globals (G, openSheet, openMainMenu, toast, __FIELD, FLD).
   All helpers prefixed `_hp` (help-panel). No literal comment-closer.
   =========================================================================== */

/* ============ (1) FIRST-LAUNCH WELCOME ============ */
var _HP_WELCOMED_KEY = "gor_welcomed";

function _hpShowWelcome() {
  var html =
    '<h1 class="title-xl">The Civil War</h1>' +
    '<p class="title-sub">An American War Saga, Vol. I</p>' +
    '<hr class="rule">' +
    '<p class="lede" style="font-size:14px;line-height:1.6;margin-bottom:14px">' +
      'A teaching wargame in <strong>three layers</strong>: you are <em>President Lincoln or Davis</em>, ' +
      'commanding armies from the Executive Mansion while fighting real-time tactical battles ' +
      'in the style of <em>Ultimate General: Gettysburg</em>.' +
    '</p>' +
    '<div style="display:grid;gap:10px;margin:12px 0">' +
      '<div style="padding:10px 14px;border:1px solid var(--rule);border-radius:4px;background:rgba(0,0,0,.12)">' +
        '<div style="font-weight:bold;font-size:13px;margin-bottom:3px">&#9813; Grand Strategy (Owner Mode)</div>' +
        '<div style="font-size:12px;opacity:.85">Manage economy, blockade, manpower, diplomacy, and politics between battles. ' +
        'Appoint generals, buy weapons, and guide the home front.</div>' +
      '</div>' +
      '<div style="padding:10px 14px;border:1px solid var(--rule);border-radius:4px;background:rgba(0,0,0,.12)">' +
        '<div style="font-weight:bold;font-size:13px;margin-bottom:3px">&#9876; Real-Time Tactical Battles</div>' +
        '<div style="font-size:12px;opacity:.85">Drag brigades to maneuver. Form lines, order charges, ' +
        'and break the enemy morale. The army you built in the strategy layer fields here.</div>' +
      '</div>' +
      '<div style="padding:10px 14px;border:1px solid var(--rule);border-radius:4px;background:rgba(0,0,0,.12)">' +
        '<div style="font-weight:bold;font-size:13px;margin-bottom:3px">&#128218; History Seminar</div>' +
        '<div style="font-size:12px;opacity:.85">PhD-level accuracy with real orders of battle, weapons, and historiography. ' +
        'Anti-Lost-Cause, citation-grade content throughout.</div>' +
      '</div>' +
    '</div>' +
    '<hr class="rule">' +
    '<p style="font-size:13px;opacity:.8;margin-bottom:10px"><strong>Quick start:</strong> ' +
      'Click <em>"Federal Armies Muster for War"</em> for a Union campaign, or use the tactical battle buttons for ' +
      'First Bull Run, Malvern Hill, Antietam, Fredericksburg, Chancellorsville, Gettysburg, or Shiloh. The Skirmish button opens a custom real-time fight.</p>' +
    '<p style="font-size:12px;opacity:.65;margin-bottom:14px">Press <kbd style="padding:1px 5px;border:1px solid var(--rule);border-radius:3px;font-size:11px">?</kbd> anytime for controls help.</p>' +
    '<div class="btn-row">' +
      '<button class="bigbtn" id="hpWelcomeOk" aria-label="Got it — proceed to the main menu">To the Field</button>' +
    '</div>';

  openSheet(html);
  var btn = document.getElementById("hpWelcomeOk");
  if (btn) btn.addEventListener("click", function () {
    try { localStorage.setItem(_HP_WELCOMED_KEY, "1"); } catch (e) {}
    if (typeof openMainMenu === "function") openMainMenu();
  });
}

/* ============ (2) HOW-TO-PLAY REFERENCE (full) ============ */
function _hpShowHelp() {
  var html =
    '<h1 class="title-xl">How to Play</h1>' +
    '<p class="title-sub">Controls &amp; Reference</p>' +
    '<hr class="rule">' +

    '<h2 style="font-size:15px;margin:12px 0 6px">Campaign (Grand Strategy)</h2>' +
    '<div style="font-size:12px;line-height:1.7;opacity:.9">' +
      '<div style="margin-bottom:4px"><strong>Start:</strong> Choose Union or Confederate from the main menu.</div>' +
      '<div style="margin-bottom:4px"><strong>Between battles:</strong> The President\'s Desk auto-surfaces. Manage your economy, buy weapons, appoint generals, handle politics.</div>' +
      '<div style="margin-bottom:4px"><strong>War Department tabs:</strong> Use the War Effort overview, Treasury, Armory, Diplomacy, Cabinet, Decisions, The Press, Command, Victory, and related tabs as they appear.</div>' +
      '<div style="margin-bottom:4px"><strong>Battles:</strong> The pre-battle briefing shows your army strength. Choose prep options (entrench, forced march, etc.) then fight.</div>' +
      '<div style="margin-bottom:4px"><strong>Victory:</strong> Break the enemy\'s will to fight (negotiated peace) or achieve military dominance. Both sides have distinct paths.</div>' +
    '</div>' +
    '<hr class="rule">' +

    '<h2 style="font-size:15px;margin:12px 0 6px">Tactical Battles (Real-Time)</h2>' +
    '<div style="font-size:12px;line-height:1.7;opacity:.9">' +
      '<div style="margin-bottom:4px"><strong>Select:</strong> Click a friendly brigade. Shift+click adds another brigade; <kbd>A</kbd> selects all of your live brigades.</div>' +
      '<div style="margin-bottom:4px"><strong>Move:</strong> With a selection, drag from open ground to place the line. Facing follows the drag direction.</div>' +
      '<div style="margin-bottom:4px"><strong>Orders:</strong> <kbd>L</kbd>=Line &middot; <kbd>C</kbd>=Column &middot; <kbd>H</kbd>=Hold &middot; <kbd>F</kbd>/<kbd>Enter</kbd>=Charge.</div>' +
      '<div style="margin-bottom:4px"><strong>Engineering Corps:</strong> <kbd>E</kbd>=Entrench (dig in for cover) &middot; <kbd>B</kbd>=Abatis (timber belt) &middot; <kbd>X</kbd>=Clear obstacle &middot; <kbd>N</kbd>=Lay pontoon bridge (in a river skirmish). Each reads the realism slider.</div>' +
      '<div style="margin-bottom:4px"><strong>Speed:</strong> <kbd>1</kbd>/<kbd>2</kbd>/<kbd>3</kbd> set 1x / 2x / 4x. <kbd>Space</kbd> begins, pauses, or resumes.</div>' +
      '<div style="margin-bottom:4px"><strong>Battle settings:</strong> <kbd>V</kbd> toggles fog, <kbd>P</kbd> toggles auto-pause, and <kbd>G</kbd> opens the settings drawer.</div>' +
      '<div style="margin-bottom:4px"><strong>Win:</strong> Carry or deny the scenario objective, break the enemy, or in multi-phase battles win enough sectors for the aggregate result.</div>' +
    '</div>' +
    '<hr class="rule">' +

    '<h2 style="font-size:15px;margin:12px 0 6px">Keyboard Shortcuts</h2>' +
    '<div style="display:grid;grid-template-columns:auto 1fr;gap:2px 14px;font-size:12px;opacity:.85">' +
      '<kbd style="padding:1px 5px;border:1px solid var(--rule);border-radius:3px;text-align:center">Space</kbd><span>Pause / Resume</span>' +
      '<kbd style="padding:1px 5px;border:1px solid var(--rule);border-radius:3px;text-align:center">1 2 3</kbd><span>Speed 1x / 2x / 4x</span>' +
      '<kbd style="padding:1px 5px;border:1px solid var(--rule);border-radius:3px;text-align:center">L</kbd><span>Line formation</span>' +
      '<kbd style="padding:1px 5px;border:1px solid var(--rule);border-radius:3px;text-align:center">C</kbd><span>Column formation</span>' +
      '<kbd style="padding:1px 5px;border:1px solid var(--rule);border-radius:3px;text-align:center">H</kbd><span>Hold position</span>' +
      '<kbd style="padding:1px 5px;border:1px solid var(--rule);border-radius:3px;text-align:center">E</kbd><span>Entrench (dig in for cover)</span>' +
      '<kbd style="padding:1px 5px;border:1px solid var(--rule);border-radius:3px;text-align:center">B</kbd><span>Abatis (timber obstacle belt)</span>' +
      '<kbd style="padding:1px 5px;border:1px solid var(--rule);border-radius:3px;text-align:center">X</kbd><span>Clear nearest obstacle</span>' +
      '<kbd style="padding:1px 5px;border:1px solid var(--rule);border-radius:3px;text-align:center">N</kbd><span>Lay pontoon bridge (river)</span>' +
      '<kbd style="padding:1px 5px;border:1px solid var(--rule);border-radius:3px;text-align:center">F / Enter</kbd><span>Charge nearest enemy</span>' +
      '<kbd style="padding:1px 5px;border:1px solid var(--rule);border-radius:3px;text-align:center">A</kbd><span>Select all friendly brigades</span>' +
      '<kbd style="padding:1px 5px;border:1px solid var(--rule);border-radius:3px;text-align:center">Tab</kbd><span>Next unit</span>' +
      '<kbd style="padding:1px 5px;border:1px solid var(--rule);border-radius:3px;text-align:center">V</kbd><span>Fog of war on/off</span>' +
      '<kbd style="padding:1px 5px;border:1px solid var(--rule);border-radius:3px;text-align:center">P</kbd><span>Auto-pause on/off</span>' +
      '<kbd style="padding:1px 5px;border:1px solid var(--rule);border-radius:3px;text-align:center">G</kbd><span>Battle settings drawer</span>' +
      '<kbd style="padding:1px 5px;border:1px solid var(--rule);border-radius:3px;text-align:center">Esc</kbd><span>Exit battle or close an open tactical dialog</span>' +
      '<kbd style="padding:1px 5px;border:1px solid var(--rule);border-radius:3px;text-align:center">?</kbd><span>This help panel</span>' +
    '</div>' +
    '<hr class="rule">' +

    '<h2 style="font-size:15px;margin:12px 0 6px">Tips for New Players</h2>' +
    '<div style="font-size:12px;line-height:1.7;opacity:.85">' +
      '<div style="margin-bottom:4px">&bull; <strong>Try a standalone battle first</strong> — First Bull Run, Malvern Hill, Shiloh, or the Skirmish sandbox — before starting a campaign.</div>' +
      '<div style="margin-bottom:4px">&bull; <strong>Use the Recruit preset</strong> (Command &amp; Realism button on the menu) for easier AI on your first battle.</div>' +
      '<div style="margin-bottom:4px">&bull; <strong>Fog of war</strong> is ON by default for Bull Run (historically accurate). Toggle in battle settings if you prefer full visibility.</div>' +
      '<div style="margin-bottom:4px">&bull; <strong>Flanking</strong> is devastating — get a unit on the enemy\'s side or rear for massive morale damage.</div>' +
      '<div style="margin-bottom:4px">&bull; <strong>Don\'t charge into prepared defenders</strong> — use artillery to soften, then advance in line.</div>' +
      '<div style="margin-bottom:4px">&bull; <strong>Save slots</strong> (main menu) let two players keep separate campaigns.</div>' +
    '</div>' +

    '<div class="btn-row" style="margin-top:14px">' +
      '<button class="bigbtn" id="hpHelpBack" aria-label="Return to menu">Back</button>' +
    '</div>';

  openSheet(html);
  var btn = document.getElementById("hpHelpBack");
  if (btn) btn.addEventListener("click", function () {
    if (typeof openMainMenu === "function") openMainMenu();
  });
}

/* ============ (3) IN-BATTLE TACTICAL HELP OVERLAY ============ */
function _hpShowTacticalHelp() {
  var overlay = document.getElementById("hpTacOverlay");
  if (overlay) {
    overlay.style.display = (overlay.style.display === "none") ? "flex" : "none";
    if (overlay.style.display !== "none") {
      try { var cb0 = document.getElementById("hpTacClose"); if (cb0) cb0.focus(); } catch (e0) {}
    }
    return;
  }

  overlay = document.createElement("div");
  overlay.id = "hpTacOverlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Tactical controls reference");
  overlay.style.cssText = "position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7);padding:20px";
  overlay.innerHTML =
    '<div style="background:#1a1610;border:2px solid #8b7a56;border-radius:8px;padding:24px 28px;max-width:480px;width:100%;max-height:80vh;overflow-y:auto;color:#cdb87f;font-family:Georgia,serif">' +
      '<h2 style="margin:0 0 10px;font-size:17px;text-align:center">Tactical Controls</h2>' +
      '<hr style="border:none;border-top:1px solid #8b7a56;margin:8px 0">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">' +
        '<div><strong>Select unit:</strong> Click</div>' +
        '<div><strong>Multi-select:</strong> Shift+Click</div>' +
        '<div><strong>Select all:</strong> A</div>' +
        '<div><strong>Facing:</strong> Drag direction</div>' +
        '<div><strong>Move:</strong> Drag open ground</div>' +
        '<div><strong>Space:</strong> Pause/Resume</div>' +
        '<div><strong>1/2/3:</strong> 1x / 2x / 4x</div>' +
        '<div><strong>L:</strong> Line formation</div>' +
        '<div><strong>C:</strong> Column (march)</div>' +
        '<div><strong>H:</strong> Hold position</div>' +
        '<div><strong>E:</strong> Entrench (dig in)</div>' +
        '<div><strong>B:</strong> Abatis (timber belt)</div>' +
        '<div><strong>X:</strong> Clear obstacle</div>' +
        '<div><strong>N:</strong> Lay pontoon (river)</div>' +
        '<div><strong>F / Enter:</strong> Charge</div>' +
        '<div><strong>V:</strong> Fog on/off</div>' +
        '<div><strong>P:</strong> Auto-pause</div>' +
        '<div><strong>G:</strong> Settings</div>' +
        '<div><strong>Tab:</strong> Next unit</div>' +
        '<div><strong>Esc:</strong> Close dialog</div>' +
        '<div><strong>?:</strong> Toggle help</div>' +
      '</div>' +
      '<hr style="border:none;border-top:1px solid #8b7a56;margin:10px 0">' +
      '<p style="font-size:11px;opacity:.7;margin:0;text-align:center">Carry or deny the objective, break the enemy, or win the multi-phase sector tally.</p>' +
      '<div style="text-align:center;margin-top:12px">' +
        '<button id="hpTacClose" style="padding:6px 20px;background:#2a2418;border:1px solid #8b7a56;color:#cdb87f;border-radius:4px;cursor:pointer;font-family:Georgia,serif">Got it</button>' +
      '</div>' +
    '</div>';

  var root = document.getElementById("fldRoot") || document.body;
  root.appendChild(overlay);
  overlay.addEventListener("click", function (e) { if (e.target === overlay) overlay.style.display = "none"; });
  overlay.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); overlay.style.display = "none"; try { var rr = document.getElementById("fldRoot"); if (rr) rr.focus(); } catch (e2) {} }
    else if (e.key === "Tab") { e.preventDefault(); var cb = document.getElementById("hpTacClose"); if (cb) cb.focus(); }
  });
  var closeBtn = document.getElementById("hpTacClose");
  if (closeBtn) closeBtn.addEventListener("click", function () { overlay.style.display = "none"; });
  try { if (closeBtn) closeBtn.focus(); } catch (e3) {}
}

/* ============ (4) ENHANCED PAUSE INDICATOR ============ */
function _hpInjectPauseIndicator() {
  if (!__FIELD || !__FIELD.launched) return;
  var root = document.getElementById("fldRoot");
  if (!root) return;
  var existing = document.getElementById("hpPauseInd");
  if (existing) return;

  var ind = document.createElement("div");
  ind.id = "hpPauseInd";
  ind.style.cssText = "position:absolute;top:42px;right:14px;max-width:min(360px,56vw);font-size:12px;font-weight:bold;letter-spacing:.08em;color:#f2e8d5;background:#0c0f14d9;border:1px solid #8b7a56;border-radius:4px;padding:5px 9px;pointer-events:none;z-index:9990;display:none;font-family:Georgia,serif;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
  ind.textContent = "Paused";
  ind.setAttribute("aria-live", "polite");
  root.appendChild(ind);
}

/* Update pause indicator visibility (called from the RAF or on toggle) */
function _hpUpdatePause() {
  var ind = document.getElementById("hpPauseInd");
  if (!ind) return;
  if (__FIELD && __FIELD.launched && __FIELD.paused && __FIELD.phase === "battle") {
    ind.textContent = __FIELD._apReason ? ("Paused: " + __FIELD._apReason) : "Paused";
    ind.style.display = "block";
  } else {
    ind.style.display = "none";
  }
}

/* ============ KEYBOARD LISTENER (global "?" for help) ============ */
(function () {
  document.addEventListener("keydown", function (e) {
    if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
      /* In tactical battle → show tactical overlay */
      if (__FIELD && __FIELD.launched && __FIELD.phase !== "idle") {
        _hpShowTacticalHelp();
        e.preventDefault();
        return;
      }
      /* Otherwise → show the full how-to-play */
      if (typeof G !== "undefined" && G.mode === "menu") {
        _hpShowHelp();
        e.preventDefault();
      }
    }
  });
})();

/* ============ MAIN-MENU INJECTION (MutationObserver) ============ */
(function () {
  if (typeof MutationObserver === "undefined") return;
  var installed = false;
  var obs = new MutationObserver(function (muts) {
    if (installed) return;
    for (var i = 0; i < muts.length; i++) {
      for (var j = 0; j < muts[i].addedNodes.length; j++) {
        var node = muts[i].addedNodes[j];
        if (!node.querySelector) continue;
        var col3 = node.querySelector(".gn-col:last-child .gn-classifieds");
        if (!col3) continue;
        var btn = document.createElement("button");
        btn.className = "gn-btn";
        btn.id = "gnHelp";
        btn.setAttribute("aria-label", "How to Play — controls and reference");
        btn.innerHTML =
          '<span class="gn-hl">HOW TO PLAY</span>' +
          '<span class="gn-deck">Controls, tips &amp; reference for new commanders. Press ? anytime.</span>';
        btn.style.marginTop = "10px";
        col3.parentNode.appendChild(btn);
        btn.addEventListener("click", function () { _hpShowHelp(); });
        installed = true;
        return;
      }
    }
  });
  obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
})();

/* ============ FIRST-LAUNCH CHECK ============ */
(function () {
  /* Wait for DOM + the openMainMenu to have fired, then show welcome if never seen. */
  if (typeof MutationObserver === "undefined") return;
  try {
    if (localStorage.getItem(_HP_WELCOMED_KEY)) return;
  } catch (e) { return; }

  var shown = false;
  var obs2 = new MutationObserver(function (muts) {
    if (shown) return;
    for (var i = 0; i < muts.length; i++) {
      for (var j = 0; j < muts[i].addedNodes.length; j++) {
        var node = muts[i].addedNodes[j];
        if (!node.querySelector) continue;
        if (node.querySelector(".gn-paper") || node.querySelector(".gn-masthead")) {
          shown = true;
          obs2.disconnect();
          setTimeout(function () { _hpShowWelcome(); }, 400);
          return;
        }
      }
    }
  });
  obs2.observe(document.body || document.documentElement, { childList: true, subtree: true });
})();

/* ============ TACTICAL BATTLE HOOKS ============ */
/* Inject the "?" help button into the tactical HUD + the pause indicator.
   Hooks into fldLaunchSandbox via a MutationObserver on #fldRoot creation. */
(function () {
  if (typeof MutationObserver === "undefined") return;
  var obs3 = new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      for (var j = 0; j < muts[i].addedNodes.length; j++) {
        var node = muts[i].addedNodes[j];
        if (!node.querySelector && !node.id) continue;
        var bar = (node.id === "fldBar") ? node : (node.querySelector ? node.querySelector("#fldBar") : null);
        if (!bar) continue;
        /* Inject a "?" button at the end of the control bar */
        var helpBtn = document.createElement("button");
        helpBtn.textContent = "?";
        helpBtn.title = "Controls & Hotkeys";
        helpBtn.style.cssText = "width:32px;height:32px;border-radius:50%;border:1px solid #8b7a56;background:rgba(26,22,16,.85);color:#cdb87f;font-size:16px;font-weight:bold;cursor:pointer;margin-left:6px;font-family:Georgia,serif";
        helpBtn.addEventListener("click", function (e) { e.stopPropagation(); _hpShowTacticalHelp(); });
        bar.appendChild(helpBtn);
        /* Inject pause indicator */
        _hpInjectPauseIndicator();
      }
    }
  });
  obs3.observe(document.body || document.documentElement, { childList: true, subtree: true });
})();

/* Hook into the tactical pause/resume to update the indicator.
   The tactical engine toggles __FIELD.paused; we poll via a lightweight interval
   that self-removes when the battle ends. */
(function () {
  var _hpPollId = null;
  var _hpPollCheck = function () {
    if (!__FIELD || !__FIELD.launched) {
      if (_hpPollId) { clearInterval(_hpPollId); _hpPollId = null; }
      var ind2 = document.getElementById("hpPauseInd");
      if (ind2) ind2.style.display = "none";
      return;
    }
    _hpUpdatePause();
  };
  /* Start polling when __FIELD.launched becomes true (watch via interval since
     there is no event we can hook without modifying T0). */
  setInterval(function () {
    if (__FIELD && __FIELD.launched && !_hpPollId) {
      _hpPollId = setInterval(_hpPollCheck, 250);
    }
    if (__FIELD && !__FIELD.launched && _hpPollId) {
      clearInterval(_hpPollId); _hpPollId = null;
      var ind3 = document.getElementById("hpPauseInd");
      if (ind3) ind3.style.display = "none";
    }
  }, 500);
})();
