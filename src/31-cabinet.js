/* ===========================================================================
   S2 m1 · 31-cabinet.js — THE CABINET & ADVISOR SYSTEM (R25 linchpin / §8.22 / §8.54).

   Replaces the S0 cabinet STUB (4 fixed secretaries + a bare Delegate toggle)
   with the full historical cabinet and the advisor UX:
       - the FULL roster per side, date-aware (the CHURN is mechanical: Davis's
         revolving War Office, the Benjamin three-post rotation, Chase out in '64
         all play out as the strategic clock advances — the current holder of an
         office is whoever historically held it at the strategic date);
       - per principal advisor: a one-line RECOMMENDATION keyed to the war state,
         a one-click ACCEPT or DELEGATE, an expandable WHY (reasoning + teaching +
         provenance), and an AMBITION tell that surfaces when the man puts himself
         before the war (Chase, Toombs, Blair...). Fast to play, deep on demand.

   Data: data/cabinet.json -> GAME_DATA.cabinet (Verified roster; voice/why/cards
   adversarially verified). Falls back gracefully if the data is absent.

   EXTENDS, does not duplicate: adds C.president.cabinetState (domain-keyed dynamic
   state: delegated flag + heededTurn) + C.president.cabHolders (churn snapshot),
   migrating the S0 P.cabinet delegated flags. Plain data — rides the save with NO
   _SAVE_VER bump (idempotent cabInit = lazy migration, D7 pattern).

   OVERRIDES presRenderCabinet / presWireCabinet (declared in 20/30; this module
   loads later so the redeclarations win; both added to manifest.overrides).
   New helpers carry the unique _cab/cab prefix. Render NEVER mutates or saves;
   the Wire fns and the tick do. cabInit/cabOnResolve are registered into the
   _t1InitAll / _t1Resolve overrides in 90-president-register.js.

   Bare-name globals (G, GAME_DATA — never window.G). cabinetLeadership(C) is
   exposed for the generals/command milestone to feed the bridge leadership facet
   (NOT yet consumed by bridgeArmy — wiring lands with named generals, to be tuned
   holistically there; this milestone is purely additive UI/teaching, zero battle
   balance risk).
   =========================================================================== */

var _cabPRINCIPALS = ["war", "treasury", "state", "navy"];

var _cabDOMAIN_LABEL = {
  war: "War Department", treasury: "The Treasury", state: "State Department",
  navy: "Navy Department", justice: "Justice", post: "Post Office", interior: "Interior"
};

/* data/cabinet.json -> GAME_DATA.cabinet (or null). */
function _cabData() {
  return (typeof GAME_DATA !== "undefined" && GAME_DATA && GAME_DATA.cabinet) ? GAME_DATA.cabinet : null;
}

/* The side's full advisor roster (array) — falls back to the S0 stub names. */
function _cabSideRoster(side) {
  var s = (side === "CS") ? "CS" : "US";
  var d = _cabData();
  if (d && d.sides && d.sides[s] && d.sides[s].advisors && d.sides[s].advisors.length) return d.sides[s].advisors;
  return [];
}

