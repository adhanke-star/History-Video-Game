/* ===========================================================================
   S2 m2 · 32-decisions.js — CURATED EXECUTIVE DECISIONS + the pendingChoices loop
   (R3/R24/§8.27 emancipation-as-a-dated-decision · §8.62 civil-liberties dilemmas ·
   §8.68 cadence 1-2/turn, more at hinges).

   Fills the S0 `president.pendingChoices` STUB with a real, NON-BLOCKING decision
   system: each turn, curated historical decision cards whose triggers are met are
   surfaced (in the between-battles interstitial AND a desk tab); the player makes a
   real choice with honest trade-offs + teaching, or leaves it for later. The
   marquee card is EMANCIPATION — a dated Union decision (radical 1861 / historical
   1862 / never) that trades border-state loyalty against USCT manpower, foreign
   opinion, and war aims; it sets C.president.emancipation, which the manpower
   module reads to gate the USCT pool (a real wiring, not flavor).

   Data: data/decisions.json -> GAME_DATA.decisions (web-grounded, adversarially
   verified). Each card: {id, side, category, title, trigger, situation, options[],
   card}. Each option: {id, label, historicalNote, resultText, teaching, provenance,
   sources, effects[{field,delta}], sets{emancipation}}. The engine applies BOUNDED,
   clamped, LOGGED effects (numbers in the data; the applier maps field->game state).

   EXTENDS: adds C.president.decisionsResolved (id->optionId) + C.president.emancipation
   (issued/declined/date). C.president.pendingChoices (the S0 stub) becomes the live
   queue; presOnResolve no longer clears it (decOnResolve owns it). Plain data, rides
   the save, NO _SAVE_VER bump (idempotent decInit = lazy migration).

   Registered (decInit / decOnResolve) in 90-president-register.js AFTER cab. Bare-name
   globals; _dec/dec prefix; render never mutates/saves; the tick + the choose-handler do.
   =========================================================================== */

function _decData() {
  return (typeof GAME_DATA !== "undefined" && GAME_DATA && GAME_DATA.decisions) ? GAME_DATA.decisions : null;
}
function _decCards() { var d = _decData(); return (d && d.cards && d.cards.length) ? d.cards : []; }
function _decById(id) { var cs = _decCards(); for (var i = 0; i < cs.length; i++) if (cs[i] && cs[i].id === id) return cs[i]; return null; }
function _decClamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function _decEsc(s) {
  s = (s == null) ? "" : String(s);
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
/* Sanitize an id used BOTH as an element-id attribute AND a getElementById key —
   must stay in lockstep, so NOT _decEsc (whose entities would desync them). D50.11 */
function _decIdSafe(s) { return String(s == null ? "" : s).replace(/[^A-Za-z0-9_-]/g, "_"); }

/* ---- decInit: idempotent. ---- */
function decInit(C) {
  if (!C) return;
  if (typeof presInit === "function") presInit(C);
  if (!C.president) return;
  var P = C.president;
  if (!P.pendingChoices || !Array.isArray(P.pendingChoices)) P.pendingChoices = [];
  else P.pendingChoices = P.pendingChoices.filter(function (id, i, a) { return a.indexOf(id) === i; });   // D50.2: dedup (corrupt save / future double-push)
  if (!P.decisionsResolved || typeof P.decisionsResolved !== "object" || Array.isArray(P.decisionsResolved)) P.decisionsResolved = {};
  if (!P.emancipation || typeof P.emancipation !== "object" || Array.isArray(P.emancipation)) P.emancipation = { issued: false, declined: false };
}

/* A card is eligible to surface for this side, year, and resolution state. */
function _decEligible(C, c) {
  if (!c || !c.trigger) return false;
  var P = C.president, side = (C.side === "CS") ? "CS" : "US";
  var year = (P.date && typeof P.date.year === "number") ? P.date.year : 1861;
  if (c.side !== "both" && c.side !== side) return false;
  if (P.decisionsResolved && P.decisionsResolved[c.id]) return false;
  if (typeof c.trigger.earliestYear === "number" && year < c.trigger.earliestYear) return false;
  if (typeof c.trigger.latestYear === "number" && year > c.trigger.latestYear) return false;
  return true;
}

/* ---- decOnResolve: per-turn tick (AFTER presOnResolve advanced date/turn). OWNS
   the pendingChoices queue: drops resolved/expired, adds newly-eligible at the §8.68
   cadence (<=2 new non-hinge per turn; hinges always surface). ---- */
function decOnResolve(winnerSide, type, B, C, win) {
  if (!C) return;
  decInit(C);
  try {
    var P = C.president, year = (P.date && P.date.year) || 1861, cards = _decCards();
    // drop any id that is no longer ELIGIBLE (resolved / expired / wrong side / not-yet — D50.4:
    // _decEligible is the single gate, so a corrupt cross-side id can't linger in the queue)
    P.pendingChoices = P.pendingChoices.filter(function (id) {
      var c = _decById(id); return !!c && _decEligible(C, c);
    });
    var added = 0;
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      if (!_decEligible(C, c)) continue;
      if (P.pendingChoices.indexOf(c.id) >= 0) continue;
      var hinge = !!(c.trigger && c.trigger.hinge);
      if (!hinge && added >= 2) continue;                 // cadence cap on NEW non-hinge cards
      P.pendingChoices.push(c.id);
      if (!hinge) added++;
      if (typeof _pdLog === "function") _pdLog(C, "A matter awaits your decision: " + c.title + ".");
    }
  } catch (e) {}
}

