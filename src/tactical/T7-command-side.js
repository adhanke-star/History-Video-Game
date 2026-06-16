/* ============================================================================
   src/tactical/T7-command-side.js  —  TACTICAL ENGINE · PHASE B-6 (COMMAND EITHER SIDE)

   The CS-player tactical mode (V1-CHECKLIST B-6, charter fork #10): you can now
   command EITHER army in a real-time battle. Pick the Confederacy and you DEFEND
   Henry House Hill while the B-1 attacker-AI doctrine presses you uphill — which is
   exactly what makes the B-1 attacker player-facing (the whole point of the fork).

   B-6 is NOT a new gated sim layer; it GENERALIZES the control/render/HUD layer that
   was hard-wired to a "US" player to read the authoritative __FIELD.playerSide
   instead. The plumbing was already half-built: the skirmish builder (T2 fldSkirmishOOB)
   already assigns u.ai by side, the campaign procedural briefing (T2) already speaks
   side-aware role text, and fldPlayerSide() (T3) already drove the B-2/B-3/B-4 display
   layers. The two gaps B-6 closes: (1) the input layer (fldPlayerSel & friends) and the
   render/HUD fog VIEWER were literal "US" (now fldPlayerSide()), and (2) the hand-authored
   First Bull Run scenario only ever fielded a US player (now honours a side toggle).

   This MODULE holds the genuinely-new B-6 helpers (the display-name helpers, the standalone
   Bull Run side-choice card, the side-aware briefing objective, and the end-screen "you"
   outcome line). The cross-cutting generalizations live as surgical seams in T0/T1/T3.

   BYTE-IDENTITY: the player side defaults to "US" (the historical Bull Run attacker), so
   every standalone/probe launch resolves exactly as before; the headless probes never reach
   the control/render layer at all (renderer "none"). Coverage = tools/probe-csplayer.mjs.
   Bare-name globals (G, __FIELD, FLD, openSheet, openMainMenu, the fld* helpers). No literal
   comment-closer inside this block.
   ============================================================================ */

/* The display-name helpers. "Union" / "Rebel" matches the existing HUD register; the FULL
   form ("Union" / "Confederate") matches the victory-title register. CVD-safe by design —
   the UI never relies on side COLOUR alone; the side is always named in text + iconography. */
function _fldSideName(side) { return side === "CS" ? "Rebel" : "Union"; }
function _fldSideNameFull(side) { return side === "CS" ? "Confederate" : "Union"; }

/* The side-aware "Your objective" block for the standalone Bull Run briefing. An ATTACKER
   must seize-and-hold the crest before the enemy reserves arrive; a DEFENDER must deny it to
   the clock (the historical Confederate task on Henry House Hill). __FIELD.attacker is set by
   the scenario (US at Bull Run), so the player's role follows from which side they command. */
function fldBriefObjectiveHtml(ps, sd, holdToWin) {
  var attacking = (__FIELD.attacker === ps);
  var objName = (sd && sd.objective && sd.objective.name) ? sd.objective.name : "the objective";
  // Phase C: the scenario-specific flavour sentence comes from the data (sd.brief.attack / .defend); a generic line
  // covers any battle that ships no brief block. The keyword SKELETON ("seize and hold" / "HOLD" / "deny") is
  // constant, so the role reads right — and probe-csplayer's side-aware assertion holds — for every scenario.
  var brief = (sd && sd.brief) ? sd.brief : null;
  var flavor = brief ? (attacking ? brief.attack : brief.defend) : null;
  if (!flavor) flavor = attacking
    ? '<b>This is your war:</b> a victory here, against the historical result, rewrites the campaign.'
    : '<b>This is your war:</b> hold the ground the defenders held, and deny the enemy his place in history.';
  var body = attacking
    ? '<b>Your objective:</b> seize and hold <b>' + objName + '</b> for ' + holdToWin + 's &mdash; or break the enemy. ' + flavor
    : '<b>Your objective:</b> <b>HOLD ' + objName + '</b> &mdash; deny it to the enemy until the clock runs out, or break their assault. ' + flavor;
  return '<div style="margin-top:12px;padding:9px 11px;background:#15110b;border:1px solid #715e3e;border-radius:5px;font-size:13px;line-height:1.5;">' + body + '</div>';
}

/* The end-screen "you" framing line — teaches from the side the player actually commanded,
   layered atop the factual "Union Victory / Confederate Victory" title. Role-aware (attacker
   vs defender) so "your assault was repulsed" reads right for an attacker and "your line held"
   for a defender. Returns "" for a draw with no extra colour. Pure string -> safe to skip in
   the headless probe (fldOnOver early-returns when there is no #fldEnd element). */
function fldPlayerOutcomeLine(winner) {
  var ps = (typeof fldPlayerSide === "function") ? fldPlayerSide() : "US";
  if (winner === "draw") return "The field is yours to dispute another day &mdash; neither army broke.";
  var won = (winner === ps);
  var attacking = (__FIELD.attacker === ps);
  if (__FIELD.attacker) {
    if (attacking) return won ? "You carried the position &mdash; the assault went home." : "Your assault was repulsed; the line you struck still holds the ground.";
    return won ? "You held the field &mdash; the enemy assault broke against your line." : "Your line was forced; the attackers took the ground you defended.";
  }
  // symmetric sandbox (no attacker): a plain win/loss of the crest.
  return won ? "You won the field." : "The enemy carried the field against you.";
}

/* The side-choice card for any registered scenario — pick the army you command before launch (the scenario builds
   the units' AI flags from the chosen side, so the choice must precede fldLaunchBattle). A period-broadsheet sheet
   matching the Skirmish menu; full keyboard + ARIA. Copy is DATA-DRIVEN (sd.sides — heading/intro/foot + a per-side
   title/badge/deck) with generic role fallbacks, so every battle gets its own card; the attacking side is listed
   first. `go` is the launcher callback, invoked with "US" or "CS". Falls back to a US launch when the sheet system
   is unavailable (headless / a stripped build) so the entry point never dead-ends. */
