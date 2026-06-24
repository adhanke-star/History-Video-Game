/* ===========================================================================
   S5(seed) · 85-battle-bridge.js — the strategy -> battle BRIDGE (pre-battle half).

   Aaron's directive: "winning and losing scenarios and options for both sides in
   every battle, dynamics affected by many factors and pre-battle history and
   preparing and battle-day execution and tactics." The locked design (§3 pre-battle
   conditioning ONLY; §11 the bridge; §29 a fair sandbox) says strategic state
   determines the ARMY YOU FIELD; battle-day tactics then decide it.

   THIS module builds the SAFE, ADDITIVE half: it READS the strategic state and
   computes the conditioned army (bridgeArmy) + a pre-battle BRIEFING with PREP
   OPTIONS (entrench / forced-march / concentrate / feint / raid-supply) stored in
   C.battlePrep. It does NOT touch the frozen battle engine — applying the
   conditioning to the actual battle units (an override of startBattleRuntime that
   scales the player force post-genForce, gated by diag-classic) is the deliberate
   next step. The briefing is the "detailed-but-skippable pre-battle planning screen"
   (R24): immersive + teaching now, decisive once wired.

   Adds C.battlePrep (sibling). bridgeInit / bridgeOnResolve (resets prep after a
   battle) / bridgeArmy(C) (the conditioning math) / bridgeBriefingHTML+Wire +
   _brgArmySummaryHTML (an interstitial fragment).

   Bare-name globals (G, CHAINS, BATTLES); brg-prefixed helpers; render never
   mutates or saves; the tick only resets C.battlePrep.
   =========================================================================== */

var _brgPREP = [
  { key: "entrench",   label: "Entrench",        hint: "Dig in. A strong defensive bonus on the day — but you cede the initiative." },
  { key: "forcedMarch",label: "Forced march",    hint: "Seize the ground first. An edge in position, paid for in fatigue and morale." },
  { key: "concentrate",label: "Concentrate force", hint: "Mass your brigades at the point of decision — heavier punch, less flexibility." },
  { key: "feint",      label: "Feint &amp; flank", hint: "Demonstrate on one wing, strike the other. Rewards good intelligence." },
  { key: "raidSupply", label: "Raid enemy supply", hint: "Cavalry against the depots — the enemy fights hungry and short of ammunition." }
];

/* S2 m5: re-entrancy guard. bridgeArmy -> commandLeadership -> cabinetLeadership can call back into
   bridgeArmy (via the War Secretary's ambition reading, _cabReading "war" -> bridgeArmy.overall); this
   flag makes a RE-ENTRANT bridgeArmy use the neutral leadership anchor (64) instead of recursing into a
   stack overflow. The outer (real) call still gets the true commandLeadership. (Bug-hunt D53.4.) */
var _brgLeadGuard = false;

function bridgeInit(C) {
  if (!C) return;
  if (!C.battlePrep || typeof C.battlePrep !== "object") {
    C.battlePrep = { entrench: false, forcedMarch: false, concentrate: false, feint: false, raidSupply: false };
  }
  for (var i = 0; i < _brgPREP.length; i++) {
    var k = _brgPREP[i].key;
    if (typeof C.battlePrep[k] !== "boolean") C.battlePrep[k] = false;
  }
}

/* Reset the prep after a battle is fought (each new turn chooses fresh). */
function bridgeOnResolve(winnerSide, type, B, C, win) {
  if (!C) return;
  bridgeInit(C);
  try { C.battlePrep = { entrench: false, forcedMarch: false, concentrate: false, feint: false, raidSupply: false }; } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("bridgeOnResolve:", e); }
}

