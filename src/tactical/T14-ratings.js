/* ============================================================================
   src/tactical/T14-ratings.js  —  THE RATING SYSTEM (the OVR / "Madden layer")

   Aaron-directed (D94). A unified 1-100 OVR + badges over three entity tiers
   (individual / officer / brigade), the substrate for the D93 "Soldier's Story".
   Design law: RATING-SYSTEM-DESIGN.md.

   THE KEYSTONE (honors D74/D92): the OVR is a READ-OUT, not a force. A documented
   persona is DERIVED into true attributes; those attributes SEED the levers the
   engine already reads (xp, officer quality -> cmdBonus, weapon, radius, fate,
   bounded sev). No rating is ever read when a casualty / melee / rout / victory is
   computed. This module hosts the whole system; it ships in vetted increments.

   INCREMENT R-0 (this file's current scope) — THE DATA SPINE, PURE FUNCTIONS ONLY:
     The OVR / grade / derivation math + the badge-def + realism-cap accessors. NONE
     of it is wired into combat (no T0/T3 seam), so every AI-vs-AI baseline resolves
     byte-for-byte as before. Attributes are 0-100, NEUTRAL at 64 (matching
     commandLeadership's anchor); a missing attribute reads 64 -> no-op. The grade
     reuses _cmdLeadWord (one vocabulary) and adds the A+ Legendary band (>=90).

   EXTENSION POINTS (kept here so the system grows in one place):
     - R-1 officer derivation: persona -> gen.skill (feeds _cmdGenRating) +
       quality / radius / fate (feeds fldMakeOfficer). At the FRONT of the existing
       pipe; no downstream edits.
     - R-3 badge engine: fldBadgeFactor(u, lever) (identity when __FIELD.badges
       absent) + the global per-unit per-lever stacking cap (realism-scaled).
     - R-4 X-Factors: u._xfActive scales the already-summed cmdBonus, hard-capped by
       the realism-scaled ceiling (fldRatingRealismCap). DRAMATIC surge feel.
     - Army GM layer (strategic): the depth chart + transfers spend political capital
       (extends cmdAppoint / _cmdReliefCost).
   D94-softcap: the OUTPUT wall is absolute; the INPUT caps soften and scale with the
   B-5 realism slider (Arcade generous / Historian tight) via fldRatingRealismCap.
   ============================================================================ */

var FLDR = {
  ANCHOR: 64,                 // the neutral attribute value (= commandLeadership anchor)
  QMIN: 0.18, QMAX: 0.95      // the officer-quality clamp band (matches fldOfficerSideQuality)
};

function _ratData() { return (typeof gameData === "function") ? gameData("ratings") : null; }

function _fldRatNum(v, dflt) { return (typeof v === "number" && isFinite(v)) ? v : dflt; }

/* HTML-escape for the R-2 read-out UI (defense-in-depth: the grade words/letters are hardcoded
   constants today, so this is byte-identical, but it future-proofs a data-driven gradeBands). */
