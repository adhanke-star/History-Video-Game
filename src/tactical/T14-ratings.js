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

/* C11 (D235): the per-scenario DISPLAY alias for a shared badge label — data/ratings.json
   `badgeLabelAliases[scenarioId][badgeKey]`. Display-only: the mechanical lever (trigger/lever/mag,
   stamped by fldBrSpec) is untouched; only the player-facing word changes where the shared archetype's
   historical NAME would be an anachronism on an earlier battle (Shiloh's Hornets' Nest stand shows
   "Hold the Line", not the Sept-1863-named "Rock of Chickamauga"). No alias entry, no live scenario,
   or any error -> def.label exactly as before (byte-identical everywhere else). */
function fldBadgeLabel(def) {
  if (!def) return "";
  var raw = String(def.label || def.key);
  try {
    var d = _ratData(), A = d && d.badgeLabelAliases;
    var sid = (typeof __FIELD !== "undefined" && __FIELD && __FIELD.scenData && __FIELD.scenData.id) || null;
    var m = sid && A && A[sid];
    if (m && m[def.key]) return String(m[def.key]);
  } catch (e) {}
  return raw;
}

/* R-6 · THE ROSTER-BADGE ASSIGNMENT lookup. The 9 shipped battles' documented commander/unit traits live in
   ONE reviewable place — data/ratings.json `rosterBadges[scenarioId][unitId]` — not scattered across the pure
   historical OOB JSONs. fldBrSpec (T1) calls this per scenario unit; returns a FRESH array (never the shared
   data array, so combat reads can't alias canonical GAME_DATA) or null when the unit carries no assignment ->
   the badge seams are exact no-ops -> BYTE-IDENTICAL. An inline `d.badges` on a spec (e.g. a Custom Battle)
   takes precedence in fldBrSpec; this is the fallback for the authored scenarios. null-safe. */
