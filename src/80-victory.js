/* ===========================================================================
   S1e · 80-victory.js — Paths to Victory + war momentum (the "you can win" layer).

   THE DESIGN-LAW CORRECTION (Aaron, run i): the asymmetric pressures S1c/S1d built
   were keyed to the CALENDAR (replacement ratio by year, recognition foreclosed at
   1863, ports fall on schedule) — which made Southern defeat feel SCRIPTED. The law
   is the opposite: §5 outcomes are DETERMINISTIC BY PLAYER PERFORMANCE (history is
   the favored "par", not a rail); §8 the South wins by NOT LOSING; §29 a fair
   sandbox. So this module computes a WAR-MOMENTUM signal and the S1c/S1d ticks now
   read it: WIN and the death spiral does not happen (desertion stops, the ranks
   refill, the ports hold, recognition stays open). History is only what you get if
   you play like the doomed Confederacy.

   It also gives the player EXECUTABLE avenues to victory — a Paths-to-Victory desk
   tab with live progress + Southern counter-levers (counter the blockade with
   raiders/runners/fortified ports; arm the enslaved — Cleburne's path; pursue
   recognition; deserter amnesty) and ahistorical WILD CARDS (provoke the Trent
   crisis) — so a Southern player can win, the alt-history way (§5 tiered divergence).

   Adds C.strategy (sibling state) + vicMomentum(C) (read by blockade/manpower).
   vicInit / vicOnResolve (tracks the enemy's WILL — break it → negotiated-peace
   victory — applies lever upkeep, detects victoryReady) / vicRenderPaths / vicWirePaths.

   Bare-name globals (G); vic-prefixed helpers; render never mutates or saves; the
   tick mutates C.strategy + C.funds and clock (lever costs) only.
   =========================================================================== */

/* ---- vicMomentum: the player side's WAR FORTUNES, 0 (losing) .. 1 (winning).
   The single performance signal the S1c/S1d pressures key off. Blends cumulative
   win-rate, home-front will (inverse weariness), and political capital. ---- */
function vicMomentum(C) {
  try {
    if (!C) return 0.5;
    var st = C.stats || {};
    var battles = st.battles || 0, won = st.won || 0;
    var winRate = battles > 0 ? (won / battles) : 0.5;
    var clk = C.clock || {};
    var weary = (typeof clk.weariness === "number") ? clk.weariness : 30;
    var cap = (typeof clk.capital === "number") ? clk.capital : 0;
    var willHold = 1 - Math.max(0, Math.min(1, weary / 100));
    var capF = Math.max(0, Math.min(1, cap / 120));
    return Math.max(0, Math.min(1, 0.55 * winRate + 0.30 * willHold + 0.15 * capF));
  } catch (e) { return 0.5; }
}

function _vicPush(C, line) { logPush(C && C.strategy, "log", line); }

/* ---- vicInit: idempotent; seeds C.strategy (levers + the enemy-will tracker). ---- */
function vicInit(C) {
  if (!C) return;
  var side = (C.side === "CS") ? "CS" : "US";
  if (!C.strategy) {
    C.strategy = {
      enemyWill: (side === "CS") ? 72 : 70,   // the OPPONENT's resolve (0..100). Break it → negotiated peace.
      // executable levers (mostly the Southern counter-game; the US gets the mirror):
      runnerInvestment: false,   // counter the blockade (funds upkeep → +importFactor, slower port loss)
      commerceRaiders: false,    // CSS Alabama — pressure enemy shipping/will (funds upkeep)
      pursueRecognition: false,  // spend political capital to keep the recognition window open
      fortifyPorts: false,       // hold the runner ports past their historical fall
      armEnslaved: false,        // Cleburne's path — a manpool surge at the cost of the war aim (1863+)
      amnesty: false,            // deserter amnesty (reduce desertion)
      trentAvailable: false,     // (legacy) — Trent is now in the wild-card catalog
      trentProvoked: false,
      armEnslavedShock: false,   // one-time legitimacy shock applied flag
      wildsPlayed: [],           // ids of alternate-history wild cards already engaged
      victoryReady: null,        // a path that has reached its win threshold (display + S5 hook)
      log: []
    };
  }
  var S = C.strategy;
  if (typeof S.enemyWill !== "number") S.enemyWill = (side === "CS") ? 72 : 70;
  var bools = ["runnerInvestment", "commerceRaiders", "pursueRecognition", "fortifyPorts", "armEnslaved", "amnesty", "trentAvailable", "trentProvoked", "armEnslavedShock"];
  for (var i = 0; i < bools.length; i++) if (typeof S[bools[i]] !== "boolean") S[bools[i]] = false;
  if (!Array.isArray(S.wildsPlayed)) S.wildsPlayed = [];
  if (typeof S.victoryReady === "undefined") S.victoryReady = null;
  if (!S.log) S.log = [];
}