/* ---- the effect applier: bounded, clamped, logged. ---- */
function _decApply(C, opt) {
  var clk = C.clock, bl = C.blockade, mp = C.manpower, P = C.president;
  // special state: emancipation as a dated decision -> read by the manpower USCT gate
  if (opt.sets && opt.sets.emancipation) {
    if (!P.emancipation || typeof P.emancipation !== "object") P.emancipation = {};
    if (opt.sets.emancipation === "issue") {
      P.emancipation.issued = true; P.emancipation.declined = false;
      P.emancipation.year = (P.date && P.date.year) || 1862; P.emancipation.month = (P.date && P.date.month) || 1;
    } else if (opt.sets.emancipation === "decline") {
      P.emancipation.declined = true; P.emancipation.issued = false;
    }
  }
  var fx = opt.effects || [];
  for (var i = 0; i < fx.length; i++) {
    var e = fx[i], d = Number(e.delta) || 0, f = e.field;
    if (f === "weariness" && clk && typeof clk.weariness === "number") clk.weariness = _decClamp(clk.weariness + d, 0, 100);
    else if ((f === "capital" || f === "borderLoyalty" || f === "legitimacy") && clk && typeof clk.capital === "number") clk.capital = Math.max(0, clk.capital + d);   // D50.8: floor-only (the clock treats capital as unbounded-above; an upper clamp would DESTROY capital)
    else if (f === "intervention" && clk && typeof clk.intervention === "number") clk.intervention = _decClamp(clk.intervention + d, 0, 100);
    else if (f === "importFactor" && bl && typeof bl.importFactor === "number") bl.importFactor = _decClamp(bl.importFactor + d, 0, 1.1);
    else if (f === "strength" && mp && typeof mp.strength === "number") mp.strength = _decClamp(mp.strength + d, 5, 100);   // D50.10: floor 5 matches the manpower module's own floor
  }
}

/* ---- decResolve: the player chooses an option. ---- */
function decResolve(C, cardId, optionId) {
  if (!C || !C.president) return;
  decInit(C);
  var P = C.president, c = _decById(cardId);
  if (!c || !Array.isArray(c.options)) return;                          // D50.9: malformed deck degrades, no throw
  if (P.decisionsResolved && P.decisionsResolved[cardId]) return;       // D50.6/.7: resolved is TERMINAL — no re-apply, no emancipation flip
  if ((P.pendingChoices || []).indexOf(cardId) < 0) return;             // only a currently-pending card can be resolved
  var opt = null;
  for (var i = 0; i < c.options.length; i++) if (c.options[i].id === optionId) opt = c.options[i];
  if (!opt) return;
  _decApply(C, opt);
  if (!P.decisionsResolved) P.decisionsResolved = {};
  P.decisionsResolved[cardId] = optionId;
  P.pendingChoices = P.pendingChoices.filter(function (id) { return id !== cardId; });
  if (typeof _pdLog === "function" && opt.resultText) _pdLog(C, opt.resultText);
}