/* Escape for innerHTML AND attribute contexts (quotes too — the D43.4 lesson). */
function _cabEsc(s) {
  s = (s == null) ? "" : String(s);
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* A strategic date as a comparable integer (year*12 + month). */
function _cabDateNum(d) {
  if (!d || typeof d.year !== "number") return 1861 * 12 + 2;
  return d.year * 12 + (typeof d.month === "number" ? d.month : 1);
}
function _cabTenureNum(t) { return t ? (t.y * 12 + (t.m || 1)) : 0; }

/* The advisor who held `domain` at strategic date `date` — latest tenure-start
   whose window contains the date (so the churn resolves to one current holder). */
function _cabHolder(side, domain, date) {
  var roster = _cabSideRoster(side), now = _cabDateNum(date), best = null, bestStart = -1;
  for (var i = 0; i < roster.length; i++) {
    var a = roster[i];
    if (!a || a.domain !== domain || !a.tenure) continue;
    var st = _cabTenureNum(a.tenure.start);
    var en = a.tenure.end ? _cabTenureNum(a.tenure.end) : Infinity;
    if (st <= now && now <= en && st > bestStart) { best = a; bestStart = st; }
  }
  // Before the first holder's start (or no data), fall back to the earliest holder of the domain.
  if (!best) {
    for (var j = 0; j < roster.length; j++) {
      var b = roster[j];
      if (!b || b.domain !== domain || !b.tenure) continue;
      var bs = _cabTenureNum(b.tenure.start);
      if (bestStart < 0 || bs < bestStart) { best = b; bestStart = bs; }
    }
  }
  return best;
}

/* ---- cabInit: idempotent. Builds the dynamic cabinet state, migrating the S0
   stub's delegated flags. Registered in _t1InitAll AFTER presInit. ---- */
function cabInit(C) {
  if (!C) return;
  if (typeof presInit === "function") presInit(C);
  if (!C.president) return;
  var P = C.president, side = (C.side === "CS") ? "CS" : "US";
  // reject an array (typeof [] === "object" passes a bare object check, but the
  // per-domain string keys we add are dropped on the next JSON round-trip ->
  // silent dead UI). Matches the artInit/engInit guard idiom. (Bug-hunt D49.2.)
  if (Array.isArray(P.cabinetState) || !P.cabinetState || typeof P.cabinetState !== "object") P.cabinetState = {};
  if (typeof P.heedCapTurn !== "number") P.heedCapTurn = -1;   // once-per-turn political-capital gate (D49.5)
  // migrate the old P.cabinet[].delegated by domain, if present
  var oldDeleg = {};
  if (P.cabinet && P.cabinet.length) {
    for (var k = 0; k < P.cabinet.length; k++) {
      var oc = P.cabinet[k];
      if (oc && oc.domain) oldDeleg[oc.domain] = !!oc.delegated;
    }
  }
  for (var i = 0; i < _cabPRINCIPALS.length; i++) {
    var dom = _cabPRINCIPALS[i];
    var cs = P.cabinetState[dom];
    if (!cs || typeof cs !== "object") cs = P.cabinetState[dom] = {};
    if (typeof cs.delegated !== "boolean") cs.delegated = !!oldDeleg[dom];
    if (typeof cs.heededTurn !== "number") cs.heededTurn = -1;
  }
  // churn snapshot (domain -> advisor id) for handover logging
  if (!P.cabHolders || typeof P.cabHolders !== "object") {
    P.cabHolders = {};
    for (var h = 0; h < _cabPRINCIPALS.length; h++) {
      var who = _cabHolder(side, _cabPRINCIPALS[h], P.date);
      P.cabHolders[_cabPRINCIPALS[h]] = who ? who.id : null;
    }
  }
}

/* ---- cabOnResolve: per-turn tick. Runs AFTER presOnResolve (date + turn already
   advanced), so it sees the NEW strategic date. Detects office handovers (the
   churn) and logs them; mutates C.president only. No DOM, no save. ---- */
function cabOnResolve(winnerSide, type, B, C, win) {
  if (!C) return;
  cabInit(C);
  try {
    var P = C.president, side = (C.side === "CS") ? "CS" : "US";
    for (var i = 0; i < _cabPRINCIPALS.length; i++) {
      var dom = _cabPRINCIPALS[i];
      var now = _cabHolder(side, dom, P.date);
      var prevId = P.cabHolders ? P.cabHolders[dom] : null;
      if (now && now.id !== prevId) {
        if (prevId && typeof _pdLog === "function") {
          var prev = _cabPrevHolder(side, dom, now.tenure) || _cabById(side, prevId);
          var verb = (dom === "war") ? "takes the War Department" :
                     (dom === "treasury") ? "takes the Treasury" :
                     (dom === "state") ? "takes the State Department" : "takes the Navy Department";
          _pdLog(C, "Secretary " + now.name + " " + verb + (prev ? ", succeeding " + prev.name : "") + ".");
        }
        if (P.cabHolders) P.cabHolders[dom] = now.id;
      }
    }
  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("cabOnResolve:", e); }
}

function _cabById(side, id) {
  var roster = _cabSideRoster(side);
  for (var i = 0; i < roster.length; i++) if (roster[i] && roster[i].id === id) return roster[i];
  return null;
}

/* The office's tenure-immediate predecessor of `nowTenure` (the holder whose
   tenure.end is latest at or before the new holder's start). When the strategic
   date LEAPS across several tenures in one tick (the clock.year sync can jump a
   year), the stale domain snapshot may be several offices back; this names the
   actual predecessor instead. (Bug-hunt D49.3.) */
function _cabPrevHolder(side, domain, nowTenure) {
  if (!nowTenure || !nowTenure.start) return null;
  var roster = _cabSideRoster(side), startNum = _cabTenureNum(nowTenure.start), best = null, bestEnd = -1;
  for (var i = 0; i < roster.length; i++) {
    var a = roster[i];
    if (!a || a.domain !== domain || !a.tenure || !a.tenure.end) continue;
    var en = _cabTenureNum(a.tenure.end);
    if (en <= startNum && en > bestEnd) { best = a; bestEnd = en; }
  }
  return best;
}

/* ---- _cabReading: the war-state condition that selects which stance an advisor
   presses. Reads only verified state (bridgeArmy / clock / economy / blockade). ---- */
function _cabReading(C, domain) {
  try {
    if (domain === "treasury") {
      var infl = (C.economy && typeof C.economy.inflation === "number") ? C.economy.inflation : 1.0;
      return (infl > 2.0) ? "inflationHigh" : "always";
    }
    if (domain === "war") {
      var ov = (typeof bridgeArmy === "function") ? bridgeArmy(C).overall : 70;
      return (ov < 60) ? "armyWeak" : "always";
    }
    if (domain === "state") {
      var iv = (C.clock && typeof C.clock.intervention === "number") ? C.clock.intervention : 0;
      return (iv > 25) ? "recognitionRisk" : "always";
    }
    if (domain === "navy") {
      var imf = (C.blockade && typeof C.blockade.importFactor === "number") ? C.blockade.importFactor : 1.0;
      return (imf > 0.55) ? "blockadeLoose" : "always";
    }
  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_cabReading:", e); }
  return "always";
}

/* The stance an advisor presses now: condition match -> "always" -> first. */
function _cabActiveStance(advisor, C) {
  if (!advisor || !advisor.stances || !advisor.stances.length) return null;
  var reading = _cabReading(C, advisor.domain), fallback = null;
  for (var i = 0; i < advisor.stances.length; i++) {
    var s = advisor.stances[i];
    if (s.condition === reading) return s;
    if (s.condition === "always" && !fallback) fallback = s;
  }
  return fallback || advisor.stances[0];
}

/* Does the advisor's ambition surface now? High-ambition men (Chase, Toombs)
   always reveal it; moderate-ambition men reveal it when their domain struggles. */
function _cabAmbitionActive(advisor, C) {
  if (!advisor || !advisor.ambitionTell) return false;
  var amb = (typeof advisor.ambition === "number") ? advisor.ambition : 0;
  if (amb >= 75) return true;
  if (amb >= 45) {
    var r = _cabReading(C, advisor.domain);
    return (r === "inflationHigh" || r === "armyWeak" || r === "recognitionRisk");
  }
  return false;
}

/* ---- cabinetLeadership(C): a 0-100 competence index from the sitting cabinet.
   Exposed for the generals/command milestone to feed bridgeArmy's leadership
   facet (NOT yet consumed — wired + tuned there). Anchored near 64 so a default
   cabinet ~= the current bridge placeholder. ---- */
function cabinetLeadership(C) {
  if (!C) return 64;
  var side = (C.side === "CS") ? "CS" : "US";
  var P = (C.president) || {}, date = P.date || { year: 1861, month: 4 };
  // War + Navy secretaries weigh most on the army a war fields.
  var compById = {
    "us-stanton": 14, "us-cameron": -8, "us-welles": 8, "us-seward": 6, "us-chase": 8, "us-fessenden": 4,
    "cs-mallory": 8, "cs-walker": -6, "cs-randolph": 4, "cs-seddon": 2, "cs-breckinridge": 10,
    "cs-benjamin-war": 4, "cs-benjamin-state": 6, "cs-memminger": -4, "cs-trenholm": 2, "cs-toombs": -4
  };
  var lead = 64;
  var warSec = _cabHolder(side, "war", date), navSec = _cabHolder(side, "navy", date);
  if (warSec && typeof compById[warSec.id] === "number") lead += compById[warSec.id];
  if (navSec && typeof compById[navSec.id] === "number") lead += Math.round(compById[navSec.id] * 0.4);
  // ambition friction: a War Secretary putting himself first costs cohesion.
  if (warSec && _cabAmbitionActive(warSec, C)) lead -= 4;
  return Math.max(40, Math.min(85, lead));
}

/* ===== render ===== */

function _cabPortrait(name, side, size) {
  if (typeof window.portraitFor !== "function") return "";
  try {
    return '<img src="' + window.portraitFor(name, side, { named: true }) + '" alt="Secretary ' + _cabEsc(name)
      + '" style="width:' + size + 'px;height:' + size + 'px;object-fit:cover;border:2px solid var(--rule);border-radius:4px;flex:0 0 auto">';
  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_cabPortrait:", e); return ""; }
}

function _cabTenureLabel(advisor, date) {
  if (!advisor || !advisor.tenure) return "";
  var mn = (typeof _pdMonthName === "function") ? _pdMonthName : function (m) { return "" + m; };
  var st = advisor.tenure.start, en = advisor.tenure.end;
  var s = mn(st.m) + " " + st.y;
  return en ? (s + " – " + mn(en.m) + " " + en.y) : ("since " + s);
}

/* One interactive principal advisor card. */
function _cabPrincipalCard(C, domain) {
  var side = (C.side === "CS") ? "CS" : "US";
  var P = C.president, a = _cabHolder(side, domain, P.date);
  if (!a) return "";
  var cs = (P.cabinetState && P.cabinetState[domain]) || { delegated: false, heededTurn: -1 };
  var delegated = !!cs.delegated;
  var heeded = (cs.heededTurn === (P.turn || 0));
  var stance = _cabActiveStance(a, C);
  var ambActive = _cabAmbitionActive(a, C);

  var img = _cabPortrait(a.name, side, 72);
  var traits = (a.traits && a.traits.length) ? a.traits.join(" &middot; ") : "";

  var head = ''
    + '<div style="display:flex;gap:12px;align-items:flex-start">'
    +   img
    +   '<div style="flex:1 1 auto">'
    +     '<div style="font-weight:bold;font-size:15px">Secretary ' + _cabEsc(a.name)
    +       ' <span style="font-weight:normal;opacity:.6;font-size:11px">&middot; ' + _cabEsc(_cabDOMAIN_LABEL[domain] || a.role) + '</span></div>'
    +     '<div style="opacity:.7;font-size:11px">' + _cabEsc(a.role) + ' &middot; ' + _cabTenureLabel(a, P.date) + '</div>'
    +     (traits ? '<div style="opacity:.55;font-size:11px;margin-top:1px">' + _cabEsc(a.traits.join(" · ")) + '</div>' : '')
    +     (a.voice ? '<div style="font-style:italic;opacity:.85;font-size:12px;margin-top:5px;border-left:2px solid var(--rule);padding-left:8px">' + _cabEsc(a.voice) + '</div>' : '')
    +   '</div>'
    + '</div>';

  var recBlock = "";
  if (stance) {
    var ambTag = ambActive ? ' <span style="font-size:10px;color:#9c3b2e;border:1px solid #9c3b2e;border-radius:3px;padding:0 4px" title="This advisor is pressing his own interest">&#9873; ambition</span>' : '';
    var actions = "";
    if (delegated) {
      actions = '<span style="font-size:11px;opacity:.7;align-self:center">Running it in your stead.</span>'
        + '<button id="cabDel_' + domain + '" type="button" class="upg" style="flex:0 0 auto">Reclaim</button>';
    } else if (heeded) {
      actions = '<span style="font-size:11px;color:#4a6b3a;align-self:center">Counsel heeded &check;</span>'
        + '<button id="cabDel_' + domain + '" type="button" class="upg" style="flex:0 0 auto">Delegate</button>';
    } else {
      actions = '<button id="cabAcc_' + domain + '" type="button" class="upg" style="flex:0 0 auto">Heed</button>'
        + '<button id="cabDel_' + domain + '" type="button" class="upg" style="flex:0 0 auto">Delegate</button>';
    }
    recBlock = ''
      + '<div style="margin-top:8px;padding-top:8px;border-top:1px dotted var(--rule)">'
      +   '<div style="display:flex;gap:8px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap">'
      +     '<div style="flex:1 1 260px;font-size:13px">&ldquo;' + _cabEsc(stance.oneLine) + '&rdquo;' + ambTag + '</div>'
      +     '<div style="display:flex;gap:6px;flex:0 0 auto">' + actions + '</div>'
      +   '</div>'
      +   '<button id="cabWhy_' + domain + '" type="button" class="upg" style="margin-top:6px;font-size:11px;padding:1px 8px">Why &#9656;</button>'
      +   '<div id="cabWhyBox_' + domain + '" style="display:none;margin-top:6px;font-size:12px;opacity:.85;background:rgba(0,0,0,.12);border:1px solid var(--rule);border-radius:4px;padding:8px">'
      +     _cabEsc(stance.why)
      +     '<div style="margin-top:5px;font-size:10px;opacity:.6">' + _cabEsc((stance.provenance || "Inferred")) + (stance.sources && stance.sources.length ? ' &middot; ' + _cabEsc(stance.sources.join("; ")) : '') + '</div>'
      +   '</div>'
      + '</div>';
  }

  var ambBlock = (ambActive && a.ambitionTell)
    ? '<div style="margin-top:8px;font-size:11px;color:#9c3b2e;background:rgba(156,59,46,.08);border:1px solid rgba(156,59,46,.4);border-radius:4px;padding:7px">&#9873; <b>Ambition.</b> ' + _cabEsc(a.ambitionTell) + '</div>'
    : '';

  return '<div style="padding:11px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.12)">'
    + head + recBlock + ambBlock + '</div>';
}

/* The full-roster (incl. secondaries + churn) expandable list — teaching. */
function _cabFullRosterHTML(C) {
  var side = (C.side === "CS") ? "CS" : "US";
  var roster = _cabSideRoster(side), P = C.president;
  if (!roster.length) return "";
  // group by domain, in a sensible order
  var order = ["war", "treasury", "state", "navy", "justice", "post", "interior"];
  var current = {};
  for (var d = 0; d < order.length; d++) { var h = _cabHolder(side, order[d], P.date); current[order[d]] = h ? h.id : null; }
  var rows = "";
  for (var o = 0; o < order.length; o++) {
    var dom = order[o], any = false, line = "";
    for (var i = 0; i < roster.length; i++) {
      var a = roster[i];
      if (!a || a.domain !== dom) continue;
      any = true;
      var isNow = (current[dom] === a.id);
      line += '<div style="display:flex;justify-content:space-between;gap:8px;font-size:12px;padding:1px 0' + (isNow ? ';color:#b8863b;font-weight:bold' : ';opacity:.7') + '">'
        + '<span>' + _cabEsc(a.name) + (isNow ? ' &mdash; in office' : '') + '</span>'
        + '<span style="opacity:.7;font-size:11px">' + _cabTenureLabel(a, P.date) + '</span></div>';
    }
    if (any) rows += '<div style="margin:7px 0 4px"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--rule)">' + _cabEsc(_cabDOMAIN_LABEL[dom] || dom) + '</div>' + line + '</div>';
  }
  return ''
    + '<button id="cabFullToggle" type="button" class="upg" style="font-size:11px;padding:2px 8px;margin-top:4px">The full cabinet &#9656;</button>'
    + '<div id="cabFullBox" style="display:none;margin-top:6px;padding:8px;border:1px solid var(--rule);border-radius:4px;background:rgba(0,0,0,.1)">'
    +   '<p style="font-size:11px;opacity:.65;margin:0 0 4px">Offices change hands as the war goes on. ' + (side === "CS" ? 'Davis ran through six War Secretaries in four years; Benjamin alone rotated through three posts.' : 'Lincoln governed a cabinet of former rivals.') + '</p>'
    +   rows
    + '</div>';
}

function _cabCrossCardHTML(C) {
  var side = (C.side === "CS") ? "CS" : "US";
  var d = _cabData();
  if (!d || !d.crossCards) return "";
  var html = "";
  for (var i = 0; i < d.crossCards.length; i++) {
    var c = d.crossCards[i];
    if (!c || (c.side && c.side !== side)) continue;
    var persp = "";
    if (c.perspectives) for (var p = 0; p < c.perspectives.length; p++) {
      persp += '<div style="margin:5px 0;font-size:12px"><span style="opacity:.6;font-style:italic">' + _cabEsc(c.perspectives[p].voice) + ':</span> ' + _cabEsc(c.perspectives[p].text) + '</div>';
    }
    html += '<div style="margin-top:10px;padding:10px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.1)">'
      + '<div style="font-weight:bold;font-size:13px">' + _cabEsc(c.title) + '</div>'
      + '<div style="font-size:12px;opacity:.85;margin:3px 0 2px">' + _cabEsc(c.claim) + '</div>'
      + '<button id="cabCC_' + i + '" type="button" class="upg" style="font-size:11px;padding:1px 8px;margin-top:3px">The historians &#9656;</button>'
      + '<div id="cabCCBox_' + i + '" style="display:none;margin-top:4px">' + persp
      + '<div style="margin-top:4px;font-size:10px;opacity:.6">' + _cabEsc(c.provenance || "Inferred") + (c.sources && c.sources.length ? ' &middot; ' + _cabEsc(c.sources.join("; ")) : '') + '</div></div>'
      + '</div>';
  }
  return html;
}

/* ---- presRenderCabinet OVERRIDE: the full advisor desk. ---- */
function presRenderCabinet(C) {
  if (!C) return '';
  try {
    if (typeof presInit === "function") presInit(C);
    if (typeof cabInit === "function") cabInit(C);
  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("presRenderCabinet init:", e); return '<p class="lede" style="font-size:13px">Your cabinet stands ready.</p>'; }   // D49.1 defense-in-depth
  if (!_cabData()) {
    // graceful fallback: no cabinet data -> a minimal note (should not happen post-build)
    return '<p class="lede" style="font-size:13px">Your cabinet stands ready.</p>';
  }
  var cards = "";
  for (var i = 0; i < _cabPRINCIPALS.length; i++) cards += '<div style="margin-bottom:8px">' + _cabPrincipalCard(C, _cabPRINCIPALS[i]) + '</div>';
  return ''
    + '<p class="lede" style="font-size:13px;margin-bottom:10px">Your cabinet advises you, manages the departments you entrust to them, and explains the <em>why</em> behind every recommendation. '
    + '<b>Heed</b> a secretary to act on his counsel, or <b>Delegate</b> the department to let him run it. Watch, too, for the man who serves himself before the war.</p>'
    + '<div style="display:flex;flex-direction:column;gap:0">' + cards + '</div>'
    + _cabFullRosterHTML(C)
    + _cabCrossCardHTML(C);
}

/* ===== wire ===== */

/* Apply an advisor's counsel — a modest, bounded, LOGGED, once-per-turn nudge in
   that domain (the engagement reward; numbers logged to DECISIONS D49). Mutates
   C.clock / C.warroom; clamps everything. */
function _cabHeed(C, domain) {
  if (!C || !C.president) return;
  var P = C.president, cs = P.cabinetState && P.cabinetState[domain];
  if (!cs || cs.delegated) return;
  if (cs.heededTurn === (P.turn || 0)) return;           // once per strategic turn
  var side = (C.side === "CS") ? "CS" : "US";
  var a = _cabHolder(side, domain, P.date);
  var clk = C.clock, wr = C.warroom, turn = (P.turn || 0);
  // base: heeding good counsel earns a little political capital — but at most ONCE
  // per strategic turn TOTAL (not once per domain), so cross-domain heed-stacking
  // can't flood clock.capital and swamp the 1864 reelection referendum. (D49.5, HIGH.)
  if (P.heedCapTurn !== turn) {
    if (clk && typeof clk.capital === "number") clk.capital = Math.max(0, Math.min(100, clk.capital + 1));
    P.heedCapTurn = turn;
  }
  // domain micro-effect (small, bounded; one per domain per turn via heededTurn)
  if (domain === "treasury" && clk && typeof clk.weariness === "number") clk.weariness = Math.max(0, Math.min(100, clk.weariness - 2));
  else if (domain === "war" && wr && typeof wr.supply === "number") wr.supply = Math.max(0, Math.min(100, wr.supply + 2));
  else if (domain === "state" && clk && typeof clk.intervention === "number") clk.intervention = Math.max(0, Math.min(100, clk.intervention + (side === "CS" ? 2 : -2)));
  else if (domain === "navy") {
    // the navy keeps the blockade-runners coming (CS) or the coastal depots fed (US) — D49.6
    if (side === "CS" && C.blockade && typeof C.blockade.importFactor === "number") C.blockade.importFactor = Math.min(1.1, C.blockade.importFactor + 0.02);
    else if (wr && typeof wr.supply === "number") wr.supply = Math.max(0, Math.min(100, wr.supply + 1));
  }
  cs.heededTurn = turn;
  if (typeof _pdLog === "function" && a) _pdLog(C, "You heed Secretary " + a.name + " on " + (_cabDOMAIN_LABEL[domain] || domain) + ".");
}

/* ---- presWireCabinet OVERRIDE ---- */
function presWireCabinet(C) {
  if (!C || !C.president) return;
  if (typeof cabInit === "function") cabInit(C);
  for (var i = 0; i < _cabPRINCIPALS.length; i++) {
    (function (domain) {
      var acc = document.getElementById("cabAcc_" + domain);
      if (acc) acc.addEventListener("click", function () {
        _cabHeed(C, domain);
        if (typeof saveLocal === "function") saveLocal();
        if (typeof _wdRefresh === "function") _wdRefresh();
      });
      var del = document.getElementById("cabDel_" + domain);
      if (del) del.addEventListener("click", function () {
        var cs = C.president.cabinetState[domain];
        if (cs) cs.delegated = !cs.delegated;
        if (typeof saveLocal === "function") saveLocal();
        if (typeof _wdRefresh === "function") _wdRefresh();
      });
      var why = document.getElementById("cabWhy_" + domain);
      if (why) why.addEventListener("click", function () {
        var box = document.getElementById("cabWhyBox_" + domain);
        if (box) box.style.display = (box.style.display === "none") ? "block" : "none";
      });
    })(_cabPRINCIPALS[i]);
  }
  var ft = document.getElementById("cabFullToggle");
  if (ft) ft.addEventListener("click", function () {
    var box = document.getElementById("cabFullBox");
    if (box) box.style.display = (box.style.display === "none") ? "block" : "none";
  });
  var d = _cabData();
  if (d && d.crossCards) for (var c = 0; c < d.crossCards.length; c++) {
    (function (idx) {
      var b = document.getElementById("cabCC_" + idx);
      if (b) b.addEventListener("click", function () {
        var box = document.getElementById("cabCCBox_" + idx);
        if (box) box.style.display = (box.style.display === "none") ? "block" : "none";
      });
    })(c);
  }
}
