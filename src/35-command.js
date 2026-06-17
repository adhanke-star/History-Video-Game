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
  // seed reputation for every general on this side, once (idempotent: only if absent).
  var roster = _cmdSideGenerals(side);
  for (var i = 0; i < roster.length; i++) {
    var g = roster[i]; if (!g || !g.id) continue;
    var r = cmd.reputation[g.id];
    if (typeof r !== "number" || !(r >= 0 && r <= 100)) {
      cmd.reputation[g.id] = (typeof g.reputation === "number") ? Math.max(0, Math.min(100, g.reputation)) : 60;
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

/* A general's LEADERSHIP rating (0-100): operational skill blended with his current
   standing. A neutral man (skill 64, reputation 64) rates 64 — the bridge anchor. */
function _cmdGenRating(C, gen) {
  if (!gen) return 64;
  var skill = (typeof gen.skill === "number") ? gen.skill : 64;
  var rep = _cmdReputation(C, gen.id);
  return 0.55 * skill + 0.45 * rep;
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

/* The active general's combat traits, for the auto-resolve margin (attack/defend). */
function cmdActiveTraits(C) {
  var g = cmdActiveGeneral(C);
  if (!g) return { skill: 64, aggression: 50, caution: 50 };
  return {
    skill: (typeof g.skill === "number") ? g.skill : 64,
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
      cmd.reputation[id] = Math.max(5, Math.min(98, cur + delta));
    }
    // log a handover when the HISTORICAL default shifts and the player is following history.
    if (!cmd.fieldGeneral && id && id !== prevActive && prevActive) {
      var now = _cmdById(side, id), prev = _cmdById(side, prevActive);
      if (now && typeof _pdLog === "function") {
        _pdLog(C, "General " + _cmdName(now) + " takes field command" + (prev ? ", succeeding " + _cmdName(prev) : "") + ".");
      }
    }
    cmd._activeId = id;
  } catch (e) {}
}

/* ===== render: the "Command" desk tab ===== */

function _cmdPortrait(gen, side, size) {
  if (!gen || typeof window.portraitFor !== "function") return "";
  try {
    return '<img src="' + window.portraitFor(_cmdName(gen), side, { named: true }) + '" alt="General ' + _cmdEsc(_cmdName(gen))
      + '" style="width:' + size + 'px;height:' + size + 'px;object-fit:cover;border:2px solid var(--rule);border-radius:4px;flex:0 0 auto">';
  } catch (e) { return ""; }
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
  var lead = commandLeadership(C), lw = _cmdLeadWord(lead);
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
    +       '<div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule)">' + (byHistory ? 'In command (by the course of the war)' : 'Your appointed commander') + '</div>'
    +       '<div style="font-weight:bold;font-size:16px">' + _cmdEsc(gen.fullName || _cmdName(gen))
    +         (gen.epithet ? ' <span style="font-weight:normal;opacity:.65;font-size:12px">&ldquo;' + _cmdEsc(gen.epithet) + '&rdquo;</span>' : '') + '</div>'
    +       '<div style="opacity:.7;font-size:11px">' + _cmdEsc(gen.rank || "General") + (traits ? ' &middot; ' + _cmdEsc(gen.traits.join(" · ")) : '') + '</div>'
    +       (gen.voice ? '<div style="font-style:italic;opacity:.85;font-size:12px;margin-top:5px;border-left:2px solid var(--rule);padding-left:8px">' + _cmdEsc(gen.voice) + '</div>' : '')
    +     '</div>'
    +     '<div style="flex:0 0 auto;text-align:right">'
    +       '<div style="font-weight:bold;font-size:20px;color:' + lw[1] + '">' + lead + '</div>'
    +       '<div style="font-size:10px;opacity:.6">' + lw[0] + ' command</div>'
    +     '</div>'
    +   '</div>'
    +   '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:9px">'
    +     '<div style="flex:1 1 180px;min-width:160px">'
    +       _cmdTraitBar('Skill', gen.skill, 'Operational generalship.')
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
    var rw = _cmdLeadWord(rating);
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
      +   '<div style="font-size:11px;opacity:.7">' + _cmdEsc(g.rank || "") + ' &middot; <span style="color:' + rw[1] + '">' + rw[0] + ' (' + rating + ')</span></div>'
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
    + '<div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin-bottom:2px">The generals at your call</div>'
    + capLine
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

/* ---- cmdRenderTab: the Command desk tab. ---- */
function cmdRenderTab(C) {
  if (!C) return '';
  try {
    if (typeof presInit === "function") presInit(C);
    cmdInit(C);
  } catch (e) { return '<p class="lede" style="font-size:13px">Your generals await your orders.</p>'; }
  if (!_cmdData()) return '<p class="lede" style="font-size:13px">Your generals await your orders.</p>';
  return ''
    + '<p class="lede" style="font-size:13px;margin-bottom:10px">You appoint the men who command your armies &mdash; and you relieve them. A great general lifts the army your war puts in the field; a cautious or discredited one squanders it. But a popular general is dangerous to dismiss: it costs you political capital, and the country is watching.</p>'
    + _cmdActiveCard(C)
    + _cmdPoolHTML(C)
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
