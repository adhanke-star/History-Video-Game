/* ============================================================================
   src/tactical/T1-bull-run.js  —  TACTICAL ENGINE · P1a (the FIRST BULL RUN scenario)

   The first REAL battle on the __FIELD real-time engine: First Bull Run (First
   Manassas), July 21, 1861, at brigade scale, on a historical-terrain field, with
   the rail-pivot REINFORCEMENT TIMELINE as the teaching mechanic. Per the run-k
   charter (DECISIONS D54/D55) the tactical engine is built FIRST; D56 shipped the
   P0 sandbox; this is the P1a vertical slice (scale to the real OOB + historical
   terrain + strategic conditioning via the reinforcement schedule + a tactical-only
   FREE entry from the menu). The hex-mode toggle, full owner-mode bridge
   conditioning, and deeper PBR/HDRI are the subsequent P1b/P1c slices.

   ARCHITECTURE (the design judge-panel verdict, logged as D57):
   - EXTENSION via the T0 SCENARIO SEAMS (NOT an override of T0's sim loop). T0
     (src/tactical/T0-field-sandbox.js) exposes three no-op-by-default seams keyed on
     __FIELD.scenario: fldScenarioInit (build), fldScenarioTick (per-tick reinforce
     hook), fldInjectScenarioButtons + fldScenarioEndHtml (UI). The sandbox path is
     untouched -> probe-field 13/13 holds by construction; Classic is never touched.
   - THIS MODULE ORCHESTRATES ONLY: it builds terrain, instantiates the OOB via
     fldMakeUnit, and splices reinforcements on schedule. It NEVER duplicates combat /
     morale / objective math — every per-unit computation flows through T0's unchanged
     leaf helpers via the shared fldSimStep, so a future T0 balance fix reaches Bull
     Run automatically.
   - DETERMINISM: reinforcements spawn in array order at scheduled sim-times, with
     ZERO spawn-time RNG (fldMakeUnit consumes none) -> same seed => same battle.

   Content: data/bullrun.json (GAME_DATA.bullrun.bullrun1) — the engaged main-field
   OOB distilled from HISTORICAL-DATA.md, provenance-tagged, anti-Lost-Cause. Bare-name
   globals only (GAME_DATA, __FIELD, FLD, and the fld* helpers from T0). All new helpers
   are uniquely prefixed and defined once. No literal comment-closer in this block.
   ============================================================================ */

/* ---- the scenario data (one place) ---- */
function fldBrData() {
  try { if (typeof GAME_DATA !== "undefined" && GAME_DATA.bullrun && GAME_DATA.bullrun.bullrun1) return GAME_DATA.bullrun.bullrun1; } catch (e) {}
  return null;
}
/* ---- a data OOB/reinforcement entry -> an fldMakeUnit spec (player = US; CS is AI).
   The on-field OOB carries its side via the data KEY (oob.US / oob.CS), not a per-entry
   field, so the side is passed in; reinforcement entries carry their own d.side. ---- */
function fldBrSpec(d, side, autoBoth) {
  var s = d.side || side;
  return {
    id: d.id, side: s, name: d.name, arm: d.arm, weapon: d.weapon,
    men: d.men, xp: d.xp || 1, x: d.x, z: d.z, facing: d.facing,
    formation: d.formation || "line", entry: d.entry || "",
    ai: (s === "CS") ? true : !!autoBoth,
  };
}

/* ===========================================================================
   fldScenarioInit — the T0 build seam. Returns true once it has populated terrain
   + units + the reinforcement schedule + win thresholds (else false -> T0 sandbox).
   =========================================================================== */
