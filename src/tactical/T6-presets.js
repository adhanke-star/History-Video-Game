/* ============================================================================
   src/tactical/T6-presets.js  —  TACTICAL ENGINE · PHASE B-5 (DIFFICULTY / REALISM PRESETS)

   A player-facing difficulty + realism layer over the tactical engine. V1-CHECKLIST
   Phase B-5: "difficulty/realism presets for the AI + sim depth" with the granular
   sliders the later tactical Engineering Corps will key off (D69 split engineering to
   its own milestone — this ships the sliders + the hooks, not the corps).

   TWO AXES, a curated card up front + an Advanced expander:

     - AI TIER (Recruit / Regular / Veteran / Hardee). SMARTER-NOT-CHEATING (D68/D69):
       the AI never gets a vision cheat or a steadiness BONUS. Difficulty rises through
       sharper DECISIONS (aiSkill nudges the existing B-1 doctrine thresholds), never a
       thumb on the scale. The single easy-tier affordance (a player morale cushion + a
       brittler enemy) is RECRUIT-ONLY and stated plainly in the UI. VETERAN is the
       shipped opponent (aiSkill 1.0, no handicap) — the byte-identical neutral.

     - REALISM BUNDLE (Arcade / Balanced / Historian). Severity multipliers on the
       existing layer knobs: attrition (fire + melee casualties), canister lethality
       (B-4), supply generosity (B-3), command-shock magnitude (B-2), scouting/LOS range,
       and how much veteran experience matters. BALANCED = all neutral (1.0) = today's
       shipped, historically-tuned battle (incl. the D67 Bull-Run-fog-ON default).

   ARCHITECTURE: read ONCE at fldInitSim (fldPresetsApply, run BEFORE the fog/auto-pause
   precedence + the per-layer gate reads) -> it populates __FIELD.sev / aiSkill / aiResolve
   / aiCushion, and (only when a preset is configured) sets the global fog/auto-pause the
   precedence honours. With NO preset configured (the probes never set one) it writes the
   NEUTRAL config and touches nothing else -> every seam multiplies by 1.0 / adds 0 ->
   the 8 tactical baselines + bullrun stay BYTE-IDENTICAL. This is "mostly wiring + a UI,
   not new sim" (D69): the knobs already exist; presets choose their values. DETERMINISM:
   no RNG here; the seeded fldRng stream in T0 is untouched. Bare-name globals (G, __FIELD,
   FLD, openSheet, openMainMenu, toast, the fld* helpers). No literal comment-closer here.
   ============================================================================ */