function decPendingCount(C) {
  if (!C || !C.president) return 0;
  decInit(C);
  return (C.president.pendingChoices || []).length;
}

/* ===== render ===== */

var _decCAT_LABEL = { emancipation: "Emancipation", "civil-liberties": "Civil Liberties", "home-front": "Home Front", "war-finance": "War Finance" };

/* One option as a labelled choice button + an expandable why. `ns` namespaces the
   element ids (so the tab and the interstitial can both render the same card). */
function _decOptionHTML(card, opt, ns) {
  var oid = ns + "_" + _decIdSafe(card.id) + "_" + _decIdSafe(opt.id);
  return ''
    + '<div style="margin:6px 0;padding:7px;border:1px solid var(--rule);border-radius:4px;background:rgba(0,0,0,.1)">'
    +   '<div style="display:flex;gap:8px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap">'
    +     '<div style="flex:1 1 220px;font-size:13px;font-weight:bold">' + _decEsc(opt.label) + '</div>'
    +     '<button id="decChoose_' + oid + '" type="button" class="bigbtn" style="flex:0 0 auto;font-size:12px;padding:3px 12px">Decide</button>'
    +   '</div>'
    +   (opt.historicalNote ? '<div style="font-size:11px;opacity:.7;margin-top:3px">' + _decEsc(opt.historicalNote) + '</div>' : '')
    +   '<button id="decWhy_' + oid + '" type="button" class="upg" style="font-size:11px;padding:1px 8px;margin-top:4px">Why &#9656;</button>'
    +   '<div id="decWhyBox_' + oid + '" style="display:none;margin-top:4px;font-size:12px;opacity:.85">'
    +     _decEsc(opt.teaching || '')
    +     '<div style="margin-top:3px;font-size:10px;opacity:.6">' + _decEsc(opt.provenance || "Inferred") + (opt.sources && opt.sources.length ? ' &middot; ' + _decEsc(opt.sources.join("; ")) : '') + '</div>'
    +   '</div>'
    + '</div>';
}

/* A full decision card (situation + options + teaching). */
function _decCardHTML(C, card, ns) {
  if (!card || !Array.isArray(card.options)) return '';   // D50.9: malformed deck degrades, no throw
  var opts = "";
  for (var i = 0; i < card.options.length; i++) opts += _decOptionHTML(card, card.options[i], ns);
  var cat = _decCAT_LABEL[card.category] || card.category || "";
  var hinge = (card.trigger && card.trigger.hinge) ? '<span style="font-size:10px;color:#9c3b2e;border:1px solid #9c3b2e;border-radius:3px;padding:0 4px;margin-left:6px">&#9873; a hinge of the war</span>' : '';
  return ''
    + '<div style="margin:10px 0;padding:11px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.14)">'
    +   '<div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--rule)">' + _decEsc(cat) + hinge + '</div>'
    +   '<div style="font-size:15px;font-weight:bold;margin:2px 0">' + _decEsc(card.title) + '</div>'
    +   '<div style="font-size:13px;opacity:.9;margin-bottom:4px">' + _decEsc(card.situation) + '</div>'
    +   opts
    + '</div>';
}

