/* ===========================================================================
   S2 m5 · 35-command.js — COMMAND: the NAMED-GENERALS system (§8.24/§8.58 /
   D31.4/D38.2 / GRAND-STRATEGY-PLAN §19). The LAST big S2 sub-system.

   The player is the President; he APPOINTS, PROMOTES, and RELIEVES the commanding
   general of his side's principal army. Each historical commander carries:
       - traits: skill / aggression / caution (the way he fights),
       - an EVOLVING reputation (rises with victory, falls with defeat), and
       - ambition (the McClellan problem: a popular, politically dangerous general
         is COSTLY to relieve — it spends the President's political capital).

   THE KEY WIRING (the whole point of the milestone): the sitting general's
   LEADERSHIP rating (skill + reputation) blended with the cabinet's competence
   (cabinetLeadership, m1) feeds the bridge's LEADERSHIP facet —
   85-battle-bridge.js consumed a fixed `var leadership = 64;` placeholder (D49.7,
   confirmed not-yet-consumed); m5 replaces it with commandLeadership(C), ANCHORED
   at 64 so a default/historical command plays ≈ Classic (the A6a/D47.1 anchoring
   lesson). A brilliant general lifts the army you field; a poor or discredited one
   drags it. The general's aggression/caution also nudges the auto-resolve margin
   (attack vs. defend). And commandLeadership feeds the m3 leader-morale layer, so a
   beloved general lifts the troops and the home front.

   THE DATE-AWARE DEFAULT (the McClellan problem, automatic): if the player never
   touches Command, the HISTORICAL commander for the strategic date holds the post
   (Scott → McClellan → Burnside → Hooker → Meade → Grant for the US; Beauregard →
   J.E. Johnston → Lee for the CS) — so a US player who leaves it alone is dragged
   by McClellan's caution until he spends the capital to relieve him, exactly as
   Lincoln was. Appointing a specific general LOCKS the post to your choice.

   Data: data/generals.json -> GAME_DATA.generals (Verified command dates/ranks;
   trait numbers Inferred designer calibration from modern, anti-Lost-Cause
   consensus; voice/bio web-grounded + adversarially verified). Falls back
   gracefully (commandLeadership -> cabinetLeadership -> 64) if the data is absent.

   EXTENDS: adds C.president.command (plain data; rides the save, no _SAVE_VER bump;
   idempotent cmdInit = lazy migration). cmdInit/cmdOnResolve registered in 90
   (cmdOnResolve AFTER cab, BEFORE morale so the fresh reputation feeds the leader
   layer the same turn). New "Command" desk tab (13th) declared in 30/_wdRefresh.
   Bare-name globals (G, GAME_DATA — never window.G); _cmd/cmd prefix; render NEVER
   mutates or saves; the Wire fns + the tick do.
   =========================================================================== */

/* ---- relief cost (political capital) by the general's relief class. The
   McClellan problem: a politically dangerous general is dear to remove. Scaled up
   when a popular general (high reputation) is at the height of his prestige. ---- */
var _cmdRELIEF_BASE = { easy: 4, costly: 12, "very-costly": 22 };

/* data/generals.json -> GAME_DATA.generals (or null). */
function _cmdData() { return gameData("generals"); }

/* The side's full general roster (array) — empty if the data is absent. */
function _cmdSideGenerals(side) {
  var s = (side === "CS") ? "CS" : "US";
  var d = _cmdData();
  if (d && d.sides && d.sides[s] && d.sides[s].generals && d.sides[s].generals.length) return d.sides[s].generals;
  return [];
}

function _cmdById(side, id) {
  var r = _cmdSideGenerals(side);
  for (var i = 0; i < r.length; i++) if (r[i] && r[i].id === id) return r[i];
  return null;
}

var _cmdEsc = htmlEsc;

/* Strip a disambiguation suffix ("Johnston-J" -> "Johnston") for display + portrait. */
function _cmdName(gen) {
  if (!gen) return "";
  return String(gen.name || "").replace(/-[A-Za-z]$/, "");
}

/* Strategic date / tenure helpers — delegate to shared 01-utils.js. */
function _cmdDateNum(d) { return dateToNum(d); }
function _cmdYM(t) { return tenureToNum(t); }

/* Is this general alive / not-yet-removed and within his availability window at `date`? */
function _cmdAlive(gen, date) {
  if (!gen) return false;
  var now = _cmdDateNum(date);
  var from = gen.availableFrom ? _cmdYM(gen.availableFrom) : 0;
  var until = gen.availableUntil ? _cmdYM(gen.availableUntil) : Infinity;
  return now >= from && now <= until;
}

/* The HISTORICAL commander of the side's principal army at strategic date `date`:
   the latest command tenure (commandFrom..commandTo) whose window contains the date
   — so the chain resolves to ONE current holder (the same idiom as _cabHolder). */
function _cmdHistoricalDefault(side, date) {
  var roster = _cmdSideGenerals(side), now = _cmdDateNum(date), best = null, bestStart = -1;
  for (var i = 0; i < roster.length; i++) {
    var g = roster[i];
    if (!g || !g.commandFrom) continue;
    var st = _cmdYM(g.commandFrom);
    var en = g.commandTo ? _cmdYM(g.commandTo) : Infinity;
    if (st <= now && now <= en && st > bestStart) { best = g; bestStart = st; }
  }
  // No tenure spans the date. BEFORE the first tenure -> the earliest commander (the war's opening);
  // AFTER the last tenure (a campaign that runs past the war's end) -> the LAST commander, for
  // continuity, NOT a jump back to the first. (Bug-hunt D53.5.)
  if (!best) {
    var earliest = null, eStart = Infinity, latest = null, lEnd = -1;
    for (var j = 0; j < roster.length; j++) {
      var b = roster[j];
      if (!b || !b.commandFrom) continue;
      var bs = _cmdYM(b.commandFrom), be = b.commandTo ? _cmdYM(b.commandTo) : Infinity;
      if (bs < eStart) { earliest = b; eStart = bs; }
      if (be > lEnd) { latest = b; lEnd = be; }
    }
    best = (now > lEnd) ? latest : earliest;
  }
  return best;
}

/* The id of the active commanding general: the player's appointed man if still
   valid at the date, else the historical default. */
function cmdActiveId(C) {
  if (!C) return null;
  var side = (C.side === "CS") ? "CS" : "US";
  var P = C.president; if (!P) return null;
  var cmd = P.command;
  var date = P.date;
  if (cmd && cmd.fieldGeneral) {
    var g = _cmdById(side, cmd.fieldGeneral);
    if (g && _cmdAlive(g, date)) return cmd.fieldGeneral;   // your appointee, while he lives / serves
  }
  var def = _cmdHistoricalDefault(side, date);
  return def ? def.id : null;
}

function cmdActiveGeneral(C) {
  if (!C) return null;
  var id = cmdActiveId(C);
  return id ? _cmdById((C.side === "CS") ? "CS" : "US", id) : null;
}

/* ---- cmdInit: idempotent. C.president.command holds the appointment + the dynamic
   per-general reputation. Seeds each general's reputation from his data startValue
   ONCE (never resets — reputation evolves). Registered in _t1InitAll AFTER cabInit. ---- */
