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

/* ---- the data-driven SCENARIO REGISTRY (Phase C). Each historical battle is DATA (data/<battle>.json injected as
   GAME_DATA.<battle>) + one registry entry here; the engine (fldScenarioInit & the per-tick reinforce/UI seams) is
   battle-agnostic and reads the SAME shape for every scenario (field/attacker/defender/objective/leaders/supply/
   terrain[hills,walls,markers]/oob/reinforcements/teaching). Bull Run is just the first entry — adding Fredericksburg
   etc. is a data file + a line here, no new combat code. ---- */
function fldScenarioRegistry() {
  var R = {};
  try {
    if (typeof GAME_DATA !== "undefined") {
      if (GAME_DATA.bullrun && GAME_DATA.bullrun.bullrun1) R.bullrun1 = GAME_DATA.bullrun.bullrun1;
      if (GAME_DATA.fredericksburg && GAME_DATA.fredericksburg.fredericksburg) R.fredericksburg = GAME_DATA.fredericksburg.fredericksburg;
    }
  } catch (e) {}
  return R;
}
function fldScenarioData(id) { var R = fldScenarioRegistry(); return (id && R[id]) ? R[id] : null; }
/* back-compat alias: First Bull Run is the canonical first scenario (the menu button + briefing still call this). */
function fldBrData() { return fldScenarioData("bullrun1"); }
/* ---- a data OOB/reinforcement entry -> an fldMakeUnit spec. The on-field OOB carries its side via
   the data KEY (oob.US / oob.CS), not a per-entry field, so the side is passed in; reinforcement entries
   carry their own d.side. B-6 (command either side): the PLAYER's side (__FIELD.playerSide, resolved in
   fldInitSim BEFORE this runs) is the non-AI side; the other side is AI. With the default US player this is
   byte-identical to the old "(s === 'CS') ? true : !!autoBoth" — US -> !!autoBoth, CS -> true. ---- */
function fldBrSpec(d, side, autoBoth) {
  // B-6: the PLAYER's side is the non-AI side. Resolve via fldPlayerSide() (which honours a CS campaign live +
  // the explicit per-launch side) so a CS player commands the CS OOB; default "US" -> byte-identical AI flags.
  var s = d.side || side, ps = (typeof fldPlayerSide === "function") ? fldPlayerSide() : ((__FIELD.playerSide === "CS") ? "CS" : "US");
  return {
    id: d.id, side: s, name: d.name, arm: d.arm, weapon: d.weapon,
    commander: d.commander || null,   // B-2: the named brigade leader (HUD label; the leaders layer reads scenData.leaders)
    men: d.men, xp: d.xp || 1, x: d.x, z: d.z, facing: d.facing,
    formation: d.formation || "line", entry: d.entry || "",
    ai: (s === ps) ? !!autoBoth : true,
  };
}

/* ===========================================================================
   fldScenarioInit — the T0 build seam. Returns true once it has populated terrain
   + units + the reinforcement schedule + win thresholds (else false -> T0 sandbox).
   =========================================================================== */
