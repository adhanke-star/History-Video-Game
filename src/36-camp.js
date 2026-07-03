/* ===========================================================================
   Q8 · 36-camp.js — THE BETWEEN-BATTLE CAMP LOOP (D94 RATING-SYSTEM §15 / D100).

   Between battles, the President drills the army he fields. This is the agency
   that GROWS your rating over the campaign — the Madden "practice/dev-trait" loop,
   over the same spine the rest of the rating system rides:

     - DRILLING: pick a focus (musketry / maneuver / entrenching / endurance) and
       drill the army. Each focus raises its own training value toward a hidden
       POTENTIAL CEILING; drilling costs FATIGUE (over-drilling saps the gains until
       the men rest). Or DELEGATE to the field officer for a steady auto-sim gain.
     - PROGRESSION: the drilled training raises the army you field (a guarded,
       bounded term in bridgeArmy), and combat seasons it (a win raises it, a bloody
       battle erodes it as green replacements dilute the veterans). The Camp tab also
       surfaces the sitting general's OVR growth (his reputation, already evolving in
       cmdOnResolve — the dev-trait the campaign earns).

   THE KEYSTONE (honors D74/D94): drilling only ever SEEDS the INPUTS the battle
   already reads (the bridge conditioning facets) — never the scoreboard. The bridge
   term is EXACTLY 0 when the army has never drilled (camp absent OR all drill 0), so
   every conditioning/bridge baseline is BYTE-IDENTICAL until the player drills. NO
   RNG anywhere (deterministic — seed-replayable). C.president.camp is plain data that
   rides the save (idempotent campInit = lazy migration; no _SAVE_VER bump).

   EXTENDS: C.president.camp; campInit in _t1InitAll (after cmdInit), campOnResolve in
   _t1Resolve (after cmdOnResolve). A "Camp" desk tab in 30/_wdRefresh. The bridge seam
   is one guarded block in 85-battle-bridge.js. Bare-name globals (G, GAME_DATA); camp/
   _camp prefix; render NEVER mutates or saves; the Wire fns + the tick do. SCOUTING
   (the tiered recon report) is the next camp increment (Q8b) — it needs the strategic
   next-battle <-> tactical-OOB mapping; deferred + logged (D100).
   =========================================================================== */

var CAMP = {
  FOCI: ["musketry", "maneuver", "entrenching", "endurance"],
  STEP: 12,            // training gained per manual drill
  CEIL: 90,            // the potential ceiling a focus can be drilled to (combat lifts a good army higher; drill alone can't make it legendary)
  DRILL_FATIGUE: 12,   // fatigue added per manual drill (the over-drill cost)
  FATIGUE_DECAY: 18,   // fatigue shed per turn of rest between battles
  DELEGATE_STEP: 5,    // auto-drill per turn when delegated to the officer (steadier, smaller, no attention)
  SEASON_WIN: 4,       // a victory seasons the army (combat XP raises every focus a touch, can exceed the drill ceiling toward 100)
  SEASON_CEIL: 100,    // the absolute ceiling once combat seasoning is included
  ATTRITION_PIVOT: 0.55, // this side's casualty SHARE (own / both-sides total) above this = "bloody" -> erodes training (green replacements dilute the veterans). A clean winner sits well below; a mauled loser well above.
  // bridge-facet lift at FULL focus (bounded — meaningful, never dominant, §27); scaled by drill/100 and the fatigue drag
  LIFT: { firepower: 8, morale: 8, supply: 8, fatigueRelief: 7, overall: 4 },
  FATIGUE_DRAG: 0.6    // at max fatigue the drill gains are dragged down by up to this fraction
};

function _campNum(v, d) { return (typeof v === "number" && isFinite(v)) ? v : d; }
var _campEsc = (typeof htmlEsc === "function") ? htmlEsc : function (s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };

