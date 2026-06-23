/* ===========================================================================
   E1 · 83-endings.js — ALTERNATE ENDINGS (the alt-history RESULTS a well-played war
   earns; V1-CHECKLIST E1 deepening; DECISIONS D114 — Aaron's locked end-state catalog).

   The D111 divergence ledger records HOW your war has left the record; this layer
   records the big alternate OUTCOMES a player can drive toward when "gameplay and
   strategy are done right" (Aaron, D114) — a named alternate ENDING becomes "within
   reach" once you open its path (a wild-card gambit, an emancipation choice, or a
   reachable victory) and "reached" once your performance secures it (war momentum, a
   reachable peace, the 1864 verdict). So the ending is EARNED, not merely clicked.

   THE LABELED SPECTRUM (D114): each ending carries a TIER. This first increment ships
   the FANTASTICAL tier (Aaron's build-order pick — 4 per side), explicitly tagged
   "fantastical" so the teaching line (what really happened) always stays clear; the
   grounded plausible/longshot endings layer on in later increments. NO thumb on the
   scale (D54): an ending is distance from the record, never a "better" war.

   PURE READ-OUT — like 81-divergence.js / 82-after-action.js: endScan reads only
   existing strategic state (C.strategy / C.president.emancipation / C.blockade /
   C.clock / C.stats + vicMomentum) and WRITES NOTHING. No tick, no own state, NO
   tactical file touched -> the combat layer + all battles are byte-identical by
   construction. NO RNG.

   CITATION-GRADE PROSE (the D111 trust boundary): every counterfactual is a
   human-verified textbook fact with an inline attribution — the SAME trust model as
   _divWILD_HIST / _vicWhyText. The Confederate slave-empire ambition (the Golden
   Circle) is named HONESTLY and anti-Lost-Cause, never valorized.

   EXTENDS: a guarded section appended to divRenderTab (81-divergence.js) + a guarded
   compact line in aarRenderReport (82-after-action.js). Bare-name globals (G);
   end/_end-prefixed helpers; render NEVER mutates or saves.
   =========================================================================== */

