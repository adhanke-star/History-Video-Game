/* ===========================================================================
   S0 · 90-president-register.js — register the President's-Desk system into
   the War Department lifecycle by REDECLARING _t1InitAll / _t1Resolve.

   This codebase extends by override-by-redeclaration: the LAST top-level
   `function NAME` definition wins (hoisting). These two redeclarations are
   spliced AFTER the base copies (base lines 11536 / 11545), so they win — and
   because campaignAdvance (base 2616→2687), openWarDept (11586→11596), and
   openPresidentDesk call _t1Resolve / _t1InitAll BY BARE NAME, they pick up the
   overridden versions automatically. NO edit inside campaignAdvance is needed.

   Each body is the VERIFIED base body (copied line-for-line from base.html
   11536–11550) plus ONE guarded president hook. Order is preserved exactly;
   presInit runs last in init, presOnResolve runs AFTER clkOnResolve in resolve
   (so C.clock exists for any interlink). Every call stays isolated in try/catch
   so one system's failure cannot abort the others.
   =========================================================================== */

function _t1InitAll(C) {
  if (!C) return;
  try { if (typeof clkInit === "function") clkInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll clkInit:", e); }
  try { if (typeof mrInit  === "function") mrInit(C);  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll mrInit:", e); }
  try { if (typeof wrInit  === "function") wrInit(C);  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll wrInit:", e); }
  try { if (typeof presInit === "function") presInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll presInit:", e); }   // S0: President's Desk
  try { if (typeof cabInit === "function") cabInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll cabInit:", e); }     // S2 m1: cabinet/advisor system (after presInit)
  try { if (typeof cmdInit === "function") cmdInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll cmdInit:", e); }     // S2 m5: command/named-generals (after cabInit — seeds reputation, feeds the bridge leadership facet)
  try { if (typeof campInit === "function") campInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll campInit:", e); }    // Q8: the between-battle camp loop (after cmdInit; feeds the bridge conditioning facets, exactly 0 when undrilled)
  try { if (typeof lootInit === "function") lootInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll lootInit:", e); }    // D148: campaign kit / survival / Soldier's Story save-shape
  try { if (typeof decInit === "function") decInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll decInit:", e); }     // S2 m2: executive decisions / pendingChoices loop
  try { if (typeof moraleInit === "function") moraleInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll moraleInit:", e); }  // S2 m3: 3-layer morale
  try { if (typeof pressInit === "function") pressInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll pressInit:", e); }    // S2 m4: press / public opinion
  try { if (typeof vicInit === "function") vicInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll vicInit:", e); }     // S1e: strategy/victory (read by blockade+manpower)
  try { if (typeof econInit === "function") econInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll econInit:", e); }   // S1a: economy/finance
  try { if (typeof blockadeInit === "function") blockadeInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll blockadeInit:", e); }  // S1c: cotton/blockade/diplomacy
  try { if (typeof prodInit === "function") prodInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll prodInit:", e); }   // S1b: war production
  try { if (typeof armoryInit === "function") armoryInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll armoryInit:", e); }  // weapons procurement
  try { if (typeof artInit === "function") artInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll artInit:", e); }     // A1: Cannon Corps (artillery batteries)
  try { if (typeof engInit === "function") engInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll engInit:", e); }     // A2: Engineering Works Corps (capability levels)
  try { if (typeof logisticsInit === "function") logisticsInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll logisticsInit:", e); }  // D159: rail/supply artery readout + opt-in bridge input
  try { if (typeof prisonersInit === "function") prisonersInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll prisonersInit:", e); }  // D161: prisoner-exchange pressure + opt-in relief
  try { if (typeof medicalInit === "function") medicalInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll medicalInit:", e); }  // D169: disease/medical pressure + opt-in relief
  try { if (typeof hardWarInit === "function") hardWarInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll hardWarInit:", e); }  // D175: hard-war pressure + opt-in civilian/freedpeople protection
  try { if (typeof irregularWarInit === "function") irregularWarInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll irregularWarInit:", e); }  // D177: irregular-war pressure + opt-in civilian security
  try { if (typeof underToldInit === "function") underToldInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll underToldInit:", e); }  // D178: under-told perspectives + opt-in liaison
  try { if (typeof flagshipUnitsInit === "function") flagshipUnitsInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll flagshipUnitsInit:", e); }  // D179: flagship named units + opt-in stewardship
  try { if (typeof csFinanceInit === "function") csFinanceInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll csFinanceInit:", e); }  // D188: Confederate finance toolkit + opt-in priorities
  try { if (typeof realDiplomacyInit === "function") realDiplomacyInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll realDiplomacyInit:", e); }  // D189: real diplomacy system + opt-in priorities
  try { if (typeof humanCostInit === "function") humanCostInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll humanCostInit:", e); }  // D190: human-cost readout ledger, no bridge lever
  try { if (typeof westernTheaterInit === "function") westernTheaterInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll westernTheaterInit:", e); }  // D191: Western Theater strategic readout, no bridge lever
  try { if (typeof manpowerInit === "function") manpowerInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll manpowerInit:", e); }  // S1d: manpower/conscription
  try { if (typeof bridgeInit === "function") bridgeInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll bridgeInit:", e); }     // S5-seed: pre-battle conditioning prep
}

/* ARC9_PACING_RUNTIME_V1 — D515 / LANE-020 Slice 1.
   Measurements are process-only diagnostics: no campaign/settings/save/RNG
   owner receives them. A monotonic clock is required; unsupported runtimes
   simply run the unchanged resolver without a snapshot. */
var _ARC9_PACING_THRESHOLD_MS = 50;
var _ARC9_PACING_GROUPS = [
  "calendar-politics",
  "economy-logistics",
  "human-cost-theaters",
  "leadership-people",
  "decisions-outcome"
];
var _arc9PacingEnabled = true;
var _arc9PacingLast = null;

function _arc9PacingNow() {
  try {
    if (typeof performance === "undefined" || !performance || typeof performance.now !== "function") return null;
    var n = performance.now();
    return (typeof n === "number" && isFinite(n)) ? n : null;
  } catch (e) { return null; }
}
function _arc9PacingBegin() {
  if (!_arc9PacingEnabled) return null;
  _arc9PacingLast = null;
  var now = _arc9PacingNow();
  return now === null ? null : { started: now, marked: now, groups: [], invalid: false };
}
function _arc9PacingMark(run, name) {
  if (!run || run.invalid) return;
  var expected = _ARC9_PACING_GROUPS[run.groups.length];
  var now = _arc9PacingNow();
  if (name !== expected || now === null) { run.invalid = true; return; }
  run.groups.push({ name: name, ms: Math.max(0, now - run.marked) });
  run.marked = now;
}
function arc9PacingIsLong(totalMs) {
  return typeof totalMs === "number" && isFinite(totalMs) && totalMs >= _ARC9_PACING_THRESHOLD_MS;
}
function arc9PacingSnapshot() {
  if (!_arc9PacingLast) return null;
  return {
    completed: _arc9PacingLast.completed,
    totalMs: _arc9PacingLast.totalMs,
    thresholdMs: _arc9PacingLast.thresholdMs,
    long: _arc9PacingLast.long,
    groups: _arc9PacingLast.groups.map(function (row) { return { name: row.name, ms: row.ms }; })
  };
}
function arc9PacingSetEnabled(enabled) {
  _arc9PacingEnabled = enabled !== false;
  _arc9PacingLast = null;
  return _arc9PacingEnabled;
}
function _arc9PacingFinish(run) {
  if (!run || run.invalid || run.groups.length !== _ARC9_PACING_GROUPS.length) {
    _arc9PacingLast = null;
    return null;
  }
  var now = _arc9PacingNow();
  if (now === null) {
    _arc9PacingLast = null;
    return null;
  }
  var total = Math.max(0, now - run.started);
  _arc9PacingLast = {
    completed: true,
    totalMs: total,
    thresholdMs: _ARC9_PACING_THRESHOLD_MS,
    long: arc9PacingIsLong(total),
    groups: run.groups.map(function (row) { return { name: row.name, ms: row.ms }; })
  };
  return arc9PacingSnapshot();
}

function _t1Resolve(winnerSide, type, B, C, win) {
  if (!C) return;
  var _arc9Run = _arc9PacingBegin();
  try { if (typeof clkOnResolve === "function") clkOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve clkOnResolve:", e); }
  try { if (typeof politicsOnResolve === "function") politicsOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve politicsOnResolve:", e); }
  _arc9PacingMark(_arc9Run, "calendar-politics");
  try { if (typeof econOnResolve === "function") econOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve econOnResolve:", e); }  // S1a: after clk → feeds clock.weariness
  try { if (typeof wrOnResolve  === "function") wrOnResolve(winnerSide, type, B, C, win);  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve wrOnResolve:", e); }
  try { if (typeof blockadeOnResolve === "function") blockadeOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve blockadeOnResolve:", e); }  // S1c: BEFORE prod → sets importFactor + funds + clock.intervention
  try { if (typeof prodOnResolve === "function") prodOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve prodOnResolve:", e); }  // S1b: after wr (reads nodes + blockade.importFactor)
  try { if (typeof engOnResolve === "function") engOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve engOnResolve:", e); }  // A2: AFTER prod → Construction Corps repairs rail (slows CS decay)
  try { if (typeof logisticsOnResolve === "function") logisticsOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve logisticsOnResolve:", e); }  // D159: AFTER eng -> reads repaired rail, blockade imports, War Room nodes
  _arc9PacingMark(_arc9Run, "economy-logistics");
  try { if (typeof manpowerOnResolve === "function") manpowerOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve manpowerOnResolve:", e); }  // S1d: reads B.casualties + year → army strength
  try { if (typeof prisonerExchangeOnResolve === "function") prisonerExchangeOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve prisonerExchangeOnResolve:", e); }  // D161: AFTER manpower -> records detained/returned pressure and optional relief
  try { if (typeof medicalOnResolve === "function") medicalOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve medicalOnResolve:", e); }  // D169: AFTER POW -> records disease/wound pressure and optional relief
  try { if (typeof hardWarOnResolve === "function") hardWarOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve hardWarOnResolve:", e); }  // D175: AFTER medical -> records hard-war pressure and optional protection
  try { if (typeof irregularWarOnResolve === "function") irregularWarOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve irregularWarOnResolve:", e); }  // D177: AFTER hard war -> records irregular-war pressure and optional civilian security
  try { if (typeof underToldOnResolve === "function") underToldOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve underToldOnResolve:", e); }  // D178: AFTER irregular war -> records perspective coverage and optional liaison
  try { if (typeof flagshipUnitsOnResolve === "function") flagshipUnitsOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve flagshipUnitsOnResolve:", e); }  // D179: AFTER under-told -> records unit memory and optional stewardship
  try { if (typeof csFinanceOnResolve === "function") csFinanceOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve csFinanceOnResolve:", e); }  // D188: AFTER unit memory -> records Confederate finance stress and optional priorities
  try { if (typeof realDiplomacyOnResolve === "function") realDiplomacyOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve realDiplomacyOnResolve:", e); }  // D189: AFTER finance -> records recognition/intervention pressure and optional priorities
  try { if (typeof humanCostOnResolve === "function") humanCostOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve humanCostOnResolve:", e); }  // D190: AFTER cost-bearing ledgers -> readout-only human-cost snapshot
  try { if (typeof westernTheaterOnResolve === "function") westernTheaterOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve westernTheaterOnResolve:", e); }  // D191: AFTER cost/logistics ledgers -> readout-only Western snapshot
  _arc9PacingMark(_arc9Run, "human-cost-theaters");
  try { if (typeof mrOnResolve  === "function") mrOnResolve(winnerSide, type, B, C, win);  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve mrOnResolve:", e); }
  try { if (typeof presOnResolve === "function") presOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve presOnResolve:", e); }  // S0: after clk (interlink)
  try { if (typeof cabOnResolve === "function") cabOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve cabOnResolve:", e); }  // S2 m1: AFTER pres (date+turn advanced) -> detect cabinet churn
  try { if (typeof cmdOnResolve === "function") cmdOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve cmdOnResolve:", e); }  // S2 m5: AFTER cab, BEFORE morale -> evolve the general's reputation; it feeds the leader-morale layer this turn
  try { if (typeof campOnResolve === "function") campOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve campOnResolve:", e); }  // Q8: AFTER cmd -> rest sheds fatigue, a delegated army auto-drills, combat seasons / attrition erodes the training
  try { if (typeof lootOnResolve === "function") lootOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve lootOnResolve:", e); }  // D148: deterministic loot reward; survival tick only when active
  _arc9PacingMark(_arc9Run, "leadership-people");
  try { if (typeof decOnResolve === "function") decOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve decOnResolve:", e); }  // S2 m2: AFTER pres -> surface/expire decision cards (owns pendingChoices)
  try { if (typeof pressOnResolve === "function") pressOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve pressOnResolve:", e); }  // S2 m4: BEFORE morale -> the day's press sentiment feeds public will
  try { if (typeof moraleOnResolve === "function") moraleOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve moraleOnResolve:", e); }  // S2 m3: AFTER clk (weariness/election set), BEFORE vic (enemyWill change seen by victoryReady)
  try { if (typeof vicOnResolve === "function") vicOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve vicOnResolve:", e); }  // S1e: LAST — enemy will, lever upkeep, victory detection
  try { if (typeof bridgeOnResolve === "function") bridgeOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve bridgeOnResolve:", e); }  // S5-seed: reset pre-battle prep
  _arc9PacingMark(_arc9Run, "decisions-outcome");
  _arc9PacingFinish(_arc9Run);
}