var FLDP = {
  // --- AI tiers. resolve = AI-unit morale resilience multiplier (<= 1.0 ALWAYS — a handicap that makes the game
  //     EASIER, never a cheating buff). cushion = a PLAYER-side morale cushion (> 0 ONLY at the easiest tier, D69).
  //     skill = AI DOCTRINE sharpness (1.0 = the shipped B-1 thresholds; > 1 commits/counterattacks sharper). ---
  ai: {
    recruit: { resolve: 0.82, cushion: 0.6, skill: 0.9,  label: "Recruit",
      sub: "Green volunteers opposite you. The enemy is brittle and your own men hold steadier &mdash; the gentle on-ramp." },
    regular: { resolve: 1.0,  cushion: 0,   skill: 0.96, label: "Regular",
      sub: "A competent foe at full strength, fighting a touch cautiously. No handicaps either way." },
    veteran: { resolve: 1.0,  cushion: 0,   skill: 1.0,  label: "Veteran",
      sub: "The shipped opponent &mdash; the full, historically-tuned doctrine. The honest fight." },
    hardee:  { resolve: 1.0,  cushion: 0,   skill: 1.12, label: "Hardee",
      sub: "Named for the drillmaster. The enemy reads the field sharper and presses harder &mdash; smarter decisions, never a cheat." },
  },
  aiOrder: ["recruit", "regular", "veteran", "hardee"],
  // --- realism bundles. severity multipliers (1.0 = neutral = today). fog = the default fog lever for the bundle. ---
  realism: {
    arcade:   { attrition: 0.7, canister: 0.7, supply: 1.4,  cmdShock: 0.6, sight: 1.15, veteran: 0.85, fog: "off", label: "Arcade",
      sub: "Forgiving. Lighter casualties, generous supply, gentle command shock; fog off. Learn the maneuvers without the grind." },
    balanced: { attrition: 1.0, canister: 1.0, supply: 1.0,  cmdShock: 1.0, sight: 1.0,  veteran: 1.0,  fog: "scenario", label: "Balanced",
      sub: "The shipped battle &mdash; the historically-tuned numbers. First Bull Run opens under fog, where the defender holds the hill." },
    historian:{ attrition: 1.3, canister: 1.3, supply: 0.72, cmdShock: 1.4, sight: 0.88, veteran: 1.2,  fog: "on", label: "Historian",
      sub: "Unforgiving. Heavier attrition, strict supply, murderous canister, hard command shock; fog on. The real cost." },
  },
  realismOrder: ["arcade", "balanced", "historian"],
  // --- Advanced expander lever ladders (discrete chips, accessible + deterministic). Each maps a stored numeric
  //     value to a label. The realism cards set the sev levers; the AI cards set aiSkill/resolve/cushion. ---
  levers: {
    attrition: { label: "Casualty severity",      key: "attrition", opts: [{ v: 0.7, l: "Light" }, { v: 1.0, l: "Normal" }, { v: 1.3, l: "Heavy" }] },
    canister:  { label: "Canister lethality (B-4)", key: "canister", opts: [{ v: 0.7, l: "Light" }, { v: 1.0, l: "Normal" }, { v: 1.3, l: "Murderous" }] },
    supply:    { label: "Supply (B-3)",            key: "supply",   opts: [{ v: 1.4, l: "Generous" }, { v: 1.0, l: "Normal" }, { v: 0.72, l: "Strict" }] },
    cmdShock:  { label: "Command shock (B-2)",     key: "cmdShock", opts: [{ v: 0.6, l: "Muted" }, { v: 1.0, l: "Normal" }, { v: 1.4, l: "Severe" }] },
    sight:     { label: "Scouting range (LOS)",    key: "sight",    opts: [{ v: 1.15, l: "Long" }, { v: 1.0, l: "Normal" }, { v: 0.88, l: "Short" }] },
    veteran:   { label: "Experience weight",       key: "veteran",  opts: [{ v: 0.85, l: "Flat" }, { v: 1.0, l: "Normal" }, { v: 1.2, l: "Steep" }] },
    aiSkill:   { label: "AI sharpness (B-1)",      key: "aiSkill",  opts: [{ v: 0.9, l: "Cautious" }, { v: 0.96, l: "Measured" }, { v: 1.0, l: "Standard" }, { v: 1.12, l: "Sharp" }] },
    fog:       { label: "Fog of war",              key: "fog",      opts: [{ v: "off", l: "Off" }, { v: "scenario", l: "By battle" }, { v: "on", l: "On" }] },
    autoPause: { label: "Active auto-pause",       key: "autoPause", opts: [{ v: "on", l: "On" }, { v: "off", l: "Off" }] },
  },
  leverOrder: ["aiSkill", "attrition", "canister", "supply", "cmdShock", "sight", "veteran", "fog", "autoPause"],
  STORE_KEY: "cw_tactical_preset",
};

/* ===========================================================================
   RESOLVE / COMPUTE / APPLY — the engine seam (fldInitSim reads this).
   =========================================================================== */
/* the NEUTRAL config (== today's shipped balance). fldPresetsApply falls back to this when
   nothing is configured, so a no-preset launch is byte-identical to the pre-B5 engine. */
function fldPresetNeutral() {
  return { ai: "veteran", realism: "balanced",
    attrition: 1, canister: 1, supply: 1, cmdShock: 1, sight: 1, veteran: 1,
    aiSkill: 1, aiResolve: 1, aiCushion: 0, fog: "scenario", autoPause: null };
}
/* build a full effective config from an AI tier + realism bundle + optional lever overrides.
   The UI writes the result of this to G.settings.tacticalPreset (and localStorage). */