/* Find the next campaign battle definition (bare-name CHAINS/BATTLES from base). */
function _brgNextBattle(C) {
  try {
    if (typeof CHAINS === "undefined" || typeof BATTLES === "undefined" || !C) return null;
    var chain = CHAINS[C.side]; if (!chain) return null;
    var id = chain[C.idx]; if (!id) return null;
    return BATTLES.find(function (b) { return b.id === id; }) || null;
  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_brgNextBattle:", e); return null; }
}

/* ---- bridgeArmy: THE CONDITIONING MATH. The army the player will field, derived
   from the whole strategic state — manpower (numbers/morale), production+blockade
   (equipment/arms), the home front (will), logistics (supply). Returns 0-100 facets
   + an overall index + status words. This is what the battle layer will consume. ---- */
function bridgeArmy(C) {
  var side = (C && C.side === "CS") ? "CS" : "US";
  var mp = (C && C.manpower) || {}, pr = (C && C.production) || {}, bl = (C && C.blockade) || {}, clk = (C && C.clock) || {}, wr = (C && C.warroom) || {};
  var mom = (typeof vicMomentum === "function") ? vicMomentum(C) : 0.5;
  var strength = (typeof mp.strength === "number") ? mp.strength : (side === "CS" ? 80 : 95);
  var equip = (typeof pr.equipIndex === "number") ? pr.equipIndex : (side === "CS" ? 60 : 95);
  equip = Math.min(100, equip + mom * 22);   // a winning army captures matériel and holds its logistics
  var arms = Math.round(((side === "CS" && typeof bl.importFactor === "number") ? bl.importFactor : 1.0) * 100);
  if (arms > 100) arms = 100;
  var weary = (typeof clk.weariness === "number") ? clk.weariness : 30;
  var morale = Math.round(Math.max(5, Math.min(100, 38 + mom * 55 - weary * 0.15)));
  var supply = (typeof wr.supply === "number") ? Math.round(wr.supply) : 50;
  supply = Math.min(100, supply + Math.round(mom * 15));  // secure supply lines when the war goes well
  // prep effects on the conditioning preview (applied for real on the day, later)
  var bp = (C && C.battlePrep) || {};
  var fatigue = bp.forcedMarch ? 35 : 8;
  if (bp.raidSupply) supply = Math.min(100, supply + 6);
  // A2: the Engineer Corps — the Construction Corps keeps the railheads and depots up (supply);
  // the pontoon train turns rivers into roads and spares the men a forced march (fatigue).
  if (typeof engBranchBoost === "function") {
    supply = Math.min(100, supply + Math.round(engBranchBoost(C, "construction")));
    fatigue = Math.max(0, fatigue - Math.round(engBranchBoost(C, "pontoons")));
  }
  // S2 m5: the sitting field general + the cabinet now drive leadership (anchored at 64 so a
  // default/historical command plays ≈ Classic; the A6a/D47.1 anchor lesson). The _brgLeadGuard
  // breaks the bridgeArmy->commandLeadership->cabinet->_cabReading->bridgeArmy cycle (D53.4).
  var leadership;
  if (_brgLeadGuard || typeof commandLeadership !== "function") {
    leadership = 64;
  } else {
    _brgLeadGuard = true;
    try { leadership = commandLeadership(C); } finally { _brgLeadGuard = false; }
  }
  var firepower = (typeof armoryWeaponScore === "function") ? armoryWeaponScore(C) : 30;  // the small arms you bought
  var artillery = (typeof artBatteryScore === "function") ? artBatteryScore(C) : 8;       // A1: the Cannon Corps you raised
  var engineering = (typeof engScore === "function") ? engScore(C) : 12;                   // A2: the Engineer Corps you raised
  // Q8: the between-battle camp loop — drilling raises the army's facets (musketry->firepower, maneuver->morale,
  // entrenching->supply, endurance->less fatigue) + a small general sharpness. campTrainingBonus returns EXACTLY
  // 0 for an army that never drilled (camp absent / all drill 0) -> every bridge/conditioning baseline is byte-identical.
  var _camp = (typeof campTrainingBonus === "function") ? campTrainingBonus(C) : null;
  if (_camp) {
    firepower = Math.min(100, firepower + _camp.firepower);
    morale = Math.min(100, morale + _camp.morale);
    supply = Math.min(100, supply + _camp.supply);
    fatigue = Math.max(0, fatigue - _camp.fatigueRelief);
  }
  var overall = Math.round(0.22 * strength + 0.18 * equip + 0.18 * morale + 0.14 * firepower + 0.12 * arms + 0.10 * supply + 0.06 * leadership);
  overall = Math.max(0, Math.min(100, overall - Math.round(fatigue * 0.1)));
  // The Cannon Corps + Engineer Corps are ADDITIVE arms — absent, the infantry math is intact (baseline); present, they add punch.
  var artBase = (typeof _artBaseline === "function") ? _artBaseline() : 8;
  overall = Math.min(100, overall + Math.round(Math.max(0, artillery - artBase) * 0.12));
  var engBase = (typeof _engBaseline === "function") ? _engBaseline() : 12;
  overall = Math.min(100, overall + Math.round(Math.max(0, engineering - engBase) * 0.10));
  // S2 m5: a BIDIRECTIONAL leadership edge (mirrors the additive arms above, but signed) — a
  // masterful command lifts the army a few points; a poor or discredited one drags it. At the
  // anchor (leadership 64) this is exactly 0, so a fresh/default command stays Classic-equivalent.
  overall = Math.max(0, Math.min(100, overall + Math.round((leadership - 64) * 0.18)));
  if (_camp && _camp.overall) overall = Math.min(100, overall + _camp.overall);   // Q8: a small drill "sharpness" on top of the facet lifts (0 when undrilled -> byte-identical)
  return { side: side, strength: Math.round(strength), equip: Math.round(equip), arms: arms,
    morale: morale, supply: supply, fatigue: fatigue, leadership: leadership, firepower: firepower, artillery: artillery, engineering: engineering, overall: overall };
}

function _brgWord(v) {
  if (v >= 85) return ["Superb", "#739850"];
  if (v >= 68) return ["Strong", "#6f9e5a"];
  if (v >= 50) return ["Fair", "#b8863b"];
  if (v >= 32) return ["Strained", "#c9712e"];
  return ["Brittle", "#da6a5a"];
}

function _brgBar(label, v) {
  v = Math.max(0, Math.min(100, Math.round(v)));
  var w = _brgWord(v);
  // E3-i2 (D126): the .85 opacity was on the ROW, which composites onto the value text too
  // (a child opacity:1 cannot escape an ancestor's group opacity) — dragging the status word
  // below 4.5:1. Move the dimming to the secondary LABEL only; the value word renders at full.
  return '<div style="margin:4px 0"><div style="display:flex;justify-content:space-between;font-size:12px"><span style="opacity:.85">' + label
    + '</span><span style="color:' + w[1] + '">' + v + ' &middot; ' + w[0] + '</span></div>'
    + '<div style="height:7px;background:rgba(0,0,0,.25);border:1px solid var(--rule);border-radius:3px;overflow:hidden"><div style="height:100%;width:' + v + '%;background:' + w[1] + '"></div></div></div>';
}

/* Compact "the army you will field" fragment for the between-battles interstitial. */
function _brgArmySummaryHTML(C) {
  if (!C) return '';
  bridgeInit(C);
  var a = bridgeArmy(C), ow = _brgWord(a.overall);
  return ''
    + '<div style="margin:10px auto 0;max-width:520px;text-align:left;padding:10px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.12)">'
    + '<div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:13px;font-weight:bold">The army you will field</span>'
    + '<span style="font-weight:bold;color:' + ow[1] + '">' + a.overall + ' &middot; ' + ow[0] + '</span></div>'
    + '<div style="font-size:11px;opacity:.65;margin:2px 0 6px">Conditioned by your war &mdash; manpower, equipment, the blockade, and the home front decide the men who march.</div>'
    + _brgBar('Strength (replacements)', a.strength)
    + _brgBar('Firepower (weapons)', a.firepower)
    + _brgBar('Small-arms supply', a.arms)
    + _brgBar('Morale', a.morale)
    + '</div>';
}

/* ---- The full pre-battle briefing sheet (army + the field + prep options). ---- */
function bridgeBriefingHTML(C) {
  if (!C) return '';
  bridgeInit(C);
  var a = bridgeArmy(C), ow = _brgWord(a.overall);
  var bd = _brgNextBattle(C);
  var when = bd ? (bd.name + ', ' + bd.year) : 'the next engagement';
  var role = bd ? (bd.atk === C.side ? 'You attack.' : 'You stand on the defensive.') : '';
  var bp = C.battlePrep || {};

  var prep = '';
  for (var i = 0; i < _brgPREP.length; i++) {
    var p = _brgPREP[i], on = !!bp[p.key];
    prep += '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:7px 0;border-bottom:1px dotted var(--rule)">'
      + '<div style="flex:1 1 auto"><b style="font-size:12px">' + p.label + '</b><div style="font-size:11px;opacity:.7">' + p.hint + '</div></div>'
      + '<button id="brg_' + p.key + '" type="button" class="upg" aria-pressed="' + (on ? "true" : "false") + '" style="flex:0 0 auto">' + (on ? 'Ordered &check;' : 'Order') + '</button></div>';
  }

  return ''
    + '<h1 class="title-xl" style="text-align:center">Pre-Battle Briefing</h1>'
    + '<p class="title-sub" style="text-align:center">' + when + (role ? ' &middot; ' + role : '') + '</p>'
    + '<hr class="rule">'
    + '<div style="display:flex;gap:16px;flex-wrap:wrap">'
    +   '<div style="flex:1 1 240px;min-width:220px">'
    +     '<div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin-bottom:2px">The army you field</div>'
    +     '<div style="text-align:right;font-size:20px;font-weight:bold;color:' + ow[1] + ';margin:-18px 0 2px">' + a.overall + ' &middot; ' + ow[0] + '</div>'
    +     _brgBar('Strength', a.strength) + _brgBar('Firepower (small arms)', a.firepower) + _brgBar('Artillery (Cannon Corps)', a.artillery) + _brgBar('Engineering (Works Corps)', a.engineering) + _brgBar('Equipment', a.equip)
    +     _brgBar('Small arms', a.arms) + _brgBar('Morale', a.morale) + _brgBar('Supply', a.supply) + _brgBar('Fatigue (lower is better)', 100 - a.fatigue)
    +   '</div>'
    +   '<div style="flex:1 1 240px;min-width:220px">'
    +     '<div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin-bottom:2px">Your orders for the day</div>'
    +     prep
    +   '</div>'
    + '</div>'
    + '<p class="lede" style="font-size:11px;opacity:.6;margin-top:10px">Your strategic war shapes the army that takes the field; your orders shape how it fights. '
    + 'History flavors the day &mdash; it never decides it. The battle is yours to win.</p>'
    + '<div class="btn-row" style="margin-top:14px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'
    +   '<button id="brgBack" type="button" class="upg">Back</button>'
    +   '<button id="brgAuto" type="button" class="upg" title="Resolve from the army you fielded, without fighting the battle">Auto-resolve</button>'
    +   '<button id="brgRealTime" type="button" class="upg" title="Fight this battle in the real-time tactical engine — your conditioned army, drag-to-maneuver">Fight in real time &#9876;</button>'
    +   '<button id="brgToField" type="button" class="bigbtn" title="Fight on the Classic hex map">To the Field (Classic) &#9654;</button>'
    + '</div>';
}

function bridgeWireBriefing(C, onBack, onField) {
  if (!C) return;
  bridgeInit(C);
  for (var i = 0; i < _brgPREP.length; i++) {
    (function (p) {
      var b = document.getElementById("brg_" + p.key);
      if (!b) return;
      b.addEventListener("click", function () {
        C.battlePrep[p.key] = !C.battlePrep[p.key];
        if (typeof saveLocal === "function") saveLocal();
        // re-render the briefing in place
        if (typeof openSheet === "function") { openSheet(bridgeBriefingHTML(C)); bridgeWireBriefing(C, onBack, onField); }
      });
    })(_brgPREP[i]);
  }
  var back = document.getElementById("brgBack");
  if (back) back.addEventListener("click", function () { if (typeof onBack === "function") onBack(); });
  var auto = document.getElementById("brgAuto");
  if (auto) auto.addEventListener("click", function () { if (typeof bridgeAutoResolve === "function") bridgeAutoResolve(C); });   // A6b: resolve from the conditioned army, skip the tactical fight
  // Phase A (A2): fight this campaign battle in the real-time tactical engine, conditioned by the same
  // army (A1); the outcome feeds back into the campaign (A3). The Classic-hex option remains below.
  var rt = document.getElementById("brgRealTime");
  if (rt) rt.addEventListener("click", function () { if (typeof fldLaunchCampaignBattle === "function") fldLaunchCampaignBattle(C); else if (typeof onField === "function") onField(); });
  var go = document.getElementById("brgToField");
  if (go) go.addEventListener("click", function () { if (typeof onField === "function") onField(); });
}
