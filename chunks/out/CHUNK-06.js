/* ==== §14 — UPGRADE (CHUNK-06) ==== */

// ---- nextWeaponsFor(type, year) ----
// Returns all weapons for the given arm type that are era-legal (era <= year),
// sorted by pow ascending. Used by openUpgrade's per-row upgrade button logic
// and exposed for CHUNK-10 reuse.
function nextWeaponsFor(type, year) {
  const results = [];
  for (const key in WEAPONS) {
    const w = WEAPONS[key];
    if (w.arm === type && w.era <= year) {
      results.push({ key, w });
    }
  }
  results.sort(function(a, b) { return a.w.pow - b.w.pow; });
  return results;
}

// ---- openUpgrade() ----
// Quartermaster screen shown between campaign battles.
// Sets G.mode="upgrade", hides the HUD, and opens the upgrade sheet.
function openUpgrade() {
  G.mode = "upgrade";
  hideHud();

  const C = G.campaign;
  if (!C) {
    toast("No active campaign.");
    return;
  }

  // Determine the upcoming battle — recovery-aware:
  // recovery does NOT advance idx; we look up the same battle.
  const chainId = CHAINS[C.side][C.idx];
  const bd = BATTLES.find(function(b) { return b.id === chainId; });
  if (!bd) {
    // End of chain — should not normally reach here; fall through to battle.
    launchCampaignBattle();
    return;
  }

  _renderUpgradeSheet(C, bd);
}