function cmdInit(C) {
  if (!C) return;
  if (typeof presInit === "function") presInit(C);
  if (!C.president) return;
  var P = C.president, side = (C.side === "CS") ? "CS" : "US";
  // reject a primitive / array masquerading as the command object (the D49.2 idiom).
  if (Array.isArray(P.command) || !P.command || typeof P.command !== "object") {
    P.command = { fieldGeneral: null, reputation: {}, appointedTurn: -1, history: [] };
  }
  var cmd = P.command;
  if (typeof cmd.fieldGeneral !== "string") cmd.fieldGeneral = null;   // null = follow history
  if (Array.isArray(cmd.reputation) || !cmd.reputation || typeof cmd.reputation !== "object") cmd.reputation = {};
  if (typeof cmd.appointedTurn !== "number") cmd.appointedTurn = -1;
  if (!Array.isArray(cmd.history)) cmd.history = [];
  // Q9 (D102): the promotion economy's state — a seniority currency (the second axis beside political capital) +
  // the per-general promoted grade. Seeded ONCE (idempotent); plain data riding the save (no _SAVE_VER bump).
  // Empty `promotions` -> _cmdPromoteSkillLift is 0 -> byte-identical until the player promotes.
  if (typeof cmd.seniority !== "number" || !(cmd.seniority >= 0)) { var _pc = _cmdPromoCfg(); cmd.seniority = (_pc && typeof _pc.seniorityStart === "number") ? _pc.seniorityStart : 18; }
  else { var _pc2 = _cmdPromoCfg(); cmd.seniority = Math.max(0, Math.min((_pc2 && typeof _pc2.seniorityCap === "number") ? _pc2.seniorityCap : 60, cmd.seniority)); }   // Q9 bug-hunt (LOW): re-clamp a valid-but-out-of-band stored value (a tampered/stale save) to the cap on LOAD, not only on the next resolve — normal play (accrual already capped) is byte-identical
  if (Array.isArray(cmd.promotions) || !cmd.promotions || typeof cmd.promotions !== "object") cmd.promotions = {};
  // seed reputation for every general on this side, once (idempotent: only if absent).
  var roster = _cmdSideGenerals(side);
  for (var i = 0; i < roster.length; i++) {
    var g = roster[i]; if (!g || !g.id) continue;
    var r = cmd.reputation[g.id];
    if (typeof r !== "number" || !(r >= 0 && r <= 100)) {
      cmd.reputation[g.id] = (typeof g.reputation === "number") ? Math.max(0, Math.min(100, g.reputation)) : 60;
    }
  }
  // D105 (LIVE DEV-TRAITS): the dev-track — a PURE observation record of each general's reputation arc over the
  // campaign (start / peak / low / battles). Seeded ONCE, idempotent; NOTHING in combat reads it (it drives the
  // Career-Arc read-out only) -> byte-identical. devTrack[id].start anchors the dev-trait's RELATIVE ceiling/floor
  // band (a fixed value, so the band does not drift as reputation evolves). The seed mirrors the reputation seed.
  if (Array.isArray(cmd.devTrack) || !cmd.devTrack || typeof cmd.devTrack !== "object") cmd.devTrack = {};
  for (var k = 0; k < roster.length; k++) {
    var dg = roster[k]; if (!dg || !dg.id) continue;
    var tr = cmd.devTrack[dg.id];
    if (!tr || typeof tr !== "object" || !isFinite(tr.start)) {
      var rp = _cmdReputation(C, dg.id);
      cmd.devTrack[dg.id] = { start: rp, peak: rp, low: rp, battles: 0 };
    } else {
      // D105 bug-hunt: SANITIZE a stale/tampered/imported record on LOAD (the Q9 seniority-reclamp pattern). start
      // is the band anchor (load-bearing); peak/low/battles are observation-only but must stay finite for the
      // read-out. A legitimately-seeded record is already in range -> this is a no-op (byte-identical normal play).
      tr.start = Math.max(0, Math.min(100, tr.start));
      tr.peak = isFinite(tr.peak) ? Math.max(0, Math.min(100, tr.peak)) : tr.start;
      tr.low = isFinite(tr.low) ? Math.max(0, Math.min(100, tr.low)) : tr.start;
      tr.battles = (isFinite(tr.battles) && tr.battles >= 0) ? Math.floor(tr.battles) : 0;
    }
  }
  // if the player's appointee has died / left the war, release the post back to history.
  if (cmd.fieldGeneral) {
    var ap = _cmdById(side, cmd.fieldGeneral);
    if (!ap || !_cmdAlive(ap, P.date)) cmd.fieldGeneral = null;
  }
  // the cached handover-detection id rides the save too; clear it if it is stale (a removed/
  // wrong-side general after a roster/data change) so handover logging starts clean. A
  // just-died-but-still-in-roster id is KEPT — the next tick needs it to log the succession. (D53.6.)
  if (cmd._activeId && !_cmdById(side, cmd._activeId)) cmd._activeId = null;
}

/* Current (evolving) reputation of a general, 0-100. */
function _cmdReputation(C, id) {
  if (!C || !C.president || !C.president.command) return 60;
  var r = C.president.command.reputation[id];
  if (typeof r === "number" && r >= 0 && r <= 100) return r;
  var g = _cmdById((C.side === "CS") ? "CS" : "US", id);
  return (g && typeof g.reputation === "number") ? g.reputation : 60;
}

/* ---- R-1 (D94 RATING SYSTEM) · the persona-DERIVED operational skill. When a documented
   persona is linked (data/ratings.json -> generalPersonas, keyed by the general id), the
   `skill` is DERIVED from it (command/tactical/discipline -> fldOfficerSkillSeed), so the
   documented persona — not a static hand-typed number — is the SOURCE feeding _cmdGenRating
   -> commandLeadership -> the bridge/auto-resolve/conditioning. The personas are calibrated
   so the derived skill reproduces the Verified gen.skill EXACTLY -> the whole strategic layer
   stays byte-identical and the appoint-pool words still match history. A general with NO
   linked persona keeps his authored gen.skill -> byte-identical for unrated generals. The
   T14 rating fns load after this module; the typeof guards keep us safe if they are absent. ---- */
function _cmdGenPersona(gen) {
  if (!gen || !gen.id) return null;
  var d = gameData("ratings");
  if (!d || !d.generalPersonas) return null;
  var rec = d.generalPersonas[gen.id];
  return (rec && rec.persona) ? rec : null;
}
function _cmdEffectiveSkill(gen, C) {
  var base;
  var rec = _cmdGenPersona(gen);
  if (rec && typeof fldOfficerSkillSeed === "function") {
    var seed = fldOfficerSkillSeed(rec.persona);
    base = (typeof seed === "number" && isFinite(seed)) ? Math.round(seed) : ((gen && typeof gen.skill === "number") ? gen.skill : 64);
  } else {
    base = (gen && typeof gen.skill === "number") ? gen.skill : 64;
  }
  // Q9 (D102): a PROMOTION lifts effective skill — a small BOUNDED rank-grade delta that reaches the army ONLY
  // through the existing _cmdGenRating -> commandLeadership pipe (an INPUT the bridge already reads; never the
  // scoreboard, honoring D74/D94). The lift is 0 when the general is un-promoted (no C, or no stored promotion),
  // so every pre-Q9 reading is BYTE-IDENTICAL. clamp to 100.
  var lift = (C && typeof _cmdPromoteSkillLift === "function") ? _cmdPromoteSkillLift(C, gen) : 0;
  var v = base + lift;
  return v > 100 ? 100 : v;
}

/* A general's LEADERSHIP rating (0-100): operational skill blended with his current
   standing. A neutral man (skill 64, reputation 64) rates 64 — the bridge anchor. */
function _cmdGenRating(C, gen) {
  if (!gen) return 64;
  var skill = _cmdEffectiveSkill(gen, C);   // Q9: C carries the promotion lift (0 / byte-identical when un-promoted)
  var rep = _cmdReputation(C, gen.id);
  return 0.55 * skill + 0.45 * rep;
}

/* ---- Q7 (D94 GM layer §13): the DUAL Attack/Defend OVR — the situational truth beside the headline.
   The headline _cmdGenRating is "general competence"; the Attack/Defend pair shows where the man's gift
   lies (the audacious Jackson grades higher on the attack; the cautious McClellan higher on the defensive —
   both rated personas; an unrated general tilts from his generals.json aggression/caution). Tilt source: the documented persona's
   aggression/initiative & resolve/grit (64-anchored, via fldDualTilt) when rated; else the general's own
   aggression/caution from generals.json (50-anchored). Pure read-out — never seeds the sim. ---- */
function _cmdGenDualOVR(C, gen) {
  var ovr = Math.round(_cmdGenRating(C, gen));
  var rec = (typeof _cmdGenPersona === "function") ? _cmdGenPersona(gen) : null;
  var atkT, defT;
  if (rec && rec.persona && typeof fldDualTilt === "function") {
    var t = fldDualTilt(rec.persona); atkT = t.attack; defT = t.defend;
  } else {
    var agg = (gen && typeof gen.aggression === "number") ? gen.aggression : 50;
    var cau = (gen && typeof gen.caution === "number") ? gen.caution : 50;
    atkT = Math.round((agg - 50) * 0.18); defT = Math.round((cau - 50) * 0.18);
  }
  function _cl(v) { return v < 0 ? 0 : (v > 100 ? 100 : v); }
  return { headline: ovr, attack: _cl(ovr + atkT), defend: _cl(ovr + defT) };
}

/* ===========================================================================
   Q9 (D102) · THE GM PROMOTION ECONOMY — the first depth-chart MOVE (RATING-SYSTEM-DESIGN §12.2/§14.3/§15).

   The President promotes a general one grade up the strategic ladder (Brig. Gen. -> Maj. Gen. -> Lt. Gen. ->
   General), spending the MULTI-CURRENCY — political capital (primary, C.clock.capital) + a seniority pool
   (cmd.seniority) — and MERIT-gated by his reputation. A promotion raises the general's grade, which lifts his
   effective skill by a small BOUNDED amount (the rankBase delta x skillLiftWeight, clamped to skillLiftCap);
   that lift reaches the army ONLY through the existing _cmdEffectiveSkill -> _cmdGenRating -> commandLeadership
   pipe — an INPUT the bridge already reads, NEVER the scoreboard (D74/D94 no-fudge wall). EARNED on merit ->
   a confidence reputation bump; ABOVE merit -> the capital surcharge + a jealousy reputation hit (so
   over-promoting a favorite can LOWER his OVR — the honest history). Leapfrogging a passed-over senior costs
   extra seniority. BYTE-IDENTICAL until the player promotes (empty cmd.promotions -> zero lift everywhere).

   DEFERRED to a later GM increment (logged D102): the symmetric AI-GM (needs enemy-commander->combat wiring;
   would break byte-identity / risk fudge), cross-theater Transfer (needs authored theaters), Commission + the
   full corps/division depth-chart tree (needs the strategic<->tactical OOB mapping — the Q8b blocker family).
   =========================================================================== */

