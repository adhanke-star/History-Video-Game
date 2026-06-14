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

function _vicPush(C, line) {
  try {
    if (!C.strategy.log) C.strategy.log = [];
    C.strategy.log.unshift(line);
    if (C.strategy.log.length > 6) C.strategy.log.length = 6;
  } catch (e) {}
}

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
      trentAvailable: false,     // wild card: the Trent crisis becomes provokable (early war)
      trentProvoked: false,
      armEnslavedShock: false,   // one-time legitimacy shock applied flag
      victoryReady: null,        // a path that has reached its win threshold (display + S5 hook)
      log: []
    };
  }
  var S = C.strategy;
  if (typeof S.enemyWill !== "number") S.enemyWill = (side === "CS") ? 72 : 70;
  var bools = ["runnerInvestment", "commerceRaiders", "pursueRecognition", "fortifyPorts", "armEnslaved", "amnesty", "trentAvailable", "trentProvoked", "armEnslavedShock"];
  for (var i = 0; i < bools.length; i++) if (typeof S[bools[i]] !== "boolean") S[bools[i]] = false;
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

    var wild = S.trentAvailable
      ? '<hr class="rule"><div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#9c3b2e;margin:2px 0 2px">Wild card &mdash; alternate history</div>'
        + lever('vicTrent', S.trentProvoked, 'Provoke the Trent crisis', 'Force the seizure of Confederate envoys into an Anglo-American war &mdash; the blockade shatters, recognition follows. Reckless. Magnificent.', '(one chance, 1861-62)')
      : '';

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
  return head + usPaths
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
  var trent = document.getElementById("vicTrent");
  if (trent) trent.addEventListener("click", function () {
    S.trentProvoked = true; S.trentAvailable = false;
    // the gamble pays in recognition + a blow to Northern will
    if (C.blockade) { C.blockade.recognition = Math.min(100, (C.blockade.recognition || 0) + 35); C.blockade.recognitionForeclosed = false; }
    S.enemyWill = Math.max(0, S.enemyWill - 12);
    _vicPush(C, "The Trent crisis is provoked — Britain and the Union stand on the brink of war.");
    if (typeof saveLocal === "function") saveLocal();
    if (typeof _wdRefresh === "function") _wdRefresh();
  });
  var why = document.getElementById("vicWhy");
  if (why) why.addEventListener("click", function () {
    var box = document.getElementById("vicWhyBox");
    if (!box) return;
    if (box.style.display === "none") { box.innerHTML = _vicWhyText(C); box.style.display = "block"; }
    else box.style.display = "none";
  });
}
