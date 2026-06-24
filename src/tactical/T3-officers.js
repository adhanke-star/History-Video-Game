/* ============================================================================
   src/tactical/T3-officers.js  —  TACTICAL ENGINE · PHASE B-2 (OFFICERS & COMMAND)

   Leadership ON THE FIELD. V1-CHECKLIST Phase B-2: "leaders with command radius +
   morale bonus, can be hit (ties named-generals)." Before radios, a 19th-century
   army was held together by the personal presence of its commanders — a general
   riding the line steadied wavering troops and rallied broken ones, and the death
   of a general could collapse a position. This module models that:

     - NAMED FIELD LEADERS ride with their army. Each projects a COMMAND RADIUS;
       friendly brigades inside it recover morale faster, hold longer before they
       break, and rally from a rout sooner (the historical rallying role).
     - LEADERS CAN BE HIT. Riding near the firing line accrues EXPOSURE; past a
       hidden, seeded fate threshold (better generals endure more) the leader is
       wounded, then falls — losing the aura and dealing a one-time COMMAND SHOCK
       to nearby troops. This is Bee and Bartow on Henry Hill, A. S. Johnston at
       Shiloh, Reynolds at Gettysburg: the general-down rout trigger.
     - TIES THE NAMED-GENERALS LAYER (S2 m5). A campaign battle's PLAYER army
       commander is the general you appointed — his bridgeArmy(C).leadership sets
       his field quality and his name rides the field. Hand-authored scenarios
       (First Bull Run) carry the real command cast in data/bullrun.json.leaders.

   ARCHITECTURE: ADDITIVE, fully GATED on __FIELD.officers (default ON for every live
   launch; the existing field/bullrun/fog/autopause/ai/campaign-link probes set it
   OFF so their baselines stay BYTE-IDENTICAL — the new layer is provably the only
   change). T0 exposes tiny guarded seams (build at reset; a step before morale; a
   `(u.cmdBonus||0)` read in fldMoraleStep that is 0 when officers are off; render +
   HUD hooks). DETERMINISM: the only randomness is one seeded fldRng() per leader at
   build (the fate threshold) -> same seed reproduces the battle. Bare-name globals
   (G, GAME_DATA, __FIELD, FLD, bridgeArmy, cmdActiveGeneral, the fld* T0 helpers,
   _fldCamp from T2). All helpers uniquely prefixed + defined once. No literal
   comment-closer in this block.
   ============================================================================ */

/* ---- tunables (kept here so T0 stays self-contained; the morale coefficients that
   T0 consumes are inlined there against (u.cmdBonus||0), 0 when officers are off). ---- */
var FLDO = {
  CMD_BONUS_CAP: 0.9,     // ceiling on a unit's summed command bonus — a SINGLE leader stays meaningful, but a
                          // dense cluster of overlapping auras can't saturate the line into near-immunity (§27)
  RIDE_SPD: 36,           // leader movement (yd/s) — a touch faster than a marching line
  RIDE_BEHIND: 36,        // the leader rides this far behind its anchor brigade, toward home (just off the firing line)
  HAZ_RANGE: 245,         // an enemy brigade within this of a leader contributes EXPOSURE (yd)
  HAZ_RATE: 0.05,         // exposure -> risk accrual scale. RETUNED DOWN from 0.17 (bug-hunt B2 #1): a fall is a RARE,
                          // historically-weighted hinge — not the default. Most generals must SURVIVE the day.
  HAZ_MAX: 2.4,           // cap on per-tick exposure so a single point-blank brigade can't dominate the risk integral
  HAZ_RECOVER: 0.13,      // /s: risk DECAYS when a leader is out of contact -> withdrawal earns real relief (no death-ratchet)
  FATE_BASE: 9.0,         // baseline fate threshold (exposure-seconds); * per-leader fate (data) * (1+quality) * seeded luck
  WOUND_FRAC: 0.55,       // a non-fatal first hit (aura halves) lands at this fraction of the fate threshold
  SHOCK: 11,              // one-time morale shock to friendlies in radius when a leader is KILLED
};

/* ===========================================================================
   BUILD  (called from the T0 fldResetRun hook, once per launch, after units exist)
   =========================================================================== */