function fldScenarioRosterBadges(scenarioId, unitId) {
  if (!scenarioId || !unitId) return null;
  var d = _ratData(); var R = d && d.rosterBadges;
  var s = R && R[scenarioId];
  var b = s && s[unitId];
  return (b && b.length) ? b.slice() : null;
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
/* R-7 (D481): is the ground at (x,z) fortified — inside a fort circle OR within assault
   reach (~45yd) of a terrain wall segment? The shipped works are modeled BOTH ways: fort
   circles where a scenario declares them, and wall segments (the Fredericksburg stone
   wall / Vicksburg works idiom). READS ONLY THE T0 UNIVERSAL HOOKS (fldInFort + fldWalls)
   — never a raw terrain array (the terrain-readability decor-leak scan polices this; its
   token tripped on this comment's old wording, D482 follow-up). Absent or unreadable
   terrain -> false (no fortification observed). Pure read, deterministic. */
function _fldNearWallSeg(x, z, r) {
  var W = (typeof fldWalls === "function") ? fldWalls() : null; if (!W || !W.length) return false;
  for (var i = 0; i < W.length; i++) {
    var w = W[i]; if (!w) continue;
    var dx = w.x2 - w.x1, dz = w.z2 - w.z1, L2 = dx * dx + dz * dz;
    var t = L2 > 0 ? ((x - w.x1) * dx + (z - w.z1) * dz) / L2 : 0;
    if (t < 0) t = 0; else if (t > 1) t = 1;
    var px = w.x1 + t * dx - x, pz = w.z1 + t * dz - z;
    if (px * px + pz * pz <= r * r) return true;
  }
  return false;
}
function _fldTargetFortified(x, z) {
  if (typeof x !== "number" || typeof z !== "number" || !isFinite(x) || !isFinite(z)) return false;
  var f = false;
  try { f = (typeof fldInFort === "function") ? !!fldInFort(x, z) : false; } catch (eF) { f = false; }
  return f || _fldNearWallSeg(x, z, 45);
}
/* is this badge's trigger satisfied by the unit's current state?

   R-7 (D481, the D104 deferred-log refinement): the situational R-3 static triggers are
   now GATED on engine-observable state (order / men-fraction / sim clock / fortified
   ground) instead of defaulting always-on. THE ABSENT-STATE LAW: each predicate gates
   only on OBSERVED disqualifying state — a unit with no live order/men/clock (deploy
   phase, synthetic fixtures, Custom Battle inline badges) keeps the historical
   always-on TRUE, so every pre-R-7 pure-function baseline is unchanged. In battle,
   units always carry orders, so the gating is real. Caps are untouched (downstream).
   Triggers the static path can never consume (their defs carry fldLever "none":
   nearby_routing / enemy_nearby / river / flanking / mass_assault) keep default TRUE. */
function _fldBadgeTrig(u, def) {
  var t = def && def.trigger;
  if (!t || t === "always" || t === "march") return true;
  if (t === "in_woods") return (typeof fldInWoods === "function") ? !!fldInWoods(u.x, u.z) : true;
  if (t === "arm_cav") return u.arm === "cav";
  if (t === "arm_art") return u.arm === "art";
  var o = u.order, committed = !!(o && (o.type === "charge" || o.type === "move"));
  if (t === "defend_objective") return !committed;                                                   // stonewall: the defend posture (the D104 cs_colston_div lesson codified)
  if (t === "last_stand_defend") return true;                                                        // THE D481 ADJUDICATION-9 EXCEPTION, logged: gating rock_of_chickamauga's static rally on !committed flickered under the AI's mid-hold reposition orders and broke probe-chickamauga's sourced P2 tooth (Thomas holds >=7/8 fell to 6/8); the STATIC path stays always-on (pre-D481), and the situational last-stand drama lives in the R-4 X-Factor surge (_fldXFactorInZone), which is unchanged
  if (t === "first_fire") return !(u.maxMen > 0) || (u.men >= 0.92 * u.maxMen);                     // green_levies: brittle at first contact, settles once blooded
  if (t === "surprised") return !(typeof __FIELD !== "undefined" && __FIELD && typeof __FIELD.t === "number") || __FIELD.t < 300;   // powder_shy: starts shaky, steadies after the opening minutes
  if (t === "his_attack" || t === "his_offensive" || t === "usct_assault" || t === "march_vigor") return !o || committed;           // piecemeal / the_slows / earned_in_blood / foot_cavalry: bite on the committed advance
  if (t === "ammo_low_defend") return !(typeof u.ammo === "number") || (u.ammo < 12 && !(o && o.type === "charge"));                // bayonet: out of cartridges, holding the line
  if (t === "attack_fortified") return !o || (committed && _fldTargetFortified(o.tx, o.tz));        // rigid_plan: pressing the assault onto fortified ground
  return true;
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
   R-6 · THE BADGE-CHIP READ-OUT — surface the documented traits a brigade carries (the R-6 sweep assigns
   real badges to the shipped rosters). PURE DISPLAY (no sim read); "" when the unit carries no badge or
   ratings data is absent -> byte-identical. TRIPLE-ENCODED + CVD-SAFE + WCAG-AA: each chip's meaning rides
   a RUNG glyph (★ Star / ◆ Superstar / ⬥ X-Factor) + an explicit POLARITY sign (＋ strength / － flaw, never
   colour-alone) + the label word + a per-chip aria-label; the band tint is decorative only. The flaws show
   as plainly as the virtues (anti-Lost-Cause). =========================================================== */
var _FLD_RUNG_GLYPH = { star: "★", superstar: "◆", xfactor: "⬥" };
function fldRatingBadgesHtml(u) {
  if (!u || !u.badges || !u.badges.length || !_ratData()) return "";
  var chips = "", any = false;
  for (var i = 0; i < u.badges.length; i++) {
    var def = fldBadgeDef(u.badges[i]); if (!def) continue;
    any = true;
    var neg = def.polarity === "neg";
    var sign = neg ? "−" : "+";                          // − (minus) / + : the polarity, a TEXT glyph (never colour-alone)
    var glyph = _FLD_RUNG_GLYPH[def.rung] || "•";
    var col = neg ? "#c98a5e" : "#86b06a";                    // decorative left-tint only (meaning is the glyph+sign+word)
    // D478 (LANE-017 slice 1): the rung glyph reads its tint from the ONE rarity language
    // (cwRungTierInfo → data/loot-survival.json). Helper absent ⇒ today's chip byte-identical.
    var tierTint = "";
    try { if (typeof cwRungTierInfo === "function") tierTint = String(cwRungTierInfo(def.rung).color || ""); } catch (eTier) {}
    var label = fldBadgeLabel(def);
    var kind = neg ? "a documented flaw" : "a documented strength";
    var aria = label + ", " + kind + (def.prov ? " (" + def.prov + ")" : "");
    chips += '<span role="listitem" aria-label="' + _fldRatEsc(aria) + '" title="' + _fldRatEsc(aria) + '"'
      + ' style="display:inline-flex;align-items:center;gap:3px;font-size:10px;padding:1px 7px;margin:3px 4px 0 0;'
      + 'border:1px solid ' + col + ';border-left:3px solid ' + col + ';border-radius:9px;background:rgba(0,0,0,.18)">'
      + '<span aria-hidden="true" style="font-size:9px;opacity:.95' + (tierTint ? ';color:' + tierTint : '') + '">' + glyph + '</span>'
      + '<b aria-hidden="true">' + sign + '</b>'
      + '<span aria-hidden="true">' + _fldRatEsc(label) + '</span>'
      + '</span>';
  }
  if (!any) return "";
  return '<div style="margin-top:5px;border-top:1px solid #795c3e;padding-top:4px">'
    + '<div style="font-size:9px;opacity:.72;letter-spacing:.06em;text-transform:uppercase;margin-bottom:1px">Traits &amp; Abilities</div>'
    + '<div role="list" aria-label="Brigade traits and abilities" style="display:flex;flex-wrap:wrap">' + chips + '</div>'
    + (typeof fldBadgeDeskHudHtml === "function" ? fldBadgeDeskHudHtml(u) : "")
    + '</div>';
}

/* ===========================================================================
   D480 (LANE-017 slice 3) · THE BADGE PRESENTATION LAYER — Madden-style badge
   CARDS (gallery) + the X-Factor SHOWCASE with LIVE activation state.

   PURE DISPLAY inside the D74 output wall: every function below only READS
   badgeDefs/rosterBadges-stamped unit state and the live _xf* surge fields —
   it never writes a unit, __FIELD, or G. Unknown badge ids are REFUSED
   fail-closed (a chip/card renders ONLY from a resolved fldBadgeDef — the
   defs-integrity law). Rung tints ride cwRungTierInfo (the ONE rarity
   language); no tier hex appears here. Disclosure buttons follow the T29
   muster-roll idiom (native <button>, aria-expanded/controls, panel always in
   the DOM, document-level delegated click, focus survives the HUD re-render).
   No animation anywhere in these panels, so reduceMotion needs no gate.
   =========================================================================== */

/* the provenance line for a def: prov + named sources + the def's note. */
function _fldBadgeProvText(def) {
  if (!def) return "";
  var src = (def.sources && def.sources.length) ? def.sources.join("; ") : "no named source";
  return String(def.prov || "Inferred") + " — " + src + (def.note ? ". " + String(def.note) : "");
}

/* R-7/D481: the ROW-level provenance record for one (scenario, unit, badge) assignment —
   the coverage-sweep citation law made data (rosterBadgeProv, a sibling of rosterBadges;
   the original 9 D104-workflow battles are documented in _rosterNote and carry no rows).
   Returns {prov, sources[], note?} or null. Pure read; absent record -> null -> the card
   renders byte-identically to its pre-D481 form. */
function fldRosterBadgeProv(scenarioId, unitId, key) {
  if (!scenarioId || !unitId || !key) return null;
  var d = _ratData(), P = d && d.rosterBadgeProv;
  var s = P && P[scenarioId], u = s && s[unitId];
  if (!u || !u.length) return null;
  for (var i = 0; i < u.length; i++) { if (u[i] && u[i].key === key) return u[i]; }
  return null;
}
function _fldRowProvText(rp) {
  if (!rp) return "";
  var src = (rp.sources && rp.sources.length) ? rp.sources.join("; ") : "no named source";
  return "This assignment: " + String(rp.prov || "Inferred") + " — " + src + (rp.note ? ". " + String(rp.note) : "");
}

/* ===========================================================================
   D484 (LANE-017 slice 6) · THE SOLDIER-TIER BADGE ACCESSORS + THE ONE CAPPED
   LEVER GATEWAY (design law: RATING-SYSTEM-DESIGN.md §17; data law: the
   data/ratings.json _soldierBadgeNote).

   soldierBadgeDefs is the INDIVIDUAL-tier catalog — a SEPARATE catalog from the
   unit badgeDefs (fldBadgeDef never resolves these keys and fldBadgeFactor never
   consumes them; no unit is stamped with them in D484). Two classes:
   'historical' (a documented-record badge assigned by a soldierBadges[pid] row,
   Verified >= 2 named sources) and 'career' (earned through play, derived — never
   stored, never Verified). PURE READS ONLY: every function here returns fresh
   values and writes no unit, no __FIELD, no G (the 4d wall scans this module).
   Any consumer of a soldier badge's lever MUST route through
   fldSoldierBadgeFactor, which clamps the summed per-lever delta at the SAME
   fldRatingRealismCap 'badgeLever' wall as fldBadgeFactor — no new lever class
   (D74). Data absent -> null/identity -> byte-identical.
   =========================================================================== */
function fldSoldierBadgeDef(key) {
  var d = _ratData(); if (!key || !d || !d.soldierBadgeDefs) return null;
  for (var i = 0; i < d.soldierBadgeDefs.length; i++) if (d.soldierBadgeDefs[i] && d.soldierBadgeDefs[i].key === key) return d.soldierBadgeDefs[i];
  return null;
}
/* the historical-record assignment rows for a register pid — FRESH shallow row copies
   (combat/UI reads can never alias canonical GAME_DATA; the fldScenarioRosterBadges
   idiom). null when the pid carries no rows or the data is absent. */
function fldSoldierBadges(pid) {
  var d = _ratData(), B = d && d.soldierBadges;
  var rows = pid && B ? B[pid] : null;
  if (!rows || !rows.length) return null;
  var out = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i]; if (!r || !r.key) continue;
    out.push({ key: String(r.key), prov: String(r.prov || "Inferred"), sources: (r.sources && r.sources.slice) ? r.sources.slice() : [], note: r.note ? String(r.note) : "" });
  }
  return out.length ? out : null;
}
/* the ONE capped lever gateway for soldier-tier badges: sums the resolved defs'
   signed mags for `lever` over `keys`, then clamps the summed delta at the SAME
   realism-scaled per-lever wall fldBadgeFactor uses (fldRatingRealismCap
   'badgeLever' — Arcade generous / Historian tight). Unknown keys are skipped
   fail-closed; no keys / no data / no matching lever -> identity 1 (byte-identical,
   the (u.cmdBonus||0) no-op pattern). NOT read by any combat line in D484. */