/* ---- campInit: idempotent (lazy migration; D7 pattern). C.president.camp holds the per-focus drill
   training + the accumulated fatigue + the delegate flag. Registered in _t1InitAll AFTER cmdInit. ---- */
function campInit(C) {
  if (!C) return;
  if (typeof presInit === "function") presInit(C);
  if (!C.president) return;
  var P = C.president;
  if (Array.isArray(P.camp) || !P.camp || typeof P.camp !== "object") P.camp = {};
  var c = P.camp;
  if (Array.isArray(c.drill) || !c.drill || typeof c.drill !== "object") c.drill = {};
  for (var i = 0; i < CAMP.FOCI.length; i++) {
    var f = CAMP.FOCI[i], v = c.drill[f];
    c.drill[f] = (typeof v === "number" && v >= 0 && v <= CAMP.SEASON_CEIL) ? v : 0;   // sanitize (a JSON round-trip / hand edit)
  }
  if (typeof c.fatigue !== "number" || !(c.fatigue >= 0)) c.fatigue = 0;
  if (c.fatigue > 100) c.fatigue = 100;
  c.delegate = !!c.delegate;
  c.engaged = !!c.engaged;   // false until the player first drills / delegates; while false the whole loop is INERT -> a campaign that never opens the Camp is byte-identical (campOnResolve no-ops; campTrainingBonus is 0 at zero drill anyway)
}

/* the army's mean drill training (0..SEASON_CEIL) — the headline "how drilled is your army" number. */
function _campMeanDrill(C) {
  if (!C || !C.president || !C.president.camp || !C.president.camp.drill) return 0;
  var d = C.president.camp.drill, s = 0;
  for (var i = 0; i < CAMP.FOCI.length; i++) s += _campNum(d[CAMP.FOCI[i]], 0);
  return s / CAMP.FOCI.length;
}

/* ---- campTrainingBonus(C): THE BRIDGE SEAM (read by bridgeArmy). The drilled training raises the army's
   conditioning facets, bounded + scaled by drill/CEIL and dragged down by accumulated fatigue. Returns ALL
   ZEROES when the army has never drilled (camp absent OR every focus is 0 — the guard is FOCI-ONLY; fatigue
   alone never produces a bonus, since the drag only ever shrinks an already-zero lift) -> every bridge /
   conditioning baseline is BYTE-IDENTICAL until the player drills. Pure read; never writes. ---- */
function campTrainingBonus(C) {
  var z = { firepower: 0, morale: 0, supply: 0, fatigueRelief: 0, overall: 0 };
  if (!C || !C.president || !C.president.camp) return z;
  var c = C.president.camp, d = c.drill || {};
  var musk = _campNum(d.musketry, 0), man = _campNum(d.maneuver, 0), ent = _campNum(d.entrenching, 0), end = _campNum(d.endurance, 0);
  if (musk <= 0 && man <= 0 && ent <= 0 && end <= 0) return z;   // never drilled -> exact identity
  var fat = Math.max(0, Math.min(100, _campNum(c.fatigue, 0)));   // defense-in-depth vs tampered saves: negative fatigue must never push drag above 1 and amplify the capped lifts
  var drag = 1 - Math.min(CAMP.FATIGUE_DRAG, (fat / 100) * CAMP.FATIGUE_DRAG);   // over-drill fatigue saps the gains
  var cap = CAMP.SEASON_CEIL;
  z.firepower = Math.round((musk / cap) * CAMP.LIFT.firepower * drag);
  z.morale = Math.round((man / cap) * CAMP.LIFT.morale * drag);
  z.supply = Math.round((ent / cap) * CAMP.LIFT.supply * drag);
  z.fatigueRelief = Math.round((end / cap) * CAMP.LIFT.fatigueRelief * drag);
  z.overall = Math.round(((musk + man + ent + end) / (4 * cap)) * CAMP.LIFT.overall * drag);
  return z;
}

