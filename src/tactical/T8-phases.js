/* ============================================================================
   src/tactical/T8-phases.js  —  TACTICAL ENGINE · PHASE C (MULTI-PHASE BATTLES)

   The NEW gated engine capability for the MULTI-PHASE epics (DECISIONS D74 #2):
   a single scenario runs as SEQUENTIAL phases, each a sub-battle on a fresh sector
   with its own objective / OOB / terrain / commanders / doctrine / reinforcements.
   When a phase is DECIDED (its objective resolves — hold / timeout / destroy), the
   next phase opens on a fresh sector; the running CASUALTY tally + the per-phase
   results carry forward; the overall battle is scored across phases. Built for
   Antietam (the Cornfield -> the Sunken Road "Bloody Lane" -> Burnside's Bridge).

   ARCHITECTURE (the design, .tmp/B-antietam-multiphase-design.md):
   - DISCRETE SEQUENTIAL SUB-BATTLES (not one cluttered field): each phase has its own
     sector/OOB/objective fought to decision; an inter-phase transition card; the next
     phase loads fresh. Cleaner teaching (each phase = a distinct lesson) + the perf floor.
   - CARRY-OVER = the running casualty tally + the per-phase score/results. Antietam's
     phases are DIFFERENT troops in DIFFERENT places, so each spawns fresh; the cumulative
     casualties + the score carry (D74 "carrying forward survivors/casualty + running result").
   - SCORING = a weighted aggregate with a real DRAW band, so Antietam's historical TACTICAL
     DRAW / marginal-Union-strategic-check EMERGES (win the Cornfield, lose the Bridge).
   - PER-PHASE scenData VIEW: a phase's leaders/supply/objective are spliced onto a copy of
     the top-level scenario, so the officers (T3) + logistics (T4) layers build the phase's
     cast/trains with ZERO change to those modules (they read __FIELD.scenData.leaders/.supply).

   GATING / BYTE-IDENTITY: ALL of this is reached only when __FIELD.phases is set (a scenario
   declaring a data.phases[] block). fldInitSim clears __FIELD.phases = null every launch, and
   fldScenarioInit only routes here when data.phases exists -> the single-objective path
   (Bull Run / Fredericksburg / the sandbox / skirmishes) is byte-identical (no phases -> the
   fldCheckVictory intercept, the HUD label, and the end-screen seam are all no-ops). The
   headless stepper (fldStepN) auto-advances phases (no UI) so probes run a full multi-phase
   battle deterministically; in real play the inter-phase card gates the advance.

   Bare-name globals (G, __FIELD, FLD, document, the fld* helpers from T0/T1/T3). All helpers
   uniquely prefixed + defined once. No literal comment-closer inside this block.
   ============================================================================ */

/* the T1 fldScenarioInit route (called when data.phases exists). Builds phase 0 + the running
   tally; returns true (fldScenarioInit early-returns on a populated scenario). */
function _fldScenarioInitPhased(opts, data) {
  __FIELD._scenTop = data;                 // the WHOLE scenario (UI: name/date/blurb/teaching/endNote/sides/brief)
  __FIELD.autoBoth = !!opts.autoBoth;
  __FIELD.phases = data.phases;
  __FIELD.phaseIdx = 0;
  __FIELD.phaseScore = { US: 0, CS: 0 };   // weighted per-phase points
  __FIELD.phaseLog = [];                   // [{idx,name,winner,winBy,usCas,csCas}]
  __FIELD.battleCas = { US: 0, CS: 0 };    // cumulative casualties across phases
  // top-level fog default (like the single-objective path) — only fills an UNSET fog
  if (!__FIELD._fogSpecified && data.defaultFog) __FIELD.fog = true;
  _fldBuildPhase(0);                       // sets terrain/objective/oob/reinforce/doctrine + fldResetRun
  return true;
}

/* a per-phase scenData VIEW: the top-level scenario with the phase's leaders/supply/objective
   spliced in, so the officers/logistics layers (which read __FIELD.scenData.leaders/.supply) build
   the phase's cast/trains, while the UI keeps the top-level name/date/blurb/teaching/endNote. */