/* ---- vicOnResolve: runs LAST in the tick. Updates the enemy's will from the
   battle result + raiders + slow war-weariness, charges lever upkeep, and detects
   a reachable victory path. Mutates C.strategy + C.funds/clock only. ---- */
function vicOnResolve(winnerSide, type, B, C, win) {
  if (!C) return;
  vicInit(C);
  try {
    var side = (C.side === "CS") ? "CS" : "US";
    var S = C.strategy;
    var year = (B && B.bd && typeof B.bd.year === "number") ? B.bd.year : (C.clock && C.clock.year) || 1861;

    // Lever upkeep — real trade-offs (paid each turn the lever is active).
    if (typeof C.funds === "number") {
      if (S.runnerInvestment) C.funds = Math.max(0, C.funds - 40);
      if (S.commerceRaiders) C.funds = Math.max(0, C.funds - 30);
    }
    if (S.pursueRecognition && C.clock && typeof C.clock.capital === "number") {
      C.clock.capital = Math.max(0, C.clock.capital - 6);
    }

    // The enemy's WILL to keep fighting. WINNING the war breaks it (the primary
    // Southern path); losing restores it; the long war erodes it slowly; raiders
    // and home-front pressure chip at it. This is performance-driven, not scripted.
    var d = 0;
    if (win) d -= (type === "decisive") ? 8 : 5;
    else if (type === "draw") d += 1;
    else d += 3;                                  // a Union win stiffens Northern resolve
    d -= 0.6;                                      // attrition: every season of war wearies the enemy a little
    if (S.commerceRaiders) d -= 1.2;               // commerce raiding bites the enemy's commerce + patience
    var cas = (B && B.casualties && B.enemySide) ? (B.casualties[B.enemySide] || 0) : 0;
    d -= Math.min(3, cas / 1500);                  // inflicting casualties wears the enemy down
    S.enemyWill = Math.max(0, Math.min(100, S.enemyWill + d));

    // One-time legitimacy shock when the South arms the enslaved (the contradiction).
    if (S.armEnslaved && !S.armEnslavedShock) {
      S.armEnslavedShock = true;
      if (C.clock && typeof C.clock.weariness === "number") C.clock.weariness = Math.min(100, C.clock.weariness + 6);
      _vicPush(C, "The Confederacy arms the enslaved — a new army at the price of its founding creed.");
    }

    // Wild card: the Trent crisis is provokable only early (1861-62), before it defused.
    S.trentAvailable = (side === "CS" && year <= 1862 && !S.trentProvoked);

    // Detect a reachable victory path (display + the S5 win hook).
    var mom = vicMomentum(C);
    var recog = (C.blockade && typeof C.blockade.recognition === "number") ? C.blockade.recognition : 0;
    var prevReady = S.victoryReady;
    S.victoryReady = null;
    if (S.enemyWill <= 30 && year >= 1864) S.victoryReady = "will";        // negotiated peace
    else if (recog >= 60) S.victoryReady = "recognition";
    else if (S.enemyWill <= 18) S.victoryReady = "will";                   // total collapse of enemy resolve, any year
    if (S.victoryReady && S.victoryReady !== prevReady) {
      _vicPush(C, S.victoryReady === "recognition"
        ? "Europe moves toward recognition — independence is within reach."
        : "Northern resolve is breaking — a negotiated peace is within reach.");
    }
  } catch (e) {}
}

/* Status word for a 0..1 momentum. */
function _vicMomWord(m) {
  if (m >= 0.66) return ["Winning the war", "#4a6b3a"];
  if (m >= 0.45) return ["Holding on", "#b8863b"];
  if (m >= 0.28) return ["Losing ground", "#c9712e"];
  return ["On the brink", "#9c3b2e"];
}