function fldSoldierBadgeFactor(keys, lever) {
  if (!keys || !keys.length || !lever) return 1;
  var sum = 0, i, def;
  for (i = 0; i < keys.length; i++) {
    def = fldSoldierBadgeDef(keys[i]);
    if (!def || def.fldLever !== lever) continue;
    if (typeof def.mag !== "number" || !isFinite(def.mag)) continue;
    sum += def.mag;
  }
  if (sum === 0) return 1;
  var tier = (typeof __FIELD !== "undefined" && __FIELD && __FIELD.realismTier) ? __FIELD.realismTier : "balanced";
  var cap = fldRatingRealismCap(tier, "badgeLever");
  if (!(cap > 0)) cap = 0.10;
  if (sum > cap) sum = cap; else if (sum < -cap) sum = -cap;
  return 1 + sum;
}

/* one Madden-style badge CARD. Keyboard-operable (tabindex 0) with the full
   provenance in BOTH the aria-label/title (hover + SR) and visible card text (tap).
   rowProv (optional, R-7/D481): the per-assignment provenance record — appended to
   the visible text + aria/title when present; absent -> byte-identical card. */
function fldBadgeCardHtml(def, rowProv) {
  if (!def) return "";
  var neg = def.polarity === "neg";
  var sign = neg ? "−" : "+";
  var glyph = _FLD_RUNG_GLYPH[def.rung] || "•";
  var col = neg ? "#c98a5e" : "#86b06a";
  var tierTint = "";
  try { if (typeof cwRungTierInfo === "function") tierTint = String(cwRungTierInfo(def.rung).color || ""); } catch (eTier) {}
  var label = fldBadgeLabel(def);
  var rungWord = def.rung === "xfactor" ? "X-Factor" : (def.rung === "superstar" ? "Superstar" : "Star");
  var prov = _fldBadgeProvText(def);
  var rowLine = _fldRowProvText(rowProv);
  if (rowLine) prov += " " + rowLine;
  var aria = label + ", " + rungWord + " " + (neg ? "flaw" : "strength") + ". " + prov;
  return '<div role="listitem" tabindex="0" data-badge-card="' + _fldRatEsc(def.key) + '"'
    + ' aria-label="' + _fldRatEsc(aria) + '" title="' + _fldRatEsc(aria) + '"'
    + ' style="border:1px solid ' + col + ';border-left:4px solid ' + col + ';border-radius:6px;padding:6px 8px;margin:4px 4px 0 0;background:rgba(0,0,0,.2);max-width:250px">'
    + '<div style="display:flex;align-items:center;gap:4px;font-size:11px">'
    + '<span aria-hidden="true" style="font-size:12px' + (tierTint ? ';color:' + tierTint : '') + '">' + glyph + '</span>'
    + '<b aria-hidden="true">' + sign + '</b>'
    + '<b aria-hidden="true">' + _fldRatEsc(label) + '</b>'
    + '<span aria-hidden="true" style="margin-left:auto;font-size:9px;opacity:.7;text-transform:uppercase;letter-spacing:.05em">' + rungWord + '</span>'
    + '</div>'
    + '<div aria-hidden="true" style="font-size:9px;opacity:.78;margin-top:3px">' + _fldRatEsc(prov) + '</div>'
    + '</div>';
}