/* ---- campDrill: a manual drill of `focus` — raises that focus toward the drill ceiling and adds fatigue.
   The fatigue is the natural limiter (over-drilling drags the bonus until the men rest); no hard per-turn
   gate. Bounded/clamped. Mutates C.president.camp only; no DOM, no save. ---- */
function campDrill(C, focus) {
  if (!C || !C.president) return;
  campInit(C);
  if (CAMP.FOCI.indexOf(focus) < 0) return;
  var c = C.president.camp;
  c.engaged = true;   // the player has taken up the camp loop -> the full drill/season/attrition loop is now live
  var cur = _campNum(c.drill[focus], 0);
  if (cur < CAMP.CEIL) c.drill[focus] = Math.min(CAMP.CEIL, cur + CAMP.STEP);   // drill alone tops out at CEIL; combat seasoning carries it higher
  c.fatigue = Math.min(100, _campNum(c.fatigue, 0) + CAMP.DRILL_FATIGUE);
  if (typeof _pdLog === "function") _pdLog(C, "The army drills at " + focus + ".");
}

/* toggle delegating the drill to the field officer (a steady auto-sim gain each turn, no Presidential attention). */
function campSetDelegate(C, on) {
  if (!C || !C.president) return;
  campInit(C);
  C.president.camp.delegate = !!on;
  if (on) C.president.camp.engaged = true;   // delegating is engaging the camp loop
  if (typeof _pdLog === "function") _pdLog(C, on ? "You delegate the drilling to the field officers." : "You take personal charge of the drilling.");
}

/* ---- campOnResolve: per-turn tick (AFTER cmdOnResolve so this turn's reputation is set). Rest sheds
   fatigue; a delegated army drills itself a little; combat SEASONS the army (a win raises every focus a
   touch — combat XP — and can carry training past the drill ceiling toward SEASON_CEIL; a bloody battle
   ERODES it as green replacements dilute the veterans). Deterministic; mutates C.president.camp only. ---- */
function campOnResolve(winnerSide, type, B, C, win) {
  if (!C) return;
  campInit(C);
  try {
    var c = C.president.camp, i, f;
    if (!c.engaged) return;   // the camp loop is INERT until the player engages it -> a never-camped campaign conditions byte-identically to the pre-Q8 build
    c.fatigue = Math.max(0, _campNum(c.fatigue, 0) - CAMP.FATIGUE_DECAY);   // the men rest between battles
    // a delegated army keeps drilling on its own (steadier, smaller; tops out at the drill ceiling)
    if (c.delegate) for (i = 0; i < CAMP.FOCI.length; i++) { f = CAMP.FOCI[i]; if (_campNum(c.drill[f], 0) < CAMP.CEIL) c.drill[f] = Math.min(CAMP.CEIL, _campNum(c.drill[f], 0) + CAMP.DELEGATE_STEP); }
    // combat seasoning / attrition: a clean win seasons every focus upward (combat XP — can exceed the drill
    // ceiling toward SEASON_CEIL); a battle this army bled DISPROPORTIONATELY in erodes training (green
    // replacements dilute the veterans). The "bloody" test uses the casualty SHARE — this side's casualties
    // as a fraction of BOTH sides' total — which is UNITLESS + order-independent. (Q8 bug-hunt MED: do NOT
    // divide a raw men-count by C.manpower.strength — that is a 0-100 index, not a men count, AND it is
    // decremented by manpowerOnResolve earlier this same turn; both bugs made nearly every battle read bloody,
    // killing the win-seasons branch. The share is the clean fix: the loser's share runs high, the winner's low.)
    var side = (C.side === "CS") ? "CS" : "US", casMe = 0, casTot = 0;
    try { if (B && B.casualties) { casMe = _campNum(B.casualties[side], 0); casTot = casMe + _campNum(B.casualties[(side === "CS") ? "US" : "CS"], 0); } } catch (e) {}
    var bloody = (casTot > 0) && ((casMe / casTot) > CAMP.ATTRITION_PIVOT);   // this side took the lion's share of the day's losses
    for (i = 0; i < CAMP.FOCI.length; i++) {
      f = CAMP.FOCI[i]; var v = _campNum(c.drill[f], 0);
      if (win && winnerSide && !bloody) v = Math.min(CAMP.SEASON_CEIL, v + CAMP.SEASON_WIN);   // veterans season upward
      else if (bloody) v = Math.max(0, v - Math.round(CAMP.SEASON_WIN * 1.5));                 // green replacements dilute the drill
      c.drill[f] = v;
    }
  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("campOnResolve:", e); }
}