/* ---- The WILD-CARD CATALOG (R32/§5 alternate history) — ahistorical gambits for
   BOTH sides, tiered plausible -> long-shot -> fantastical/preposterous. One-shot
   opportunity cards on the Paths-to-Victory tab. Effects live in _vicApplyWild. ---- */
var _vicWILDCARDS = [
  // ---------------- Confederate ----------------
  { id: "cs-trent",        side: "CS", tier: "plausible",   yearMax: 1862, cost: "reckless",       title: "Provoke the Trent Crisis", desc: "Force the seizure of Confederate envoys into an Anglo-American war — the blockade shatters, recognition follows." },
  { id: "cs-invade-north", side: "CS", tier: "plausible",   cost: "high risk",     title: "Invade the North (Lee's gambit)", desc: "Carry the war to Pennsylvania — a victory on Northern soil could break the Union's will at a stroke (and risks your army)." },
  { id: "cs-cotton-inferno", side: "CS", tier: "plausible", cost: "−cotton",  title: "Burn the cotton, force the famine", desc: "Torch the crop to starve Europe's mills into recognition — at the cost of your own export revenue." },
  { id: "cs-cleburne",     side: "CS", tier: "longshot",    yearMin: 1863, cost: "legitimacy",     title: "Arm &amp; free the enslaved (Cleburne)", desc: "A vast new army from the South's own people — at the price of the Confederacy's reason for being." },
  { id: "cs-repeaters",    side: "CS", tier: "longshot",    cost: "−funds",   title: "Smuggle Spencer repeaters en masse", desc: "Run thousands of repeating rifles through the blockade — outgun the blue line seven shots to one." },
  { id: "cs-copperhead",   side: "CS", tier: "longshot",    cost: "−capital", title: "Foment the Northwest Conspiracy", desc: "Arm the Copperheads and the Sons of Liberty — set the Northern home front aflame." },
  { id: "cs-hunley",       side: "CS", tier: "longshot",    cost: "−funds",   title: "Launch a submarine fleet", desc: "Scale up the Hunley — torpedo boats break the blockade from below." },
  { id: "cs-maximilian",   side: "CS", tier: "fantastical", cost: "preposterous",  title: "Maximilian's legions march north", desc: "France's puppet empire in Mexico pours an expeditionary army across the Rio Grande. Recognition and rescue at once." },
  { id: "cs-stonewall",    side: "CS", tier: "fantastical", cost: "legend",        title: "Stonewall lives — the Valley ghost", desc: "The Confederacy's deadliest commander never falls. The blue armies learn to dread the name." },
  { id: "cs-decapitation", side: "CS", tier: "fantastical", cost: "all or nothing",title: "The Decapitation Plot", desc: "A daring strike at the Union's leadership. If the moment is right it throws the North into chaos — if not, it rallies them in fury." },
  { id: "cs-gold",         side: "CS", tier: "fantastical", cost: "fortune",       title: "A Confederate gold strike", desc: "Rebel prospectors hit a mother lode in the Arizona Territory — hard specie floods Richmond." },
  // ---------------- Union ----------------
  { id: "us-hardwar",      side: "US", tier: "plausible",   cost: "−morale",  title: "Hard War, early (Sherman's doctrine)", desc: "Make the South feel the war — march through its heartland and break its will to resist." },
  { id: "us-radical-emanc",side: "US", tier: "plausible",   cost: "political",     title: "Radical Emancipation, 1861", desc: "Free and arm the enslaved from the war's first year — a flood of USCT and the collapse of the slave economy." },
  { id: "us-anaconda",     side: "US", tier: "plausible",   cost: "−funds",   title: "Anaconda Overdrive", desc: "Throw everything at the blockade and the river war — strangle the cotton economy outright." },
  { id: "us-repeaters",    side: "US", tier: "longshot",    cost: "−funds",   title: "A repeater army", desc: "Re-arm the infantry with Spencer repeaters — seven shots to the rebels' one." },
  { id: "us-grant",        side: "US", tier: "longshot",    cost: "command",       title: "Grant from the start", desc: "Hand the war to the general who will not stop — relentless, grinding offensive." },
  { id: "us-greenback",    side: "US", tier: "longshot",    cost: "fortune",       title: "The Jay Cooke bond firehose", desc: "Mass-market war bonds to every household — fund an overwhelming force." },
  { id: "us-gatling",      side: "US", tier: "fantastical", cost: "preposterous",  title: "Gatling gun legions", desc: "Field the new rapid-fire guns in quantity — the future of slaughter, a year early." },
  { id: "us-russian",      side: "US", tier: "fantastical", cost: "diplomatic",    title: "The Russian alliance", desc: "The Tsar's fleet winters in New York and Charleston — and this time it stays to fight." },
  { id: "us-railart",      side: "US", tier: "fantastical", cost: "industrial",    title: "Armored trains &amp; rail artillery", desc: "Iron-clad locomotives carry siege guns to the front on the USMRR." },
  { id: "us-genstrike",    side: "US", tier: "fantastical", cost: "history",       title: "The general strike of the enslaved", desc: "Du Bois's general strike in full: the South's labor base downs tools and walks to Union lines en masse." }
];