function _fldPhaseView(top, p) {
  var v = {}, k;
  for (k in top) if (Object.prototype.hasOwnProperty.call(top, k)) v[k] = top[k];
  if (p.leaders) v.leaders = p.leaders;
  if (p.supply) v.supply = p.supply;
  if (p.objective) v.objective = p.objective;
  v._phase = p;                            // a back-reference (the inter-phase card / HUD read it)
  return v;
}

/* build phase i: terrain/objective/win-thresholds/attacker/defender/doctrine + the OOB + the
   reinforcement schedule, then fldResetRun (which rebuilds officers + trains from the phase view). */
function _fldBuildPhase(i) {
  var top = __FIELD._scenTop, p = top.phases[i]; if (!p) return;
  __FIELD.scenData = _fldPhaseView(top, p);
  __FIELD.terrain = p.terrain || top.terrain || {};
  __FIELD.objective = { x: p.objective.x, z: p.objective.z, r: p.objective.r, name: p.objective.name };
  __FIELD.holdToWin = p.holdToWinSec || top.holdToWinSec || FLD.HOLD_TO_WIN;
  __FIELD.timeLimit = p.timeLimitSec || top.timeLimitSec || FLD.TIME_LIMIT;
  __FIELD.attacker = p.attacker || top.attacker || "US";
  __FIELD.defender = p.defender || top.defender || "CS";
  __FIELD._atkCautious = (p.assaultDoctrine === "cautious");
  if (typeof p.defaultFog === "boolean" && !__FIELD._fogSpecified) __FIELD.fog = p.defaultFog;   // a phase may set its own fog (else inherit)
  var units = [], us = (p.oob && p.oob.US) || [], cs = (p.oob && p.oob.CS) || [], k;
  for (k = 0; k < us.length; k++) units.push(fldMakeUnit(fldBrSpec(us[k], "US", __FIELD.autoBoth)));
  for (k = 0; k < cs.length; k++) units.push(fldMakeUnit(fldBrSpec(cs[k], "CS", __FIELD.autoBoth)));
  __FIELD.units = units;
  var sched = [], rs = p.reinforcements || [];
  for (k = 0; k < rs.length; k++) sched.push({ atSec: rs[k].atSec, spec: fldBrSpec(rs[k], rs[k].side, __FIELD.autoBoth), done: false });
  sched.sort(function (a, b) { return a.atSec - b.atSec; });
  __FIELD.reinforce = sched;
  fldResetRun();   // resets t/holdSecs/winner/phase=deploy + rebuilds officers (phase cast) + trains (phase supply)
}

/* the per-side casualties of the CURRENT phase (committed force = the units that spawned this
   phase; their maxMen minus the survivors' men). Pending (un-arrived) reinforcements aren't counted. */
function _fldSidePhaseCas(side) {
  var fielded = 0, surv = 0, i, U = __FIELD.units;
  for (i = 0; i < U.length; i++) { var u = U[i]; if (u.side !== side) continue; fielded += (u.maxMen || 0); if (u.alive) surv += u.men; }
  return Math.max(0, Math.round(fielded - surv));
}

/* the aggregate battle winner from the weighted phase score, with a DRAW band (a tight split is
   the historical tactical draw). Called when the LAST phase resolves. */
function _fldBattleWinner() {
  var us = __FIELD.phaseScore.US, cs = __FIELD.phaseScore.CS, diff = us - cs;
  if (Math.abs(diff) < 0.5) return "draw";
  return diff > 0 ? "US" : "CS";
}

/* the fldCheckVictory intercept (T0 seam): a phase has resolved (winner w, by `by`). Record it +
   the casualties; if it was the LAST phase, end the battle with the aggregate winner; else advance
   (headless -> immediately; UI -> the inter-phase card gates it). */
