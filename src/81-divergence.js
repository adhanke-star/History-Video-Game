/* ===========================================================================
   E1 · 81-divergence.js — "YOUR WAR vs HISTORY": the alternate-history DIVERGENCE
   LEDGER + tracker (S3, the first Phase-E increment; V1-CHECKLIST E1; DECISIONS D111).

   The strategic arc's flagship teaching payoff: a living, dated record of every
   point at which the player's war has departed from the documented historical
   record, each entry carrying its category, a divergence TIER (minor / major /
   radical — how far from the record), and the HISTORICAL counterfactual ("In
   history, …") that is the lesson. A headline DIVERGENCE INDEX measures how far
   the war has strayed. A new "Your War vs History" desk tab surfaces it.

   THE NO-THUMB-ON-THE-SCALE LAW (D54/§5): divergence is NOT "winning" and the
   index is NOT a score — it measures DISTANCE from the past, nothing more. The
   dice are never loaded toward history; the divergences are whatever the player's
   choices and battles make them. Honest, anti-Lost-Cause framing throughout.

   THE EMERGENT-ONLY TOGGLE (E1): G.settings.altHistoryEmergentOnly. When ON, the
   explicit ahistorical WILD-CARD gambits (the engineered divergences in the
   Paths-to-Victory tab) are withheld, so the war can diverge ONLY through the
   choices and battles of the campaign (emancipation timing, the recognition
   window, the 1864 election, the war's trajectory). Default OFF → the wild-card
   section renders EXACTLY as before (a single guard in 80-victory.js's
   _vicWildSection) → byte-identical.

   PURE READ-OUT — like the D106 OOB board / the D99 matchup screen: divScan reads
   only existing strategic state (C.strategy / C.president.emancipation /
   C.blockade / C.clock / C.stats) and WRITES NOTHING. No tick, no per-campaign
   state of its own (the one persisted bit — the emergent-only setting — lives in
   the global G.settings, sanitized on read). NO tactical file is touched, so the
   combat layer and all battles are byte-identical by construction. NO RNG.

   CITATION-GRADE PROSE (D111 trust boundary): the historical counterfactuals here
   (the _divWILD_HIST map + every inline "In history …" string) are human-verified
   textbook facts carrying an inline attribution — the SAME trust model as the sibling
   _vicWILDCARDS / _vicWhyText teaching prose in 80-victory.js. Inline teaching copy is
   NOT a "Verified" DATA record, so it sits outside the build-gate 4e >=2-source scan
   (which covers data/*.json). Any NEW counterfactual added here MUST carry a real
   attribution and stay anti-Lost-Cause (failures named even-handedly on both sides).

   EXTENDS: a "Your War vs History" desk tab in 30-president-shell.js (divRenderTab
   / divWireTab). Bare-name globals (G); div/_div-prefixed helpers; render NEVER
   mutates or saves; only divWireTab (the toggle handler) writes G.settings + saves.
   =========================================================================== */