/* Apply a wild card's mechanical effect. The single place effects live. */
function _vicApplyWild(C, id) {
  var S = C.strategy, BL = C.blockade || {}, M = C.manpower || {}, clk = C.clock || {};
  var mom = vicMomentum(C);
  var bump = function (k, v, cap) { if (typeof M[k] === "number") M[k] = Math.min(cap || 100, M[k] + v); };
  switch (id) {
    // Confederate
    case "cs-trent": BL.recognition = Math.min(100, (BL.recognition || 0) + 35); BL.recognitionForeclosed = false; S.enemyWill = Math.max(0, S.enemyWill - 12); break;
    case "cs-invade-north": S.enemyWill = Math.max(0, S.enemyWill - 15); if (typeof clk.weariness === "number") clk.weariness = Math.min(100, clk.weariness + 5); break;
    case "cs-cotton-inferno": BL.recognition = Math.min(100, (BL.recognition || 0) + 18); if (typeof BL.cottonStockK === "number") BL.cottonStockK = Math.round(BL.cottonStockK * 0.3); break;
    case "cs-cleburne": S.armEnslaved = true; break;
    case "cs-repeaters": bump("strength", 12); if (typeof BL.importFactor === "number") BL.importFactor = Math.min(1.1, BL.importFactor + 0.1); break;
    case "cs-copperhead": S.enemyWill = Math.max(0, S.enemyWill - 22); break;
    case "cs-hunley": S.fortifyPorts = true; if (typeof BL.importFactor === "number") BL.importFactor = Math.min(1.1, BL.importFactor + 0.15); break;
    case "cs-maximilian": S.enemyWill = Math.max(0, S.enemyWill - 25); BL.recognition = 85; BL.recognitionForeclosed = false; break;
    case "cs-stonewall": bump("strength", 15); S.enemyWill = Math.max(0, S.enemyWill - 10); break;
    case "cs-decapitation":
      if (mom >= 0.5) { S.enemyWill = Math.max(0, S.enemyWill - 30); _vicPush(C, "The decapitation strike lands — the Union government reels into chaos."); }
      else { S.enemyWill = Math.min(100, S.enemyWill + 12); if (typeof clk.weariness === "number") clk.weariness = Math.min(100, clk.weariness + 10); _vicPush(C, "The plot is exposed — the North rallies in fury."); }
      break;
    case "cs-gold": if (typeof C.funds === "number") C.funds += 4000; break;
    // Union
    case "us-hardwar": S.enemyWill = Math.max(0, S.enemyWill - 18); break;
    case "us-radical-emanc": M.usctUnlocked = true; if (typeof M.pool === "number") M.pool += 200; S.enemyWill = Math.max(0, S.enemyWill - 8); break;
    case "us-anaconda": S.enemyWill = Math.max(0, S.enemyWill - 12); break;
    case "us-repeaters": bump("strength", 14); break;
    case "us-grant": S.enemyWill = Math.max(0, S.enemyWill - 14); bump("strength", 6); break;
    case "us-greenback": if (typeof C.funds === "number") C.funds += 4000; break;
    case "us-gatling": bump("strength", 16); break;
    case "us-russian": S.enemyWill = Math.max(0, S.enemyWill - 15); break;
    case "us-railart": bump("strength", 12); S.enemyWill = Math.max(0, S.enemyWill - 8); break;
    case "us-genstrike": S.enemyWill = Math.max(0, S.enemyWill - 25); if (typeof M.pool === "number") M.pool += 250; M.usctUnlocked = true; break;
  }
}