function fldPresetCompute(aiKey, rmKey, lv) {
  var ai = FLDP.ai[aiKey] || FLDP.ai.veteran, rm = FLDP.realism[rmKey] || FLDP.realism.balanced;
  var c = { ai: (FLDP.ai[aiKey] ? aiKey : "veteran"), realism: (FLDP.realism[rmKey] ? rmKey : "balanced"),
    attrition: rm.attrition, canister: rm.canister, supply: rm.supply, cmdShock: rm.cmdShock, sight: rm.sight, veteran: rm.veteran,
    aiSkill: ai.skill, aiResolve: ai.resolve, aiCushion: ai.cushion, fog: rm.fog, autoPause: null };
  if (lv) {
    var num = ["attrition", "canister", "supply", "cmdShock", "sight", "veteran", "aiSkill"];
    for (var i = 0; i < num.length; i++) if (lv[num[i]] != null) c[num[i]] = lv[num[i]];
    if (lv.fog != null) c.fog = lv.fog;
    if (lv.autoPause != null) c.autoPause = lv.autoPause;
    // an explicit AI-tier override re-derives the resolve/cushion bound to that tier (so e.g. choosing the
    // Recruit tier in advanced still carries its cushion); aiSkill stays whatever the sharpness chip set.
    if (lv.aiResolve != null) c.aiResolve = lv.aiResolve;
    if (lv.aiCushion != null) c.aiCushion = lv.aiCushion;
  }
  // bug-hunt: the easy-tier affordance (the player cushion + a brittler enemy) is bound to a GENUINE Recruit. If the
  // AI sharpness was tuned off the Recruit value (a "Custom" AI) or the tier isn't Recruit, drop it so the cushion
  // can NEVER ride a sharper AI — honouring "the cushion exists ONLY at the easiest tier" (D69).
  if (!(c.ai === "recruit" && c.aiSkill === FLDP.ai.recruit.skill)) { c.aiCushion = 0; c.aiResolve = 1; }
  return _fldClampCfg(c);
}
/* clamp a resolved config's numeric knobs to sane positive bounds. The UI only ever emits the curated values, but a
   hand-edited / older-shape persisted preset must never invert a lever, zero out casualties (a no-winner battle), or
   BUFF the AI. aiResolve is HARD-capped at 1.0 so "smarter-not-cheating" is enforced by CODE, not the data table.
   Neutral (all 1 / 0) passes through unchanged -> byte-identity preserved (clamp(1,..)===1, min(1,1)===1, max(0,0)===0). */
function _fldClampNum(v, lo, hi) { var n = _fldNum(v, 1); return (typeof fldClamp === "function") ? fldClamp(n, lo, hi) : Math.max(lo, Math.min(hi, n)); }
function _fldClampCfg(c) {
  c.attrition = _fldClampNum(c.attrition, 0.1, 3); c.canister = _fldClampNum(c.canister, 0.1, 3); c.supply = _fldClampNum(c.supply, 0.1, 3);
  c.cmdShock = _fldClampNum(c.cmdShock, 0.1, 3); c.sight = _fldClampNum(c.sight, 0.2, 3); c.veteran = _fldClampNum(c.veteran, 0.1, 3);
  c.aiSkill = _fldClampNum(c.aiSkill, 0.5, 1.5); c.aiResolve = Math.min(1, _fldClampNum(c.aiResolve, 0.1, 1)); c.aiCushion = Math.max(0, _fldNum(c.aiCushion, 0));
  return c;
}
/* the configured preset, or null when nothing is set (-> neutral / byte-identical). */
function fldPresetResolve() {
  try { if (typeof G !== "undefined" && G.settings && G.settings.tacticalPreset) return G.settings.tacticalPreset; } catch (e) {}
  return null;
}
/* APPLY (fldInitSim seam). Populate __FIELD.sev / aiSkill / aiResolve / aiCushion every launch; when a preset is
   configured, also set the global fog / auto-pause the precedence below honours. NO preset -> neutral, touch nothing. */
function fldPresetsApply(opts) {
  __FIELD.sev = { attrition: 1, canister: 1, supply: 1, cmdShock: 1, sight: 1, veteran: 1 };
  __FIELD.aiSkill = 1; __FIELD.aiResolve = 1; __FIELD.aiCushion = 0;
  var c = fldPresetResolve();
  if (!c) return;   // nothing configured -> NEUTRAL (byte-identical to the pre-B5 engine); do not touch G.settings
  c = _fldClampCfg(Object.assign({}, c));   // clamp a CLONE (don't mutate the stored preset): a hand-edited / older-shape persisted preset is bounded here -> no inverted lever, no zeroed casualties, no AI buff
  __FIELD.sev = { attrition: c.attrition, canister: c.canister, supply: c.supply, cmdShock: c.cmdShock, sight: c.sight, veteran: c.veteran };
  __FIELD.aiSkill = c.aiSkill; __FIELD.aiResolve = c.aiResolve; __FIELD.aiCushion = c.aiCushion;
  // the fog lever -> the global setting the T0/T1 precedence reads (an explicit opts.fog STILL wins). "scenario" is a
  // NO-OP on the global (so a live V-toggle survives, and the T0 precedence falls through to the battle default) —
  // a stale on/off pin is cleared at SAVE time (the picker), distinct from honouring a live toggle. Done BEFORE the
  // precedence read.
  try {
    if (typeof G !== "undefined") {
      G.settings = G.settings || {};
      if (c.fog === "off") G.settings.tacticalFog = false;
      else if (c.fog === "on") G.settings.tacticalFog = true;
      if (c.autoPause === "on" || c.autoPause === true) G.settings.tacticalAutoPause = true;
      else if (c.autoPause === "off" || c.autoPause === false) G.settings.tacticalAutoPause = false;
    }
  } catch (e) {}
}
function _fldNum(v, d) { var n = (typeof v === "number") ? v : parseFloat(v); return (isFinite(n)) ? n : d; }

