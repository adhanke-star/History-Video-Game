/* ===========================================================================
   A2 · 57-engineering.js — The Engineering Works Corps: build the army's
   engineer arm with money. The third buildable in The Armory (after small arms
   55-weapons.js and the Cannon Corps 56-artillery.js), but engineering is
   bought as CAPABILITY LEVELS, not units: you raise four branches —
   Construction Corps (Haupt's USMRR rail/bridge repair), Field Fortifications
   (the spade), Pontoon Train (river crossings), Siege Works (saps/parallels) —
   each from level 0 to 3.

   Aaron's directive (backlog A2): "Engineering Works Corps — Haupt's USMRR
   Construction Corps: rail/bridge repair, fieldworks/entrenchment, pontoons,
   siege. A buildable branch that raises the bridge's entrench/supply/fatigue
   facets + slows CS rail decay (ties production rail). Additive."

   Wiring:
     · engScore(C) (0-100) feeds the battle bridge (85-…) as an additive
       `engineering` facet (like the Cannon Corps' artillery facet).
     · engBranchBoost(C,"construction") raises the bridge SUPPLY facet;
       engBranchBoost(C,"pontoons") lowers the bridge FATIGUE facet.
     · engOnResolve repairs C.production.railIntegrity each turn by the
       Construction Corps level — the headline CONFEDERATE benefit: it SLOWS
       (cannot stop) the South's irreversible rail decay (50-production.js).
   Asymmetry: the CS pays a materials/skilled-labor premium (costPremiumCS).

   Adds C.engineering { levels:{branchId->level} }. engInit / engScore /
   engBranchLevel / engBranchBoost / engBuy / engOnResolve / engRenderSection /
   engWireSection. Bare-name globals; _eng* helpers; render never mutates/saves
   (init is idempotent + shape-defensive). Hardened up front per A1/D42:
   Array.isArray guards, value coercion, data escaped before innerHTML.
   =========================================================================== */

function _engData() { return gameData("engineering"); }
function _engBranches() { var D = _engData(); return (D && D.branches && D.branches.length) ? D.branches : []; }
function _engBaseline() { var D = _engData(); return (D && typeof D.baselineEngineeringScore === "number") ? D.baselineEngineeringScore : 12; }
function _engMax(b) {
  if (b && typeof b.maxLevel === "number" && b.maxLevel > 0) return Math.floor(b.maxLevel);
  if (b && b.costPerLevel && b.costPerLevel.length) return b.costPerLevel.length - 1;
  return 3;
}
function _engCostPremium(C) {
  var D = _engData(), p = (D && typeof D.costPremiumCS === "number") ? D.costPremiumCS : 1.25;
  return (C && C.side === "CS") ? p : 1.0;
}
function _engLevelCost(b, lvl) {
  var arr = b && b.costPerLevel;
  if (!arr || lvl < 0 || lvl >= arr.length) return null;
  var c = arr[lvl];
  return (typeof c === "number" && isFinite(c) && c >= 0) ? c : null;
}

var _engEsc = htmlEsc;

function _engYear(C) { return campaignYear(C); }

function engInit(C) {
  if (!C) return;
  // typeof [] === "object" — guard arrays explicitly so a corrupt/imported save can't survive
  // and get silently wiped on the next JSON round-trip (the A1/D42 lesson).
  if (Array.isArray(C.engineering) || !C.engineering || typeof C.engineering !== "object") C.engineering = { levels: {} };
  if (Array.isArray(C.engineering.levels) || !C.engineering.levels || typeof C.engineering.levels !== "object") C.engineering.levels = {};
  // Coerce/clamp every known branch's level once at the chokepoint (drop garbage to 0, cap at max).
  var br = _engBranches(), lv = C.engineering.levels;
  for (var i = 0; i < br.length; i++) {
    var id = br[i].id, max = _engMax(br[i]);
    // Only coerce numbers/numeric-strings; reject booleans/objects/null (Number(true)===1 would
    // otherwise grant a free level-1 from a corrupt save) — they fall through to the 0-clamp.
    var raw = lv[id];
    var n = (typeof raw === "number" || typeof raw === "string") ? Math.floor(Number(raw)) : NaN;
    if (!isFinite(n) || n < 0) n = 0;
    if (n > max) n = max;
    lv[id] = n;
  }
}