/* Render the side's available wild cards, grouped by plausibility tier. */
function _vicWildSection(C) {
  var side = (C.side === "CS") ? "CS" : "US";
  var S = C.strategy, played = S.wildsPlayed || [];
  var year = (C.clock && C.clock.year) || (C.president && C.president.date && C.president.date.year) || 1861;
  var tiers = [["plausible", "Plausible — actively debated", "#4a6b3a"], ["longshot", "Long shot — documented but improbable", "#b8863b"], ["fantastical", "Fantastical — video-game wild", "#9c3b2e"]];
  var out = '<hr class="rule"><div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#9c3b2e;margin:2px 0 2px">Wild Cards &mdash; Alternate History</div>'
    + '<div style="font-size:11px;opacity:.65;margin-bottom:2px">Ahistorical gambits. Some plausible, some preposterous &mdash; the war is yours to bend.</div>';
  for (var ti = 0; ti < tiers.length; ti++) {
    var tier = tiers[ti][0], rows = "";
    for (var i = 0; i < _vicWILDCARDS.length; i++) {
      var w = _vicWILDCARDS[i];
      if (w.side !== side || w.tier !== tier) continue;
      if (w.yearMin && year < w.yearMin) continue;
      if (w.yearMax && year > w.yearMax) continue;
      var done = played.indexOf(w.id) >= 0;
      rows += '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:6px 0;border-bottom:1px dotted var(--rule)">'
        + '<div style="flex:1 1 auto"><b style="font-size:12px">' + w.title + '</b> <span style="font-size:10px;opacity:.5">' + w.cost + '</span>'
        + '<div style="font-size:11px;opacity:.7">' + w.desc + '</div></div>'
        + '<button id="wild_' + w.id + '" type="button" class="upg" style="flex:0 0 auto"' + (done ? ' disabled' : '') + '>' + (done ? 'Engaged &check;' : 'Engage') + '</button></div>';
    }
    if (rows) out += '<div style="margin-top:4px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:' + tiers[ti][2] + '">' + tiers[ti][1] + '</div>' + rows + '</div>';
  }
  return out;
}

/* ---- vicRenderPaths: the Paths to Victory desk tab. Side-aware; the Confederate
   view is the rich one (the counter-game). ---- */
