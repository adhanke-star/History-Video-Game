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
  try { if (typeof clkInit === "function") clkInit(C); } catch (e) {}
  try { if (typeof mrInit  === "function") mrInit(C);  } catch (e) {}
  try { if (typeof wrInit  === "function") wrInit(C);  } catch (e) {}
  try { if (typeof presInit === "function") presInit(C); } catch (e) {}   // S0: President's Desk
}

function _t1Resolve(winnerSide, type, B, C, win) {
  if (!C) return;
  try { if (typeof clkOnResolve === "function") clkOnResolve(winnerSide, type, B, C, win); } catch (e) {}
  try { if (typeof wrOnResolve  === "function") wrOnResolve(winnerSide, type, B, C, win);  } catch (e) {}
  try { if (typeof mrOnResolve  === "function") mrOnResolve(winnerSide, type, B, C, win);  } catch (e) {}
  try { if (typeof presOnResolve === "function") presOnResolve(winnerSide, type, B, C, win); } catch (e) {}  // S0: after clk (interlink)
}