function _cmdNum(v, d) { return (typeof v === "number" && isFinite(v)) ? v : d; }
function _cmdPromoCfg() { var d = gameData("ratings"); return (d && d.promotion) ? d.promotion : null; }
function _cmdRankBase(grade) { var d = gameData("ratings"), t = d && d.rankBase; return (t && grade != null && typeof t[grade] === "number") ? t[grade] : 64; }

/* parse a general's VERBOSE generals.json rank ("Major General, Commanding the Army of the Potomac; ...") down
   to one clean ladder grade. Order matters: the multi-word grades contain the bare "General". Deterministic. */
function _cmdBaseGrade(gen) {
  var r = String((gen && gen.rank) || "");
  if (/Lieutenant General|Lt\.?\s*Gen/i.test(r)) return "Lt. Gen.";
  if (/Major General|Maj\.?\s*Gen/i.test(r)) return "Maj. Gen.";
  if (/Brigadier|Brig\.?\s*Gen/i.test(r)) return "Brig. Gen.";
  if (/General/i.test(r)) return "General";
  return "Brig. Gen.";   // Q9 bug-hunt (LOW): an UNRECOGNIZED rank defaults to the LOWEST ladder grade — never invent a man two grades up. Unreachable on the shipped surface (all 20 named generals match a real token); hardens the DEFERRED depth-chart/prosopography path (a non-named officer must not be over-graded onto the General ladder).
}
function _cmdGradeIdx(grade) { var cfg = _cmdPromoCfg(); if (!cfg || !cfg.ladder) return -1; for (var i = 0; i < cfg.ladder.length; i++) if (cfg.ladder[i] === grade) return i; return -1; }
function _cmdNextGrade(grade) { var cfg = _cmdPromoCfg(); if (!cfg || !cfg.ladder) return null; var i = _cmdGradeIdx(grade); return (i >= 0 && i + 1 < cfg.ladder.length) ? cfg.ladder[i + 1] : null; }

/* the general's CURRENT effective grade — the stored promoted grade if it sits ABOVE his parsed base grade,
   else the base grade. A junk/invalid stored grade has idx -1 (never > base) -> harmlessly ignored. */
function _cmdCurrentGrade(C, gen) {
  var base = _cmdBaseGrade(gen);
  var cmd = C && C.president && C.president.command;
  var promoted = (cmd && cmd.promotions && gen && gen.id) ? cmd.promotions[gen.id] : null;
  return (promoted && _cmdGradeIdx(promoted) > _cmdGradeIdx(base)) ? promoted : base;
}

/* the BOUNDED effective-skill lift a stored promotion confers (read by _cmdEffectiveSkill). 0 when un-promoted
   -> byte-identical. The rankBase grade delta x skillLiftWeight, clamped to skillLiftCap (§27: small, never
   dominant). Reaches the fight ONLY via the existing skill->rating->bridge pipe. */
function _cmdPromoteSkillLift(C, gen) {
  if (!C || !gen || !gen.id) return 0;
  var cmd = C.president && C.president.command;
  if (!cmd || !cmd.promotions || !cmd.promotions[gen.id]) return 0;
  var cfg = _cmdPromoCfg(); if (!cfg) return 0;
  var lift = (_cmdRankBase(_cmdCurrentGrade(C, gen)) - _cmdRankBase(_cmdBaseGrade(gen))) * _cmdNum(cfg.skillLiftWeight, 0.92);
  if (lift < 0) lift = 0;
  var capL = _cmdNum(cfg.skillLiftCap, 6);
  return lift > capL ? capL : lift;
}

/* would promoting `gen` to `nextGrade` LEAPFROG a more-senior man? — another available same-side general who
   already sits AT/ABOVE the target grade AND outranks him in reputation (the passed-over senior the seniority
   system frowns on). Adds the leapfrog seniority surcharge. */
function _cmdLeapfrogged(C, gen, nextGrade) {
  var side = (C.side === "CS") ? "CS" : "US", roster = _cmdSideGenerals(side);
  var nIdx = _cmdGradeIdx(nextGrade), myRep = _cmdReputation(C, gen.id);
  for (var i = 0; i < roster.length; i++) {
    var o = roster[i]; if (!o || o.id === gen.id || !_cmdAlive(o, C.president.date)) continue;
    if (_cmdGradeIdx(_cmdCurrentGrade(C, o)) >= nIdx && _cmdReputation(C, o.id) > myRep) return true;
  }
  return false;
}

/* the full promotion offer for `gen` — the next grade + the multi-currency cost + merit/leapfrog state — or
   null if he is at the top grade (or no config). Pure; reads only. */
function _cmdPromoteInfo(C, gen) {
  var cfg = _cmdPromoCfg(); if (!cfg || !gen) return null;
  var cur = _cmdCurrentGrade(C, gen), next = _cmdNextGrade(cur);
  if (!next) return null;   // already at the top grade
  var rep = _cmdReputation(C, gen.id);
  var bar = (cfg.meritBar && typeof cfg.meritBar[next] === "number") ? cfg.meritBar[next] : 64;
  var earned = rep >= bar;
  var capBase = (cfg.capitalCost && typeof cfg.capitalCost[next] === "number") ? cfg.capitalCost[next] : 10;
  var capital = Math.round(capBase * (earned ? 1 : _cmdNum(cfg.aboveMeritMul, 1.8)));
  var leapfrog = _cmdLeapfrogged(C, gen, next);
  var seniority = Math.round(_cmdNum(cfg.seniorityCostBase, 10) + (leapfrog ? _cmdNum(cfg.seniorityLeapfrog, 8) : 0));
  return { next: next, current: cur, capital: capital, seniority: seniority, earned: earned, leapfrog: leapfrog, meritBar: bar, rep: Math.round(rep) };
}

/* THE MOVE — promote `id` one grade, spending BOTH currencies (gated on both), recording the grade, and
   applying the merit reputation effect. Bounded, clamped, logged. Mutates C.president.command + C.clock.capital. */
function cmdPromote(C, id) {
  if (!C || !C.president) return;
  cmdInit(C);
  var side = (C.side === "CS") ? "CS" : "US", cmd = C.president.command;
  var g = _cmdById(side, id);
  if (!g || !_cmdAlive(g, C.president.date)) return;
  var info = _cmdPromoteInfo(C, g);
  if (!info) return;                                   // at the top grade / no config
  var clk = C.clock, cap = (clk && typeof clk.capital === "number") ? Math.round(clk.capital) : 0;
  var sen = _cmdNum(cmd.seniority, 0);
  if (cap < info.capital || sen < info.seniority) return;   // gated on BOTH currencies (the scarce budget)
  // Q9 bug-hunt (LOW): debit the SAME rounded value the gate compared (cap), not the raw clk.capital, so the
  // gate and the spend share one lens — a fractional balance can't pass the rounded gate yet be floor-absorbed
  // on the raw spend. Byte-identical under every current integer-only capital path.
  if (clk && typeof clk.capital === "number") clk.capital = Math.max(0, cap - info.capital);
  cmd.seniority = Math.max(0, sen - info.seniority);
  if (Array.isArray(cmd.promotions) || !cmd.promotions || typeof cmd.promotions !== "object") cmd.promotions = {};
  cmd.promotions[id] = info.next;
  var cfg = _cmdPromoCfg(), cur = _cmdReputation(C, id);
  var rd = info.earned ? _cmdNum(cfg && cfg.earnedRepBonus, 3) : -_cmdNum(cfg && cfg.aboveMeritRepHit, 4);
  cmd.reputation[id] = Math.max(5, Math.min(98, cur + rd));   // earned -> confidence; above-merit -> jealousy (can lower his OVR)
  if (typeof _pdLog === "function") {
    _pdLog(C, "You promote General " + _cmdName(g) + " to " + info.next
      + (info.earned ? " — a promotion he has earned." : " — over more senior men; the army murmurs.")
      + " (−" + info.capital + " capital, −" + info.seniority + " seniority).");
  }
}

/* ===========================================================================
   D105 · LIVE DEV-TRAITS — the Madden development arc (RATING-SYSTEM-DESIGN §9-R-6 / §14.6 / §15-R3;
   D94-fork-#5: "Reputation->OVR dev-traits = LIVE in-campaign"). cmdOnResolve already evolves a general's
   reputation by battle outcome (decisive win +6 / win +3 / draw -1 / loss -4 / decisive loss -8), and
   _cmdGenRating (0.55*skill + 0.45*reputation) -> commandLeadership already reads it — so winning a campaign
   already nudges a general's OVR. This adds the hidden DEV-TRAIT that SHAPES that arc: a potential CEILING
   (how high he can climb), a FLOOR (how far he can fall), a development RATE (rise vs fall), and an
   attritionDrag (the §15-R3 decline-with-heavy-attrition). data/ratings.json -> devTraits.

   ACCURATE INPUTS, never an output gate (D74/D92): a dev-trait only shapes the general's REPUTATION — an INPUT
   the existing _cmdGenRating/commandLeadership pipe already consumes — it NEVER writes a casualty/winner.
   BYTE-IDENTICAL by construction: an UNASSIGNED general (or absent devTraits data) -> _cmdDevTrait returns null
   -> cmdOnResolve takes the literal pre-D105 path (clamp [5,98], rate 1, no drag); the deliberate, citation-grade,
   historically-directed change is the authored data.assign map (mirrors how R-6's rosterBadges changed combat).
   The ceiling/floor are RELATIVE to the general's SEEDED starting reputation (devTrack.start, fixed) so every
   assigned general keeps headroom to rise AND room to fall (ceilingAbove>=5, floorBelow>=5) — the pre-D105
   "a winning general gains reputation / a losing one loses it" invariant holds for all.
   =========================================================================== */

