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
  try { if (typeof manpowerInit === "function") manpowerInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll manpowerInit:", e); }  // S1d: manpower/conscription
  try { if (typeof bridgeInit === "function") bridgeInit(C); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1InitAll bridgeInit:", e); }     // S5-seed: pre-battle conditioning prep
}

function _t1Resolve(winnerSide, type, B, C, win) {
  if (!C) return;
  try { if (typeof clkOnResolve === "function") clkOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve clkOnResolve:", e); }
  try { if (typeof econOnResolve === "function") econOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve econOnResolve:", e); }  // S1a: after clk → feeds clock.weariness
  try { if (typeof wrOnResolve  === "function") wrOnResolve(winnerSide, type, B, C, win);  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve wrOnResolve:", e); }
  try { if (typeof blockadeOnResolve === "function") blockadeOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve blockadeOnResolve:", e); }  // S1c: BEFORE prod → sets importFactor + funds + clock.intervention
  try { if (typeof prodOnResolve === "function") prodOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve prodOnResolve:", e); }  // S1b: after wr (reads nodes + blockade.importFactor)
  try { if (typeof engOnResolve === "function") engOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve engOnResolve:", e); }  // A2: AFTER prod → Construction Corps repairs rail (slows CS decay)
  try { if (typeof logisticsOnResolve === "function") logisticsOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve logisticsOnResolve:", e); }  // D159: AFTER eng -> reads repaired rail, blockade imports, War Room nodes
  try { if (typeof manpowerOnResolve === "function") manpowerOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve manpowerOnResolve:", e); }  // S1d: reads B.casualties + year → army strength
  try { if (typeof prisonerExchangeOnResolve === "function") prisonerExchangeOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve prisonerExchangeOnResolve:", e); }  // D161: AFTER manpower -> records detained/returned pressure and optional relief
  try { if (typeof mrOnResolve  === "function") mrOnResolve(winnerSide, type, B, C, win);  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve mrOnResolve:", e); }
  try { if (typeof presOnResolve === "function") presOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve presOnResolve:", e); }  // S0: after clk (interlink)
  try { if (typeof cabOnResolve === "function") cabOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve cabOnResolve:", e); }  // S2 m1: AFTER pres (date+turn advanced) -> detect cabinet churn
  try { if (typeof cmdOnResolve === "function") cmdOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve cmdOnResolve:", e); }  // S2 m5: AFTER cab, BEFORE morale -> evolve the general's reputation; it feeds the leader-morale layer this turn
  try { if (typeof campOnResolve === "function") campOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve campOnResolve:", e); }  // Q8: AFTER cmd -> rest sheds fatigue, a delegated army auto-drills, combat seasons / attrition erodes the training
  try { if (typeof lootOnResolve === "function") lootOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve lootOnResolve:", e); }  // D148: deterministic loot reward; survival tick only when active
  try { if (typeof decOnResolve === "function") decOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve decOnResolve:", e); }  // S2 m2: AFTER pres -> surface/expire decision cards (owns pendingChoices)
  try { if (typeof pressOnResolve === "function") pressOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve pressOnResolve:", e); }  // S2 m4: BEFORE morale -> the day's press sentiment feeds public will
  try { if (typeof moraleOnResolve === "function") moraleOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve moraleOnResolve:", e); }  // S2 m3: AFTER clk (weariness/election set), BEFORE vic (enemyWill change seen by victoryReady)
  try { if (typeof vicOnResolve === "function") vicOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve vicOnResolve:", e); }  // S1e: LAST — enemy will, lever upkeep, victory detection
  try { if (typeof bridgeOnResolve === "function") bridgeOnResolve(winnerSide, type, B, C, win); } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("_t1Resolve bridgeOnResolve:", e); }  // S5-seed: reset pre-battle prep
}
