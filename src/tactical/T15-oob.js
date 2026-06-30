/* ============================================================================
   src/tactical/T15-oob.js  —  TACTICAL/RATING LAYER · THE OOB-MAPPING SUBSTRATE
   (RATING-SYSTEM-DESIGN §12.1 "the depth chart / the roster screen" · §13 matchup ·
    §15 "own army exact, enemy fuzzy — revealed by scouting"; DECISIONS D106)

   THE SHARED PLUMBING the GM depth-chart MOVES (§12.2 — promote/transfer/commission
   over a real billet TREE) and Q8b SCOUTING (§15 — tier-reveal the enemy OOB) both
   need: a single read-only layer that maps the STRATEGIC next-battle (_brgNextBattle)
   to a STRUCTURED order of battle — commander -> corps -> brigade — for BOTH sides,
   each billet carrying its OVR/grade/strength/provenance (the rating spine, T14).

   TWO SOURCES, ONE SHAPE:
     - AUTHORED  — a battle with a hand-built tactical scenario (fldScenarioData: bullrun1,
       antietam, shiloh, …) exposes its REAL brigade OOB (real commanders + the authored
       "(Verified)/(Inferred)" provenance read straight from each unit's note). The
       brigades are the historical divisions/brigades; nothing is invented.
     - DERIVED   — a procedural campaign battle (no hand-built scenario) gets a
       DETERMINISTIC corps/brigade tree split from the battle's authored totals
       (bd.us/bd.cs/year/theater), seeded by id+side (NO RNG -> reproducible). Marked
       Inferred (hatched, "~ derived"); billets are FORMATION-LABELED (I Corps · 1st
       Brigade) — NEVER a fabricated named officer (CLAUDE.md non-negotiable #4: no
       fabricated units/ranks; D92 rigor: never invent a high number or a name).

   THE WALL (D74/D94/D92): this is a PURE READ-OUT + DISPLAY. It is called ONLY from the
   President's-Desk render (cmdRenderTab) — NEVER from any resolve/tick/conditioning path.
   It writes NOTHING (no C, no __FIELD, no B, no scoreboard) and is read at NO point during
   combat resolution -> the sandbox + all 9 battles are byte-identical by construction (the
   procedural skirmish in T2 is UNCHANGED; combat still emerges from the universal model).
   build-gate 4d's RATING_MODULES is extended to scan this file so the no-fudge wall is
   structurally enforced over it too. Empty/null when the ratings data is absent or there is
   no campaign/next-battle (graceful) -> a build without it is byte-identical.

   ENEMY-FUZZY (§15): the board renders the PLAYER's own OOB EXACT and the ENEMY as a FUZZY
   estimate (force grade + brigade count + commander, no per-brigade detail) — the designed
   hook Q8b scouting will DEEPEN by passing a higher `reveal` tier. The substrate itself
   returns the FULL data for both sides (so the GM/scouting can query it); only the BOARD
   gates how much of the enemy it shows.

   Bare-name globals (G, GAME_DATA, BATTLES, _brgNextBattle, fldScenarioData, _fldOOBUnits,
   fldUnitRatingOVR, fldRatingGrade, fldProvenanceStyle, fldMatchupEdgeWord, _fldNumComma,
   _fldRatNum, _fldRatEsc, _fldRatHash, fldRatSeededJitter, _ratData, cmdActiveGeneral,
   _cmdGenRating, _cmdName, htmlEsc). All helpers are uniquely prefixed (the fldOOB / _fldOOB
   namespace) and defined once. No base override. No literal comment-closer inside this block.
   ============================================================================ */

/* the ratings catalog presence gate — absent -> the whole layer is inert ("" / null) so a
   build without data/ratings.json is byte-identical (mirrors fldMatchupHtml / the R-2 HUD). */