/* persistence: a dedicated localStorage key (no campaign save / no toast) + G.settings (rides the campaign save). */
function fldPresetPersist(c) {
  try { if (typeof G !== "undefined") { G.settings = G.settings || {}; G.settings.tacticalPreset = c; } } catch (e) {}
  try { if (typeof localStorage !== "undefined") localStorage.setItem(FLDP.STORE_KEY, JSON.stringify(c)); } catch (e2) {}
}
function fldPresetBootLoad() {
  try {
    if (typeof G === "undefined") return;
    G.settings = G.settings || {};
    if (G.settings.tacticalPreset) return;                 // a loaded campaign save already carries one
    if (typeof localStorage === "undefined") return;
    var raw = localStorage.getItem(FLDP.STORE_KEY); if (!raw) return;
    var c = JSON.parse(raw); if (c && typeof c === "object") { delete c.__proto__; delete c.constructor; delete c.prototype; G.settings.tacticalPreset = c; }
  } catch (e) {}
}

/* ===========================================================================
   THE PRESET PICKER — a period broadsheet sheet (openSheet). Two card columns
   (AI tier · Realism) + an Advanced expander of per-lever chips. Full keyboard +
   ARIA; CVD-safe (shape + label, never colour alone); honours reduceMotion.
   =========================================================================== */
var _fldPresetState = null;   // { ai, realism, lv:{...}, advanced, returnTo }
function _fldPresetInitState(returnTo) {
  var c = fldPresetResolve() || fldPresetNeutral();
  _fldPresetState = {
    ai: c.ai || "veteran", realism: c.realism || "balanced", advanced: false, returnTo: returnTo || "menu",
    lv: { attrition: c.attrition, canister: c.canister, supply: c.supply, cmdShock: c.cmdShock, sight: c.sight,
      veteran: c.veteran, aiSkill: c.aiSkill, aiResolve: c.aiResolve, aiCushion: c.aiCushion,
      fog: c.fog || "scenario", autoPause: c.autoPause },
  };
}
function fldPresetMenu(returnTo) {
  _fldPresetInitState(returnTo);
  if (typeof openSheet !== "function") return;
  openSheet(_fldPresetHTML());
  _fldPresetWire();
  // initial focus -> the selected AI card (else the first), so the keyboard lands inside the picker, not on <body>
  try { var f = document.querySelector('[data-pcg="ai"][aria-pressed="true"]') || document.querySelector('[data-pcg]'); if (f) f.focus(); } catch (e) {}
}
/* a selectable "commission card" for an axis option (AI tier / realism bundle). bug-hunt F4: a toggle-BUTTON group
   with aria-pressed (NOT role=radio) — a radiogroup would promise arrow-key roving navigation this UI does not
   implement; plain click/Enter/Space buttons in a labelled group are correct + match _fldSkOptRow. */