/* the badge GALLERY. With a unit: its carried badges as full cards (unknown ids
   refused). With null: the complete badgeDefs catalog grouped by rung. */
function fldBadgeGalleryHtml(u) {
  var d = _ratData(); if (!d || !d.badgeDefs) return "";
  var html = "", i, def;
  if (u) {
    if (!u.badges || !u.badges.length) return "";
    var scn = (typeof __FIELD !== "undefined" && __FIELD) ? __FIELD.scenario : null;   // R-7/D481: row-prov lookup key
    var cards = "";
    for (i = 0; i < u.badges.length; i++) {
      def = fldBadgeDef(u.badges[i]);
      if (!def) continue;   // an unresolved id renders NOTHING (defs-integrity, fail-closed)
      cards += fldBadgeCardHtml(def, fldRosterBadgeProv(scn, u.id, def.key));
    }
    if (!cards) return "";
    return '<div role="list" aria-label="This brigade&#39;s badges" style="display:flex;flex-wrap:wrap">' + cards + '</div>';
  }
  var rungs = ["star", "superstar", "xfactor"];
  for (var r = 0; r < rungs.length; r++) {
    var rungWord = rungs[r] === "xfactor" ? "X-Factors" : (rungs[r] === "superstar" ? "Superstars" : "Stars");
    var tint = "";
    try { if (typeof cwRungTierInfo === "function") tint = String(cwRungTierInfo(rungs[r]).color || ""); } catch (eT) {}
    var section = "";
    for (i = 0; i < d.badgeDefs.length; i++) {
      def = d.badgeDefs[i];
      if (!def || def.rung !== rungs[r]) continue;
      section += fldBadgeCardHtml(def);
    }
    if (!section) continue;
    html += '<div style="margin-top:6px">'
      + '<div style="font-size:10px;letter-spacing:.06em;text-transform:uppercase;opacity:.85"><span aria-hidden="true"' + (tint ? ' style="color:' + tint + '"' : '') + '>' + (_FLD_RUNG_GLYPH[rungs[r]] || "•") + '</span> ' + rungWord + '</div>'
      + '<div role="list" aria-label="' + rungWord + ' badge catalog" style="display:flex;flex-wrap:wrap">' + section + '</div>'
      + '</div>';
  }
  return html;
}

/* the X-Factor SHOWCASE: every field unit carrying an X-Factor def, with the
   LIVE activation state MIRRORED from the runtime surge fields (_xfOn is the
   rising-edge latch fldXFactorStep maintains; _xfGlow the marker pulse). READS
   ONLY — this function never sets a surge field, an order, or any sim state. */
function fldXfShowcaseHtml() {
  var U = (typeof __FIELD !== "undefined" && __FIELD) ? __FIELD.units : null;
  if (!U || !U.length || !_ratData()) return "";
  var rows = "";
  for (var i = 0; i < U.length; i++) {
    var u = U[i];
    var defs = _fldUnitXFactors(u);
    for (var j = 0; j < defs.length; j++) {
      var def = defs[j];
      var neg = def.polarity === "neg";
      var live = (u._xfOn === def.key);
      var glow = live && typeof u._xfGlow === "number" && u._xfGlow > 0;
      var state = live ? (neg ? "DRAGGING" : "IN THE ZONE") : "armed";
      var tint = "";
      try { if (typeof cwRungTierInfo === "function") tint = String(cwRungTierInfo("xfactor").color || ""); } catch (eT) {}
      var label = fldBadgeLabel(def);
      var aria = (u.name || "A brigade") + ": " + label + ", " + (live ? (neg ? "dragging now" : "in the zone now") : "armed, waiting on its trigger") + ". " + _fldBadgeProvText(def);
      rows += '<div role="listitem" tabindex="0" data-xf-row="' + _fldRatEsc(def.key) + '" data-xf-active="' + (live ? "1" : "0") + '"'
        + ' aria-label="' + _fldRatEsc(aria) + '" title="' + _fldRatEsc(aria) + '"'
        + ' style="display:flex;align-items:center;gap:5px;font-size:10px;padding:3px 6px;margin-top:3px;border:1px solid #745e3f;border-left:3px solid ' + (live ? "#c9a85f" : "#745e3f") + ';border-radius:4px;background:rgba(0,0,0,.18)">'
        + '<span aria-hidden="true"' + (tint ? ' style="color:' + tint + '"' : '') + '>' + (_FLD_RUNG_GLYPH.xfactor || "⬥") + '</span>'
        + '<b aria-hidden="true">' + _fldRatEsc(u.name || "A brigade") + '</b>'
        + '<span aria-hidden="true">' + _fldRatEsc(label) + '</span>'
        + '<span aria-hidden="true" style="margin-left:auto;font-weight:bold;letter-spacing:.04em' + (live ? "" : ";opacity:.55") + '">' + (glow ? "⚡ " : "") + state + '</span>'
        + '</div>';
    }
  }
  if (!rows) return "";
  return '<div role="list" aria-label="X-Factor showcase — live activation state">' + rows + '</div>';
}