function fldScenarioInit(opts) {
  if (!opts || opts.scenario !== "bullrun1") return false;
  var data = fldBrData();
  if (!data || !data.oob || !data.terrain || !data.objective) return false;   // data missing/malformed -> fall back to the sandbox
  __FIELD.scenData = data;
  __FIELD.autoBoth = !!opts.autoBoth;
  // terrain: the multi-hill / multi-wall / markers shape the generalized T0 readers + renderers expect.
  __FIELD.terrain = data.terrain;
  __FIELD.objective = { x: data.objective.x, z: data.objective.z, r: data.objective.r, name: data.objective.name };
  __FIELD.holdToWin = data.holdToWinSec || FLD.HOLD_TO_WIN;
  __FIELD.timeLimit = data.timeLimitSec || FLD.TIME_LIMIT;
  __FIELD.attacker = data.attacker || "US";   // asymmetric: the Union must SEIZE the hill; the CS denies it
  __FIELD.defender = data.defender || "CS";
  // OOB present on the field at T=0
  var units = [], us = data.oob.US || [], cs = data.oob.CS || [], i;
  for (i = 0; i < us.length; i++) units.push(fldMakeUnit(fldBrSpec(us[i], "US", __FIELD.autoBoth)));
  for (i = 0; i < cs.length; i++) units.push(fldMakeUnit(fldBrSpec(cs[i], "CS", __FIELD.autoBoth)));
  __FIELD.units = units;
  // reinforcement schedule: sorted by arrival, spawned IN ARRAY ORDER, no spawn-time RNG.
  var sched = [], rs = data.reinforcements || [];
  for (i = 0; i < rs.length; i++) sched.push({ atSec: rs[i].atSec, spec: fldBrSpec(rs[i], rs[i].side, __FIELD.autoBoth), done: false });
  sched.sort(function (a, b) { return a.atSec - b.atSec; });
  __FIELD.reinforce = sched;
  fldResetRun();   // shared T0 deploy/clock/selection reset (one source of truth)
  return true;
}

/* ===========================================================================
   fldScenarioTick — the T0 per-tick seam. Splices in any reinforcement whose
   scheduled sim-time has arrived (idempotent; array order; deterministic).
   =========================================================================== */
function fldScenarioTick(dt) {
  var r = __FIELD.reinforce; if (!r) return;
  var arrivals = [];
  for (var i = 0; i < r.length; i++) {
    var e = r[i];
    if (!e.done && __FIELD.t >= e.atSec) { e.done = true; arrivals.push(fldReinforceSpawn(e.spec)); }
  }
  // batch the aria-live announcement: a single #fldLive update conveys EVERY arrival in this tick
  // (overwriting per-unit would let a screen reader hear only the last of a clustered arrival).
  if (arrivals.length) fldAnnounce(arrivals.join("  "));
}
function fldReinforceSpawn(spec) {
  var u = fldMakeUnit(spec);
  // a PLAYER-side (non-AI) reinforcement marches onto the field toward the objective on arrival — so it
  // joins the battle instead of idling in the rear (the player controls only the US; the AI commands the
  // CS + any autoBoth side). The player can redirect it once it is up. AI units are driven by fldAiUnit.
  if (!u.ai && __FIELD.objective) {
    var ob = __FIELD.objective, f = Math.atan2(ob.x - u.x, -(ob.z - u.z));
    u.formation = "column";
    u.order = { type: "move", tx: ob.x + (u.x - ob.x) * 0.32, tz: ob.z + (u.z - ob.z) * 0.32, tface: f };
  }
  __FIELD.units.push(u);
  var line = u.name + " arrives" + (spec.entry ? " — " + spec.entry : "") + "!";
  fldScenarioBanner(line, u.side);   // a visual banner per unit (they stack vertically)
  // rebuild the 3D meshes so the fresh brigade appears (cheap: < 20 units; the next render syncs all).
  if (__FIELD.mode3d && typeof window !== "undefined" && window.THREE && __FIELD.groups) { try { fld3dBuildUnits(); } catch (e) {} }
  return line;
}

/* ===========================================================================
   UI:  the menu button · the pre-battle briefing · arrival banners · the end note
   =========================================================================== */