function fldScenarioSideChoice(id, go) {
  if (typeof openSheet !== "function") { go("US"); return; }
  var sd = (typeof fldScenarioData === "function") ? fldScenarioData(id) : null;
  var objName = (sd && sd.objective && sd.objective.name) ? sd.objective.name : "the objective";
  var sides = (sd && sd.sides) ? sd.sides : null;
  var atkSide = (sd && sd.attacker) ? sd.attacker : "US", defSide = (atkSide === "CS") ? "US" : "CS";
  var heading = (sides && sides.heading) ? sides.heading : ((sd && sd.name ? String(sd.name).split(" — ")[0] : "Battle") + " — Take Which Command?");
  var intro = (sides && sides.intro) ? sides.intro : ((sd && sd.date ? sd.date + " · " : "") + "Lead the army of your choosing.");
  var foot = (sides && sides.foot) ? sides.foot : ("The other army is commanded by the AI. Fog is " + ((sd && sd.defaultFog) ? "on" : "off") + " by default (press V in battle to toggle it).");
  function card(side) {
    var s = (sides && sides[side]) ? sides[side] : {}, attacking = (atkSide === side);
    var title = s.title || (attacking ? ("Lead the " + _fldSideNameFull(side)) : ("Hold for the " + _fldSideNameFull(side)));
    var badge = s.badge || (attacking ? "&#9876; ATTACK" : "&#9819; DEFEND");
    var deck = s.deck || (attacking
      ? ("Take the offensive and seize " + objName + " before the enemy reserves can arrive.")
      : ("Stand on " + objName + " and deny it to the enemy assault until the clock runs out."));
    return _fldBrSideCard(side, title, badge, deck, attacking);
  }
  var html = ''
    + '<h1 class="title-xl" style="text-align:center">' + heading + '</h1>'
    + '<p class="title-sub" style="text-align:center">' + intro + '</p>'
    + '<hr class="rule">'
    + '<div style="max-width:560px;margin:0 auto">'
    + '<div role="group" aria-label="Choose the army you will command" style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center">'
    + card(atkSide) + card(defSide)
    + '</div>'
    + '<p class="lede" style="font-size:11px;opacity:.6;margin-top:12px;text-align:center">' + foot + '</p>'
    + '<div class="btn-row" style="margin-top:12px;display:flex;gap:10px;justify-content:center">'
    + '<button id="fldBrSideBack" type="button" class="upg">Back</button>'
    + '</div></div>';
  openSheet(html);
  var cards = document.querySelectorAll('[data-brside]');
  for (var i = 0; i < cards.length; i++) {
    (function (c) {
      c.addEventListener("click", function () {
        var side = c.getAttribute("data-brside");
        try { if (typeof closeSheet === "function") closeSheet(); } catch (e) {}
        go(side === "CS" ? "CS" : "US");
      });
    })(cards[i]);
  }
  var back = document.getElementById("fldBrSideBack");
  if (back) back.addEventListener("click", function () { if (typeof openMainMenu === "function") openMainMenu(); });
  try { var first = document.querySelector('[data-brside]'); if (first) first.focus(); } catch (e) {}
}
/* back-compat: the First Bull Run menu button + probe-csplayer call fldBullRunSideChoice directly. */
function fldBullRunSideChoice(go) { return fldScenarioSideChoice("bullrun1", go); }
/* one commission-style choice card (a focusable button) for the Bull Run side picker. */
function _fldBrSideCard(side, title, badge, deck, attacking) {
  // accent is a SIDE identity colour (Union blue / Confederate butternut-red) — keyed to side, NOT to role, so it is
  // correct regardless of which army attacks. The spoken ROLE word follows `attacking` (the data-driven attacker),
  // not side, so a future CS-attacker scenario reads right (bug-hunt C-1: the aria role had been hardwired US=attack).
  if (typeof attacking === "undefined") attacking = (side === "US");   // back-compat default (US = the historical attacker)
  var accent = side === "US" ? "#6c8ebf" : "#b77668";   /* wcag-auditor: CS accent #b06a5a -> #b77668 (2.89:1->4.72:1 on .upg bg #241a10, AA body-text); decorative border also updated */ // CVD-safe: role named in text
  // bug-hunt (B-6): the aria-label is interpolated into a double-quoted attribute, so neutralize " and < in the
  // dynamic title/deck (a future data-driven objective.name could carry them). The literal " &mdash; " below is
  // part of the template (decoded to — by the parser), so it is left intact — we escape only the dynamic parts.
  var _aTitle = String(title).replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  var _aDeck = deck.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, " ").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  return '<button type="button" data-brside="' + side + '" class="upg" '
    + 'aria-label="' + _aTitle + ' &mdash; ' + (attacking ? "attack" : "defend") + '. ' + _aDeck + '" '
    + 'style="flex:1 1 220px;max-width:260px;text-align:left;padding:14px 15px;border-left:5px solid ' + accent + ';line-height:1.45;cursor:pointer">'
    + '<div style="font-size:12px;letter-spacing:1px;color:' + accent + '">' + badge + '</div>'/* wcag-auditor: removed opacity:.75 — effective ratio was 3.43:1 (US) / 2.89:1 (CS) on #241a10, both fail AA 4.5:1; full-opacity gives 5.09:1 / 4.72:1 */
    + '<div style="font-size:17px;font-weight:bold;margin:3px 0 5px;color:#e9dcc0">' + title + '</div>'
    + '<div style="font-size:12.5px;opacity:.85">' + deck + '</div></button>';
}
