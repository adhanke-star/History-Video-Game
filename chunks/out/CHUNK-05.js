/* ==== §13 — CAMPAIGN (CHUNK-05) ==== */

// ---- defaultFor(type, year, side) — local helper ----
// Returns the historically appropriate starter weapon key for a roster entry.
function defaultFor(type, year, side) {
  if (type === "inf") return infWeapon(year, side);
  if (type === "art") return artWeapon(year);
  if (type === "cav") return cavWeapon(year, side);
  return null;
}

// ---- startCampaign(side, iron) ----
// Initialises G.campaign and builds the starting 12-unit roster, then launches battle 0.
function startCampaign(side, iron) {
  // Determine the year of the first chain battle for weapon selection.
  const firstId = CHAINS[side][0];
  const firstBd = BATTLES.find(function(b){ return b.id === firstId; });
  const firstYear = firstBd ? firstBd.year : 1861;

  G.campaign = {
    side:      side,
    iron:      !!iron,
    idx:       0,
    funds:     300,
    recovery:  false,
    completed: [],
    roster:    [],
    nextId:    1,
    // Stats tracked for war-won summary.
    stats: { battles: 0, won: 0, infl: 0, suff: 0 },
    // Recovery-loop counter — resets on any win.
    recoveryLossCount: 0,
    // Flags consumed by launchCampaignBattle to flip attacker role on recovery.
    recoveryMode: false,
    flipAtk:    false,
  };

  const C = G.campaign;

  // Build 8 infantry + 2 artillery + 2 cavalry starter roster entries.
  const types = [
    "inf","inf","inf","inf","inf","inf","inf","inf",
    "art","art",
    "cav","cav",
  ];
  for (let i = 0; i < types.length; i++) {
    const t = types[i];
    C.roster.push({
      id:     "R" + C.nextId++,
      type:   t,
      weapon: defaultFor(t, firstYear, side),
      xp:     0,
      name:   null,
    });
  }

  launchCampaignBattle();
}

// ---- launchCampaignBattle() ----
// Launches the battle at the current campaign index (recovery-aware).
function launchCampaignBattle() {
  const C = G.campaign;
  if (!C) return;

  const side = C.side;
  const chainId = CHAINS[side][C.idx];
  let bd = BATTLES.find(function(b){ return b.id === chainId; });
  if (!bd) return;

  // If a recovery flip is pending, pass a SHALLOW CLONE with atk reversed.
  // NEVER mutate the BATTLES entry.
  if (C.flipAtk) {
    const flippedAtk = bd.atk === "US" ? "CS" : "US";
    bd = Object.assign({}, bd, { atk: flippedAtk });
    C.flipAtk = false;
  }

  if (typeof closeSheet === "function") {
    closeSheet();
  } else {
    // Inline fallback: hide overlay if closeSheet not yet available.
    const ov = document.getElementById("overlay");
    if (ov) ov.classList.add("hidden");
    const pad = document.getElementById("sheetPad");
    if (pad) pad.innerHTML = "";
  }

  if (typeof showHud === "function") showHud();

  startBattleRuntime(bd, side, true);
}