/* Current level (0..max) of a branch, defensively read. */
function engBranchLevel(C, id) {
  if (!C || id == null) return 0;
  engInit(C);
  var n = C.engineering.levels[id];
  return (typeof n === "number" && isFinite(n) && n > 0) ? n : 0;
}

/* The corps' engineering-score (0-100): baseline + the levels you have raised. */
function engScore(C) {
  if (!C) return _engBaseline();
  engInit(C);
  var br = _engBranches(), base = Math.max(0, Math.min(100, _engBaseline()));
  if (!br.length) return base;
  var s = base;
  for (var i = 0; i < br.length; i++) {
    var sp = (typeof br[i].scorePerLevel === "number" && isFinite(br[i].scorePerLevel) && br[i].scorePerLevel >= 0) ? br[i].scorePerLevel : 6;
    s += engBranchLevel(C, br[i].id) * sp;
  }
  return Math.round(Math.max(base, Math.min(100, s)));
}

/* A branch's targeted facet boost = its per-level effect x its level (supply/fatigue use this). */
function engBranchBoost(C, id) {
  if (!C || id == null) return 0;
  engInit(C);
  var br = _engBranches();
  for (var i = 0; i < br.length; i++) if (br[i].id === id) {
    var eff = Number(br[i].perLevelEffect);
    if (!isFinite(eff) || eff < 0) eff = 0;   // drop NaN/Infinity/string/negative (data-typo defense; matches _engLevelCost)
    return engBranchLevel(C, id) * eff;
  }
  return 0;
}

/* Raise a branch one level. Mutates C.funds + C.engineering.levels. */
function engBuy(C, id) {
  if (!C) return { ok: false, reason: "no campaign" };
  if (id == null) return { ok: false, reason: "unknown branch" };
  engInit(C);
  var br = _engBranches(), b = null;
  for (var i = 0; i < br.length; i++) if (br[i].id === id) { b = br[i]; break; }
  if (!b) return { ok: false, reason: "unknown branch" };
  var max = _engMax(b), cur = engBranchLevel(C, id);
  if (cur >= max) return { ok: false, reason: "Already at full capability" };
  var next = cur + 1, baseCost = _engLevelCost(b, next);
  if (baseCost == null) return { ok: false, reason: "no cost defined for level " + next };
  var cost = Math.round(baseCost * _engCostPremium(C));
  if ((C.funds || 0) < cost) return { ok: false, reason: "Insufficient funds ($" + cost + ")" };
  C.funds -= cost;
  C.engineering.levels[id] = next;
  return { ok: true, spent: cost, level: next };
}

/* Per-turn tick — runs AFTER prodOnResolve so it can repair the rail prod just decayed.
   The Construction Corps adds rail integrity back; for the South this SLOWS the
   irreversible decay (additive vs multiplicative loss → the net trend still declines). */
function engOnResolve(winnerSide, type, B, C, win) {
  if (!C) return;
  try {
    engInit(C);
    if (!C.production || typeof C.production.railIntegrity !== "number") return;
    var lvl = engBranchLevel(C, "construction");
    if (lvl <= 0) return;
    // Claw back only a FRACTION of the rail JUST lost (never the whole loss), so the South's decay
    // is SLOWED but never stopped or reversed — there is no iron to truly rebuild. D43 / the A2
    // bug-hunt: a constant additive repair created a stable equilibrium and even PINNED rail at 100
    // once the rail War-Room node was funded; tying recovery to a sub-1.0 fraction of the actual
    // loss keeps the net trend strictly negative for every decay/level combination.
    var loss = (typeof C.production.railLossLast === "number") ? C.production.railLossLast : 0;
    if (loss <= 0) return;   // US (rail repairs to full in prod) or already at the floor
    var D = _engData();
    var fpl = (D && typeof D.railClawbackFractionPerLevel === "number") ? D.railClawbackFractionPerLevel : 0.24;
    var cap = (D && typeof D.railClawbackCap === "number") ? D.railClawbackCap : 0.70;
    var frac = Math.min(cap, Math.max(0, lvl * fpl));   // < 1 always -> net rail loss remains positive
    C.production.railIntegrity = Math.min(100, C.production.railIntegrity + loss * frac);
  } catch (e) {}
}