/* the HUD disclosure block (appended inside the badge-chip read-out): the badge
   gallery + the X-Factor showcase behind two T29-idiom native buttons. */
function fldBadgeDeskHudHtml(u) {
  if (!u || !u.badges || !u.badges.length || !_ratData()) return "";
  var bgOpen = !!(typeof __FIELD !== "undefined" && __FIELD && __FIELD._bgOpen);
  var xfOpen = !!(typeof __FIELD !== "undefined" && __FIELD && __FIELD._xfShowOpen);
  var gallery = fldBadgeGalleryHtml(u);
  var catalog = fldBadgeGalleryHtml(null);
  var showcase = fldXfShowcaseHtml();
  var btn = 'font:inherit;font-size:11px;padding:5px 9px;border:1px solid #745e3f;border-radius:4px;background:#1a1510;color:#d8c9a3;cursor:pointer;margin-right:5px';
  return '<div style="margin-top:4px">'
    + '<button id="fldBgBtn" type="button" aria-expanded="' + (bgOpen ? "true" : "false") + '" aria-controls="fldBgPanel" style="' + btn + '">'
    + (bgOpen ? "Hide badge gallery" : "Badge gallery&hellip;") + '</button>'
    + '<button id="fldXfBtn" type="button" aria-expanded="' + (xfOpen ? "true" : "false") + '" aria-controls="fldXfPanel" style="' + btn + '">'
    + (xfOpen ? "Hide X-Factors" : "X-Factors&hellip;") + '</button>'
    + '<div id="fldBgPanel" role="region" aria-label="Badge gallery"' + (bgOpen ? '' : ' hidden') + '>'
    + gallery
    + '<div style="font-size:9px;opacity:.72;letter-spacing:.06em;text-transform:uppercase;margin-top:6px">The badge catalog</div>'
    + catalog
    + '</div>'
    + '<div id="fldXfPanel" role="region" aria-label="X-Factor showcase"' + (xfOpen ? '' : ' hidden') + '>'
    + (showcase || '<div style="font-size:10px;opacity:.7;margin-top:3px">No brigade on this field carries an X-Factor.</div>')
    + '</div>'
    + '</div>';
}

/* T29-idiom delegated toggles (registered once at module eval; survive every
   #fldHud innerHTML rebuild; native keyboard activation included). */
document.addEventListener("click", function (e) {
  var t = e.target && e.target.closest ? e.target.closest("#fldBgBtn, #fldXfBtn") : null;
  if (!t) return;
  if (typeof __FIELD === "undefined" || !__FIELD) return;
  if (t.id === "fldBgBtn") __FIELD._bgOpen = !__FIELD._bgOpen;
  else __FIELD._xfShowOpen = !__FIELD._xfShowOpen;
  if (typeof fldRenderHud === "function") fldRenderHud();
});