function _fldPresetCard(group, key, def, on) {
  return '<button type="button" class="upg" aria-pressed="' + (on ? "true" : "false") + '"'
    + ' data-pcg="' + group + '" data-pcv="' + key + '"'
    + ' style="display:block;width:100%;text-align:left;margin:0 0 8px 0;padding:9px 11px;border-radius:6px;'
    + (on ? "outline:2px solid #e8c84a;outline-offset:1px;background:#241c10;" : "background:#1a150d;") + '">'
    + '<div style="font-weight:bold;letter-spacing:.04em;color:' + (on ? "#f0d98a" : "#e9dcc0") + ';">' + (on ? "&#9656; " : "") + def.label + '</div>'
    + '<div style="font-size:11.5px;opacity:.82;line-height:1.45;margin-top:2px;color:#e9dcc0;">' + def.sub + '</div></button>';
}
function _fldLeverRow(lk, cur) {
  var L = FLDP.levers[lk]; if (!L) return "";
  /* wcag-auditor: contrast fix — label color was var(--rule,#b9a06a) which renders as #8a7350 (3.59:1 on sheet bg #26200f, fails 1.4.3 4.5:1 for 11px text); fixed to #9f845c (4.58:1) */
  var h = '<div style="margin:8px 0"><div id="pvlbl_' + lk + '" style="font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:#9f845c;margin-bottom:3px">' + L.label + '</div>'
    + '<div role="group" aria-labelledby="pvlbl_' + lk + '" style="display:flex;gap:6px;flex-wrap:wrap">';
  for (var i = 0; i < L.opts.length; i++) {
    var o = L.opts[i], on = String(o.v) === String(cur);
    h += '<button type="button" class="upg" aria-pressed="' + (on ? "true" : "false") + '" data-plg="' + lk + '" data-plv="' + o.v + '"'
      + ' style="padding:5px 9px;font-size:12px;' + (on ? "outline:2px solid #e8c84a;outline-offset:1px;font-weight:bold;" : "") + '">' + o.l + '</button>';
  }
  return h + '</div></div>';
}
function _fldPresetSummaryLine() {
  var s = _fldPresetState, ai = FLDP.ai[s.ai], rm = FLDP.realism[s.realism];
  var aiLbl = ai ? ai.label : "Custom", rmLbl = rm ? rm.label : "Custom";
  // mark "Custom" when an advanced chip has been pulled off the named bundle/tier value
  if (rm && (s.lv.attrition !== rm.attrition || s.lv.canister !== rm.canister || s.lv.supply !== rm.supply
    || s.lv.cmdShock !== rm.cmdShock || s.lv.sight !== rm.sight || s.lv.veteran !== rm.veteran || s.lv.fog !== rm.fog)) rmLbl = "Custom";
  if (ai && (s.lv.aiSkill !== ai.skill)) aiLbl = "Custom";
  return aiLbl + " &times; " + rmLbl;
}
function _fldPresetHTML() {
  var s = _fldPresetState, i;
  /* wcag-auditor: contrast fix — column header colors were var(--rule,#b9a06a) which renders as #8a7350 (3.59:1 on sheet bg #26200f, fails 1.4.3 4.5:1 for 12px text); fixed to #9f845c (4.58:1) */
  var aiCol = '<div style="flex:1;min-width:240px"><div id="pvgrp_ai" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#9f845c;margin-bottom:6px">Opponent &mdash; AI level</div>'
    + '<div role="group" aria-labelledby="pvgrp_ai">';
  for (i = 0; i < FLDP.aiOrder.length; i++) { var ak = FLDP.aiOrder[i]; aiCol += _fldPresetCard("ai", ak, FLDP.ai[ak], s.ai === ak); }
  aiCol += '</div></div>';
  var rmCol = '<div style="flex:1;min-width:240px"><div id="pvgrp_rm" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#9f845c;margin-bottom:6px">Realism</div>'
    + '<div role="group" aria-labelledby="pvgrp_rm">';
  for (i = 0; i < FLDP.realismOrder.length; i++) { var rk = FLDP.realismOrder[i]; rmCol += _fldPresetCard("realism", rk, FLDP.realism[rk], s.realism === rk); }
  rmCol += '</div></div>';
  var adv = "";
  if (s.advanced) {
    adv = '<div style="margin-top:8px;border-top:1px solid #5a4a2e;padding-top:8px"><div style="font-size:11px;opacity:.7;margin-bottom:4px">Tune any single lever &mdash; the cards above jump to <b>Custom</b> when you do. The Engineering Corps (a later milestone) will read these same levers.</div>'
      + '<div style="display:flex;gap:18px;flex-wrap:wrap"><div style="flex:1;min-width:240px">';
    for (i = 0; i < FLDP.leverOrder.length; i++) {
      var lk = FLDP.leverOrder[i];
      if (i === Math.ceil(FLDP.leverOrder.length / 2)) adv += '</div><div style="flex:1;min-width:240px">';
      adv += _fldLeverRow(lk, s.lv[lk]);
    }
    adv += '</div></div></div>';
  }
  return ''
    + '<h1 class="title-xl" style="text-align:center">Command &amp; Realism</h1>'
    + '<p class="title-sub" style="text-align:center">Set the opponent’s skill and how unforgiving the field is. The AI never cheats &mdash; harder means it decides sharper, not that it is handed an advantage. New to the field? <b>Recruit &times; Arcade</b>.</p>'
    + '<hr class="rule">'
    + '<div style="max-width:680px;margin:0 auto">'
    + '<div style="display:flex;gap:18px;flex-wrap:wrap">' + aiCol + rmCol + '</div>'
    + '<div style="margin-top:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">'
    +   '<button id="pvAdv" type="button" class="upg" aria-expanded="' + (s.advanced ? "true" : "false") + '">' + (s.advanced ? "&#9662; Hide advanced levers" : "&#9656; Advanced levers") + '</button>'
    +   '<span style="font-size:12px;opacity:.85">Selected: <b id="pvSummary">' + _fldPresetSummaryLine() + '</b></span>'
    + '</div>'
    + adv
    + '<div class="btn-row" style="margin-top:14px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'
    +   '<button id="pvBack" type="button" class="upg">Back</button>'
    +   '<button id="pvReset" type="button" class="upg">Reset to shipped (Veteran &times; Balanced)</button>'
    +   '<button id="pvApply" type="button" class="bigbtn">Save &amp; Continue</button>'
    + '</div></div>';
}
function _fldPresetWire() {
  // the AI / realism cards
  var cards = document.querySelectorAll('[data-pcg]');
  for (var i = 0; i < cards.length; i++) {
    (function (b) {
      b.addEventListener("click", function () {
        var g = b.getAttribute("data-pcg"), v = b.getAttribute("data-pcv");
        if (g === "ai") { _fldPresetState.ai = v; var a = FLDP.ai[v]; if (a) { _fldPresetState.lv.aiSkill = a.skill; _fldPresetState.lv.aiResolve = a.resolve; _fldPresetState.lv.aiCushion = a.cushion; } }
        else if (g === "realism") { _fldPresetState.realism = v; var r = FLDP.realism[v]; if (r) { _fldPresetState.lv.attrition = r.attrition; _fldPresetState.lv.canister = r.canister; _fldPresetState.lv.supply = r.supply; _fldPresetState.lv.cmdShock = r.cmdShock; _fldPresetState.lv.sight = r.sight; _fldPresetState.lv.veteran = r.veteran; _fldPresetState.lv.fog = r.fog; } }
        _fldPresetRerender("[data-pcg=\"" + g + "\"][data-pcv=\"" + v + "\"]");
      });
    })(cards[i]);
  }
  // the advanced lever chips
  var chips = document.querySelectorAll('[data-plg]');
  for (var j = 0; j < chips.length; j++) {
    (function (b) {
      b.addEventListener("click", function () {
        var lk = b.getAttribute("data-plg"), raw = b.getAttribute("data-plv");
        var val = (lk === "fog" || lk === "autoPause") ? raw : parseFloat(raw);
        _fldPresetState.lv[lk] = val;
        // the card highlight stays on the last-picked tier/bundle; the summary line flips to "Custom" (see
        // _fldPresetSummaryLine) once a chip diverges from it, so the displayed label stays honest.
        _fldPresetRerender("[data-plg=\"" + lk + "\"][data-plv=\"" + raw + "\"]");
      });
    })(chips[j]);
  }
  var adv = document.getElementById("pvAdv");
  if (adv) adv.addEventListener("click", function () { _fldPresetState.advanced = !_fldPresetState.advanced; _fldPresetRerender("#pvAdv"); });
  var back = document.getElementById("pvBack");
  if (back) back.addEventListener("click", function () { _fldPresetReturn(); });
  var reset = document.getElementById("pvReset");
  if (reset) reset.addEventListener("click", function () { _fldPresetInitState(_fldPresetState.returnTo); _fldPresetState.ai = "veteran"; _fldPresetState.realism = "balanced"; var n = fldPresetNeutral(); _fldPresetState.lv = { attrition: n.attrition, canister: n.canister, supply: n.supply, cmdShock: n.cmdShock, sight: n.sight, veteran: n.veteran, aiSkill: n.aiSkill, aiResolve: n.aiResolve, aiCushion: n.aiCushion, fog: n.fog, autoPause: n.autoPause }; _fldPresetRerender("#pvReset"); });
  var apply = document.getElementById("pvApply");
  if (apply) apply.addEventListener("click", function () {
    var s = _fldPresetState, computed = fldPresetCompute(s.ai, s.realism, s.lv);
    fldPresetPersist(computed);
    // clear a stale on/off fog pin at the DECISION point when the new lever is "by battle" (scenario), so the saved
    // preset's intent (let the battle decide) takes effect; apply-time leaves a live V-toggle alone (see fldPresetsApply).
    try { if (computed.fog === "scenario" && typeof G !== "undefined" && G.settings) delete G.settings.tacticalFog; } catch (e) {}
    if (typeof toast === "function") { try { toast("Difficulty saved: " + _fldPresetSummaryLine().replace(/&times;/g, "x").replace(/<[^>]+>/g, ""), 1500); } catch (e2) {} }
    _fldPresetReturn();
  });
}
function _fldPresetRerender(focusSel) {
  if (typeof openSheet !== "function") return;
  openSheet(_fldPresetHTML()); _fldPresetWire();
  try { var nb = focusSel && document.querySelector(focusSel); if (nb) nb.focus(); } catch (e) {}
}
function _fldPresetReturn() {
  var to = _fldPresetState ? _fldPresetState.returnTo : "menu";
  if (to === "skirmish" && typeof fldSkirmishMenu === "function") { fldSkirmishMenu(); return; }
  if (typeof openMainMenu === "function") { openMainMenu(); return; }
}
/* main-menu injection — a button beside the Skirmish / Bull Run buttons (the same .gn-btn idiom). */
function fldInjectPresetButton(afterBtn) {
  try {
    if (document.getElementById("fldPresetBtn")) return;
    if (!afterBtn || !afterBtn.parentNode) return;
    var b = document.createElement("button");
    b.className = "gn-btn"; b.id = "fldPresetBtn";
    b.setAttribute("aria-label", "Command and Realism — set the AI difficulty and the realism of every real-time battle: four AI levels, three realism bundles, and per-lever advanced controls.");
    b.innerHTML = '<span class="gn-hl">&#9881; COMMAND &amp; REALISM</span>'
      + '<span class="gn-deck">Difficulty &amp; realism for every real-time battle &mdash; Recruit&hellip;Hardee &times; Arcade&hellip;Historian, plus advanced per-lever sliders. The AI never cheats.</span>';
    b.addEventListener("click", function () { fldPresetMenu("menu"); });
    if (afterBtn.nextSibling) afterBtn.parentNode.insertBefore(b, afterBtn.nextSibling); else afterBtn.parentNode.appendChild(b);
  } catch (e) {}
}