/* ===== render: the "Camp" desk tab ===== */

function _campGrade(v) {
  // map a 0-100 training value to the shared A-F grade vocabulary (one vocabulary across the rating system)
  if (typeof fldRatingGrade === "function") return fldRatingGrade(v);
  return { ovr: Math.round(v), letter: "", word: "", color: "#b8863b" };
}
function _campBar(label, v, max, hint) {
  v = Math.max(0, Math.min(max, Math.round(v)));
  var pct = Math.round((v / max) * 100);
  return '<div style="margin:5px 0"><div style="display:flex;justify-content:space-between;font-size:11px;opacity:.85"><span>' + _campEsc(label) + '</span><span>' + v + '</span></div>'
    + '<div style="height:7px;background:rgba(0,0,0,.25);border:1px solid var(--rule);border-radius:3px;overflow:hidden"><div style="height:100%;width:' + pct + '%;background:#7d6b4a"></div></div>'
    + (hint ? '<div style="font-size:10px;opacity:.57;margin-top:1px">' + _campEsc(hint) + '</div>' : '') + '</div>'; /* wcag-auditor: contrast fix opacity .55→.57; on card08 ground was 4.46:1 (<4.5 AA); now ≥4.53:1 on all card backgrounds */
}
function campRenderTab(C) {
  if (!C) return '';
  try { if (typeof presInit === "function") presInit(C); campInit(C); }
  catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("campRenderTab:", e); return '<p class="lede" style="font-size:13px">The camp is quiet.</p>'; }
  var c = C.president.camp;
  var mean = _campMeanDrill(C), g = _campGrade(mean);
  var fat = _campNum(c.fatigue, 0);
  var FOCUS_HINT = { musketry: "Aimed fire — raises the army's firepower.", maneuver: "Drill & coordination — steadies morale under orders.", entrenching: "The spade — keeps the works and supply in hand.", endurance: "Hard marching — the men arrive fresh (less battle fatigue)." };
  var FOCUS_LABEL = { musketry: "Musketry", maneuver: "Maneuver", entrenching: "Entrenching", endurance: "Endurance" };
  // the general's OVR growth (the dev-trait the campaign earns) — reuse the command spine, one vocabulary
  var gen = (typeof cmdActiveGeneral === "function") ? cmdActiveGeneral(C) : null;
  var genLine = "";
  if (gen && typeof _cmdGenRating === "function") {
    var ovr = Math.round(_cmdGenRating(C, gen)), gg = _campGrade(ovr);
    var rep = (typeof _cmdReputation === "function") ? Math.round(_cmdReputation(C, gen.id)) : null;
    genLine = '<div style="margin-top:12px;padding:9px 11px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.1)">'
      + '<div style="font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:#b3925e">Your commander &mdash; the record</div>'
      + '<div style="display:flex;align-items:baseline;gap:7px;margin-top:3px"><span style="font-weight:bold;font-size:15px">' + _campEsc((typeof _cmdName === "function") ? _cmdName(gen) : (gen.name || "")) + '</span>'
      + '<span aria-hidden="true" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + gg.color + '"></span>'
      + '<span style="font-size:13px"><b>' + ovr + '</b> OVR &middot; <b>' + _campEsc(gg.letter) + '</b> ' + _campEsc(gg.word) + '</span></div>'
      + (rep != null ? '<div style="font-size:11px;opacity:.7;margin-top:2px">Reputation ' + rep + ' &mdash; it rises with victory and falls with defeat; his OVR grows with the war.</div>' : '')
      + '</div>';
  }
  var drillBtns = '';
  for (var i = 0; i < CAMP.FOCI.length; i++) {
    var f = CAMP.FOCI[i], v = _campNum(c.drill[f], 0), atCeil = v >= CAMP.CEIL;
    drillBtns += '<div style="flex:1 1 230px;min-width:200px;border:1px solid var(--rule);border-radius:5px;padding:8px 10px;background:rgba(0,0,0,.08)">'
      + _campBar(FOCUS_LABEL[f], v, CAMP.SEASON_CEIL, FOCUS_HINT[f])
      + '<button id="campDrill_' + f + '" type="button" class="upg" style="font-size:11px;padding:2px 9px;margin-top:3px"' + (atCeil ? ' disabled title="At the drill ceiling — only combat seasons it higher"' : '') + '>Drill ' + FOCUS_LABEL[f] + (atCeil ? ' (drilled)' : '') + '</button>'
      + '</div>';
  }
  return ''
    + '<p class="lede" style="font-size:13px;margin-bottom:10px">Between battles you drill the army you field. Drilling sharpens the men &mdash; but tired troops drill poorly, so rest matters. A well-drilled, battle-seasoned army takes the field stronger; bleed it white and the green replacements dull its edge.</p>'
    + '<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;padding:10px 12px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.14)">'
    +   '<div style="display:inline-flex;align-items:center;gap:8px;border-left:4px solid ' + g.color + ';padding-left:9px">'
    +     '<div style="text-align:right"><div style="font-weight:bold;font-size:22px;line-height:1">' + Math.round(mean) + '</div><div style="font-size:9px;opacity:.6;letter-spacing:.06em">DRILL</div></div>'
    +     '<div><div style="font-weight:bold;font-size:14px" aria-label="grade ' + _campEsc(g.letter) + '">' + _campEsc(g.letter) + '</div><div style="font-size:10px;opacity:.78">' + _campEsc(g.word) + '</div></div>'
    +   '</div>'
    +   '<div style="flex:1 1 160px;min-width:150px">' + _campBar("Fatigue", fat, 100, fat >= 60 ? "The men are worn — let them rest before drilling more." : "Rested enough to drill.") + '</div>'
    +   '<label style="font-size:12px;display:inline-flex;align-items:center;gap:6px;cursor:pointer"><input id="campDelegate" type="checkbox"' + (c.delegate ? ' checked' : '') + '> Delegate drilling to the field officer</label>'
    + '</div>'
    + '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:12px">' + drillBtns + '</div>'
    + genLine
    + '<div style="font-size:10.5px;opacity:.57;margin-top:9px;line-height:1.4">Drilling only seeds the army you take into battle &mdash; the same conditioning the war already feeds. It never decides the result; a sharper army merely fights from a better start. (Drill tops out at ' + CAMP.CEIL + '; only blood and victory carry it higher.)</div>'; /* wcag-auditor: contrast fix opacity .55→.57; footnote on sheet #2e2816 was 4.35:1 (<4.5 AA); now ~4.58:1 */
}
function campWireTab(C) {
  if (!C || !C.president) return;
  campInit(C);
  for (var i = 0; i < CAMP.FOCI.length; i++) {
    (function (f) {
      var b = document.getElementById("campDrill_" + f);
      if (b) b.addEventListener("click", function () { campDrill(C, f); if (typeof saveLocal === "function") saveLocal(); if (typeof _wdRefresh === "function") _wdRefresh(); });
    })(CAMP.FOCI[i]);
  }
  var dg = document.getElementById("campDelegate");
  if (dg) dg.addEventListener("change", function () { campSetDelegate(C, dg.checked); if (typeof saveLocal === "function") saveLocal(); if (typeof _wdRefresh === "function") _wdRefresh(); });
}