function fldScenarioInit(opts) {
  // Phase C: data-driven — ANY registered scenario id builds from its data; "sandbox"/unknown falls through to T0.
  // Bull Run resolves the identical data object it always did (fldScenarioData("bullrun1")) -> byte-identical.
  if (!opts || !opts.scenario || opts.scenario === "sandbox") return false;
  var data = fldScenarioData(opts.scenario);
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
  // Phase C: a scenario may declare its AI attacker's posture (data.assaultDoctrine). "cautious" = the doomed
  // frontal assault (Fredericksburg): the AI attacker advances in line and trades but never column-rushes the
  // killing ground or presses the mass bayonet on a covered line, so the stone-wall defense is never carried by
  // the AI. Default (absent / any other value) = the full B-1 doctrine -> byte-identical for Bull Run.
  __FIELD._atkCautious = (data.assaultDoctrine === "cautious");
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
  // D67: First Bull Run DEFAULTS to fog ON (data.defaultFog) when fog was not explicitly pinned — the historically
  // faithful battle (smoke, broken terrain, green troops) in which fog AIDS THE DEFENDER, keeping the stacked
  // officers+logistics+arms config Confederate-favoured. An explicit opts.fog / G.settings.tacticalFog still wins
  // (so the probes that pin fog are unaffected). Set BEFORE fldResetRun so deploy-screen visibility primes correctly.
  if (!__FIELD._fogSpecified && data.defaultFog) __FIELD.fog = true;
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
  // batch the aria-live announcement: a single #fldLive update conveys EVERY revealed arrival this tick
  // (overwriting per-unit would let a screen reader hear only the last of a clustered arrival). B-6: hidden
  // enemy arrivals return "" from fldReinforceSpawn (the fog-leak guard) -> filter them out of the batch.
  var _spoken = arrivals.filter(Boolean); if (_spoken.length) fldAnnounce(_spoken.join("  "));
}
function fldReinforceSpawn(spec) {
  var u = fldMakeUnit(spec);
  // Phase A (A1): in a campaign-launched battle, a PLAYER-side reinforcement is conditioned by the
  // strategic war too (men / morale / re-arm) as it detrains — your war fields stronger reserves. No-op
  // for a standalone scenario (campaignCtx null) or an enemy unit (the conditioner is player-side-gated).
  if (__FIELD.campaignCtx && typeof fldCampaignConditionUnit === "function") { try { fldCampaignConditionUnit(u); } catch (e) {} }
  // a PLAYER-side (non-AI) reinforcement marches onto the field toward the objective on arrival — so it
  // joins the battle instead of idling in the rear (B-6: the player controls his OWN side per __FIELD.playerSide
  // — US by default, CS when the Confederate command is taken; the AI commands the other side + any autoBoth
  // side; the gate is the side-agnostic !u.ai). The player can redirect it once it is up. AI units run fldAiUnit.
  if (!u.ai && __FIELD.objective) {
    var ob = __FIELD.objective, f = Math.atan2(ob.x - u.x, -(ob.z - u.z));
    u.formation = "column";
    u.order = { type: "move", tx: ob.x + (u.x - ob.x) * 0.32, tz: ob.z + (u.z - ob.z) * 0.32, tface: f };
  }
  __FIELD.units.push(u);
  // B-6 fog-leak guard (invariant #2 — no enemy-info leak): cue an arrival (banner + the batched aria-live
  // announce) ONLY when the player can see it — his own side, or fog off, or the brigade is already scouted.
  // A hidden ENEMY detrainment under fog stays silent (you learn of it when you scout it). Fog OFF reveals every
  // arrival -> byte-identical to the pre-B-6 behaviour. fldVisible is a pure read (no sim mutation).
  var _ps = (typeof fldPlayerSide === "function") ? fldPlayerSide() : "US";
  var revealed = (u.side === _ps) || !__FIELD.fog || (typeof fldVisible === "function" && fldVisible(_ps, u));
  var line = "";
  if (revealed) {
    line = u.name + " arrives" + (spec.entry ? " — " + spec.entry : "") + "!";
    fldScenarioBanner(line, u.side);   // a visual banner per unit (they stack vertically)
  }
  // rebuild the 3D meshes so the fresh brigade appears (cheap: < 20 units; the next render syncs all).
  // B-4 (bug-hunt HIGH): also rebuild the ARM meshes — Griffin/Ricketts (art) and Stuart (cav) all DETRAIN as
  // reinforcements, so the once-at-init fld3dBuildArms found no art/cav and built nothing; without this rebuild
  // they would render as plain blocks (no gun/limber or horse/rider) in the default 3D Bull Run. fld3dBuildArms
  // self-disposes first, so the per-arrival rebuild is leak-safe (same justification as fld3dBuildUnits).
  if (__FIELD.mode3d && typeof window !== "undefined" && window.THREE && __FIELD.groups) {
    try { fld3dBuildUnits(); } catch (e) {}
    if (typeof fld3dBuildArms === "function") { try { fld3dBuildArms(); } catch (e) {} }
  }
  return line;
}

/* ===========================================================================
   UI:  the menu button · the pre-battle briefing · arrival banners · the end note
   =========================================================================== */
/* Phase C: the marquee battle buttons on the main menu — ONE per registered scenario, in date order with First
   Bull Run (the hand-authored opener) leading. Each opens a side-choice card, then launches with the chosen army.
   Returns the LAST button injected, so the caller can anchor the next menu item after the whole block. Idempotent
   (per-id). Bull Run is just the first entry now — adding a battle is a data file + a registry line, no new UI code. */
function fldInjectScenarioButtons(afterBtn) {
  var last = null;
  try {
    if (!afterBtn || !afterBtn.parentNode) return null;
    var reg = (typeof fldScenarioRegistry === "function") ? fldScenarioRegistry() : {};
    var order = fldScenarioMenuOrder(reg), prev = afterBtn;
    for (var i = 0; i < order.length; i++) {
      var id = order[i]; if (!reg[id]) continue;
      var b = _fldInjectOneScenarioButton(id, reg[id], prev);
      if (b) { prev = b; last = b; }
    }
  } catch (e) {}
  return last;
}
/* Marquee order: First Bull Run first (the opening battle + the hand-authored marquee), then the rest by year. */
function fldScenarioMenuOrder(reg) {
  var ids = [], k;
  for (k in reg) if (reg.hasOwnProperty(k)) ids.push(k);
  ids.sort(function (a, b) {
    if (a === "bullrun1") return -1; if (b === "bullrun1") return 1;
    var ya = (String((reg[a] || {}).date || "").match(/\d{4}/) || ["9999"])[0];
    var yb = (String((reg[b] || {}).date || "").match(/\d{4}/) || ["9999"])[0];
    if (ya !== yb) return ya < yb ? -1 : 1;
    return a < b ? -1 : (a > b ? 1 : 0);
  });
  return ids;
}
/* Inject ONE scenario's menu button after `afterBtn`, returning it (or the existing button). Bull Run keeps its
   bespoke hand-authored marquee button (id fldBullRunBtn); every other scenario gets a button built from its data
   (data.menu, else derived from name/date/blurb). The click opens the side-choice card, then launches the pick. */