function _cmdDevCfg() { var d = gameData("ratings"); return (d && d.devTraits) ? d.devTraits : null; }

/* the general's SEEDED starting reputation — the fixed anchor for the relative ceiling/floor band. The devTrack
   start if built (cmdInit always builds it before any resolve), else the live reputation / data seed (a safety
   net so the band is well-defined even pre-init). */
function _cmdDevStart(C, gen) {
  if (!gen || !gen.id) return 64;
  var cmd = C && C.president && C.president.command;
  if (cmd && cmd.devTrack && cmd.devTrack[gen.id] && typeof cmd.devTrack[gen.id].start === "number") return cmd.devTrack[gen.id].start;
  return _cmdReputation(C, gen.id);
}

/* the resolved ABSOLUTE dev-trait for a general (ceiling/floor computed from his seeded start), or null when he
   is UNASSIGNED / there is no config -> the caller takes the byte-identical default path. Pure read. */
function _cmdDevTrait(C, gen) {
  if (!gen || !gen.id) return null;
  var cfg = _cmdDevCfg(); if (!cfg || !cfg.assign || !cfg.archetypes) return null;
  var a = cfg.assign[gen.id]; if (!a || !a.trait) return null;
  var arch = cfg.archetypes[a.trait]; if (!arch) return null;
  // D105 bug-hunt (the keystone hardening): coerce the band anchor through _cmdNum + clamp to [0,100] BEFORE it
  // reaches ceiling/floor. A legitimately-seeded start is always a clamped [0,100] reputation, so this is a no-op
  // in normal play (byte-identical); but a tampered/stale/imported devTrack.start (NaN, or 500) would otherwise
  // poison the ceiling/floor band and clamp a NaN / out-of-band reputation through cmdOnResolve. Clamp it once.
  var start = Math.max(0, Math.min(100, _cmdNum(_cmdDevStart(C, gen), _cmdReputation(C, gen.id))));
  var ceiling = Math.min(98, start + _cmdNum(arch.ceilingAbove, 34));
  var floor = Math.max(5, start - _cmdNum(arch.floorBelow, 59));
  if (ceiling < floor) ceiling = floor;   // degenerate-data guard (never on the shipped catalog)
  return {
    key: a.trait, label: String(arch.label || a.trait), glyph: String(arch.glyph || ""), polarity: String(arch.polarity || "="),
    desc: String(arch.desc || ""), note: String(a.note || ""), src: (a.src && a.src.length) ? a.src : [], prov: String(a.prov || "Inferred"),
    ceiling: ceiling, floor: floor, start: start,
    riseRate: _cmdNum(arch.riseRate, 1), fallRate: _cmdNum(arch.fallRate, 1), attritionDrag: Math.max(0, _cmdNum(arch.attritionDrag, 0))
  };
}

/* the extra reputation drag when THIS side bled the lion's share of a battle (the §15-R3 decline-with-attrition).
   0 unless the trait has attritionDrag>0 AND the casualty SHARE (this side / both-sides total — the D100
   unit-correct measure) exceeds the pivot. Bounded by attritionDragMax. Pure; reads B.casualties only. */
function _cmdAttritionDrag(dt, side, B) {
  if (!dt || !(dt.attritionDrag > 0) || !B || !B.casualties) return 0;
  var cfg = _cmdDevCfg(), tun = (cfg && cfg.tuning) ? cfg.tuning : null;
  var pivot = _cmdNum(tun && tun.attritionPivot, 0.55), scale = _cmdNum(tun && tun.attritionDragScale, 8), maxD = _cmdNum(tun && tun.attritionDragMax, 4);
  var enemy = (side === "CS") ? "US" : "CS";
  var me = _cmdNum(B.casualties[side], 0), them = _cmdNum(B.casualties[enemy], 0), tot = me + them;
  if (!(tot > 0)) return 0;
  var share = me / tot;
  if (share <= pivot) return 0;
  var drag = dt.attritionDrag * (share - pivot) * scale;
  return Math.max(0, Math.min(maxD, drag));
}

/* update the PURE observation record after the reputation moved (peak / low / battles). NOTHING in combat reads
   devTrack — it drives the Career-Arc read-out only, so this is byte-identical to the sim. */
function _cmdDevTrackUpdate(C, id, nrep) {
  var cmd = C && C.president && C.president.command; if (!cmd || !id) return;
  if (Array.isArray(cmd.devTrack) || !cmd.devTrack || typeof cmd.devTrack !== "object") cmd.devTrack = {};
  var tr = cmd.devTrack[id];
  if (!tr || typeof tr !== "object" || typeof tr.start !== "number") { tr = cmd.devTrack[id] = { start: nrep, peak: nrep, low: nrep, battles: 0 }; }
  if (nrep > tr.peak) tr.peak = nrep;
  if (nrep < tr.low) tr.low = nrep;
  tr.battles = (typeof tr.battles === "number" ? tr.battles : 0) + 1;
}

/* ---- commandLeadership(C): THE bridge leadership facet (0-100). Anchored at 64:
   a neutral general + a neutral cabinet -> 64 (= the old fixed placeholder, so a
   fresh/default command is byte-equivalent to Classic). The sitting general weighs
   most (0.7); the cabinet's competence modulates (0.3). Graceful fallback chain:
   commandLeadership -> cabinetLeadership -> 64. ---- */
function commandLeadership(C) {
  if (!C) return 64;
  var cab = (typeof cabinetLeadership === "function") ? cabinetLeadership(C) : 64;
  var gen = cmdActiveGeneral(C);
  if (!gen) return Math.max(42, Math.min(88, Math.round(cab)));   // no general data -> the cabinet (itself ~64-anchored)
  var rating = _cmdGenRating(C, gen);
  var lead = 64 + (rating - 64) * 0.7 + (cab - 64) * 0.3;
  return Math.max(42, Math.min(88, Math.round(lead)));
}

/* The active general's combat traits, for the auto-resolve margin (attack/defend). `skill`
   reads the persona-DERIVED _cmdEffectiveSkill (R-1) so every surface shares ONE source of
   truth; byte-identical today (the 9 personas calibrate to gen.skill exactly). */
function cmdActiveTraits(C) {
  var g = cmdActiveGeneral(C);
  if (!g) return { skill: 64, aggression: 50, caution: 50 };
  return {
    skill: _cmdEffectiveSkill(g, C),
    aggression: (typeof g.aggression === "number") ? g.aggression : 50,
    caution: (typeof g.caution === "number") ? g.caution : 50
  };
}

/* The general's situational edge on the auto-resolve margin: an aggressive
   commander presses the attack; a cautious one is sound on the defensive. Small,
   deterministic, bounded ±~2 (it must not swamp the strategic facets — §27). The
   sign of `playerAttacks` is the player's role in the coming battle. */
function commandMarginEdge(C, playerAttacks) {
  var t = cmdActiveTraits(C);
  if (playerAttacks) return (t.aggression - 50) * 0.04;
  return (t.caution - 50) * 0.04;
}

/* ---- cmdOnResolve: per-turn tick. Runs AFTER cabOnResolve (date/turn advanced)
   and BEFORE moraleOnResolve (so the fresh reputation feeds the leader layer the
   same turn). Evolves the ACTIVE general's reputation by the battle's outcome and
   logs a handover when the historical default changes (player hasn't appointed).
   Mutates C.president.command only; no DOM, no save. ---- */
