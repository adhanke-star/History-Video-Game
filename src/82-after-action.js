/* ===========================================================================
   E4 · 82-after-action.js — THE GRADED AFTER-ACTION REPORT (S5; V1-CHECKLIST E4;
   DECISIONS D31.6 "rich graded after-action — per-domain grades, divergence,
   casualties vs historical, citations"). The strategic arc's closing payoff.

   A period "report card" on the whole war: an A-F letter grade (the D94 scale,
   neutral 64 = C) for each domain the President actually ran — the battlefield,
   the treasury, diplomacy and the blockade, the home front and the 1864 election,
   the war's PURPOSE (emancipation for the Union; an honest accounting of the
   Confederate cause), and the high command — plus a headline overall grade, a
   read-back of the D111 DIVERGENCE LEDGER (how far your war strayed from the
   record), the human cost set against the war's true historical toll, and a
   forward-looking RECONSTRUCTION coda keyed to the choices you made.

   SURFACED TWO WAYS:
     1) a live "After-Action" President's-Desk tab (aarRenderTab) — a standing
        report card on the war so far. PURE READ-OUT: it reads strategic state
        (C.stats / C.economy / C.blockade / C.morale / C.clock / C.strategy /
        C.president.emancipation / commandLeadership) and the divergence ledger,
        and WRITES NOTHING. No tactical file touched -> byte-identical combat by
        construction. NO RNG.
     2) the war-end FINAL report — warWonScreen() is overridden (the authorized
        frozen-base override pattern, like openWarDept/openUpgrade; D30.2) so the
        end of the campaign chain shows this graded report with the Reconstruction
        coda instead of the bare base dispatch. The override reproduces the base's
        Main-Menu wiring + campaign-nullify verbatim; it adds no sim write.

   THE NO-THUMB-ON-THE-SCALE LAW (D54/D74/D92): the grades MEASURE the player's
   own war from already-resolved aggregate state. History is the "par," never a
   rail; a grade reads performance, it never edits an outcome. The Confederate
   "cause" domain is rendered as an honest, anti-Lost-Cause accounting — NOT graded
   as a virtue (slavery was the cause; that is stated plainly, in the leaders' own
   words), and it is excluded from the GPA.

   CITATION-GRADE PROSE (the D111 trust boundary): the historical anchors and the
   Reconstruction coda are human-verified textbook facts carrying inline
   attribution — the SAME trust model as the sibling _vicWhyText / _divWILD_HIST
   teaching prose. Inline teaching copy is not a "Verified" DATA record, so it sits
   outside the build-gate 4e >=2-source data scan; any NEW claim added here MUST
   carry a real attribution and stay anti-Lost-Cause (failures named even-handedly).

   EXTENDS: an "After-Action" tab in 30-president-shell.js (aarRenderTab) + the
   warWonScreen override. Bare-name globals (G); aar/_aar-prefixed helpers; render
   NEVER mutates or saves.
   =========================================================================== */

