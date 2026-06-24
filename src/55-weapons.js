/* ===========================================================================
   S? · 55-weapons.js — The Armory: buy real weapons with money, loot-game style.

   Aaron's directive: battlefield accuracy boosts + weapon upgrades "like Borderlands,
   weapons spec fun", AND "money be a factor to buy best weapons for army person or
   brigade, partial or whole part of army." This is §6 (procure/issue real arms via
   the economy, cost/supply-limited) + §19 (RPG-style weapon variety) made concrete —
   and it finally makes C.funds matter.

   Real Civil War small arms (data/weapons.json -> GAME_DATA.weapons) carry loot-style
   RARITY tiers (common -> legendary) and specs (range/accuracy/rate-of-fire/quality).
   You spend funds to ARM a fraction of your army with a weapon — 10% at a time (your
   best brigades) or the whole line. Better guns cost more; arming everyone with
   Spencers is ruinous, so you mix. The army's weapon-SCORE feeds the battle bridge
   (firepower/equipment) — and, once the battle-day hook lands, on-field accuracy.

   Adds C.armory { loadout } (weaponId -> fraction of the army). armoryInit /
   armoryWeaponScore / armoryBuy / armoryRenderArmory / armoryWireArmory. Bare-name
   globals; _arm* helpers; render never mutates or saves.
   =========================================================================== */

function _armData() { return gameData("weapons"); }
function _armCat() {
  var D = _armData();
  return (D && D.weapons) ? D.weapons : [];
}
function _armBaseline() { var D = _armData(); return (D && typeof D.baselineQuality === "number") ? D.baselineQuality : 30; }
function _armBatch() { var D = _armData(); return (D && typeof D.batchFraction === "number") ? D.batchFraction : 0.1; }

function armoryInit(C) {
  if (!C) return;
  if (!C.armory || typeof C.armory !== "object") C.armory = { loadout: {} };
  if (!C.armory.loadout || typeof C.armory.loadout !== "object") C.armory.loadout = {};
}

function _armYear(C) { return campaignYear(C); }

/* Availability + the side's price for a weapon. */
function _armAvail(C, w) {
  var side = (C && C.side === "CS") ? "CS" : "US";
  var year = _armYear(C);
  if (w.year && year < w.year) return { ok: false, reason: "Not yet available (" + w.year + ")" };
  if (w.csOnly && side === "US") return { ok: false, reason: "Confederate manufacture only" };
  var mult = 1.0;
  if (side === "CS") {
    if (w.csImport) mult = 1.4;            // blockade premium on imports
    else if (w.id === "springfield") mult = 1.6;  // captured Federal arms
    else if (w.usFavored) mult = 1.5;      // scarce in the South
  }
  return { ok: true, mult: mult };
}

function _armSumLoadout(C) {
  var lo = C.armory.loadout, t = 0;
  for (var k in lo) if (lo.hasOwnProperty(k)) t += (lo[k] || 0);
  return Math.min(1, t);
}

/* The army's weapon-score (0-100): issued weapons by fraction + the musket baseline. */
function armoryWeaponScore(C) {
  if (!C) return _armBaseline();
  armoryInit(C);
  var cat = _armCat(), lo = C.armory.loadout, base = _armBaseline();
  var qById = {}; for (var i = 0; i < cat.length; i++) qById[cat[i].id] = cat[i].quality || base;
  var total = 0, acc = 0;
  for (var k in lo) if (lo.hasOwnProperty(k)) { var f = lo[k] || 0; total += f; acc += f * (qById[k] || base); }
  total = Math.min(1, total);
  acc += (1 - total) * base;
  return Math.round(Math.max(0, Math.min(100, acc)));
}

/* Buy: mode "batch" arms one batch (~10%) more; mode "all" re-arms the whole line.
   Returns { ok, reason }. Mutates C.funds + C.armory.loadout. */
function armoryBuy(C, weaponId, mode) {
  if (!C) return { ok: false, reason: "no campaign" };
  armoryInit(C);
  var cat = _armCat(), w = null;
  for (var i = 0; i < cat.length; i++) if (cat[i].id === weaponId) { w = cat[i]; break; }
  if (!w) return { ok: false, reason: "unknown weapon" };
  var av = _armAvail(C, w);
  if (!av.ok) return { ok: false, reason: av.reason };
  var batch = _armBatch();
  if (mode === "all") {
    var costAll = Math.round(w.cost * (1 / batch) * av.mult);
    if ((C.funds || 0) < costAll) return { ok: false, reason: "Insufficient funds ($" + costAll + " needed)" };
    C.funds -= costAll;
    C.armory.loadout = {}; C.armory.loadout[weaponId] = 1.0;
    return { ok: true, spent: costAll };
  }
  var total = _armSumLoadout(C);
  var room = Math.max(0, 1 - total);
  var added = Math.min(batch, room);
  if (added <= 0.0001) return { ok: false, reason: "Whole army already armed — re-arm the line to upgrade" };
  var cost = Math.round(w.cost * (added / batch) * av.mult);
  if ((C.funds || 0) < cost) return { ok: false, reason: "Insufficient funds ($" + cost + " needed)" };
  C.funds -= cost;
  C.armory.loadout[weaponId] = (C.armory.loadout[weaponId] || 0) + added;
  return { ok: true, spent: cost };
}

function _armRarityCol(r) {
  return r === "legendary" ? "#b8863b" : r === "rare" ? "#9a86f0" : r === "uncommon" ? "#6f9e5a" : "#9a9184";
}
function _armScoreWord(v) {
  if (v >= 80) return ["Devastating", "#6f9e5a"];
  if (v >= 62) return ["Modern", "#6f9e5a"];
  if (v >= 45) return ["Rifled line", "#b8863b"];
  if (v >= 32) return ["Mixed arms", "#c9712e"];
  return ["Antiquated", "#d8745c"];
}