function cmdOnResolve(winnerSide, type, B, C, win) {
  if (!C) return;
  cmdInit(C);
  try {
    var P = C.president, side = (C.side === "CS") ? "CS" : "US", cmd = P.command;
    var prevActive = cmd._activeId || null;
    var id = cmdActiveId(C);
    if (id) {
      var cur = _cmdReputation(C, id), delta;
      var draw = (type === "draw" || winnerSide == null);
      if (draw) delta = -1;
      else if (win) delta = (type === "decisive") ? 6 : 3;
      else delta = (type === "decisive") ? -8 : -4;
      // D105 (LIVE DEV-TRAITS): the dev-trait SHAPES the arc. An UNASSIGNED general (or absent devTraits data)
      // -> dt is null -> the LITERAL pre-D105 path (clamp [5,98], rate 1, no drag) -> BYTE-IDENTICAL. An assigned
      // general's base delta is scaled by his development rate (rise vs fall direction) plus an extra attrition
      // drag when his army bled the lion's share, then clamped to HIS ceiling/floor band. ACCURATE INPUTS — it
      // shapes the reputation an INPUT pipe already reads, NEVER the scoreboard (D74/D92).
      var dt = _cmdDevTrait(C, _cmdById(side, id));
      var nrep;
      if (!dt) {
        nrep = Math.max(5, Math.min(98, cur + delta));   // <-- the exact pre-D105 arithmetic
      } else {
        var d2 = delta * ((delta >= 0) ? dt.riseRate : dt.fallRate);
        d2 -= _cmdAttritionDrag(dt, side, B);            // 0 unless attritionDrag>0 AND this side bled heavily
        nrep = Math.max(dt.floor, Math.min(dt.ceiling, cur + d2));
      }
      cmd.reputation[id] = nrep;
      _cmdDevTrackUpdate(C, id, nrep);                   // pure observation (peak/low/battles); combat never reads it
    }
    // Q9 (D102): the seniority pool accrues over the campaign (the officer corps' standing grows — a passive
    // bench gain + a victory bonus), capped. It is a PROMOTION currency that NOTHING in combat reads, so the
    // accrual is invisible — every battle outcome is BYTE-IDENTICAL; it only ever funds a future promotion.
    var pcfg = _cmdPromoCfg();
    if (pcfg) {
      var add = _cmdNum(pcfg.seniorityPerTurn, 3) + (win ? _cmdNum(pcfg.seniorityWinBonus, 6) : 0);
      cmd.seniority = Math.max(0, Math.min(_cmdNum(pcfg.seniorityCap, 60), _cmdNum(cmd.seniority, 0) + add));
    }
    // log a handover when the HISTORICAL default shifts and the player is following history.
    if (!cmd.fieldGeneral && id && id !== prevActive && prevActive) {
      var now = _cmdById(side, id), prev = _cmdById(side, prevActive);
      if (now && typeof _pdLog === "function") {
        _pdLog(C, "General " + _cmdName(now) + " takes field command" + (prev ? ", succeeding " + _cmdName(prev) : "") + ".");
      }
    }
    cmd._activeId = id;
  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("cmdOnResolve:", e); }
}

/* ===== render: the "Command" desk tab ===== */

