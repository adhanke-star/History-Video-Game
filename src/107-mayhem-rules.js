/* ===========================================================================
   D418 / LANE-007 Slice A — Historical / Mayhem campaign ruleset kernel.

   One campaign owner: C.ruleset = { id:"historical"|"mayhem", version:1 }.
   This module adds no combat, score, casualty, reward, surrender, result, AAR,
   registry, scenario, or custom-content behavior. It is deliberately late and
   wraps the live campaign bindings by assignment; build/base.html stays frozen.

   Public readers are pure. mayhemInit is the only initializer/sanitizer. The
   bounded picker carry is private UI state, never authority, and every public
   path remains Historical while MAYHEM_PUBLIC_READY is false.
   =========================================================================== */

const MAYHEM_PUBLIC_READY = false;

function _mhHistorical() { return { id:"historical", version:1 }; }
function _mhValidId(id) { return id === "historical" || id === "mayhem"; }
function _mhExactRuleset(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  var keys;
  try { keys = Object.keys(raw).sort(); } catch (e) { return null; }
  if (keys.length !== 2 || keys[0] !== "id" || keys[1] !== "version") return null;
  if (!_mhValidId(raw.id) || raw.version !== 1) return null;
  return { id:raw.id, version:1 };
}
function _mhFallbackId() {
  // Fail closed. Runtime authority never reads G.settings or localStorage.
  return "historical";
}
function _mhLockedOwner(C) {
  try {
    var d = C && Object.getOwnPropertyDescriptor(C, "ruleset");
    var frozen = !d || typeof Object.isFrozen !== "function" || Object.isFrozen(d.value);
    return !!(d && d.writable === false && d.configurable === false && frozen && _mhExactRuleset(d.value));
  } catch (e) { return false; }
}
function _mhInstallOwner(C, id) {
  var owner = { id:_mhValidId(id) ? id : "historical", version:1 };
  try { if (Object.freeze) Object.freeze(owner); } catch (e) {}
  try {
    var prior = Object.getOwnPropertyDescriptor(C, "ruleset");
    Object.defineProperty(C, "ruleset", {
      value:owner,
      enumerable:prior && prior.configurable === false ? !!prior.enumerable : true,
      writable:false, configurable:false // MAYHEM_BIND_C:IMMUTABLE_OWNER
    });
  } catch (e2) { return _mhHistorical(); }
  return _mhLockedOwner(C) ? (_mhExactRuleset(C.ruleset) || _mhHistorical()) : _mhHistorical();
}

function mayhemRuleset(C) {
  var exact = _mhExactRuleset(C && C.ruleset);
  return exact || _mhHistorical();
}
function mayhemIsActive(C) { return mayhemRuleset(C).id === "mayhem"; }
function mayhemModeLabel(C) { return mayhemIsActive(C) ? "Mayhem Campaign" : "Historical Campaign"; }

function mayhemInit(C, requestedId, phase) {
  if (!C || typeof C !== "object" || Array.isArray(C)) return _mhHistorical();

  var current = _mhExactRuleset(C.ruleset);
  if (_mhLockedOwner(C)) return current || _mhHistorical();

  var id;
  if (current) {
    // A valid restored/new owner is preserved. No in-run call changes it.
    id = current.id;
  } else if (phase === "new" || phase === "fork") {
    id = _mhValidId(requestedId) ? requestedId : _mhFallbackId();
  } else {
    id = _mhFallbackId(); // MAYHEM_BIND_A:HISTORICAL_FALLBACK
  }
  return _mhInstallOwner(C, id);
}

/* A named fork creates a new object and uses the one initializer. It never
   converts the active object in place. Historical -> Mayhem is the only legal
   direction; Mayhem -> Historical and blank/unsafe names are rejected. */
function _mhNamedFork(C, name, requestedId) {
  name = String(name == null ? "" : name).replace(/\s+/g, " ").trim();
  if (!C || !name || name.length > 80 || requestedId !== "mayhem" || mayhemIsActive(C)) return null;
  var copy;
  try { copy = JSON.parse(JSON.stringify(C)); } catch (e) { return null; }
  if (!copy || typeof copy !== "object") return null;
  try { delete copy.ruleset; } catch (e2) { return null; }
  copy.timelineName = name;
  mayhemInit(copy, "mayhem", "fork");
  return mayhemIsActive(copy) ? copy : null;
}

var _MH_BASE_MUSTER = null;
var _MH_BASE_START = null;
var _MH_BASE_INIT = null;
var _mhPendingStart = null;
var _mhStartToken = null;
var _mhKeyHandler = null;
var _mhReturnFocusId = "";