function vicRenderPaths(C) {
  if (!C) return '';
  vicInit(C);
  var side = (C.side === "CS") ? "CS" : "US";
  var S = C.strategy;
  var mom = vicMomentum(C);
  var mw = _vicMomWord(mom);
  var year = (C.clock && C.clock.year) || (C.president && C.president.date && C.president.date.year) || 1861;
  var recog = (C.blockade && typeof C.blockade.recognition === "number") ? Math.round(C.blockade.recognition) : 0;
  var recogForeclosed = C.blockade && C.blockade.recognitionForeclosed;

  var pathCard = function (title, prog, statusTxt, statusCol, how) {
    prog = Math.max(0, Math.min(100, Math.round(prog)));
    return '<div style="margin:8px 0;padding:9px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.12)">'
      + '<div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:13px">' + title + '</b>'
      + '<span style="font-size:12px;color:' + statusCol + ';font-weight:bold">' + statusTxt + '</span></div>'
      + '<div style="height:8px;background:rgba(0,0,0,.25);border:1px solid var(--rule);border-radius:3px;overflow:hidden;margin:5px 0"><div style="height:100%;width:' + prog + '%;background:' + statusCol + '"></div></div>'
      + '<div style="font-size:11px;opacity:.72">' + how + '</div></div>';
  };

  var lever = function (id, on, label, desc, cost) {
    return '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:7px 0;border-bottom:1px dotted var(--rule)">'
      + '<div style="flex:1 1 auto"><b style="font-size:12px">' + label + '</b> <span style="font-size:10px;opacity:.6">' + cost + '</span>'
      + '<div style="font-size:11px;opacity:.7">' + desc + '</div></div>'
      + '<button id="' + id + '" type="button" class="upg" style="flex:0 0 auto">' + (on ? 'Active &check;' : 'Engage') + '</button></div>';
  };

  var head = '<div style="font-size:17px;font-weight:bold">Paths to Victory</div>'
    + '<div style="opacity:.78;font-size:12px">The war effort &mdash; <span style="color:' + mw[1] + ';font-weight:bold">' + mw[0] + '</span> '
    + '(momentum ' + Math.round(mom * 100) + '%). History is only what befalls a Confederacy that loses; win, and your war is your own.</div><hr class="rule">';

  if (side === "CS") {
    var willStatus = (S.enemyWill <= 30) ? ["The North will treat", "#4a6b3a"] : (S.enemyWill <= 55) ? ["Northern resolve cracking", "#b8863b"] : ["The North fights on", "#9c3b2e"];
    var recogStatus = recogForeclosed ? ["Foreclosed", "#7a241b"] : (recog >= 45) ? ["Courted", "#4a6b3a"] : (recog >= 20) ? ["Possible", "#b8863b"] : ["Distant", "#c9712e"];
    var paths = ''
      + '<div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin:2px 0 2px">How the South wins</div>'
      + pathCard('Break Northern Will &rarr; Negotiated Peace', 100 - S.enemyWill, willStatus[0], willStatus[1],
          'The surest road: win battles, raid the North, inflict losses, and outlast Northern patience to the 1864 election. ' + (year >= 1864 ? 'It is 1864 &mdash; the hour is now.' : 'Build the pressure before November 1864.'))
      + pathCard('Foreign Recognition &amp; Intervention', recogForeclosed ? 8 : Math.max(recog, 8), recogStatus[0], recogStatus[1],
          recogForeclosed ? 'The window closed after Antietam &mdash; only a dramatic reversal (or the Trent crisis) reopens it.' : 'Win on the field, keep the cotton flowing, and press the cause in London &amp; Paris.')
      + pathCard('Military Conquest', Math.min(100, ((C.stats && C.stats.won) || 0) * 8), ((C.stats && C.stats.won) || 0) + ' victories', '#b8863b',
          'Destroy the Union armies and march on Washington. The longest road &mdash; but a captured capital ends the war outright.');

    var levers = ''
      + '<hr class="rule"><div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin:2px 0 2px">Levers of the war</div>'
      + lever('vicRunner', S.runnerInvestment, 'Invest in blockade-runners', 'Faster, surer runners &mdash; more arms get through, more cotton sold.', '(-40 funds/turn)')
      + lever('vicRaiders', S.commerceRaiders, 'Commission commerce raiders', 'CSS Alabama &amp; her sisters prey on Union shipping &mdash; bleeding Northern trade and patience.', '(-30 funds/turn)')
      + lever('vicFortify', S.fortifyPorts, 'Fortify the runner ports', 'Hold Wilmington, Charleston &amp; Mobile past their historical fall &mdash; keep the lifeline open.', '')
      + lever('vicRecog', S.pursueRecognition, 'Press for recognition', 'Spend political capital in Europe to keep the door from closing.', '(-6 capital/turn)')
      + lever('vicAmnesty', S.amnesty, 'Amnesty for deserters', 'Pardon and recall the absent &mdash; stem the bleeding of the ranks.', '')
      + (year >= 1863
          ? lever('vicArm', S.armEnslaved, "Arm &amp; free the enslaved (Cleburne's plan)", 'A vast new army from the South\'s own people &mdash; at the price of the Confederacy\'s reason for being. The boldest divergence.', '(legitimacy shock)')
          : '<div style="padding:7px 0;font-size:11px;opacity:.5;border-bottom:1px dotted var(--rule)">Arm the enslaved &mdash; Cleburne will propose it; available from 1863.</div>');

    var wild = _vicWildSection(C);

    var teach = '<div id="vicWhyBox" style="display:none;margin-top:10px;padding:10px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.12);font-size:12px;line-height:1.5"></div>'
      + '<div class="btn-row" style="margin-top:10px"><button id="vicWhy" type="button" class="upg">Can the South really win?</button></div>';

    return head + paths + levers + wild + teach;
  }

  // US (the mirror — lighter; Aaron's focus is the Southern counter-game).
  var usPaths = ''
    + '<div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin:2px 0 2px">How the Union wins</div>'
    + pathCard('Conquer the Confederacy', Math.min(100, ((C.stats && C.stats.won) || 0) * 8), ((C.stats && C.stats.won) || 0) + ' victories', '#4a6b3a',
        'Destroy the rebel armies and take Richmond &mdash; the decisive military road.')
    + pathCard('Hold the Political Will', 100 - ((C.clock && C.clock.weariness) || 0), (C.clock && C.clock.weariness >= 60) ? 'Eroding' : 'Holding', (C.clock && C.clock.weariness >= 60) ? '#c9712e' : '#4a6b3a',
        'Sustain Northern resolve to November 1864 &mdash; lose the election and the peace party may concede the South.')
    + pathCard('Strangle by Blockade', 100 - Math.round(((C.blockade && C.blockade.importFactor) || 1) * 90), 'The Anaconda', '#b8863b',
        'Tighten the blockade, take the rebel ports, and choke the cotton economy until the South cannot fight.');
  return head + usPaths + _vicWildSection(C)
    + '<div id="vicWhyBox" style="display:none;margin-top:10px;padding:10px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.12);font-size:12px;line-height:1.5"></div>'
    + '<div class="btn-row" style="margin-top:10px"><button id="vicWhy" type="button" class="upg">The Union\'s harder problem</button></div>';
}

