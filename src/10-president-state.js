/* ===========================================================================
   S0 · 10-president-state.js — The President's Desk: STATE + per-battle tick.

   The owner-mode (grand-strategy) layer per GRAND-STRATEGY-PLAN.md. This module
   adds C.president as a SIBLING of C.clock / C.muster / C.warroom (the existing
   War Department systems) — EXTENDING G.campaign, never duplicating it (§11).

   Four-function contract, identical to the clk/mr/wr systems:
     presInit(C)                         — idempotent; creates C.president; tolerates null C
     presOnResolve(winnerSide,type,B,C,win) — per-battle tick; mutates C.president ONLY
                                             (no DOM, no saveLocal — matches clkOnResolve)
   (presRenderHTML / presWire — the desk UI — arrive in the render/shell modules.)

   These two are REGISTERED into the overridden _t1InitAll / _t1Resolve in
   90-president-register.js, so they run automatically from startCampaign,
   openWarDept/openPresidentDesk, and campaignAdvance — by bare-name call.

   CODEBASE RULES honored here:
     • G is a bare-name lexical global — reference G directly, NEVER window.G.
     • New const/let helpers use a UNIQUE _pd* prefix (a duplicate top-level
       const is a hard SyntaxError; _pd names do not collide with _wr/_clk/_mr).
     • C.president holds PLAIN DATA only (no fns/DOM/cycles) so it JSON-serializes
       into the existing save (serializeSave sends all of G.campaign wholesale —
       it rides the save with NO _SAVE_VER bump; back-compat = idempotent presInit).
   =========================================================================== */

var _pdLOG_MAX = 6;

/* Append a dispatch line to the President's log (newest-first, capped) —
   mirrors the clk/wr log convention. Guarded; never throws into the tick. */
function _pdLog(C, line) {
  try {
    if (!C || !C.president) return;
    if (!C.president.log) C.president.log = [];
    C.president.log.unshift(line);
    if (C.president.log.length > _pdLOG_MAX) C.president.log.length = _pdLOG_MAX;
  } catch (e) {}
}

/* Authored cabinet rosters. No cabinet/advisor data exists anywhere in the repo
   (verified), so S0 authors it. Real historical secretaries, side-scoped; the
   per-domain advisor system (auto-manage + recommend + TEACH, R25) layers on in
   S2. Names are surnames (the portrait API keys on surname). Provenance: all
   Verified (standard cabinet records). */
var _pdCABINET = {
  US: [
    { role: "Secretary of War",       name: "Stanton",   domain: "war"      },
    { role: "Secretary of the Treasury", name: "Chase",  domain: "treasury" },
    { role: "Secretary of State",     name: "Seward",    domain: "state"    },
    { role: "Secretary of the Navy",  name: "Welles",    domain: "navy"     }
  ],
  CS: [
    { role: "Secretary of War",       name: "Seddon",    domain: "war"      },
    { role: "Secretary of the Treasury", name: "Memminger", domain: "treasury" },
    { role: "Secretary of State",     name: "Benjamin",  domain: "state"    },
    { role: "Secretary of the Navy",  name: "Mallory",   domain: "navy"     }
  ]
};

/* The head of state for each side (the player's persona, R32). */
var _pdPRESIDENT = {
  US: { name: "Lincoln", title: "President of the United States",       seat: "Executive Mansion, Washington" },
  CS: { name: "Davis",   title: "President of the Confederate States",  seat: "Executive Mansion, Richmond"   }
};

/* ---- presInit: idempotent lazy init — the back-compat / migration mechanism ----
   Old (pre-S0) ver-1 saves gain C.president on the next desk-open or battle tick;
   applySave restores G.campaign wholesale and does NOT re-run init, so EVERY
   reader must call presInit first. Re-validates each field for partial objects. */
function presInit(C) {
  if (!C) return;                                  // warWonScreen sets G.campaign=null — tolerate it
  var side = (C.side === "CS") ? "CS" : "US";
  if (!C.president) {
    C.president = {
      // Strategic clock. War opens at Fort Sumter (April 1861) — the layered
      // onboarding anchor (§10/§23). Advances as the war proceeds.
      date: { year: 1861, month: 4 },
      head: { name: _pdPRESIDENT[side].name, title: _pdPRESIDENT[side].title, seat: _pdPRESIDENT[side].seat },
      cabinet: _pdCABINET[side].map(function (a) {
        return { role: a.role, name: a.name, domain: a.domain, delegated: false };
      }),
      pendingChoices: [],   // curated, non-blocking executive choices surfaced per turn (R3/R24/R22)
      onboarded: false,     // layered-onboarding flag (set true once the desk is first opened)
      turn: 0,              // count of strategic turns elapsed
      log: []
    };
  }
  var P = C.president;
  if (!P.date)               P.date = { year: 1861, month: 4 };
  if (typeof P.date.year !== "number")  P.date.year = 1861;
  if (typeof P.date.month !== "number") P.date.month = 4;
  if (!P.head)               P.head = { name: _pdPRESIDENT[side].name, title: _pdPRESIDENT[side].title, seat: _pdPRESIDENT[side].seat };
  if (!P.cabinet || !P.cabinet.length) {
    P.cabinet = _pdCABINET[side].map(function (a) {
      return { role: a.role, name: a.name, domain: a.domain, delegated: false };
    });
  }
  if (!P.pendingChoices)     P.pendingChoices = [];
  if (typeof P.turn !== "number") P.turn = 0;
  if (typeof P.onboarded !== "boolean") P.onboarded = false;
  if (!P.log)                P.log = [];
}

/* Pretty month label for the strategic clock. */
function _pdMonthName(m) {
  var names = ["", "January", "February", "March", "April", "May", "June",
               "July", "August", "September", "October", "November", "December"];
  return names[m] || "";
}

/* ---- presOnResolve: per-battle strategic-turn tick. Mutate C.president ONLY.
   No DOM, no saveLocal. Runs AFTER clkOnResolve in _t1Resolve, so C.clock
   exists if we want to read/feed it (interlink pattern, like wr→clk.capital). ---- */
function presOnResolve(winnerSide, type, B, C, win) {
  if (!C) return;
  presInit(C);                                     // belt-and-suspenders for wholesale-restored saves
  try {
    var P = C.president;
    P.turn = (P.turn || 0) + 1;

    // 1) Advance the strategic date. Placeholder cadence: ~one month per battle.
    //    (Real variable pacing — weekly in season, compressed in winter, §22 —
    //    arrives with the strategic-turn loop content.)
    var d = P.date;
    d.month += 1;
    if (d.month > 12) { d.month = 1; d.year += 1; }
    // Keep the strategic year in step with the 1864 Clock if it has advanced
    // further (the clock tracks max battle year). Interlink, never regress.
    if (C.clock && typeof C.clock.year === "number" && d.year < C.clock.year) {
      d.year = C.clock.year;
    }

    // 2) Surface curated, NON-BLOCKING executive choices for the next turn.
    //    S0 keeps this an empty stub (the loop is live but content-light); S1+
    //    fills it with preset-gated, advisor-mediated options (economy, finance,
    //    appointments, diplomacy, home-front events). Reset each turn.
    P.pendingChoices = [];

    // 3) Log a dispatch to the Executive Mansion (newest-first, capped).
    var bn = (B && B.bd && B.bd.name) ? B.bd.name : (B && B.name) ? B.name : "the field";
    _pdLog(C, (win ? "Victory" : (type === "draw" ? "Stalemate" : "Setback"))
              + " at " + bn + " — " + _pdMonthName(d.month) + " " + d.year + ".");
  } catch (e) {}
}