function _mhSide(side) { return side === "CS" ? "CS" : "US"; }
function _mhEsc(v) {
  if (typeof htmlEsc === "function") return htmlEsc(v);
  return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function _mhClearKeyHandler() {
  try { if (_mhKeyHandler && typeof document !== "undefined") document.removeEventListener("keydown", _mhKeyHandler, true); } catch (e) {}
  _mhKeyHandler = null;
}
function _mhClearPending() {
  _mhPendingStart = null;
  _mhStartToken = null;
  _mhClearKeyHandler();
}
function _mhRememberFocus() {
  try {
    var el = document.activeElement;
    _mhReturnFocusId = el && el.id ? String(el.id) : "";
  } catch (e) { _mhReturnFocusId = ""; }
}
function _mhRestoreMenuFocus() {
  var id = _mhReturnFocusId;
  try { if (typeof openMainMenu === "function") openMainMenu(); } catch (e) {}
  if (!id || typeof setTimeout !== "function") return;
  setTimeout(function () {
    try { var el = document.getElementById(id); if (el) el.focus(); } catch (e2) {}
  }, 0);
}
function _mhBackToMenu() {
  _mhClearPending();
  _mhRestoreMenuFocus();
}
function _mhInstallEscape() {
  _mhClearKeyHandler();
  if (typeof document === "undefined") return;
  _mhKeyHandler = function (evt) {
    if (!evt || evt.key !== "Escape") return;
    evt.preventDefault();
    evt.stopPropagation();
    _mhBackToMenu();
  };
  document.addEventListener("keydown", _mhKeyHandler, true);
}

function _mhArmTerms(side, id) {
  side = _mhSide(side);
  id = _mhValidId(id) ? id : "historical";
  var arm = function (btn) {
    if (!btn) return;
    btn.addEventListener("click", function () {
      _mhStartToken = { side:side, id:id };
    }, true);
  };
  arm(document.getElementById("msMuster"));
  arm(document.getElementById("msIron"));
  var back = document.getElementById("msBack");
  if (back) back.addEventListener("click", function () {
    _mhClearPending();
    if (_mhReturnFocusId && typeof setTimeout === "function") setTimeout(function () {
      try { var el = document.getElementById(_mhReturnFocusId); if (el) el.focus(); } catch (e) {}
    }, 0);
  }, true);
}
function _mhOpenTerms(side, id) {
  if (typeof _MH_BASE_MUSTER !== "function") return;
  side = _mhSide(side);
  id = _mhValidId(id) ? id : "historical";
  _mhPendingStart = { side:side, id:id };
  _mhStartToken = null;
  _MH_BASE_MUSTER(side);
  _mhArmTerms(side, id);
  _mhInstallEscape();
  try { var first = document.getElementById("msMuster"); if (first) first.focus(); } catch (e) {}
}

function _mhPickerHTML(side) {
  var sideLabel = _mhSide(side) === "CS" ? "Confederate" : "Union";
  return ''
    + '<style id="mhPickerCss">'
    + '.mh-picker{max-width:760px;margin:0 auto;color:#f2e8d5}.mh-mode-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:12px;margin:14px 0}'
    + '.mh-mode{display:block;width:100%;min-height:176px;text-align:left;padding:16px;border:2px solid #8c724e;border-radius:8px;background:#17120c;color:#f2e8d5;cursor:pointer}'
    + '.mh-mode:hover{border-color:#d8b458;background:#21190f}.mh-mode:focus,.mh-mode:focus-visible,.mh-picker button:focus,.mh-picker button:focus-visible{outline:3px solid #ffe27a;outline-offset:3px}'
    + '.mh-mode[aria-checked="true"]{border-color:#ffe27a;box-shadow:0 0 0 2px #2d2517 inset}.mh-mode-name{display:block;font-size:20px;font-weight:900;color:#fff4d4}.mh-mode-deck{display:block;margin-top:8px;font-size:13px;line-height:1.55;color:#e9dcc0}'
    + '.mh-picker-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}.mh-picker-actions button{min-height:44px}'
    + '@media(max-width:420px){.mh-mode{min-height:0;padding:13px}.mh-mode-name{font-size:18px}}'
    + '@media(prefers-reduced-motion:reduce){.mh-picker *{transition:none!important;animation:none!important}}'
    + 'html[data-a11y-contrast="high"] .mh-mode{background:#000!important;color:#fff!important;border-color:#fff!important}html[data-a11y-contrast="high"] .mh-mode[aria-checked="true"]{border-color:#ffe27a!important}'
    + '</style>'
    + '<div class="mh-picker" id="mhRulesetPicker" data-side="' + side + '" role="region" aria-labelledby="mhPickerTitle">'
    + '<h1 class="title-xl" id="mhPickerTitle">' + _mhEsc(sideLabel) + ' Campaign</h1>'
    + '<p class="title-sub">Choose the rules for this new campaign</p><hr class="rule">'
    + '<p class="lede">Ruleset, difficulty, realism, and play style are separate choices. Choose one ruleset to continue.</p>'
    + '<div class="mh-mode-grid" role="radiogroup" aria-label="Campaign ruleset">'
    + '<button type="button" class="mh-mode" id="mhHistorical" role="radio" tabindex="0" aria-checked="false" aria-describedby="mhHistoricalDesc" data-mh-mode="historical">'
    + '<span class="mh-mode-name">Historical Campaign</span><span class="mh-mode-deck" id="mhHistoricalDesc">Fight the documented war. Historical forces, timing, choices, and teaching context remain in force, while your battlefield performance determines the result.</span></button>'
    + '<button type="button" class="mh-mode" id="mhMayhem" role="radio" tabindex="-1" aria-checked="false" aria-describedby="mhMayhemDesc" data-mh-mode="mayhem">'
    + '<span class="mh-mode-name">Mayhem Campaign — Break the Timeline</span><span class="mh-mode-deck" id="mhMayhemDesc">Mix eras, people, weapons, policies, rewards, and outcomes. The game tracks what happens; it does not grade your morality or historical plausibility.</span></button>'
    + '</div><div class="mh-picker-actions">'
    + '<button type="button" class="bigbtn" id="mhStart" disabled aria-disabled="true">Choose a ruleset</button>'
    + '<button type="button" class="ghostbtn" id="mhBack">Back</button>'
    + '</div></div>';
}
function _mhOpenRulesetPicker(side) {
  if (typeof openSheet !== "function") return;
  side = _mhSide(side);
  _mhPendingStart = null;
  _mhStartToken = null;
  openSheet(_mhPickerHTML(side));
  _mhInstallEscape();
  var selected = null;
  var radios = document.querySelectorAll('[data-mh-mode]');
  var start = document.getElementById("mhStart");
  function select(id, announce) {
    selected = _mhValidId(id) ? id : null;
    for (var i = 0; i < radios.length; i++) {
      var on = radios[i].getAttribute("data-mh-mode") === selected;
      radios[i].setAttribute("aria-checked", on ? "true" : "false");
      radios[i].setAttribute("tabindex", (!selected ? i === 0 : on) ? "0" : "-1");
    }
    if (start) {
      start.disabled = !selected;
      start.setAttribute("aria-disabled", selected ? "false" : "true");
      start.textContent = selected === "mayhem" ? "Start Mayhem Campaign" : selected === "historical" ? "Start Historical Campaign" : "Choose a ruleset";
    }
    if (announce && selected && typeof a11yAnnounce === "function") a11yAnnounce(mayhemModeLabel({ ruleset:{ id:selected, version:1 } }) + " selected");
  }
  for (var i = 0; i < radios.length; i++) {
    (function (idx) {
      radios[idx].addEventListener("click", function () { select(this.getAttribute("data-mh-mode"), true); });
      radios[idx].addEventListener("keydown", function (evt) {
        var key = evt && evt.key;
        var next = idx;
        if (key === "ArrowRight" || key === "ArrowDown") next = (idx + 1) % radios.length;
        else if (key === "ArrowLeft" || key === "ArrowUp") next = (idx + radios.length - 1) % radios.length;
        else if (key === "Home") next = 0;
        else if (key === "End") next = radios.length - 1;
        else return;
        evt.preventDefault();
        select(radios[next].getAttribute("data-mh-mode"), true);
        try { radios[next].focus(); } catch (e) {}
      });
    })(i);
  }
  if (start) start.addEventListener("click", function () {
    if (!selected) return;
    _mhClearKeyHandler();
    _mhOpenTerms(side, selected);
  });
  var back = document.getElementById("mhBack");
  if (back) back.addEventListener("click", _mhBackToMenu);
  try { if (radios[0]) radios[0].focus(); } catch (e) {}
}

(function _mhInstallCampaignWrappers() {
  _MH_BASE_MUSTER = typeof _openMusterChoice === "function" ? _openMusterChoice : null;
  _MH_BASE_START = typeof startCampaign === "function" ? startCampaign : null;
  _MH_BASE_INIT = typeof _t1InitAll === "function" ? _t1InitAll : null;
  if (!_MH_BASE_MUSTER || !_MH_BASE_START || !_MH_BASE_INIT) return;

  _openMusterChoice = function (side) {
    _mhRememberFocus();
    if (MAYHEM_PUBLIC_READY === true) return _mhOpenRulesetPicker(side);
    return _mhOpenTerms(side, "historical");
  };

  startCampaign = function (side, iron) {
    side = _mhSide(side);
    var token = _mhStartToken;
    var requested = token && token.side === side && _mhValidId(token.id) ? token.id : "historical";
    _mhPendingStart = { side:side, id:requested };
    try {
      return _MH_BASE_START.apply(this, arguments);
    } finally {
      _mhClearPending();
    }
  };

  _t1InitAll = function (C) {
    var pending = _mhPendingStart;
    var requested = pending && _mhValidId(pending.id) ? pending.id : "historical";
    mayhemInit(C, requested, "new"); // MAYHEM_BIND_B:ATTACH_BEFORE_INIT
    return _MH_BASE_INIT.apply(this, arguments);
  };
})();