/* ===========================================================================
   IN-BATTLE SETTINGS DRAWER — a focus-trapped aria-modal dialog inside #fldRoot.
   Live toggles (fog · auto-pause · speed) apply immediately; the current difficulty
   preset is shown READ-ONLY (changed from the main menu's Command & Realism picker,
   which renders correctly on the broadsheet sheet — the field overlay sits above that
   sheet, so the picker is a main-menu surface, not a mid-battle one). The drawer pauses
   the battle while open and re-asserts the pause across live toggles.
   =========================================================================== */
function fldOpenSettingsDrawer() {
  if (typeof document === "undefined" || !__FIELD || !__FIELD.root) return;
  if (document.getElementById("fldDrawer")) return;
  if (__FIELD.phase === "over" || __FIELD.phase === "deploy") { if (__FIELD.phase === "over") return; }   // no settings drawer on the end screen
  __FIELD._drawerWasPaused = __FIELD.paused; __FIELD.paused = true;   // pause while the drawer is open
  var d = document.createElement("div");
  d.id = "fldDrawer"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true"); d.setAttribute("aria-label", "Battle settings");
  d.style.cssText = "position:absolute;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:#000a;";
  d.innerHTML = _fldDrawerHTML();
  __FIELD.root.appendChild(d);
  // the keydown TRAP is attached ONCE here (NOT in _fldDrawerWire, which re-runs on every refresh -> would stack
  // duplicate listeners). stopPropagation keeps EVERY key off fldKey (#fldRoot): no battlefield hotkey (incl.
  // Escape->fldExit, which would TEAR DOWN the battle) fires while the modal is open, wherever focus sits.
  d.addEventListener("keydown", function (ev) {
    ev.stopPropagation();
    if (ev.key === "Escape") { ev.preventDefault(); _fldCloseDrawer(false); return; }
    if (ev.key !== "Tab") return;
    var btns = d.querySelectorAll("button"); if (!btns.length) return;
    var first = btns[0], last = btns[btns.length - 1];
    if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
    else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
  });
  // a click on the backdrop (the dialog chrome itself) must not drop focus to <body> and re-expose battlefield
  // hotkeys behind the modal — pull focus back into the dialog.
  d.addEventListener("mousedown", function (ev) { if (ev.target === d) { ev.preventDefault(); var c = document.getElementById("fldDrawerClose"); if (c) c.focus(); } });
  _fldDrawerWire();
  var close = document.getElementById("fldDrawerClose"); if (close) try { close.focus(); } catch (e) {}
}
function _fldDrawerHTML() {
  var c = fldPresetResolve() || fldPresetNeutral();
  var ai = FLDP.ai[c.ai], rm = FLDP.realism[c.realism];
  var presetLine = (ai ? ai.label : "Custom") + " &times; " + (rm ? rm.label : "Custom");
  function tog(id, label, on, hint) {
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin:7px 0">'
      + '<span style="font-size:13px">' + label + '<span style="opacity:.6;font-size:11px"> &mdash; ' + hint + '</span></span>'
      + '<button id="' + id + '" type="button" class="upg" aria-pressed="' + (on ? "true" : "false") + '" style="min-width:64px;' + (on ? "outline:2px solid #e8c84a;outline-offset:1px;font-weight:bold;" : "") + '">' + (on ? "On" : "Off") + '</button></div>';
  }
  return '<div style="background:#15110b;border:1px solid #7a6440;border-radius:8px;padding:16px 18px;max-width:380px;width:90%;color:#f2e8d5;box-shadow:0 8px 40px #000b;">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px"><b style="font-size:16px;letter-spacing:.04em;">&#9881; Battle Settings</b>'
    +   '<button id="fldDrawerClose" type="button" class="upg" aria-label="Close settings" style="padding:4px 9px">&times;</button></div>'
    + '<div style="font-size:12px;opacity:.85;margin-bottom:8px;border-bottom:1px solid #5a4a2e;padding-bottom:8px">Difficulty: <b>' + presetLine + '</b><br><span style="opacity:.65;font-size:11px">Set from the main menu (&#9881; Command &amp; Realism); the toggles below change live.</span></div>'
    + tog("fldDrawerFog", "Fog of war", !!__FIELD.fog, "line-of-sight scouting (V)")
    + tog("fldDrawerAuto", "Active auto-pause", !!__FIELD.autoPause, "pause at key moments (P)")
    + '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin:7px 0"><span style="font-size:13px">Speed</span>'
    +   '<button id="fldDrawerSpd" type="button" class="upg" aria-label="Cycle battle speed" style="min-width:64px">' + (__FIELD.speed || 1) + '&times;</button></div>'
    + '<div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end"><button id="fldDrawerDone" type="button" class="bigbtn" style="padding:7px 16px">Resume</button></div>'
    + '</div>';
}
function _fldDrawerWire() {
  var w = function (id, fn) { var el = document.getElementById(id); if (el) el.addEventListener("click", fn); };
  // re-render the drawer body + re-bind the button clicks (the keydown trap lives on #fldDrawer and survives this);
  // RE-ASSERT the pause so a live toggle (e.g. auto-pause OFF, which would otherwise resume) never runs the battle
  // behind the open modal; restore focus to the control the player just used (no focus jump).
  var refresh = function (focusId) { var d = document.getElementById("fldDrawer"); if (!d) return; if (__FIELD) __FIELD.paused = true; d.innerHTML = _fldDrawerHTML(); _fldDrawerWire(); var f = document.getElementById(focusId || "fldDrawerFog"); if (f) try { f.focus(); } catch (e) {} };
  w("fldDrawerFog", function () { if (typeof fldToggleFog === "function") fldToggleFog(); refresh("fldDrawerFog"); });
  w("fldDrawerAuto", function () { if (typeof fldToggleAutoPause === "function") fldToggleAutoPause(); refresh("fldDrawerAuto"); });
  w("fldDrawerSpd", function () { if (typeof fldCycleSpeed === "function") fldCycleSpeed(); refresh("fldDrawerSpd"); });
  w("fldDrawerClose", function () { _fldCloseDrawer(false); });
  w("fldDrawerDone", function () { _fldCloseDrawer(false); });
}
function _fldCloseDrawer(keepPaused) {
  var d = document.getElementById("fldDrawer"); if (d && d.parentNode) d.parentNode.removeChild(d);
  if (!keepPaused && __FIELD && !__FIELD._drawerWasPaused && __FIELD.phase === "battle") {
    __FIELD.paused = false; __FIELD._apReason = null;
    var pb = (typeof document !== "undefined") ? document.getElementById("fldBtnPlay") : null;   // mirror fldTogglePlay's button state
    if (pb) { pb.innerHTML = "&#10074;&#10074; Pause"; pb.setAttribute("aria-label", "Begin / pause the battle (Space)"); }
  }
  if (__FIELD) __FIELD._drawerWasPaused = undefined;
  try { var root = __FIELD && __FIELD.root; if (root) root.focus(); } catch (e) {}   // restore field focus for keyboard control
}

/* boot: load any persisted preset into G.settings so every launch (incl. the campaign bridge) honours it. */
(function fldPresetBoot() {
  try {
    if (typeof document === "undefined") { fldPresetBootLoad(); return; }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fldPresetBootLoad);
    else fldPresetBootLoad();
  } catch (e) {}
})();
