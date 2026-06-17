/* ===========================================================================
   A1 · 56-artillery.js — The Cannon Corps: build an artillery arm, battery by
   battery, with money. The companion to The Armory (55-weapons.js): small arms
   are issued by FRACTION of the line; cannon are raised by the BATTERY (a corps
   you assemble), because that is how the long arm actually scaled.

   Aaron's directive (backlog A1): "an artillery tier in The Armory — 12-pdr
   Napoleon, 3-inch Ordnance Rifle, 10-pdr Parrott, Whitworth (rare). Buildable as
   a corps (battery counts) feeding the bridge 'firepower' + battle artillery."

   Real Civil War field pieces (data/artillery.json -> GAME_DATA.artillery) carry
   loot-style RARITY tiers and a `quality` composite. You spend funds to RAISE
   batteries (Union ~6 guns, Confederate ~4 — the historical asymmetry); a battery
   is a big-ticket purchase next to a rifle. The corps' BATTERY-SCORE (quality of
   your guns x how full your park is) feeds the battle bridge as an "artillery"
   facet that adds punch to the army you field. The CS pays an import premium on
   the Whitworth and a captured-gun premium on Federal-standard pieces.

   Adds C.artillery { batteries } (gunId -> battery count). artInit /
   artBatteryScore / artBuy / artRenderSection / artWireSection. Bare-name globals;
   _art* helpers; reuses _armRarityCol from 55-weapons; render never mutates/saves.
   =========================================================================== */

function _artData() {
  return (typeof GAME_DATA !== "undefined" && GAME_DATA && GAME_DATA.artillery) ? GAME_DATA.artillery : null;
}
function _artGuns() { var D = _artData(); return (D && D.guns) ? D.guns : []; }
function _artBaseline() { var D = _artData(); return (D && typeof D.baselineArtilleryScore === "number") ? D.baselineArtilleryScore : 8; }
function _artFull() { var D = _artData(); return (D && typeof D.fullComplementBatteries === "number" && D.fullComplementBatteries > 0) ? D.fullComplementBatteries : 12; }
function _artGunsPerBattery(C) {
  var D = _artData(), side = (C && C.side === "CS") ? "CS" : "US";
  if (!D) return side === "CS" ? 4 : 6;
  return side === "CS" ? (D.batteryGunsCS || 4) : (D.batteryGunsUnion || 6);
}
function _artUnionGuns() { var D = _artData(); return (D && D.batteryGunsUnion) ? D.batteryGunsUnion : 6; }

/* Honor a configured cost of 0 (a starter/gift gun); only fall back to 1000 when the field is missing/invalid. */
function _artCost(g) { return (g && typeof g.costPerBattery === "number" && isFinite(g.costPerBattery) && g.costPerBattery >= 0) ? g.costPerBattery : 1000; }

/* Escape data-driven text before it enters innerHTML — the catalog is tunable/untrusted-shaped data. */
function _artEsc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }

/**
 * Initialize the art subsystem state.
 * Idempotent — safe to call multiple times.
 * @param {import('./types').Campaign | null} C
 */
function artInit(C) {
  if (!C) return;
  // typeof [] === "object", so guard arrays explicitly: a JSON round-trip serializes an array as []
  // and drops every named property, silently wiping the player's whole park on the next save.
  if (Array.isArray(C.artillery) || !C.artillery || typeof C.artillery !== "object") C.artillery = { batteries: {} };
  if (Array.isArray(C.artillery.batteries) || !C.artillery.batteries || typeof C.artillery.batteries !== "object") C.artillery.batteries = {};
  // Sanitize the battery COUNTS once at the chokepoint: a corrupt/hand-edited/imported save can carry
  // "3" / null / objects that would poison the score (string concatenation, NaN). Coerce or drop.
  var b = C.artillery.batteries;
  for (var k in b) if (b.hasOwnProperty(k)) {
    var raw = b[k];   // only numbers/numeric-strings; reject booleans/objects (Number(true)===1 would grant a free battery)
    var n = (typeof raw === "number" || typeof raw === "string") ? Math.floor(Number(raw)) : NaN;
    if (!isFinite(n) || n <= 0) delete b[k];   // drop null/NaN/booleans/objects/<=0
    else b[k] = n;                             // coerce "3" -> 3
  }
}

