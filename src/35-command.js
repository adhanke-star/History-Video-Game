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

/* roster-ONLY resolution (the pre-Q11 _cmdById body) — the starting army roster, never the commission pool.
   Used where the distinction matters (the byte-identity-critical seeds + the commission "not-a-roster-id" guard). */
function _cmdByIdRoster(side, id) {
  var r = _cmdSideGenerals(side);
  for (var i = 0; i < r.length; i++) if (r[i] && r[i].id === id) return r[i];
  return null;
}

/* Resolve a general by id: the starting roster FIRST, then the Q11 (D109) commission pool (so a commissioned-
   then-appointed/seated officer resolves everywhere — cmdActiveGeneral, _cmdReputation, the corps billets — and
   a save that references him survives a reload). BYTE-IDENTICAL pre-Commission: a commission-pool id is never
   stored in any field until the player commissions him (a player action), so every pre-existing input resolves
   exactly as before (and _cmdHistoricalDefault reads the roster directly, never this). */
function _cmdById(side, id) {
  var g = _cmdByIdRoster(side, id);
  if (g) return g;
  return (typeof _cmdCommissionEntry === "function") ? _cmdCommissionEntry(side, id) : null;
}

var _cmdEsc = htmlEsc;

/* Strip a disambiguation suffix ("Johnston-J" -> "Johnston") for display + portrait. */
function _cmdName(gen) {
  if (!gen) return "";
  return String(gen.name || "").replace(/-[A-Za-z]$/, "");
}

function _cmdTheaterNorm(v) {
  var s = String(v || "").trim();
  if (s === "E") return "Eastern";
  if (s === "W") return "Western";
  if (/^east/i.test(s)) return "Eastern";
  if (/^west/i.test(s)) return "Western";
  if (/^multi/i.test(s)) return "Multi";
  return s;
}

function _cmdGeneralTheater(gen) {
  var t = _cmdTheaterNorm(gen && gen.theater);
  return (t === "Eastern" || t === "Western" || t === "Multi") ? t : "";
}

function _cmdGeneralTheaters(gen) {
  var seen = {}, out = [], raw = gen && gen.theaters;
  if (Array.isArray(raw)) {
    for (var i = 0; i < raw.length; i++) {
      var t = _cmdTheaterNorm(raw[i]);
      if ((t === "Eastern" || t === "Western") && !seen[t]) { seen[t] = 1; out.push(t); }
    }
  }
  var primary = _cmdGeneralTheater(gen);
  if ((primary === "Eastern" || primary === "Western") && !seen[primary]) out.push(primary);
  return out;
}

function _cmdGeneralFitsTheater(gen, theater) {
  var t = _cmdTheaterNorm(theater);
  if (t !== "Eastern" && t !== "Western") return false;
  var list = _cmdGeneralTheaters(gen);
  for (var i = 0; i < list.length; i++) if (list[i] === t) return true;
  return false;
}

function _cmdBattleTheater(C) {
  var bd = (typeof _brgNextBattle === "function") ? _brgNextBattle(C) : null;
  if (!bd) return "";
  var t = _cmdTheaterNorm(bd.theater);
  if (t === "Eastern" || t === "Western") return t;
  t = _cmdTheaterNorm(bd.th);
  if (t === "Eastern" || t === "Western") return t;
  try {
    var lg = gameData("logistics-rail"), route = lg && lg.routes && bd.id && lg.routes[bd.id];
    t = _cmdTheaterNorm(route && route.theater);
    if (t === "Eastern" || t === "Western") return t;
  } catch (e) {}
  return "";
}

function cmdTransferReadiness(C, id) {
  if (!C || !C.president || !id) return null;
  var side = (C.side === "CS") ? "CS" : "US";
  var gen = _cmdById(side, id); if (!gen) return null;
  var battleTheater = _cmdBattleTheater(C);
  var theaters = _cmdGeneralTheaters(gen);
  var primary = _cmdGeneralTheater(gen);
  var naturalFit = battleTheater ? _cmdGeneralFitsTheater(gen, battleTheater) : false;
  var transferred = !!(!naturalFit && _cmdTransferRecord(C, id));
  var fits = !!(naturalFit || transferred);
  return {
    id: gen.id,
    name: _cmdName(gen),
    theater: primary,
    theaters: theaters,
    battleTheater: battleTheater,
    naturalFit: !!naturalFit,
    transferred: transferred,
    sameTheater: !!fits,
    transferNeeded: !!(battleTheater && theaters.length && !naturalFit && !transferred),
    prov: gen.theaterProvenance || "Inferred"
  };
}

/* ===========================================================================
   Group 2 / D323 · CROSS-THEATER TRANSFER MOVE.

   The D322 theater substrate made cross-theater fit honest and probeable; this
   adds the explicit player move over that substrate. Transfer is deliberately a
   current-engagement command-readiness record: it spends political capital and
   stores only cmd.transfer for the player's command desk. It does not commission
   officers, does not create enemy command state, and does not write casualties,
   victory, OOB totals, or any combat output.

   E70 (D354, Aaron 2026-07-10): readiness now has EXACTLY ONE authorized
   consumer — _cmdTransferReadinessLift below, a small bounded command-friction
   term on commandLeadership (the same Q10/Q12 input facet the bridge already
   reads, never the scoreboard). It is 0 unless the PLAYER has explicitly
   appointed the active general AND he commands outside his home theater
   without a Transfer order; natural fit, completed Transfer, and the
   history-following default all read exactly 0, so untouched campaigns stay
   byte-identical. This is what the political capital buys.
   =========================================================================== */
function _cmdTransferCfg() { var d = gameData("ratings"); return (d && d.transfer) ? d.transfer : {}; }
function _cmdTransferCost() { var cfg = _cmdTransferCfg(); return Math.max(0, Math.round(_cmdNum(cfg.cost, 4))); }
function _cmdTransferMalus() { var cfg = _cmdTransferCfg(); return Math.max(0, Math.min(6, Math.round(_cmdNum(cfg.unreadyLeadershipMalus, 3)))); }

/* E70 (D354): the ONE bounded readiness consumer. Returns 0 or -malus. PURE —
   reads C only. 0 whenever: the player follows history (no explicit appointment
   -> the historical arrangement is the theater's own command, never repriced),
   the appointee naturally fits the battle theater, a Transfer order covers him,
   or theater data is absent (fail-safe). Only a deliberate, unprepared
   cross-theater appointment pays the friction — the honest model (a commander
   shifted between theaters without preparation commanded over unfamiliar
   ground, staffs, and armies), and exactly the case Transfer exists to fix. */
function _cmdTransferReadinessLift(C) {
  if (!C || !C.president || !C.president.command) return 0;
  var cmd = C.president.command;
  if (typeof cmd.fieldGeneral !== "string" || !cmd.fieldGeneral) return 0;   // history-following default
  var id = cmdActiveId(C);
  if (!id || id !== cmd.fieldGeneral) return 0;   // appointee dead/invalid -> historical fallback, no friction
  var rd = cmdTransferReadiness(C, id);
  if (!rd || !rd.transferNeeded) return 0;        // natural fit / transferred / no theater data
  return -_cmdTransferMalus();
}

function _cmdTransferRecord(C, id) {
  var cmd = C && C.president && C.president.command;
  var tr = cmd && cmd.transfer;
  if (!tr || typeof tr !== "object" || Array.isArray(tr) || !tr.ids || typeof tr.ids !== "object" || Array.isArray(tr.ids)) return null;
  var bd = (typeof _brgNextBattle === "function") ? _brgNextBattle(C) : null;
  var battleTheater = _cmdBattleTheater(C);
  if (!bd || !bd.id || !battleTheater || tr.battleId !== bd.id || tr.theater !== battleTheater) return null;
  var rec = tr.ids[id];
  return (rec && typeof rec === "object" && !Array.isArray(rec) && rec.theater === battleTheater) ? rec : null;
}

function _cmdTransferClean(C, persist) {
  var cmd = C && C.president && C.president.command;
  if (!cmd) return null;
  var raw = cmd.transfer;
  if (raw == null) return null;
  var bd = (typeof _brgNextBattle === "function") ? _brgNextBattle(C) : null;
  var battleTheater = _cmdBattleTheater(C);
  if (!bd || !bd.id || !battleTheater || Array.isArray(raw) || typeof raw !== "object" || raw.battleId !== bd.id || raw.theater !== battleTheater || !raw.ids || Array.isArray(raw.ids) || typeof raw.ids !== "object") {
    if (persist) cmd.transfer = null;
    return null;
  }
  var side = (C.side === "CS") ? "CS" : "US", outIds = {}, any = false;
  for (var k in raw.ids) {
    // E50 (D353): tamper-proof form — a save-derived ids object can shadow
    // hasOwnProperty with a non-callable own property; never call it off raw.
    if (!Object.prototype.hasOwnProperty.call(raw.ids, k)) continue;
    if (typeof k !== "string" || !k) continue;
    var g = _cmdById(side, k);
    if (!g || !_cmdAlive(g, C.president.date)) continue;
    if (!_cmdByIdRoster(side, k) && cmdCommissioned(C).indexOf(k) < 0) continue;
    if (_cmdGeneralFitsTheater(g, battleTheater)) continue;
    var rec = raw.ids[k];
    if (!rec || typeof rec !== "object" || Array.isArray(rec)) continue;
    var turn = (typeof rec.turn === "number" && isFinite(rec.turn) && rec.turn >= 0) ? Math.floor(rec.turn) : 0;
    outIds[k] = { theater: battleTheater, turn: turn };
    any = true;
  }
  var clean = any ? { battleId: bd.id, theater: battleTheater, ids: outIds } : null;
  if (persist) cmd.transfer = clean;
  return clean;
}