// ---- _renderUpgradeSheet(C, bd) — internal; rebuilds the sheet HTML and wires handlers. ----
function _renderUpgradeSheet(C, bd) {
  // Store scroll position before re-render (preserved on re-renders after purchases).
  const pad = document.getElementById("sheetPad");
  const savedScroll = pad ? pad.scrollTop : 0;

  // ---- Build the roster table rows ----
  let rowsHtml = "";
  for (let i = 0; i < C.roster.length; i++) {
    const entry = C.roster[i];
    const armName = (ARM[entry.type] && ARM[entry.type].name) ? ARM[entry.type].name : entry.type;

    // Name: use stored name if available, otherwise "<ord> <ArmName>"
    const displayName = entry.name || (ord(i + 1) + " " + armName);

    // Current weapon display
    const curWeapName = (entry.weapon && WEAPONS[entry.weapon])
      ? WEAPONS[entry.weapon].name
      : (entry.weapon || "—");

    // XP pips: 5 spans, .off for unearned
    let xpHtml = "";
    const xv = entry.xp || 0;
    for (let p = 0; p < 5; p++) {
      xpHtml += '<span class="xp' + (p < xv ? "" : " off") + '"></span>';
    }

    // Upgrade cell: find the single next tier weapon (next higher pow, era-legal)
    const curPow = (entry.weapon && WEAPONS[entry.weapon]) ? WEAPONS[entry.weapon].pow : 0;
    const candidates = nextWeaponsFor(entry.type, bd.year).filter(function(x) {
      return x.w.pow > curPow;
    });
    // candidates is already sorted by pow ascending; take the first (lowest next tier)
    let upgHtml;
    if (candidates.length === 0) {
      // No upgrade available — show nothing in upgrade cell
      upgHtml = '<span style="font-size:11px;color:var(--rule)">Best available</span>';
    } else {
      const next = candidates[0];
      const canAfford = C.funds >= next.w.cost;
      const disabledAttr = canAfford ? "" : " disabled";
      upgHtml = '<button class="upg" id="ugUp_' + entry.id + '"' + disabledAttr + '>'
        + "$" + next.w.cost + " → " + next.w.name
        + "</button>";
    }

    rowsHtml +=
      "<tr>" +
      "<td>" + displayName + "</td>" +
      "<td>" + armName + "</td>" +
      "<td>" + xpHtml + "</td>" +
      "<td>" + curWeapName + "</td>" +
      "<td>" + upgHtml + "</td>" +
      "</tr>";
  }

  // ---- Recruit buttons ----
  const rosterFull = C.roster.length >= 16;
  const recDisabled = rosterFull ? " disabled" : "";
  const recruitHtml =
    '<button class="upg" id="ugRecInf"' + recDisabled + ">+Infantry $200</button> " +
    '<button class="upg" id="ugRecCav"' + recDisabled + ">+Cavalry $260</button> " +
    '<button class="upg" id="ugRecArt"' + recDisabled + ">+Battery $300</button>";

  // ---- Full sheet HTML ----
  const html =
    '<h1 class="title-xl">Winter Quarters</h1>' +
    '<p class="title-sub">Quartermaster &amp; Muster &mdash; before ' + bd.name + ", " + bd.year + "</p>" +
    '<hr class="rule">' +
    '<div class="fundbar">' +
      '<span style="font-size:13px;color:var(--rule)">Treasury</span>' +
      '<span class="coin" id="ugFunds">$' + C.funds + "</span>" +
    "</div>" +
    '<table class="regtable">' +
      "<thead><tr>" +
        "<th>Regiment</th>" +
        "<th>Arm</th>" +
        "<th>XP</th>" +
        "<th>Weapon</th>" +
        "<th>Upgrade</th>" +
      "</tr></thead>" +
      "<tbody id=\"ugRosterBody\">" + rowsHtml + "</tbody>" +
    "</table>" +
    '<hr class="rule">' +
    '<div style="margin-bottom:14px">' +
      '<p class="lede" style="margin:0 0 8px">Muster new regiments:</p>' +
      '<div id="ugRecruitRow">' + recruitHtml + "</div>" +
    "</div>" +
    '<div class="btn-row">' +
      '<button class="bigbtn" id="ugTake">Take the Field</button>' +
      '<button class="ghostbtn" id="ugSave">Save &amp; Menu</button>' +
    "</div>" +
    '<p class="hint">Funds cannot go below $0. Roster capped at 16 regiments.</p>';

  openSheet(html);

  // Restore scroll position
  if (pad) {
    pad.scrollTop = savedScroll;
  }

  // ---- Wire upgrade buttons ----
  for (let i = 0; i < C.roster.length; i++) {
    const entry = C.roster[i];
    const curPow = (entry.weapon && WEAPONS[entry.weapon]) ? WEAPONS[entry.weapon].pow : 0;
    const candidates = nextWeaponsFor(entry.type, bd.year).filter(function(x) {
      return x.w.pow > curPow;
    });
    if (candidates.length === 0) continue;
    const next = candidates[0];

    (function(entryRef, nextWeapon) {
      const btn = document.getElementById("ugUp_" + entryRef.id);
      if (!btn) return;
      btn.addEventListener("click", function() {
        if (C.funds < nextWeapon.w.cost) {
          toast("Insufficient funds.");
          return;
        }
        C.funds -= nextWeapon.w.cost;
        // Funds floor: already checked above; cost > 0 by design for upgrades
        if (C.funds < 0) C.funds = 0;
        entryRef.weapon = nextWeapon.key;
        if (typeof saveLocal === "function") saveLocal();
        _renderUpgradeSheet(C, bd);
      });
    })(entry, next);
  }

  // ---- Wire recruit buttons ----
  function wireRecruit(btnId, type, cost) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener("click", function() {
      if (C.roster.length >= 16) {
        toast("Roster is full — 16 regiments maximum.");
        return;
      }
      if (C.funds < cost) {
        toast("Insufficient funds to recruit.");
        return;
      }
      C.funds -= cost;
      if (C.funds < 0) C.funds = 0;
      const newEntry = {
        id:     "R" + C.nextId++,
        type:   type,
        weapon: defaultFor(type, bd.year, C.side),
        xp:     0,
        name:   null,
      };
      C.roster.push(newEntry);
      if (typeof saveLocal === "function") saveLocal();
      _renderUpgradeSheet(C, bd);
    });
  }

  wireRecruit("ugRecInf", "inf", 200);
  wireRecruit("ugRecCav", "cav", 260);
  wireRecruit("ugRecArt", "art", 300);

  // ---- Take the Field ----
  const btnTake = document.getElementById("ugTake");
  if (btnTake) {
    btnTake.addEventListener("click", function() {
      closeSheet();
      launchCampaignBattle();
    });
  }

  // ---- Save & Menu ----
  const btnSaveMenu = document.getElementById("ugSave");
  if (btnSaveMenu) {
    btnSaveMenu.addEventListener("click", function() {
      if (typeof saveLocal === "function") saveLocal();
      if (typeof openMainMenu === "function") {
        openMainMenu();
      } else {
        toast("Menu arrives in the next build.");
      }
    });
  }
}