function _vicWhyText(C) {
  var side = (C && C.side === "CS") ? "CS" : "US";
  if (side === "CS") {
    return '<b>Yes &mdash; and the real Confederacy nearly did.</b> The South did not need to conquer the North; it needed only to make the war cost more than the Union would pay. '
      + 'It came genuinely close twice: the autumn-1862 British recognition crisis (Antietam closed it &mdash; but a Confederate win there might not have), and the summer of 1864, when Lincoln himself expected to lose re-election to a peace platform until Atlanta fell. '
      + 'In <i>your</i> war the dice are not loaded toward history (§5): win, and the desertion, the inflation, the foreclosed recognition do not befall you. Outlast Northern will, court Europe, break the blockade, even arm the enslaved &mdash; the roads are open. '
      + '<span style="opacity:.7">McPherson; Howard Jones; Gallagher. Verified history; the divergence is yours to make.</span>';
  }
  return '<b>The Union\'s burden is that it must WIN; the South need only not lose.</b> Holding Northern political will &mdash; especially to the 1864 election &mdash; is as much a victory condition as taking Richmond. '
    + 'Win decisively and quickly, or the war-weariness the rebels are counting on becomes their path to a negotiated independence. <span style="opacity:.7">McPherson, Battle Cry of Freedom. Verified.</span>';
}

/* ---- vicWirePaths: the lever toggles + the teaching expander. ---- */
function vicWirePaths(C) {
  if (!C || !C.strategy) return;
  var S = C.strategy;
  var toggle = function (id, key, oneWay) {
    var b = document.getElementById(id);
    if (!b) return;
    b.addEventListener("click", function () {
      if (oneWay) S[key] = true; else S[key] = !S[key];
      if (typeof saveLocal === "function") saveLocal();
      if (typeof _wdRefresh === "function") _wdRefresh();
    });
  };
  toggle("vicRunner", "runnerInvestment");
  toggle("vicRaiders", "commerceRaiders");
  toggle("vicFortify", "fortifyPorts");
  toggle("vicRecog", "pursueRecognition");
  toggle("vicAmnesty", "amnesty");
  toggle("vicArm", "armEnslaved", true);          // one-way (you cannot un-free people)
  // Wild-card catalog — each engages once, applies its alternate-history effect.
  for (var wi = 0; wi < _vicWILDCARDS.length; wi++) {
    (function (w) {
      var b = document.getElementById("wild_" + w.id);
      if (!b) return;
      b.addEventListener("click", function () {
        if (!S.wildsPlayed) S.wildsPlayed = [];
        if (S.wildsPlayed.indexOf(w.id) >= 0) return;
        S.wildsPlayed.push(w.id);
        _vicApplyWild(C, w.id);
        _vicPush(C, "Alternate history — " + (w.title || w.id).replace(/&amp;/g, "&") + ".");
        if (typeof saveLocal === "function") saveLocal();
        if (typeof _wdRefresh === "function") _wdRefresh();
      });
    })(_vicWILDCARDS[wi]);
  }
  var why = document.getElementById("vicWhy");
  if (why) why.addEventListener("click", function () {
    var box = document.getElementById("vicWhyBox");
    if (!box) return;
    if (box.style.display === "none") { box.innerHTML = _vicWhyText(C); box.style.display = "block"; }
    else box.style.display = "none";
  });
}