function _artYear(C) {
  return (C && C.clock && typeof C.clock.year === "number") ? C.clock.year
       : (C && C.president && C.president.date && typeof C.president.date.year === "number") ? C.president.date.year : 1861;
}

/* Availability + the side's price multiplier for a gun. */
function _artAvail(C, g) {
  var side = (C && C.side === "CS") ? "CS" : "US";
  var year = _artYear(C);
  if (g.year && year < g.year) return { ok: false, reason: "Not yet available (" + g.year + ")" };
  if (g.csOnly && side === "US") return { ok: false, reason: "Confederate manufacture only" };
  if (g.usOnly && side === "CS") return { ok: false, reason: "Federal manufacture only" };
  var mult = 1.0;
  if (g.csImport) mult = (side === "CS") ? 1.5 : 1.2;   // a British import: blockade premium (CS) vs foreign-import premium (US) — the South pays more, but the rare tier is dear for everyone
  else if (side === "CS" && g.usFavored) mult = 1.4;    // Federal-standard pieces scarce in the South — captured, mostly
  return { ok: true, mult: mult };
}

function _artTotalBatteries(C) {
  var b = C.artillery.batteries, t = 0;
  for (var k in b) if (b.hasOwnProperty(k)) t += (Number(b[k]) || 0);
  return t;
}

/* The corps' artillery-score (0-100): quality of your guns x how full your park is,
   then the Confederate stacking handicaps that made the long arm a Union strength.
   No batteries -> the baseline (a token of attached guns). A full park of fine
   rifles -> the gun's quality; a few Napoleons -> a real but partial arm.

   Asymmetry (data/artillery.json _designNote + the CS-handicap teaching card; numbers
   are designer calibration, logged in DECISIONS.md D42):
     · gun ratio   — a CS battery is 4 guns to the Union's 6, so its batteries fill the
                     park ~2/3 as fast (the metal-per-battery handicap is mechanical now,
                     not just a UI label).
     · fuze        — a flat haircut for the unreliable Bormann copy: shell/case duds.
                     Solid shot & canister need no fuze, so this is a small expected-value
                     hit, NOT a per-shot roll (that roll + gun-loss-on-retreat belong to the
                     battle-day layer A6 / tactical P-phases).
     · horse/forage— a mobility malus that worsens to severe in 1864-65.
     · mixed cal.  — a resupply drag once the park runs 3+ calibers.
     · massing 1863— the battalion reorganizations concentrated fire (both armies); the Union
                     kept an army-level Artillery Reserve the ANV abolished after Chancellorsville,
                     so the Union bonus is larger. */
/**
 * Compute art battery score.
 * @param {*} C
 * @returns {number}
 */
function artBatteryScore(C) {
  if (!C) return _artBaseline();
  artInit(C);
  var guns = _artGuns(), bat = C.artillery.batteries, full = _artFull();
  var base = Math.max(0, Math.min(100, _artBaseline()));   // clamp the (data-tunable) baseline into range
  var qById = {}; for (var i = 0; i < guns.length; i++) { var gid = guns[i] && guns[i].id; if (gid == null) continue; qById[gid] = guns[i].quality || 50; }
  var total = 0, acc = 0, types = 0;
  for (var k in bat) if (bat.hasOwnProperty(k)) { var n = Number(bat[k]) || 0; if (n > 0) { total += n; acc += n * (qById[k] || 50); types++; } }
  if (total <= 0) return base;
  var avgQ = acc / total;
  var side = (C.side === "CS") ? "CS" : "US";
  var gunRatio = (_artUnionGuns() > 0) ? (_artGunsPerBattery(C) / _artUnionGuns()) : 1;   // US 1.0, CS ~0.667
  var coverage = Math.min(1, (total * gunRatio) / full);
  var score = avgQ * (0.4 + 0.6 * coverage);
  var year = _artYear(C);
  if (side === "CS") {
    score *= 0.96;                                                         // fuze unreliability (shell/case)
    if (year >= 1864) score *= 0.88; else if (year >= 1862) score *= 0.95; // horse/forage collapse worsens late
    if (types >= 3) score *= 0.94;                                         // mixed-caliber resupply drag
  }
  if (year >= 1863 && total >= 6) score *= (side === "US") ? 1.08 : 1.04;  // 1863 massing reform (Union Reserve edge)
  return Math.round(Math.max(base, Math.min(100, score)));
}