function _fldPhaseResolved(w, by) {
  var top = __FIELD._scenTop, idx = __FIELD.phaseIdx, p = top.phases[idx];
  var usCas = _fldSidePhaseCas("US"), csCas = _fldSidePhaseCas("CS");
  __FIELD.battleCas.US += usCas; __FIELD.battleCas.CS += csCas;
  var pts = (typeof p.scoreWeight === "number") ? p.scoreWeight : 1;
  if (w === "draw") { __FIELD.phaseScore.US += pts / 2; __FIELD.phaseScore.CS += pts / 2; }
  else if (w === "US" || w === "CS") __FIELD.phaseScore[w] += pts;
  __FIELD.phaseLog.push({ idx: idx, name: p.name, winner: w, winBy: by, usCas: usCas, csCas: csCas });
  if (idx >= top.phases.length - 1) {
    __FIELD.winner = _fldBattleWinner(); __FIELD.winBy = "phases"; __FIELD.phase = "over";
    fldOnOver();
    return;
  }
  __FIELD.phaseIdx = idx + 1;
  if (_fldPhasesHasUI()) { __FIELD.phase = "interphase"; __FIELD.paused = true; _fldInterphaseCard(idx, w, by); }
  else { _fldAdvancePhase(); }   // headless: build the next phase + resume the stepper
}

/* build the next phase (phaseIdx already advanced) + resume. Headless -> phase "battle" so fldStepN
   keeps stepping; UI -> phase "battle" but PAUSED so the player surveys the fresh sector then unpauses. */
function _fldAdvancePhase() {
  _fldBuildPhase(__FIELD.phaseIdx);   // fldResetRun set phase=deploy, paused=true
  __FIELD.phase = "battle";
  __FIELD.paused = _fldPhasesHasUI();   // headless false (run on), UI true (survey then play)
  if (_fldPhasesHasUI() && __FIELD.fog && __FIELD.units && __FIELD.units.length && typeof fldComputeVisibility === "function") fldComputeVisibility();
}

function _fldPhasesHasUI() {
  return !!(typeof document !== "undefined" && document.getElementById && document.getElementById("fldRoot"));
}

/* the running-tally TOP-BAR label (T0 fldRenderTop seam). "" for a single-objective battle. */
function _fldPhaseTopLabel() {
  if (!__FIELD.phases) return "";
  var n = __FIELD.phases.length, i = __FIELD.phaseIdx + 1, nm = (__FIELD.scenData && __FIELD.scenData._phase) ? __FIELD.scenData._phase.name : "";
  var sc = __FIELD.phaseScore || { US: 0, CS: 0 };
  function fmt(v) { return (v === Math.floor(v)) ? String(v) : v.toFixed(1); }
  return "Phase " + i + "/" + n + (nm ? " · " + nm : "") + " · sectors US " + fmt(sc.US) + " – CS " + fmt(sc.CS);
}

/* the INTER-PHASE transition card (UI only). A period-broadsheet modal: the just-resolved phase
   result + the running tally + the NEXT phase's name/sector/lead + its teaching card. role=dialog,
   aria-modal, focus-trapped, Enter/Esc continues, reduceMotion-static. Continue -> _fldAdvancePhase. */