function _fldInjectOneScenarioButton(id, data, afterBtn) {
  if (id === "bullrun1") return _fldInjectBullRunButton(afterBtn);
  try {
    var btnId = "fldScnBtn_" + id;
    var existing = document.getElementById(btnId); if (existing) return existing;
    if (!afterBtn || !afterBtn.parentNode || !data) return null;
    var menu = data.menu || {}, yr = (String(data.date || "").match(/\d{4}/) || [""])[0];
    var hl = menu.title || (String(data.name || id).split(" — ")[0].toUpperCase() + (yr ? " (" + yr + ")" : ""));
    var deck = menu.deck || (data.blurb ? String(data.blurb) : "A real-time historical battle — command either side.");
    var aria = menu.aria || (String(data.name || id) + (yr ? ", " + yr : "") + " — the real-time historical battle; command either army.");
    var b = document.createElement("button");
    b.className = "gn-btn"; b.id = btnId;
    b.setAttribute("aria-label", aria);
    b.innerHTML = '<span class="gn-hl">&#9876; BATTLE &mdash; ' + hl + '</span>' +
      '<span class="gn-deck">' + deck + '</span>';
    b.addEventListener("click", function () {
      if (typeof fldScenarioSideChoice === "function") fldScenarioSideChoice(id, function (side) { fldLaunchBattle(id, side); });
      else fldLaunchBattle(id, "US");
    });
    if (afterBtn.nextSibling) afterBtn.parentNode.insertBefore(b, afterBtn.nextSibling); else afterBtn.parentNode.appendChild(b);
    return b;
  } catch (e) { return null; }
}
/* The bespoke First Bull Run marquee button (the opener; hand-authored copy). Returns the button (or the existing
   one) so the registry loop can chain the next scenario after it. Unchanged from the B-6 button. */