// ---- campaignAdvance(winnerSide, type) ----
// Called by CHUNK-04's endBattle button; reconciles the roster, awards funds,
// decides advance/recovery, then either opens upgrade or relaunches.
function campaignAdvance(winnerSide, type) {
  const C = G.campaign;
  if (!C) return;

  const B = G.battle;
  const playerSide = B ? B.playerSide : C.side;
  const win = (winnerSide !== null) && (winnerSide === playerSide);

  // ---- Update war stats ----
  C.stats.battles++;
  if (win) C.stats.won++;
  if (B) {
    C.stats.infl += (B.infl[playerSide] || 0);
    C.stats.suff += (B.casualties[playerSide] || 0);
  }

  // ---- Roster reconciliation ----
  // Build a map of surviving player non-hq units keyed by vetId.
  const survivingByVetId = {};
  const survivingNewUnits = [];   // player-side, alive, no vetId, non-hq

  if (B) {
    for (let i = 0; i < B.units.length; i++) {
      const u = B.units[i];
      if (u.side !== playerSide || !u.alive || u.type === "hq") continue;
      if (u.vetId) {
        survivingByVetId[u.vetId] = u;
      } else {
        survivingNewUnits.push(u);
      }
    }
  }

  // Remove dead roster entries (those whose vetId is NOT in survivingByVetId).
  // Update survivors: xp bump + weapon/name carry.
  const newRoster = [];
  for (let i = 0; i < C.roster.length; i++) {
    const entry = C.roster[i];
    const u = survivingByVetId[entry.id];
    if (!u) {
      // Unit with this vetId did not survive — remove from roster.
      continue;
    }
    // Survivor: update xp (capped 5), carry weapon and name.
    const xpGain = 1 + (u.kills >= 2 ? 1 : 0);
    newRoster.push({
      id:     entry.id,
      type:   entry.type,
      weapon: u.weapon || entry.weapon,
      xp:     Math.min(5, entry.xp + xpGain),
      name:   u.name || entry.name,
    });
  }

  // Append surviving player non-hq units that had NO vetId (auto-generated fill).
  for (let i = 0; i < survivingNewUnits.length; i++) {
    const u = survivingNewUnits[i];
    // hq guard (belt-and-suspenders — already filtered above)
    if (u.type === "hq") continue;
    newRoster.push({
      id:     "R" + C.nextId++,
      type:   u.type,
      weapon: u.weapon || defaultFor(u.type, B.bd.year, playerSide),
      xp:     Math.min(5, (u.xp || 0) + 1 + (u.kills >= 2 ? 1 : 0)),
      name:   u.name || null,
    });
  }

  C.roster = newRoster;

  // ---- Funds award ----
  // Base: decisive 500, win/objwin 350, draw 200, loss/objloss 120
  let base;
  if (type === "decisive") {
    base = win ? 500 : 120;
  } else if (type === "win" || type === "objwin") {
    base = win ? 350 : 120;
  } else if (type === "draw") {
    base = 200;
  } else {
    // objloss or anything else treated as loss
    base = 120;
  }

  const inflBonus = B ? Math.round((B.infl[playerSide] || 0) / 40) : 0;
  C.funds += base + inflBonus;

  // ---- Win / loss branching ----
  const chainLen = CHAINS[C.side].length;

  if (win) {
    // Normal advance.
    const currentId = CHAINS[C.side][C.idx];
    const bd = BATTLES.find(function(b){ return b.id === currentId; });
    if (bd) C.completed.push(bd.id);

    C.recovery        = false;
    C.recoveryMode    = false;
    C.flipAtk         = false;
    C.recoveryLossCount = 0;
    C.idx++;

    // Save checkpoint (CHUNK-07 defines saveLocal; guard with typeof).
    if (typeof saveLocal === "function") saveLocal();

    // End of chain → war won!
    if (C.idx >= chainLen) {
      warWonScreen();
      return;
    }

    // Proceed to upgrade then next battle.
    if (typeof openUpgrade === "function") {
      openUpgrade();
    } else {
      launchCampaignBattle();
    }

  } else {
    // Loss path: enter or continue recovery.
    C.recovery     = true;
    C.recoveryMode = true;
    C.recoveryLossCount++;

    // Determine if player was the attacker in this battle.
    // If so, the recovery attempt flips roles (player defends).
    // We only flip if the original battle has the player as attacker.
    const currentId = CHAINS[C.side][C.idx];
    const currentBd = BATTLES.find(function(b){ return b.id === currentId; });
    if (currentBd && currentBd.atk === C.side) {
      // Player was attacker; flip so player defends in recovery.
      C.flipAtk = true;
    } else {
      C.flipAtk = false;
    }

    // Third+ consecutive recovery loss → relief funds + notification.
    if (C.recoveryLossCount >= 3) {
      const relief = 150;
      C.funds += relief;
      const msg = "Supply relief: +" + relief + " funds (prolonged hardship).";
      if (typeof toast === "function") {
        toast(msg, 3000);
      } else if (typeof logMsg === "function") {
        logMsg(msg, "sys");
      }
    }

    // Save checkpoint.
    if (typeof saveLocal === "function") saveLocal();

    // Proceed to upgrade (player may recruit/upgrade before retrying).
    if (typeof openUpgrade === "function") {
      openUpgrade();
    } else {
      launchCampaignBattle();
    }
  }
}

// ---- warWonScreen() ----
// Displayed when the player completes the final battle in the chain.
function warWonScreen() {
  const C = G.campaign;
  if (!C) return;

  const sideLabel  = C.side === "US" ? "Union" : "Confederate";
  const wonCount   = C.stats.won;
  const totalCount = C.stats.battles;
  const inflTotal  = C.stats.infl;
  const suffTotal  = C.stats.suff;
  const rosterSize = C.roster.length;

  const html =
    '<h1 class="title-xl" style="text-align:center">The War is Won</h1>' +
    '<p class="title-sub" style="text-align:center">' + sideLabel + ' Campaign &mdash; Final Dispatch</p>' +
    '<hr class="rule">' +
    '<div class="verdict win">Victory!</div>' +
    '<hr class="rule">' +
    '<div class="castable">' +
      '<div class="c"><div class="big">' + wonCount + '</div><div class="lb">Battles Won</div></div>' +
      '<div class="c"><div class="big">' + totalCount + '</div><div class="lb">Battles Fought</div></div>' +
      '<div class="c"><div class="big">' + rosterSize + '</div><div class="lb">Veterans Remaining</div></div>' +
    '</div>' +
    '<div class="benchbox">' +
      '<div class="kv"><span>Total Inflicted</span><b>' + inflTotal.toLocaleString() + '</b></div>' +
      '<div class="kv"><span>Total Suffered</span><b>' + suffTotal.toLocaleString() + '</b></div>' +
      '<div class="kv"><span>Muster Roll</span><b>' + rosterSize + ' regiment' + (rosterSize !== 1 ? 's' : '') + ' standing</b></div>' +
    '</div>' +
    '<p class="lede" style="text-align:center;margin-top:14px">' +
      'Your veterans have seen the elephant from Fort Sumter to Appomattox.<br>' +
      'The Republic endures.' +
    '</p>' +
    '<div class="btn-row">' +
      '<button id="wwMainMenu" class="bigbtn">Main Menu</button>' +
    '</div>';

  if (typeof openSheet === "function") {
    openSheet(html);
  } else {
    // Inline fallback.
    const pad = document.getElementById("sheetPad");
    const ov  = document.getElementById("overlay");
    if (pad) pad.innerHTML = html;
    if (ov)  ov.classList.remove("hidden");
  }

  const btnMenu = document.getElementById("wwMainMenu");
  if (btnMenu) {
    btnMenu.addEventListener("click", function() {
      if (typeof openMainMenu === "function") {
        openMainMenu();
      } else {
        if (typeof closeSheet === "function") closeSheet();
      }
    });
  }

  // Nullify campaign so a fresh game starts clean.
  G.campaign = null;
}