function fldBuildOfficers() {
  __FIELD.leaders = [];
  if (!__FIELD.officers) return;                 // the gate: OFF -> no leaders -> the layer is wholly inert
  var roster = fldOfficerRoster();
  if (!roster || !roster.length) return;
  for (var i = 0; i < roster.length; i++) { var ld = fldMakeOfficer(roster[i]); if (ld) __FIELD.leaders.push(ld); }
}
/* the command cast for this battle:
   1) a hand-authored scenario (Bull Run) supplies the real figures via scenData.leaders {US:[],CS:[]};
   2) otherwise ONE army commander per side — the PLAYER's is the appointed strategic general
      (quality from bridgeArmy leadership), the foe's a competent default. */
function fldOfficerRoster() {
  var sd = __FIELD.scenData;
  if (sd && sd.leaders) {
    var out = [], s;
    for (s in sd.leaders) {
      if (!Object.prototype.hasOwnProperty.call(sd.leaders, s)) continue;
      var arr = sd.leaders[s]; if (!Array.isArray(arr) || !arr.length) continue;   // skip non-array keys (e.g., a "_note" doc field) — they are not a side roster
      for (var i = 0; i < arr.length; i++) { var o = {}; for (var k in arr[i]) { if (Object.prototype.hasOwnProperty.call(arr[i], k)) o[k] = arr[i][k]; } o.side = s; out.push(o); }
    }
    return out;
  }
  return fldProceduralOfficers();
}
function fldProceduralOfficers() {
  var out = [], sides = ["US", "CS"];
  for (var k = 0; k < sides.length; k++) {
    var side = sides[k], cen = fldSideCentroid(side); if (!cen) continue;   // no units this side -> no leader
    var q = fldOfficerSideQuality(side);
    out.push({ side: side, id: "ld_" + side, name: q.name, short: q.short, quality: q.quality, radius: 250, x: cen.x, z: cen.z, note: q.note || "" });
  }
  return out;
}
/* the side's mean position pulled back toward its home edge — the leader's start "command post". */
function fldSideCentroid(side) {
  var sx = 0, sz = 0, n = 0, U = __FIELD.units;
  for (var i = 0; i < U.length; i++) { var u = U[i]; if (u.side !== side || !u.alive) continue; sx += u.x; sz += u.z; n++; }
  if (!n) return null;
  var cx = sx / n, cz = sz / n, homeZ = fldHomeEdgeZ(side);
  return { x: cx, z: cz + (homeZ > cz ? 1 : -1) * 45 };
}
/* the PLAYER side's commander in a campaign is the appointed general (name + leadership);
   every other case is a competent default. Maps the 42..88 leadership band -> a 0.18..0.95 field quality. */
function fldOfficerSideQuality(side) {
  var C = (typeof _fldCamp === "function") ? _fldCamp() : null;
  var playerSide = (C && C.side === "CS") ? "CS" : "US";
  var isPlayer = !!(__FIELD.campaignCtx && C && side === playerSide);
  if (isPlayer) {
    var lead = 64;
    try { if (typeof bridgeArmy === "function") { var a = bridgeArmy(C); if (a && typeof a.leadership === "number" && isFinite(a.leadership)) lead = a.leadership; } } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("fldOfficerSideQuality bridgeArmy:", e); }
    var nm = null;
    try { if (typeof cmdActiveGeneral === "function") { var g = cmdActiveGeneral(C); if (g && g.name) nm = String(g.name); } } catch (e2) {}
    var q = fldClamp((lead - 42) / 46, 0.18, 0.95);
    var sh = nm ? _fldLastName(nm) : (side === "US" ? "Union" : "Confederate");
    return { quality: q, name: nm || (side === "US" ? "Union Commander" : "Confederate Commander"), short: sh,
      note: "Your appointed commander takes the field; his leadership rating shapes how the line holds and rallies." };
  }
  return { quality: 0.55, name: side === "US" ? "Union Commander" : "Confederate Commander", short: side === "US" ? "Union" : "Confederate" };
}
/* ---- R-1 (D94 RATING SYSTEM) · the documented persona for a field leader. The link is an
   EXPLICIT opt-in: a leader derives from a persona ONLY when it names one via `pid` (the
   persona key in data/ratings.json -> personas). We do NOT fall back to the bare `id`, because
   leader ids are reused across scenarios (e.g. `ld_jackson` is the 1861 brigadier at Bull Run
   but a corps commander at Antietam/Chancellorsville) — an id-match would leak the wrong
   persona across battles. No `pid` (every scenario but the opted-in Bull Run cast, the
   procedural default, and the probes' synthetic leaders) ⇒ null ⇒ the officer is BYTE-IDENTICAL. ---- */