function _fldInterphaseCard(prevIdx, w, by) {
  var root = document.getElementById("fldRoot"); if (!root) { _fldAdvancePhase(); return; }
  if (document.getElementById("fldInterphase")) return;
  var top = __FIELD._scenTop, prev = top.phases[prevIdx], next = top.phases[__FIELD.phaseIdx];
  var _logEntry = __FIELD.phaseLog[prevIdx] || { usCas: 0, csCas: 0 };
  var ps = (typeof fldPlayerSide === "function") ? fldPlayerSide() : "US";
  var prevAtk = prev.attacker || top.attacker || "US", prevDef = (prevAtk === "US") ? "CS" : "US";
  // who held the sector — phrased by sector control, not just side
  var held = (w === "draw") ? "The sector was left in bloody deadlock"
    : (w === prevDef ? (_fldSideFull(prevDef) + " held " + prev.objective.name)
      : (_fldSideFull(prevAtk) + " carried " + prev.objective.name));
  var sc = __FIELD.phaseScore, cas = __FIELD.battleCas;
  var tcard = (next.teaching && next.teaching.head) ? next.teaching : ((next.teaching && next.teaching.card) ? next.teaching.card : null);
  var trans = next.transition || {};
  var rm = (typeof fldReduceMotion === "function") && fldReduceMotion();
  var ov = document.createElement("div");
  ov.id = "fldInterphase";
  ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true");
  ov.setAttribute("aria-label", "Phase complete: " + prev.name + ". Next: " + next.name);
  ov.style.cssText = "position:absolute;inset:0;z-index:6200;display:flex;align-items:center;justify-content:center;background:#070a0ed8;" + (rm ? "" : "animation:fldFadeIn .35s ease;");
  ov.innerHTML =
    '<div style="max-width:560px;max-height:88vh;overflow:auto;background:#0c0f14;border:1px solid #8a6f49;border-radius:8px;padding:22px 26px;box-shadow:0 6px 30px #000b;">' +
      '<div style="font-size:11px;letter-spacing:3px;opacity:.65;text-transform:uppercase;">Phase ' + (prevIdx + 1) + ' of ' + top.phases.length + ' complete</div>' +
      '<div style="font-size:21px;color:#e9dcc0;margin:3px 0 4px;">' + _fldEscPh(prev.name) + '</div>' +
      '<div style="font-size:13.5px;line-height:1.5;color:#d8c87a;margin-bottom:10px;">' + held + '. <span style="opacity:.8;color:#cdbb88;">' + _fldSideFull("US") + ' ' + _fldComma(_logEntry.usCas) + ' &middot; ' + _fldSideFull("CS") + ' ' + _fldComma(_logEntry.csCas) + ' fell here.</span></div>' +
      '<div style="display:flex;gap:10px;justify-content:center;margin:12px 0;padding:9px 0;border-top:1px solid #4a3c28;border-bottom:1px solid #4a3c28;">' +
        '<div style="text-align:center;"><div style="font-size:11px;opacity:.6;letter-spacing:1px;">SECTORS</div><div style="font-size:17px;color:#9fb6d8;">Union ' + _fldScFmt(sc.US) + '</div></div>' +
        '<div style="align-self:center;color:#8c8478;">vs</div>' + /* wcag-auditor: contrast fix from inherited-color@.5 (eff #7b766a, ratio 4.24) to #8c8478 (ratio 5.20) for AA compliance */
        '<div style="text-align:center;"><div style="font-size:11px;opacity:.6;letter-spacing:1px;">SECTORS</div><div style="font-size:17px;color:#d8a79f;">Confederate ' + _fldScFmt(sc.CS) + '</div></div>' +
      '</div>' +
      '<div style="font-size:11px;opacity:.6;text-align:center;margin-bottom:14px;">Cumulative cost — Union ' + _fldComma(cas.US) + ' &middot; Confederate ' + _fldComma(cas.CS) + '</div>' +
      '<div style="font-size:11px;letter-spacing:2px;opacity:.65;text-transform:uppercase;">Next &mdash; Phase ' + (__FIELD.phaseIdx + 1) + '</div>' +
      '<div style="font-size:19px;color:#e9dcc0;margin:2px 0 4px;">' + _fldEscPh(next.name) + '</div>' +
      (trans.lead ? '<div style="font-size:13.5px;opacity:.9;line-height:1.5;margin-bottom:8px;">' + trans.lead + '</div>' : '') +
      (tcard ? '<div style="margin-top:8px;padding:9px 11px;background:#15110b;border:1px solid #715e3e;border-radius:5px;"><b style="color:#d8c87a;">' + _fldEscPh(tcard.head || "") + '</b><div style="font-size:12.5px;opacity:.85;line-height:1.45;margin-top:2px;">' + (tcard.body || "") + '</div></div>' : '') +
      '<div style="text-align:center;margin-top:18px;"><button id="fldPhaseGo" type="button" style="background:#1c1610;color:#e9dcc0;border:1px solid #8a6f49;border-radius:4px;padding:10px 22px;font:15px Georgia,serif;cursor:pointer;outline:2px solid transparent;outline-offset:2px;" onfocus="this.style.outline=\'2px solid #d8c87a\'" onblur="this.style.outline=\'2px solid transparent\'">Take the field &#9654;</button></div>' + /* wcag-auditor: focus indicator added (#d8c87a outline, ratio 10.64 on btn bg; 11.39 on modal bg) — #fldInterphase not covered by T0 global :focus-visible rule (WCAG 2.4.7/2.4.11) */
    '</div>';
  root.appendChild(ov);
  if (typeof fldAnnounce === "function") fldAnnounce("Phase complete: " + held + ". Next: " + next.name + ". " + (trans.lead ? String(trans.lead).replace(/<[^>]+>/g, "") : ""));
  var go = document.getElementById("fldPhaseGo");
  var cont = function () { if (ov.parentNode) ov.parentNode.removeChild(ov); _fldAdvancePhase(); try { var rr = document.getElementById("fldRoot"); if (rr) rr.focus(); } catch (e) {} };
  ov.addEventListener("keydown", function (e) {
    if (e.key === "Escape" || e.key === "Enter") { e.stopPropagation(); e.preventDefault(); cont(); }
    else if (e.key === "Tab") { e.preventDefault(); if (go) go.focus(); }   // single-button focus trap
  });
  if (go) { go.addEventListener("click", cont); try { go.focus(); } catch (e) {} }
}