/* Buy n batteries of a gun. Mutates C.funds + C.artillery.batteries. */
/**
 * Purchase/upgrade action for art.
 * @param {*} C
 * @param {*} gunId
 * @param {*} n
 */
function artBuy(C, gunId, n) {
  if (!C) return { ok: false, reason: "no campaign" };
  if (gunId == null) return { ok: false, reason: "unknown gun" };   // never buy into the "undefined" key
  artInit(C);
  n = Math.max(1, Math.round(Number(n) || 1));   // Number() so a stray non-numeric n can't yield NaN batteries
  var guns = _artGuns(), g = null;
  for (var i = 0; i < guns.length; i++) if (guns[i].id === gunId) { g = guns[i]; break; }
  if (!g) return { ok: false, reason: "unknown gun" };
  var av = _artAvail(C, g);
  if (!av.ok) return { ok: false, reason: av.reason };
  var cost = Math.round(_artCost(g) * (av.mult || 1) * n);
  if ((C.funds || 0) < cost) return { ok: false, reason: "Insufficient funds ($" + cost + " for " + n + " " + (n > 1 ? "batteries" : "battery") + ")" };
  C.funds -= cost;
  C.artillery.batteries[gunId] = (C.artillery.batteries[gunId] || 0) + n;
  return { ok: true, spent: cost, batteries: C.artillery.batteries[gunId] };
}

function _artScoreWord(v) {
  if (v >= 80) return ["A grand battery", "#4a6b3a"];
  if (v >= 62) return ["A strong park", "#6f9e5a"];
  if (v >= 45) return ["A serviceable arm", "#b8863b"];
  if (v >= 25) return ["A few guns", "#c9712e"];
  return ["Almost no guns", "#9c3b2e"];
}

/* Rarity colour: reuse The Armory's palette so the two tiers read as one catalog. */
function _artRar(r) {
  return (typeof _armRarityCol === "function") ? _armRarityCol(r)
    : (r === "legendary" ? "#b8863b" : r === "rare" ? "#7a5cff" : r === "uncommon" ? "#4a6b3a" : "#8a8276");
}

/* ---- artRenderSection: the Cannon Corps block, appended below The Armory. ---- */
/**
 * Render the art UI section.
 * @param {import('./types').Campaign} C
 * @returns {string} HTML string.
 */