function fldOfficerPersona(o) {
  if (!o || !o.pid) return null;
  var d = (typeof gameData === "function") ? gameData("ratings") : null;
  if (!d || !d.personas) return null;
  var rec = d.personas[o.pid];
  return (rec && rec.persona) ? rec : null;
}
function fldMakeOfficer(o) {
  if (!o) return null;
  // R-1 OFFICER DERIVATION: a RATED leader takes his field quality / aura-radius / fate from his
  // documented persona (the source of truth), so the man's history drives the field. quality is
  // derived through the EXISTING (lead-42)/46 map (fldPersonaQuality), calibrated to reproduce the
  // authored field quality within tolerance (the R-0 oracle) -> a rated aura SHIFTS only slightly.
  // An UNRATED leader (no persona, incl. the procedural default + the probes' synthetic leaders)
  // keeps every authored value -> byte-identical. Every persona read is typeof-guarded (T14 loads
  // after this module) so the layer degrades to the authored numbers if the rating data is absent.
  var rec = (typeof fldOfficerPersona === "function") ? fldOfficerPersona(o) : null;
  var pq = (rec && typeof fldPersonaQuality === "function") ? fldPersonaQuality(rec.persona) : null;
  var quality = (typeof pq === "number" && isFinite(pq)) ? pq
              : ((typeof o.quality === "number") ? o.quality : 0.55);
  var baseR = (typeof o.radius === "number" && o.radius > 0) ? o.radius : 220;
  // radius: the authored ECHELON range (army/division/brigade), modulated for a rated leader by his
  // persona charisma (an inspiring presence carries a touch farther) and held inside the 160-290 band.
  var radius = baseR;
  if (rec && typeof fldAttr === "function") radius = fldClamp(Math.round(baseR + (fldAttr(rec.persona, "charisma") - 64) * 0.6), 160, 290);
  // fate (the seeded-fate durability multiplier): the persona's fate for the rated cast (it matches
  // the authored scenario fate), else the authored scenario fate, else neutral 1.
  var fateMul = (rec && typeof rec.fate === "number" && rec.fate > 0) ? rec.fate
              : ((typeof o.fate === "number" && o.fate > 0) ? o.fate : 1);
  var ld = {
    id: o.id || ("ld_" + (o.side || "X") + "_" + Math.round((o.x || 0))),
    side: (o.side === "CS") ? "CS" : "US",
    name: o.name || "Commander", short: o.short || _fldLastName(o.name || "Commander"),
    quality: fldClamp(quality, 0.1, 0.98),
    radius: radius,
    x: (typeof o.x === "number") ? o.x : FLD.FIELD_W / 2,
    z: (typeof o.z === "number") ? o.z : FLD.FIELD_H / 2,
    attach: o.attach || null, atSec: (typeof o.atSec === "number") ? o.atSec : null,
    note: o.note || "", teach: o.teach || "", teachReq: o.teachReq || null, teachAlt: o.teachAlt || "",
    alive: true, wounded: false, _risk: 0, fellAt: null, _everSeen: false,
  };
  ld.active = (ld.atSec == null);                       // timed arrivals are inert until their hour
  if (ld.attach) { var au = fldById(ld.attach); if (au) { ld.x = au.x; ld.z = au.z; } }   // ride with the brigade if it's on the field
  // hidden, SEEDED fate threshold (the only randomness): the per-leader `fate` (data) weights it to HISTORY —
  // >1 endures the day (army commanders / Jackson), <1 is fall-prone (Bee, Bartow). Quality adds; jitter is luck.
  ld._fate = FLDO.FATE_BASE * fateMul * (1 + ld.quality) * (0.6 + fldRng() * 0.9);
  return ld;
}
function _fldLastName(s) { s = String(s == null ? "" : s).replace(/['"]/g, "").trim(); var p = s.split(/\s+/); return p.length ? p[p.length - 1] : s; }
function fldOfficerById(id) { var L = __FIELD.leaders; if (!L) return null; for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i]; return null; }

/* ===========================================================================
   THE PER-TICK STEP  (T0 fldSimStep seam — runs AFTER fire, BEFORE morale, so the
   command bonus + any command-shock land in this tick's morale resolution).
   =========================================================================== */
function fldOfficersStep(dt) {
  var L = __FIELD.leaders; if (!L || !L.length) return;
  var U = __FIELD.units, i, j;
  for (i = 0; i < U.length; i++) U[i].cmdBonus = 0;     // recompute the command aura fresh each tick (no stale carryover)
  for (i = 0; i < L.length; i++) {
    var ld = L[i];
    if (!ld.active && ld.atSec != null && __FIELD.t >= ld.atSec) fldOfficerActivate(ld);
    if (!ld.active || !ld.alive) continue;
    fldOfficerMove(ld, dt);
    fldOfficerHazard(ld, dt);
    if (!ld.alive) continue;                             // may have just fallen this tick (no aura)
    var aura = ld.quality * (ld.wounded ? 0.5 : 1);
    for (j = 0; j < U.length; j++) {
      var u = U[j]; if (!u.alive || u.side !== ld.side) continue;
      var d = fldDist(u, ld); if (d > ld.radius) continue;
      u.cmdBonus = Math.min(FLDO.CMD_BONUS_CAP, (u.cmdBonus || 0) + aura * (1 - d / ld.radius));
    }
  }
}
function fldOfficerActivate(ld) {
  ld.active = true;
  var au = ld.attach ? fldById(ld.attach) : null;
  if (au && au.alive) { ld.x = au.x; ld.z = au.z; }
  else { var an = fldOfficerAnchorUnit(ld); if (an) { ld.x = an.x; ld.z = an.z; } }
  var line = (ld.short || ld.name) + " takes the field.";
  fldAnnounce(line);
  if (typeof fldScenarioBanner === "function") { try { fldScenarioBanner(line, ld.side); } catch (e) {} }
}
/* the brigade the leader keeps with: its attached unit if alive, else the nearest steady-ish friendly. */
function fldOfficerAnchorUnit(ld) {
  if (ld.attach) { var a = fldById(ld.attach); if (a && a.alive && a.state !== "routing") return a; }
  var best = null, bd = 1e9, U = __FIELD.units;
  for (var i = 0; i < U.length; i++) { var u = U[i]; if (u.side !== ld.side || !u.alive || u.state === "routing") continue; var d = fldDist(u, ld); if (d < bd) { bd = d; best = u; } }
  return best;
}
/* the leader rides to a post just behind its anchor brigade (toward home), so command follows the line. */
function fldOfficerMove(ld, dt) {
  var anchor = fldOfficerAnchorUnit(ld);
  var hx = ld.x, hz = ld.z;
  if (anchor) { var homeZ = fldHomeEdgeZ(ld.side), dir = (homeZ > anchor.z) ? 1 : -1; hx = anchor.x; hz = anchor.z + dir * FLDO.RIDE_BEHIND; }
  var dx = hx - ld.x, dz = hz - ld.z, dd = Math.sqrt(dx * dx + dz * dz);
  if (dd > 4) { var s = Math.min(dd, FLDO.RIDE_SPD * dt); ld.x += (dx / dd) * s; ld.z += (dz / dd) * s; }
  ld.x = fldClamp(ld.x, 6, FLD.FIELD_W - 6); ld.z = fldClamp(ld.z, -70, FLD.FIELD_H + 70);
}
/* exposure near the firing line accrues risk; past WOUND_FRAC of the fate threshold the leader is
   wounded (aura halves), past the threshold he falls. Deterministic (the threshold was seeded at build). */
function fldOfficerHazard(ld, dt) {
  var U = __FIELD.units, exposure = 0;
  for (var i = 0; i < U.length; i++) {
    var e = U[i]; if (!e.alive || e.side === ld.side || e.state === "routing" || e.ammo <= 0) continue;
    var d = fldDist(e, ld); if (d > FLDO.HAZ_RANGE) continue;   // a general within musket range of firing troops is at risk (fog or not — the men can see his flag)
    var f = 1 - d / FLDO.HAZ_RANGE; exposure += (e.men / 1500) * f * f;   // steep (f^2) falloff: only CLOSE fire really threatens the saddle
  }
  if (exposure > 0) {
    if (exposure > FLDO.HAZ_MAX) exposure = FLDO.HAZ_MAX;        // a single point-blank brigade can't dominate the integral
    // COVER shelters the commander — a wall / woods / reverse slope (the Jackson lesson) cuts the exposure he takes.
    var cover = (typeof fldCoverAt === "function") ? fldCoverAt(ld.x, ld.z) : 1; if (!(cover > 0)) cover = 1;
    ld._risk += (exposure / cover) * FLDO.HAZ_RATE * dt;
    if (!ld.wounded && ld._risk >= ld._fate * FLDO.WOUND_FRAC) fldOfficerWounded(ld);
    if (ld._risk >= ld._fate) fldOfficerFalls(ld);
  } else {
    // OUT OF CONTACT: risk bleeds off so withdrawing a hard-pressed general actually saves him, and a wound
    // mends once he is well clear (no permanent 50% command tax) — homeostasis, not a one-way death ratchet.
    ld._risk = Math.max(0, ld._risk - FLDO.HAZ_RECOVER * dt);
    if (ld.wounded && ld._risk <= ld._fate * FLDO.WOUND_FRAC * 0.55) ld.wounded = false;
  }
}
function fldOfficerWounded(ld) {
  if (ld.wounded || !ld.alive) return;
  ld.wounded = true;
  var line = (ld.short || ld.name) + " is hit, but keeps the saddle.";
  fldAnnounce(line);
  if (typeof fldScenarioBanner === "function") { try { fldScenarioBanner(line, ld.side); } catch (e) {} }
}
function fldOfficerFalls(ld) {
  if (!ld.alive) return;
  ld.alive = false; ld.fellAt = { x: ld.x, z: ld.z };
  var U = __FIELD.units;
  for (var i = 0; i < U.length; i++) {
    var u = U[i]; if (!u.alive || u.side !== ld.side) continue;
    var d = fldDist(u, ld); if (d > ld.radius) continue;
    var _cs = (__FIELD.sev ? __FIELD.sev.cmdShock : 1);   // B-5: command-shock severity (1.0 = neutral = byte-identical)
    u.morale = fldClamp(u.morale - FLDO.SHOCK * _cs * (1 - d / ld.radius), 0, u.maxMor);   // the general-down shock
  }
  // the teach line may reference an event that hasn't happened yet (e.g., Bee naming Jackson, who arrives at
  // 135s) — fall back to a neutral line when its precondition isn't met, so the narration is never anachronistic
  // and never asserts a contested quote as settled fact (bug-hunt critic #1 — anti-Lost-Cause integrity).
  var line = ld.teach || ((ld.short || ld.name) + " has fallen — the line wavers.");
  if (ld.teachReq) { var req = fldOfficerById(ld.teachReq); if (!(req && req.active && req.alive)) line = ld.teachAlt || ((ld.short || ld.name) + " has fallen — the line wavers."); }
  fldAnnounce(line);
  if (typeof fldScenarioBanner === "function") { try { fldScenarioBanner(line, ld.side); } catch (e) {} }
}
/* the side the human commands. B-6 (command either side): fldInitSim resolves __FIELD.playerSide
   AUTHORITATIVELY for every launch (Bull Run side toggle / skirmish pick / campaign side / "US" default),
   so this is the single read-point the control layer, the render/HUD fog viewer, and the B-2/B-3/B-4
   display layers all share. The legacy campaign fallback is kept as belt-and-suspenders for any pre-B-6
   caller or a launch that somehow didn't set __FIELD.playerSide. */
function fldPlayerSide() {
  // A CS campaign is AUTHORITATIVE and computed LIVE from G.campaign.side (the legacy contract — the officer
  // roster, the fog viewer, and the HUD read this even mid-setup, before any relaunch sets __FIELD.playerSide).
  try { var C = (typeof _fldCamp === "function") ? _fldCamp() : null; if (__FIELD.campaignCtx && C && C.side === "CS") return "CS"; } catch (e) {}
  // else the explicit per-launch side (B-6: the Bull Run side toggle / the skirmish pick), default "US".
  var s = __FIELD.playerSide;
  if (s === "US" || s === "CS") return s;
  return "US";
}
/* lists for the end-screen / HUD: which named officers fell. */
function fldOfficersDownList(side) {
  var L = __FIELD.leaders, out = []; if (!L) return out;
  for (var i = 0; i < L.length; i++) { var ld = L[i]; if (side && ld.side !== side) continue; if (!ld.alive) out.push(ld.short || ld.name); }
  return out;
}

/* ===========================================================================
   HUD  (T0 fldRenderHud seam) — commander + command-range for a selected unit;
   a field-officer roster line when nothing is selected.
   =========================================================================== */
function fldOfficerHudSelected(u) {
  if (!__FIELD.officers || !u) return "";
  var cmdr = u.commander ? ('<div style="opacity:.78;font-size:12px;margin-top:4px;">Brigade: <b>' + _fldEscO(u.commander) + '</b></div>') : "";
  var inCmd = (u.cmdBonus || 0) > 0.02;
  var who = inCmd ? fldNearestLeaderName(u) : null;
  var status = inCmd
    ? '<span style="color:#8fb47a;">&#9733; In command' + (who ? " &mdash; " + _fldEscO(who) : "") + '</span>'
    : '<span style="color:#c08a5a;">&#9679; Out of command range</span>';
  return cmdr + '<div style="font-size:12px;margin-top:2px;">' + status + '</div>';
}
function fldNearestLeaderName(u) {
  var L = __FIELD.leaders; if (!L) return null; var best = null, bd = 1e9;
  for (var i = 0; i < L.length; i++) { var ld = L[i]; if (!ld.alive || !ld.active || ld.side !== u.side) continue; var d = fldDist(u, ld); if (d <= ld.radius && d < bd) { bd = d; best = ld; } }
  return best ? (best.short || best.name) : null;
}
function fldOfficerHudRoster() {
  if (!__FIELD.officers) return "";
  var L = __FIELD.leaders; if (!L || !L.length) return "";
  var ps = fldPlayerSide(), mine = [];   // show the PLAYER's own field officers (US standalone, or CS in a CS-player campaign)
  for (var i = 0; i < L.length; i++) { var ld = L[i]; if (ld.side !== ps) continue; if (ld.atSec != null && !ld.active) continue; mine.push(ld); }
  if (!mine.length) return "";
  var parts = [];
  for (var j = 0; j < mine.length; j++) {
    var l = mine[j];
    var tag = !l.alive ? ' &#10013;' : (l.wounded ? " (wounded)" : "");
    var col = !l.alive ? "#d49898" : (l.wounded ? "#c0a05a" : "#8fb47a");
    parts.push('<span style="color:' + col + ';">' + _fldEscO(l.short || l.name) + tag + '</span>');
  }
  return '<div style="opacity:.8;margin-top:6px;font-size:12px;border-top:1px solid #795c3e;padding-top:5px;">Field officers: ' + parts.join(", ") + '</div>';/* wcag-auditor: contrast fix #4a3c28->#795c3e border on #0c0f14/#10141a (was 1.80:1, now 3.12/3.00:1) WCAG 1.4.11 */
}
function _fldEscO(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

/* the end-screen officer teaching payoff (T0 fldOnOver seam) — who was lost, and why it mattered. */
function fldOfficerEndHtml(winner) {
  if (!__FIELD.officers) return "";
  var L = __FIELD.leaders; if (!L || !L.length) return "";
  var downUS = fldOfficersDownList("US"), downCS = fldOfficersDownList("CS");
  if (!downUS.length && !downCS.length) return "";
  var rows = "";
  if (downUS.length) rows += '<div style="font-size:13px;margin-top:3px;"><b style="color:#9fb6d8;">Union officers lost:</b> ' + _fldEscO(downUS.join(", ")) + '</div>';
  if (downCS.length) rows += '<div style="font-size:13px;margin-top:3px;"><b style="color:#d8a79f;">Confederate officers lost:</b> ' + _fldEscO(downCS.join(", ")) + '</div>';
  return '<div style="text-align:left;background:#15110b;border:1px solid #715e3e;border-radius:6px;padding:12px 14px;margin-bottom:16px;">' +
    '<div style="color:#d8c87a;font-weight:bold;margin-bottom:6px;">The cost of command</div>' +
    '<div style="font-size:13px;opacity:.9;line-height:1.5;margin-bottom:5px;">Before radios, a general led from the saddle within sight of his men. That presence steadied the line &mdash; and put him in the line of fire.</div>' +
    rows + '</div>';
}

/* ===========================================================================
   2D RENDERER  (T0 fld2dDraw seam) — command ring + a mounted-officer marker.
   CVD-safe: a star glyph + a name label, never colour alone; a cross for the fallen.
   =========================================================================== */
function fldDrawOfficers(ctx, v) {
  if (!__FIELD.officers) return;
  var L = __FIELD.leaders; if (!L || !L.length) return;
  for (var i = 0; i < L.length; i++) {
    var ld = L[i]; if (ld.atSec != null && !ld.active) continue;
    var seen = fldOfficerSeen(ld);
    if (!seen && !(!ld.alive && ld._everSeen)) continue;   // fog: hide an unseen enemy general — but keep a once-seen FALLEN one marked (fog memory)
    var px = ld.x, pz = ld.z;
    if (!ld.alive && ld.fellAt) { px = ld.fellAt.x; pz = ld.fellAt.z; }
    var cx = v.ox + px * v.s, cz = v.oz + pz * v.s;
    var col = ld.side === "US" ? "#cdd8ee" : "#eecdc4";
    var ring = ld.side === "US" ? "#6c8ebf" : "#b06a5a";
    // command ring (living, active)
    if (ld.alive) {
      ctx.save(); ctx.globalAlpha = ld.wounded ? 0.16 : 0.24; ctx.strokeStyle = ring; ctx.lineWidth = 1.4; ctx.setLineDash([5, 6]);
      ctx.beginPath(); ctx.arc(cx, cz, ld.radius * v.s, 0, 7); ctx.stroke(); ctx.restore();
    }
    // the marker
    ctx.save();
    if (!ld.alive) {
      ctx.globalAlpha = 0.85; ctx.strokeStyle = "#d8b46a"; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(cx - 6, cz - 6); ctx.lineTo(cx + 6, cz + 6); ctx.moveTo(cx + 6, cz - 6); ctx.lineTo(cx - 6, cz + 6); ctx.stroke();   // a fallen cross
    } else {
      // a small diamond plinth + a star (the commander's standard)
      ctx.fillStyle = "#13100a"; ctx.beginPath(); ctx.moveTo(cx, cz - 8); ctx.lineTo(cx + 7, cz); ctx.lineTo(cx, cz + 8); ctx.lineTo(cx - 7, cz); ctx.closePath(); ctx.fill();
      ctx.fillStyle = ld.wounded ? "#d8b46a" : col; fldStar(ctx, cx, cz, 6, 3);
    }
    ctx.restore();
    // the name label (always — the teaching is the names)
    var nm = (ld.short || ld.name) + (!ld.alive ? " †" : (ld.wounded ? " (wounded)" : ""));
    if (typeof fld2dLabel === "function") fld2dLabel(ctx, nm, cx, cz + 20);
  }
}
function fldStar(ctx, cx, cy, rO, rI) {
  ctx.beginPath();
  for (var k = 0; k < 10; k++) { var r = (k % 2 === 0) ? rO : rI, a = -Math.PI / 2 + k * Math.PI / 5; var x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
  ctx.closePath(); ctx.fill();
}
/* fog: the PLAYER's own leaders are always shown; an ENEMY leader is revealed only when a brigade of his
   side near him is currently scouted (you spot the general's flag where you can see his troops). Once ever
   seen, _everSeen is latched so a fallen enemy commander keeps his casualty marker (fog memory). */
function fldOfficerSeen(ld) {
  var ps = fldPlayerSide();
  if (!__FIELD.fog || ld.side === ps) { ld._everSeen = true; return true; }
  var U = __FIELD.units;
  for (var i = 0; i < U.length; i++) { var u = U[i]; if (u.side !== ld.side || !u.alive) continue; if (fldDist(u, ld) <= 160 && fldVisible(ps, u)) { ld._everSeen = true; return true; } }
  return false;
}

/* ===========================================================================
   3D RENDERER  (T0 fld3dInit / fld3dRender seams) — a mounted figure + a ground aura.
   THREE is referenced only here (it loads async); no top-level new THREE.*.
   =========================================================================== */
function fld3dBuildOfficers() {
  var T = window.THREE; if (!T || !__FIELD.scene) return;
  // dispose a prior set (relaunch / fallback)
  fld3dDisposeOfficers();
  __FIELD._ld3d = {};
  var L = __FIELD.leaders; if (!L || !L.length) return;
  var grp = new T.Group(); __FIELD.scene.add(grp); __FIELD._ld3dGroup = grp;
  for (var i = 0; i < L.length; i++) {
    var ld = L[i];
    var col = ld.side === "US" ? "#cdd8ee" : "#eecdc4";
    var g = new T.Group();
    var horse = new T.Mesh(new T.BoxGeometry(20, 9, 7), new T.MeshLambertMaterial({ color: "#3a2c20" })); horse.position.y = 9; g.add(horse);
    var rider = new T.Mesh(new T.CylinderGeometry(2.2, 2.6, 12, 6), new T.MeshLambertMaterial({ color: ld.side === "US" ? "#3a5a9a" : "#9a4a3a" })); rider.position.y = 19; rider.name = "rider"; g.add(rider);
    var plume = new T.Mesh(new T.ConeGeometry(3, 8, 5), new T.MeshLambertMaterial({ color: col })); plume.position.y = 27; plume.name = "plume"; g.add(plume);
    var aura = new T.Mesh(new T.RingGeometry(Math.max(8, ld.radius - 6), ld.radius, 48), new T.MeshBasicMaterial({ color: ld.side === "US" ? "#6c8ebf" : "#b06a5a", side: T.DoubleSide, transparent: true, opacity: 0.16 }));
    aura.rotation.x = -Math.PI / 2; aura.position.y = 1.5; aura.name = "aura"; g.add(aura);
    grp.add(g); __FIELD._ld3d[ld.id] = g;
  }
}
function fld3dSyncOfficers() {
  var L = __FIELD.leaders, map = __FIELD._ld3d; if (!L || !map) return;
  for (var i = 0; i < L.length; i++) {
    var ld = L[i], g = map[ld.id]; if (!g) continue;
    var seen = fldOfficerSeen(ld), pending = (ld.atSec != null && !ld.active);
    var shown = !pending && (seen || (!ld.alive && ld._everSeen));   // keep a once-seen FALLEN enemy commander marked (fog memory)
    g.visible = shown; if (!shown) continue;
    var px = ld.x, pz = ld.z; if (!ld.alive && ld.fellAt) { px = ld.fellAt.x; pz = ld.fellAt.z; }
    var y = (typeof fldTerrainH === "function") ? fldTerrainH(px, pz) : 0;
    g.position.set(px, y, pz);
    var rider = g.getObjectByName("rider"), plume = g.getObjectByName("plume"), aura = g.getObjectByName("aura");
    if (rider) rider.visible = ld.alive;
    if (plume) { plume.visible = ld.alive; if (ld.alive && plume.material) plume.material.color.set(ld.wounded ? "#d8b46a" : (ld.side === "US" ? "#cdd8ee" : "#eecdc4")); }
    if (aura) { aura.visible = ld.alive; if (aura.material) aura.material.opacity = ld.alive ? (ld.wounded ? 0.10 : 0.18) : 0; }
  }
}
function fld3dDisposeOfficers() {
  var grp = __FIELD._ld3dGroup; if (!grp) { __FIELD._ld3d = null; return; }
  try {
    grp.traverse(function (o) { if (o.geometry && o.geometry.dispose) o.geometry.dispose(); if (o.material && o.material.dispose) o.material.dispose(); });
    if (grp.parent) grp.parent.remove(grp);
  } catch (e) {}
  __FIELD._ld3dGroup = null; __FIELD._ld3d = null;
}