/* ---- armoryRenderArmory: The Armory desk tab. ---- */
function armoryRenderArmory(C) {
  if (!C) return '';
  armoryInit(C);
  var cat = _armCat();
  if (!cat.length) return '<p class="lede" style="text-align:center;opacity:.7">The armory records are not yet available.</p>';
  var score = armoryWeaponScore(C), sw = _armScoreWord(score);
  var lo = C.armory.loadout, total = Math.round(_armSumLoadout(C) * 100);

  // current loadout summary
  var issued = "";
  var names = {}; for (var i = 0; i < cat.length; i++) names[cat[i].id] = cat[i];
  for (var k in lo) if (lo.hasOwnProperty(k) && lo[k] > 0.001) {
    var wk = names[k] || { name: k, rarity: "common" };
    issued += '<span style="display:inline-block;margin:2px 6px 2px 0;padding:2px 7px;border:1px solid ' + _armRarityCol(wk.rarity) + ';border-radius:3px;font-size:11px">'
      + wk.name + ' <b>' + Math.round(lo[k] * 100) + '%</b></span>';
  }
  if (total < 100) issued += '<span style="display:inline-block;margin:2px 6px 2px 0;padding:2px 7px;border:1px solid var(--rule);border-radius:3px;font-size:11px;opacity:.7">Model 1842 Musket <b>' + (100 - total) + '%</b></span>';

  var cards = "";
  for (var c = 0; c < cat.length; c++) {
    var w = cat[c], av = _armAvail(C, w), col = _armRarityCol(w.rarity);
    var batchCost = Math.round(w.cost * (av.mult || 1));
    var allCost = Math.round(w.cost * (1 / _armBatch()) * (av.mult || 1));
    var disabled = !av.ok;
    // E3-i2 (D126): an unavailable card is muted, but its REASON text is informational and must
    // stay legible. Group opacity composites onto descendants, so dim only the descriptive block
    // (an inner wrapper) and render the reason as a FULL-opacity sibling, outside the dimmed group.
    cards += '<div style="padding:9px;border:1px solid ' + col + ';border-radius:5px;background:rgba(0,0,0,.12)">'
      + '<div' + (disabled ? ' style="opacity:.6"' : '') + '>'
      + '<div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:13px">' + w.name + '</b>'
      + '<span style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:' + col + '">' + w.rarity + '</span></div>'
      + '<div style="font-size:11px;opacity:.6">' + w.caliber + ' &middot; ' + w.rangeYds + ' yds &middot; acc ' + w.accuracy + ' &middot; ' + w.rateOfFire + '/min &middot; quality ' + w.quality + '</div>'
      + '<div style="font-size:11px;opacity:.78;margin:4px 0">' + w.flavor + '</div></div>';
    if (disabled) cards += '<div style="font-size:11px;color:#d8745c;margin-top:2px">' + av.reason + '</div>';
    else cards += '<div class="btn-row" style="margin-top:4px;display:flex;gap:6px;flex-wrap:wrap">'
      + '<button class="upg" data-armbuy="' + w.id + '" data-armmode="batch" style="padding:2px 8px;font-size:11px">Arm 10% &middot; $' + batchCost + '</button>'
      + '<button class="upg" data-armbuy="' + w.id + '" data-armmode="all" style="padding:2px 8px;font-size:11px">Arm the line &middot; $' + allCost + '</button></div>';
    cards += '</div>';
  }

  return ''
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap">'
    +   '<div><div style="font-size:17px;font-weight:bold">The Armory</div>'
    +     '<div style="opacity:.75;font-size:12px">Procure arms for your army — the best guns win firefights, but money is a factor.</div></div>'
    +   '<div style="text-align:right"><div style="font-size:12px;opacity:.7">Army firepower</div>'
    +     '<div style="font-size:22px;font-weight:bold;color:' + sw[1] + '">' + score + '</div>'
    +     '<div style="font-size:12px;color:' + sw[1] + '">' + sw[0] + '</div></div>'
    + '</div><hr class="rule">'
    + '<div style="display:flex;gap:10px;flex-wrap:wrap;font-size:13px;margin-bottom:4px"><span>Treasury: <b>$' + (C.funds || 0) + '</b></span></div>'
    + '<div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin:4px 0 2px">How your army is armed</div>'
    + '<div style="margin-bottom:8px">' + (issued || '<span style="opacity:.6;font-size:12px">Muskets, all.</span>') + '</div>'
    + '<div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin:8px 0 4px">The catalog</div>'
    + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px">' + cards + '</div>'
    + '<div class="btn-row" style="margin-top:10px"><button id="armReset" type="button" class="upg" style="font-size:11px">Reset to muskets</button></div>';
}

function armoryWireArmory(C) {
  if (!C) return;
  var btns = document.querySelectorAll('[data-armbuy]');
  for (var i = 0; i < btns.length; i++) {
    (function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-armbuy"), mode = b.getAttribute("data-armmode");
        var r = armoryBuy(C, id, mode);
        if (!r.ok && typeof toast === "function") toast(r.reason);
        if (typeof saveLocal === "function") saveLocal();
        if (typeof _wdRefresh === "function") _wdRefresh();
      });
    })(btns[i]);
  }
  var reset = document.getElementById("armReset");
  if (reset) reset.addEventListener("click", function () {
    C.armory.loadout = {};
    if (typeof saveLocal === "function") saveLocal();
    if (typeof _wdRefresh === "function") _wdRefresh();
  });
}