function _cmdPortrait(gen, side, size) {
  if (!gen || typeof window.portraitFor !== "function") return "";
  try {
    return '<img src="' + window.portraitFor(_cmdName(gen), side, { named: true }) + '" alt="General ' + _cmdEsc(_cmdName(gen))
      + '" style="width:' + size + 'px;height:' + size + 'px;object-fit:cover;border:2px solid var(--rule);border-radius:4px;flex:0 0 auto">';
  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_cmdPortrait:", e); return ""; }
}

function _cmdLeadWord(v) {
  if (v >= 82) return ["Masterful", "#4a6b3a"];
  if (v >= 70) return ["Able", "#6f9e5a"];
  if (v >= 58) return ["Steady", "#b8863b"];
  if (v >= 48) return ["Uneven", "#c9712e"];
  return ["Faltering", "#9c3b2e"];
}

function _cmdTraitBar(label, v, hint) {
  v = Math.max(0, Math.min(100, Math.round(v || 0)));
  return '<div style="margin:3px 0"><div style="display:flex;justify-content:space-between;font-size:11px;opacity:.8"><span>' + _cmdEsc(label)
    + '</span><span>' + v + '</span></div>'
    + '<div style="height:6px;background:rgba(0,0,0,.25);border:1px solid var(--rule);border-radius:3px;overflow:hidden"><div style="height:100%;width:' + v + '%;background:#7d6b4a"></div></div>'
    + (hint ? '<div style="font-size:10px;opacity:.5">' + _cmdEsc(hint) + '</div>' : '') + '</div>';
}

/* The relief cost (political capital) to remove a general now — scaled up for a
   popular man at the height of his prestige (the McClellan problem). */
function _cmdReliefCost(C, gen) {
  if (!gen) return 0;
  var base = _cmdRELIEF_BASE[gen.relief] || _cmdRELIEF_BASE.costly;
  var rep = _cmdReputation(C, gen.id);
  var prestige = Math.max(0, rep - 60) * 0.25;   // a beloved general is dearer to dismiss
  return Math.round(base + prestige);
}

/* The card for the sitting commanding general. */
function _cmdActiveCard(C) {
  var side = (C.side === "CS") ? "CS" : "US", P = C.president;
  var gen = cmdActiveGeneral(C);
  if (!gen) return '<p class="lede" style="font-size:13px">No general holds the field command. Appoint a commander below.</p>';
  var byHistory = !(P.command && P.command.fieldGeneral);
  var lead = commandLeadership(C);
  // R-2: the OVR read-out. The officer OVR (_cmdGenRating, 0.55*skill+0.45*reputation — A+ reachable for the
  // legendary) is carried as number + A-F report-card grade + word (TRIPLE-ENCODED, colour DECORATIVE only); the
  // 42-88 bridge value `lead` (what the army actually fields) stays as a secondary line. Pure display, no sim change.
  var ovr = Math.round(_cmdGenRating(C, gen));
  var gr = (typeof fldRatingGrade === "function") ? fldRatingGrade(ovr) : { ovr: ovr, letter: "", word: _cmdLeadWord(ovr)[0], color: _cmdLeadWord(ovr)[1] };
  var dual = _cmdGenDualOVR(C, gen);   // Q7: the situational Attack/Defend split beside the headline
  var rep = Math.round(_cmdReputation(C, gen.id));
  var img = _cmdPortrait(gen, side, 84);
  var traits = (gen.traits && gen.traits.length) ? gen.traits.join(" &middot; ") : "";
  var amb = (typeof gen.ambition === "number") ? gen.ambition : 0;
  var ambTell = (amb >= 70)
    ? '<div style="margin-top:7px;font-size:11px;color:#9c3b2e;background:rgba(156,59,46,.08);border:1px solid rgba(156,59,46,.4);border-radius:4px;padding:7px">&#9873; <b>Ambition.</b> '
        + _cmdEsc(gen.weakness || "He courts the newspapers and the politicians; removing him will cost you dearly.") + '</div>'
    : '';
  return ''
    + '<div style="padding:12px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.14)">'
    +   '<div style="display:flex;gap:14px;align-items:flex-start">'
    +     img
    +     '<div style="flex:1 1 auto">'
    +       '<div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#b3925e">' + (byHistory ? 'In command (by the course of the war)' : 'Your appointed commander') + '</div>'/* a11y: --rule #8a7350 was 3.25:1 on the lightest .sheet ground (#2e2816 = #26200f + the 4% light overlay); #b3925e = 5.0:1 there / 5.4:1 on the card overlay -> AA normal text (1.4.3), measured vs the real desk gradient not pure black (R-2 bug-hunt). Comment kept OUTSIDE the style string so it never ships into the DOM. */
    +       '<div style="font-weight:bold;font-size:16px">' + _cmdEsc(gen.fullName || _cmdName(gen))
    +         (gen.epithet ? ' <span style="font-weight:normal;opacity:.65;font-size:12px">&ldquo;' + _cmdEsc(gen.epithet) + '&rdquo;</span>' : '') + '</div>'
    +       '<div style="opacity:.7;font-size:11px">' + _cmdEsc(gen.rank || "General") + (traits ? ' &middot; ' + _cmdEsc(gen.traits.join(" · ")) : '') + '</div>'
    +       (gen.voice ? '<div style="font-style:italic;opacity:.85;font-size:12px;margin-top:5px;border-left:2px solid var(--rule);padding-left:8px">' + _cmdEsc(gen.voice) + '</div>' : '')
    +     '</div>'
    +     '<div style="flex:0 0 auto;text-align:right">'
    +       '<div style="display:inline-flex;align-items:center;gap:8px;border-left:4px solid ' + gr.color + ';padding-left:9px">'
    +         '<div style="text-align:right"><div style="font-weight:bold;font-size:23px;line-height:1">' + ovr + '</div><div style="font-size:9px;opacity:.6;letter-spacing:.06em">OVR</div></div>'
    +         '<div style="text-align:left"><div style="font-weight:bold;font-size:16px;line-height:1.15" aria-label="grade ' + _cmdEsc(gr.letter) + '">' + _cmdEsc(gr.letter) + '</div><div style="font-size:10px;opacity:.78">' + _cmdEsc(gr.word) + '</div></div>'
    +       '</div>'
    +       '<div style="display:inline-flex;gap:5px;margin-top:5px;font-size:11px">'
    +         '<span title="Attack OVR — his gift on the offensive" style="background:rgba(108,142,191,.16);border:1px solid rgba(108,142,191,.5);border-radius:3px;padding:1px 6px">ATK <b>' + dual.attack + '</b></span>'
    +         '<span title="Defend OVR — his gift holding the ground" style="background:rgba(183,118,104,.16);border:1px solid rgba(183,118,104,.5);border-radius:3px;padding:1px 6px">DEF <b>' + dual.defend + '</b></span>'
    +       '</div>'
    +       '<div style="font-size:10px;opacity:.55;margin-top:4px">Fields command at ' + lead + '</div>'
    +     '</div>'
    +   '</div>'
    +   '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:9px">'
    +     '<div style="flex:1 1 180px;min-width:160px">'
    +       _cmdTraitBar('Skill', _cmdEffectiveSkill(gen, C), 'Operational generalship.')
    +       _cmdTraitBar('Reputation', rep, 'Rises with victory, falls with defeat.')
    +     '</div>'
    +     '<div style="flex:1 1 180px;min-width:160px">'
    +       _cmdTraitBar('Aggression', gen.aggression, 'Presses the attack.')
    +       _cmdTraitBar('Caution', gen.caution, 'Sound on the defensive; slow to move.')
    +     '</div>'
    +   '</div>'
    +   (gen.bio ? '<div style="font-size:12px;opacity:.82;margin-top:8px">' + _cmdEsc(gen.bio) + '</div>' : '')
    +   ambTell
    +   (gen.provenance ? '<div style="margin-top:5px;font-size:10px;opacity:.55">' + _cmdEsc(gen.provenance) + (gen.sources && gen.sources.length ? ' &middot; ' + _cmdEsc(gen.sources.join("; ")) : '') + '</div>' : '')
    +   (!byHistory ? '<button id="cmdRevert" type="button" class="upg" style="margin-top:8px;font-size:11px;padding:2px 8px">Restore the historical command</button>' : '')
    + '</div>';
}

/* The available-generals pool — appoint / promote (relieve the incumbent). */
function _cmdPoolHTML(C) {
  var side = (C.side === "CS") ? "CS" : "US", P = C.president;
  var roster = _cmdSideGenerals(side);
  if (!roster.length) return "";
  var activeId = cmdActiveId(C);
  var incumbent = cmdActiveGeneral(C);
  var cost = incumbent ? _cmdReliefCost(C, incumbent) : 0;
  var cap = (C.clock && typeof C.clock.capital === "number") ? Math.round(C.clock.capital) : 0;
  var rows = "";
  // available men first, then the unavailable (greyed, with a reason), for context.
  var avail = [], later = [];
  for (var i = 0; i < roster.length; i++) {
    var g = roster[i]; if (!g || g.id === activeId) continue;
    if (_cmdAlive(g, P.date)) avail.push(g); else later.push(g);
  }
  function _cmdGenRow(g, ok) {
    var rep = Math.round(_cmdReputation(C, g.id));
    var rating = Math.round(_cmdGenRating(C, g));
    var gr = (typeof fldRatingGrade === "function") ? fldRatingGrade(rating) : { letter: "", word: _cmdLeadWord(rating)[0], color: _cmdLeadWord(rating)[1] };
    var dual = _cmdGenDualOVR(C, g);   // Q7: the situational Attack/Defend split, so the appointment compares fit
    var img = _cmdPortrait(g, side, 44);
    var canAfford = cap >= cost;
    var note = "";
    if (!ok) {
      var until = g.availableUntil;
      note = (until && _cmdDateNum(P.date) > _cmdYM(until))
        ? '<span style="font-size:11px;opacity:.6">Out of the war</span>'
        : '<span style="font-size:11px;opacity:.6">Not yet available</span>';
    } else if (canAfford) {
      note = '<button id="cmdApp_' + _cmdEsc(g.id) + '" type="button" class="upg" style="flex:0 0 auto">Appoint</button>';
    } else {
      note = '<span style="font-size:11px;color:#9c3b2e" title="Relieving ' + _cmdEsc(_cmdName(incumbent)) + ' would cost ' + cost + ' political capital; you have ' + cap + '.">Needs ' + cost + ' capital</span>';
    }
    return '<div style="display:flex;gap:10px;align-items:center;padding:7px 0;border-bottom:1px dotted var(--rule)' + (ok ? '' : ';opacity:.5') + '">'
      + img
      + '<div style="flex:1 1 auto">'
      +   '<div style="font-weight:bold;font-size:13px">' + _cmdEsc(_cmdName(g)) + (g.epithet ? ' <span style="font-weight:normal;opacity:.6;font-size:11px">&ldquo;' + _cmdEsc(g.epithet) + '&rdquo;</span>' : '') + '</div>'
      +   '<div style="font-size:11px;opacity:.75">' + _cmdEsc(g.rank || "") + ' &middot; <span aria-hidden="true" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:' + gr.color + ';margin-right:3px"></span><b>' + _cmdEsc(gr.letter) + '</b> ' + _cmdEsc(gr.word) + ' (' + rating + ' OVR)</div>'
      +   '<div style="font-size:10px;opacity:.6">ATK ' + dual.attack + ' &middot; DEF ' + dual.defend + '</div>'
      +   (g.strength ? '<div style="font-size:11px;opacity:.6">' + _cmdEsc(g.strength) + '</div>' : '')
      + '</div>'
      + '<div style="flex:0 0 auto;text-align:right">' + note + '</div>'
      + '</div>';
  }
  for (var a = 0; a < avail.length; a++) rows += _cmdGenRow(avail[a], true);
  for (var b = 0; b < later.length; b++) rows += _cmdGenRow(later[b], false);
  var capLine = incumbent
    ? '<div style="font-size:11px;opacity:.7;margin:6px 0 2px">To appoint another is to relieve <b>' + _cmdEsc(_cmdName(incumbent)) + '</b> &mdash; a cost of <b>' + cost + '</b> political capital (you hold ' + cap + '). '
        + (incumbent.relief === "very-costly" ? 'He is popular and dangerous; the country will not thank you for it.' : '') + '</div>'
    : '';
  return '<div style="margin-top:14px">'
    + '<div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#b3925e;margin-bottom:2px">The generals at your call</div>'/* a11y: --rule #8a7350 was 3.25:1 on the lightest .sheet ground (#2e2816); #b3925e = 5.0:1 there / 6.0:1 at the gradient edge -> AA normal text (1.4.3), measured vs the real desk gradient (R-2 bug-hunt) */
    + capLine
    + rows
    + '</div>';
}

/* ---- Q9: the "Officer Corps — Promotions" section (the depth-chart MOVE surface). Each available general's
   current grade + OVR + a Promote control (next grade + the multi-currency cost), gated on capital + seniority,
   merit-annotated. Pure display; the Wire fn binds the buttons. Returns "" with no config (byte-identical). ---- */
function _cmdPromoRow(C, g, cap, sen, activeId) {
  var cur = _cmdCurrentGrade(C, g), base = _cmdBaseGrade(g);
  var promoted = _cmdGradeIdx(cur) > _cmdGradeIdx(base);
  var ovr = Math.round(_cmdGenRating(C, g));
  var gr = (typeof fldRatingGrade === "function") ? fldRatingGrade(ovr) : { letter: "", word: _cmdLeadWord(ovr)[0], color: _cmdLeadWord(ovr)[1] };
  var info = _cmdPromoteInfo(C, g), ctrl;
  if (!info) {
    ctrl = '<span style="font-size:11px;opacity:.65">At the top grade</span>';
  } else if (cap >= info.capital && sen >= info.seniority) {
    var meritTag = info.earned ? '' : ' <span title="Above his merit — it costs more and his standing will suffer" style="color:#d66040">(above merit)</span>';/* a11y: #d66040 4.51:1 on lightest .sheet ground (#2e2816) -> AA (wcag-auditor: contrast fix from #c2502e to #d66040; #c2502e measured 3.74:1, below 4.5:1 required for 11px normal text); meaning also carried by the word "(above merit)" */
    ctrl = '<button id="cmdProm_' + _cmdEsc(g.id) + '" type="button" class="upg" style="flex:0 0 auto" title="Promote to ' + _cmdEsc(info.next) + ' — ' + info.capital + ' political capital + ' + info.seniority + ' seniority' + (info.leapfrog ? '; he leapfrogs more senior men (+seniority)' : '') + '">Promote to ' + _cmdEsc(info.next) + '</button>'
      + '<div style="font-size:10px;opacity:.7;margin-top:2px">&minus;' + info.capital + ' cap &middot; &minus;' + info.seniority + ' sen' + meritTag + '</div>';
  } else {
    ctrl = '<span style="font-size:11px;color:#d66040" title="Promotion to ' + _cmdEsc(info.next) + ' needs ' + info.capital + ' political capital + ' + info.seniority + ' seniority">Needs ' + info.capital + ' cap / ' + info.seniority + ' sen</span>';/* a11y: #d66040 4.51:1 on lightest .sheet ground (#2e2816) -> AA (wcag-auditor: contrast fix from #c2502e to #d66040; #c2502e measured 3.74:1, below 4.5:1 required for 11px normal text) */
  }
  var isActive = (g.id === activeId);
  return '<div style="display:flex;gap:10px;align-items:center;padding:6px 0;border-bottom:1px dotted var(--rule)">'
    + '<div style="flex:1 1 auto">'
    +   '<div style="font-size:12px"><b>' + _cmdEsc(_cmdName(g)) + '</b>' + (isActive ? ' <span style="font-size:10px;opacity:.72">(in command)</span>' : '') + '</div>'
    +   '<div style="font-size:11px;opacity:.82"><span aria-hidden="true" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:' + gr.color + ';margin-right:3px"></span>' + _cmdEsc(cur)
    +     (promoted ? ' <span title="Promoted from ' + _cmdEsc(base) + '" style="color:#6f9e5a">&uarr;</span>' : '') + ' &middot; <b>' + _cmdEsc(gr.letter) + '</b> ' + ovr + ' OVR</div>'
    + '</div>'
    + '<div style="flex:0 0 auto;text-align:right">' + ctrl + '</div>'
    + '</div>';
}
function _cmdPromotionsHTML(C) {
  var cfg = _cmdPromoCfg(); if (!cfg) return "";
  var side = (C.side === "CS") ? "CS" : "US", P = C.president, cmd = P.command;
  var roster = _cmdSideGenerals(side); if (!roster.length) return "";
  var cap = (C.clock && typeof C.clock.capital === "number") ? Math.round(C.clock.capital) : 0;
  var sen = Math.round(_cmdNum(cmd.seniority, 0));
  var activeId = cmdActiveId(C), rows = "";
  for (var i = 0; i < roster.length; i++) { var g = roster[i]; if (!g || !_cmdAlive(g, P.date)) continue; rows += _cmdPromoRow(C, g, cap, sen, activeId); }
  if (!rows) return "";
  // the top-command preferred-grade prompt: the army command is properly a senior grade's billet
  var pref = cfg.topCommandPreferredGrade, act = cmdActiveGeneral(C), prompt = "";
  if (act && pref && _cmdGradeIdx(_cmdCurrentGrade(C, act)) >= 0 && _cmdGradeIdx(_cmdCurrentGrade(C, act)) < _cmdGradeIdx(pref)) {
    prompt = '<div style="font-size:11px;opacity:.85;margin:4px 0 6px;color:#b3925e">The army command is properly a ' + _cmdEsc(pref) + '&rsquo;s billet &mdash; <b>' + _cmdEsc(_cmdName(act)) + '</b> holds it at ' + _cmdEsc(_cmdCurrentGrade(C, act)) + '. Promote him to field it without friction.</div>';
  }
  return '<div style="margin-top:16px">'
    + '<div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#b3925e;margin-bottom:2px">The officer corps &mdash; promotions</div>'/* a11y: #b3925e 5.0:1 on the lightest .sheet ground -> AA (the R-2 measured value) */
    + '<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:11px;opacity:.9;margin:3px 0 6px">'
    +   '<span title="Political capital — the primary currency (shared with relief/appointment)">&#9873; Political capital <b>' + cap + '</b></span>'
    +   '<span title="Seniority — the institutional standing to elevate an officer through the grades; it grows over the campaign">&#9876;&#65039; Seniority <b>' + sen + '</b></span>'
    + '</div>'
    + '<div style="font-size:11px;opacity:.78;margin-bottom:5px">A promotion raises a general&rsquo;s grade &mdash; and, earned on merit, his confidence and standing. Elevate a man past his record and the army resents it: it costs more, and his reputation suffers.</div>'
    + prompt
    + rows
    + '</div>';
}

function _cmdCardHTML(C) {
  var d = _cmdData(), side = (C.side === "CS") ? "CS" : "US";
  if (!d || !d.teachingCards || !d.teachingCards.length) return "";
  var html = "";
  for (var i = 0; i < d.teachingCards.length; i++) {
    var c = d.teachingCards[i];
    if (!c || (c.side && c.side !== side)) continue;
    var persp = "";
    if (c.perspectives) for (var p = 0; p < c.perspectives.length; p++) persp += '<div style="margin:4px 0;font-size:12px"><span style="opacity:.6;font-style:italic">' + _cmdEsc(c.perspectives[p].voice) + ':</span> ' + _cmdEsc(c.perspectives[p].text) + '</div>';
    html += '<div style="margin-top:10px;padding:9px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.1)">'
      + '<div style="font-weight:bold;font-size:13px">' + _cmdEsc(c.title) + '</div>'
      + '<div style="font-size:12px;opacity:.85;margin:2px 0">' + _cmdEsc(c.claim) + '</div>'
      + '<button id="cmdCard_' + i + '" type="button" class="upg" style="font-size:11px;padding:1px 8px;margin-top:3px">The historians &#9656;</button>'
      + '<div id="cmdCardBox_' + i + '" style="display:none;margin-top:4px">' + persp
      + '<div style="margin-top:4px;font-size:10px;opacity:.6">' + _cmdEsc(c.provenance || "Inferred") + (c.sources && c.sources.length ? ' &middot; ' + _cmdEsc(c.sources.join("; ")) : '') + '</div></div>'
      + '</div>';
  }
  return html;
}

/* ---- D105 (LIVE DEV-TRAITS): the "Career Arc" read-out. Surfaces the sitting general's Madden dev-trait —
   his tier, the arc his reputation/OVR has traced over the campaign (start -> now -> peak), a trend verdict, and
   his hidden potential band (floor..ceiling). PURE DISPLAY over numbers the sim already evolves; nothing here
   mutates or seeds. Triple-encoded (word + sign + number; the glyph + colour are decorative) -> CVD-safe. ---- */

/* the trajectory verdict from the OVR movement since the campaign began. delta in OVR points. */
function _cmdDevTrend(battles, delta) {
  if (!(battles > 0)) return { word: "Untested", glyph: "·", color: "#b3925e" };   // middot — no arc yet
  if (delta >= 2) return { word: "Rising", glyph: "▲", color: "#6f9e5a" };          // ▲
  if (delta <= -2) return { word: "Fading", glyph: "▼", color: "#c9712e" };          // ▼
  return { word: "Holding", glyph: "→", color: "#b8863b" };                          // →
}

function _cmdCareerArcHTML(C) {
  var gen = cmdActiveGeneral(C);
  var dt = gen ? _cmdDevTrait(C, gen) : null;
  if (!gen || !dt) return "";   // no sitting general, or he carries no documented arc -> render nothing
  var skill = _cmdEffectiveSkill(gen, C);
  function ovrAt(r) { return Math.round(0.55 * skill + 0.45 * r); }
  var cmd = C.president.command;
  var curRep = _cmdReputation(C, gen.id);
  // D105 bug-hunt: coerce the WHOLE observation record through _cmdNum, not just start, so a tampered/stale save
  // (peak/low/battles NaN) can never render "peak NaN" or an off-track left:NaN% marker. cmdInit already sanitizes
  // on load; this is defense-in-depth at the render site (the band anchor `start` is re-clamped to [0,100] too).
  var rawTr = (cmd.devTrack && cmd.devTrack[gen.id] && typeof cmd.devTrack[gen.id] === "object") ? cmd.devTrack[gen.id] : null;
  var tStart = Math.max(0, Math.min(100, _cmdNum(rawTr && rawTr.start, curRep)));
  var tr = { start: tStart, peak: _cmdNum(rawTr && rawTr.peak, tStart), low: _cmdNum(rawTr && rawTr.low, tStart), battles: Math.max(0, Math.floor(_cmdNum(rawTr && rawTr.battles, 0))) };
  var ovrNow = ovrAt(curRep), ovrStart = ovrAt(tr.start), ovrPeak = ovrAt(tr.peak);
  var ovrFloor = ovrAt(dt.floor), ovrCeil = ovrAt(dt.ceiling);
  var delta = ovrNow - ovrStart;
  var trend = _cmdDevTrend(tr.battles, delta);
  var ceilGrade = (typeof fldRatingGrade === "function") ? fldRatingGrade(ovrCeil) : { letter: "", word: "" };
  // the potential-room note (the hidden-ceiling "feel" — surfaced as a soft verdict, not a bare number).
  var head = dt.ceiling - curRep, foot = curRep - dt.floor, room;
  if (head <= 3) room = "At the height of his powers — little room left to rise.";
  else if (foot <= 3) room = "At his lowest ebb — his standing can fall no further.";
  else if (head <= 12) room = "Approaching his ceiling.";
  else room = "Room yet to grow into.";
  // the floor..ceiling band as a track; a fill to the current OVR; start + peak ticks.
  function pct(o) { var span = Math.max(1, ovrCeil - ovrFloor); var v = ((o - ovrFloor) / span) * 100; return Math.max(0, Math.min(100, v)); }
  var fillPct = pct(ovrNow), startPct = pct(ovrStart), peakPct = pct(ovrPeak);
  var sign = (dt.polarity === "+") ? "+" : (dt.polarity === "−" || dt.polarity === "-") ? "−" : (dt.polarity === "~") ? "±" : "=";
  var arcAria = "Career arc: started at OVR " + ovrStart + ", now " + ovrNow + ", peak " + ovrPeak
    + "; potential band floor " + ovrFloor + " to ceiling " + ovrCeil + ". " + trend.word + ".";
  var deltaStr = (delta > 0 ? "+" + delta : (delta < 0 ? "−" + Math.abs(delta) : "±0"));
  return ''
    + '<div style="margin-top:14px;padding:11px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.12)">'
    +   '<div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#b3925e;margin-bottom:3px">Career arc &mdash; the development trait</div>'/* a11y: #b3925e 5.0:1 on the lightest .sheet ground -> AA (the R-2 measured value) */
    +   '<div style="display:flex;gap:10px;align-items:baseline;flex-wrap:wrap">'
    +     '<span style="font-weight:bold;font-size:14px"><span aria-hidden="true" style="opacity:.85">' + _cmdEsc(dt.glyph) + '</span> ' + _cmdEsc(dt.label) + '</span>'
    +     '<span aria-hidden="true" style="font-size:11px;opacity:.7;border:1px solid var(--rule);border-radius:3px;padding:0 5px">trait ' + _cmdEsc(sign) + '</span>'
    +   '</div>'
    +   '<div style="font-size:11.5px;opacity:.82;margin:3px 0 8px;font-style:italic">' + _cmdEsc(dt.desc) + '</div>'
    +   '<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-bottom:6px">'
    +     '<div style="display:inline-flex;align-items:baseline;gap:6px"><span style="font-weight:bold;font-size:21px;line-height:1">' + ovrNow + '</span><span style="font-size:9px;opacity:.6;letter-spacing:.06em">OVR NOW</span></div>'
    +     '<div style="font-size:12px"><span aria-hidden="true" style="color:' + trend.color + '">' + trend.glyph + '</span> <b>' + _cmdEsc(trend.word) + '</b> '
    +       '<span style="opacity:.7" aria-label="net change ' + deltaStr + ' over ' + tr.battles + ' battles">(' + deltaStr + ' over ' + tr.battles + ' battle' + (tr.battles === 1 ? '' : 's') + ')</span></div>'
    +   '</div>'
    +   '<div role="img" aria-label="' + _cmdEsc(arcAria) + '" style="position:relative;height:12px;background:rgba(0,0,0,.28);border:1px solid var(--rule);border-radius:3px;overflow:hidden">'
    +     '<div style="position:absolute;left:0;top:0;height:100%;width:' + fillPct.toFixed(1) + '%;background:linear-gradient(90deg,#5a4d34,#7d6b4a)"></div>'
    +     '<div aria-hidden="true" title="Started here" style="position:absolute;left:' + startPct.toFixed(1) + '%;top:-1px;width:2px;height:14px;background:#cdbb91;opacity:.85"></div>'
    +     '<div aria-hidden="true" title="Campaign peak" style="position:absolute;left:' + peakPct.toFixed(1) + '%;top:-2px;width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid #6f9e5a;transform:translateX(-4px)"></div>'
    +   '</div>'
    +   '<div style="display:flex;justify-content:space-between;font-size:10px;opacity:.62;margin-top:2px">'
    +     '<span>Floor ' + ovrFloor + '</span><span style="opacity:.9">start ' + ovrStart + ' &middot; peak ' + ovrPeak + '</span><span>Ceiling ' + ovrCeil + (ceilGrade.letter ? ' (' + _cmdEsc(ceilGrade.letter) + ')' : '') + '</span>'
    +   '</div>'/* wcag-auditor: contrast fix opacity:.8->.9 on "start · peak" inner span; nested inside outer opacity:.62 div making effective opacity .496 (3.93:1) → .558 (4.57:1) for AA 1.4.3 compliance on 10px text vs #282313 card ground */
    +   '<div style="font-size:11px;opacity:.8;margin-top:6px">' + _cmdEsc(room) + '</div>'
    +   (dt.note ? '<div style="font-size:11px;opacity:.78;margin-top:5px;border-left:2px solid var(--rule);padding-left:8px">' + _cmdEsc(dt.note) + '</div>' : '')
    +   '<div style="font-size:10px;opacity:.55;margin-top:5px">' + _cmdEsc(dt.prov || "Inferred") + ' &middot; a calibrated reading of his documented career'
    +     (dt.src && dt.src.length ? ' &middot; ' + _cmdEsc(dt.src.join("; ")) : '') + '</div>'
    + '</div>';
}

/* ---- cmdRenderTab: the Command desk tab. ---- */
function cmdRenderTab(C) {
  if (!C) return '';
  try {
    if (typeof presInit === "function") presInit(C);
    cmdInit(C);
  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("cmdRenderTab:", e); return '<p class="lede" style="font-size:13px">Your generals await your orders.</p>'; }
  if (!_cmdData()) return '<p class="lede" style="font-size:13px">Your generals await your orders.</p>';
  return ''
    + '<p class="lede" style="font-size:13px;margin-bottom:10px">You appoint the men who command your armies &mdash; and you relieve them. A great general lifts the army your war puts in the field; a cautious or discredited one squanders it. But a popular general is dangerous to dismiss: it costs you political capital, and the country is watching.</p>'
    + _cmdActiveCard(C)
    + _cmdCareerArcHTML(C)
    + ((typeof fldCampaignOOBHtml === "function") ? fldCampaignOOBHtml(C) : '')   /* D106: the read-only Order-of-Battle board (the §12.1 roster screen — substrate the GM moves + scouting query) */
    + _cmdPoolHTML(C)
    + _cmdPromotionsHTML(C)
    + _cmdCardHTML(C);
}

/* ===== wire ===== */

/* Appoint `id` to the field command — relieving the incumbent and paying the
   political-capital cost. Bounded, clamped, logged. Mutates C.president.command +
   C.clock.capital. */
function cmdAppoint(C, id) {
  if (!C || !C.president) return;
  cmdInit(C);
  var side = (C.side === "CS") ? "CS" : "US", P = C.president, cmd = P.command;
  var g = _cmdById(side, id);
  if (!g || !_cmdAlive(g, P.date)) return;
  if (id === cmdActiveId(C)) return;                 // already in command
  var incumbent = cmdActiveGeneral(C);
  var cost = incumbent ? _cmdReliefCost(C, incumbent) : 0;
  var clk = C.clock, cap = (clk && typeof clk.capital === "number") ? Math.round(clk.capital) : 0;   // round to match the pool's displayed capital (no soft-lock, D53.7)
  if (cap < cost) return;                            // not enough political capital (the gate)
  if (clk && typeof clk.capital === "number") clk.capital = Math.max(0, clk.capital - cost);
  cmd.fieldGeneral = id;
  cmd.appointedTurn = (P.turn || 0);
  cmd.history.unshift({ turn: (P.turn || 0), id: id });
  if (cmd.history.length > 8) cmd.history.length = 8;
  if (typeof _pdLog === "function") {
    _pdLog(C, "You give the field command to General " + _cmdName(g)
      + (incumbent ? ", relieving " + _cmdName(incumbent) + (cost ? " (−" + cost + " capital)" : "") : "") + ".");
  }
}

/* Restore the historical command (release the post — free). */
function cmdRevert(C) {
  if (!C || !C.president) return;
  cmdInit(C);
  C.president.command.fieldGeneral = null;
  if (typeof _pdLog === "function") _pdLog(C, "You restore the command to the course of the war.");
}

function cmdWireTab(C) {
  if (!C || !C.president) return;
  cmdInit(C);
  var side = (C.side === "CS") ? "CS" : "US";
  var roster = _cmdSideGenerals(side);
  for (var i = 0; i < roster.length; i++) {
    (function (g) {
      if (!g || !g.id) return;
      var b = document.getElementById("cmdApp_" + _cmdEsc(g.id));   // escape to mirror the render id (D43.4 discipline)
      if (b) b.addEventListener("click", function () {
        cmdAppoint(C, g.id);
        if (typeof saveLocal === "function") saveLocal();
        if (typeof _wdRefresh === "function") _wdRefresh();
      });
    })(roster[i]);
  }
  // Q9: wire the promotion buttons (one per available general; ids mirror the render, escaped — D43.4)
  for (var p = 0; p < roster.length; p++) {
    (function (g) {
      if (!g || !g.id) return;
      var pb = document.getElementById("cmdProm_" + _cmdEsc(g.id));
      if (pb) pb.addEventListener("click", function () {
        cmdPromote(C, g.id);
        if (typeof saveLocal === "function") saveLocal();
        if (typeof _wdRefresh === "function") _wdRefresh();
      });
    })(roster[p]);
  }
  var rev = document.getElementById("cmdRevert");
  if (rev) rev.addEventListener("click", function () {
    cmdRevert(C);
    if (typeof saveLocal === "function") saveLocal();
    if (typeof _wdRefresh === "function") _wdRefresh();
  });
  var d = _cmdData();
  if (d && d.teachingCards) for (var c = 0; c < d.teachingCards.length; c++) {
    (function (idx) {
      var btn = document.getElementById("cmdCard_" + idx);
      if (btn) btn.addEventListener("click", function () {
        var box = document.getElementById("cmdCardBox_" + idx);
        if (box) box.style.display = (box.style.display === "none") ? "block" : "none";
      });
    })(c);
  }
}
