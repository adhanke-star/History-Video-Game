# AUDIT-PROTOCOL — Fable's per-chunk gate (Generals of the Republic)

Run for every `chunks/out/CHUNK-XX.js` before splice. Executors never touch `civil_war_generals.html`; Fable owns every merge.

## Gate 1 — Contract grep (static)
- No redefinition of existing symbols: `grep -nE "(function|const|let|var)\s+(logMsg|refreshUI|toast|draw|drawMini|fitCamera|resize|clamp|pick|rint|chance|unitAt|tileAt|reachable|doMove|resolveFire|resolveCharge|checkVictory|beginTurn|endPlayerTurn|startBattleRuntime|genMap|genForce|nameForce|G|BATTLES|WEAPONS|TERRAIN|ARM|DIFF)\b"` → only hits allowed are the chunk's OWN assigned definitions (per its contract).
- DOM whitelist: extract every `getElementById("...")`/`querySelector` literal; diff against the id list in BUILD-PLAN §Engine facts. Any novel id = FAIL.
- Banned: `fetch(`, `import `, `require(`, `new Audio`, `document.write`, `innerHTML +=` in loops over units (perf), `localStorage` outside CHUNK-07, markdown fences, `<script`.
- **Invalid hex literals (G-wave lesson — shipped THREE times: `0x5C1V1L`, `0xBACKG001`, plus near-misses):** `grep -nE "0x[0-9a-fA-F]*[g-z]"` on every chunk AND on the full script after splice. Any hit = FAIL (a hex literal with a non-hex letter is a parse error waiting to detonate).
- Chunk-specific greps listed at the end of each BUILD-PLAN chunk section (e.g. C3: single-fire `cb()` flag; C7: try/catch around every localStorage touch).

## Gate 2 — Splice + parse
1. Working copy: replace `/*__ENGINE7__*/` with `\n<chunk>\n/*__ENGINE7__*/` (keeps marker last) in integration order C1→C8.
2. Extract script: sed between `<script>` and `</script>` → `/tmp/gor_script.js`.
3. `node --check /tmp/gor_script.js` → must pass. (DOM refs are fine — parse only.)

## Gate 3 — Functional review (Fable read-through)
- Every G-state field written is in the chunk's contract.
- Every guard from the Risk register present (B.over re-checks, mode guards, typeof guards on not-yet-built callees).
- No silent failure paths added to combat/score code.
- Style: banner comment, size budget ±30%, no stubs/TODOs.

## Gate 4 — Cumulative
- After each wave: re-run Gate 2 on the FULL file; grep duplicate `function NAME` across whole script; confirm `/*__ENGINE7__*/` still terminal and `</script></body></html>` intact.
- After C8: full loop checklist (menu → campaign → battle → AI turn → result → upgrade → save → reload → continue) — Safari playtest with Aaron; defects logged to `PLAYTEST-LOG.md` and fixed by Fable directly (C9).

## Verdicts
PASS → splice into canonical `civil_war_generals.html`. PARTIAL → Fable patches in-place if <15 lines of fixes, else bounce chunk back to a fresh executor with the violation list. FAIL → rewrite prompt, respawn.