function cmdTransfer(C, id) {
  if (!C || !C.president || !id) return;
  cmdInit(C);
  var side = (C.side === "CS") ? "CS" : "US", cmd = C.president.command;
  var gen = _cmdById(side, id);
  if (!gen || !_cmdAlive(gen, C.president.date)) return;
  if (!_cmdByIdRoster(side, id) && cmdCommissioned(C).indexOf(id) < 0) return;
  var rd = cmdTransferReadiness(C, id);
  if (!rd || !rd.transferNeeded || !rd.battleTheater) return;
  var cost = _cmdTransferCost();
  var clk = C.clock, cap = (clk && typeof clk.capital === "number" && isFinite(clk.capital)) ? Math.round(clk.capital) : 0;
  if (cap < cost) return;
  if (clk && typeof clk.capital === "number") clk.capital = Math.max(0, cap - cost);
  var bd = (typeof _brgNextBattle === "function") ? _brgNextBattle(C) : null;
  cmd.transfer = _cmdTransferClean(C, false) || { battleId: (bd && bd.id) || "", theater: rd.battleTheater, ids: {} };
  cmd.transfer.battleId = (bd && bd.id) || cmd.transfer.battleId;
  cmd.transfer.theater = rd.battleTheater;
  if (!cmd.transfer.ids || typeof cmd.transfer.ids !== "object" || Array.isArray(cmd.transfer.ids)) cmd.transfer.ids = {};
  cmd.transfer.ids[id] = { theater: rd.battleTheater, turn: (C.president.turn || 0) };
  _cmdTransferClean(C, true);
  if (typeof _pdLog === "function") {
    _pdLog(C, "You transfer General " + _cmdName(gen) + " to the " + rd.battleTheater + " theater"
      + (cost ? " (−" + cost + " capital)" : "") + ". This is a command-readiness order, not a battle result.");
  }
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

/* ===========================================================================
   Q8b (D107) · THE BETWEEN-BATTLE CAVALRY RECONNAISSANCE (RATING-SYSTEM-DESIGN §15)
   The camp loop's deferred SCOUTING (deferred at D100 until the D106 OOB substrate existed).
   The President orders a recon of the next engagement on the Command desk: it spends a small
   amount of political capital (the existing GM currency) and reveals the enemy Order of Battle —
   rendered by T15's fldCampaignOOBHtml — to a tier scaled by the appointed army commander's persona
   `cavalry` attribute (Stuart's eyes vs the Gettysburg intelligence vacuum). PURE DISPLAY + an
   economy spend: cmdScout writes ONLY cmd.scout (the revealed tier, keyed to the next-battle id so
   intel is fresh per engagement) + debits capital — it NEVER writes the scoreboard (build-gate 4d).
   A campaign that never scouts is byte-identical to the pre-Q8b build (no scout record -> light tier).
   =========================================================================== */
function _cmdScoutCfg() { var d = gameData("ratings"); return (d && d.scout) ? d.scout : {}; }

/* the appointed army commander's persona `cavalry` (his use of and skill with the mounted arm /
   reconnaissance); the configured baseline when no general is appointed (the default historical
   command). Clamped [0,100]. */
function _cmdScoutCavalry(C) {
  var cfg = _cmdScoutCfg(), base = _cmdNum(cfg.baselineCavalry, 54);
  try {
    var gen = (typeof cmdActiveGeneral === "function") ? cmdActiveGeneral(C) : null;
    if (gen) {
      var rec = _cmdGenPersona(gen);
      if (rec && rec.persona && typeof rec.persona.cavalry === "number" && isFinite(rec.persona.cavalry)) {
        return Math.max(0, Math.min(100, rec.persona.cavalry));
      }
    }
  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_cmdScoutCavalry:", e); }
  return Math.max(0, Math.min(100, base));
}

/* PURE: the recon tier a given cavalry rating earns — at/above the threshold the FULL enemy OOB
   ("great" recon, §15), below it a "better" recon (named + per-corps grade + posture). Garbage cav
   -> the baseline -> a safe "better" (never throws, never "full" by accident). */
function _cmdScoutTierForCavalry(cav) {
  var cfg = _cmdScoutCfg(), thr = _cmdNum(cfg.cavalryFullThreshold, 65);
  var c = _cmdNum(cav, _cmdNum(cfg.baselineCavalry, 54));
  return (c >= thr) ? "full" : "better";
}

/* the reveal tier the board should render for the CURRENT next-battle: the stored scout tier when it
   was taken for THIS engagement, else "light" (the passive estimate). Stale recon (the engagement
   changed) reverts to light — fresh intelligence per battle. Read-only. */
function cmdScoutTier(C) {
  if (!C || !C.president) return "light";
  var cmd = C.president.command;
  if (!cmd || !cmd.scout || !cmd.scout.battleId) return "light";
  var bd = (typeof _brgNextBattle === "function") ? _brgNextBattle(C) : null;
  if (!bd || !bd.id || cmd.scout.battleId !== bd.id) return "light";
  return (cmd.scout.tier === "full") ? "full" : (cmd.scout.tier === "better") ? "better" : "light";
}

/* THE WRITE — order a reconnaissance of the next engagement. Gates on political capital (mirrors
   cmdAppoint), reveals the enemy OOB to the tier the appointed general's cavalry earns, and records it
   keyed to the battle id. No-op when there is no next battle, it is already scouted, or capital is
   short. Writes ONLY cmd.scout + C.clock.capital — never the scoreboard. */
function cmdScout(C) {
  if (!C || !C.president) return;
  cmdInit(C);
  var bd = (typeof _brgNextBattle === "function") ? _brgNextBattle(C) : null;
  if (!bd || !bd.id) return;
  var cmd = C.president.command;
  if (cmd.scout && cmd.scout.battleId === bd.id) return;        // already reconnoitred this engagement (no re-charge)
  var cfg = _cmdScoutCfg(), cost = Math.max(0, Math.round(_cmdNum(cfg.cost, 3)));
  var clk = C.clock, cap = (clk && typeof clk.capital === "number" && isFinite(clk.capital)) ? Math.round(clk.capital) : 0;   // round to the displayed capital (the cmdAppoint idiom)
  if (cap < cost) return;                                       // can't afford the reconnaissance (the gate)
  if (clk && typeof clk.capital === "number") clk.capital = Math.max(0, cap - cost);   // Q8b bug-hunt (LOW): debit the SAME rounded value the gate compared (the hardened cmdPromote idiom), so a fractional balance can't pass the rounded gate yet be floor-absorbed on the raw spend — byte-identical under every current integer-only capital path
  var cav = _cmdScoutCavalry(C), tier = _cmdScoutTierForCavalry(cav);
  cmd.scout = { battleId: bd.id, tier: tier, turn: (C.president.turn || 0), cavalry: Math.round(cav) };
  if (typeof _pdLog === "function") {
    _pdLog(C, "Your cavalry rides out to reconnoiter " + (bd.name || "the next engagement")
      + (cost ? " (−" + cost + " capital)" : "") + " — "
      + (tier === "full" ? "they bring back the enemy's full order of battle."
                         : "they sketch the enemy's corps and posture."));
  }
}

/* the recon CONTROL embedded in the OOB board (passed to fldCampaignOOBHtml as opts.reconHtml). When
   unscouted: a button (affordable) or a needs-capital note (mirrors _cmdPromoRow), plus the teaching.
   When scouted: a "reconnaissance complete" badge naming the tier reached. "" when no next battle. */
function cmdScoutControlHtml(C) {
  if (!C || !C.president) return "";
  var bd = (typeof _brgNextBattle === "function") ? _brgNextBattle(C) : null;
  if (!bd || !bd.id) return "";
  var cmd = C.president.command || {};
  var cfg = _cmdScoutCfg(), cost = Math.max(0, Math.round(_cmdNum(cfg.cost, 3)));
  var wrap = function (inner) {
    return '<div style="margin-top:11px;padding:9px 11px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.08)">'
      + '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' + inner + '</div></div>';
  };
  if (cmd.scout && cmd.scout.battleId === bd.id) {
    var tier = (cmd.scout.tier === "full") ? "full" : "better";
    var label = (tier === "full") ? "their full order of battle is in hand" : "their corps and posture are scouted";
    return wrap(
      '<span aria-hidden="true" style="font-size:15px;flex:0 0 auto">&#9876;</span>'
      + '<span style="font-size:12px;flex:1 1 200px;min-width:160px"><b>Reconnaissance complete</b> &mdash; ' + _cmdEsc(label) + '. '
      + '<span style="opacity:.66">Fresh intelligence awaits the next engagement.</span></span>'
    );
  }
  var clk = C.clock, cap = (clk && typeof clk.capital === "number" && isFinite(clk.capital)) ? Math.round(clk.capital) : 0;
  var ctrl = (cap >= cost)
    ? '<button id="cmdScout" type="button" class="upg" style="flex:0 0 auto" title="Order a cavalry reconnaissance of ' + _cmdEsc(bd.name || "the next engagement") + ' &mdash; ' + cost + ' political capital. How much it reveals scales with your army&rsquo;s cavalry leadership.">Order a reconnaissance <span style="opacity:.8">(&minus;' + cost + ' cap)</span></button>'
    : '<span style="font-size:11px;color:#e86840;flex:0 0 auto" title="A reconnaissance needs ' + cost + ' political capital">Needs ' + cost + ' capital to scout</span>';/* wcag-auditor: contrast fix from #d66040 to #e86840 for AA compliance — #d66040 yields 3.92:1 on #2e2816 (sheet lightest) and 4.33:1 on the effective rendered bg; #e86840 yields ≥4.53:1 on all rendered backgrounds (same hue, L 0.545→0.580) */
  var hint = 'Send your cavalry to reconnoiter the enemy &mdash; how much they uncover (an outline of corps and posture, or the full order of battle) scales with your army&rsquo;s cavalry leadership. '
    + '<span style="opacity:.82">Good cavalry were an army&rsquo;s eyes: Stuart&rsquo;s rides screened Lee, and his absence before Gettysburg left Lee blind.</span>';
  return wrap(ctrl + '<span style="font-size:10.5px;opacity:.74;flex:1 1 220px;min-width:180px;line-height:1.42">' + hint + '</span>');
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
  // Q11 (D109): the COMMISSION record — the ids of the political generals the President has brought into the
  // service (cmd.commissioned). Seeded to [] once + SANITIZED on LOAD (drop dupes / bogus ids / starting-roster
  // ids / over-cap; the Q9/Q8b/Q10 load-sanitize idiom). Empty -> the pools are the bare roster -> byte-identical.
  if (!Array.isArray(cmd.commissioned)) cmd.commissioned = [];
  if (typeof _cmdCommissionedClean === "function") _cmdCommissionedClean(C, true);
  // Q8b (D107): the cavalry-reconnaissance record — the revealed enemy-OOB tier, keyed to the next-battle id so
  // intel is fresh per engagement. Absent/null -> no reveal (the board shows the light/passive estimate) ->
  // byte-identical until the player scouts. SANITIZE a stale/tampered/imported record on LOAD (the Q9 re-clamp
  // idiom): a malformed record is dropped to null rather than poisoning the board; a valid one is bounded.
  if (cmd.scout != null) {
    var _sc = cmd.scout;
    var _okScout = _sc && typeof _sc === "object" && !Array.isArray(_sc)
      && typeof _sc.battleId === "string" && _sc.battleId.length
      && (_sc.tier === "better" || _sc.tier === "full");
    if (!_okScout) { cmd.scout = null; }
    else {
      _sc.turn = (typeof _sc.turn === "number" && isFinite(_sc.turn) && _sc.turn >= 0) ? Math.floor(_sc.turn) : 0;
      _sc.cavalry = (typeof _sc.cavalry === "number" && isFinite(_sc.cavalry)) ? Math.max(0, Math.min(100, _sc.cavalry)) : 0;
    }
  }
  // D323: the explicit Transfer move's current-engagement readiness record. Absent/null -> no transferred
  // generals and no default behavior change. On load, malformed, stale-battle, wrong-side, uncommissioned,
  // native-fit, duplicate, or dead/off-date entries are dropped; valid entries are bounded to the next battle's
  // broad theater. This keeps Transfer player-visible and minimal, never an enemy shadow or hidden commission.
  if (typeof _cmdTransferClean === "function") _cmdTransferClean(C, true);
  // seed reputation for every general on this side, once (idempotent: only if absent). Q11 (D109): include any
  // COMMISSIONED officers so _cmdGenRating reads them once they are in the service — byte-identical when none
  // are commissioned (the commissioned set is empty -> the seed list is exactly the starting roster).
  var roster = (typeof _cmdRosterPlusCommissioned === "function") ? _cmdRosterPlusCommissioned(C, side) : _cmdSideGenerals(side);
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
  // Q10 (D108): the CORPS DEPTH-CHART — seed cmd.corps once (empty -> zero leadership lift -> byte-identical)
  // and SANITIZE a stale/tampered/imported record on LOAD (drop invalid slots/ids/dead generals/the army
  // commander; one corps per general — the Q9/Q8b sanitize-on-load idiom). Placed AFTER fieldGeneral is
  // finalized so cmdActiveId (which _cmdCorpsClean excludes from the corps) is stable. Plain data, rides the save.
  if (typeof _cmdCorpsClean === "function") _cmdCorpsClean(C, true);
  // Q12 (D110): the DIVISION sub-tier — seed/sanitize cmd.divisions AFTER the corps chart is finalized (it
  // requires the seated-corps set: a division whose parent corps is no longer seated is orphaned and dropped —
  // the cascade). Drops invalid slots/ids/dead generals/the army commander/anyone holding a corps; one billet
  // per general across the tree. Empty -> zero division lift -> byte-identical. The Q9/Q10 sanitize-on-load idiom.
  if (typeof _cmdDivClean === "function") _cmdDivClean(C, true);
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
   Group 2 / D173 · SYMMETRIC AI-GM SHADOW (RATING-SYSTEM-DESIGN §12/§15).

   The opponent now runs the same kind of command evaluation the player does: it
   reads the current enemy roster, chooses an army commander for the next battle's
   attack/defend role, and seats a small staff shadow for corps/division quality.
   This first slice is deliberately PURE: no C.president.command enemy state, no
   hidden commissions, no Transfer, no theater invention, and no battle-result
   writes. It produces bounded inputs/readouts that later resolve code can consume
   without adding a separate combat model or scoreboard fudge.
   =========================================================================== */
function _cmdAiGmCfg() { var d = gameData("ratings"); return (d && d.aiGm) ? d.aiGm : {}; }
function _cmdEnemySide(C) { return ((C && C.side) === "CS") ? "US" : "CS"; }
function _cmdAiGmTier(C) {
  var cfg = _cmdAiGmCfg(), styles = (cfg && cfg.styleByAiTier) || {};
  var tier = null;
  try { if (typeof G !== "undefined" && G.settings && G.settings.tacticalPreset) tier = G.settings.tacticalPreset.ai; } catch (e) {}
  if (!tier && C && C.settings && C.settings.tacticalPreset) tier = C.settings.tacticalPreset.ai;
  var def = cfg && cfg.defaultTier ? String(cfg.defaultTier) : "veteran";
  tier = tier ? String(tier) : def;
  return styles[tier] ? tier : (styles[def] ? def : "veteran");
}
function _cmdAiGmStyle(C) {
  var cfg = _cmdAiGmCfg(), styles = (cfg && cfg.styleByAiTier) || {};
  var tier = _cmdAiGmTier(C);
  var st = styles[tier] || styles.veteran || {};
  return {
    tier: tier,
    label: st.label ? String(st.label) : tier,
    commanderMode: st.commanderMode === "historical" ? "historical" : "role",
    corpsSlots: Math.max(0, Math.min(8, Math.floor(_cmdNum(st.corpsSlots, 2)))),
    divisionSlots: Math.max(0, Math.min(24, Math.floor(_cmdNum(st.divisionSlots, 2))))
  };
}
function _cmdAiGmBaseRating(gen) {
  if (!gen) return 64;
  var skill = _cmdEffectiveSkill(gen, null);
  var rep = (typeof gen.reputation === "number" && isFinite(gen.reputation)) ? gen.reputation : 60;
  return 0.55 * skill + 0.45 * Math.max(0, Math.min(100, rep));
}
function _cmdAiGmDualOVR(gen) {
  var ovr = Math.round(_cmdAiGmBaseRating(gen));
  var rec = (typeof _cmdGenPersona === "function") ? _cmdGenPersona(gen) : null;
  var atkT, defT;
  if (rec && rec.persona && typeof fldDualTilt === "function") {
    var t = fldDualTilt(rec.persona); atkT = t.attack; defT = t.defend;
  } else {
    var agg = (gen && typeof gen.aggression === "number") ? gen.aggression : 50;
    var cau = (gen && typeof gen.caution === "number") ? gen.caution : 50;
    atkT = Math.round((agg - 50) * 0.18); defT = Math.round((cau - 50) * 0.18);
  }
  function _clAi(v) { return v < 0 ? 0 : (v > 100 ? 100 : v); }
  return { headline: ovr, attack: _clAi(ovr + atkT), defend: _clAi(ovr + defT) };
}
function _cmdAiGmRoleScore(gen, role) {
  var d = _cmdAiGmDualOVR(gen);
  return role === "attack" ? d.attack : d.defend;
}
function _cmdAiGmSort(C, side, role, roleOnly) {
  return function (a, b) {
    var ar = roleOnly ? _cmdAiGmRoleScore(a, role) : _cmdAiGmBaseRating(a);
    var br = roleOnly ? _cmdAiGmRoleScore(b, role) : _cmdAiGmBaseRating(b);
    if (br !== ar) return br - ar;
    var ah = _cmdAiGmBaseRating(a), bh = _cmdAiGmBaseRating(b);
    if (bh !== ah) return bh - ah;
    var an = _cmdName(a), bn = _cmdName(b);
    return an < bn ? -1 : (an > bn ? 1 : 0);
  };
}
function _cmdAiGmSnapshot(gen, side, kind) {
  if (!gen) return null;
  var d = _cmdAiGmDualOVR(gen);
  var below = (kind === "division") ? _cmdAiGmDivBelowGrade(side, gen)
    : (kind === "corps") ? _cmdAiGmCorpsBelowGrade(side, gen) : false;
  var eff = (kind === "division") ? _cmdAiGmDivEffRating(side, gen)
    : (kind === "corps") ? _cmdAiGmCorpsEffRating(side, gen) : d.headline;
  return {
    id: gen.id,
    name: _cmdName(gen),
    ovr: Math.round(eff),
    headline: d.headline,
    attack: d.attack,
    defend: d.defend,
    theater: _cmdGeneralTheater(gen),
    theaters: _cmdGeneralTheaters(gen),
    theaterProvenance: gen.theaterProvenance || "Inferred",
    grade: _cmdBaseGrade(gen),
    belowGrade: !!below,
    aggression: (typeof gen.aggression === "number") ? gen.aggression : 50,
    caution: (typeof gen.caution === "number") ? gen.caution : 50
  };
}
function _cmdAiGmCorpsBelowGrade(side, gen) {
  var cfg = _cmdCorpsCfg(); if (!cfg || !gen) return false;
  var prefIdx = _cmdGradeIdx(_cmdCorpsPreferredGrade({ side: side }));
  if (prefIdx < 0) return false;
  return _cmdGradeIdx(_cmdBaseGrade(gen)) < prefIdx;
}
function _cmdAiGmCorpsEffRating(side, gen) {
  var r = _cmdAiGmBaseRating(gen);
  if (_cmdAiGmCorpsBelowGrade(side, gen)) r -= Math.max(0, _cmdNum((_cmdCorpsCfg() || {}).belowGradePenalty, 6));
  return Math.max(0, Math.min(100, r));
}
function _cmdAiGmDivBelowGrade(side, gen) {
  var cfg = _cmdDivCfg(); if (!cfg || !gen) return false;
  var prefIdx = _cmdGradeIdx(_cmdDivPreferredGrade({ side: side }));
  if (prefIdx < 0) return false;
  return _cmdGradeIdx(_cmdBaseGrade(gen)) < prefIdx;
}
function _cmdAiGmDivEffRating(side, gen) {
  var r = _cmdAiGmBaseRating(gen);
  if (_cmdAiGmDivBelowGrade(side, gen)) r -= Math.max(0, _cmdNum((_cmdDivCfg() || {}).belowGradePenalty, 4));
  return Math.max(0, Math.min(100, r));
}
function _cmdAiGmStaffLift(corps, divisions) {
  var cfg = _cmdAiGmCfg();
  var cw = _cmdNum(cfg.corpsWeight, 0.04), dw = _cmdNum(cfg.divisionWeight, 0.02);
  var ccap = Math.max(0, _cmdNum(cfg.corpsLiftCap, 3)), dcap = Math.max(0, _cmdNum(cfg.divisionLiftCap, 1));
  var csum = 0, dsum = 0;
  for (var i = 0; i < corps.length; i++) csum += ((_cmdNum(corps[i].commander && corps[i].commander.ovr, 64) - 64) * cw);
  for (var j = 0; j < divisions.length; j++) dsum += ((_cmdNum(divisions[j].commander && divisions[j].commander.ovr, 64) - 64) * dw);
  var clift = csum > ccap ? ccap : (csum < -ccap ? -ccap : csum);
  var dlift = dsum > dcap ? dcap : (dsum < -dcap ? -dcap : dsum);
  var cap = Math.max(0, _cmdNum(cfg.leadershipCap, 4));
  var total = clift + dlift;
  return {
    corps: clift,
    divisions: dlift,
    total: total > cap ? cap : (total < -cap ? -cap : total)
  };
}

/* PURE: the opponent's GM shadow for the next engagement. It uses only existing,
   date-available enemy roster rows; it does not write an enemy command save object. */
function cmdEnemyShadow(C) {
  if (!C || !C.president) return null;
  var cfg = _cmdAiGmCfg(); if (cfg && cfg.enabled === false) return null;
  var bd = (typeof _brgNextBattle === "function") ? _brgNextBattle(C) : null;
  if (!bd) return null;
  var side = _cmdEnemySide(C), date = C.president.date;
  var roster0 = _cmdSideGenerals(side), roster = [];
  for (var i = 0; i < roster0.length; i++) if (roster0[i] && _cmdAlive(roster0[i], date)) roster.push(roster0[i]);
  if (!roster.length) return null;
  var atk = bd.atk;
  if (C.flipAtk && (atk === "US" || atk === "CS")) atk = (atk === "US") ? "CS" : "US";
  var role = (atk === side) ? "attack" : "defend";
  var style = _cmdAiGmStyle(C);
  var sorted = roster.slice().sort(_cmdAiGmSort(C, side, role, true));
  var commander = sorted[0];
  if (style.commanderMode === "historical") {
    var hist = _cmdHistoricalDefault(side, date);
    if (hist && _cmdAlive(hist, date)) commander = hist;
  }
  var used = {}; if (commander && commander.id) used[commander.id] = 1;
  var corps = [], divisions = [], avail;
  avail = roster.slice().filter(function (g) { return !used[g.id]; });
  avail.sort(function (a, b) {
    var br = _cmdAiGmCorpsEffRating(side, b), ar = _cmdAiGmCorpsEffRating(side, a);
    if (br !== ar) return br - ar;
    return _cmdAiGmSort(C, side, role, true)(a, b);
  });
  var cSlots = Math.min(style.corpsSlots, _cmdCorpsSlots(), avail.length);
  for (var c = 0; c < cSlots; c++) {
    var cg = avail[c]; used[cg.id] = 1;
    corps.push({ slot: c, label: _cmdCorpsLabel(c), commander: _cmdAiGmSnapshot(cg, side, "corps") });
  }
  avail = roster.slice().filter(function (g) { return !used[g.id]; });
  avail.sort(function (a, b) {
    var br = _cmdAiGmDivEffRating(side, b), ar = _cmdAiGmDivEffRating(side, a);
    if (br !== ar) return br - ar;
    return _cmdAiGmSort(C, side, role, true)(a, b);
  });
  var maxDiv = Math.min(style.divisionSlots, Math.max(0, cSlots * _cmdDivPerCorps()), avail.length);
  for (var d = 0; d < maxDiv; d++) {
    var dg = avail[d]; used[dg.id] = 1;
    var parent = cSlots ? (d % cSlots) : 0;
    var divIdx = cSlots ? Math.floor(d / cSlots) : d;
    divisions.push({ corpsSlot: parent, divisionSlot: divIdx, label: _cmdCorpsLabel(parent) + " / " + _cmdDivLabel(divIdx), commander: _cmdAiGmSnapshot(dg, side, "division") });
  }
  var cmdr = _cmdAiGmSnapshot(commander, side, "army");
  var lifts = _cmdAiGmStaffLift(corps, divisions);
  var base = 64 + (_cmdNum(cmdr && cmdr.headline, 64) - 64) * 0.7 + lifts.total;
  var leadership = Math.max(42, Math.min(88, Math.round(base)));
  return {
    side: side,
    battleId: bd.id || null,
    battleName: bd.name || "",
    battleTheater: _cmdBattleTheater(C),
    role: role,
    aiTier: style.tier,
    label: style.label,
    commander: cmdr,
    corps: corps,
    divisions: divisions,
    lift: lifts,
    leadership: leadership,
    prov: "Inferred"
  };
}
function cmdEnemyLeadership(C) {
  var sh = cmdEnemyShadow(C);
  return sh ? sh.leadership : 64;
}
function cmdEnemyMarginEdge(C, enemyAttacks) {
  var sh = cmdEnemyShadow(C), t = sh && sh.commander;
  if (!t) return 0;
  return enemyAttacks ? (_cmdNum(t.aggression, 50) - 50) * 0.04 : (_cmdNum(t.caution, 50) - 50) * 0.04;
}
function cmdEnemyCorpsCommanderFor(C, idx) {
  var sh = cmdEnemyShadow(C);
  if (!sh || !sh.corps) return null;
  for (var i = 0; i < sh.corps.length; i++) if (sh.corps[i] && sh.corps[i].slot === idx) return sh.corps[i].commander || null;
  return null;
}
function cmdEnemyShadowHTML(C) {
  var sh = cmdEnemyShadow(C);
  if (!sh || !sh.commander) return "";
  var role = sh.role === "attack" ? "Attacking command" : "Defensive command";
  var th = sh.commander.theater ? (' &middot; ' + _cmdEsc(sh.commander.theater) + ' theater') : '';
  var corps = "";
  for (var i = 0; i < sh.corps.length; i++) {
    var co = sh.corps[i], cg = co && co.commander;
    if (!cg) continue;
    corps += '<span style="display:inline-flex;gap:5px;align-items:baseline;border:1px solid var(--rule);border-radius:4px;padding:2px 6px;background:rgba(0,0,0,.08)">'
      + '<b style="font-size:10px;color:#b3925e">' + _cmdEsc(co.label) + '</b>'
      + '<span style="font-size:11px">' + _cmdEsc(cg.name) + ' <span style="opacity:.68">OVR ' + cg.ovr + '</span></span>'
      + (cg.belowGrade ? '<span title="commands below grade" aria-label="commands below grade" style="opacity:.82">&#9650;</span>' : '')
      + '</span>';
  }
  if (!corps) corps = '<span style="font-size:11px;opacity:.68">No staffed corps shadow at this AI level.</span>';
  return ''
    + '<div style="margin:12px 0 14px;padding:11px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.12)">'
    +   '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:6px">'
    +     '<div><span style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#b3925e">Enemy command shadow</span>'
    +       '<span style="font-size:11px;opacity:.72"> &mdash; ' + _cmdEsc(sh.label) + ' / ' + _cmdEsc(role) + '</span></div>'
    +     '<div style="display:inline-flex;align-items:baseline;gap:8px"><b style="font-size:19px;line-height:1">' + sh.leadership + '</b><span style="font-size:9px;opacity:.62;letter-spacing:.05em">ENEMY LEADERSHIP</span></div>'
    +   '</div>'
    +   '<div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap">'
    +     '<span style="font-weight:bold;font-size:14px">' + _cmdEsc(sh.commander.name) + '</span>'
    +     '<span style="font-size:11px;opacity:.75">Army OVR ' + sh.commander.headline + ' &middot; ATK ' + sh.commander.attack + ' / DEF ' + sh.commander.defend + th + '</span>'
    +     '<span style="font-size:10px;opacity:.58">Pure AI-GM readout; no hidden Transfer.</span>'
    +   '</div>'
    +   '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:8px">' + corps + '</div>'
    + '</div>';
}

function _cmdTransferHTML(C) {
  if (!C || !C.president) return "";
  var bd = (typeof _brgNextBattle === "function") ? _brgNextBattle(C) : null;
  var battleTheater = _cmdBattleTheater(C);
  if (!bd || !bd.id || !battleTheater) return "";
  var side = (C.side === "CS") ? "CS" : "US";
  var roster = _cmdRosterPlusCommissioned(C, side);
  if (!roster.length) return "";
  var cap = (C.clock && typeof C.clock.capital === "number" && isFinite(C.clock.capital)) ? Math.round(C.clock.capital) : 0;
  var cost = _cmdTransferCost();
  var rows = "", cross = 0, transferred = 0;
  for (var i = 0; i < roster.length; i++) {
    var g = roster[i]; if (!g || !g.id || !_cmdAlive(g, C.president.date)) continue;
    var rd = cmdTransferReadiness(C, g.id);
    if (!rd || !rd.battleTheater || !rd.theaters || !rd.theaters.length) continue;
    var tLabel = rd.theater === "Multi" ? "Multi-theater" : (rd.theater ? rd.theater + " theater" : "unclassified");
    var status, ctrl = "";
    if (rd.transferred) {
      transferred++;
      status = '<span style="font-size:11px;color:#6f9e5a"><span aria-hidden="true">&#10003;</span> Transferred for ' + _cmdEsc(bd.name || "the next engagement") + '</span>';
    } else if (rd.transferNeeded) {
      cross++;
      status = '<span style="font-size:11px;color:#e86840">Cross-theater for this battle</span>';
      ctrl = (cap >= cost)
        ? '<button id="cmdTransfer_' + _cmdEsc(g.id) + '" type="button" class="upg" style="flex:0 0 auto;font-size:11px;padding:2px 8px" title="Transfer General ' + _cmdEsc(_cmdName(g)) + ' to the ' + _cmdEsc(battleTheater) + ' theater for ' + cost + ' political capital">Transfer <span style="opacity:.8">(&minus;' + cost + ' cap)</span></button>'
        : '<span style="font-size:11px;color:#e86840" title="Transferring him costs ' + cost + ' political capital; you hold ' + cap + '">Needs ' + cost + ' cap</span>';
    } else {
      status = '<span style="font-size:11px;opacity:.72">Fits this theater already</span>';
    }
    var ovr = Math.round(_cmdGenRating(C, g));
    rows += '<div style="display:flex;gap:10px;align-items:center;padding:6px 0;border-bottom:1px dotted var(--rule)">'
      + '<div style="flex:1 1 auto;min-width:0">'
      +   '<div style="font-size:12px"><b>' + _cmdEsc(_cmdName(g)) + '</b> <span style="opacity:.68">' + _cmdEsc(tLabel) + '</span></div>'
      +   '<div style="font-size:10.5px;opacity:.72">Theater fit for ' + _cmdEsc(bd.name || "next battle") + ': ' + _cmdEsc(battleTheater)
      +     ' &middot; OVR ' + ovr + ' &middot; ' + _cmdEsc(rd.prov || "Inferred") + '</div>'
      + '</div>'
      + '<div style="flex:0 0 auto;text-align:right">' + status + (ctrl ? '<div style="margin-top:3px">' + ctrl + '</div>' : '') + '</div>'
      + '</div>';
  }
  if (!rows) return "";
  var open = cross + transferred;
  var summary = open
    ? '<b>' + open + '</b> officer' + (open === 1 ? '' : 's') + ' need or carry a cross-theater order for this engagement.'
    : 'No cross-theater order is needed for this engagement.';
  return '<div style="margin-top:14px;padding:11px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.1)">'
    + '<div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#b3925e;margin-bottom:2px">Cross-theater transfer</div>'
    + '<div style="font-size:11px;opacity:.82;line-height:1.45;margin-bottom:5px">Next battle: <b>' + _cmdEsc(bd.name || bd.id) + '</b> &middot; theater <b>' + _cmdEsc(battleTheater) + '</b>. '
    + summary + ' Transfer spends <b>' + cost + '</b> political capital and buys command readiness: a general you appoint outside his home theater carries a command-friction penalty (&minus;' + _cmdTransferMalus() + ' leadership) until transferred. It never decides the battle, alters casualties, or moves enemy command.</div>'
    + rows
    + '<div style="font-size:10.5px;opacity:.62;line-height:1.4;margin-top:6px">Theater tags are broad, Inferred buckets. Multi-theater generals already fit; single-theater generals need an explicit order before the Command desk treats them as ready outside their home theater. The friction reaches the army only through the leadership facet the bridge already reads &mdash; the historical default command never pays it.</div>'
    + '</div>';
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
  if (!_cmdByIdRoster(side, id) && cmdCommissioned(C).indexOf(id) < 0) return;   // Q11 (D109) bug-hunt MED: a commission-pool officer must be COMMISSIONED before he can be promoted (byte-identical for roster ids)
  var info = _cmdPromoteInfo(C, g);
  if (!info) return;                                   // at the top grade / no config
  var clk = C.clock, cap = (clk && typeof clk.capital === "number" && isFinite(clk.capital)) ? Math.round(clk.capital) : 0;
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
   Q10 (D108) · THE CORPS DEPTH-CHART — the GM depth-chart MOVE (RATING-SYSTEM-DESIGN §12.1/§12.2/§12.4).

   Beyond appointing the ARMY commander (the cmdAppoint billet), the President now SEATS pool generals into
   the army's CORPS billets (I..IV Corps) over the D106 OOB tree, spending political capital (the existing GM
   currency — no new resource, §12). HOW IT REACHES THE FIGHT (no new combat path; honors D74/D94 no-fudge):
   seated corps commanders only shape the army's LEADERSHIP facet — an INPUT the bridge already reads — via a
   small BOUNDED lift folded into commandLeadership: lift = clamp( SUM over seated slots of
   (effectiveCorpsRating - 64) * perSlotWeight, -liftCap, +liftCap ). effectiveCorpsRating = the general's GM
   OVR (_cmdGenRating, which already carries the Q9 promotion lift) minus belowGradePenalty when his current
   grade is below `preferredGrade` (a corps is properly a Maj. Gen.'s billet — seat a junior man and he leads
   stretched; promote him first to lift the penalty — the Q9 synergy). BYTE-IDENTICAL until the player seats a
   corps: no corps seated -> the SUM is over zero slots -> lift 0 -> commandLeadership unchanged -> the sandbox
   + all 9 battles identical (a vacant billet contributes 0, NOT a baseline penalty — that would break
   byte-identity). The seated commanders also NAME the player's DERIVED corps on the OOB board (pure display via
   T15's fldCampaignOOB; the predicted edge is unchanged — leadership is captured in the actual fight, never
   double-counted in the display). cmd.corps rides the save (no _SAVE_VER bump); cmdInit sanitizes a
   stale/tampered/imported record on LOAD (drop invalid slots/ids/dead generals/the army commander; one corps
   per general). Writes ONLY cmd.corps + C.clock.capital — never the scoreboard (build-gate 4d scans this file).
   =========================================================================== */
function _cmdCorpsCfg() { var d = gameData("ratings"); return (d && d.corpsCommand) ? d.corpsCommand : null; }
function _cmdCorpsSlots() { var cfg = _cmdCorpsCfg(); var n = cfg ? Math.floor(_cmdNum(cfg.slots, 4)) : 4; return Math.max(1, Math.min(8, n)); }
function _cmdCorpsLabel(idx) {
  var cfg = _cmdCorpsCfg(), labels = cfg && cfg.labels;
  if (labels && labels[idx] != null) return String(labels[idx]);
  var R = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  return (R[idx] || String(idx + 1)) + " Corps";
}
/* the corps preferred grade for a side (SIDE-AWARE: a US corps was a Maj. Gen.'s command, a CS corps a
   Lt. Gen.'s — the CS authorized the Lt. Gen. grade Sept. 18, 1862, promoting Longstreet/Jackson that Oct. to
   command the ANV's new corps). Accepts the config as either a {US,CS} map or a bare string. */
function _cmdCorpsPreferredGrade(C) {
  var cfg = _cmdCorpsCfg(); var pg = cfg && cfg.preferredGrade;
  var side = (C && C.side === "CS") ? "CS" : "US";
  if (pg && typeof pg === "object") return String(pg[side] || pg.US || "Maj. Gen.");
  return pg ? String(pg) : "Maj. Gen.";
}

/* the SANITIZED corps depth chart as { slotIndex: generalId }: only valid slots, alive same-side generals who
   are NOT the army commander, one corps per general (first slot wins). persist=true writes the clean map back
   (the cmdInit load-sanitize, the Q9/Q8b idiom); persist=false is a PURE read (the lift/render/T15 path). */
function _cmdCorpsClean(C, persist) {
  var out = {};
  var cmd = C && C.president && C.president.command;
  if (!cmd) return out;
  var raw = cmd.corps;
  if (Array.isArray(raw) || !raw || typeof raw !== "object") { if (persist) cmd.corps = {}; return out; }
  var slots = _cmdCorpsSlots(), side = (C.side === "CS") ? "CS" : "US";
  var activeId = (typeof cmdActiveId === "function") ? cmdActiveId(C) : null;
  var used = {};
  for (var k in raw) {
    if (!raw.hasOwnProperty(k)) continue;
    var idx = Math.floor(_cmdNum(parseInt(k, 10), -1));
    if (!(idx >= 0 && idx < slots)) continue;            // invalid / out-of-range slot
    var id = raw[k];
    if (typeof id !== "string" || !id) continue;
    if (id === activeId) continue;                       // the army commander can't also hold a corps
    var g = _cmdById(side, id);
    if (!g || !_cmdAlive(g, C.president.date)) continue;  // gone / dead / not in the war
    if (used[id]) continue;                              // already placed in an earlier slot (dedupe)
    used[id] = 1; out[idx] = id;
  }
  if (persist) cmd.corps = out;
  return out;
}
function cmdCorpsSeated(C) { return _cmdCorpsClean(C, false); }

/* is `gen`'s CURRENT grade below the corps preferred grade? (a corps is a Maj. Gen.'s billet — a junior man
   leads stretched). Q9-aware: a promotion that lifts him to/above the grade removes the penalty. */
function _cmdCorpsBelowGrade(C, gen) {
  var cfg = _cmdCorpsCfg(); if (!cfg || !gen) return false;
  var prefIdx = _cmdGradeIdx(_cmdCorpsPreferredGrade(C));
  if (prefIdx < 0) return false;
  return _cmdGradeIdx(_cmdCurrentGrade(C, gen)) < prefIdx;
}
/* the effective corps-command rating a seated general contributes: his GM OVR (carries the Q9 lift) minus the
   below-grade penalty when his rank does not fit the billet. Clamped [0,100]. Pure read. */
function _cmdCorpsEffRating(C, gen) {
  var r = _cmdGenRating(C, gen);
  if (_cmdCorpsBelowGrade(C, gen)) r -= Math.max(0, _cmdNum((_cmdCorpsCfg() || {}).belowGradePenalty, 6));
  return Math.max(0, Math.min(100, r));
}

/* THE LIFT — the bounded leadership the staffed corps add to commandLeadership. 0 when NO corps are seated
   (the byte-identity keystone) or there is no config. SUM over seated slots of (effRating-64)*perSlotWeight,
   clamped to ±liftCap (§27: small, never dominant; the army commander still weighs most). Pure read. */
function _cmdCorpsLift(C) {
  var cfg = _cmdCorpsCfg(); if (!cfg) return 0;
  // fast path (the byte-identity hot path): no seated corps -> 0 WITHOUT walking the roster / cmdActiveId.
  var cmd0 = C && C.president && C.president.command;
  if (!cmd0 || !cmd0.corps || typeof cmd0.corps !== "object" || Array.isArray(cmd0.corps)) return 0;
  var hasAny = false; for (var kk0 in cmd0.corps) { if (cmd0.corps.hasOwnProperty(kk0)) { hasAny = true; break; } }
  if (!hasAny) return 0;
  var seated = cmdCorpsSeated(C), side = (C.side === "CS") ? "CS" : "US";
  var w = _cmdNum(cfg.perSlotWeight, 0.05), cap = Math.max(0, _cmdNum(cfg.liftCap, 4));
  var sum = 0, any = false;
  for (var k in seated) {
    if (!seated.hasOwnProperty(k)) continue;
    var g = _cmdById(side, seated[k]); if (!g) continue;
    sum += (_cmdCorpsEffRating(C, g) - 64); any = true;
  }
  if (!any) return 0;
  var lift = sum * w;
  return lift > cap ? cap : (lift < -cap ? -cap : lift);
}

/* the seated commander of corps `idx` for the render + the T15 board — {id,name,ovr,grade,belowGrade} or null. */
function cmdCorpsCommanderFor(C, idx) {
  if (!C) return null;
  var seated = cmdCorpsSeated(C), id = seated[idx];
  if (id == null) return null;
  var g = _cmdById((C.side === "CS") ? "CS" : "US", id);
  if (!g) return null;
  return { id: id, name: _cmdName(g), ovr: Math.round(_cmdGenRating(C, g)), grade: _cmdCurrentGrade(C, g), belowGrade: _cmdCorpsBelowGrade(C, g) };
}

/* the pool of generals free to take corps `idx`: alive same-side men who are neither the army commander nor
   already seated in ANOTHER corps (the one currently here is allowed, for a re-render). */
function _cmdCorpsPoolFor(C, idx) {
  var side = (C.side === "CS") ? "CS" : "US", roster = _cmdRosterPlusCommissioned(C, side);   // Q11 (D109): commissioned officers are seatable too
  var seated = cmdCorpsSeated(C), activeId = cmdActiveId(C), pool = [];
  // Q12 (D110): a general already holding a DIVISION is not a free corps candidate (one billet per man; the pool
  // shows only unbilleted men — to move a division commander up to a corps, vacate his division first).
  var divTaken = {};
  if (typeof cmdDivSeated === "function") {
    var sd = cmdDivSeated(C);
    for (var ek in sd) { var inn = sd[ek]; for (var fk in inn) { if (inn.hasOwnProperty(fk)) divTaken[inn[fk]] = 1; } }
  }
  for (var i = 0; i < roster.length; i++) {
    var g = roster[i]; if (!g || !g.id) continue;
    if (!_cmdAlive(g, C.president.date)) continue;
    if (g.id === activeId) continue;
    if (divTaken[g.id]) continue;                               // holds a division
    var elsewhere = false;
    for (var kk in seated) { if (seated.hasOwnProperty(kk) && seated[kk] === g.id && String(kk) !== String(idx)) { elsewhere = true; break; } }
    if (elsewhere) continue;
    pool.push(g);
  }
  return pool;
}

/* THE MOVE — seat general `id` in corps `idx`, spending seatCost political capital. Reassigns (clears him from
   any other corps); no-op when the slot/general is invalid, he is the army commander, he already holds the
   slot, or capital is short. Writes ONLY cmd.corps + C.clock.capital. Bounded, logged. */
function cmdSeatCorps(C, idx, id) {
  if (!C || !C.president) return;
  cmdInit(C);
  var cfg = _cmdCorpsCfg(); if (!cfg) return;
  idx = Math.floor(_cmdNum(idx, -1));
  if (!(idx >= 0 && idx < _cmdCorpsSlots())) return;             // invalid slot
  var side = (C.side === "CS") ? "CS" : "US", cmd = C.president.command;
  var g = _cmdById(side, id);
  if (!g || !_cmdAlive(g, C.president.date)) return;             // invalid / unavailable general
  if (!_cmdByIdRoster(side, id) && cmdCommissioned(C).indexOf(id) < 0) return;   // Q11 (D109) bug-hunt MED: a commission-pool officer must be COMMISSIONED before he can be seated over a corps (byte-identical for roster ids)
  if (id === cmdActiveId(C)) return;                             // the army commander can't double-hold
  if (Array.isArray(cmd.corps) || !cmd.corps || typeof cmd.corps !== "object") cmd.corps = {};
  if (cmd.corps[idx] === id) return;                             // already seated here (no re-charge)
  var cost = Math.max(0, Math.round(_cmdNum(cfg.seatCost, 3)));
  var clk = C.clock, cap = (clk && typeof clk.capital === "number" && isFinite(clk.capital)) ? Math.round(clk.capital) : 0;
  if (cap < cost) return;                                        // can't afford the seating (the gate)
  if (clk && typeof clk.capital === "number") clk.capital = Math.max(0, cap - cost);   // debit the SAME rounded value the gate compared (the Q9/Q8b hardened idiom)
  for (var k in cmd.corps) { if (cmd.corps.hasOwnProperty(k) && cmd.corps[k] === id) delete cmd.corps[k]; }   // reassign: one corps per general
  // Q12 (D110): one billet per man — a general promoted from a division into a corps vacates his division too.
  if (typeof _cmdDivClearGeneral === "function") _cmdDivClearGeneral(cmd, id);
  cmd.corps[idx] = id;
  if (typeof _pdLog === "function") {
    _pdLog(C, "You give General " + _cmdName(g) + " command of " + _cmdCorpsLabel(idx)
      + (cost ? " (−" + cost + " capital)" : "") + (_cmdCorpsBelowGrade(C, g) ? " — he leads below his grade; promote him to steady the corps." : "") + ".");
  }
}

/* THE MOVE — vacate corps `idx` (return its commander to the reserve). Free, like cmdRevert. */
function cmdVacateCorps(C, idx) {
  if (!C || !C.president) return;
  cmdInit(C);
  var cmd = C.president.command;
  idx = Math.floor(_cmdNum(idx, -1));
  if (!cmd.corps || typeof cmd.corps !== "object" || Array.isArray(cmd.corps)) return;
  var id = cmd.corps[idx];
  if (id == null) return;
  delete cmd.corps[idx];
  if (typeof _pdLog === "function") {
    var g = _cmdById((C.side === "CS") ? "CS" : "US", id);
    _pdLog(C, "You return " + (g ? "General " + _cmdName(g) : "the corps commander") + " to the reserve; " + _cmdCorpsLabel(idx) + " stands without a commander.");
  }
}

/* ===========================================================================
   Q12 (D110) · THE DIVISION SUB-TIER — the next rung of the depth chart (RATING-SYSTEM-DESIGN §12.1's billet
   tree: Army -> Corps -> DIVISION -> Brigade), built HIERARCHICALLY on the Q10 corps chart (D108).

   A division could be staffed only UNDER a SEATED corps (the real chain of command — a division belonged to a
   corps), so the depth chart becomes a tree the President builds top-down. Seating a division spends seatCost
   political capital (the existing GM currency — no new resource, §12). HOW IT REACHES THE FIGHT (no new combat
   path; honors D74/D94 no-fudge): seated division commanders only shape the army's LEADERSHIP facet — an INPUT
   the bridge already reads — via a small BOUNDED lift folded into commandLeadership, summed exactly like the
   corps lift: lift = clamp( SUM over seated divisions of (effectiveDivRating - 64) * perSlotWeight, ±liftCap ).
   effectiveDivRating = the general's GM OVR (_cmdGenRating, carries the Q9 promotion lift) minus belowGradePenalty
   when his current grade is below `preferredGrade` (a division is a Maj. Gen.'s billet in BOTH armies). The lift
   is DELIBERATELY SMALLER than the corps lift (cap 2 vs 4, weight 0.03 vs 0.05) so the influence hierarchy holds
   — army (~±17) > corps (±4) > divisions (±2): a lower tier is a smaller modifier, never dominant (§27).

   BYTE-IDENTICAL until the player seats a division: no division seated -> the SUM is over zero slots -> lift 0 ->
   commandLeadership unchanged -> the sandbox + all 9 battles identical (a vacant division contributes 0, NOT a
   baseline penalty — that would break byte-identity). ONE BILLET PER MAN: a general holds at most one of {army
   command, a corps, a division}; seating him in a division clears any corps/other division he held, and
   appointing/seating him HIGHER clears his division. Vacating a corps CASCADES — its orphaned divisions are
   dropped (cmdInit sanitizes on load; _cmdDivClean requires the parent corps to be seated). cmd.divisions rides
   the save (no _SAVE_VER bump). Writes ONLY cmd.divisions + C.clock.capital — never the scoreboard (build-gate
   4d scans this file). Data: data/ratings.json `divisionCommand`. NO RNG.

   The data shape: cmd.divisions = { "<corpsIdx>": { "<divIdx>": "<generalId>" } } (nested, keyed by corps then
   division index — mirrors cmd.corps's {idx:id} one rung deeper). _cmdDivClean walks both levels.
   =========================================================================== */
function _cmdDivCfg() { var d = gameData("ratings"); return (d && d.divisionCommand) ? d.divisionCommand : null; }
function _cmdDivPerCorps() { var cfg = _cmdDivCfg(); var n = cfg ? Math.floor(_cmdNum(cfg.perCorps, 3)) : 3; return Math.max(1, Math.min(6, n)); }
function _cmdDivLabel(idx) {
  var cfg = _cmdDivCfg(), labels = cfg && cfg.labels;
  if (labels && labels[idx] != null) return String(labels[idx]);
  var O = ["1st", "2nd", "3rd", "4th", "5th", "6th"];
  return (O[idx] || String(idx + 1) + "th") + " Division";
}
/* the division preferred grade for a side (a division was a Maj. Gen.'s command in BOTH armies; the {US,CS} map
   form is kept for symmetry with corpsCommand). Accepts the config as a {US,CS} map or a bare string. */
function _cmdDivPreferredGrade(C) {
  var cfg = _cmdDivCfg(); var pg = cfg && cfg.preferredGrade;
  var side = (C && C.side === "CS") ? "CS" : "US";
  if (pg && typeof pg === "object") return String(pg[side] || pg.US || "Maj. Gen.");
  return pg ? String(pg) : "Maj. Gen.";
}

/* the SANITIZED division depth chart as { corpsIdx: { divIdx: generalId } }: only divisions whose PARENT CORPS
   is currently seated (the hierarchy/cascade rule), valid slots, alive same-side generals who are NOT the army
   commander and NOT seated in ANY corps, one billet per general across the whole tree (first wins). persist=true
   writes the clean map back (the cmdInit load-sanitize, the Q9/Q10 idiom); persist=false is a PURE read. Must run
   AFTER _cmdCorpsClean so the seated-corps set is finalized. */
function _cmdDivClean(C, persist) {
  var out = {};
  var cmd = C && C.president && C.president.command;
  if (!cmd) return out;
  var raw = cmd.divisions;
  if (Array.isArray(raw) || !raw || typeof raw !== "object") { if (persist) cmd.divisions = {}; return out; }
  var per = _cmdDivPerCorps(), side = (C.side === "CS") ? "CS" : "US";
  var seatedCorps = (typeof cmdCorpsSeated === "function") ? cmdCorpsSeated(C) : {};
  var corpsTaken = {};                                          // generalIds already holding a corps (excluded from divisions)
  for (var cc in seatedCorps) { if (seatedCorps.hasOwnProperty(cc)) corpsTaken[seatedCorps[cc]] = 1; }
  var activeId = (typeof cmdActiveId === "function") ? cmdActiveId(C) : null;
  var used = {};                                                // dedupe across the whole division tree
  for (var ck in raw) {
    if (!raw.hasOwnProperty(ck)) continue;
    var cidx = Math.floor(_cmdNum(parseInt(ck, 10), -1));
    if (!(seatedCorps[cidx] != null)) continue;                 // parent corps not seated -> drop the whole branch (cascade)
    var inner = raw[ck];
    if (Array.isArray(inner) || !inner || typeof inner !== "object") continue;
    for (var dk in inner) {
      if (!inner.hasOwnProperty(dk)) continue;
      var didx = Math.floor(_cmdNum(parseInt(dk, 10), -1));
      if (!(didx >= 0 && didx < per)) continue;                 // invalid / out-of-range division slot
      var id = inner[dk];
      if (typeof id !== "string" || !id) continue;
      if (id === activeId) continue;                            // the army commander can't hold a division
      if (corpsTaken[id]) continue;                             // already holds a corps (one billet per man)
      if (used[id]) continue;                                   // already placed in an earlier division (dedupe)
      var g = _cmdById(side, id);
      if (!g || !_cmdAlive(g, C.president.date)) continue;      // gone / dead / not in the war
      used[id] = 1;
      if (!out[cidx]) out[cidx] = {};
      out[cidx][didx] = id;
    }
  }
  if (persist) cmd.divisions = out;
  return out;
}
function cmdDivSeated(C) { return _cmdDivClean(C, false); }

/* is `gen`'s CURRENT grade below the division preferred grade? (a division is a Maj. Gen.'s billet — a junior man
   leads stretched). Q9-aware: a promotion to/above the grade removes the penalty. */
function _cmdDivBelowGrade(C, gen) {
  var cfg = _cmdDivCfg(); if (!cfg || !gen) return false;
  var prefIdx = _cmdGradeIdx(_cmdDivPreferredGrade(C));
  if (prefIdx < 0) return false;
  return _cmdGradeIdx(_cmdCurrentGrade(C, gen)) < prefIdx;
}
/* the effective division-command rating a seated general contributes: his GM OVR minus the below-grade penalty
   when his rank does not fit the billet. Clamped [0,100]. Pure read. */
function _cmdDivEffRating(C, gen) {
  var r = _cmdGenRating(C, gen);
  if (_cmdDivBelowGrade(C, gen)) r -= Math.max(0, _cmdNum((_cmdDivCfg() || {}).belowGradePenalty, 4));
  return Math.max(0, Math.min(100, r));
}

/* THE LIFT — the bounded leadership the staffed divisions add to commandLeadership. 0 when NO divisions are
   seated (the byte-identity keystone) or there is no config. SUM over seated divisions of (effRating-64)*weight,
   clamped to ±liftCap. Pure read. */
function _cmdDivLift(C) {
  var cfg = _cmdDivCfg(); if (!cfg) return 0;
  // fast path (the byte-identity hot path): no division branch -> 0 WITHOUT walking corps / roster.
  var cmd0 = C && C.president && C.president.command;
  if (!cmd0 || !cmd0.divisions || typeof cmd0.divisions !== "object" || Array.isArray(cmd0.divisions)) return 0;
  var hasAny = false; for (var kk0 in cmd0.divisions) { if (cmd0.divisions.hasOwnProperty(kk0)) { hasAny = true; break; } }
  if (!hasAny) return 0;
  var seated = cmdDivSeated(C), side = (C.side === "CS") ? "CS" : "US";
  var w = _cmdNum(cfg.perSlotWeight, 0.03), cap = Math.max(0, _cmdNum(cfg.liftCap, 2));
  var sum = 0, any = false;
  for (var ck in seated) {
    if (!seated.hasOwnProperty(ck)) continue;
    var inner = seated[ck];
    for (var dk in inner) {
      if (!inner.hasOwnProperty(dk)) continue;
      var g = _cmdById(side, inner[dk]); if (!g) continue;
      sum += (_cmdDivEffRating(C, g) - 64); any = true;
    }
  }
  if (!any) return 0;
  var lift = sum * w;
  return lift > cap ? cap : (lift < -cap ? -cap : lift);
}

/* the seated commander of corps `cidx` division `didx` — {id,name,ovr,grade,belowGrade} or null. */
function cmdDivCommanderFor(C, cidx, didx) {
  if (!C) return null;
  var seated = cmdDivSeated(C), branch = seated[cidx]; if (!branch) return null;
  var id = branch[didx];
  if (id == null) return null;
  var g = _cmdById((C.side === "CS") ? "CS" : "US", id);
  if (!g) return null;
  return { id: id, name: _cmdName(g), ovr: Math.round(_cmdGenRating(C, g)), grade: _cmdCurrentGrade(C, g), belowGrade: _cmdDivBelowGrade(C, g) };
}

/* the pool of generals free to take corps `cidx` division `didx`: alive same-side men who are NOT the army
   commander, NOT seated in any corps, and NOT seated in ANOTHER division (the one currently here is allowed,
   for a re-render). */
function _cmdDivPoolFor(C, cidx, didx) {
  var side = (C.side === "CS") ? "CS" : "US", roster = _cmdRosterPlusCommissioned(C, side);
  var seatedCorps = cmdCorpsSeated(C), seatedDiv = cmdDivSeated(C), activeId = cmdActiveId(C);
  var corpsTaken = {};
  for (var cc in seatedCorps) { if (seatedCorps.hasOwnProperty(cc)) corpsTaken[seatedCorps[cc]] = 1; }
  var here = (seatedDiv[cidx] && seatedDiv[cidx][didx]) || null, pool = [];
  for (var i = 0; i < roster.length; i++) {
    var g = roster[i]; if (!g || !g.id) continue;
    if (!_cmdAlive(g, C.president.date)) continue;
    if (g.id === activeId) continue;
    if (corpsTaken[g.id]) continue;                             // holds a corps
    var elsewhere = false;
    for (var ek in seatedDiv) {
      var inner = seatedDiv[ek];
      for (var fk in inner) {
        if (inner.hasOwnProperty(fk) && inner[fk] === g.id && !(String(ek) === String(cidx) && String(fk) === String(didx))) { elsewhere = true; break; }
      }
      if (elsewhere) break;
    }
    if (elsewhere && g.id !== here) continue;
    pool.push(g);
  }
  return pool;
}

/* remove `id` from every division billet he holds (the one-billet-per-man helper used by the higher moves). */
function _cmdDivClearGeneral(cmd, id) {
  if (!cmd || !cmd.divisions || typeof cmd.divisions !== "object" || Array.isArray(cmd.divisions)) return;
  for (var ck in cmd.divisions) {
    if (!cmd.divisions.hasOwnProperty(ck)) continue;
    var inner = cmd.divisions[ck]; if (!inner || typeof inner !== "object") continue;
    for (var dk in inner) { if (inner.hasOwnProperty(dk) && inner[dk] === id) delete inner[dk]; }
  }
}

/* THE MOVE — seat general `id` in corps `cidx` division `didx`, spending seatCost political capital. The parent
   corps MUST be seated (the hierarchy gate). Reassigns (clears him from any corps/other division); no-op when
   the slot/general is invalid, the parent corps is vacant, he is the army commander, he already holds the slot,
   or capital is short. Writes ONLY cmd.divisions + C.clock.capital. Bounded, logged. */
function cmdSeatDivision(C, cidx, didx, id) {
  if (!C || !C.president) return;
  cmdInit(C);
  var cfg = _cmdDivCfg(); if (!cfg) return;
  cidx = Math.floor(_cmdNum(cidx, -1)); didx = Math.floor(_cmdNum(didx, -1));
  if (!(cidx >= 0 && cidx < _cmdCorpsSlots())) return;          // invalid corps
  if (!(didx >= 0 && didx < _cmdDivPerCorps())) return;         // invalid division slot
  var side = (C.side === "CS") ? "CS" : "US", cmd = C.president.command;
  var seatedCorps = cmdCorpsSeated(C);
  if (seatedCorps[cidx] == null) return;                        // the hierarchy gate: no corps commander -> no division billet
  // one billet per man: a man who holds ANY corps must be vacated from it first (symmetric with the division
  // pool, which excludes corps-holders) — refuse rather than silently demote him out of his corps.
  for (var cck in seatedCorps) { if (seatedCorps.hasOwnProperty(cck) && seatedCorps[cck] === id) return; }
  var g = _cmdById(side, id);
  if (!g || !_cmdAlive(g, C.president.date)) return;            // invalid / unavailable general
  if (!_cmdByIdRoster(side, id) && cmdCommissioned(C).indexOf(id) < 0) return;   // a commission-pool officer must be COMMISSIONED first (byte-identical for roster ids)
  if (id === cmdActiveId(C)) return;                            // the army commander can't hold a division
  if (Array.isArray(cmd.divisions) || !cmd.divisions || typeof cmd.divisions !== "object") cmd.divisions = {};
  if (cmd.divisions[cidx] && cmd.divisions[cidx][didx] === id) return;   // already seated here (no re-charge)
  var cost = Math.max(0, Math.round(_cmdNum(cfg.seatCost, 2)));
  var clk = C.clock, cap = (clk && typeof clk.capital === "number" && isFinite(clk.capital)) ? Math.round(clk.capital) : 0;
  if (cap < cost) return;                                       // can't afford the seating (the gate)
  if (clk && typeof clk.capital === "number") clk.capital = Math.max(0, cap - cost);   // debit the SAME rounded value the gate compared
  _cmdDivClearGeneral(cmd, id);                                 // reassign within divisions: clear any other division he held
  if (!cmd.divisions[cidx] || typeof cmd.divisions[cidx] !== "object" || Array.isArray(cmd.divisions[cidx])) cmd.divisions[cidx] = {};
  cmd.divisions[cidx][didx] = id;
  if (typeof _pdLog === "function") {
    _pdLog(C, "You give General " + _cmdName(g) + " command of the " + _cmdDivLabel(didx) + " of " + _cmdCorpsLabel(cidx)
      + (cost ? " (−" + cost + " capital)" : "") + (_cmdDivBelowGrade(C, g) ? " — he leads below his grade; promote him to steady the division." : "") + ".");
  }
}

/* THE MOVE — vacate corps `cidx` division `didx` (return its commander to the reserve). Free, like cmdVacateCorps. */
function cmdVacateDivision(C, cidx, didx) {
  if (!C || !C.president) return;
  cmdInit(C);
  var cmd = C.president.command;
  cidx = Math.floor(_cmdNum(cidx, -1)); didx = Math.floor(_cmdNum(didx, -1));
  if (!cmd.divisions || typeof cmd.divisions !== "object" || Array.isArray(cmd.divisions)) return;
  var branch = cmd.divisions[cidx];
  if (!branch || typeof branch !== "object") return;
  var id = branch[didx];
  if (id == null) return;
  delete branch[didx];
  if (typeof _pdLog === "function") {
    var g = _cmdById((C.side === "CS") ? "CS" : "US", id);
    _pdLog(C, "You return " + (g ? "General " + _cmdName(g) : "the division commander") + " to the reserve; the " + _cmdDivLabel(didx) + " of " + _cmdCorpsLabel(cidx) + " stands without a commander.");
  }
}

/* ===========================================================================
   Q11 (D109) · THE COMMISSION MOVE (RATING-SYSTEM-DESIGN §12.2/§12.3 — the GM depth-chart move that brings a
   new officer into the pool). Beyond appointing/promoting/seating the generals the war hands you, the President
   may COMMISSION the documented POLITICAL GENERALS — Banks, Butler, Sigel, McClernand; Floyd, Pillow — for
   political capital (C.clock.capital, the existing GM currency; no new resource, §12). These men were CHEAP to
   commission (a political general cost little capital — Lincoln and Davis took them for the factions, votes,
   and immigrant constituencies they delivered, not their generalship) and WEAK in the field (a low OVR feeding
   a low leadership through the very same _cmdGenRating -> commandLeadership pipe every other appointment uses —
   so seating a political general teaches, concretely, that rank and constituency are NOT competence). The real
   bind Lincoln lived: you can fill a billet cheaply, but the man you fill it with squanders the army.
     ARCHITECTURE — byte-identical until the player commissions: the commissionable officers live in a SEPARATE
   data array (data/generals.json -> sides[side].commissionPool), so _cmdSideGenerals (the starting roster) and
   every byte-identity-critical path are UNTOUCHED. cmdCommission writes ONLY cmd.commissioned (an id list) +
   C.clock.capital + a reputation seed — NEVER the scoreboard (build-gate 4d scans 35-command.js). With nobody
   commissioned, the appoint/promote/corps pools are EXACTLY the starting roster (concat of the empty set), so
   commandLeadership and the 9 battles are identical to the pre-Q11 build. A commissioned officer then reaches
   the fight ONLY by being appointed or seated like any general — no new combat read.
     DEFERRED + LOGGED (the next GM increment, needs the 1864-election state): the §12.3 ELECTION-SUPPORT bind —
   a political general delivers faction/election support while he serves, and relieving him before the election
   costs that support (not just capital). Here the relief COST is already taught via his `relief` class
   (_cmdReliefCost); the election-support economy is the follow-on. No new fork; no contradiction.
   =========================================================================== */
function _cmdCommissionCfg() { var d = gameData("ratings"); return (d && d.commission) ? d.commission : null; }

/* the side's COMMISSION POOL — the documented political generals available to bring into the service. A
   SEPARATE array from the starting roster (sides[side].generals) so the byte-identity-critical roster paths
   never see them. Empty if the data is absent. */
function _cmdCommissionPool(side) {
  var s = (side === "CS") ? "CS" : "US", d = _cmdData();
  if (d && d.sides && d.sides[s] && Array.isArray(d.sides[s].commissionPool)) return d.sides[s].commissionPool;
  return [];
}

/* resolve a commission-pool entry by id within a side (null if absent). */
function _cmdCommissionEntry(side, id) {
  var pool = _cmdCommissionPool(side);
  for (var i = 0; i < pool.length; i++) if (pool[i] && pool[i].id === id) return pool[i];
  return null;
}

/* the cost (political capital) to commission a given officer — a per-officer cost if authored, else the config
   default by kind (a political general is CHEAP; a proven professional is DEAR — §12.2). Bounded >=0, rounded. */
function _cmdCommissionCost(entry) {
  var cfg = _cmdCommissionCfg(); if (!cfg || !entry) return 0;
  var kind = (entry.commission && entry.commission.kind === "professional") ? "professional" : "political";
  var per = (entry.commission && typeof entry.commission.cost === "number" && isFinite(entry.commission.cost)) ? entry.commission.cost : null;
  var base = (kind === "professional") ? _cmdNum(cfg.costProfessional, 8) : _cmdNum(cfg.costPolitical, 2);
  return Math.max(0, Math.round(per != null ? per : base));
}

/* THE SANITIZED set of commissioned officer ids (cmd.commissioned). Keeps only ids that are (a) real
   commission-pool officers for THIS side and (b) NOT in the starting roster (defensive — an officer can never
   be both), deduped, capped at maxCommissions. persist=true writes the cleaned array back (the load-sanitize,
   the Q9/Q8b/Q10 idiom); persist=false is a pure read. Empty by default -> byte-identical. */
function _cmdCommissionedClean(C, persist) {
  if (!C || !C.president) return [];
  var cmd = C.president.command; if (!cmd) return [];
  var side = (C.side === "CS") ? "CS" : "US";
  var cfg = _cmdCommissionCfg();
  var maxC = cfg ? Math.max(0, Math.floor(_cmdNum(cfg.maxCommissions, 3))) : 3;   // Q11 bug-hunt LOW: the no-config fallback matches the shipped cap (3), not the corps-slot 4
  var raw = Array.isArray(cmd.commissioned) ? cmd.commissioned : [];
  var out = [], seen = {};
  for (var i = 0; i < raw.length; i++) {
    var id = raw[i];
    if (typeof id !== "string" || !id || seen[id]) continue;        // valid string, no dupes
    if (!_cmdCommissionEntry(side, id)) continue;                   // must be a real commission-pool officer for this side
    if (_cmdByIdRoster(side, id)) continue;                         // never a starting-roster id (defensive)
    seen[id] = true; out.push(id);
    if (out.length >= maxC) break;                                  // cap
  }
  if (persist) cmd.commissioned = out;
  return out;
}
function cmdCommissioned(C) { return _cmdCommissionedClean(C, false); }

/* the commission-pool ENTRIES the player has commissioned (resolved objects, in pool order). */
function _cmdCommissionedEntries(C) {
  var side = (C.side === "CS") ? "CS" : "US", ids = cmdCommissioned(C), out = [];
  for (var i = 0; i < ids.length; i++) { var e = _cmdCommissionEntry(side, ids[i]); if (e) out.push(e); }
  return out;
}

/* THE SELECTABLE pool the GM moves draw from: the starting roster PLUS the commissioned officers. The appoint
   pool, the promotions list, the corps pool, and the wire loops all use this so a commissioned officer becomes
   appointable / promotable / seatable. BYTE-IDENTICAL when nobody is commissioned (roster.concat([]) === roster). */
function _cmdRosterPlusCommissioned(C, side) {
  var roster = _cmdSideGenerals(side);
  var extra = _cmdCommissionedEntries(C);
  return extra.length ? roster.concat(extra) : roster;
}

/* THE MOVE — commission officer `id` into the service, spending the commission cost in political capital. No-op
   when the officer is invalid / outside his service window / already commissioned (no re-charge) / the
   commission slate is full / capital is short. Writes ONLY cmd.commissioned + C.clock.capital + a reputation
   seed. Bounded, logged. */
function cmdCommission(C, id) {
  if (!C || !C.president) return;
  cmdInit(C);
  var cfg = _cmdCommissionCfg(); if (!cfg) return;
  var side = (C.side === "CS") ? "CS" : "US";
  var entry = _cmdCommissionEntry(side, id); if (!entry) return;    // not a commissionable officer
  if (!_cmdAlive(entry, C.president.date)) return;                  // outside his service window
  var cmd = C.president.command;
  var have = _cmdCommissionedClean(C, true);                        // the sanitized current set
  if (have.indexOf(id) >= 0) return;                               // already commissioned (no re-charge)
  var maxC = Math.max(0, Math.floor(_cmdNum(cfg.maxCommissions, 3)));
  if (have.length >= maxC) return;                                 // the commission slate is full
  var cost = _cmdCommissionCost(entry);
  var clk = C.clock, cap = (clk && typeof clk.capital === "number" && isFinite(clk.capital)) ? Math.round(clk.capital) : 0;
  if (cap < cost) return;                                          // can't afford it (the gate)
  if (clk && typeof clk.capital === "number") clk.capital = Math.max(0, cap - cost);   // debit the SAME rounded value the gate compared (the Q9/Q8b/Q10 hardened idiom)
  cmd.commissioned = have.concat([id]);
  // seed his reputation so _cmdGenRating reads it the moment he is appointed (mirrors the cmdInit roster seed).
  if (cmd.reputation && typeof cmd.reputation === "object" && !Array.isArray(cmd.reputation) && typeof cmd.reputation[id] !== "number") {
    cmd.reputation[id] = (typeof entry.reputation === "number") ? Math.max(0, Math.min(100, entry.reputation)) : 48;
  }
  if (typeof _pdLog === "function") {
    var kindPro = entry.commission && entry.commission.kind === "professional";
    _pdLog(C, "You commission " + _cmdName(entry) + " into the service" + (cost ? " (−" + cost + " capital)" : "")
      + (kindPro ? " — a proven officer." : " — a political general: weak in the field, but he brings " + (entry.constituency || "powerful political friends") + "."));
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
  // Q10 (D108): the staffed corps add a small BOUNDED leadership lift through this SAME facet the bridge already
  // reads (never the scoreboard, D74/D94). 0 when no corps are seated -> byte-identical to the pre-Q10 build.
  var corps = (typeof _cmdCorpsLift === "function") ? _cmdCorpsLift(C) : 0;
  // Q12 (D110): the staffed DIVISIONS add a further small BOUNDED lift (±2, < the corps' ±4 — the influence
  // hierarchy army>corps>division, §27), through the SAME facet. 0 when no division is seated -> byte-identical.
  var div = (typeof _cmdDivLift === "function") ? _cmdDivLift(C) : 0;
  // E70 (D354): unprepared cross-theater command friction — 0 unless the player explicitly appointed an
  // out-of-theater general without a Transfer order; through the SAME facet. 0 default -> byte-identical.
  var ready = (typeof _cmdTransferReadinessLift === "function") ? _cmdTransferReadinessLift(C) : 0;
  var lead = 64 + (rating - 64) * 0.7 + (cab - 64) * 0.3 + corps + div + ready;
  // D406: one pull-only player-career contribution. The journey selector owns
  // every guard and cap; this consumer neither copies nor mutates P.command.
  var career = (typeof warCareerCommandProjection === "function") ? Number(warCareerCommandProjection(C)) : 0;
  if (!isFinite(career)) career = 0;
  career = Math.max(0, Math.min(4, career));
  lead += career;
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
  if (v >= 82) return ["Masterful", "#639452"];
  if (v >= 70) return ["Able", "#6f9e5a"];
  if (v >= 58) return ["Steady", "#b8863b"];
  if (v >= 48) return ["Uneven", "#c9712e"];
  return ["Faltering", "#d07060"];
}

function _cmdTraitBar(label, v, hint) {
  v = Math.max(0, Math.min(100, Math.round(v || 0)));
  return '<div style="margin:3px 0"><div style="display:flex;justify-content:space-between;font-size:11px;opacity:.8"><span>' + _cmdEsc(label)
    + '</span><span>' + v + '</span></div>'
    + '<div style="height:6px;background:rgba(0,0,0,.25);border:1px solid var(--rule);border-radius:3px;overflow:hidden"><div style="height:100%;width:' + v + '%;background:#7d6b4a"></div></div>'
    + (hint ? '<div style="font-size:10px;opacity:.6">' + _cmdEsc(hint) + '</div>' : '') + '</div>';
}

/* ---- §12.3 (D113) THE ELECTION-SUPPORT BIND — the command-politics keystone the
   COMMISSION move (D109) was built around. A commissioned POLITICAL general delivers
   his constituency's votes to the war effort while he serves, so relieving him in the
   run-up to the 1864 election forfeits that support: an ADDITIVE surcharge on his
   relief cost that rises year over year toward the 1864 vote (1862 < 1863 < 1864) and
   FALLS to zero once the verdict is in (resolved1864 — the bind is spent, dismiss him
   freely). UNION-ONLY: the Confederacy held no 1864 presidential election (Davis served
   a single six-year term from Feb 1862), so this is Lincoln's bind alone — a CS political
   general (Floyd/Pillow) keeps only his BASE relief cost. EXACTLY 0 for every non-political
   general, the entire CS side, and outside the window -> _cmdReliefCost stays byte-identical
   for the whole starting roster, in every year, until you commission AND field a UNION
   political general in the 1862-64 pre-election window. NEVER on the combat path (a
   strategic political-capital cost). Data: ratings.json -> electionReliefBind. ---- */
function _cmdElectionBindCfg() {
  var r = (typeof gameData === "function") ? gameData("ratings") : null;
  return (r && r.electionReliefBind && typeof r.electionReliefBind === "object") ? r.electionReliefBind : null;
}

/* The general's political value (0..100) IF he is a commissioned political general; else 0. */
function _cmdPoliticalValue(gen) {
  if (!gen || !gen.commission || gen.commission.kind !== "political") return 0;
  var pv = gen.commission.politicalValue;
  return (typeof pv === "number" && isFinite(pv)) ? Math.max(0, Math.min(100, pv)) : 0;
}

/* The 1864-election window strength (0..1): rises toward Nov 1864, ZERO once the
   verdict is rendered (resolved1864 -> the bind is spent, relieve him freely). */
function _cmdElectionWindow(C) {
  var clk = (C && C.clock) || {};
  if (clk.resolved1864) return 0;                                  // the election is past — the bind relaxes
  var cfg = _cmdElectionBindCfg();
  var by = (cfg && cfg.windowByYear && typeof cfg.windowByYear === "object") ? cfg.windowByYear : {};
  var year = (typeof clk.year === "number") ? clk.year
    : (C && C.president && C.president.date && typeof C.president.date.year === "number") ? C.president.date.year : 1861;
  var w = by[String(year)];
  if (typeof w !== "number" || !isFinite(w)) w = (year >= 1864) ? 1 : 0;   // a NaN/non-number entry (tampered config) falls to the documented default; a later year stays in the window (D113 bug-hunt MED — typeof NaN === "number")
  return Math.max(0, Math.min(1, w));
}

/* The election-support surcharge (political capital) on a political general's relief
   cost. Bounded [0, surchargeMax]; EXACTLY 0 for any non-political general or outside
   the window -> _cmdReliefCost is byte-identical for the whole starting roster. */
function _cmdElectionSupportSurcharge(C, gen) {
  var pv = _cmdPoliticalValue(gen);
  if (pv <= 0) return 0;
  // §12.3 (D113 bug-hunt MED): the election-support bind is a UNION phenomenon — the
  // Confederacy held no 1864 presidential election (Davis served one six-year term from
  // Feb 1862), so "Lincoln's bind" has no CS analogue. A CS political general (Floyd/Pillow)
  // keeps only his BASE relief cost; the surcharge + the "Lincoln lived this bind" tell are
  // US-only. This also keeps the CS side fully byte-identical (surcharge always 0).
  if (!C || C.side === "CS") return 0;
  var cfg = _cmdElectionBindCfg();
  var max = (cfg && typeof cfg.surchargeMax === "number" && isFinite(cfg.surchargeMax)) ? Math.max(0, cfg.surchargeMax) : 0;
  if (max <= 0) return 0;
  var w = _cmdElectionWindow(C);
  if (!(w > 0)) return 0;   // !(NaN > 0) -> true: a non-finite window can never produce a surcharge (defense-in-depth with the _cmdElectionWindow isFinite guard)
  return Math.max(0, Math.min(max, Math.round((pv / 100) * w * max)));
}

/* The relief cost (political capital) to remove a general now — scaled up for a
   popular man at the height of his prestige (the McClellan problem), plus the §12.3
   election-support surcharge for a commissioned political general before the 1864 vote. */
function _cmdReliefCost(C, gen) {
  if (!gen) return 0;
  var base = _cmdRELIEF_BASE[gen.relief] || _cmdRELIEF_BASE.costly;
  var rep = _cmdReputation(C, gen.id);
  var prestige = Math.max(0, rep - 60) * 0.25;   // a beloved general is dearer to dismiss
  var electionBind = _cmdElectionSupportSurcharge(C, gen);   // §12.3 (D113): 0 (byte-identical) for non-political generals + outside the 1864-election window
  return Math.round(base + prestige + electionBind);
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
    ? '<div style="margin-top:7px;font-size:11px;color:#e8784a;background:rgba(156,59,46,.08);border:1px solid rgba(156,59,46,.4);border-radius:4px;padding:7px">&#9873; <b>Ambition.</b> '
        + _cmdEsc(gen.weakness || "He courts the newspapers and the politicians; removing him will cost you dearly.") + '</div>'
    : '';
  // §12.3 (D113): the election-support bind — a commissioned political general in command before the 1864 vote.
  var elecSur = _cmdElectionSupportSurcharge(C, gen);
  var electionTell = (elecSur > 0 && _cmdPoliticalValue(gen) > 0)
    ? '<div style="margin-top:7px;font-size:11px;color:#cbb27a;background:rgba(203,178,122,.07);border:1px solid rgba(203,178,122,.4);border-radius:4px;padding:7px">&#9873; <b>Election support.</b> '
        + 'He delivers ' + _cmdEsc(gen.constituency || "a constituency the coalition needs") + ' to the war effort. Relieving him before the 1864 verdict would forfeit it &mdash; his removal now costs <b>+' + elecSur + ' political capital</b>, until the polls are past. Lincoln lived this bind, keeping in command men he could not afford to fire.</div>'
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
    +   electionTell
    +   (gen.provenance ? '<div style="margin-top:5px;font-size:10px;opacity:.55">' + _cmdEsc(gen.provenance) + (gen.sources && gen.sources.length ? ' &middot; ' + _cmdEsc(gen.sources.join("; ")) : '') + '</div>' : '')
    +   (!byHistory ? '<button id="cmdRevert" type="button" class="upg" style="margin-top:8px;font-size:11px;padding:2px 8px">Restore the historical command</button>' : '')
    + '</div>';
}

/* The available-generals pool — appoint / promote (relieve the incumbent). */
function _cmdPoolHTML(C) {
  var side = (C.side === "CS") ? "CS" : "US", P = C.president;
  var roster = _cmdRosterPlusCommissioned(C, side);   // Q11 (D109): commissioned political generals appear in the appoint pool
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
      note = '<span style="font-size:11px;color:#e8784a" title="Relieving ' + _cmdEsc(_cmdName(incumbent)) + ' would cost ' + cost + ' political capital; you have ' + cap + '.">Needs ' + cost + ' capital</span>';
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

/* ---- Q11 (D109): the "Commission an Officer — the political generals" section. Lists the documented political
   generals available to bring into the service: each shows his LOW combat OVR beside his HIGH political value,
   his constituency, an honest one-line record, and a Commission control (gated on capital + the commission cap).
   Once commissioned he joins the appoint/promote/corps pools above. Returns "" with no config / no pool for the
   side (byte-identical). Triple-encoded (number + word + grade letter; colour decorative), CVD-safe, wcag-AA. ---- */
function _cmdCommissionRow(C, e, side, cap, count, maxC, committedIds) {
  var id = e.id, isComm = committedIds.indexOf(id) >= 0;
  var alive = _cmdAlive(e, C.president.date);
  var ovr = Math.round(_cmdGenRating(C, e));
  var gr = (typeof fldRatingGrade === "function") ? fldRatingGrade(ovr) : { letter: "", word: _cmdLeadWord(ovr)[0], color: _cmdLeadWord(ovr)[1] };
  var polVal = Math.max(0, Math.min(100, Math.round(_cmdNum(e.commission && e.commission.politicalValue, e.politicalValueScore))));
  var polWord = polVal >= 78 ? "Immense" : polVal >= 64 ? "High" : polVal >= 50 ? "Real" : "Some";
  var cost = _cmdCommissionCost(e), kindPro = e.commission && e.commission.kind === "professional";
  var img = _cmdPortrait(e, side, 44);
  var ctrl;
  if (isComm && !alive) {
    // Q11 bug-hunt LOW: commissioned, but his service window has closed (or not yet opened) — the appoint/promote/
    // corps pools (which gate on _cmdAlive) drop him, so the row must say so plainly rather than a green "in your pool".
    var leftAfter = e.availableUntil && _cmdDateNum(C.president.date) > _cmdYM(e.availableUntil);
    ctrl = '<span style="font-size:11px;opacity:.6"><span aria-hidden="true">&#10003;</span> Commissioned &middot; ' + (leftAfter ? 'no longer in service' : 'not yet in service') + '</span>';
  } else if (isComm) {
    // where is he now? — active commander, a seated corps, or simply in the pool.
    var where = "In your pool";
    if (id === cmdActiveId(C)) where = "In field command";
    else {
      var seated = (typeof cmdCorpsSeated === "function") ? cmdCorpsSeated(C) : {};
      for (var kk in seated) { if (seated.hasOwnProperty(kk) && seated[kk] === id) { where = "Commands " + _cmdCorpsLabel(parseInt(kk, 10) || 0); break; } }   // Q11 bug-hunt MED: parse the string for-in key (was _cmdNum(kk,0) -> always 0 -> always "I Corps")
    }
    ctrl = '<span style="font-size:11px;color:#6f9e5a" title="Already commissioned"><span aria-hidden="true">&#10003;</span> Commissioned</span>'
      + '<div style="font-size:10px;opacity:.7;margin-top:2px">' + _cmdEsc(where) + '</div>';
  } else if (!alive) {
    var after = e.availableUntil && _cmdDateNum(C.president.date) > _cmdYM(e.availableUntil);
    ctrl = '<span style="font-size:11px;opacity:.6">' + (after ? 'No longer in service' : 'Not yet in service') + '</span>';
  } else if (count >= maxC) {
    ctrl = '<span style="font-size:11px;color:#d0853a" title="You may keep ' + maxC + ' commissioned officers at a time; relieve or leave one before commissioning another">Slate full (' + maxC + ')</span>';/* a11y: #d0853a >=4.5:1 on the desk grounds; meaning also in the words */
  } else if (cap >= cost) {
    ctrl = '<button id="cmdComm_' + _cmdEsc(id) + '" type="button" class="upg" style="flex:0 0 auto;font-size:11px;padding:2px 8px" title="Commission ' + _cmdEsc(_cmdName(e)) + ' into the service for ' + cost + ' political capital">Commission <span style="opacity:.8">(&minus;' + cost + ' cap)</span></button>';
  } else {
    ctrl = '<span style="font-size:11px;color:#e86840" title="Commissioning him costs ' + cost + ' political capital; you hold ' + cap + '">Needs ' + cost + ' cap</span>';/* a11y: #e86840 >=4.5:1 on the desk grounds (the Q8b-measured value); meaning also in the words */
  }
  var record = e.bio || e.strength || "";
  return '<div style="display:flex;gap:10px;align-items:flex-start;padding:7px 0;border-bottom:1px dotted var(--rule)' + ((isComm || alive) ? '' : ';opacity:.55') + '">'
    + img
    + '<div style="flex:1 1 auto;min-width:0">'
    +   '<div style="font-weight:bold;font-size:13px">' + _cmdEsc(_cmdName(e)) + (e.epithet ? ' <span style="font-weight:normal;opacity:.6;font-size:11px">&ldquo;' + _cmdEsc(e.epithet) + '&rdquo;</span>' : '') + '</div>'
    +   '<div style="font-size:11px;opacity:.78">' + _cmdEsc(e.rank || "Maj. Gen.")
    +     ' &middot; <span aria-hidden="true" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:' + gr.color + ';margin-right:3px"></span><b>' + _cmdEsc(gr.letter) + '</b> ' + _cmdEsc(gr.word) + ' (' + ovr + ' OVR)</div>'
    +   '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:3px 0">'
    +     '<span title="Political value — the faction, votes, or constituency he delivers" style="font-size:10px;background:rgba(120,99,74,.22);border:1px solid var(--rule);border-radius:3px;padding:1px 6px">Political value: <b>' + polWord + '</b> ' + polVal + '</span>'
    +     (e.constituency ? '<span style="font-size:10px;opacity:.72;padding:1px 2px">' + _cmdEsc(e.constituency) + '</span>' : '')
    +   '</div>'
    +   (record ? '<div style="font-size:11px;opacity:.82;line-height:1.4">' + _cmdEsc(record) + '</div>' : '')
    +   (e.provenance ? '<div style="font-size:10px;opacity:.55;margin-top:3px">' + _cmdEsc(e.provenance) + (e.sources && e.sources.length ? ' &middot; ' + _cmdEsc(e.sources.join("; ")) : '') + '</div>' : '')
    + '</div>'
    + '<div style="flex:0 0 auto;text-align:right">' + ctrl + '</div>'
    + '</div>';
}
function _cmdCommissionHTML(C) {
  var cfg = _cmdCommissionCfg(); if (!cfg) return "";
  var side = (C.side === "CS") ? "CS" : "US";
  var pool = _cmdCommissionPool(side); if (!pool.length) return "";
  var cap = (C.clock && typeof C.clock.capital === "number") ? Math.round(C.clock.capital) : 0;
  var committed = cmdCommissioned(C), count = committed.length;
  var maxC = Math.max(0, Math.floor(_cmdNum(cfg.maxCommissions, 3)));
  var rows = "";
  for (var i = 0; i < pool.length; i++) rows += _cmdCommissionRow(C, pool[i], side, cap, count, maxC, committed);
  return '<div style="margin-top:16px">'
    + '<div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#b3925e;margin-bottom:2px">Commission an officer &mdash; the political generals</div>'/* a11y: #b3925e 5.0:1 -> AA */
    + '<div style="font-size:11px;opacity:.8;margin-bottom:6px;line-height:1.45">The war was fought by a coalition, and its rifles needed the men a coalition is made of. Lincoln and Davis alike commissioned generals for the factions, the votes, and the immigrant regiments they brought &mdash; not their generalship. You may do the same: a political general is <b>cheap</b> to commission, but he is <b>weak in the field</b>, and his low rating will drag whatever command you give him. The lesson the war taught at a fearful price &mdash; that a star on the shoulder is not the same as the skill to use it.</div>'
    + '<div style="font-size:11px;opacity:.78;margin-bottom:6px">Commissioned: <b>' + count + '</b> of ' + maxC + ' &middot; once commissioned, he joins the generals at your call above &mdash; to appoint, promote, or seat over a corps.</div>'
    + rows
    + '<div style="font-size:10.5px;opacity:.62;margin-top:6px;line-height:1.4">These men were costly to <i>relieve</i> as well as cheap to commission &mdash; dismissing a political general before an election could cost the very support he was kept for. (That bind on his removal is read in the relief cost; the election-support economy is a coming addition.)</div>'
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
    var meritTag = info.earned ? '' : ' <span title="Above his merit — it costs more and his standing will suffer" style="color:#e86840">(above merit)</span>';/* a11y: #e86840 >=4.53:1 on the lightest command-card ground #2e2816 -> AA (E3-i2: prior #d66040 measured 3.92:1 there, fixed to match L251) (wcag-auditor: contrast fix from #c2502e to #d66040; #c2502e measured 3.74:1, below 4.5:1 required for 11px normal text); meaning also carried by the word "(above merit)" */
    ctrl = '<button id="cmdProm_' + _cmdEsc(g.id) + '" type="button" class="upg" style="flex:0 0 auto" title="Promote to ' + _cmdEsc(info.next) + ' — ' + info.capital + ' political capital + ' + info.seniority + ' seniority' + (info.leapfrog ? '; he leapfrogs more senior men (+seniority)' : '') + '">Promote to ' + _cmdEsc(info.next) + '</button>'
      + '<div style="font-size:10px;opacity:.7;margin-top:2px">&minus;' + info.capital + ' cap &middot; &minus;' + info.seniority + ' sen' + meritTag + '</div>';
  } else {
    ctrl = '<span style="font-size:11px;color:#e86840" title="Promotion to ' + _cmdEsc(info.next) + ' needs ' + info.capital + ' political capital + ' + info.seniority + ' seniority">Needs ' + info.capital + ' cap / ' + info.seniority + ' sen</span>';/* a11y: #e86840 >=4.53:1 on the lightest command-card ground #2e2816 -> AA (E3-i2: prior #d66040 measured 3.92:1 there, fixed to match L251) (wcag-auditor: contrast fix from #c2502e to #d66040; #c2502e measured 3.74:1, below 4.5:1 required for 11px normal text) */
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
  var roster = _cmdRosterPlusCommissioned(C, side); if (!roster.length) return "";   // Q11 (D109): a commissioned officer can be promoted too
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

/* ---- Q10 (D108): the "Corps Command — Depth Chart" section. Each corps billet shows its seated commander
   (name + grade + OVR + a below-grade tell) with a Vacate control, or "Vacant" + a pool select + a Seat
   control (gated on political capital). A live read-out of the net leadership the staffed corps add. Pure
   display; cmdSeatCorps/cmdVacateCorps do the writes. Returns "" with no config / no roster (byte-identical). ---- */
function _cmdCorpsSelect(C, idx, pool) {
  var opts = '<option value="">&mdash; choose a general &mdash;</option>';
  for (var i = 0; i < pool.length; i++) {
    var g = pool[i], rating = Math.round(_cmdGenRating(C, g)), grade = _cmdCurrentGrade(C, g);
    opts += '<option value="' + _cmdEsc(g.id) + '">' + _cmdEsc(_cmdName(g)) + ' &middot; ' + _cmdEsc(grade) + ' &middot; ' + rating + ' OVR</option>';
  }
  return '<select id="cmdCorpsSel_' + idx + '" aria-label="Choose a general for ' + _cmdEsc(_cmdCorpsLabel(idx)) + '" style="font-size:11px;max-width:230px;padding:2px 5px;background:#241c10;color:#efe6d2;border:1px solid var(--rule);border-radius:4px">' + opts + '</select>';
}
function _cmdCorpsSlotRow(C, idx, cap, cost) {
  var cc = cmdCorpsCommanderFor(C, idx), label = _cmdCorpsLabel(idx);
  var head = '<div style="font-size:12px;font-weight:bold;color:#b3925e;flex:0 0 86px;min-width:74px">' + _cmdEsc(label) + '</div>';/* a11y: #b3925e 5.0:1 on the lightest .sheet ground -> AA (the R-2 measured value) */
  var body, ctrl;
  if (cc) {
    var gr = (typeof fldRatingGrade === "function") ? fldRatingGrade(cc.ovr) : { letter: "", color: "#b8863b" };
    var bg = cc.belowGrade ? ' <span title="He commands below grade — a corps is properly a ' + _cmdEsc(_cmdCorpsPreferredGrade(C)) + '&rsquo;s billet. Promote him to lead it without strain." style="color:#d17936;font-size:10px">&#9650; below grade</span>' : '';/* a11y: contrast fix #c9712e (4.11:1) -> #d17936 (4.54:1) on #2e2816 broadsheet for AA 1.4.3; meaning also carried by the words "below grade" + the glyph */
    body = '<div style="flex:1 1 auto;min-width:0;font-size:12px">'
      + '<b>' + _cmdEsc(cc.name) + '</b> <span style="opacity:.74">' + _cmdEsc(cc.grade) + '</span>'
      + ' <span aria-hidden="true" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:' + gr.color + ';margin:0 2px"></span><b>' + _cmdEsc(gr.letter) + '</b> ' + cc.ovr + ' OVR' + bg + '</div>';
    ctrl = '<button id="cmdCorpsVac_' + idx + '" type="button" class="upg" style="flex:0 0 auto;font-size:11px;padding:2px 8px">Vacate</button>';
  } else {
    var pool = _cmdCorpsPoolFor(C, idx);
    if (!pool.length) {
      body = '<div style="flex:1 1 auto;font-size:11px;opacity:.65">Vacant &mdash; no generals are free to command this corps.</div>'; ctrl = '';
    } else if (cap < cost) {
      body = '<div style="flex:1 1 auto;font-size:11px;opacity:.72">Vacant &mdash; a leaderless corps.</div>';
      ctrl = '<span style="font-size:11px;color:#e86840" title="Seating a corps commander costs ' + cost + ' political capital">Needs ' + cost + ' cap</span>';/* a11y: #e86840 >=4.5:1 on the rendered desk grounds -> AA (the Q8b-measured value); meaning also in the words */
    } else {
      body = '<div style="flex:1 1 auto;display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span style="font-size:11px;opacity:.72">Vacant</span>' + _cmdCorpsSelect(C, idx, pool) + '</div>';
      ctrl = '<button id="cmdCorpsSeat_' + idx + '" type="button" class="upg" style="flex:0 0 auto;font-size:11px;padding:2px 8px" title="Seat the chosen general in ' + _cmdEsc(label) + ' &mdash; ' + cost + ' political capital">Seat <span style="opacity:.8">(&minus;' + cost + ' cap)</span></button>';
    }
  }
  return '<div style="display:flex;gap:10px;align-items:center;padding:6px 0;border-bottom:1px dotted var(--rule)">' + head + body + ctrl + '</div>';
}
/* ---- Q12 (D110): the DIVISION sub-rows, nested under a SEATED corps. Each division billet shows its seated
   commander (name + grade + OVR + a below-grade tell) with a Vacate control, or "Vacant" + a pool select + a
   Seat control (gated on capital). Returns "" when there is no config or the parent corps is not seated (the
   hierarchy gate). Pure display; cmdSeatDivision/cmdVacateDivision do the writes. ---- */
function _cmdDivSelect(C, cidx, didx, pool) {
  var opts = '<option value="">&mdash; choose a general &mdash;</option>';
  for (var i = 0; i < pool.length; i++) {
    var g = pool[i], rating = Math.round(_cmdGenRating(C, g)), grade = _cmdCurrentGrade(C, g);
    opts += '<option value="' + _cmdEsc(g.id) + '">' + _cmdEsc(_cmdName(g)) + ' &middot; ' + _cmdEsc(grade) + ' &middot; ' + rating + ' OVR</option>';
  }
  return '<select id="cmdDivSel_' + cidx + '_' + didx + '" aria-label="Choose a general for the ' + _cmdEsc(_cmdDivLabel(didx)) + ' of ' + _cmdEsc(_cmdCorpsLabel(cidx)) + '" style="font-size:11px;max-width:210px;padding:2px 5px;background:#241c10;color:#efe6d2;border:1px solid var(--rule);border-radius:4px">' + opts + '</select>';
}
function _cmdDivSubrow(C, cidx, didx, cap, cost) {
  var dc = cmdDivCommanderFor(C, cidx, didx), label = _cmdDivLabel(didx);
  var head = '<div style="font-size:11px;font-weight:bold;color:#a98a55;flex:0 0 92px;min-width:80px">' + _cmdEsc(label) + '</div>';/* a11y: #a98a55 4.6:1 on the .sheet ground -> AA */
  var body, ctrl;
  if (dc) {
    var gr = (typeof fldRatingGrade === "function") ? fldRatingGrade(dc.ovr) : { letter: "", color: "#b8863b" };
    var bg = dc.belowGrade ? ' <span title="He commands below grade — a division is properly a ' + _cmdEsc(_cmdDivPreferredGrade(C)) + '&rsquo;s billet. Promote him to lead it without strain." style="color:#d17936;font-size:10px">&#9650; below grade</span>' : '';/* a11y: #d17936 4.54:1 on #2e2816 -> AA; meaning also in the words + glyph */
    body = '<div style="flex:1 1 auto;min-width:0;font-size:11px">'
      + '<b>' + _cmdEsc(dc.name) + '</b> <span style="opacity:.74">' + _cmdEsc(dc.grade) + '</span>'
      + ' <span aria-hidden="true" style="display:inline-block;width:6px;height:6px;border-radius:50%;background:' + gr.color + ';margin:0 2px"></span><b>' + _cmdEsc(gr.letter) + '</b> ' + dc.ovr + ' OVR' + bg + '</div>';
    ctrl = '<button id="cmdDivVac_' + cidx + '_' + didx + '" type="button" class="upg" style="flex:0 0 auto;font-size:10px;padding:2px 7px">Vacate</button>';
  } else {
    var pool = _cmdDivPoolFor(C, cidx, didx);
    if (!pool.length) {
      body = '<div style="flex:1 1 auto;font-size:10.5px;opacity:.6">Vacant &mdash; no generals are free to command this division.</div>'; ctrl = '';
    } else if (cap < cost) {
      body = '<div style="flex:1 1 auto;font-size:10.5px;opacity:.7">Vacant.</div>';
      ctrl = '<span style="font-size:10.5px;color:#e86840" title="Seating a division commander costs ' + cost + ' political capital">Needs ' + cost + ' cap</span>';/* a11y: #e86840 >=4.5:1 -> AA; meaning also in the words */
    } else {
      body = '<div style="flex:1 1 auto;display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span style="font-size:10.5px;opacity:.7">Vacant</span>' + _cmdDivSelect(C, cidx, didx, pool) + '</div>';
      ctrl = '<button id="cmdDivSeat_' + cidx + '_' + didx + '" type="button" class="upg" style="flex:0 0 auto;font-size:10px;padding:2px 7px" title="Seat the chosen general in the ' + _cmdEsc(label) + ' of ' + _cmdEsc(_cmdCorpsLabel(cidx)) + ' &mdash; ' + cost + ' political capital">Seat <span style="opacity:.8">(&minus;' + cost + ' cap)</span></button>';
    }
  }
  return '<div style="display:flex;gap:8px;align-items:center;padding:4px 0">' + head + body + ctrl + '</div>';
}
function _cmdDivSubrowsForCorps(C, cidx, cap) {
  var cfg = _cmdDivCfg(); if (!cfg) return "";
  var seatedCorps = cmdCorpsSeated(C);
  if (seatedCorps[cidx] == null) return "";                     // the hierarchy gate: divisions only under a seated corps
  var per = _cmdDivPerCorps();
  var cost = Math.max(0, Math.round(_cmdNum(cfg.seatCost, 2)));
  var sub = "";
  for (var d = 0; d < per; d++) sub += _cmdDivSubrow(C, cidx, d, cap, cost);
  return '<div style="margin:2px 0 8px 18px;padding-left:12px;border-left:2px solid rgba(179,146,94,.34)">'
    + '<div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#a98a55;opacity:.92;margin:2px 0 1px">Divisions of ' + _cmdEsc(_cmdCorpsLabel(cidx)) + '</div>'/* a11y: #a98a55 4.6:1 -> AA */
    + sub
    + '</div>';
}
function _cmdCorpsDepthHTML(C) {
  var cfg = _cmdCorpsCfg(); if (!cfg) return "";
  var side = (C.side === "CS") ? "CS" : "US";
  if (!_cmdSideGenerals(side).length) return "";
  var slots = _cmdCorpsSlots();
  var cap = (C.clock && typeof C.clock.capital === "number") ? Math.round(C.clock.capital) : 0;
  var cost = Math.max(0, Math.round(_cmdNum(cfg.seatCost, 3)));
  var divCfg = _cmdDivCfg(), hasDiv = !!divCfg;
  var rows = "";
  for (var i = 0; i < slots; i++) {
    rows += _cmdCorpsSlotRow(C, i, cap, cost);
    if (hasDiv && typeof _cmdDivSubrowsForCorps === "function") rows += _cmdDivSubrowsForCorps(C, i, cap);   // Q12 (D110): nest the division billets under each seated corps (the tree)
  }
  // Q12 (D110): the readout is the COMBINED corps + division lift — both feed the army's command facet, so the
  // player sees the true total impact of the staff he has built. "Corps staff" kept contiguous (probe-locked).
  var lift = Math.round(_cmdCorpsLift(C) + (typeof _cmdDivLift === "function" ? _cmdDivLift(C) : 0)), eff;
  if (lift > 0) eff = '<span aria-hidden="true" style="color:#6f9e5a">&#9650;</span> <b>+' + lift + '</b> to the army&rsquo;s command in the field &mdash; a sound command staff';
  else if (lift < 0) eff = '<span aria-hidden="true" style="color:#d17936">&#9660;</span> <b>&minus;' + Math.abs(lift) + '</b> to the army&rsquo;s command &mdash; weak or stretched leadership drags it';
  else eff = 'No net effect yet &mdash; seat able generals to lift the army, or leave the command to the course of the war';
  var divIntro = hasDiv ? ' A corps was built of <b>divisions</b>: seat a corps commander, then staff the divisions beneath him &mdash; a corps was only as good as its divisions.' : '';
  var divFoot = hasDiv ? ' Below each seated corps you may staff its divisions (a division is properly a ' + _cmdEsc(_cmdDivPreferredGrade(C)) + '&rsquo;s billet) &mdash; the cutting edge of a corps, like A.&thinsp;P. Hill&rsquo;s Light Division under Jackson or the Union&rsquo;s hard-fighting divisions in Hancock&rsquo;s II Corps.' : '';
  return '<div style="margin-top:16px">'
    + '<div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#b3925e;margin-bottom:2px">The corps command &mdash; depth chart</div>'/* a11y: #b3925e 5.0:1 -> AA */
    + '<div style="font-size:11px;opacity:.8;margin-bottom:6px">An army fought as corps. Seat your generals at the head of each &mdash; who you place, and whether his rank fits the billet, shapes how well the whole army fights. It costs <b>' + cost + '</b> political capital to seat a commander, the same clout you spend to appoint and promote.' + divIntro + '</div>'
    + '<div style="font-size:11px;opacity:.92;margin-bottom:6px;padding:6px 9px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.08)">Corps staff: ' + eff + '.</div>'
    + rows
    + '<div style="font-size:10.5px;opacity:.62;margin-top:6px;line-height:1.4">Your corps commanders shape the army&rsquo;s leadership in every battle; where the historical order of battle is known above, your appointees take their places in it. A corps is properly a ' + _cmdEsc(_cmdCorpsPreferredGrade(C)) + '&rsquo;s billet &mdash; seat a junior general and he leads stretched until you promote him.' + divFoot + '</div>'
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
      + '<button id="cmdCard_' + i + '" type="button" class="upg" aria-expanded="false" aria-controls="cmdCardBox_' + i + '" style="font-size:11px;padding:1px 8px;margin-top:3px">The historians &#9656;</button>'
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
    + ((typeof fldCampaignOOBHtml === "function") ? fldCampaignOOBHtml(C, { reveal: cmdScoutTier(C), reconHtml: cmdScoutControlHtml(C) }) : '')   /* D106 board + Q8b (D107): the recon tier earned by scouting + the "Order a reconnaissance" control embedded in the board (the WRITE lives in cmdScout; T15 stays pure-read) */
    + cmdEnemyShadowHTML(C)
    + _cmdTransferHTML(C)
    + _cmdPoolHTML(C)
    + _cmdCommissionHTML(C)
    + _cmdPromotionsHTML(C)
    + _cmdCorpsDepthHTML(C)
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
  if (!_cmdByIdRoster(side, id) && cmdCommissioned(C).indexOf(id) < 0) return;   // Q11 (D109) bug-hunt MED: a commission-pool officer must be COMMISSIONED before he can be appointed (matches the gated UI + the invariant; byte-identical for roster ids — _cmdByIdRoster is truthy for them, so the clause is always false)
  if (id === cmdActiveId(C)) return;                 // already in command
  var incumbent = cmdActiveGeneral(C);
  var cost = incumbent ? _cmdReliefCost(C, incumbent) : 0;
  var clk = C.clock, cap = (clk && typeof clk.capital === "number" && isFinite(clk.capital)) ? Math.round(clk.capital) : 0;   // round to match the pool's displayed capital (no soft-lock, D53.7)
  if (cap < cost) return;                            // not enough political capital (the gate)
  if (clk && typeof clk.capital === "number") clk.capital = Math.max(0, cap - cost);   // debit the rounded (finite-guarded) cap — uniform with the other GM moves; closes a NaN-capital debit (Q11 bug-hunt LOW)
  cmd.fieldGeneral = id;
  // Q10 (D108): the new army commander cannot also hold a corps billet — vacate it immediately (cmdInit also
  // re-cleans on the next load, but keep the live state consistent).
  if (cmd.corps && typeof cmd.corps === "object" && !Array.isArray(cmd.corps)) {
    for (var ck in cmd.corps) { if (cmd.corps.hasOwnProperty(ck) && cmd.corps[ck] === id) delete cmd.corps[ck]; }
  }
  // Q12 (D110): nor a division (one billet per man) — clear any division he held when he takes the army command.
  if (typeof _cmdDivClearGeneral === "function") _cmdDivClearGeneral(cmd, id);
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
  var roster = _cmdRosterPlusCommissioned(C, side);   // Q11 (D109): wire appoint/promote for commissioned officers too (the render lists them)
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
  // Q8b (D107): wire the "Order a reconnaissance" button (one per board; absent when already scouted / unaffordable)
  var sct = document.getElementById("cmdScout");
  if (sct) sct.addEventListener("click", function () {
    cmdScout(C);
    if (typeof saveLocal === "function") saveLocal();
    if (typeof _wdRefresh === "function") _wdRefresh();
  });
  var transferRoster = _cmdRosterPlusCommissioned(C, side);
  for (var tr = 0; tr < transferRoster.length; tr++) {
    (function (g) {
      if (!g || !g.id) return;
      var tb = document.getElementById("cmdTransfer_" + _cmdEsc(g.id));
      if (tb) tb.addEventListener("click", function () {
        cmdTransfer(C, g.id);
        if (typeof saveLocal === "function") saveLocal();
        if (typeof _wdRefresh === "function") _wdRefresh();
      });
    })(transferRoster[tr]);
  }
  // Q10 (D108): wire the corps depth-chart controls — a Seat button (reads its slot's select) + a Vacate button
  // per slot (ids mirror the render, the slot index is integer so no escaping is needed).
  var corpsSlots = _cmdCorpsSlots();
  for (var s = 0; s < corpsSlots; s++) {
    (function (idx) {
      var seatBtn = document.getElementById("cmdCorpsSeat_" + idx);
      if (seatBtn) seatBtn.addEventListener("click", function () {
        var sel = document.getElementById("cmdCorpsSel_" + idx);
        var gid = sel ? sel.value : "";
        if (!gid) return;                                  // no general chosen — no-op
        cmdSeatCorps(C, idx, gid);
        if (typeof saveLocal === "function") saveLocal();
        if (typeof _wdRefresh === "function") _wdRefresh();
      });
      var vacBtn = document.getElementById("cmdCorpsVac_" + idx);
      if (vacBtn) vacBtn.addEventListener("click", function () {
        cmdVacateCorps(C, idx);
        if (typeof saveLocal === "function") saveLocal();
        if (typeof _wdRefresh === "function") _wdRefresh();
      });
    })(s);
  }
  // Q12 (D110): wire the DIVISION sub-billet controls — a Seat button (reads its slot's select) + a Vacate button
  // per (corps, division) slot (ids mirror the render; both indices are integers, so no escaping is needed). The
  // absent controls (a vacant parent corps renders none) simply resolve to null and are skipped.
  if (typeof _cmdDivPerCorps === "function") {
    var dPer = _cmdDivPerCorps();
    for (var cs = 0; cs < corpsSlots; cs++) {
      for (var ds = 0; ds < dPer; ds++) {
        (function (ci, di) {
          var dSeat = document.getElementById("cmdDivSeat_" + ci + "_" + di);
          if (dSeat) dSeat.addEventListener("click", function () {
            var sel = document.getElementById("cmdDivSel_" + ci + "_" + di);
            var gid = sel ? sel.value : "";
            if (!gid) return;                                  // no general chosen — no-op
            cmdSeatDivision(C, ci, di, gid);
            if (typeof saveLocal === "function") saveLocal();
            if (typeof _wdRefresh === "function") _wdRefresh();
          });
          var dVac = document.getElementById("cmdDivVac_" + ci + "_" + di);
          if (dVac) dVac.addEventListener("click", function () {
            cmdVacateDivision(C, ci, di);
            if (typeof saveLocal === "function") saveLocal();
            if (typeof _wdRefresh === "function") _wdRefresh();
          });
        })(cs, ds);
      }
    }
  }
  // Q11 (D109): wire the Commission buttons (one per commission-pool officer; ids mirror the render, escaped — D43.4).
  var commPool = _cmdCommissionPool(side);
  for (var cm = 0; cm < commPool.length; cm++) {
    (function (e) {
      if (!e || !e.id) return;
      var cb = document.getElementById("cmdComm_" + _cmdEsc(e.id));
      if (cb) cb.addEventListener("click", function () {
        cmdCommission(C, e.id);
        if (typeof saveLocal === "function") saveLocal();
        if (typeof _wdRefresh === "function") _wdRefresh();
      });
    })(commPool[cm]);
  }
  var d = _cmdData();
  if (d && d.teachingCards) for (var c = 0; c < d.teachingCards.length; c++) {
    (function (idx) {
      var btn = document.getElementById("cmdCard_" + idx);
      if (btn) btn.addEventListener("click", function () {
        var box = document.getElementById("cmdCardBox_" + idx);
        if (box) { box.style.display = (box.style.display === "none") ? "block" : "none"; btn.setAttribute("aria-expanded", box.style.display !== "none" ? "true" : "false"); }
      });
    })(c);
  }
}