function artRenderSection(C) {
  if (!C) return '';
  artInit(C);
  var guns = _artGuns();
  if (!guns.length) return '';   // no data -> render nothing (The Armory still stands)
  var score = artBatteryScore(C), sw = _artScoreWord(score);
  var bat = C.artillery.batteries, totalBat = _artTotalBatteries(C), perBat = _artGunsPerBattery(C);
  var names = {}; for (var i = 0; i < guns.length; i++) names[guns[i].id] = guns[i];

  // current park summary
  var park = "";
  for (var k in bat) if (bat.hasOwnProperty(k) && bat[k] > 0) {
    var gk = names[k] || { name: k, rarity: "common" };
    park += '<span style="display:inline-block;margin:2px 6px 2px 0;padding:2px 7px;border:1px solid ' + _artRar(gk.rarity) + ';border-radius:3px;font-size:11px">'
      + _artEsc(gk.name) + ' &times;<b>' + bat[k] + '</b></span>';
  }

  var cards = "";
  for (var c = 0; c < guns.length; c++) {
    var g = guns[c], av = _artAvail(C, g), col = _artRar(g.rarity);
    var batCost = Math.round(_artCost(g) * (av.mult || 1));
    var btnCost = Math.round(_artCost(g) * (av.mult || 1) * 3);
    var owned = bat[g.id] || 0;
    var disabled = !av.ok;
    var proj = (g.projectiles && g.projectiles.length) ? g.projectiles.join(', ') : '';
    cards += '<div style="padding:9px;border:1px solid ' + col + ';border-radius:5px;background:rgba(0,0,0,.12);opacity:' + (disabled ? '.5' : '1') + '">'
      + '<div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:13px">' + _artEsc(g.name) + '</b>'
      + '<span style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:' + col + '">' + _artEsc(g.rarity) + '</span></div>'
      + '<div style="font-size:11px;opacity:.6">' + _artEsc(g.caliber) + ' &middot; ' + g.rangeYds + ' yds &middot; ' + g.rateOfFire + '/min &middot; crew ' + g.crew + ' &middot; quality ' + g.quality + '</div>'
      + (proj ? '<div style="font-size:10px;opacity:.5">' + _artEsc(proj) + '</div>' : '')
      + '<div style="font-size:11px;opacity:.78;margin:4px 0">' + _artEsc(g.flavor) + '</div>'
      + (owned ? '<div style="font-size:11px;color:' + col + '">In the park: ' + owned + ' ' + (owned > 1 ? 'batteries' : 'battery') + '</div>' : '');
    if (disabled) cards += '<div style="font-size:11px;color:#9c3b2e">' + av.reason + '</div>';
    else cards += '<div class="btn-row" style="margin-top:4px;display:flex;gap:6px;flex-wrap:wrap">'
      + '<button class="upg" data-artbuy="' + _artEsc(g.id) + '" data-artn="1" style="padding:2px 8px;font-size:11px">Raise a battery &middot; $' + batCost + '</button>'
      + '<button class="upg" data-artbuy="' + _artEsc(g.id) + '" data-artn="3" style="padding:2px 8px;font-size:11px">Raise a battalion (3) &middot; $' + btnCost + '</button></div>';
    cards += '</div>';
  }

  return ''
    + '<hr class="rule" style="margin:16px 0 10px">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap">'
    +   '<div><div style="font-size:17px;font-weight:bold">The Cannon Corps</div>'
    +     '<div style="opacity:.75;font-size:12px">Raise batteries to build your long arm. Massed guns firing canister break a charge &mdash; but cannon cost dear, and the South gets ' + perBat + ' to the Union\'s ' + (_artData() ? (_artData().batteryGunsUnion || 6) : 6) + '.</div></div>'
    +   '<div style="text-align:right"><div style="font-size:12px;opacity:.7">Artillery</div>'
    +     '<div style="font-size:22px;font-weight:bold;color:' + sw[1] + '">' + score + '</div>'
    +     '<div style="font-size:12px;color:' + sw[1] + '">' + sw[0] + '</div></div>'
    + '</div>'
    + '<div style="display:flex;gap:10px;flex-wrap:wrap;font-size:12px;margin:4px 0 6px"><span>Batteries: <b>' + totalBat + '</b></span><span>Guns: <b>' + (totalBat * perBat) + '</b></span><span>Treasury: <b>$' + (C.funds || 0) + '</b></span></div>'
    + (park ? '<div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin:4px 0 2px">Your park</div><div style="margin-bottom:8px">' + park + '</div>' : '')
    + '<div class="gn-col-head" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--rule);margin:8px 0 4px">The ordnance catalog</div>'
    + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px">' + cards + '</div>'
    + (totalBat ? '<div class="btn-row" style="margin-top:10px"><button id="artDisband" type="button" class="upg" style="font-size:11px">Disband the park</button></div>' : '');
}

/**
 * artWireSection.
 * @param {*} C
 */
function artWireSection(C) {
  if (!C) return;
  var btns = document.querySelectorAll('[data-artbuy]');
  for (var i = 0; i < btns.length; i++) {
    (function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-artbuy"), n = parseInt(b.getAttribute("data-artn"), 10) || 1;
        var r = artBuy(C, id, n);
        if (!r.ok && typeof toast === "function") toast(r.reason);
        if (typeof saveLocal === "function") saveLocal();
        if (typeof _wdRefresh === "function") _wdRefresh();
      });
    })(btns[i]);
  }
  var dis = document.getElementById("artDisband");
  if (dis) dis.addEventListener("click", function () {
    C.artillery.batteries = {};
    if (typeof saveLocal === "function") saveLocal();
    if (typeof _wdRefresh === "function") _wdRefresh();
  });
}
