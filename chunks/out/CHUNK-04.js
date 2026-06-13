/* ==== §12 — RESULT (CHUNK-04) ==== */

// ---- openSheet(html) / closeSheet() — shared overlay helpers ----
function openSheet(html) {
  const pad = document.getElementById("sheetPad");
  const overlay = document.getElementById("overlay");
  if (!pad || !overlay) return;
  pad.innerHTML = html;
  overlay.classList.remove("hidden");
}

function closeSheet() {
  const overlay = document.getElementById("overlay");
  if (!overlay) return;
  overlay.classList.add("hidden");
  const pad = document.getElementById("sheetPad");
  if (pad) pad.innerHTML = "";
}

// ---- endBattle(side, type) ----
// side: "US"|"CS"|null (null = draw from resolveByScore)
// type: "decisive"|"win"|"objwin"|"objloss"|"draw"
function endBattle(side, type) {
  const B = G.battle;

  // Iron rule: set over immediately, no matter what.
  B.over = true;
  G.mode = "result";
  clearSelection();
  hideHud();

  const playerSide = B.playerSide;
  const enemySide  = B.enemySide;

  // Determine outcome from the player's perspective.
  // When side===null it is always a draw.
  const win  = (side !== null) && (side === playerSide);
  const draw = (side === null) || (type === "draw");

  // Sound: win → bugle, loss → rout, draw → nothing.
  if (!draw) {
    playSfx(win ? "bugle" : "rout");
  }

  // ---- Verdict label ----
  const VERDICT_WIN = {
    decisive: "Decisive Victory",
    win:      "Victory",
    objwin:   "Objectives Carried",
    objloss:  null, // can't happen when win===true
    draw:     "Drawn Battle",
  };
  const VERDICT_LOSE = {
    decisive: "Decisive Defeat",
    win:      "Defeat",
    objwin:   null, // can't happen when win===false
    objloss:  "Objectives Lost",
    draw:     "Drawn Battle",
  };

  let verdictText;
  if (draw) {
    verdictText = "Drawn Battle";
  } else if (win) {
    verdictText = VERDICT_WIN[type] || "Victory";
  } else {
    verdictText = VERDICT_LOSE[type] || "Defeat";
  }

  const verdictClass = draw ? "draw" : (win ? "win" : "lose");

  // ---- Casualty columns ----
  // Player side shown first labeled "Your Losses"; enemy second labeled "Enemy Losses".
  const playerCas  = B.casualties[playerSide] || 0;
  const enemyCas   = B.casualties[enemySide]  || 0;
  const playerInfl = B.infl[playerSide] || 0;
  const enemyInfl  = B.infl[enemySide]  || 0;

  // ---- Benchbox comparative line ----
  // Casualty percentages of starting strength (not current — starting).
  const playerStart = startStrength(playerSide);
  const enemyStart  = startStrength(enemySide);

  const playerPct = playerStart > 0 ? Math.round(playerCas / playerStart * 100) : 0;
  const enemyPct  = enemyStart  > 0 ? Math.round(enemyCas  / enemyStart  * 100) : 0;

  let exchangeLine;
  if (draw) {
    exchangeLine = `Field: inflicted ${enemyCas} (${enemyPct}%), suffered ${playerCas} (${playerPct}%) — an even exchange on a bloody day.`;
  } else {
    const better = playerPct <= enemyPct;
    exchangeLine = `Your field: inflicted ${enemyCas} (${enemyPct}%), suffered ${playerCas} (${playerPct}%) — ` +
      (better ? "a better exchange than the day deserved." : "a worse exchange than the day deserved.");
  }

  const resQuote = B.bd.res || "";

  // ---- Button logic ----
  // Iron rule: if campaign + iron + player lost → Continue only; no replay.
  const ironLoss = !!(G.campaign && G.campaign.iron && !win && !draw);
  const isCampaign = !!B.fromCampaign;

  let buttonsHtml;
  if (isCampaign) {
    // Campaign path: single Continue Campaign button.
    buttonsHtml = `
      <div class="btn-row">
        <button id="rbContinue" class="bigbtn">Continue Campaign</button>
      </div>`;
  } else if (ironLoss) {
    // Iron mode loss in a free battle context: Continue only (belt-and-suspenders guard).
    buttonsHtml = `
      <div class="btn-row">
        <button id="rbContinue" class="bigbtn">Continue Campaign</button>
      </div>`;
  } else {
    // Free battle: Replay + Main Menu.
    buttonsHtml = `
      <div class="btn-row">
        <button id="rbReplay" class="bigbtn">Replay Battle</button>
        <button id="rbMenu" class="ghostbtn">Main Menu</button>
      </div>`;
  }

  // ---- Build sheet HTML ----
  const html = `
    <h1 class="title-xl" style="text-align:center">${B.bd.name}</h1>
    <p class="title-sub" style="text-align:center">${B.bd.year} &mdash; ${B.bd.th === "E" ? "Eastern" : B.bd.th === "W" ? "Western" : B.bd.th === "TM" ? "Trans-Mississippi" : "Naval"} Theater</p>
    <div class="verdict ${verdictClass}">${verdictText}</div>
    <hr class="rule">
    <div class="castable">
      <div class="c">
        <div class="big">${playerCas.toLocaleString()}</div>
        <div class="lb">Your Losses</div>
      </div>
      <div class="c">
        <div class="big">${enemyCas.toLocaleString()}</div>
        <div class="lb">Enemy Losses</div>
      </div>
      <div class="c">
        <div class="big">${playerInfl.toLocaleString()}</div>
        <div class="lb">Inflicted</div>
      </div>
    </div>
    <div class="benchbox">
      <p class="lede" style="font-style:italic;margin:0 0 8px">&ldquo;${resQuote}&rdquo;</p>
      <span class="hi">${exchangeLine}</span>
    </div>
    ${buttonsHtml}
    <p class="hint">
      ${playerSide === "US" ? "Union" : "Confederate"} forces &mdash;
      Turn ${B.turn} of ${B.maxTurns}
    </p>
  `;

  openSheet(html);

  // ---- Wire button handlers (addEventListener on dynamically-created elements) ----
  const btnContinue = document.getElementById("rbContinue");
  const btnReplay   = document.getElementById("rbReplay");
  const btnMenu     = document.getElementById("rbMenu");

  if (btnContinue) {
    btnContinue.addEventListener("click", function () {
      if (typeof campaignAdvance === "function") {
        campaignAdvance(side, type);
      } else {
        toast("Campaign system not yet loaded.");
        if (typeof openMainMenu === "function") {
          openMainMenu();
        } else {
          closeSheet();
        }
      }
    });
  }

  if (btnReplay) {
    btnReplay.addEventListener("click", function () {
      const bd        = B.bd;
      const pSide     = B.playerSide;
      closeSheet();
      showHud();
      startBattleRuntime(bd, pSide, false);
    });
  }

  if (btnMenu) {
    btnMenu.addEventListener("click", function () {
      if (typeof openMainMenu === "function") {
        openMainMenu();
      } else {
        closeSheet();
      }
    });
  }
}
