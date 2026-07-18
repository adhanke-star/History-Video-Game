/* ===========================================================================
   src/111-memory-chain.js — GEA-12 (D447): ONE HISTORICALLY BOUNDED THREE-BEAT
   MEMORY CHAIN (event memory).

   THE CONTRACT (docs/design/genre-elite-p1-contracts.md GEA-12): exactly ONE
   proof chain over EXISTING decision ids — beat 1: the emancipation-proclamation
   card resolves on an option that ISSUES the proclamation ("issue" or "radical";
   "refuse" does not arm the chain) → beat 2: the us-reconstruction-terms card's
   eligibility flips ONE YEAR EARLIER (1864 → 1863), keyed to the beat-1 receipt
   — offerable, never forced (it enters pendingChoices through decOnResolve's
   normal path; the player answers or ignores it) → beat 3: one divergence/AAR
   line names the chain once BOTH beats have resolved. The 1863 offer is
   HISTORICALLY BETTER than the shipped 1864 gate: Lincoln's Proclamation of
   Amnesty and Reconstruction is December 8, 1863, documented with sources in the
   us-reconstruction-terms card's own committed text — the chain authors NO new
   historical claim.

   THE SAVE LAW (the gating question, resolved additively): the memory lives in
   `C.president.memoryChains`, a bounded keyed map (cap 8 chains) created LAZILY
   at the first real beat-1 receipt and NEVER seeded by any init path — a legacy
   save that never fires the chain carries no key, re-serializes byte-identically,
   and no save-envelope function (serializeSave / loadLocal / applySave /
   _slValidSave — the E41-hashed set) is touched. `_SAVE_VER` stays 1. Reads
   sanitize (unknown chain ids and malformed entries are DROPPED on read, never
   repaired, never written back). Historical/Mayhem parity per D416: this module
   never reads the ruleset — the chain behaves identically in both modes.

   Never free text, never a new political engine: the ONE chain definition is a
   closed const; writes happen at exactly one seam (decResolve's receipt).
   Bare-name globals; no literal comment-closer inside this block.
   =========================================================================== */

var MC_CHAINS = {
  "mc-emancipation-reconstruction": {
    beat1: "emancipation-proclamation",
    beat1Opts: { issue: 1, radical: 1 },   // the proclamation EXISTS on these receipts; "refuse" never arms the chain
    beat2: "us-reconstruction-terms",
    relaxYears: 1
  }
};

/* One stored entry's closed shape: exactly { v:1, opt, year, beat2Year }. */
function _mcSaneEntry(v) {
  return !!(v && typeof v === "object" && !Array.isArray(v) && v.v === 1 &&
    typeof v.opt === "string" && typeof v.year === "number" && isFinite(v.year) &&
    typeof v.beat2Year === "number" && isFinite(v.beat2Year) &&
    Object.keys(v).length === 4);
}

/* The sanitized read: known chain ids only, sane entries only, at most 8 —
   dropped entries are never repaired and the stored map is never written back. */
function mcChains(C) {
  var out = {};
  try {
    var P = C && C.president, m = P && P.memoryChains;
    if (!m || typeof m !== "object" || Array.isArray(m)) return out;
    var keys = Object.keys(m), n = 0;
    for (var i = 0; i < keys.length && n < 8; i++) {
      var k = keys[i];
      if (!MC_CHAINS[k]) continue;
      if (!_mcSaneEntry(m[k])) continue;
      out[k] = m[k]; n++;
    }
  } catch (e) {}
  return out;
}

/* THE ONE WRITER — called from decResolve's receipt seam. Creates the map
   LAZILY at the first qualifying beat-1 receipt (never on init/load, so legacy
   saves stay byte-identical by absence); refuses past the cap of 8 chains;
   never repairs a foreign/poisoned shape. */
function mcOnDecisionResolved(C, cardId, optionId) {
  try {
    if (!C || !C.president) return;
    var P = C.president;
    var year = (P.date && typeof P.date.year === "number") ? P.date.year : 0;
    for (var k in MC_CHAINS) {
      if (!MC_CHAINS.hasOwnProperty(k)) continue;
      var ch = MC_CHAINS[k];
      if (cardId === ch.beat1 && ch.beat1Opts[optionId] === 1) {
        var m = P.memoryChains;
        if (m !== undefined && (m === null || typeof m !== "object" || Array.isArray(m))) return;   // foreign shape: never repair
        if (!m) m = P.memoryChains = {};   // LAZY creation at the first real beat — the save-law seam
        if (!m[k]) {
          if (Object.keys(m).length >= 8) return;   // the cap: refuse, never trim
          m[k] = { v: 1, opt: String(optionId), year: (year > 0 ? year : -1), beat2Year: 0 };
        }
      } else if (cardId === ch.beat2) {
        var live = mcChains(C)[k];
        if (live && !live.beat2Year) live.beat2Year = (year > 0 ? year : -1);
      }
    }
  } catch (e) {}
}

/* Beat-2 eligibility relax: how many years earlier cardId may surface, keyed to
   the beat-1 receipt in the sanitized map. 0 for every other card and whenever
   the map is absent — legacy saves evaluate byte-identically. Pure read. */
function mcYearRelax(C, cardId) {
  try {
    var m = mcChains(C);
    for (var k in MC_CHAINS) {
      if (!MC_CHAINS.hasOwnProperty(k)) continue;
      if (MC_CHAINS[k].beat2 === cardId && m[k]) return MC_CHAINS[k].relaxYears || 0;
    }
  } catch (e) {}
  return 0;
}

/* Beat 3: the ONE chain line for divScan — null until BOTH beats have resolved.
   Pure read; deterministic; the history sentence restates what the two decision
   cards' own committed sourced texts already record (no new claim). */
function mcChainLine(C) {
  try {
    var m = mcChains(C), e = m["mc-emancipation-reconstruction"];
    if (!e || !e.beat2Year) return null;
    var y1 = (e.year > 0) ? String(e.year) : "?", y2 = (e.beat2Year > 0) ? String(e.beat2Year) : "?";
    return {
      id: "mc-emancipation-reconstruction", cat: "Politics", tier: "minor",
      when: y1 + "–" + y2,
      title: "The Proclamation was remembered — emancipation carried the Reconstruction question onto the President's desk.",
      hist: "In history the two questions were argued together: Lincoln's Proclamation of Amnesty and Reconstruction (December 8, 1863) took up the terms of reunion — and what was owed the freedpeople — while the war still raged. (See the emancipation and Reconstruction decision cards' committed sources.)"
    };
  } catch (e) { return null; }
}