/* S22-class focus preservation for the two disclosure buttons (the T29 wrapper idiom). */
if (typeof fldRenderHud === "function") {
  fldRenderHud = (function (orig) {
    return function () {
      var focusId = "";
      try {
        var a = document.activeElement;
        if (a && (a.id === "fldBgBtn" || a.id === "fldXfBtn")) focusId = a.id;
      } catch (e) {}
      var r = orig.apply(this, arguments);
      if (focusId) {
        try { var b = document.getElementById(focusId); if (b) b.focus(); } catch (e2) {}
      }
      return r;
    };
  })(fldRenderHud);
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
   fldXFactorApplyCmd guard are exact no-ops). (The R-6 sweep then assigned X-Factors to the shipped
   rosters — the byte-identity guarantee holds per-unit: only badge carriers move.) NO RNG -> seed-replayable.

   TWO-LAYER MODEL (kept deliberately distinct from R-3): the R-3 static fldBadgeFactor remains the
   BASELINE (an X-Factor badge with an fldLever still contributes its capped static factor);
   R-4 adds the situational SURGE on top. _fldXFactorInZone owns the strict ACTIVATION zone (alive,
   not routing, live morale/ammo reads); since R-7 (D481) _fldBadgeTrig gates the static path too,
   on absent-state-tolerant predicates — two consumers, one situation vocabulary, different strictness.
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
      else if (u._spdMul != null) u._spdMul = _fldXfDecay(u._spdMul, 1, dt);   // R-6 bug-hunt (LOW): a NON-speed X-Factor activating must decay any DORMANT speed-surge toward identity (only the live channel surges), so a unit carrying both a speed + a non-speed X-Factor can't keep a stale _spdMul
      u._xfGlow = pos ? 1 : 0;                           // glow the heroic surge; the named-flaw drag does not glow
      if (u._xfOn !== active.key) {                      // one-shot on the rising edge (re-arms after leaving the zone)
        u._xfOn = active.key;
        var line = (pos ? "⚡ " : "") + (u.name || "A brigade") + " — " + fldBadgeLabel(active) + (pos ? "!" : ".");
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

/* ===========================================================================
   R-5 · THE PROSOPOGRAPHY SCALE-OUT — bulk per-person derivation + LAZY MATERIALIZATION.
   (design law: RATING-SYSTEM-DESIGN.md §5/§8/§15; DECISIONS D101)

   THE LAZY-MATERIALIZATION KEYSTONE (§8): a brigade TOKEN carries ONE aggregate number — fldMenMeanOVR
   (its men's mean OVR), derived O(1) from rank-mix + xp + arm + year, NEVER by building N rows and
   averaging. Per-person rows are materialized ON DEMAND: fldMaterializePerson builds exactly ONE row
   (inspect / play-as), and fldBrigadeMuster builds a HARD-CAPPED (<=6) representative sample, never u.men
   rows (a 10,000-man brigade still builds <=6). The mean is always RECOMPUTABLE, never the source of truth,
   so a future zoom-to-regiment is a roll-up of materialized rows (not a stored mean). NO RNG (deterministic
   seeded jitter only) -> reproducible; PURE READS only (no scoreboard write) -> byte-identical. No shipped
   scenario assigns bulk persons yet, so every battle is byte-for-byte identical (this is data + display,
   not a combat path). Latent-command promotion (fldPromotePerson) is the play-as-anyone hook; fldPersonTeam
   is the EA-style "team" journey hook; fldProvenanceStyle makes Inferred ratings visually distinct (§10).
   =========================================================================== */

/* the men's-mean OVR for a brigade TOKEN — ONE number, O(1), no N-row build. Anchored to the AUTHORED
   man-quality (64 + (xp-2)*8 — the same xp->man-quality the brigade combat OVR uses), plus branch/year drift
   + a small DETERMINISTIC per-brigade jitter (so two same-xp brigades differ). Clamped [20,88]: a brigade
   AVERAGE never reaches the Legendary individual ceiling. Distinct from fldUnitRatingOVR (which folds in
   materiel + live condition + the colonel's aura) — this is the men's prosopography seasoning alone. Pure. */
function fldMenMeanOVR(u, year) {
  if (!u) return FLDR.ANCHOR;
  var xp = _fldRatNum(u.xp, 2);
  var base = FLDR.ANCHOR + (xp - 2) * 8;
  var tilt = _fldRatBranchTilt(u.arm === "art" ? "art" : (u.arm === "cav" ? "cav" : "inf"));
  var drift = (year != null) ? _fldRatYearDrift(year) : 0;
  var jit = fldRatSeededJitter("men:" + (u.id || u.name || "bde"), 3);   // +/-3, deterministic per brigade id
  var v = Math.round(base + tilt + drift + jit);
  return v < 20 ? 20 : (v > 88 ? 88 : v);
}

/* the EA-style "team" (journey-mode hook, §8): a person's army/corps allegiance — the anchor a play-as-anyone
   career starts from. From an authored record's team{} when present, else a minimal {side}. */
function fldPersonTeam(rec) {
  if (!rec) return null;
  if (rec.team && typeof rec.team === "object") return {
    side: rec.side || rec.team.side || null,
    army: rec.team.army || null,
    corps: rec.team.corps || null,
    division: rec.team.division || null,
    brigade: rec.team.brigade || null,
    regiment: rec.team.regiment || null,
    company: rec.team.company || null
  };
  return { side: rec.side || null, army: null, corps: null };
}

/* deterministic period-name synthesis for a GENERATED (unnamed) soldier — a stand-in until the real
   muster-roll-names pass (§15 R9). NO RNG: the name is a stable function of the pid hash. */
var _FLD_FIRST = ["James", "John", "William", "Charles", "George", "Henry", "Thomas", "Samuel", "Robert", "Edward", "Joseph", "Andrew", "Francis", "Daniel", "Albert", "Benjamin", "Patrick", "Michael", "David", "Isaac", "Nathaniel", "Hiram", "Elias", "Reuben"];
var _FLD_LAST = ["Carter", "Mason", "Bryant", "Holloway", "Tanner", "Whitlock", "Abbott", "Crandall", "Dudley", "Larkin", "Mercer", "Norton", "Osgood", "Parrish", "Sawyer", "Tilden", "Underwood", "Wexler", "Yates", "Bishop", "Conley", "Foster", "Hale", "Kendrick"];
function _fldSynthName(seed) {
  var h = _fldRatHash("name:" + String(seed));
  return _FLD_FIRST[h % _FLD_FIRST.length] + " " + _FLD_LAST[(h >>> 8) % _FLD_LAST.length];
}

/* LAZY MATERIALIZATION — build exactly ONE person row, on demand (inspect / play-as). Reuses the R-0
   derivation (authored persona pass-through with its provenance, else GENERATED from rank/branch/year +
   deterministic jitter), then projects the headline + dual OVR + grade. A generated row gets a deterministic
   synthesized name + Inferred provenance; latentCommand exposes the dormant command attribute (the play-as
   promotion seed, §2). Pure; nothing stored. null-safe. */
function fldMaterializePerson(spec, year) {
  if (!spec) return null;
  var der = fldDerivePerson(spec, year);
  if (!der || !der.persona) return null;
  // DEFENSIVE COPY (R-5 bug-hunt, LOW): fldDerivePerson's AUTHORED branch returns the record's persona BY
  // REFERENCE (the live GAME_DATA.ratings object). Copy it at the materialization boundary so a materialized
  // person NEVER aliases canonical data — a future play-as/career path that writes persona.* (XP/wound/dev-trait)
  // must not silently rewrite the source-of-truth ratings + de-sync the deterministic sim. Persona attrs are flat
  // numeric scalars, so a shallow copy suffices; this is a pure read-path add (returned numbers are unchanged).
  var pcopy = {}; for (var pk in der.persona) { if (der.persona.hasOwnProperty(pk)) pcopy[pk] = der.persona[pk]; }
  var ovr = fldPersonaOVR(pcopy), dual = fldDualOVR(pcopy), grade = fldRatingGrade(ovr);
  var rank = spec.rank || (der.generated ? "Private" : null);
  var pid = spec.pid || spec.id || ("p:" + (spec.name || rank || "x"));
  var name = spec.name || spec.short || (der.generated ? _fldSynthName(pid) : (spec.fullName || pid));
  return {
    pid: pid, name: String(name), rank: rank, branch: spec.branch || "inf", role: spec.role || null,
    side: spec.side || null, persona: pcopy, ovr: ovr, dual: dual, grade: grade,
    provenance: der.provenance, generated: !!der.generated,
    latentCommand: Math.round(_fldRatNum(pcopy.command, FLDR.ANCHOR)),   // the dormant command seed (play-as promotion)
    team: fldPersonTeam(spec), sources: (spec.sources && spec.sources.slice) ? spec.sources.slice() : []   // copy the sources array too (same aliasing class)
  };
}

/* a defensive shallow clone of a person row (persona + sources copied, not shared) — so a no-op promotion
   still honors fldPromotePerson's "returns a NEW person; never mutates the input" contract (R-5 bug-hunt LOW). */
function _fldClonePerson(person) {
  if (!person) return person;
  var out = {}; for (var k in person) { if (person.hasOwnProperty(k)) out[k] = person[k]; }
  if (person.persona) { var np = {}; for (var a in person.persona) { if (person.persona.hasOwnProperty(a)) np[a] = person.persona[a]; } out.persona = np; }
  if (person.sources && person.sources.slice) out.sources = person.sources.slice();
  return out;
}

/* LATENT-COMMAND PROMOTION (play-as-anyone, §2): activate a person's dormant command for a higher billet.
   Promotion lifts the billet-relevant axes (command/tactical/discipline/charisma) by the rank-base delta —
   the latent capacity always in the persona surfaces as he climbs; combat axes (marks/vigor) are unchanged.
   Returns a NEW person (pure; never mutates the input). The recomputed OVR + grade reflect the new billet;
   officerTier flips true at/above Captain (the tier where command becomes the dominant attribute). */
function fldPromotePerson(person, toRank) {
  if (!person) return person;
  if (!person.persona) return _fldClonePerson(person);   // malformed (no persona to promote) -> a clone, honoring the no-mutate contract (R-5 bug-hunt LOW)
  // UNKNOWN-RANK GUARD (R-5 bug-hunt LOW): an unmapped/typo'd/null toRank would make _fldRatRankBase fall back to
  // the 64 anchor -> a large unearned lift + a false officerTier. Require a real rankBase key; else a clean no-op clone.
  var rd = _ratData(), rb = rd && rd.rankBase;
  if (toRank == null || !(rb && typeof rb[toRank] === "number")) return _fldClonePerson(person);
  var delta = _fldRatRankBase(toRank) - _fldRatRankBase(person.rank);
  var lead = { command: 1, tactical: 1, discipline: 0.6, charisma: 0.5 };   // the billet-relevant lift weights
  var np = {}; for (var k in person.persona) { if (person.persona.hasOwnProperty(k)) np[k] = person.persona[k]; }
  for (var a in lead) { if (lead.hasOwnProperty(a)) { var v = _fldRatNum(np[a], FLDR.ANCHOR) + delta * lead[a]; np[a] = v < 20 ? 20 : (v > 99 ? 99 : Math.round(v)); } }
  var ovr = fldPersonaOVR(np), out = {};
  for (var p in person) { if (person.hasOwnProperty(p)) out[p] = person[p]; }
  out.persona = np; out.rank = toRank; out.ovr = ovr; out.dual = fldDualOVR(np); out.grade = fldRatingGrade(ovr);
  out.sources = (person.sources && person.sources.slice) ? person.sources.slice() : person.sources;   // don't propagate a shared sources ref (R-5 bug-hunt LOW)
  out.officerTier = _fldRatRankBase(toRank) >= _fldRatRankBase("Captain"); out.promotedFrom = person.rank;
  return out;
}

/* the muster slot template (a representative captain / sergeant / private). Data-driven (data override),
   with a code fallback so a build without it still works. */
function _fldMusterTemplate() {
  var d = _ratData();
  if (d && Array.isArray(d.musterTemplate) && d.musterTemplate.length) return d.musterTemplate;
  return [
    { key: "cmd", rank: "Captain", role: "company commander" },
    { key: "nco", rank: "Sergeant", role: "file closer" },
    { key: "pvt", rank: "Private", role: "in the ranks" }
  ];
}
/* a brigade's representative MUSTER — the men-mean OVR + a HARD-CAPPED (<=6) lazily-materialized sample,
   NEVER u.men rows (the §8 scale rule). `represents` records the true head-count the sample stands in for.
   Pure read; deterministic per brigade id. null-safe. */
function fldBrigadeMuster(u, n, year) {
  if (!u) return null;
  var CAP = 6;
  n = (typeof n === "number" && n > 0) ? (n < CAP ? n : CAP) : 3;
  var mean = fldMenMeanOVR(u, year);
  var tmpl = _fldMusterTemplate(), sample = [];
  var branch = (u.arm === "art") ? "art" : (u.arm === "cav" ? "cav" : "inf");
  for (var i = 0; i < n && i < tmpl.length; i++) {
    var t = tmpl[i];
    var spec = { pid: (u.id || u.name || "bde") + ":" + t.key, rank: t.rank, branch: branch, role: t.role, side: u.side };
    if (i === 0 && u.commander) spec.name = String(u.commander);   // the named brigade leader fills the command slot
    var pers = fldMaterializePerson(spec, year);
    if (pers) sample.push(pers);
  }
  return { menMeanOVR: mean, grade: fldRatingGrade(mean), provenance: "Inferred", sample: sample, represents: _fldRatNum(u.men, 0), cap: CAP };
}

/* the Inferred-vs-Verified VISUAL DISTINCTION (§10): the player must never mistake a generated number for a
   sourced one. Verified -> a SOLID bar; Inferred -> a HATCHED (striped) bar; Disputed -> a dashed outline.
   The PATTERN + the glyph + the word carry the meaning (CVD-safe; colour is decorative). Returns a style
   descriptor (CSS fill + glyph + label + title) reused by every read-out surface. */
function fldProvenanceStyle(prov, color) {
  var c = color || "#8a7350";
  if (prov === "Verified") return { fill: "background:" + c, glyph: "✓", label: "sourced", title: "Verified — 2+ sources" };
  if (prov === "Disputed") return { fill: "background:" + c + ";outline:1px dashed " + c + ";outline-offset:1px", glyph: "?", label: "disputed", title: "Disputed — sources conflict" };
  return { fill: "background:repeating-linear-gradient(45deg," + c + "," + c + " 2px,transparent 2px,transparent 5px)", glyph: "~", label: "derived", title: "Inferred — derived, not directly sourced" };   // hatched: reads distinct WITHOUT relying on hue
}

/* the COMPACT muster line for the in-battle inspect HUD (R-5): the men's mean OVR + grade with a
   PROVENANCE-HATCHED accent (the men's number is Inferred/derived — visually distinct from a sourced one).
   TRIPLE-ENCODED (number + letter + word) + CVD-safe (the hatch + glyph carry meaning, not colour). Pure
   display; "" when ratings data absent (byte-identical). Appended after the R-2 combat-OVR line. */
function fldMusterHudLine(u) {
  if (!u || !_ratData()) return "";
  var m = fldBrigadeMuster(u, 3);
  if (!m) return "";
  var g = m.grade, ps = fldProvenanceStyle("Inferred", g.color);
  return '<div style="display:flex;align-items:center;gap:7px;margin-top:4px">'
    + '<span aria-hidden="true" title="' + _fldRatEsc(ps.title) + '" style="display:inline-block;width:4px;height:18px;border-radius:2px;' + ps.fill + '"></span>'
    + '<span style="font-weight:bold;font-size:14px;line-height:1">' + m.menMeanOVR + '</span>'
    + '<span style="font-size:9px;opacity:.65;letter-spacing:.05em">MEN OVR</span>'/* wcag-auditor: contrast fix opacity .6→.65 for AA compliance (was 4.19:1, now ~4.64:1 vs #2b2016 panel ground) */
    + '<span style="font-size:11px;opacity:.85">Grade <b>' + _fldRatEsc(g.letter) + '</b> &middot; ' + _fldRatEsc(g.word) + '</span>'
    + '<span style="font-size:9px;opacity:.65;margin-left:auto">' + ps.glyph + ' ' + _fldRatEsc(ps.label) + '</span>'/* wcag-auditor: contrast fix opacity .55→.65 for AA compliance (was 3.78:1, now ~4.64:1 vs #2b2016 panel ground) */
    + '</div>';
}

/* fldMusterRollHtml(u): the FULL "Muster Roll" inspect panel — the men-mean OVR + the lazily-materialized
   representative sample (each a real materialized person row: OVR + grade + name + rank + provenance bar).
   The EA-roster inspect / journey-mode character-sheet surface (ready; the live HUD wires the compact line).
   TRIPLE-ENCODED + CVD-safe + WCAG-AA. Pure display; "" when ratings data absent (byte-identical). */
function fldMusterRollHtml(u) {
  if (!u || !_ratData()) return "";
  var m = fldBrigadeMuster(u, 3);
  if (!m || !m.sample.length) return "";
  function row(p) {
    var ps = fldProvenanceStyle(p.provenance, p.grade.color);
    return '<div style="display:flex;align-items:center;gap:8px;padding:3px 0;border-top:1px solid rgba(120,92,62,.4)">'
      + '<span aria-hidden="true" title="' + _fldRatEsc(ps.title) + '" style="flex:none;display:inline-block;width:5px;height:24px;border-radius:2px;' + ps.fill + '"></span>'
      + '<span style="flex:none;font-weight:bold;font-size:15px;width:26px;text-align:right">' + p.ovr + '</span>'
      + '<span style="flex:none;font-size:11px"><b>' + _fldRatEsc(p.grade.letter) + '</b></span>'
      + '<span style="flex:1 1 auto;min-width:0"><span style="font-size:12px">' + _fldRatEsc(p.name) + '</span>'
      + '<span style="font-size:10px;opacity:.65"> &middot; ' + _fldRatEsc(p.rank || "") + (p.role ? " &middot; " + _fldRatEsc(p.role) : "") + '</span></span>'
      + '<span style="flex:none;font-size:9px;opacity:.65">' + ps.glyph + ' ' + _fldRatEsc(ps.label) + '</span>'/* wcag-auditor: contrast fix opacity .6→.65 for AA compliance (was 4.19:1, now ~4.64:1 vs #2b2016 panel ground) */
      + '</div>';
  }
  var rows = ""; for (var i = 0; i < m.sample.length; i++) rows += row(m.sample[i]);
  var mg = m.grade, mps = fldProvenanceStyle("Inferred", mg.color);
  return '<div style="margin-top:8px;padding:8px 10px;border:1px solid var(--rule);border-radius:6px;background:rgba(0,0,0,.12)">'
    + '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px">'
    +   '<span style="font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:#b3925e">Muster Roll</span>'
    +   '<span style="font-size:10px;opacity:.7">' + _fldNumComma(m.represents) + ' men &middot; sample of ' + m.sample.length + '</span>'
    + '</div>'
    + '<div style="display:flex;align-items:center;gap:7px;margin-bottom:3px">'
    +   '<span aria-hidden="true" title="' + _fldRatEsc(mps.title) + '" style="display:inline-block;width:5px;height:18px;border-radius:2px;' + mps.fill + '"></span>'
    +   '<span style="font-weight:bold;font-size:15px">' + m.menMeanOVR + '</span><span style="font-size:9px;opacity:.65">MEN OVR</span>'/* wcag-auditor: contrast fix opacity .6→.65 for AA compliance (was 4.19:1, now ~4.64:1 vs #2b2016 panel ground) */
    +   '<span style="font-size:11px;opacity:.85">Grade <b>' + _fldRatEsc(mg.letter) + '</b> &middot; ' + _fldRatEsc(mg.word) + '</span>'
    + '</div>'
    + rows
    + '<div style="font-size:9.5px;opacity:.65;margin-top:5px;line-height:1.4">Derived from the brigade&rsquo;s seasoning &amp; arm — a hatched bar marks a derived (Inferred) rating, a solid bar a sourced one. Rows are materialized on inspect, never stored.</div>'/* wcag-auditor: contrast fix opacity .55→.65 for AA compliance (was 3.78:1, now ~4.64:1 vs #2b2016 panel ground) */
    + '</div>';
}