var _aarEsc = (typeof htmlEsc === "function") ? htmlEsc : function (s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
function _aarNum(v, d) { return (typeof v === "number" && isFinite(v)) ? v : (d || 0); }
function _aarClamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/* ---- The A-F report-card scale (D94: A+ >=90 "Legendary"; neutral 64 = C; no
   gaming "S"). CVD-safe: the LETTER + the WORD carry the meaning; colour is a
   redundant third channel. Returns {letter, label, col}. ---- */
function aarGrade(score) {
  var s = _aarClamp(Math.round(_aarNum(score, 64)), 0, 100);
  if (s >= 90) return { letter: "A+", label: "Legendary", col: "#7bbf6a" };
  if (s >= 80) return { letter: "A",  label: "Masterful", col: "#9ab06a" };
  if (s >= 68) return { letter: "B",  label: "Sound",     col: "#c9c06a" };
  if (s >= 56) return { letter: "C",  label: "Workmanlike", col: "#d8a44a" };
  if (s >= 44) return { letter: "D",  label: "Faltering", col: "#e0795a" };
  return { letter: "F", label: "A failure", col: "#e86a6a" };
}

/* ---- _aarDomains(C): the per-domain grades. Each entry:
   {key, label, score (0..100 or null for a non-graded honest panel), detail, note}.
   A null score is rendered as an un-lettered honest panel and excluded from the GPA.
   ALL reads are of already-resolved aggregate strategic state. ---- */
function _aarDomains(C) {
  var out = [];
  if (!C) return out;
  var side = (C.side === "CS") ? "CS" : "US";
  var st = C.stats || {};
  var clk = C.clock || {};
  var BL = C.blockade || {};
  var ec = C.economy || {};
  var P = C.president || {};
  var S = C.strategy || {};
  var battles = _aarNum(st.battles, 0), won = _aarNum(st.won, 0);
  var infl = _aarNum(st.infl, 0), suff = _aarNum(st.suff, 0);

  // 1) THE BATTLEFIELD — win-rate (primary) + the casualty exchange (secondary).
  (function () {
    var detail, score, note = "";
    if (battles <= 0) { score = 64; detail = "No battle has yet been fought."; }
    else {
      var winRate = won / battles;
      var exch = (infl + suff > 0) ? (infl / (infl + suff)) : 0.5;   // 0.5 = an even trade
      score = 100 * (0.70 * winRate + 0.30 * exch);
      detail = won + " of " + battles + " engagement" + (battles === 1 ? "" : "s") + " won.";
      note = "You inflicted roughly " + infl.toLocaleString() + " casualties and suffered " + suff.toLocaleString() + ".";
    }
    out.push({ key: "field", label: "The Battlefield", score: score, detail: detail, note: note });
  })();

  // 2) THE TREASURY & ECONOMY — the price level vs the 1861 dollar (inflation).
  (function () {
    var ip = _aarNum(ec.inflation, 1.0);
    var score = 95 - Math.max(0, (ip - 1.10)) * 42;   // ~1.1x -> A+; the CS spiral tanks it (honest)
    var x10 = Math.round(ip * 10) / 10;
    var detail = "The price level stands at about " + x10 + "× the 1861 dollar.";
    var note = (side === "CS")
      ? "The Confederate dollar's collapse was the South's quiet defeat — a thin bond market forced the printing press."
      : "Bonds and taxes carried the Union; its currency held.";
    out.push({ key: "treasury", label: "The Treasury", score: score, detail: detail, note: note });
  })();

  // 3) DIPLOMACY & THE BLOCKADE — the recognition contest, read from the player's side.
  (function () {
    var recog = _aarNum(BL.recognition, 0);
    var foreclosed = !!BL.recognitionForeclosed;
    var imp = _aarNum(BL.importFactor, 0.5);
    var score, detail, note;
    if (side === "CS") {
      score = 18 + recog * 0.80 + (imp - 0.5) * 22 + (foreclosed ? -8 : 0);
      detail = foreclosed
        ? "Europe's door has closed — recognition stands at " + Math.round(recog) + " of 100."
        : "Foreign recognition stands at " + Math.round(recog) + " of 100.";
      note = "No European power ever recognized the historical Confederacy; the autumn-1862 window closed after Antietam. (Howard Jones.)";
    } else {
      score = 72 + (foreclosed ? 14 : 0) - recog * 0.45;
      detail = foreclosed
        ? "European recognition of the rebellion has been shut out."
        : "European recognition of the rebellion stands at " + Math.round(recog) + " of 100 — a danger to be closed off.";
      note = "Keeping Britain and France neutral was a Union victory in itself; the blockade and emancipation slammed the door. (Howard Jones.)";
    }
    out.push({ key: "diplomacy", label: "Diplomacy & the Blockade", score: score, detail: detail, note: note });
  })();

  // 4) THE HOME FRONT & THE 1864 ELECTION — public will + the ballot's verdict.
  (function () {
    var pub;
    if (typeof moraleCompute === "function") { try { pub = moraleCompute(C).public; } catch (e) { pub = null; } }
    // bug-hunt (D112 LOW): moraleCompute's public-will is NaN-capable (_morClamp passes NaN through),
    // and typeof NaN === "number" — so guard on isFinite too, or a NaN poisons the score + the prose
    // ("NaN of 100") + mis-badges the graded row as the non-graded panel (the D52.6 finite discipline).
    if (typeof pub !== "number" || !isFinite(pub)) pub = _aarNum((C.morale || {}).public, 55);
    var score = pub, detail, note = "";
    if (clk.resolved1864) {
      if (clk.elected) { score = Math.min(100, score + 8); detail = "The home front held: the war was sustained at the polls in 1864."; }
      else { score = Math.max(0, score - 22); detail = (side === "US")
          ? "The home front broke: the 1864 election repudiated the war."
          : "The Northern home front broke — the road the South was counting on."; }
    } else {
      detail = "Public will stands at " + Math.round(pub) + " of 100; the 1864 verdict is not yet rendered.";
    }
    note = "The war turned as much on Northern patience as on any battlefield — Lincoln expected to lose in 1864 until Atlanta fell. (McPherson.)";
    out.push({ key: "homefront", label: "The Home Front", score: score, detail: detail, note: note });
  })();

  // 5) THE WAR'S PURPOSE — emancipation (US, graded) / an honest accounting of the
  //    Confederate cause (CS, NON-graded; excluded from the GPA; anti-Lost-Cause).
  (function () {
    if (side === "US") {
      var em = P.emancipation || {};
      var score, detail, note;
      if (em.declined) {
        score = 30;
        detail = "Emancipation refused — the war stayed a war for Union alone.";
        note = "A Union restored with slavery intact would have left the war's central question unanswered. (Foner, The Fiery Trial.)";
      } else if (em.issued) {
        var ey = _aarNum(em.year, 1863);
        if (ey <= 1862) { score = 88; detail = "Emancipation proclaimed in " + ey + " — the war became a war for freedom early."; note = "Bold, and costly: Lincoln feared losing the border states, which is why in history he waited for Antietam. (Foner.)"; }
        else if (ey === 1863) { score = 84; detail = "Emancipation proclaimed on the historical timing (1863)."; note = "The Proclamation recast the war and opened the army to some 180,000 Black soldiers. (McPherson; Foner.)"; }
        else { score = 52; detail = "Emancipation delayed to " + ey + " — freedom came later than history granted it."; note = "A Union that postponed emancipation diverged from the record — a failure of will named as plainly as any. (Foner.)"; }
      } else {
        score = 58;
        detail = "The question of emancipation still hangs over the war.";
        note = "The war's deepest stake was unresolved. (Foner, The Fiery Trial.)";
      }
      out.push({ key: "purpose", label: "Emancipation & War Aims", score: score, detail: detail, note: note });
    } else {
      // The Confederate cause: stated plainly, in the founders' own words. NOT a grade.
      var armed = !!S.armEnslaved;
      var detail = armed
        ? "The Confederacy armed and freed the enslaved — Cleburne's desperate path, a war for slavery turned against its own foundation."
        : "The Confederacy fought to preserve slavery — its leaders said so plainly.";
      var note = "Its Vice-President, Alexander Stephens, called slavery the new government's “cornerstone” (March 1861); the secession declarations of Mississippi, Texas, and others put it first. This is not graded as a virtue. (Apostles of Disunion, Dew; Battle Cry of Freedom, McPherson.)";
      out.push({ key: "purpose", label: "The Confederate Cause", score: null, detail: detail, note: note });
    }
  })();

  // 6) HIGH COMMAND — the leadership the army actually fielded (commandLeadership,
  //    which already folds in the appointed commander + the seated corps/divisions).
  (function () {
    var lead = 64;
    if (typeof commandLeadership === "function") { try { lead = _aarNum(commandLeadership(C), 64); } catch (e) { lead = 64; } }
    var score = (lead - 42) / (88 - 42) * 100;   // the bridge leadership band (~42..88) -> 0..100
    var seatNote = "";
    var cmd = P.command;
    if (cmd) {
      var corpsN = (typeof cmdCorpsSeated === "function") ? (function () { try { return cmdCorpsSeated(C).length; } catch (e) { return 0; } })() : 0;
      var divN = (typeof cmdDivSeated === "function") ? (function () { try { return cmdDivSeated(C).length; } catch (e) { return 0; } })() : 0;
      var appointed = !!cmd.fieldGeneral;
      seatNote = (appointed ? "You appointed your army commander" : "The army followed its historical commander")
        + (corpsN ? "; " + corpsN + " corps staffed" : "")
        + (divN ? ", " + divN + " division" + (divN === 1 ? "" : "s") + " staffed" : "") + ".";
    }
    out.push({ key: "command", label: "High Command", score: score, detail: "Army leadership rated " + Math.round(lead) + " of 100.", note: seatNote });
  })();

  return out;
}

/* ---- aarOverall(domains): the headline grade. The mean of the GRADED domains
   (null-scored honest panels are excluded). Returns {score, grade}. ---- */
function aarOverall(domains) {
  var sum = 0, n = 0;
  for (var i = 0; i < (domains ? domains.length : 0); i++) {
    var s = domains[i].score;
    if (typeof s === "number" && isFinite(s)) { sum += _aarClamp(s, 0, 100); n++; }
  }
  var score = n ? (sum / n) : 64;
  return { score: score, grade: aarGrade(score) };
}

/* The historical human cost, for scale (NOT a per-battle gate — a citation-grade
   anchor the player's own toll is set beside). Hacker's 2011 demographic study put
   Civil War military deaths at roughly 750,000 (above the long-standing ~620,000). */
var _AAR_HIST_DEATHS = 750000;

/* ---- _aarReconstruction(C, final): the forward-looking coda. The teaching payoff,
   keyed to the war's PURPOSE choice + its trajectory. Anti-Lost-Cause; citation-grade. */
function _aarReconstruction(C, final) {
  var side = (C && C.side === "CS") ? "CS" : "US";
  var P = (C && C.president) || {};
  var S = (C && C.strategy) || {};
  var em = P.emancipation || {};
  var lede, body;
  if (side === "US") {
    if (em.declined) {
      lede = "A Union restored — with slavery intact.";
      body = "Winning the war without emancipation would have left its deepest cause unresolved: a reunited republic still half-slave, the four million still in bondage, and the same crisis waiting to erupt again. The Union that history saved chose otherwise. (Foner, The Fiery Trial.)";
    } else if (em.issued) {
      var ey = _aarNum(em.year, 1863);
      lede = "Emancipation, then the long and unfinished struggle for its meaning.";
      body = "Emancipation opened onto the Thirteenth Amendment (ratified Dec. 6, 1865), the Fourteenth (ratified July 9, 1868), and the Fifteenth (certified March 30, 1870), then a decade of Reconstruction in which Black Americans voted, held office, and built schools and churches. Mississippi Black Codes, Klan terror, white “Redemption,” and the bargain of 1877 tore most of it down, and Jim Crow rose in its place. The war ended slavery; the fight over what freedom would mean outlived it by a century."
        + (ey >= 1864 ? " That you came to emancipation late only lengthened the road." : "")
        + " (Foner, Reconstruction: America’s Unfinished Revolution.)";
    } else {
      lede = "The reckoning still to come.";
      body = "Whether this war becomes a war for freedom — and what Reconstruction follows — turns on the question of emancipation still before you. (Foner, The Fiery Trial.)";
    }
  } else {
    if (S.victoryReady === "will" || S.victoryReady === "recognition") {
      lede = "An independent Confederacy — founded to keep human beings in bondage.";
      body = "A South that won its independence would have done so as a slaveholding republic; the four million enslaved would have remained enslaved, their freedom deferred to some unknowable later reckoning."
        + (S.armEnslaved ? " Even the late, desperate decision to arm and free some of the enslaved could not undo the contradiction at the new nation's foundation." : "")
        + " This is the cost the alternate history asks you to weigh. (Levine, Confederate Emancipation; Foner.)";
    } else {
      lede = "The Confederacy collapses — and slavery dies with it.";
      body = "In history the Confederate bid for a slaveholding nation ended in unconditional defeat in the spring of 1865, and with it slavery itself; what followed was the long, contested, and ultimately betrayed struggle of Reconstruction, from the 1865-1870 amendments through Black Codes, Klan terror, and the Lost Cause's manufacture of memory. (Foner, Reconstruction; Blight, Race and Reunion.)";
    }
  }
  var head = final ? "The Reconstruction to Come" : "The Reckoning Ahead";
  return '<div style="margin-top:12px;padding:11px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.12)">'
    + '<div style="font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:#9b8560;margin-bottom:3px">' + head + '</div>' /* wcag-auditor: contrast fix from #937b55 to #9b8560 for AA compliance (4.42:1 -> 5.07:1 on #211a12) */
    + '<div style="font-size:13px;font-weight:bold;margin-bottom:3px">' + _aarEsc(lede) + '</div>'
    + '<div style="font-size:11.5px;line-height:1.55;opacity:.86">' + _aarEsc(body) + '</div></div>';
}

/* A grade chip: big letter + word + colour (triple-encoded; CVD-safe). */
function _aarGradeChip(grade, big) {
  var sz = big ? "22px" : "15px", pad = big ? "3px 11px" : "1px 7px";
  return '<span style="display:inline-flex;align-items:baseline;gap:6px">'
    + '<span style="font-size:' + sz + ';font-weight:bold;color:' + grade.col + ';border:2px solid ' + grade.col + ';border-radius:5px;padding:' + pad + ';line-height:1">' + grade.letter + '</span>'
    + '<span style="font-size:11px;color:' + grade.col + ';font-weight:bold">' + grade.label + '</span></span>';
}

/* One domain row — the label, the grade (or an honest non-graded tag), the detail. */
function _aarDomainRow(d) {
  var graded = (typeof d.score === "number" && isFinite(d.score));
  var right = graded ? _aarGradeChip(aarGrade(d.score), false)
    : '<span style="font-size:10px;font-weight:bold;letter-spacing:.04em;color:#cbb27a;border:1px solid #cbb27a;border-radius:3px;padding:1px 6px;white-space:nowrap">An honest accounting</span>';
  return '<div style="padding:8px 0;border-bottom:1px dotted var(--rule)">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px">'
    + '<b style="font-size:12.5px">' + _aarEsc(d.label) + '</b>' + right + '</div>'
    + '<div style="font-size:11.5px;opacity:.82;margin-top:2px">' + _aarEsc(d.detail) + '</div>'
    + (d.note ? '<div style="font-size:10.5px;opacity:.6;font-style:italic;margin-top:1px">' + _aarEsc(d.note) + '</div>' : '')
    + '</div>';
}

/* ---- aarRenderReport(C, opts): the full graded report. opts.final reframes it as
   the war-end final dispatch. Pure render. ---- */
function aarRenderReport(C, opts) {
  if (!C) return '<p class="lede" style="text-align:center;opacity:.7">No active campaign to report on.</p>';
  opts = opts || {};
  var final = !!opts.final;
  var side = (C.side === "CS") ? "CS" : "US";
  var sideLabel = (side === "CS") ? "Confederate" : "Union";
  var domains = _aarDomains(C);
  var ov = aarOverall(domains);

  var title = final ? "The War's Final Reckoning" : "After-Action — The War So Far";
  var sub = final ? (sideLabel + " Campaign — the graded record of your war")
                  : (sideLabel + " Campaign — a standing report card on the war you are waging");
  var head = '<div style="font-size:17px;font-weight:bold">' + title + '</div>'
    + '<div style="opacity:.78;font-size:12px">' + sub + '. These grades measure <i>your</i> war — they read what you did; they never bent an outcome. History is the par, never a rail (§5).</div><hr class="rule">';

  // The headline overall grade.
  var overallPanel = '<div style="margin:8px 0;padding:11px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.14);display:flex;justify-content:space-between;align-items:center;gap:12px">'
    + '<div><div style="font-size:11px;text-transform:uppercase;letter-spacing:.07em;opacity:.7">Overall conduct of the war</div>'
    + '<div style="font-size:11px;opacity:.62;margin-top:2px">Across ' + domains.filter(function (d) { return typeof d.score === "number" && isFinite(d.score); }).length + ' graded domains.</div></div>'
    + _aarGradeChip(ov.grade, true) + '</div>';

  // The per-domain report card.
  var card = '<div style="margin-top:6px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#9b8560;margin-bottom:2px">The report card</div>'; /* wcag-auditor: contrast fix from #937b55 to #9b8560 for AA compliance (4.42:1 -> 5.07:1 on #211a12) */
  for (var i = 0; i < domains.length; i++) card += _aarDomainRow(domains[i]);
  card += '</div>';

  // The divergence read-back (the D111 ledger, in brief).
  var divPanel = '';
  if (typeof divScan === "function" && typeof divIndex === "function") {
    try {
      var entries = divScan(C);
      var ix = divIndex(entries);
      var lines = '';
      if (entries.length) {
        var top = entries.slice().sort(function (a, b) {
          var wa = (typeof _divTier === "function") ? _divTier(a.tier).weight : 1;
          var wb = (typeof _divTier === "function") ? _divTier(b.tier).weight : 1;
          return wb - wa;
        }).slice(0, 4);
        for (var k = 0; k < top.length; k++) lines += '<li style="margin:2px 0">' + _aarEsc(top[k].title) + '</li>';
      }
      divPanel = '<div style="margin-top:10px;padding:10px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.10)">'
        + '<div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:12.5px">Your war vs history</b>'
        + '<span style="font-size:11.5px;color:' + ix.col + ';font-weight:bold">' + _aarEsc(ix.word) + '</span></div>'
        + '<div style="font-size:11px;opacity:.72;margin-top:1px">Divergence index ' + ix.idx + " / 100 · " + ix.count + ' recorded divergence' + (ix.count === 1 ? '' : 's') + '.'
        + (entries.length ? ' See the <b>Your War vs History</b> tab for the full ledger and the history each entry departs from.' : ' Your war has so far followed the documented record.') + '</div>'
        + (lines ? '<ul style="margin:6px 0 0;padding-left:18px;font-size:11px;opacity:.82">' + lines + '</ul>' : '')
        + ((typeof endRenderSection === "function") ? endRenderSection(C, { compact: true }) : '')   // E1 (D115): alternate endings reached/within reach
        + '</div>';
    } catch (e) { divPanel = ''; }
  }

  // D151 + D400 WAR_CAREER_AAR_SEAM_V1: one guarded core composition seam.
  // Explicit v1 careers receive the nonqualifying War Career report; every legacy
  // Journey keeps the shipped Soldier's Story report unchanged.
  var soldierPanel = '';
  var isWarCareer = !!(C && C.loot && C.loot.journey && C.loot.journey.careerVersion === 1);
  if (isWarCareer && typeof warCareerReportHTML === "function") {
    try { soldierPanel = warCareerReportHTML(C, { compact: final }); } catch (e) { soldierPanel = ''; }
  } else if (typeof ssJourneyReportHTML === "function") {
    try { soldierPanel = ssJourneyReportHTML(C, { compact: final }); } catch (e2) { soldierPanel = ''; }
  }

  // The human cost, set beside the war's true historical toll.
  var st = C.stats || {};
  var ownToll = _aarNum(st.suff, 0);
  var costPanel = '<div style="margin-top:10px;font-size:11px;opacity:.74;line-height:1.5">'
    + 'The war you waged cost your side roughly <b>' + ownToll.toLocaleString() + '</b> men fallen, wounded, or lost. '
    + 'The real Civil War killed about <b>' + _AAR_HIST_DEATHS.toLocaleString() + '</b> soldiers, North and South — for decades counted at 620,000, revised upward by demographic study. '
    + '<span style="opacity:.85">(Hacker, 2011; McPherson.)</span></div>';

  // The Reconstruction / reckoning coda.
  var coda = _aarReconstruction(C, final);

  var foot = '<div style="margin-top:12px;font-size:10.5px;opacity:.6;line-height:1.5">'
    + 'Sources: McPherson, <i>Battle Cry of Freedom</i>; Foner, <i>Reconstruction</i> &amp; <i>The Fiery Trial</i>; Howard Jones, <i>Blue &amp; Gray Diplomacy</i>; Dew, <i>Apostles of Disunion</i>; Hacker (2011). A grade reads your war; it never wrote it.</div>';

  // GEA-02 (D434): accessible plain-text export controls rendered OVER the already-built report.
  // The export bar sits OUTSIDE .aarReportRoot so the exported text never includes the controls
  // themselves; context data (side / live-final / battles / Ironman) is captured at render time
  // because warWonScreen nullifies G.campaign after rendering. Pure presentation — no grade,
  // history, save, or simulation read/write beyond this render.
  var exportBar = _aarExportBar(C, final, sideLabel);
  return '<div class="aarReportWrap"><div class="aarReportRoot">' + head + overallPanel + card + divPanel + soldierPanel + costPanel + coda + foot + '</div>' + exportBar + '</div>';
}

/* ---- GEA-02 (D434): Copy Report / Download Text over the rendered report. ---- */
var _AAR_BTN_STYLE = 'font-size:12px;padding:6px 12px;border:1px solid var(--rule);border-radius:4px;background:rgba(0,0,0,.14);color:inherit;cursor:pointer';
function _aarExportBar(C, final, sideLabel) {
  var st = (C && C.stats) || {};
  var battles = _aarNum(st.battles, 0);
  var iron = !!(C && C.iron);
  return '<div class="aarExport" role="group" aria-label="Share this report"'
    + ' data-side="' + _aarEsc(sideLabel) + '" data-final="' + (final ? '1' : '0') + '"'
    + ' data-battles="' + battles + '" data-iron="' + (iron ? '1' : '0') + '"'
    + ' style="margin-top:10px;padding-top:8px;border-top:1px dotted var(--rule);display:flex;gap:8px;align-items:center;flex-wrap:wrap">'
    + '<button type="button" class="aarCopyBtn" style="' + _AAR_BTN_STYLE + '">Copy Report</button>'
    + '<button type="button" class="aarDlBtn" style="' + _AAR_BTN_STYLE + '">Download Text</button>'
    // GEA-14 (D451): the Session Packet button rides this bar behind a typeof guard — "" when
    // the module is absent, so the bar and its GEA-02 teeth are byte-identical without it.
    + ((typeof spPacketButtonHtml === "function") ? spPacketButtonHtml() : "")
    + '<span class="aarExportStatus" role="status" aria-live="polite" style="font-size:11px;opacity:.8"></span>'
    + '</div>';
}

/* Build the plain-text export: a context header + the rendered report's visible text.
   Reading the DOM (innerText) keeps the export WYSIWYG with the report the player sees and
   excludes secrets by construction (the report surface renders none; device-local cw_llm_* keys
   are never part of it). User-entered names arrive as plain text via innerText. */
function _aarExportBuildText(bar, root) {
  var d = bar.dataset || {};
  var head = 'THE CIVIL WAR - AFTER-ACTION REPORT (plain-text export)\n'
    + 'Side: ' + (d.side || 'Union') + ' | Status: ' + (d.final === '1' ? 'Final (war concluded)' : 'Live campaign')
    + ' | Battles fought: ' + (d.battles || '0') + ' | Ironman: ' + (d.iron === '1' ? 'On' : 'Off') + '\n'
    + '----------------------------------------\n\n';
  var body = (root && root.innerText) ? root.innerText : '';
  return head + body.replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

/* Legacy clipboard path (file:// and other non-secure contexts have no navigator.clipboard). */
function _aarCopyLegacy(text) {
  try {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.left = '-9999px';
    document.body.appendChild(ta); ta.select();
    var ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return !!ok;
  } catch (e) { return false; }
}

function _aarExportStatus(bar, msg) {
  var s = bar.querySelector('.aarExportStatus');
  if (s) s.textContent = msg;
}

function _aarExportHandle(e) {
  var t = e.target;
  var btn = (t && t.closest) ? t.closest('.aarCopyBtn,.aarDlBtn') : null;
  if (!btn) return;
  var bar = btn.closest('.aarExport');
  var wrap = btn.closest('.aarReportWrap');
  var root = wrap ? wrap.querySelector('.aarReportRoot') : null;
  if (!bar || !root) return;
  var text = _aarExportBuildText(bar, root);
  if (btn.classList.contains('aarCopyBtn')) {
    var doneCopy = function (ok) {
      _aarExportStatus(bar, ok ? 'Report copied to the clipboard.'
        : 'Copy failed - your browser blocked clipboard access. Use Download Text instead.');
    };
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { doneCopy(true); }, function () { doneCopy(_aarCopyLegacy(text)); });
    } else { doneCopy(_aarCopyLegacy(text)); }
  } else {
    var d = bar.dataset || {};
    var fname = 'civil-war-aar-' + (d.side === 'Confederate' ? 'confederate' : 'union') + (d.final === '1' ? '-final' : '-live') + '.txt';
    var ok = false;
    try {
      var blob = new Blob([text], { type: 'text/plain' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = fname;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { try { URL.revokeObjectURL(url); } catch (e2) {} }, 1000);
      ok = true;
    } catch (e3) { ok = false; }
    _aarExportStatus(bar, ok ? 'Report downloaded as ' + fname + '.' : 'Download failed - your browser blocked the file save. Use Copy Report instead.');
  }
}

/* One delegated document-level listener: the report renders into different containers (the desk
   tab, the war-end sheet) via innerHTML, so per-render wiring would be racy; delegation survives
   every re-render and duplicate-render. Wired once at load. */
var _aarExportWired = false;
if (typeof document !== 'undefined' && !_aarExportWired) {
  document.addEventListener('click', _aarExportHandle);
  _aarExportWired = true;
}

/* ---- aarRenderTab(C): the live "After-Action" desk tab (the war so far). ---- */
function aarRenderTab(C) {
  if (!C) return '<p class="lede" style="text-align:center;opacity:.7">No active campaign.</p>';
  return aarRenderReport(C, { final: false });
}

/* ---- E4-i2 (D119): the STRATEGIC war-END. A reached `victoryReady` (a negotiated
   peace / a recognized independence) can CONCLUDE the war through the same graded
   warWonScreen report — a victory that did NOT complete the battle chain. Surfaced as
   a non-forced OFFER on the between-battles interstitial (20-president-render.js /
   30-president-shell.js). Side-correct: "will" (the enemy's resolve breaks) is a victory
   for EITHER side; "recognition" (Europe recognizes the Confederacy) is a CS-ONLY path —
   the Union does not win by the South gaining recognition. PURE READ + the existing
   warWonScreen; no sim write, no combat path reads any of this. NO save state (the
   reason is a transient one-shot). ---- */
var _aarEndReason = null;   // transient: set by aarConcludeWar, read+cleared by warWonScreen (null = chain-completion military victory)

/* The reason a strategic war-end is OFFERABLE this turn, or null. */
function aarStrategicEndAvailable(C) {
  if (!C || !C.strategy) return null;
  var vr = C.strategy.victoryReady;
  if (vr === "will") return "will";                                  // the enemy sues for terms — either side
  if (vr === "recognition" && C.side === "CS") return "recognition"; // CS-only (the Union does not win by the South's recognition)
  return null;
}

/* Side-aware framing for a strategic conclusion (the war-end screen + the offer copy). */
function _aarEndFraming(C, reason) {
  var side = (C && C.side === "CS") ? "CS" : "US";
  var sideLabel = (side === "CS") ? "Confederate" : "Union";
  if (reason === "will") {
    return {
      title: "A Negotiated Peace",
      subtitle: sideLabel + " Campaign &mdash; The Guns Fall Silent",
      verdict: (side === "CS")
        ? "Northern resolve breaks &mdash; Washington consents to let the South go."
        : "The rebellion's resolve breaks &mdash; the Confederacy lays down its arms.",
      offerLine: (side === "CS")
        ? "Northern will has broken. You may conclude the war now, on terms of Confederate independence &mdash; or fight on."
        : "The rebellion's will has broken. You may conclude the war now and end the rebellion &mdash; or fight on for an unconditional victory.",
      offerBtn: "Conclude the war &mdash; accept the peace"
    };
  }
  if (reason === "recognition") {   // CS-only (gated in aarStrategicEndAvailable)
    return {
      title: "Recognized Independence",
      subtitle: sideLabel + " Campaign &mdash; Independence Won",
      verdict: "A European power recognizes the Confederacy &mdash; the blockade is broken and the war is brought to a close.",
      offerLine: "A European power stands ready to recognize the Confederacy. You may conclude the war now, on terms of independence &mdash; or fight on.",
      offerBtn: "Conclude the war &mdash; claim independence"
    };
  }
  return { title: "The War is Won", subtitle: sideLabel + " Campaign &mdash; Final Dispatch", verdict: "Victory!", offerLine: "", offerBtn: "" };
}

/* The between-battles OFFER (or null): {reason, line, btn}. Read by _pdInterstitialHTML. */
function aarStrategicEndOffer(C) {
  var reason = aarStrategicEndAvailable(C);
  if (!reason) return null;
  var f = _aarEndFraming(C, reason);
  return { reason: reason, line: f.offerLine, btn: f.offerBtn };
}

/* Conclude the war by a strategic path — frame it, then fire the graded final report. */
function aarConcludeWar(reason) {
  _aarEndReason = (reason === "will" || reason === "recognition") ? reason : null;
  if (typeof warWonScreen === "function") warWonScreen();
}

/* ---- warWonScreen OVERRIDE (the authorized frozen-base override; D30.2) ----
   The end of the campaign chain now shows the graded FINAL report (with the
   Reconstruction coda) instead of the bare base dispatch. The Main-Menu wiring +
   campaign-nullify are reproduced VERBATIM from the base (base ~2781-2839); the
   override adds no sim write and is byte-identical to the base everywhere the base
   path is not the war-won screen (Classic never calls it). E4-i2 (D119): when reached
   via a strategic conclusion (aarConcludeWar sets _aarEndReason), the title/verdict
   frame the negotiated peace / recognized independence; at chain completion the reason
   is null -> the byte-identical "The War is Won / Victory!" framing (D112). ---- */
function warWonScreen() {
  var C = G.campaign;
  if (!C) { _aarEndReason = null; return; }   // bug-hunt LOW (D119): clear the one-shot even on the null guard (defensive — a stale reason must never mis-frame a later war-end)
  // bug-hunt LOW (D119): the strategic-conclude exit (aarConcludeWar) bypasses openUpgrade's `_pdTurnAck=false` reset; clear it at the single war-end chokepoint so the NEXT campaign surfaces its first strategic interstitial (chain completion already clears it via the prior interstitial — idempotent here).
  if (typeof _pdTurnAck !== "undefined") _pdTurnAck = false;
  var reason = _aarEndReason; _aarEndReason = null;   // E4-i2: one-shot strategic-conclusion framing (null = chain completion)
  var fr = _aarEndFraming(C, reason);
  var report = aarRenderReport(C, { final: true });
  var html =
    '<h1 class="title-xl" style="text-align:center">' + fr.title + '</h1>' +
    '<p class="title-sub" style="text-align:center">' + fr.subtitle + '</p>' +
    '<hr class="rule">' +
    '<div class="verdict win">' + fr.verdict + '</div>' +
    '<hr class="rule">' +
    '<div id="wwReport">' + report + '</div>' +
    '<div class="btn-row" style="margin-top:14px">' +
      '<button id="wwMainMenu" type="button" class="bigbtn">Main Menu</button>' +
    '</div>';

  if (typeof openSheet === "function") {
    openSheet(html);
  } else {
    var pad = document.getElementById("sheetPad");
    var ov = document.getElementById("overlay");
    if (pad) pad.innerHTML = html;
    if (ov) ov.classList.remove("hidden");
  }

  var btnMenu = document.getElementById("wwMainMenu");
  if (btnMenu) {
    btnMenu.addEventListener("click", function () {
      if (typeof openMainMenu === "function") { openMainMenu(); }
      else if (typeof closeSheet === "function") { closeSheet(); }
    });
  }

  // Nullify campaign so a fresh game starts clean (base behavior, preserved).
  G.campaign = null;
}