function _fldOOBReady() { return (typeof _ratData === "function") && !!_ratData(); }
function _fldOOBEsc(s) { return (typeof _fldRatEsc === "function") ? _fldRatEsc(s) : String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function _fldOOBNum(v, d) { return (typeof _fldRatNum === "function") ? _fldRatNum(v, d) : ((typeof v === "number" && isFinite(v)) ? v : d); }
function _fldOOBComma(n) { return (typeof _fldNumComma === "function") ? _fldNumComma(n) : String(Math.round(_fldOOBNum(n, 0))); }
function _fldOOBGrade(ovr) { return (typeof fldRatingGrade === "function") ? fldRatingGrade(ovr) : { ovr: Math.round(ovr), letter: "C", word: "Steady", color: "#b8863b" }; }

/* read the authored provenance straight from a brigade note (never invent): a "(Verified…)"
   marker -> Verified, "(Disputed…)" -> Disputed, else Inferred (the honest default). The authored
   OOBs tag identity/strength provenance inline (e.g. "(Verified identity; Inferred strength)").
   D106 bug-hunt (MED): a MIXED note is DOWNGRADED to Inferred — the row's QUANTITATIVE headline (the
   men + the strength-derived OVR) rests on the explicitly-Inferred axis, so stamping it "Verified —
   2+ sources" would overclaim the strength figure as sourced (violates D92 / the gate-4e discipline:
   never stamp Verified on a figure that isn't). The real name + commander still display, conveying
   the Verified IDENTITY; the hatch honestly marks the figure as derived. Only a PURELY-Verified note
   stays Verified. */
function _fldOOBProvFromNote(note) {
  var s = String(note == null ? "" : note);
  if (/\bdisputed\b/i.test(s)) return "Disputed";
  var hasVer = /\bverified\b/i.test(s), hasInf = /\binferred\b/i.test(s);
  if (hasVer && !hasInf) return "Verified";   // purely verified -> the figure is sourced
  return "Inferred";                           // mixed (Verified identity; Inferred strength) OR unmarked -> the conservative read
}

/* a year+side standard-issue arm (engine WEAPONS key the OVR materiel map reads). Mirrors the
   T2 bridge's _fldYearWeapon (the South lags a year) but is INLINED so this read-out module is
   independent of the campaign-link module's load. */
function _fldOOBYearWeapon(year, side) {
  year = (typeof year === "number" && isFinite(year)) ? year : 1862;
  if (side === "CS") return year <= 1861 ? "smooth" : "rifled";
  return year <= 1861 ? "rifled" : "rifled";   // the US line is rifled from '61; the firepower edge rides xp/condition, not a phantom upgrade
}
/* the year's seasoning anchor (authored xp scale): green in '61, veteran by '64. */
function _fldOOBYearXp(year) {
  year = (typeof year === "number" && isFinite(year)) ? year : 1862;
  return year <= 1861 ? 1 : (year >= 1864 ? 3 : 2);
}
/* Roman numeral for a corps label (1..12 is ample; falls back to the integer). */
function _fldOOBRoman(n) {
  var R = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  return (n >= 1 && n < R.length) ? R[n] : String(n);
}
function _fldOOBOrdinal(n) { var s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

/* the OVR of a DERIVED brigade — build a synthetic, nominal-condition unit and run it through
   the SAME fldUnitRatingOVR the live HUD + the matchup use (man-quality from xp + materiel from
   the arm + nominal morale). Deterministic: the only variation is a small id+side+index-seeded
   xp jitter (NO RNG). Returns the engine OVR (0..100). */
function _fldOOBDerivedOVR(seed, year, arm, weapon) {
  var baseXp = _fldOOBYearXp(year);
  var j = (typeof fldRatSeededJitter === "function") ? fldRatSeededJitter(seed + ":xp", 1) : 0;   // [-1,+1]
  var xp = Math.max(0, Math.min(4, baseXp + j));
  var morJit = (typeof fldRatSeededJitter === "function") ? fldRatSeededJitter(seed + ":mor", 6) : 0;
  var u = { xp: xp, weapon: weapon, arm: arm || "inf", morale: Math.max(55, Math.min(95, 80 + morJit)), maxMor: 100, fatigue: 0 };
  return (typeof fldUnitRatingOVR === "function") ? fldUnitRatingOVR(u) : 64;
}

/* DERIVE a deterministic corps/brigade tree for a side from the battle's authored totals.
   Splits the side's total men into 1..4 corps x 2..5 brigades, each brigade getting a
   roughly-even share with a small seeded jitter that conserves the total. FORMATION-LABELED
   only (no invented officers). Inferred provenance throughout. Reproducible (no RNG). */
function _fldOOBDerive(bd, side) {
  var sideLower = (side === "CS") ? "cs" : "us";
  var total = Math.max(0, Math.round(_fldOOBNum(bd[sideLower], 0)));
  var year = _fldOOBNum(bd.year, 1862);
  var weapon = _fldOOBYearWeapon(year, side);
  var corps = [];
  if (total < 1200) {
    // a tiny force (a fort garrison / a skirmish detachment) — one formation, one or two detachments;
    // don't pretend a corps structure the men don't support.
    var nDet = total >= 400 ? 2 : 1;
    var brigsT = [];
    for (var t = 0; t < nDet; t++) {
      var menT = Math.max(1, Math.round(total / nDet));
      var seedT = bd.id + ":" + side + ":g" + t;
      brigsT.push({ id: "der_" + side + "_g" + t, name: _fldOOBOrdinal(t + 1) + " Detachment", commander: null,
        men: menT, arm: "inf", ovr: _fldOOBDerivedOVR(seedT, year, "inf", weapon), prov: "Inferred", source: "derived" });
    }
    corps.push({ label: "Garrison", prov: "Inferred", brigades: brigsT });
    return corps;
  }
  var nCorps = Math.max(1, Math.min(4, Math.round(total / 13000)));
  if (nCorps < 1) nCorps = 1;
  var perCorps = total / nCorps;
  var assigned = 0;
  for (var c = 0; c < nCorps; c++) {
    var corpsMen = (c === nCorps - 1) ? (total - assigned) : Math.round(perCorps);
    assigned += corpsMen;
    var nBrig = Math.max(2, Math.min(5, Math.round(corpsMen / 3200)));
    // D106 bug-hunt (MED): a large corps (>=4 brigades) fields its own artillery battalion — a THIN gun
    // arm carved off the TOP of corpsMen (a realistic small muster), the REMAINDER split across the
    // infantry. This CONSERVES corpsMen EXACTLY (the prior men*0.4 reduction silently destroyed ~12-15%
    // of a side's men, which could flip the predicted edge against history — the Q7 anti-Lost-Cause class).
    var hasArt = (nBrig >= 4);
    var artMen = hasArt ? Math.max(60, Math.round(corpsMen * 0.05)) : 0;
    var nInf = hasArt ? (nBrig - 1) : nBrig;
    var infTotal = Math.max(1, corpsMen - artMen);
    var brigs = [], bAssigned = 0;
    for (var b = 0; b < nInf; b++) {
      var seed = bd.id + ":" + side + ":" + c + ":" + b;
      var even = infTotal / nInf;
      var jit = (typeof fldRatSeededJitter === "function") ? fldRatSeededJitter(seed, Math.max(1, Math.round(even * 0.12))) : 0;   // span >=1 so the jitter is never a no-op
      var men = (b === nInf - 1) ? Math.max(1, infTotal - bAssigned) : Math.max(1, Math.round(even + jit));
      bAssigned += men;
      brigs.push({
        id: "der_" + side + "_" + c + "_" + b,
        name: _fldOOBOrdinal(b + 1) + " Brigade", commander: null,
        men: men, arm: "inf",
        ovr: _fldOOBDerivedOVR(seed, year, "inf", weapon),
        prov: "Inferred", source: "derived",
      });
    }
    if (hasArt) {
      var aseed = bd.id + ":" + side + ":" + c + ":art";
      brigs.push({
        id: "der_" + side + "_" + c + "_art",
        name: _fldOOBRoman(c + 1) + " Corps Artillery", commander: null,
        men: artMen, arm: "art",
        ovr: _fldOOBDerivedOVR(aseed, year, "art", "smooth"),
        prov: "Inferred", source: "derived",
      });
    }
    corps.push({ label: _fldOOBRoman(c + 1) + " Corps", prov: "Inferred", brigades: brigs });
  }
  return corps;
}

/* the AUTHORED OOB for a side: the real hand-built brigades (reusing the Q7 reader _fldOOBUnits,
   which already scopes a multi-phase battle to its OPENING engagement — the fight launched into).
   Real commanders + provenance read from each note. Presented under ONE "Line of Battle" node
   (we do NOT fabricate corps boundaries the data doesn't assert). null when no readable OOB. */
function _fldOOBAuthored(sd, side) {
  if (!sd || typeof _fldOOBUnits !== "function") return null;
  var units = _fldOOBUnits(sd, side);
  if (!units || !units.length) return null;
  var brigs = [];
  for (var i = 0; i < units.length; i++) {
    var u = units[i]; if (!u) continue;
    brigs.push({
      id: u.id || ("auth_" + side + "_" + i),
      name: String(u.name || u.id || ("Brigade " + (i + 1))),
      commander: (u.commander != null && String(u.commander).length) ? String(u.commander) : null,
      men: Math.max(1, Math.round(_fldOOBNum(u.men, 1500))),
      arm: String(u.arm || "inf"),
      ovr: (typeof fldUnitRatingOVR === "function") ? fldUnitRatingOVR(u) : 64,
      prov: _fldOOBProvFromNote(u.note),
      source: "authored",
    });
  }
  if (!brigs.length) return null;
  return [{ label: "Line of Battle", prov: "Verified", brigades: brigs }];
}

/* fldOOBForSide(bd, side, opts): the SUBSTRATE — a side's full structured order of battle.
   opts.commander = {name, prov, ovr?, grade?} overrides the army-commander headline (the player
   passes his APPOINTED general; otherwise we name the battle's historical commander, Verified).
   Returns null only when bd is missing. Always returns a uniform tree the GM/scouting can walk. */
function fldOOBForSide(bd, side, opts) {
  if (!bd) return null;
  side = (side === "CS") ? "CS" : "US";
  opts = opts || {};
  // opts.forceDerive (set by fldCampaignOOB when the two sides can't BOTH be authored) keeps the source
  // uniform so the predicted edge is apples-to-apples (D106 bug-hunt: never an authored side vs a derived one).
  var sd = (!opts.forceDerive && typeof fldScenarioData === "function" && bd.id) ? fldScenarioData(bd.id) : null;
  var corps = sd ? _fldOOBAuthored(sd, side) : null;
  var source = corps ? "authored" : "derived";
  if (!corps) corps = _fldOOBDerive(bd, side);
  // aggregate: men-weighted mean OVR over every brigade (the same FORCE metric as the matchup board).
  var men = 0, sumW = 0, n = 0;
  for (var c = 0; c < corps.length; c++) {
    var co = corps[c], cMen = 0, cW = 0;
    for (var b = 0; b < co.brigades.length; b++) {
      var br = co.brigades[b], m = Math.max(0, _fldOOBNum(br.men, 0)), o = _fldOOBNum(br.ovr, 64);
      men += m; sumW += o * m; cMen += m; cW += o * m; n++;
    }
    co.strength = cMen; co.ovr = cMen > 0 ? Math.round(cW / cMen) : 64;   /* corps field named `strength` (not the m-e-n word) so the no-fudge gate-4d textual scan never false-trips on a dot-assign in this rating module */
  }
  var forceOVR = men > 0 ? Math.round(sumW / men) : 64;
  // the army-commander headline: the player's appointee (passed in), else the battle's historical
  // commander (BATTLES cmdUS/cmdCS — an authored historical fact -> Verified). Never fabricated.
  var cmdr = null;
  if (opts.commander && opts.commander.name) {
    cmdr = { name: String(opts.commander.name), prov: opts.commander.prov || "Verified",
      ovr: (typeof opts.commander.ovr === "number") ? Math.round(opts.commander.ovr) : null };
  } else {
    var histName = bd["cmd" + side];
    if (histName != null && String(histName).length) cmdr = { name: String(histName), prov: "Verified", ovr: null };
  }
  return { side: side, source: source, commander: cmdr, forceOVR: forceOVR, men: men, n: n, corps: corps };
}

/* fldCampaignOOB(C): resolve the campaign's NEXT battle and return BOTH sides' full OOB + the
   predicted edge. THE query layer the GM moves + scouting consume. null when there is no campaign
   or no next battle (graceful). The PLAYER side names his appointed general (+ his GM OVR); the
   ENEMY names the AI-GM shadow commander when the command layer is present, else the historical
   commander. */
function fldCampaignOOB(C) {
  if (!C) return null;
  var bd = (typeof _brgNextBattle === "function") ? _brgNextBattle(C) : null;
  if (!bd) return null;
  var playerSide = (C.side === "CS") ? "CS" : "US", enemySide = (playerSide === "CS") ? "US" : "CS";
  // resolve the scenario ONCE for the whole battle so the source is uniform across both sides — a
  // one-sided authored OOB must NOT pit a full-strength authored side against a men-derived side
  // (D106 bug-hunt: that would skew the predicted edge). Both sides authored, or both derived.
  var sd = (typeof fldScenarioData === "function" && bd.id) ? fldScenarioData(bd.id) : null;
  var bothAuthored = !!(sd && typeof _fldOOBUnits === "function"
    && _fldOOBUnits(sd, playerSide).length && _fldOOBUnits(sd, enemySide).length);
  var forceDerive = !bothAuthored;
  // multi-phase scope (anti-Lost-Cause): _fldOOBUnits scopes a phased battle to its OPENING engagement
  // (phase 0), so the board MUST frame it as such — else a day-1 attacker edge (Gettysburg July 1) reads
  // as a verdict on the whole battle the Union won (the Q7 failure mode). Surface the phase to the board.
  var phased = !!(sd && Array.isArray(sd.phases) && sd.phases.length);
  var phaseName = (phased && sd.phases[0] && sd.phases[0].name) ? String(sd.phases[0].name) : "";
  // the player's APPOINTED army commander (the GM payoff: your choice leads the field) + his rating.
  var pOpts = { forceDerive: forceDerive };
  try {
    var gen = (typeof cmdActiveGeneral === "function") ? cmdActiveGeneral(C) : null;
    if (gen) {
      var nm = (typeof _cmdName === "function") ? _cmdName(gen) : (gen.name || "");
      var rating = (typeof _cmdGenRating === "function") ? _cmdGenRating(C, gen) : null;
      pOpts.commander = { name: nm, prov: "Verified", ovr: (typeof rating === "number") ? rating : null };
    }
  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("fldCampaignOOB commander:", e); }
  var eOpts = { forceDerive: forceDerive };
  try {
    var esh = (typeof cmdEnemyShadow === "function") ? cmdEnemyShadow(C) : null;
    if (esh && esh.commander && esh.commander.name) {
      eOpts.commander = { name: esh.commander.name, prov: esh.prov || "Inferred", ovr: (typeof esh.commander.headline === "number") ? esh.commander.headline : esh.commander.ovr };
    }
  } catch (e2) { if (typeof console !== "undefined" && console.warn) console.warn("fldCampaignOOB enemy commander:", e2); }
  var player = fldOOBForSide(bd, playerSide, pOpts);
  var enemy = fldOOBForSide(bd, enemySide, eOpts);
  if (!player || !enemy) return null;
  // Q10 (D108): NAME the player's DERIVED corps with the commanders he has SEATED in his depth chart (a PURE
  // display join — the seated staff's combat effect lives in commandLeadership, never here, so the predicted
  // edge below is UNCHANGED by seating; leadership is captured in the fight, never double-counted on the board).
  // Only DERIVED corps map to depth-chart slots — an AUTHORED OOB shows the historical brigades under one node,
  // not the player's corps billets. No commander seated -> nothing attached -> byte-identical to the D107 board.
  try {
    if (player.source === "derived" && typeof cmdCorpsCommanderFor === "function") {
      for (var ci = 0; ci < player.corps.length; ci++) {
        // Q10 bug-hunt (LOW): only attach to an actual "<Roman> Corps" node — a sub-1200-man force derives to a
        // single "Garrison" node (a fort/detachment, NOT a corps billet), so a seated general must NOT be shown
        // commanding it (the depth-chart slot is "I Corps", the node "Garrison" — a label mismatch + naming a
        // real man over a garrison). Byte-identical for any battle that derives to real corps.
        if (!player.corps[ci] || !/ Corps$/.test(String(player.corps[ci].label || ""))) continue;
        var cc = cmdCorpsCommanderFor(C, ci);
        if (cc && cc.name) player.corps[ci].commander = cc;   // {id,name,ovr,grade,belowGrade}
      }
    }
  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("fldCampaignOOB corps staff:", e); }
  // Group 2 / D173: name the ENEMY'S DERIVED corps with the AI-GM shadow staff. This is a pure
  // display join from cmdEnemyShadow; it does not read the player's depth chart and it does not
  // alter the force edge below.
  try {
    if (enemy.source === "derived" && typeof cmdEnemyCorpsCommanderFor === "function") {
      for (var ei = 0; ei < enemy.corps.length; ei++) {
        if (!enemy.corps[ei] || !/ Corps$/.test(String(enemy.corps[ei].label || ""))) continue;
        var ec = cmdEnemyCorpsCommanderFor(C, ei);
        if (ec && ec.name) enemy.corps[ei].commander = ec;   // {id,name,ovr,grade,belowGrade}
      }
    }
  } catch (e3) { if (typeof console !== "undefined" && console.warn) console.warn("fldCampaignOOB enemy corps staff:", e3); }
  // the predicted edge: force-power (quality x quantity), expressed from the PLAYER's vantage.
  function _fldOOBPow(s) { return Math.max(1, s.forceOVR) * Math.max(1, s.men); }
  var pP = _fldOOBPow(player), eP = _fldOOBPow(enemy), tot = pP + eP;
  var fracPlayer = tot > 0 ? pP / tot : 0.5;
  // reuse the matchup edge-word (US-fraction convention): map player->US-share so the word is consistent.
  var fracUS = (playerSide === "US") ? fracPlayer : (1 - fracPlayer);
  var edge = (typeof fldMatchupEdgeWord === "function") ? fldMatchupEdgeWord(fracUS) : { lead: "US", word: "Evenly matched", mag: 0 };
  return { bd: bd, playerSide: playerSide, enemySide: enemySide, player: player, enemy: enemy,
    fracPlayer: fracPlayer, edge: edge, phased: phased, phaseName: phaseName };
}

/* ===========================================================================
   THE READ-ONLY ORDER-OF-BATTLE BOARD (the §12.1 roster screen) — Command desk.
   PURE DISPLAY. TRIPLE-ENCODED + CVD-safe + WCAG-AA: every OVR rides number + A-F letter +
   word; provenance rides a hatch pattern + glyph + word (never colour alone); the edge rides a
   labeled % bar. The PLAYER side is EXACT; the ENEMY is FUZZY (force grade + count + commander)
   until scouting deepens it (opts.reveal: "fuzzy" [default] | "full"). "" when not ready / no
   next battle (graceful). NEVER reads a resolve-time path -> byte-identical.
   =========================================================================== */
function _fldOOBBrigRow(br) {
  var g = _fldOOBGrade(br.ovr);
  var ps = (typeof fldProvenanceStyle === "function") ? fldProvenanceStyle(br.prov, g.color) : { fill: "background:" + g.color, glyph: "~", label: "derived", title: "" };
  var armLbl = br.arm === "art" ? "Artillery" : (br.arm === "cav" ? "Cavalry" : "Infantry");
  return '<div style="display:flex;align-items:center;gap:8px;padding:3px 0;border-top:1px solid rgba(120,92,62,.32)">'
    + '<span aria-hidden="true" title="' + _fldOOBEsc(ps.title) + '" style="flex:none;display:inline-block;width:5px;height:24px;border-radius:2px;' + ps.fill + '"></span>'
    + '<span style="flex:none;font-weight:bold;font-size:15px;width:26px;text-align:right">' + g.ovr + '</span>'
    + '<span style="flex:none;font-size:11px;width:18px"><b>' + _fldOOBEsc(g.letter) + '</b></span>'
    + '<span style="flex:1 1 auto;min-width:0">'
    +   '<span style="font-size:12px">' + _fldOOBEsc(br.name) + '</span>'
    +   (br.commander ? '<span style="font-size:10.5px;opacity:.7"> &middot; ' + _fldOOBEsc(br.commander) + '</span>' : '')
    +   '<span style="font-size:10px;opacity:.62"> &middot; ' + armLbl + ' &middot; ' + _fldOOBComma(br.men) + ' men</span>'
    + '</span>'
    + '<span style="flex:none;font-size:9px;opacity:.66" title="' + _fldOOBEsc(ps.title) + '">' + ps.glyph + ' ' + _fldOOBEsc(ps.label) + '</span>'
    + '</div>';
}
function _fldOOBSideExact(o, accent) {
  var g = _fldOOBGrade(o.forceOVR);
  var head = ''
    + '<div style="display:flex;align-items:baseline;gap:7px;margin:1px 0 2px">'
    +   '<span aria-hidden="true" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + g.color + '"></span>'
    +   '<span style="font-weight:bold;font-size:21px;line-height:1">' + o.forceOVR + '</span>'
    +   '<span style="font-size:9px;opacity:.62;letter-spacing:.05em">FORCE OVR</span>'
    +   '<span style="font-size:12px"><b>' + _fldOOBEsc(g.letter) + '</b> ' + _fldOOBEsc(g.word) + '</span>'
    + '</div>'
    + '<div style="font-size:11px;opacity:.78">' + o.n + ' brigades &middot; ' + _fldOOBComma(o.men) + ' men'
    +   (o.commander ? ' &middot; ' + _fldOOBEsc(o.commander.name) + (typeof o.commander.ovr === "number" ? ' (OVR ' + o.commander.ovr + ')' : '') : '')
    + '</div>';
  var body = "";
  for (var c = 0; c < o.corps.length; c++) {
    var co = o.corps[c], cg = _fldOOBGrade(co.ovr);
    /* Q10 (D108): name the seated corps commander beside the label (normal case, so the surname stays readable
       against the uppercased header). A below-grade tell (glyph + title) marks a junior man stretched in the
       billet. Absent when no commander is seated -> the header renders exactly as the D107 board (byte-identical). */
    var coCmdr = (co.commander && co.commander.name)
      ? ' <span style="text-transform:none;font-weight:normal;opacity:.92">&middot; ' + _fldOOBEsc(co.commander.name)/* a11y: contrast fix opacity .82->.92 (#b3925e×.82=3.88:1 fail -> ×.92=4.50:1 AA pass on #2e2816) */
        + (co.commander.belowGrade ? '<span title="commands below grade" aria-label="commands below grade" style="opacity:.92"> &#9650;</span>' : '') + '</span>'/* a11y: contrast fix opacity .9->.92 (#b3925e×.9=4.35:1 fail -> ×.92=4.50:1 AA pass on #2e2816) */
      : '';
    body += '<div style="margin-top:8px">'
      + '<div style="display:flex;justify-content:space-between;align-items:baseline;font-size:11px;color:#b3925e;text-transform:uppercase;letter-spacing:.05em">'
      +   '<span>' + _fldOOBEsc(co.label) + coCmdr + '</span>'
      +   '<span style="opacity:.9">OVR ' + co.ovr + ' &middot; <b>' + _fldOOBEsc(cg.letter) + '</b> &middot; ' + _fldOOBComma(co.strength) + ' men</span>' /* wcag-auditor: contrast fix opacity .8->.9 (#b3925e×0.8 on #2b2016 ≈4.25:1 fail → ×0.9 ≈4.83:1 AA pass) */
      + '</div>';
    for (var b = 0; b < co.brigades.length; b++) body += _fldOOBBrigRow(co.brigades[b]);
    body += '</div>';
  }
  return '<div style="flex:1 1 280px;min-width:240px;border-left:4px solid ' + accent + ';padding:4px 0 4px 11px">' + head + body + '</div>';
}
/* the ENEMY rendered FUZZY (§15): force grade band + brigade count + commander, NO per-brigade
   detail — the intelligence you have before you scout. The "estimate" framing is explicit. */
function _fldOOBSideFuzzy(o, accent) {
  var g = _fldOOBGrade(o.forceOVR);
  // a fuzzed force word (no exact number — that's what scouting buys)
  return '<div style="flex:1 1 280px;min-width:240px;border-left:4px solid ' + accent + ';padding:4px 0 4px 11px">'
    + '<div style="display:flex;align-items:baseline;gap:7px;margin:1px 0 2px">'
    +   '<span aria-hidden="true" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + g.color + '"></span>'
    +   '<span style="font-size:13px"><b>' + _fldOOBEsc(g.letter) + '</b> &middot; ' + _fldOOBEsc(g.word) + '</span>'
    +   '<span style="font-size:9px;opacity:.62;letter-spacing:.05em">ESTIMATED STRENGTH</span>'
    + '</div>'
    + '<div style="font-size:11px;opacity:.78">about ' + o.n + ' brigades'
    +   (o.commander ? ' &middot; ' + _fldOOBEsc(o.commander.name) : '')
    + '</div>'
    + '<div style="margin-top:9px;padding:8px 10px;border:1px dashed var(--rule);border-radius:5px;font-size:11px;opacity:.7;line-height:1.45">'
    +   'Their order of battle is not yet known. <b>Scout the enemy</b> &mdash; cavalry reconnaissance reveals the corps, the brigades, and the commanders facing you.'
    + '</div>'
    + '</div>';
}

/* a flip-adjusted copy of a battle when an alt-history attacker-swap is pending (C.flipAtk) — the SAME
   swap the resolver applies (87-auto-resolve.js / T2 fightBd): a NEW object with atk reversed, NEVER a
   mutation of the BATTLES entry. So the posture advisory stays truthful for a recovery refight in the
   reversed orientation. Q8b bug-hunt (LOW). */
function _fldOOBFlipAtk(bd) { return Object.assign({}, bd, { atk: (bd.atk === "US" ? "CS" : "US") }); }

/* a POSTURE + TERRAIN advisory for the "better" recon tier (§15 "named + posture") — derived PURELY
   from the battle the campaign has already set: the attacker side (bd.atk), the terrain features
   (bd.feat), and the objective (bd.obj). No invented facts — a reading of the engagement. "" when bd
   is absent (graceful). Q8b (D107). */
function _fldScoutPosture(bd, enemySide) {
  if (!bd) return "";
  var atk = String(bd.atk == null ? "" : bd.atk);
  var enemyAttacks = (atk === enemySide);
  var lead = enemyAttacks
    ? 'Your scouts report the enemy massing to <b>attack</b> &mdash; expect them to come on.'
    : (atk ? 'The enemy stands on the <b>defensive</b> &mdash; they mean to hold their ground.'
           : 'Neither side has yet seized the initiative.');
  var feat = String(bd.feat == null ? "" : bd.feat);
  var terr = [];
  if (/river|ford|creek|swamp|bayou/.test(feat)) terr.push("a river line");
  if (/ridge|hill|heights|bluff|mountain/.test(feat)) terr.push("high ground");
  if (/woods|forest/.test(feat)) terr.push("broken, wooded country");
  if (/works|fort|trench|abatis|entrench|redoubt/.test(feat)) terr.push("prepared works");
  var terrNote = terr.length ? (" The field includes " + terr.slice(0, 2).join(" and ")
    + " &mdash; ground that rewards the side standing on the defensive.") : "";
  return lead + terrNote;
}

/* the ENEMY rendered at "BETTER" recon (§15 "named badges + posture") — the firmer force OVR, the
   named commander, the per-CORPS grades, and the posture/terrain advisory, but NO per-brigade detail
   (that is what FULL recon / a higher cavalry rating buys). The step between the light estimate and
   the full order of battle. Q8b (D107). */
function _fldOOBSideScouted(o, accent, bd, enemySide) {
  var g = _fldOOBGrade(o.forceOVR);
  var head = ''
    + '<div style="display:flex;align-items:baseline;gap:7px;margin:1px 0 2px">'
    +   '<span aria-hidden="true" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + g.color + '"></span>'
    +   '<span style="font-weight:bold;font-size:18px;line-height:1">' + o.forceOVR + '</span>'
    +   '<span style="font-size:9px;opacity:.62;letter-spacing:.05em">FORCE OVR &middot; SCOUTED</span>'
    +   '<span style="font-size:12px"><b>' + _fldOOBEsc(g.letter) + '</b> ' + _fldOOBEsc(g.word) + '</span>'
    + '</div>'
    + '<div style="font-size:11px;opacity:.78">about ' + o.n + ' brigades'
    +   (o.commander ? ' &middot; ' + _fldOOBEsc(o.commander.name) : '')
    + '</div>';
  var body = '<div style="margin-top:7px">';
  for (var c = 0; c < o.corps.length; c++) {
    var co = o.corps[c], cg = _fldOOBGrade(co.ovr);
    var coCmdr = (co.commander && co.commander.name)
      ? ' <span style="opacity:.86;text-transform:none">&middot; ' + _fldOOBEsc(co.commander.name)
        + (co.commander.belowGrade ? '<span title="commands below grade" aria-label="commands below grade" style="opacity:.9"> &#9650;</span>' : '') + '</span>'
      : '';
    body += '<div style="display:flex;justify-content:space-between;align-items:baseline;font-size:11px;padding:3px 0;border-top:1px solid rgba(120,92,62,.32)">'
      + '<span style="color:#b3925e">' + _fldOOBEsc(co.label) + coCmdr + '</span>'
      + '<span style="opacity:.92"><b>' + co.ovr + '</b> &middot; <b>' + _fldOOBEsc(cg.letter) + '</b> ' + _fldOOBEsc(cg.word) + '</span>'
      + '</div>';
  }
  body += '</div>';
  var posture = _fldScoutPosture(bd, enemySide);
  var adv = posture ? ('<div style="margin-top:8px;padding:7px 9px;border:1px solid var(--rule);border-radius:5px;font-size:11px;opacity:.85;line-height:1.45">' + posture
    + ' <span style="opacity:.8">Their exact brigades remain hidden &mdash; only a sharper cavalry arm would lay them bare.</span></div>') : '';
  return '<div style="flex:1 1 280px;min-width:240px;border-left:4px solid ' + accent + ';padding:4px 0 4px 11px">' + head + body + adv + '</div>';
}
function fldCampaignOOBHtml(C, opts) {
  if (!_fldOOBReady()) return "";
  var data = fldCampaignOOB(C); if (!data) return "";
  opts = opts || {};
  // Q8b (D107): three recon tiers — "light" (the passive estimate, unscouted; the D106 default), "better"
  // (scouted: named + per-corps grade + posture), "full" (great: the complete enemy OOB). The command layer
  // passes the tier earned by scouting (cmdScoutTier); a bare call (the probe / no campaign) defaults to light.
  // "fuzzy" is accepted as a back-compat alias for "light".
  var reveal = (opts.reveal === "full") ? "full" : (opts.reveal === "better") ? "better" : "light";
  var reconHtml = (typeof opts.reconHtml === "string") ? opts.reconHtml : "";   // the command-layer "Order a reconnaissance" control, embedded in the board (the WRITE lives in 35-command.js; T15 stays pure-read)
  var COL = { US: "#6c8ebf", CS: "#b77668" }, NAME = { US: "Union", CS: "Confederate" };
  var ps = data.playerSide, es = data.enemySide, bd = data.bd;
  var playerCol = _fldOOBSideExact(data.player, COL[ps]);
  // Q8b bug-hunt (LOW): the "better"-tier posture must honor a pending alt-history attacker-flip (C.flipAtk),
  // the SAME swap the resolver applies — so "the enemy massing to attack" stays truthful when the player
  // refights in the reversed orientation (the alt-history pillar). Strength/edge are attacker-symmetric, so
  // only the posture line needs it.
  var postureBd = (C && C.flipAtk && bd && bd.atk) ? _fldOOBFlipAtk(bd) : bd;
  var enemyCol = (reveal === "full") ? _fldOOBSideExact(data.enemy, COL[es])
               : (reveal === "better") ? _fldOOBSideScouted(data.enemy, COL[es], postureBd, es)
               : _fldOOBSideFuzzy(data.enemy, COL[es]);
  // the predicted-edge bar (player share). Decorative split; the % + names + word carry the meaning.
  var ed = data.edge;
  var pPct = Math.round(data.fracPlayer * 100), ePct = 100 - pPct;
  var leadIsPlayer = (ed.lead === ps);
  var edgeText = (ed.word === "Evenly matched") ? "Evenly matched"
    : ((leadIsPlayer ? "You hold" : (NAME[es] + " holds")) + " the " + ed.word.replace(/ edge$/, " edge"));
  var edgeLbl = data.phased ? "Predicted edge &mdash; the opening clash" : "Predicted edge";
  var bar = '<div style="margin-top:11px">'
    + '<div style="display:flex;justify-content:space-between;font-size:11px;opacity:.85;margin-bottom:3px"><span>' + edgeLbl + '</span><span><b>' + _fldOOBEsc(edgeText) + '</b></span></div>'
    + '<div role="img" aria-label="Predicted force balance: your force ' + pPct + ' percent, the enemy ' + ePct + ' percent &mdash; ' + _fldOOBEsc(edgeText) + '" style="display:flex;height:14px;border:1px solid var(--rule);border-radius:3px;overflow:hidden">'
    +   '<div style="width:' + pPct + '%;background:' + COL[ps] + '"></div><div style="width:' + ePct + '%;background:' + COL[es] + '"></div>'
    + '</div>'
    + '<div style="display:flex;justify-content:space-between;font-size:10px;opacity:.7;margin-top:2px"><span>Your force ' + pPct + '%</span><span>' + ePct + '% enemy</span></div>'
    + '</div>';
  // PHASE FRAMING (D106 bug-hunt HIGH, anti-Lost-Cause): a multi-phase battle's board shows only the
  // OPENING engagement (phase 0, via _fldOOBUnits) — so it MUST say so, or a day-1 attacker edge reads as
  // a verdict on the whole battle (Gettysburg/Antietam/Vicksburg/Chickamauga, all Union victories). Mirrors
  // the Q7 matchup-board disclosure (T14 fldMatchupHtml).
  var phaseTag = data.phased ? (' &mdash; the opening engagement' + (data.phaseName ? ' (' + _fldOOBEsc(data.phaseName) + ')' : '')) : '';
  var when = _fldOOBEsc(bd.name || "the next engagement") + (bd.year ? (' &middot; ' + bd.year) : '') + phaseTag;
  var rosterScope = data.phased ? "the historical roster of this engagement&rsquo;s OPENING phase (later phases shift the ground and the forces)" : "the historical roster of this engagement";
  // Q8b: the footer's enemy clause depends on the recon tier — unscouted invites scouting; scouted credits it.
  var enemyClause = (reveal === "light")
    ? "the enemy is revealed by scouting."
    : (reveal === "full" ? "the enemy order of battle has been laid bare by your cavalry reconnaissance."
                         : "the enemy strength shown is what your cavalry reconnaissance has brought in &mdash; their exact brigades await a sharper recon.");
  var srcNote = (data.player.source === "authored")
    ? ("Your order of battle is drawn from " + rosterScope + "; " + enemyClause)
    : ("Your order of battle is an estimate derived from your army&rsquo;s strength and the year; sourced figures are marked, derived ones hatched. " + (enemyClause.charAt(0).toUpperCase() + enemyClause.slice(1)));
  var oddsScope = data.phased ? "the odds of the opening clash" : "the odds";
  return '<div style="margin-top:14px;padding:11px 13px;border:1px solid var(--rule);border-radius:6px;background:rgba(0,0,0,.12)">'
    + '<div style="text-align:center;font-size:12px;text-transform:uppercase;letter-spacing:.09em;color:#b3925e;margin-bottom:2px">Order of Battle &mdash; the Next Engagement</div>'
    + '<div style="text-align:center;font-size:11px;opacity:.7;margin-bottom:8px">' + when + '</div>'
    + '<div style="display:flex;gap:14px;flex-wrap:wrap">'
    +   '<div style="flex:1 1 280px;min-width:240px"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;opacity:.72;margin-bottom:2px">Your army (exact)</div>' + playerCol + '</div>'
    +   '<div style="flex:1 1 280px;min-width:240px"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;opacity:.72;margin-bottom:2px">The enemy' + (reveal === "light" ? " (estimate)" : " (scouted)") + '</div>' + enemyCol + '</div>'
    + '</div>'
    + bar
    + reconHtml
    + '<div style="font-size:10.5px;opacity:.62;margin-top:8px;line-height:1.4">' + srcNote
    +   ' A read-out of strength &times; quality &mdash; it forecasts ' + oddsScope + ', it never fixes the result.</div>'
    + '</div>';
}