function _engScoreWord(v) {
  if (v >= 80) return ["A first-class engineer arm", "#4a6b3a"];
  if (v >= 60) return ["A strong engineer corps", "#6f9e5a"];
  if (v >= 40) return ["A working pioneer force", "#b8863b"];
  if (v >= 22) return ["A few engineer companies", "#c9712e"];
  return ["Almost no engineers", "#9c3b2e"];
}

/* ---- engRenderSection: the Engineering Works block, appended below the Cannon Corps. ---- */
function engRenderSection(C) {
  if (!C) return '';
  engInit(C);
  var br = _engBranches();
  if (!br.length) return '';   // no data -> render nothing
  var score = engScore(C), sw = _engScoreWord(score), prem = _engCostPremium(C);
  var cards = "";
  for (var c = 0; c < br.length; c++) {
    var b = br[c], max = _engMax(b), cur = engBranchLevel(C, b.id);
    var names = b.levelNames || [];
    var curName = names[cur] != null ? names[cur] : ("Level " + cur);
    var atMax = cur >= max;
    var nextCostBase = atMax ? null : _engLevelCost(b, cur + 1);
    var nextCost = (nextCostBase == null) ? null : Math.round(nextCostBase * prem);
    var pct = Math.round((cur / (max || 1)) * 100);
    cards += '<div style="padding:9px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.12)">'
      + '<div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:13px">' + _engEsc(b.name) + '</b>'
      + '<span style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;opacity:.6">' + cur + '/' + max + '</span></div>'
      + '<div style="font-size:11px;opacity:.6">' + _engEsc(b.tagline || '') + '</div>'
      + '<div style="height:6px;background:rgba(0,0,0,.25);border:1px solid var(--rule);border-radius:3px;overflow:hidden;margin:5px 0"><div style="height:100%;width:' + pct + '%;background:#6f9e5a"></div></div>'
      + '<div style="font-size:11px;opacity:.85">Now: <b>' + _engEsc(curName) + '</b></div>'
      + '<div style="font-size:11px;opacity:.78;margin:4px 0">' + _engEsc(b.flavor || '') + '</div>';
    if (atMax) cards += '<div style="font-size:11px;color:#4a6b3a">At full capability.</div>';
    else cards += '<div class="btn-row" style="margin-top:4px"><button class="upg" data-engbuy="' + _engEsc(b.id) + '" style="padding:2px 8px;font-size:11px">Raise to ' + _engEsc(names[cur + 1] != null ? names[cur + 1] : ('level ' + (cur + 1))) + ' &middot; $' + nextCost + '</button></div>';
    cards += '</div>';
  }

  var premNote = (prem > 1) ? ' The South pays a premium of &times;' + prem.toFixed(2) + ' — iron and trained engineers are scarce.' : '';
  return ''
    + '<hr class="rule" style="margin:16px 0 10px">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap">'
    +   '<div><div style="font-size:17px;font-weight:bold">The Engineering Works Corps</div>'
    +     '<div style="opacity:.75;font-size:12px">Haupt\'s railroaders, the spade, the pontoon train, the siege. Engineering kept the Union army moving and dug the South into the ground.' + premNote + '</div></div>'
    +   '<div style="text-align:right"><div style="font-size:12px;opacity:.7">Engineering</div>'
    +     '<div style="font-size:22px;font-weight:bold;color:' + sw[1] + '">' + score + '</div>'
    +     '<div style="font-size:12px;color:' + sw[1] + '">' + sw[0] + '</div></div>'
    + '</div>'
    + '<div style="display:flex;gap:10px;flex-wrap:wrap;font-size:12px;margin:4px 0 6px"><span>Treasury: <b>$' + (C.funds || 0) + '</b></span><span style="opacity:.7">Construction repairs rail each turn &middot; pontoons ease the march &middot; works &amp; siege add weight to the army you field.</span></div>'
    + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px">' + cards + '</div>';
}

function engWireSection(C) {
  if (!C) return;
  var btns = document.querySelectorAll('[data-engbuy]');
  for (var i = 0; i < btns.length; i++) {
    (function (b) {
      b.addEventListener("click", function () {
        var r = engBuy(C, b.getAttribute("data-engbuy"));
        if (!r.ok && typeof toast === "function") toast(r.reason);
        if (typeof saveLocal === "function") saveLocal();
        if (typeof _wdRefresh === "function") _wdRefresh();
      });
    })(btns[i]);
  }
}