/* the aggregate END-SCREEN box (T0 fldOnOver seam): the phase-by-phase result table + the overall
   cost + the tactical/strategic framing. "" for a single-objective battle. Appended ALONGSIDE the
   data-driven fldScenarioEndHtml (which renders the top-level endNote + the overall teaching cards). */
function _fldPhasesEndHtml() {
  if (!__FIELD.phases || !__FIELD.phaseLog) return "";
  var top = __FIELD._scenTop, rows = "";
  for (var i = 0; i < __FIELD.phaseLog.length; i++) {
    var e = __FIELD.phaseLog[i], p = top.phases[e.idx], atk = p.attacker || top.attacker || "US", def = (atk === "US") ? "CS" : "US";
    var outcome = (e.winner === "draw") ? "deadlock"
      : (e.winner === def ? (_fldSideFull(def) + " held") : (_fldSideFull(atk) + " broke through"));
    var col = e.winner === "US" ? "#9fb6d8" : (e.winner === "CS" ? "#d8a79f" : "#cdbb88");
    /* wcag-auditor: casCol replaces opacity:.6 on inherited col — effective ratios on #15110b were 3.97/#9fb6d8, 3.91/#d8a79f, 4.24/#cdbb88 (all FAIL 4.5:1); explicit muted hue-matched colors pass at 4.75/4.78/4.81 respectively */
    var casCol = e.winner === "US" ? "#738196" : (e.winner === "CS" ? "#9c7871" : "#8d805c");
    rows += '<div style="display:flex;justify-content:space-between;gap:10px;padding:4px 0;border-top:1px solid #4a3c28;font-size:12.5px;">' +
      '<span style="opacity:.9;">' + (e.idx + 1) + '. ' + _fldEscPh(p.name) + '</span>' +
      '<span style="color:' + col + ';white-space:nowrap;">' + outcome + ' <span style="color:' + casCol + ';">(' + _fldComma(e.usCas + e.csCas) + ' fell)</span></span></div>';
  }
  var sc = __FIELD.phaseScore, cas = __FIELD.battleCas;
  var verdict = (__FIELD.winner === "draw")
    ? "A tactical draw — the bloodiest single day, and neither army was driven from the field."
    : (__FIELD.winner === "US" ? "A Union tactical edge across the sectors." : "A Confederate tactical edge across the sectors.");
  return '<div style="text-align:left;background:#15110b;border:1px solid #715e3e;border-radius:6px;padding:12px 14px;margin-bottom:16px;">' +
    '<div style="color:#d8c87a;font-weight:bold;margin-bottom:4px;">The day, phase by phase</div>' +
    rows +
    '<div style="margin-top:8px;padding-top:7px;border-top:1px solid #6f5f3f;font-size:12.5px;opacity:.9;">' + verdict +
    ' <span style="opacity:.75;">Sectors: Union ' + _fldScFmt(sc.US) + ' &middot; Confederate ' + _fldScFmt(sc.CS) + '. Cost: Union ' + _fldComma(cas.US) + ' &middot; Confederate ' + _fldComma(cas.CS) + '.</span></div></div>';
}

/* small shared helpers (uniquely prefixed). */
function _fldSideFull(side) { return side === "CS" ? "Confederate" : "Union"; }
function _fldScFmt(v) { v = v || 0; return (v === Math.floor(v)) ? String(v) : v.toFixed(1); }
function _fldComma(n) { n = Math.round(n || 0); return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function _fldEscPh(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