function _fldRatEsc(s) { return (typeof htmlEsc === "function") ? htmlEsc(s) : String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

/* one persona attribute, defaulting to the neutral anchor (so a missing attr is a no-op). */
function fldAttr(p, key) {
  if (!p) return FLDR.ANCHOR;
  var src = p.persona ? p.persona : p;       // accept a record OR a bare persona object
  return _fldRatNum(src[key], FLDR.ANCHOR);
}

/* ---- The HEADLINE individual OVR (0-100): a transparent weighted mean of the
   combat-relevant attributes. aggression (bidirectional) + the arm sub-skills are
   DELIBERATELY excluded from the headline (D94 anti-Lost-Cause guard) — they flow
   into the dual Attack/Defend tilt + matchups + badges, not the headline number. ---- */
function fldPersonaOVR(p) {
  var d = _ratData();
  var w = (d && d.ovrWeights && d.ovrWeights.individual) ? d.ovrWeights.individual
        : { tactical: 0.20, command: 0.16, resolve: 0.16, discipline: 0.14, marksmanship: 0.10, initiative: 0.08, grit: 0.08, charisma: 0.04, vigor: 0.04 };
  var sum = 0, wsum = 0;
  for (var k in w) { if (!w.hasOwnProperty(k)) continue; sum += fldAttr(p, k) * w[k]; wsum += w[k]; }
  return wsum > 0 ? Math.round(sum / wsum) : FLDR.ANCHOR;
}

/* The persona -> gen.skill projection (the officer seed): the value that, run through
   the EXISTING quality clamp, reproduces a leader's authored quality (calibration). */
function fldOfficerSkillSeed(p) {
  var d = _ratData();
  var w = (d && d.ovrWeights && d.ovrWeights.officerSkillSeed) ? d.ovrWeights.officerSkillSeed
        : { command: 0.45, tactical: 0.35, discipline: 0.20 };
  var sum = 0, wsum = 0;
  for (var k in w) { if (!w.hasOwnProperty(k)) continue; sum += fldAttr(p, k) * w[k]; wsum += w[k]; }
  return wsum > 0 ? (sum / wsum) : FLDR.ANCHOR;
}

/* The derived OFFICER field-quality (0..1), via the EXACT map fldOfficerSideQuality
   uses: clamp((lead-42)/46). This is the calibration target (reproduces authored quality). */
function fldPersonaQuality(p) {
  var seed = fldOfficerSkillSeed(p);
  var clampFn = (typeof fldClamp === "function") ? fldClamp : function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  return clampFn((seed - 42) / 46, FLDR.QMIN, FLDR.QMAX);
}

/* The dual situational OVR (D94 §13): Attack and Defend beside the headline, so
   matchups matter (Thomas A+ defend / C attack). aggression bends Attack; resolve/grit bend Defend. */
function fldDualOVR(p) {
  var d = _ratData();
  var t = (d && d.dualOvrTilt) ? d.dualOvrTilt : { attack: { aggressionWeight: 0.25, initiativeWeight: 0.10 }, defend: { resolveWeight: 0.20, gritWeight: 0.10 } };
  var head = fldPersonaOVR(p), A = FLDR.ANCHOR;
  var atk = Math.round(head + (fldAttr(p, "aggression") - A) * _fldRatNum(t.attack.aggressionWeight, 0.25) + (fldAttr(p, "initiative") - A) * _fldRatNum(t.attack.initiativeWeight, 0.10));
  var def = Math.round(head + (fldAttr(p, "resolve") - A) * _fldRatNum(t.defend.resolveWeight, 0.20) + (fldAttr(p, "grit") - A) * _fldRatNum(t.defend.gritWeight, 0.10));
  return { headline: head, attack: atk, defend: def };
}

/* The dual Attack/Defend TILT DELTAS (not the absolute OVRs) for a 64-anchored persona — factored so a
   caller can apply the same situational tilt to ANY headline (e.g. the strategic _cmdGenRating, which
   uses a different 0.55*skill+0.45*rep blend) without re-deriving fldPersonaOVR. Because a headline is an
   integer, round(head)+round(tilt) === fldDualOVR's round(head+tilt), so fldDualOVR stays byte-identical. */
function fldDualTilt(p) {
  var d = _ratData();
  var t = (d && d.dualOvrTilt) ? d.dualOvrTilt : { attack: { aggressionWeight: 0.25, initiativeWeight: 0.10 }, defend: { resolveWeight: 0.20, gritWeight: 0.10 } };
  var A = FLDR.ANCHOR;
  var atk = (fldAttr(p, "aggression") - A) * _fldRatNum(t.attack.aggressionWeight, 0.25) + (fldAttr(p, "initiative") - A) * _fldRatNum(t.attack.initiativeWeight, 0.10);
  var def = (fldAttr(p, "resolve") - A) * _fldRatNum(t.defend.resolveWeight, 0.20) + (fldAttr(p, "grit") - A) * _fldRatNum(t.defend.gritWeight, 0.10);
  return { attack: Math.round(atk), defend: Math.round(def) };
}

/* ---- The A-F grade (Aaron-locked report card; NO gaming S tier). A+ >=90 = the
   Legendary club; the five lower bands REUSE _cmdLeadWord (one vocabulary, two
   surfaces can't disagree). Neutral 64 -> C / Steady. ---- */
function fldRatingGrade(ovr) {
  var v = Math.round(_fldRatNum(ovr, FLDR.ANCHOR));
  if (v < 0) v = 0; if (v > 100) v = 100;
  if (v >= 90) return { ovr: v, letter: "A+", word: "Legendary", color: "#2f5130" };
  var letter = v >= 82 ? "A" : v >= 70 ? "B" : v >= 58 ? "C" : v >= 48 ? "D" : "F";
  var wc = (typeof _cmdLeadWord === "function") ? _cmdLeadWord(v) : ["Steady", "#b8863b"];
  return { ovr: v, letter: letter, word: wc[0], color: wc[1] };
}

/* ===== the persona DERIVATION pipeline (authored figures + generated masses) ===== */

function _fldRatRankBase(rank) {
  var d = _ratData(), t = d && d.rankBase;
  if (t && rank != null && typeof t[rank] === "number") return t[rank];
  return FLDR.ANCHOR;
}
function _fldRatBranchTilt(branch) {
  var d = _ratData(), t = d && d.branchTilt;
  return (t && branch != null && typeof t[branch] === "number") ? t[branch] : 0;
}
function _fldRatYearDrift(year) {
  var d = _ratData(), t = d && d.yearDrift;
  return (t && year != null && typeof t[String(year)] === "number") ? t[String(year)] : 0;
}

/* deterministic 32-bit hash (FNV-1a) — the ONLY randomness source (NO Math.random,
   so a derived persona is reproducible and the build stays deterministic). */
function _fldRatHash(s) {
  s = String(s == null ? "" : s);
  var h = 2166136261;
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
  return h >>> 0;
}
function fldRatSeededJitter(seed, span) {
  span = span || 6;
  var h = _fldRatHash(seed);
  return (h % (2 * span + 1)) - span;          // integer in [-span, +span]
}

/* fldDerivePerson(record, year): authored persona pass-through (with its provenance),
   else GENERATE from rank + branch + year + a deterministic per-attribute jitter.
   A generated persona is tagged Inferred and pinned near 64 (never invents a HIGH number). */
function fldDerivePerson(record, year) {
  if (!record) return null;
  if (record.persona) return { persona: record.persona, provenance: record.provenance || "Inferred", generated: false };
  var base = _fldRatRankBase(record.rank), tilt = _fldRatBranchTilt(record.branch), drift = _fldRatYearDrift(year != null ? year : record.year);
  var pid = record.pid || record.id || record.name || "x";
  var d = _ratData(), span = (d && typeof d.jitterSpan === "number") ? d.jitterSpan : 6;
  var attrs = (d && d.attributes && d.attributes.length) ? d.attributes : ["tactical", "command", "resolve", "discipline", "marksmanship"];
  var persona = {};
  for (var i = 0; i < attrs.length; i++) {
    var k = attrs[i], v = base + tilt + drift + fldRatSeededJitter(pid + ":" + k, span);
    persona[k] = v < 20 ? 20 : (v > 88 ? 88 : v);    // generated never reaches the Legendary ceiling
  }
  return { persona: persona, provenance: "Inferred", generated: true };
}

/* ===== badge-def + realism-cap accessors (consumed by R-3 / R-4; defined now) ===== */

function fldBadgeDef(key) {
  var d = _ratData(); if (!d || !d.badgeDefs) return null;
  for (var i = 0; i < d.badgeDefs.length; i++) if (d.badgeDefs[i].key === key) return d.badgeDefs[i];
  return null;
}

/* The realism-scaled INPUT cap for a lever (D94-softcap): Arcade generous, Historian
   tight. The OUTPUT wall is enforced elsewhere; this only sets how hard inputs may push. */
function fldRatingRealismCap(tier, leverKey) {
  var d = _ratData(), caps = d && d.realismCaps;
  var t = (caps && caps[tier]) ? caps[tier] : (caps && caps.balanced);
  if (!t || typeof t[leverKey] !== "number") return (leverKey === "cmdBonus") ? 0.9 : 1.0;
  return t[leverKey];
}

/* ===========================================================================
   R-3 · THE BADGE ENGINE — the first rating->combat seam.

   fldBadgeFactor(u, lever) is the guarded ONE-TOKEN MULTIPLICATIVE factor the tactical engine
   multiplies into its EXISTING fire / rally / speed / melee lines (T0). It is IDENTITY (1.0) when
   the badge engine is off (__FIELD.badges falsy) OR the unit carries no matching badge -> every
   pre-badge AI-vs-AI baseline is BYTE-IDENTICAL (it mirrors the (u.cmdBonus||0) no-op pattern).
   When active it SUMS the matching badges' signed `mag`s for `lever`, gates each by its trigger
   against the unit's live state, then CLAMPS the summed delta to the realism-scaled per-unit
   per-lever cap (fldRatingRealismCap(tier,"badgeLever") -> Arcade generous / Historian tight) so
   "stack every positive badge in one brigade" can never saturate a lever.

   THE NO-FUDGE OUTPUT WALL (D74/D94, build-gate-asserted in tools/build.mjs): this module ONLY
   READS unit fields and RETURNS a factor; it NEVER writes cas/aCas/bCas/victory/tgt.men or sev.*.
   The strong unit dominates EMERGENTLY because the engine then runs its NORMAL formula on the
   seeded input — the rating reaches the casualty count via the soldiers' stats, never the scoreboard.
   =========================================================================== */
function _fldBadgeActive() {
  return (typeof __FIELD !== "undefined" && __FIELD && __FIELD.badges) ? true : false;
}
/* is this badge's trigger satisfied by the unit's current state? Unrecognized triggers default
   to TRUE (an always-on effect); the fine-grained situational triggers are an R-4 refinement. */
function _fldBadgeTrig(u, def) {
  var t = def && def.trigger;
  if (!t || t === "always" || t === "march") return true;
  if (t === "in_woods") return (typeof fldInWoods === "function") ? !!fldInWoods(u.x, u.z) : true;
  if (t === "arm_cav") return u.arm === "cav";
  if (t === "arm_art") return u.arm === "art";
  return true;   // defend_objective / first_fire / surprised / his_attack / ... -> on (R-4 sharpens these)
}
function fldBadgeFactor(u, lever) {
  if (!u || !lever || !_fldBadgeActive()) return 1;
  var b = u.badges; if (!b || !b.length) return 1;
  var sum = 0, i, def;
  for (i = 0; i < b.length; i++) {
    def = fldBadgeDef(b[i]);
    if (!def || def.fldLever !== lever) continue;
    if (typeof def.mag !== "number" || !isFinite(def.mag)) continue;
    if (!_fldBadgeTrig(u, def)) continue;
    sum += def.mag;
  }
  if (sum === 0) return 1;
  var tier = (typeof __FIELD !== "undefined" && __FIELD && __FIELD.realismTier) ? __FIELD.realismTier : "balanced";
  var cap = fldRatingRealismCap(tier, "badgeLever");
  if (!(cap > 0)) cap = 0.10;
  if (sum > cap) sum = cap; else if (sum < -cap) sum = -cap;
  return 1 + sum;
}
/* the unit cohesion in [-1,1] for the fldMoraleStep rally extension: (cohesion-50)/50. ABSENT
   cohesion -> 0 (BYTE-IDENTICAL; authoring `cohesion` is the D94-forks #4 migration). NOTE: the
   COMBAT rally term defaults to neutral (0) when absent — a derive-from-xp default here would shift
   the rally of every xp!=2 unit and break byte-identity, so the xp-derived cohesion lives only in
   the OVR DISPLAY (fldUnitRatingOVR, which already derives manQuality from xp), not this term. */
function fldUnitCohesion(u) {
  if (!u || typeof u.cohesion !== "number" || !isFinite(u.cohesion)) return 0;
  var c = (u.cohesion - 50) / 50;
  return c < -1 ? -1 : (c > 1 ? 1 : c);
}

/* A BRIGADE token's computed OVR (display): men-quality floor + materiel + condition +
   live leadership (cmdBonus). Pure read of existing unit fields; nothing is stored. */
function fldUnitRatingOVR(u) {
  if (!u) return FLDR.ANCHOR;
  var d = _ratData();
  var w = (d && d.ovrWeights && d.ovrWeights.brigade) ? d.ovrWeights.brigade : { manQuality: 0.42, materiel: 0.28, condition: 0.15, leadership: 0.15 };
  var xp = _fldRatNum(u.xp, 2);
  var manQ = FLDR.ANCHOR + (xp - 2) * 8;                                   // authored xp -> man-quality
  var wkey = String(u.weapon || "");
  var materiel = wkey === "rifled" ? 74 : wkey === "carbine" ? 70 : wkey === "smooth" ? 62 : FLDR.ANCHOR;
  if (u.arm === "art" && _fldRatNum(u.guns, 0) > 0) materiel = Math.min(90, materiel + Math.min(16, u.guns));
  var maxMor = _fldRatNum(u.maxMor, 100), mor = _fldRatNum(u.morale, maxMor);
  var fat = _fldRatNum(u.fatigue, 0);
  var condition = FLDR.ANCHOR + (maxMor > 0 ? (mor / maxMor - 0.75) * 40 : 0) - fat * 0.15;
  var leadership = FLDR.ANCHOR + _fldRatNum(u.cmdBonus, 0) * 30;           // live aura, never stored
  var ovr = manQ * w.manQuality + materiel * w.materiel + condition * w.condition + leadership * w.leadership;
  var wsum = w.manQuality + w.materiel + w.condition + w.leadership;
  ovr = wsum > 0 ? ovr / wsum : FLDR.ANCHOR;
  return Math.round(ovr < 0 ? 0 : (ovr > 100 ? 100 : ovr));
}

/* ===== R-2 · the OVR READ-OUT UI (pure display; no sim change, byte-identical) ===== */

/* The selected brigade's computed OVR + A-F report-card grade, for the tactical HUD (a T0
   fldRenderHud seam). Pure read of existing unit fields (fldUnitRatingOVR), nothing stored.
   TRIPLE-ENCODED + CVD-safe + WCAG-AA: the meaning rides number + letter-grade + word in the
   default high-contrast text colour; the band colour is DECORATIVE only (a left accent stripe).
   Empty when the ratings data is absent (so a build without it is byte-identical). */
function fldRatingHudSelected(u) {
  if (!u || !_ratData()) return "";
  var ovr = fldUnitRatingOVR(u);
  var g = fldRatingGrade(ovr);
  return '<div style="display:flex;align-items:center;gap:7px;margin-top:5px;border-top:1px solid #795c3e;padding-top:5px">'
    + '<span aria-hidden="true" style="display:inline-block;width:4px;height:22px;background:' + g.color + ';border-radius:2px"></span>'
    + '<span style="font-weight:bold;font-size:16px;line-height:1">' + ovr + '</span>'
    + '<span style="font-size:9px;opacity:.6;letter-spacing:.05em">OVR</span>'
    + '<span style="font-size:12px;opacity:.9;margin-left:2px;">Grade <b>' + _fldRatEsc(g.letter) + '</b> &middot; ' + _fldRatEsc(g.word) + '</span>'
    + '</div>';
}

/* ===========================================================================
   R-4 · THE X-FACTORS — the dramatic "in the zone" Madden surge (inside the no-fudge wall).

   An X-Factor is a Superstar badge with an ACTIVATION: when its situational trigger fires, the unit
   enters "in the zone" — a bounded surge on EXACTLY ONE channel (its declared lever):
     - a NON-speed X-Factor (rally/melee/none) scales its ALREADY-SUMMED command aura (cmdBonus) toward
       the hard FLDO.CMD_BONUS_CAP (0.9) wall via u._xfActive, NEVER beyond;
     - a SPEED X-Factor (Foot Cavalry / The Slows) quickens/drags the march via u._spdMul (the _spdMul
       term itself is capped to [0.85, 1.15]) and does NOT also surge the command aura (one channel only).
   A one-shot ⚡ announce fires; the marker pulses (u._xfGlow). The amplification is realism-scaled
   (fldRatingRealismCap(tier,"xfactor"): Arcade 1.45 dramatic / Balanced 1.20 / Historian 1.08 tight,
   D94-softcap). fldMoveFactor (T0) additionally clamps the COMBINED speed factor (the _spdMul surge ×
   the R-3 static speed-badge factor) to ONE documented band [0.75, 1.30], so no stack can breach it.

   THE NO-FUDGE OUTPUT WALL (D74/D94, build-gate 4d): fldXFactorStep writes ONLY the _xf* / _spdMul
   surge fields and announces; fldXFactorApplyCmd writes ONLY the cmdBonus INPUT lever (clamped at the cap). NEITHER ever
   writes cas/aCas/bCas/victory/.men/sev.*. A surging brigade holds longer / rallies sooner / bleeds the
   enemy less EMERGENTLY — the engine runs its NORMAL morale/rally/rout-save formula on the higher
   (capped) cmdBonus input; the rating never touches the scoreboard.

   BYTE-IDENTICAL WHEN OFF: gated on __FIELD.badges; a unit carrying NO X-Factor badge is left wholly
   untouched (_xfActive/_spdMul/_xfGlow stay undefined -> the fldMoveFactor (u._spdMul) read and the
   fldXFactorApplyCmd guard are exact no-ops). No shipped scenario assigns X-Factors yet (the R-6 sweep),
   so every battle is byte-for-byte identical whether badges are on or off. NO RNG -> seed-replayable.

   TWO-LAYER MODEL (kept deliberately distinct from R-3): the R-3 static fldBadgeFactor remains the
   always-on BASELINE (an X-Factor badge with an fldLever still contributes its capped static factor);
   R-4 adds the situational SURGE on top. The situational sharpening lives in _fldXFactorInZone (the
   activation), NOT in _fldBadgeTrig — so the R-3 static path (and its probe) is untouched.
   =========================================================================== */

/* the unit's X-Factor (rung:"xfactor") badge defs, in catalog order. Empty for any unit that carries
   none -> fldXFactorStep skips it entirely (byte-identical). */
function _fldUnitXFactors(u) {
  var out = []; if (!u || !u.badges || !u.badges.length) return out;
  for (var i = 0; i < u.badges.length; i++) { var def = fldBadgeDef(u.badges[i]); if (def && def.rung === "xfactor") out.push(def); }
  return out;
}
/* is this unit moving under a march order (a real change of position, not a settled hold)? */
function _fldXfMoving(u) {
  if (!u || !u.order || u.order.type !== "move") return false;
  var arr = (typeof FLD !== "undefined" && FLD.ARRIVE) ? FLD.ARRIVE : 14;
  var dx = u.order.tx - u.x, dz = u.order.tz - u.z;
  return (dx * dx + dz * dz) > arr * arr;
}
/* is a friendly brigade routing within 220yd (the "all else is breaking" last-stand condition)? */
function _fldXfNearRout(u) {
  var U = (typeof __FIELD !== "undefined" && __FIELD) ? __FIELD.units : null; if (!U) return false;
  for (var i = 0; i < U.length; i++) { var f = U[i]; if (f === u || f.side !== u.side || !f.alive || f.state !== "routing") continue; if (typeof fldDist === "function" && fldDist(f, u) < 220) return true; }
  return false;
}
/* _fldXFactorInZone(u, def): the situational ACTIVATION test per X-Factor trigger. Engine-observable
   state only (order / ammo / morale / arm / nearby routing) -> deterministic, replayable. */
function _fldXFactorInZone(u, def) {
  if (!u || !u.alive || u.state === "routing") return false;
  var t = def && def.trigger;
  var charging = !!(u.order && u.order.type === "charge");
  var holding = !!(u.order && u.order.type === "hold");
  var lowMorale = (u.maxMor > 0) && (u.morale / u.maxMor < 0.5);
  switch (t) {
    case "march_vigor":       return _fldXfMoving(u);                                  // Foot Cavalry — on the march
    case "his_offensive":     return _fldXfMoving(u) || charging;                      // The Slows — committing to the attack
    case "ammo_low_defend":   return (u.ammo < 12) && !charging;                       // Bayonet! — out of cartridges, holding the line
    case "last_stand_defend": return holding && (lowMorale || _fldXfNearRout(u));      // Rock of Chickamauga — the line is breaking
    case "usct_assault":      return charging;                                         // Earned in Blood — storming the works
    case "mass_assault":      return charging;                                         // The Grand Charge
    case "flanking":          return (u.arm === "cav") && charging;                    // First with the Most — Forrest's troopers
    default:                  return charging || _fldXfMoving(u);                      // any other X-Factor: on a committed move
  }
}
/* decay a surge value toward target at a fixed rate (deterministic; ~1s to converge; snaps when within eps). */
function _fldXfDecay(v, target, dt) {
  if (typeof v !== "number" || !isFinite(v)) return target;
  var nv = v + (target - v) * Math.min(1, dt * 3.2);
  return (Math.abs(nv - target) < 1e-4) ? target : nv;
}
/* fldXFactorStep(dt): per-tick activation. For each unit carrying an X-Factor, set the surge when in the
   zone (decay it toward identity when out), fire a one-shot ⚡ announce on the rising edge, and drive the
   marker glow. Gated on __FIELD.badges; a unit with no X-Factor is untouched. NO RNG (deterministic). */
function fldXFactorStep(dt) {
  if (!_fldBadgeActive()) return;
  var U = (typeof __FIELD !== "undefined" && __FIELD) ? __FIELD.units : null; if (!U || !U.length) return;
  var tier = (__FIELD && __FIELD.realismTier) ? __FIELD.realismTier : "balanced";
  var amp = fldRatingRealismCap(tier, "xfactor"); if (!(amp > 1)) amp = 1.2;
  var rise = amp - 1;                                   // the surge magnitude above identity
  for (var i = 0; i < U.length; i++) {
    var u = U[i];
    var defs = _fldUnitXFactors(u);
    if (!defs.length) continue;                         // <-- byte-identical: units without an X-Factor untouched
    var active = null;
    for (var j = 0; j < defs.length; j++) { if (_fldXFactorInZone(u, defs[j])) { active = defs[j]; break; } }
    if (active && u.alive) {
      var pos = active.polarity !== "neg";
      var viaSpeed = (active.fldLever === "speed");
      // the cmdBonus aura surge fires ONLY for a positive, NON-speed X-Factor — a pure-speed badge (Foot
      // Cavalry / The Slows) surges ONLY the march via _spdMul, never the command aura (its declared lever is
      // honored, and the speed effect is not double-routed into cmdBonus). This keeps each X-Factor on one channel.
      u._xfActive = (pos && !viaSpeed) ? amp : 1;
      if (viaSpeed) u._spdMul = pos ? Math.min(1.15, 1 + rise) : Math.max(0.85, 1 - rise);
      u._xfGlow = pos ? 1 : 0;                           // glow the heroic surge; the named-flaw drag does not glow
      if (u._xfOn !== active.key) {                      // one-shot on the rising edge (re-arms after leaving the zone)
        u._xfOn = active.key;
        var line = (pos ? "⚡ " : "") + (u.name || "A brigade") + " — " + (active.label || active.key) + (pos ? "!" : ".");
        if (typeof fldAnnounce === "function") fldAnnounce(line);
        if (pos && typeof fldScenarioBanner === "function") { try { fldScenarioBanner(line, u.side); } catch (e) {} }
      }
    } else {
      u._xfOn = null;                                    // out of zone -> re-arm + decay the surge toward identity
      u._xfActive = _fldXfDecay(u._xfActive, 1, dt);
      if (u._spdMul != null) u._spdMul = _fldXfDecay(u._spdMul, 1, dt);
      u._xfGlow = (u._xfGlow > 0) ? Math.max(0, u._xfGlow - dt * 2.2) : 0;
    }
  }
}
/* fldXFactorApplyCmd(u): scale the unit's ALREADY-SUMMED command aura by its active X-Factor, hard-capped
   at FLDO.CMD_BONUS_CAP — the surge pushes cmdBonus toward the wall, NEVER beyond. Called at the END of
   fldOfficersStep (after the aura is summed). A strict no-op unless an X-Factor is active (byte-identical). */
function fldXFactorApplyCmd(u) {
  if (!u || typeof u._xfActive !== "number" || u._xfActive <= 1) return;
  var cap = (typeof FLDO !== "undefined" && FLDO.CMD_BONUS_CAP) ? FLDO.CMD_BONUS_CAP : 0.9;
  var v = (u.cmdBonus || 0) * u._xfActive;
  u.cmdBonus = (v > cap) ? cap : v;
}

/* ===========================================================================
   Q7 · THE GM MATCHUP LAYER — the pre-battle matchup screen (RATING-SYSTEM-DESIGN §13).

   PURE READ-OUT, no sim change. A side's FORCE rating is the men-weighted mean of its brigades' computed
   OVRs (fldUnitRatingOVR over the scenario's authored OOB — full strength, no live state) — the same
   number the tactical HUD shows for a live brigade, aggregated. The predicted-edge bar blends quality
   (mean OVR) with quantity (men) into a share — the honest historical inputs the D74 model consumes, so
   the board PREDICTS the emergent result, it does not create one (no rating is read at resolve-time).
   Handles single-phase (sd.oob) AND multi-phase (sd.phases[].oob) scenarios; dedupes a brigade that
   recurs across phases by id. Returns null (graceful) for a scenario with no readable OOB.
   =========================================================================== */
function _fldOOBUnits(sd, side) {
  var out = [], seen = {}, anon = 0;
  function add(arr) {
    if (!arr || !arr.length) return;
    for (var k = 0; k < arr.length; k++) {
      var u = arr[k]; if (!u) continue;
      if ((u.side || side) !== side) continue;                 // oob[side] units carry no side field; reinforcements do
      var key = u.id || ("anon:" + (++anon));                  // globally-unique fallback so two id-less units never collide (Q7 bug-hunt LOW)
      if (seen[key]) continue; seen[key] = 1;                  // dedup a brigade recurring by id (e.g. oob + reinforcements)
      out.push(u);
    }
  }
  if (sd) {
    if (Array.isArray(sd.phases) && sd.phases.length) {
      // MULTI-PHASE (antietam/gettysburg/vicksburg/chickamauga): each phase's oob is a per-SECTOR/day slice
      // with DISTINCT brigade ids per phase. The matchup previews the OPENING engagement (phase 0) — the fight
      // the player launches into (§13 "the coming fight") — NOT the sum of all phases, which over-counts the
      // attacker who engages across every sector and would falsely favour him (the Q7 bug-hunt HIGH: the
      // all-phase sum forecast a CS edge at Gettysburg, a battle the larger Union army won). (Anti-Lost-Cause.)
      var p0 = sd.phases[0];
      if (p0) { if (p0.oob && p0.oob[side]) add(p0.oob[side]); if (Array.isArray(p0.reinforcements)) add(p0.reinforcements); }
    } else {
      if (sd.oob && sd.oob[side]) add(sd.oob[side]);
      if (Array.isArray(sd.reinforcements)) add(sd.reinforcements);
    }
  }
  return out;
}
/* a side's aggregate FORCE OVR + strength + the brigade list (sorted strongest-first), from the OOB. */
function fldOOBSideOVR(sd, side) {
  side = (side === "CS") ? "CS" : "US";
  var units = _fldOOBUnits(sd, side);
  if (!units.length) return null;
  var sumW = 0, men = 0, brigs = [];
  for (var i = 0; i < units.length; i++) {
    var u = units[i], m = _fldRatNum(u.men, 1000), o = fldUnitRatingOVR(u);
    sumW += o * m; men += m;
    brigs.push({ name: String(u.name || u.id || ("Brigade " + (i + 1))), ovr: o, men: m });
  }
  brigs.sort(function (a, b) { return b.ovr - a.ovr; });
  return { side: side, ovr: men > 0 ? Math.round(sumW / men) : FLDR.ANCHOR, men: men, n: units.length, brigades: brigs };
}
/* the predicted edge from the two sides' force-power (quality x quantity). Returns the leading side + a
   labeled magnitude word + the US share fraction (for the bar). The bar/word carry the meaning, not colour. */
function fldMatchupEdgeWord(fracUS) {
  var f = _fldRatNum(fracUS, 0.5), d = f - 0.5, mag = Math.abs(d);
  var word = mag < 0.04 ? "Evenly matched" : (mag < 0.11 ? "slight edge" : (mag < 0.20 ? "clear edge" : "strong edge"));
  return { lead: d >= 0 ? "US" : "CS", word: word, mag: mag };
}
/* fldMatchupBoard(sd): the full pre-battle matchup data (both sides' force OVR + the edge). null if either
   side has no readable OOB. */
function fldMatchupBoard(sd) {
  if (!sd) return null;
  var atk = (sd.attacker === "CS") ? "CS" : (sd.attacker === "US" ? "US" : "US");
  var us = fldOOBSideOVR(sd, "US"), cs = fldOOBSideOVR(sd, "CS");
  if (!us || !cs) return null;
  function power(s) { return Math.max(1, s.ovr) * Math.max(1, s.men); }
  var pUS = power(us), pCS = power(cs), tot = pUS + pCS;
  var fracUS = tot > 0 ? pUS / tot : 0.5;
  var phased = !!(sd.phases && sd.phases.length);
  var phaseName = (phased && sd.phases[0] && sd.phases[0].name) ? String(sd.phases[0].name) : "";
  return { attacker: atk, defender: (atk === "CS") ? "US" : "CS", US: us, CS: cs, fracUS: fracUS, edge: fldMatchupEdgeWord(fracUS), phased: phased, phaseName: phaseName };
}

/* The principal field commander for a side from the scenario leaders (highest authored quality), with his
   OVR mapped back through the EXISTING (lead-42)/46 quality map -> lead = quality*46+42 -> a grade. For a
   multi-phase battle the leaders live per-phase, so fall back to the OPENING phase's leaders (matching the
   phase-0 force scoping) so the marquee battles' commanders (Lee, Bragg, Grant) still surface. (Q7 bug-hunt MED.) */
function _fldMatchupCommander(sd, side) {
  var L = sd && sd.leaders && sd.leaders[side];
  if ((!Array.isArray(L) || !L.length) && sd && Array.isArray(sd.phases) && sd.phases[0] && sd.phases[0].leaders) L = sd.phases[0].leaders[side];
  if (!Array.isArray(L) || !L.length) return null;
  var best = null;
  for (var i = 0; i < L.length; i++) { var l = L[i]; if (!l) continue; var q = _fldRatNum(l.quality, 0.55); if (!best || q > best.q) best = { name: String(l.short || l.name || "Commander"), q: q }; }
  if (!best) return null;
  var lead = Math.round(best.q * 46 + 42);
  return { name: best.name, ovr: lead, grade: fldRatingGrade(lead) };
}

/* fldMatchupHtml(sd): the pre-battle "Order of Battle — The Matchup" board for the side-choice card. PURE
   DISPLAY (the headless probe never reaches it). TRIPLE-ENCODED + CVD-safe: force OVR rides number + A-F
   grade + word; the edge rides a labeled % bar (names + percentages in text); colour is decorative only.
   Returns "" when there is no readable OOB (graceful — the card renders without the board). */
function fldMatchupHtml(sd) {
  if (!_ratData()) return "";
  var b = fldMatchupBoard(sd); if (!b) return "";
  var COL = { US: "#6c8ebf", CS: "#b77668" }, NAME = { US: "Union", CS: "Confederate" };
  function _e(s) { return _fldRatEsc(s); }
  function sideCol(side) {
    var s = b[side], g = fldRatingGrade(s.ovr), posture = (b.attacker === side) ? "On the offensive" : "Holding the ground";
    var top = (s.brigades && s.brigades.length) ? s.brigades[0] : null;
    var cmdr = _fldMatchupCommander(sd, side);
    return '<div style="flex:1 1 200px;min-width:180px;border-left:4px solid ' + COL[side] + ';padding:6px 0 6px 10px">'
      + '<div style="font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:#b3925e">' + _e(NAME[side]) + ' &middot; ' + _e(posture) + '</div>'
      + '<div style="display:flex;align-items:baseline;gap:7px;margin:2px 0">'
      +   '<span style="font-weight:bold;font-size:22px;line-height:1">' + s.ovr + '</span>'
      +   '<span style="font-size:9px;opacity:.6;letter-spacing:.05em">FORCE OVR</span>'
      +   '<span aria-hidden="true" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + g.color + '"></span>'
      +   '<span style="font-size:12px"><b>' + _e(g.letter) + '</b> ' + _e(g.word) + '</span>'
      + '</div>'
      + '<div style="font-size:11px;opacity:.8">' + s.n + ' brigades &middot; ' + _fldNumComma(s.men) + ' men engaged</div>'
      + (top ? '<div style="font-size:11px;opacity:.7;margin-top:2px">Strongest: ' + _e(top.name) + ' (' + top.ovr + ')</div>' : '')
      + (cmdr ? '<div style="font-size:11px;opacity:.7;margin-top:2px">Commander: ' + _e(cmdr.name) + ' &middot; <b>' + _e(cmdr.grade.letter) + '</b> ' + _e(cmdr.grade.word) + '</div>' : '')
      + '</div>';
  }
  var usPct = Math.round(b.fracUS * 100), csPct = 100 - usPct;
  var ed = b.edge, edgeText = (ed.word === "Evenly matched") ? "Evenly matched" : (NAME[ed.lead] + " " + ed.word);
  // the predicted-edge bar (decorative split; the % + names + word carry the meaning)
  var bar = '<div style="margin-top:10px">'
    + '<div style="display:flex;justify-content:space-between;font-size:11px;opacity:.85;margin-bottom:3px"><span>Predicted edge</span><span><b>' + _e(edgeText) + '</b></span></div>'
    + '<div role="img" aria-label="Predicted force balance: Union ' + usPct + ' percent, Confederate ' + csPct + ' percent — ' + _e(edgeText) + '" style="display:flex;height:14px;border:1px solid var(--rule);border-radius:3px;overflow:hidden">'
    +   '<div style="width:' + usPct + '%;background:' + COL.US + '"></div><div style="width:' + csPct + '%;background:' + COL.CS + '"></div>'
    + '</div>'
    + '<div style="display:flex;justify-content:space-between;font-size:10px;opacity:.7;margin-top:2px"><span>Union ' + usPct + '%</span><span>' + csPct + '% Confederate</span></div>'
    + '</div>';
  // header + note are phase-aware: a multi-phase battle's board previews the OPENING engagement (phase 0),
  // NOT the whole battle (its later phases shift sector + force), so it is labeled as such — honest framing
  // that keeps a day-1 attacker edge (e.g. the CS driving the Union through Gettysburg town on July 1) from
  // reading as a verdict on the whole battle. (Q7 bug-hunt HIGH — anti-Lost-Cause framing.)
  var hdr = b.phased ? ("Order of Battle &mdash; the Opening Engagement" + (b.phaseName ? " (" + _e(b.phaseName) + ")" : "")) : "Order of Battle &mdash; the Matchup";
  var noteBody = b.phased
    ? "A read-out of the OPENING engagement's order of battle — strength &times; quality. Later phases shift the ground and the forces. The defender holds; counters and terrain decide the rest. The number forecasts the odds; it never fixes the result."
    : "A read-out of the historical order of battle — strength &times; quality. The defender holds the ground; counters and terrain decide the rest. The number forecasts the odds; it never fixes the result.";
  var note = '<div style="font-size:10.5px;opacity:.6;margin-top:7px;line-height:1.4">' + noteBody + '</div>';
  var atkSide = b.attacker, defSide = b.defender;
  return '<div style="max-width:560px;margin:14px auto 0;padding:11px 13px;border:1px solid var(--rule);border-radius:6px;background:rgba(0,0,0,.14)">'
    + '<div style="text-align:center;font-size:12px;text-transform:uppercase;letter-spacing:.09em;color:#b3925e;margin-bottom:6px">' + hdr + '</div>'
    + '<div style="display:flex;gap:14px;flex-wrap:wrap">' + sideCol(atkSide) + sideCol(defSide) + '</div>'
    + bar + note
    + '</div>';
}
/* thousands separator (no Intl dependency; deterministic). */
function _fldNumComma(n) {
  n = Math.round(_fldRatNum(n, 0));
  var s = String(n < 0 ? -n : n), out = "", c = 0;
  for (var i = s.length - 1; i >= 0; i--) { out = s.charAt(i) + out; if (++c % 3 === 0 && i > 0) out = "," + out; }
  return (n < 0 ? "-" : "") + out;
}