var _divEsc = (typeof htmlEsc === "function") ? htmlEsc : function (s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
function _divNum(v, d) { return (typeof v === "number" && isFinite(v)) ? v : (d || 0); }

/* The emergent-only setting (global, sanitized on read — a tampered value coerces
   to a boolean). Read by divRenderTab AND by _vicWildSection (80-victory.js). */
function divEmergentOnly() { return !!(typeof G !== "undefined" && G && G.settings && G.settings.altHistoryEmergentOnly); }

/* ---- The three divergence TIERS. CVD-safe: a leading GLYPH + a WORD label carry
   the meaning, never colour alone (the colour is a redundant third channel). ---- */
var _DIV_TIERS = {
  minor:   { weight: 1, glyph: "△", word: "Minor",   col: "#9ab06a", desc: "a thread pulled loose from the record" },   // △
  major:   { weight: 3, glyph: "◆", word: "Major",   col: "#d8a44a", desc: "a real departure from what happened" },     // ◆
  radical: { weight: 6, glyph: "★", word: "Radical", col: "#e0795a", desc: "history rewritten" }                         // ★
};
function _divTier(t) { return _DIV_TIERS[t] || _DIV_TIERS.minor; }

/* Per-category display order + label. */
var _DIV_CATS = [
  ["Emancipation", "Emancipation &amp; freedom"],
  ["Foreign", "Foreign affairs"],
  ["Politics", "Northern politics"],
  ["Strategy", "The war's trajectory"],
  ["Wild Card", "Wild cards — the gambits you played"]
];

/* The counterfactual for each WILD CARD (keyed to the 80-victory.js catalog id).
   One honest, anti-Lost-Cause sentence on what actually happened. */
var _divWILD_HIST = {
  "cs-trent":        "In history the Trent Affair (Nov 1861) was defused when Lincoln released the seized envoys; Britain never went to war over it. (Howard Jones.)",
  "cs-invade-north": "In history both Northern invasions were turned back — Antietam in 1862, Gettysburg in 1863. (McPherson.)",
  "cs-cotton-inferno": "In history the 1861 'King Cotton' embargo backfired: Europe found other sources while the South forfeited its own export revenue. (Howard Jones.)",
  "cs-cleburne":     "In history Cleburne's January 1864 proposal to arm and free the enslaved was suppressed; the measure passed only in March 1865, far too late to matter. (Levine, Confederate Emancipation.)",
  "cs-repeaters":    "In history the blockade and a thin industrial base kept repeating rifles out of Confederate hands; most rebel infantry carried muzzle-loaders to the end. (McPherson.)",
  "cs-copperhead":   "In history the Northwest Conspiracy fizzled — the Copperhead risings never became armed revolt. (Weber, Copperheads.)",
  "cs-hunley":       "In history the H. L. Hunley sank twice in trials, then was lost with all hands after sinking the USS Housatonic in 1864. (standard naval histories.)",
  "cs-maximilian":   "In history Maximilian's French-backed empire in Mexico never intervened and collapsed in 1867. (standard diplomatic histories.)",
  "cs-stonewall":    "In history Jackson was wounded by his own men at Chancellorsville and died May 10, 1863. (Robertson, Stonewall Jackson.)",
  "cs-decapitation": "In history no Confederate decapitation plot succeeded; Lincoln was killed only after the war, by Booth in April 1865.",
  "cs-gold":         "In history no Confederate bonanza materialized; Richmond's finances dissolved into ruinous inflation. (McPherson.)",
  "us-hardwar":      "In history hard war came later — Sherman's March to the Sea unfolded in late 1864. (McPherson.)",
  "us-radical-emanc": "In history Lincoln moved cautiously and proclaimed emancipation only on January 1, 1863. (Foner, The Fiery Trial.)",
  "us-anaconda":     "In history the blockade tightened gradually over four years rather than in one overwhelming push. (Howard Jones.)",
  "us-repeaters":    "In history repeaters like the Spencer spread unevenly; most Union infantry still carried rifled muskets. (McPherson.)",
  "us-grant":        "In history Grant was not made general-in-chief until March 1864, after Vicksburg and Chattanooga proved him. (McPherson.)",
  "us-greenback":    "In history Jay Cooke's bond drives helped fund the war, but never as an instant firehose. (standard financial histories.)",
  "us-gatling":      "In history the Gatling gun saw only marginal Civil War use; rapid-fire arms dominated wars decades later. (standard ordnance histories.)",
  "us-russian":      "In history the Russian fleets visited New York and San Francisco in 1863 as a gesture — they never fought. (standard diplomatic histories.)",
  "us-railart":      "In history rail-mounted siege guns appeared only in limited form (notably at Petersburg) — never armored-train legions. (standard ordnance histories.)",
  "us-genstrike":    "In history Du Bois named the enslaved people's flight to Union lines a 'general strike' — a mass self-emancipation, though not the instant, total exodus imagined here. (Du Bois, Black Reconstruction.)"
};
/* A wild card's plausibility tier (80-victory.js) maps directly to a divergence tier. */
var _DIV_WILD_TIERMAP = { plausible: "minor", longshot: "major", fantastical: "radical" };

/* ---- divScan(C): the DETECTOR. Returns an array of currently-true divergence
   entries {id, cat, tier, when, title, hist}, computed PURELY from existing state.
   Reads nothing the combat layer owns; writes nothing. ---- */
function divScan(C) {
  var out = [];
  if (!C) return out;
  try {
    var side = (C.side === "CS") ? "CS" : "US";
    var S = C.strategy || {};
    var clk = C.clock || {};
    var BL = C.blockade || {};
    var P = C.president || {};
    var st = C.stats || {};
    var year = _divNum(clk.year, 0) || _divNum(P.date && P.date.year, 1861);
    var push = function (id, cat, tier, when, title, hist) { out.push({ id: id, cat: cat, tier: tier, when: when, title: title, hist: hist }); };

    // ---- EMANCIPATION (the marquee Union hinge; only the US side decides it). ----
    if (side === "US") {
      var em = P.emancipation || {};
      if (em.declined) {
        push("emanc-declined", "Emancipation", "radical", "1862–65",
          "Emancipation refused — the war stays a war for the Union alone.",
          "In history Lincoln issued the Emancipation Proclamation on January 1, 1863, recasting the war as a war against slavery and opening the army to some 180,000 Black soldiers. (McPherson; Foner.)");
      } else if (em.issued) {
        var ey = _divNum(em.year, 0);
        if (ey && ey <= 1861) {
          push("emanc-early", "Emancipation", "radical", String(ey),
            "Emancipation proclaimed in " + ey + " — abolition from the war's first year.",
            "In history Lincoln moved cautiously — revoking Frémont's and Hunter's early emancipation orders — and proclaimed emancipation only on January 1, 1863, once Antietam gave him the standing. (McPherson; Foner.)");
        } else if (ey === 1862) {
          push("emanc-1862", "Emancipation", "minor", "1862",
            "Emancipation issued in 1862 — ahead of the historical Proclamation.",
            "In history the preliminary Proclamation came September 22, 1862 and took effect January 1, 1863. (Foner.)");
        } else if (ey >= 1864) {
          // The Proclamation card has no upper year bound, so a Union can DRAG ITS FEET past 1863 —
          // a real, reachable divergence, named plainly as a Union failing (bug-hunt D111-MED).
          push("emanc-late", "Emancipation", "major", String(ey),
            "Emancipation delayed to " + ey + " — the Union freed the enslaved later than history did.",
            "In history Lincoln issued the Emancipation Proclamation on January 1, 1863, after Antietam; a Union that postponed it diverges from the record — a failure of will named as plainly as any Confederate one. (Foner; McPherson.)");
        }
        // ey === 1863 falls through with no entry — the historical date, on the record.
      }
    }

    // ---- CONFEDERATE EMANCIPATION (the player's Cleburne lever). ----
    if (side === "CS" && S.armEnslaved) {
      push("cs-arm-enslaved", "Emancipation", "radical", "1863–65",
        "The Confederacy arms and frees the enslaved — Cleburne's path taken.",
        "In history Cleburne's January 1864 proposal was suppressed and shelved; the Confederate Congress enacted a Negro Soldier Law only in March 1865, far too late, and almost no Black Confederate soldiers ever took the field. (Levine, Confederate Emancipation; Gallagher.)");
    }

    // ---- FOREIGN RECOGNITION (no European power ever recognized the Confederacy). ----
    var recog = _divNum(BL.recognition, 0);
    var foreclosed = !!BL.recognitionForeclosed;
    if (recog >= 60) {
      push("recog-achieved", "Foreign", "radical", "the war's course",
        "Europe moves toward recognizing the Confederacy.",
        "In history no European power ever recognized the Confederacy; Britain's cabinet weighed mediation in the autumn of 1862 and drew back after Antietam and the Emancipation Proclamation. (Howard Jones, Blue & Gray Diplomacy.)");
    } else if (recog >= 30 && !foreclosed && year >= 1863) {
      push("recog-open", "Foreign", "major", "1863+",
        "The recognition window stays open past Antietam.",
        "In history the September 1862 check at Antietam — and emancipation's moral turn — effectively closed Britain's recognition debate by November 1862. (Howard Jones.)");
    }

    // ---- THE 1864 ELECTION (US ONLY — Lincoln was re-elected; the war was carried to its end). ----
    // The 1864 clock resolves resolved1864/elected from the PLAYER's own home front for BOTH sides, so
    // this MUST be side-gated: a Northern election with a Lincoln counterfactual is nonsense for the CS
    // (the Confederacy held no 1864 presidential vote), and a broken Northern will is the SOUTH'S victory
    // road, not a repudiation of its own war (bug-hunt D111-HIGH).
    if (side === "US" && clk.resolved1864 && !clk.elected) {
      push("election-1864", "Politics", "radical", "Nov 1864",
        "The 1864 election repudiates the war — the peace platform prevails.",
        "In history the fall of Atlanta on September 2, 1864 transformed Northern morale; Lincoln won re-election decisively (212–21 in the Electoral College) and the war was carried to its end. (McPherson.)");
    } else if (side === "CS" && clk.resolved1864 && !clk.elected) {
      // The same clock state, read for the CS, is a Confederate home-front collapse — NOT an election.
      push("cs-homefront-breaks", "Politics", "radical", "1864–65",
        "The Confederate home front breaks — the will to continue collapses.",
        "In history the Confederacy held no 1864 presidential election: Davis was inaugurated to a single six-year term in February 1862, and no further presidential vote was ever held. The Southern home front did not vote the war away — it ground on until military collapse in the spring of 1865. (McPherson.)");
    }

    // ---- THE WAR'S TRAJECTORY (the Confederacy surrendered in the spring of 1865). ----
    if (side === "CS" && S.victoryReady === "will") {
      push("traj-cs-peace", "Strategy", "radical", "the endgame",
        "The South stands at the threshold of a negotiated peace.",
        "In history Confederate resistance collapsed in the spring of 1865 — Richmond fell April 3 and Lee surrendered at Appomattox on April 9; there was no negotiated independence. (McPherson.)");
    } else if (side === "CS" && S.victoryReady === "recognition") {
      push("traj-cs-recog", "Strategy", "radical", "the endgame",
        "Confederate independence by foreign recognition is within reach.",
        "In history independence never came; no power recognized the Confederacy, and the war ended in its unconditional collapse in April 1865. (Howard Jones; McPherson.)");
    } else if (side === "US" && year >= 1864 && (typeof vicMomentum === "function") && vicMomentum(C) < 0.28) {
      push("traj-us-falter", "Strategy", "major", "1864–65",
        "The Union war effort falters where history triumphed.",
        "In history the victories of 1864 — Atlanta, the Shenandoah, the closing vise on Lee — carried the Union to triumph in the spring of 1865. (McPherson.)");
    }

    // ---- WILD CARDS (each engaged gambit is an explicit, tiered divergence). ----
    var played = Array.isArray(S.wildsPlayed) ? S.wildsPlayed : [];
    var catalog = (typeof _vicWILDCARDS !== "undefined" && Array.isArray(_vicWILDCARDS)) ? _vicWILDCARDS : [];
    for (var i = 0; i < played.length; i++) {
      var wid = played[i];
      var card = null;
      for (var j = 0; j < catalog.length; j++) { if (catalog[j].id === wid) { card = catalog[j]; break; } }
      if (!card) continue;                                    // an unknown id (tampered save) is ignored, not faked
      var tier = _DIV_WILD_TIERMAP[card.tier] || "major";
      var when = card.yearMax ? ("by " + card.yearMax) : (card.yearMin ? (card.yearMin + "+") : "your campaign");
      var title = String(card.title || wid).replace(/&amp;/g, "&");
      var hist = _divWILD_HIST[wid] || "In history this gambit never came to pass.";
      push("wild-" + wid, "Wild Card", tier, when, title, hist);
    }
  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("divScan:", e); }
  return out;
}

/* ---- divIndex(entries): the headline DIVERGENCE INDEX (0..100) + a word + colour.
   A saturating sum of tier weights — NOT a score; a measure of distance from the
   record. Honest framing: more divergence is neither better nor worse, only further. */
function divIndex(entries) {
  var sum = 0;
  for (var i = 0; i < (entries ? entries.length : 0); i++) sum += _divTier(entries[i].tier).weight;
  var idx = Math.max(0, Math.min(100, Math.round(sum * 7)));
  var word, col;
  if (idx <= 0) { word = "On the historical track"; col = "#9ab06a"; }
  else if (idx <= 25) { word = "A few threads pulled loose"; col = "#c9c06a"; }
  else if (idx <= 55) { word = "A war drifting from the record"; col = "#d8a44a"; }
  else if (idx <= 80) { word = "Deep into alternate history"; col = "#e0795a"; }
  else { word = "A war history would not recognize"; col = "#e86a6a"; }
  return { idx: idx, word: word, col: col, count: (entries ? entries.length : 0) };
}

/* A tier chip — glyph + word + colour (triple-encoded; CVD-safe). */
function _divChip(tier) {
  var m = _divTier(tier);
  return '<span style="display:inline-block;font-size:10px;font-weight:bold;letter-spacing:.04em;color:' + m.col
    + ';border:1px solid ' + m.col + ';border-radius:3px;padding:1px 5px;white-space:nowrap">' + m.glyph + ' ' + m.word + '</span>';
}

/* ---- divRenderTab(C): the "Your War vs History" desk tab. Pure render. ---- */
function divRenderTab(C) {
  if (!C) return '<p class="lede" style="text-align:center;opacity:.7">No active campaign.</p>';
  var entries = divScan(C);
  var ix = divIndex(entries);
  var emergent = divEmergentOnly();

  var head = '<div style="font-size:17px;font-weight:bold">Your War vs History</div>'
    + '<div style="opacity:.78;font-size:12px">A living ledger of every point at which your war has left the documented record. '
    + 'This is not a score — it measures only how far you have strayed from what actually happened. The dice are never loaded toward history; the war is yours to bend.</div><hr class="rule">';

  // The divergence index panel (a bar; reduceMotion-safe — no transition/animation).
  var idxPanel = '<div style="margin:8px 0;padding:9px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.12)">'
    + '<div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:13px">Divergence from the record</b>'
    + '<span style="font-size:12px;color:' + ix.col + ';font-weight:bold">' + _divEsc(ix.word) + '</span></div>'
    + '<div role="img" aria-label="Divergence index ' + ix.idx + ' of 100 — ' + _divEsc(ix.word) + '" style="height:8px;background:rgba(0,0,0,.25);border:1px solid var(--rule);border-radius:3px;overflow:hidden;margin:5px 0">'
    + '<div style="height:100%;width:' + ix.idx + '%;background:' + ix.col + '"></div></div>'
    + '<div style="font-size:11px;opacity:.72">Index ' + ix.idx + ' / 100 · ' + ix.count + ' recorded divergence' + (ix.count === 1 ? '' : 's') + '.</div></div>';

  // The emergent-only toggle.
  var togPanel = '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:7px 0;border-bottom:1px dotted var(--rule)">'
    + '<div style="flex:1 1 auto"><b style="font-size:12px">Alternate-history gambits</b>'
    + '<div style="font-size:11px;opacity:.7">' + (emergent
        ? "Off — the wild cards are withheld; your war diverges only through the choices and battles of the campaign."
        : "On — the wild-card gambits are available on the Paths to Victory tab. Turn them off to let history bend only through play.") + '</div></div>'
    + '<button id="divEmergentToggle" type="button" class="upg" style="flex:0 0 auto" aria-label="Emergent-only mode" aria-pressed="' + (emergent ? "true" : "false") + '">'
        + (emergent ? "Enable gambits" : "Emergent only") + '</button></div>';

  // The ledger, grouped by category.
  var ledger = '';
  if (!entries.length) {
    ledger = '<div style="margin-top:10px;padding:12px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.10);font-size:12px;line-height:1.5;opacity:.85">'
      + '<b>Your war has followed the historical record so far.</b> Issue (or refuse) emancipation, court Europe, hold or break Northern resolve at the 1864 election, play a wild card, or simply win where history lost — and every divergence will be recorded here, with the history it departs from.</div>';
  } else {
    for (var ci = 0; ci < _DIV_CATS.length; ci++) {
      var catKey = _DIV_CATS[ci][0], catLabel = _DIV_CATS[ci][1];
      var rows = entries.filter(function (e) { return e.cat === catKey; });
      if (!rows.length) continue;
      rows.sort(function (a, b) { return _divTier(b.tier).weight - _divTier(a.tier).weight; });   // radical first
      ledger += '<div style="margin-top:8px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#937b55;margin-bottom:2px">' + catLabel + '</div>'; /* wcag-auditor: contrast fix from var(--rule)=#8a7350 to #937b55 for AA compliance (4.04:1 -> 4.52:1) */
      for (var ri = 0; ri < rows.length; ri++) {
        var e = rows[ri];
        ledger += '<div style="padding:7px 0;border-bottom:1px dotted var(--rule)">'
          + '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">'
          + '<b style="font-size:12px;flex:1 1 auto">' + _divEsc(e.title) + '</b>'
          + '<span style="display:flex;gap:6px;align-items:center;flex:0 0 auto">' + _divChip(e.tier) + '<span style="font-size:10px;opacity:.65">' + _divEsc(e.when) + '</span></span></div>' /* wcag-auditor: contrast fix opacity:.5->.65 for AA compliance (#e8dcc0@.5 ~4.2:1 -> @.65 ~6.3:1) */
          + '<div style="font-size:11px;opacity:.72;font-style:italic;margin-top:2px">' + _divEsc(e.hist) + '</div></div>';
      }
      ledger += '</div>';
    }
  }

  var foot = '<div style="margin-top:12px;font-size:11px;opacity:.62;line-height:1.5">'
    + 'How history actually ran is the "par," never a rail (§5): nothing here forces your war back toward it. '
    + 'A higher index is not a better war — only a stranger one. '
    + '<span style="opacity:.85">Sources: McPherson, <i>Battle Cry of Freedom</i>; Foner, <i>The Fiery Trial</i>; Howard Jones, <i>Blue &amp; Gray Diplomacy</i>; Levine, <i>Confederate Emancipation</i>. Verified history; the divergence is yours.</span></div>';

  // E1 deepening (D115): the alternate-endings section (fantastical tier) — guarded,
  // byte-identical when 83-endings.js is absent.
  var endings = (typeof endRenderSection === "function") ? endRenderSection(C) : '';

  return head + idxPanel + togPanel + ledger + endings + foot;
}

/* ---- divWireTab(C): the emergent-only toggle handler (the ONLY writer). ---- */
function divWireTab(C) {
  var b = (typeof document !== "undefined") ? document.getElementById("divEmergentToggle") : null;
  if (!b) return;
  b.addEventListener("click", function () {
    if (!G.settings || typeof G.settings !== "object") G.settings = {};
    G.settings.altHistoryEmergentOnly = !G.settings.altHistoryEmergentOnly;
    if (typeof saveLocal === "function") saveLocal();
    if (typeof _wdRefresh === "function") _wdRefresh();
  });
}