/* The "Decisions" desk tab: pending cards + a resolved-history expander. */
function decRenderTab(C) {
  if (!C) return '';
  decInit(C);
  if (!_decData()) return '<p class="lede" style="font-size:13px">No matters require your decision.</p>';
  var P = C.president, pend = P.pendingChoices || [];
  var body = "";
  if (!pend.length) {
    body = '<p class="lede" style="font-size:13px;opacity:.75">No matter presently requires your decision. The work of the war goes on; the great choices will come.</p>';
  } else {
    body = '<p class="lede" style="font-size:13px;margin-bottom:4px">Matters await your decision. Each choice is yours to make &mdash; or to leave for another day.</p>';
    for (var i = 0; i < pend.length; i++) { var c = _decById(pend[i]); if (c) body += _decCardHTML(C, c, "tab"); }
  }
  // resolved history (teaching: your war vs history)
  var keys = P.decisionsResolved ? Object.keys(P.decisionsResolved) : [];
  if (keys.length) {
    var rows = "";
    for (var k = 0; k < keys.length; k++) {
      var rc = _decById(keys[k]); if (!rc || !Array.isArray(rc.options)) continue;
      var oid = P.decisionsResolved[keys[k]];
      if (typeof oid !== "string") continue;   // D50.3: drop corrupt non-string resolved values (no "[object Object]")
      var chosen = null;
      for (var o = 0; o < rc.options.length; o++) if (rc.options[o].id === oid) chosen = rc.options[o];
      rows += '<div style="font-size:12px;padding:3px 0;border-bottom:1px dotted var(--rule)"><b>' + _decEsc(rc.title) + '</b> &mdash; ' + _decEsc(chosen ? chosen.label : oid) + '</div>';
    }
    body += '<button id="decHistToggle" type="button" class="upg" style="font-size:11px;padding:2px 8px;margin-top:8px">Decisions you have made &#9656;</button>'
      + '<div id="decHistBox" style="display:none;margin-top:6px;padding:8px;border:1px solid var(--rule);border-radius:4px;background:rgba(0,0,0,.1)">' + rows + '</div>';
  }
  return body;
}

/* Wire option buttons + why-expanders for a rendered set of cards (tab or interstitial). */
function _decWireCards(C, ns, cardIds, afterChoose) {
  for (var i = 0; i < cardIds.length; i++) {
    var c = _decById(cardIds[i]); if (!c || !Array.isArray(c.options)) continue;   // D50.9
    for (var j = 0; j < c.options.length; j++) {
      (function (card, opt) {
        var oid = ns + "_" + _decIdSafe(card.id) + "_" + _decIdSafe(opt.id);
        var ch = document.getElementById("decChoose_" + oid);
        if (ch) ch.addEventListener("click", function () {
          decResolve(C, card.id, opt.id);
          if (typeof saveLocal === "function") saveLocal();
          if (typeof afterChoose === "function") afterChoose();
        });
        var why = document.getElementById("decWhy_" + oid);
        if (why) why.addEventListener("click", function () {
          var box = document.getElementById("decWhyBox_" + oid);
          if (box) box.style.display = (box.style.display === "none") ? "block" : "none";
        });
      })(c, c.options[j]);
    }
  }
}

function decWireTab(C) {
  if (!C || !C.president) return;
  decInit(C);
  _decWireCards(C, "tab", C.president.pendingChoices || [], function () { if (typeof _wdRefresh === "function") _wdRefresh(); });
  var ht = document.getElementById("decHistToggle");
  if (ht) ht.addEventListener("click", function () {
    var box = document.getElementById("decHistBox");
    if (box) box.style.display = (box.style.display === "none") ? "block" : "none";
  });
}

/* ---- the interstitial surface: the pending decisions, inline in the between-battles flow. ---- */
function decInterstitialHTML(C) {
  if (!C || !C.president) return '';
  decInit(C);
  var pend = C.president.pendingChoices || [];
  if (!pend.length) return '';
  var cards = "";
  for (var i = 0; i < pend.length; i++) { var c = _decById(pend[i]); if (c) cards += _decCardHTML(C, c, "int"); }
  return ''
    + '<div style="margin:14px auto 0;max-width:560px;text-align:left">'
    +   '<div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);text-align:center;margin-bottom:2px">Matters of State</div>'
    +   cards
    + '</div>';
}

function decWireInterstitial(C, afterChoose) {
  if (!C || !C.president) return;
  decInit(C);
  _decWireCards(C, "int", C.president.pendingChoices || [], afterChoose);
}