function _fldInjectBullRunButton(afterBtn) {
  try {
    var existing = document.getElementById("fldBullRunBtn"); if (existing) return existing;
    if (!afterBtn || !afterBtn.parentNode) return null;
    if (!fldBrData()) return null;
    var b = document.createElement("button");
    b.className = "gn-btn"; b.id = "fldBullRunBtn";
    b.setAttribute("aria-label", "First Bull Run, 1861 — the real-time historical battle. Command either army: lead the Union assault to seize Henry House Hill, or hold the hill for the Confederacy against the attack.");
    b.innerHTML = '<span class="gn-hl">&#9876; BATTLE &mdash; FIRST BULL RUN (1861)</span>' +
      '<span class="gn-deck">The real First Manassas, brigade scale &mdash; command either side: storm Henry House Hill as the Union, or hold it for the Confederacy as the trains bring Jackson, Early, and Elzey to the field.</span>';
    // B-6: the menu button opens the side-choice card first (command the Union assault OR the Confederate defense),
    // then launches with the chosen side. The side must be picked BEFORE launch (it sets the units' AI flags).
    b.addEventListener("click", function () {
      if (typeof fldBullRunSideChoice === "function") fldBullRunSideChoice(function (side) { fldLaunchBattle("bullrun1", side); });
      else fldLaunchBattle("bullrun1", "US");
    });
    if (afterBtn.nextSibling) afterBtn.parentNode.insertBefore(b, afterBtn.nextSibling); else afterBtn.parentNode.appendChild(b);
    return b;
  } catch (e) { return null; }
}
function fldLaunchBattle(scn, side) {
  fldLaunchSandbox({ scenario: scn, renderer: "3d", playerSide: (side === "CS") ? "CS" : "US" });
  // Phase C: the pre-battle briefing fires for ANY registered scenario — fldBullRunBriefing reads __FIELD.scenData,
  // so it is battle-agnostic. No-op for the sandbox (no scenData) or a stripped build (fn missing).
  try { if (typeof fldBullRunBriefing === "function") fldBullRunBriefing(); } catch (e) {}
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
      // B-6: the objective copy follows the side you took (attack & seize vs hold & deny). fldBriefObjectiveHtml
      // falls back to the historical US-attacker text for a US player -> the standalone Bull Run reads as before.
      (typeof fldBriefObjectiveHtml === "function"
        ? fldBriefObjectiveHtml(fldPlayerSide(), sd, __FIELD.holdToWin)
        : '<div style="margin-top:12px;padding:9px 11px;background:#15110b;border:1px solid #715e3e;border-radius:5px;font-size:13px;line-height:1.5;"><b>Your objective:</b> seize and hold <b>' + sd.objective.name + '</b> for ' + __FIELD.holdToWin + 's — or break the enemy. The Confederate reserves arrive on the rail timeline, so win the morning before the trains run out. <b>This is your war:</b> a Union victory here rewrites 1861.</div>') /* wcag-auditor: contrast fix #3a3020->#715e3e border on #15110b (was 1.45:1, now 3.02:1) WCAG 1.4.11 */ +
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
/* the end-screen teaching payoff: "your war vs history" + the cards with provenance. Phase C: data-driven for any
   registered scenario — Bull Run keeps its hand-authored branch (byte-identical), every other battle draws its
   framing from sd.endNote (keyed by the winning side then the player's side). */
function fldScenarioEndHtml(winner) {
  var sd = __FIELD.scenData; if (!sd) return "";
  var cards = (sd.teaching && sd.teaching.cards) ? sd.teaching.cards : [];
  // B-6: the "your war vs history" pronoun follows the side you commanded. A US player reads the original
  // strings verbatim; a CS player (who DEFENDED) gets the mirror-image framing.
  var ps = (typeof fldPlayerSide === "function") ? fldPlayerSide() : "US";
  if (__FIELD.scenario === "bullrun1") {
    var hist;
    if (winner === "US") hist = (ps === "US")
      ? "History diverges. You took Henry House Hill — the ground that historically broke the Union assault. In 1861 McDowell's army lost it and streamed back to Washington in the 'Great Skedaddle'."
      : "History diverges. The Union carried Henry House Hill — the ground your army held in 1861. The historical stand here broke McDowell's assault; under your command, this time it gave way.";
    else if (winner === "CS") hist = (ps === "US")
      ? "History holds. As in 1861, the stand on Henry House Hill and the rail-borne brigades on Chinn Ridge carried the day for the Confederacy."
      : "History holds. As in 1861, your stand on Henry House Hill and the rail-borne brigades on Chinn Ridge carried the day for the Confederacy — McDowell's army lost the hill and streamed back to Washington in the 'Great Skedaddle'.";
    else hist = "A bloodier stalemate than history's clear Confederate victory — but the rebellion was not broken here.";
    return _fldScenarioEndBox(hist, cards);
  }
  // Phase C: any other registered scenario draws its framing from data (sd.endNote, keyed winner -> player side).
  var en = sd.endNote || null, hist2 = "";
  if (en) {
    if (winner === "draw") hist2 = en.draw || "";
    else { var w = en[winner]; hist2 = w ? (typeof w === "string" ? w : (w[ps] || w.US || w.CS || "")) : ""; }
  }
  if (!hist2 && !cards.length) return "";
  return _fldScenarioEndBox(hist2, cards);
}
/* the shared "Your war vs. history" + teaching-cards box — one markup source for every scenario end-screen.
   Byte-identical to the inline Bull Run markup it replaced (so the bullrun branch is unchanged on the wire). */
function _fldScenarioEndBox(hist, cards) {
  var out = '<div style="text-align:left;background:#15110b;border:1px solid #715e3e;border-radius:6px;padding:12px 14px;margin-bottom:16px;">' /* wcag-auditor: contrast fix #3a3020->#715e3e border on #15110b (was 1.45:1, now 3.02:1) WCAG 1.4.11 */ +
    '<div style="color:#d8c87a;font-weight:bold;margin-bottom:6px;">Your war vs. history</div>' +
    (hist ? '<div style="font-size:13px;opacity:.9;line-height:1.5;margin-bottom:8px;">' + hist + '</div>' : '');
  cards = cards || [];
  for (var i = 0; i < cards.length; i++) {
    out += '<div style="margin-top:9px;border-top:1px solid #6f5f3f;padding-top:7px;"><b style="color:#cdbb88;">' + cards[i].head + '</b>' /* wcag-auditor: contrast fix #2a2418->#6f5f3f divider on #15110b (was 1.22:1, now 3.03:1) WCAG 1.4.11 */ +
      '<div style="font-size:12.5px;opacity:.84;line-height:1.46;margin-top:1px;">' + cards[i].body + '</div>' +
      '<div style="font-size:11px;opacity:.55;margin-top:2px;">' + cards[i].provenance + '</div></div>';
  }
  out += '</div>';
  return out;
}
