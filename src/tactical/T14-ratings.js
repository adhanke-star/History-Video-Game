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
