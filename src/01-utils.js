/* ===========================================================================
   01-utils.js — shared utility helpers used across grand-strategy modules.

   Loaded FIRST (manifest position 0) so every module can call these by bare
   name.  Six helpers that were previously copy-pasted across 6-12 modules,
   now a single source of truth.

   Bare-name globals (GAME_DATA — never window.GAME_DATA); no module-specific
   prefix (these are intentionally cross-cutting); no state; no DOM.
   =========================================================================== */

/* HTML-escape for innerHTML AND attribute contexts (quotes included).
   Replaces _cabEsc / _decEsc / _prsEsc / _cmdEsc / _artEsc / _engEsc. */
function htmlEsc(s) {
  s = (s == null) ? "" : String(s);
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* Append a line to a capped, newest-first log on obj[key].
   Replaces _pdLog / _ecPush / _prPush / _blkPush / _mpPush / _vicPush. */
function logPush(obj, key, line, max) {
  try {
    if (!obj) return;
    if (!obj[key]) obj[key] = [];
    obj[key].unshift(line);
    if (obj[key].length > (max || 6)) obj[key].length = (max || 6);
  } catch (e) {}
}

/* Safe accessor for a GAME_DATA sub-object.
   gameData("cabinet") → GAME_DATA.cabinet, or null if absent.
   Replaces the per-module typeof-guard boilerplate. */
function gameData(key) {
  return (typeof GAME_DATA !== "undefined" && GAME_DATA && GAME_DATA[key]) ? GAME_DATA[key] : null;
}

/* The campaign's current year from C.clock or C.president.date, default 1861.
   Replaces _armYear / _artYear / _engYear (identical copies). */
function campaignYear(C) {
  return (C && C.clock && typeof C.clock.year === "number") ? C.clock.year
       : (C && C.president && C.president.date && typeof C.president.date.year === "number") ? C.president.date.year : 1861;
}

/* Strategic date {year,month} → comparable integer (year×12 + month).
   defMonth is the fallback month when d is null/invalid (default 4 = April).
   Replaces _cabDateNum (defMonth 2) and _cmdDateNum (defMonth 4). */
function dateToNum(d, defMonth) {
  if (!d || typeof d.year !== "number") return 1861 * 12 + (typeof defMonth === "number" ? defMonth : 4);
  return d.year * 12 + (typeof d.month === "number" ? d.month : 1);
}

/* Tenure {y,m} → comparable integer, 0 if absent.
   Replaces _cabTenureNum and _cmdYM (identical). */
function tenureToNum(t) { return t ? (t.y * 12 + (t.m || 1)) : 0; }