var _endEsc = (typeof htmlEsc === "function") ? htmlEsc : function (s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
function _endNum(v, d) { return (typeof v === "number" && isFinite(v)) ? v : (d || 0); }

/* ---- state accessors (all pure reads; defensive on partial/legacy saves). ---- */
function _endMomentum(C) { return (typeof vicMomentum === "function") ? Math.max(0, Math.min(1, _endNum(vicMomentum(C), 0.5))) : 0.5; }
function _endWildPlayed(C, id) { var S = (C && C.strategy) || {}; return Array.isArray(S.wildsPlayed) && S.wildsPlayed.indexOf(id) >= 0; }
function _endRecognition(C) { var BL = (C && C.blockade) || {}; return _endNum(BL.recognition, 0); }
function _endWon(C) { var st = (C && C.stats) || {}; return _endNum(st.won, 0); }
function _endVictoryReady(C) { var S = (C && C.strategy) || {}; return S.victoryReady || null; }
function _endElected(C) { var clk = (C && C.clock) || {}; return !!(clk.resolved1864 && clk.elected); }
function _endEmancipation(C) { return (C && C.president && C.president.emancipation) || {}; }

/* ---- THE CATALOG. Each ending: {id, side, tier, title, when, opensWith,
   precond(C) [the path is OPENED], gate(C) [performance SECURES it], secureHint, hist}.
   precond && gate => "reached"; precond && !gate => "within reach". Fantastical tier
   first (D114). ---- */
var _END_CATALOG = [
  // ---------------- Confederate (fantastical) ----------------
  {
    id: "cs-british-war", side: "CS", tier: "fantastical",
    title: "A British war — the Royal Navy breaks the blockade",
    when: "1861–62", opensWith: "the Trent crisis",
    precond: function (C) { return _endWildPlayed(C, "cs-trent"); },
    gate: function (C) { return _endMomentum(C) >= 0.5 && _endRecognition(C) >= 45; },
    secureHint: "Keep winning and courting London — recognition must climb past 45 with the war going your way.",
    hist: "In history the Trent Affair (Nov 1861) was defused: Lincoln released the seized Confederate envoys, and Britain — though it reinforced Canada — never went to war over them. (Howard Jones, Blue & Gray Diplomacy.)"   // plain '&' — this DATA string is escaped through _endEsc at render (bug-hunt MED: an '&amp;' would double-escape to '&amp;amp;'); matches the 81-divergence.js _divWILD_HIST convention
  },
  {
    id: "cs-foreign-legions", side: "CS", tier: "fantastical",
    title: "Foreign legions land — Maximilian's army crosses the Rio Grande",
    when: "the war's course", opensWith: "Maximilian's legions",
    precond: function (C) { return _endWildPlayed(C, "cs-maximilian"); },
    gate: function (C) { return _endMomentum(C) >= 0.5; },
    secureHint: "Hold the war's momentum so the French gamble looks worth Napoleon III's while.",
    hist: "In history Napoleon III's puppet emperor never intervened in the American war; his Mexican empire collapsed and Maximilian was executed by Juárez's republic in 1867. (standard diplomatic histories.)"
  },
  {
    id: "cs-stonewall-lives", side: "CS", tier: "fantastical",
    title: "Stonewall lives — the Valley ghost turns the war",
    when: "1863+", opensWith: "Stonewall lives",
    precond: function (C) { return _endWildPlayed(C, "cs-stonewall"); },
    gate: function (C) { return _endMomentum(C) >= 0.5 && _endWon(C) >= 3; },
    secureHint: "Win battles with him in the field — at least three victories with the war going your way.",
    hist: "In history Jackson was shot by his own men in the dark at Chancellorsville and died of pneumonia on May 10, 1863 — the South's irreplaceable loss. (James Robertson, Stonewall Jackson.)"
  },
  {
    id: "cs-golden-circle", side: "CS", tier: "fantastical",
    title: "The Golden Circle — a slave-power empire into the Caribbean",
    when: "after independence", opensWith: "a war effectively won",
    precond: function (C) { return _endVictoryReady(C) != null; },
    gate: function (C) { return _endMomentum(C) >= 0.66; },
    secureHint: "Independence must be in hand and your war commanding — only a victorious Confederacy could look south.",
    hist: "In history the antebellum dream of a slaveholding empire in Cuba and Central America — the Knights of the Golden Circle, the Walker filibusters — died with the Confederacy itself. It is named here as the expansionist slave-power ambition it was, not as a triumph. (Robert May, The Southern Dream of a Caribbean Empire.)"
  },
  // ---------------- Union (fantastical) ----------------
  {
    id: "us-rapidfire-war", side: "US", tier: "fantastical",
    title: "The rapid-fire war — repeaters and Gatlings end it early",
    when: "the war's course", opensWith: "a repeater army or Gatling legions",
    precond: function (C) { return _endWildPlayed(C, "us-gatling") || _endWildPlayed(C, "us-repeaters"); },
    gate: function (C) { return _endMomentum(C) >= 0.5; },
    secureHint: "Press the technological edge home — keep the war going your way and the rebellion breaks fast.",
    hist: "In history the Gatling gun saw only marginal Civil War use, and Spencer repeaters spread unevenly; most infantry on both sides carried single-shot rifled muskets to the end. (standard ordnance histories.)"
  },
  {
    id: "us-russo-american", side: "US", tier: "fantastical",
    title: "A Russo-American century — the Tsar's fleet stays and fights",
    when: "1863+", opensWith: "the Russian alliance",
    precond: function (C) { return _endWildPlayed(C, "us-russian"); },
    gate: function (C) { return _endMomentum(C) >= 0.5; },
    secureHint: "Keep the war winning so the alliance is worth St. Petersburg's commitment.",
    hist: "In history the Russian fleets that wintered in New York and San Francisco in 1863 were a diplomatic gesture aimed at Britain and France — a warning, not an army. They never fought. (standard diplomatic histories.)"
  },
  {
    id: "us-lincoln-lives", side: "US", tier: "fantastical",
    title: "Lincoln lives — he leads Reconstruction himself",
    when: "1865 onward", opensWith: "emancipation + re-election + a war won",
    precond: function (C) { var em = _endEmancipation(C); return !!em.issued; },
    gate: function (C) { return _endElected(C) && _endMomentum(C) >= 0.6; },
    secureHint: "Free the enslaved, hold the home front to win the 1864 election, and carry the war — then Lincoln survives to shape the peace.",
    hist: "In history Lincoln was assassinated by John Wilkes Booth on April 14, 1865, days after Appomattox; Andrew Johnson's lenient presidency and the long unraveling of Reconstruction followed. The single greatest 'what if' of the era. (Eric Foner, Reconstruction.)"
  },
  {
    id: "us-13th-early", side: "US", tier: "fantastical",
    title: "The 13th, early — abolition written into the Constitution",
    when: "by 1863", opensWith: "an early emancipation",
    precond: function (C) { var em = _endEmancipation(C); return !!(em.issued && _endNum(em.year, 1863) <= 1862); },
    gate: function (C) { return _endMomentum(C) >= 0.5; },
    secureHint: "Hold the war and the political will so an early Proclamation can be made permanent in the Constitution.",
    hist: "In history the Thirteenth Amendment passed the House only on January 31, 1865 and was ratified that December — abolition came as the war ended, not at its start. (Foner, The Fiery Trial.)"
  }
];

/* The fantastical-tier chip (CVD-safe: glyph + word + colour). */
var _END_STATUS = {
  reached:  { glyph: "★", word: "Reached",      col: "#e0795a" },
  near:     { glyph: "◇", word: "Within reach", col: "#c9c06a" }
};
function _endChip(status) {
  var m = _END_STATUS[status] || _END_STATUS.near;
  return '<span style="display:inline-block;font-size:10px;font-weight:bold;letter-spacing:.04em;color:' + m.col
    + ';border:1px solid ' + m.col + ';border-radius:3px;padding:1px 5px;white-space:nowrap">' + m.glyph + ' ' + m.word + '</span>';
}

/* ---- endScan(C): the detector. Returns {reached:[], near:[]} for the player's side,
   each item {id, title, when, tier, hist, secureHint}. Pure read. ---- */
function endScan(C) {
  var out = { reached: [], near: [] };
  if (!C) return out;
  try {
    var side = (C.side === "CS") ? "CS" : "US";
    for (var i = 0; i < _END_CATALOG.length; i++) {
      var e = _END_CATALOG[i];
      if (e.side !== side) continue;
      var opened = false;
      try { opened = !!e.precond(C); } catch (ep) { opened = false; }
      if (!opened) continue;
      var secured = false;
      try { secured = !!e.gate(C); } catch (eg) { secured = false; }
      var item = { id: e.id, title: e.title, when: e.when, tier: e.tier, hist: e.hist, secureHint: e.secureHint, opensWith: e.opensWith };
      if (secured) out.reached.push(item); else out.near.push(item);
    }
  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("endScan:", e); }
  return out;
}

/* ---- endRenderSection(C, opts): the "Alternate Endings" section for the
   "Your War vs History" tab (opts.compact = a tight line for the after-action report). */
function endRenderSection(C, opts) {
  if (!C) return '';
  opts = opts || {};
  var sc = endScan(C);
  var nReached = sc.reached.length, nNear = sc.near.length;

  if (opts.compact) {
    if (!nReached && !nNear) return '';
    var line = nReached
      ? ('<b>' + nReached + '</b> alternate ending' + (nReached === 1 ? '' : 's') + ' reached')
      : ('<b>' + nNear + '</b> alternate ending' + (nNear === 1 ? '' : 's') + ' within reach');
    return '<div style="margin-top:8px;font-size:11px;opacity:.78">Alternate endings: ' + line
      + ' <span style="opacity:.7">(the fantastical tier &mdash; see <b>Your War vs History</b>).</span></div>';
  }

  if (!nReached && !nNear) {
    // bug-hunt LOW: side-filter the teaser examples so a player is never promised the
    // other side's endings (the rest of the feature is side-gated in endScan).
    var teaseSide = (C.side === "CS") ? "CS" : "US";
    var egs = (teaseSide === "CS")
      ? "a British war, Maximilian’s legions, Stonewall surviving, a slave-power reach into the Caribbean"
      : "repeaters and Gatlings ending the war early, the Tsar’s fleet fighting on, Lincoln living to lead Reconstruction, the 13th written in early";
    return '<hr class="rule"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#9b8560;margin-bottom:2px">Alternate endings &mdash; the fantastical tier</div>'
      + '<div style="font-size:11px;opacity:.72;line-height:1.5">Play a wild-card gambit and carry your war, and the boldest alternate outcomes &mdash; ' + egs + ' &mdash; come within reach here, each labeled <i>fantastical</i> and set beside what really happened.</div>';
  }

  var out = '<hr class="rule"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#9b8560;margin-bottom:2px">Alternate endings &mdash; the fantastical tier</div>'
    + '<div style="font-size:11px;opacity:.66;margin-bottom:3px">The boldest outcomes a well-played war can earn. Clearly <i>fantastical</i> &mdash; the history each one departs from is named below it.</div>';

  var row = function (it, status) {
    return '<div style="padding:7px 0;border-bottom:1px dotted var(--rule)">'
      + '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">'
      + '<b style="font-size:12px;flex:1 1 auto">' + _endEsc(it.title) + '</b>'
      + '<span style="display:flex;gap:6px;align-items:center;flex:0 0 auto">' + _endChip(status) + '<span style="font-size:10px;opacity:.65">' + _endEsc(it.when) + '</span></span></div>'
      + (status === "near" && it.secureHint ? '<div style="font-size:11px;opacity:.72;margin-top:2px"><b style="opacity:.8">To secure it:</b> ' + _endEsc(it.secureHint) + '</div>' : '')
      + '<div style="font-size:11px;opacity:.7;font-style:italic;margin-top:2px">' + _endEsc(it.hist) + '</div></div>';
  };
  var i;
  for (i = 0; i < sc.reached.length; i++) out += row(sc.reached[i], "reached");
  for (i = 0; i < sc.near.length; i++) out += row(sc.near[i], "near");
  return out;
}