function fldInjectScenarioButtons(afterBtn) {
  try {
    if (document.getElementById("fldBullRunBtn")) return;
    if (!afterBtn || !afterBtn.parentNode) return;
    if (!fldBrData()) return;
    var b = document.createElement("button");
    b.className = "gn-btn"; b.id = "fldBullRunBtn";
    b.setAttribute("aria-label", "First Bull Run, 1861 — the real-time historical battle. Turn the Confederate left and seize Henry House Hill before the Confederate reinforcements arrive by rail.");
    b.innerHTML = '<span class="gn-hl">&#9876; BATTLE &mdash; FIRST BULL RUN (1861)</span>' +
      '<span class="gn-deck">The real First Manassas, brigade scale: turn the Confederate left, take Henry House Hill &mdash; and beat the trains bringing Jackson, Early, and Elzey to the field.</span>';
    b.addEventListener("click", function () { fldLaunchBattle("bullrun1"); });
    if (afterBtn.nextSibling) afterBtn.parentNode.insertBefore(b, afterBtn.nextSibling); else afterBtn.parentNode.appendChild(b);
  } catch (e) {}
}
function fldLaunchBattle(scn) {
  fldLaunchSandbox({ scenario: scn, renderer: "3d" });
  if (scn === "bullrun1") { try { fldBullRunBriefing(); } catch (e) {} }
}
function fldBullRunBriefing() {
  var root = document.getElementById("fldRoot"); if (!root) return;
  var sd = __FIELD.scenData; if (!sd) return;   // the top-bar title is set each frame by fldRenderTop from scenData.name
  if (document.getElementById("fldBrief")) return;
  var ov = document.createElement("div");
  ov.id = "fldBrief";
  ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "Battle briefing: " + sd.name);
  ov.style.cssText = "position:absolute;inset:0;z-index:6000;display:flex;align-items:center;justify-content:center;background:#070a0ecc;";
  var cards = (sd.teaching && sd.teaching.cards) ? sd.teaching.cards : [], teach = "", n = Math.min(2, cards.length);
  for (var i = 0; i < n; i++) teach += '<div style="margin-top:10px;"><b style="color:#d8c87a;">' + cards[i].head + '</b><div style="opacity:.85;font-size:13px;margin-top:2px;line-height:1.45;">' + cards[i].body + '</div></div>';
  ov.innerHTML =
    '<div style="max-width:600px;max-height:86vh;overflow:auto;background:#0c0f14;border:1px solid #745e3f;border-radius:8px;padding:22px 26px;">' /* wcag-auditor: contrast fix #4a3c28->#745e3f border on #0c0f14 (was 1.80:1, now 3.12:1) WCAG 1.4.11 */ +
      '<div style="font-size:12px;letter-spacing:2px;opacity:.7;">' + sd.date + ' &middot; ' + sd.place + '</div>' +
      '<div style="font-size:24px;color:#e9dcc0;margin:2px 0 8px;">' + sd.name + '</div>' +
      '<div style="opacity:.9;font-size:14px;line-height:1.5;">' + sd.blurb + '</div>' +
      '<div style="margin-top:12px;padding:9px 11px;background:#15110b;border:1px solid #715e3e;border-radius:5px;font-size:13px;line-height:1.5;"><b>Your objective:</b> seize and hold <b>' + sd.objective.name + '</b> for ' + __FIELD.holdToWin + 's — or break the enemy. The Confederate reserves arrive on the rail timeline, so win the morning before the trains run out. <b>This is your war:</b> a Union victory here rewrites 1861.</div>' /* wcag-auditor: contrast fix #3a3020->#715e3e border on #15110b (was 1.45:1, now 3.02:1) WCAG 1.4.11 */ +
      teach +
      '<div style="opacity:.6;font-size:11px;margin-top:12px;line-height:1.4;">' + sd.provenance + '</div>' +
      '<div style="text-align:center;margin-top:16px;"><button id="fldBriefGo" style="background:#1c1610;color:#e9dcc0;border:1px solid #736241;border-radius:4px;padding:9px 18px;font:14px Georgia,serif;cursor:pointer;">Take command &#9654;</button></div>' /* wcag-auditor: contrast fix #6a5a3c->#736241 border on #1c1610/#0c0f14 (was 2.68:1, now 3.03/3.25:1) WCAG 1.4.11 */ +
    '</div>';
  root.appendChild(ov);
  var go = document.getElementById("fldBriefGo");
  var close = function () { if (ov.parentNode) ov.parentNode.removeChild(ov); try { var rr = document.getElementById("fldRoot"); if (rr) rr.focus(); } catch (e) {} };
  // modal keyboard: Esc closes ONLY the briefing (stopPropagation so it never reaches fldKey -> fldExit),
  // and Tab is trapped to the single Take-command button so focus cannot leak to the canvas/controls behind.
  ov.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); close(); }
    else if (e.key === "Tab") { e.preventDefault(); if (go) go.focus(); }
  });
  if (go) { go.addEventListener("click", close); try { go.focus(); } catch (e) {} }
  fldAnnounce("Briefing: " + sd.name + ". " + sd.blurb);
}
function fldScenarioBanner(text, side) {
  try {
    var root = document.getElementById("fldRoot"); if (!root) return;
    var stack = root.querySelectorAll(".fldBanner").length;   // stack vertically so clustered arrivals don't overlap
    var col = side === "US" ? "#6c8ebf" : (side === "CS" ? "#c08574" : "#9a8a5c");
    var b = document.createElement("div");
    b.className = "fldBanner";
    b.setAttribute("role", "status");
    b.style.cssText = "position:absolute;top:" + (52 + stack * 38) + "px;left:50%;transform:translateX(-50%);z-index:5500;background:#0c0f14f2;border:1px solid " + col + ";border-left:5px solid " + col + ";border-radius:5px;padding:7px 14px;color:#f2e8d5;font:14px Georgia,serif;max-width:74vw;white-space:nowrap;box-shadow:0 2px 12px #000a;";
    b.textContent = text;
    root.appendChild(b);
    setTimeout(function () { try { if (b.parentNode) b.parentNode.removeChild(b); } catch (e) {} }, 3800);
  } catch (e) {}
}
/* the end-screen teaching payoff: "your war vs history" + the cards with provenance */
function fldScenarioEndHtml(winner) {
  var sd = __FIELD.scenData; if (!sd || __FIELD.scenario !== "bullrun1") return "";
  var hist = winner === "US"
    ? "History diverges. You took Henry House Hill — the ground that historically broke the Union assault. In 1861 McDowell's army lost it and streamed back to Washington in the 'Great Skedaddle'."
    : (winner === "CS"
      ? "History holds. As in 1861, the stand on Henry House Hill and the rail-borne brigades on Chinn Ridge carried the day for the Confederacy."
      : "A bloodier stalemate than history's clear Confederate victory — but the rebellion was not broken here.");
  var cards = (sd.teaching && sd.teaching.cards) ? sd.teaching.cards : [];
  var out = '<div style="text-align:left;background:#15110b;border:1px solid #715e3e;border-radius:6px;padding:12px 14px;margin-bottom:16px;">' /* wcag-auditor: contrast fix #3a3020->#715e3e border on #15110b (was 1.45:1, now 3.02:1) WCAG 1.4.11 */ +
    '<div style="color:#d8c87a;font-weight:bold;margin-bottom:6px;">Your war vs. history</div>' +
    '<div style="font-size:13px;opacity:.9;line-height:1.5;margin-bottom:8px;">' + hist + '</div>';
  for (var i = 0; i < cards.length; i++) {
    out += '<div style="margin-top:9px;border-top:1px solid #6f5f3f;padding-top:7px;"><b style="color:#cdbb88;">' + cards[i].head + '</b>' /* wcag-auditor: contrast fix #2a2418->#6f5f3f divider on #15110b (was 1.22:1, now 3.03:1) WCAG 1.4.11 */ +
      '<div style="font-size:12.5px;opacity:.84;line-height:1.46;margin-top:1px;">' + cards[i].body + '</div>' +
      '<div style="font-size:11px;opacity:.55;margin-top:2px;">' + cards[i].provenance + '</div></div>';
  }
  out += '</div>';
  return out;
}
