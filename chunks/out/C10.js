/* ==== §17 — WEAPON LOOT CARDS (C10) ==== */
// Defines: LOOT_TIERS, MANUFACTURERS, NAMED_UNIQUES, rollLoot,
//          captureLootFromRout, renderWeaponCard, ensureLootStyle
// No engine symbols are redeclared. No HTML/CSS files. Pure ES2020.
// Fable integration notes are inline.

// ---------------------------------------------------------------------------
// LOOT_TIERS
// 5 rarity bands. color values chosen for period-appropriate feel:
//   text rendered on a dark card bg (#1a1208 approx) — contrast checked below.
//   AA target ≥4.5:1 against #1a1208 (lum ≈ 0.004).
//   Formulaic: contrast = (Ltext + 0.05) / (Lbg + 0.05)
//     Surplus  #9a9a8c  lum≈0.349 → (0.354)/(0.009) ≈ 39.3  ✓ WCAG AAA
//     Standard #c9a85f  lum≈0.430 → (0.435)/(0.009) ≈ 48.3  ✓
//     Fine     #6ab08a  lum≈0.404 → (0.409)/(0.009) ≈ 45.4  ✓
//     Presentation #e0c472 lum≈0.580 → (0.585)/(0.009) ≈ 65  ✓
//     Legendary    #d4694f lum≈0.347 → (0.352)/(0.009) ≈ 39.1 ✓  (orange-red on near-black)
// ---------------------------------------------------------------------------
const LOOT_TIERS = [
  { name:"Surplus",      color:"#9a9a8c", weight:40, powMod:0.92, label:"Surplus Issue"   },
  { name:"Standard",     color:"#c9a85f", weight:30, powMod:1.00, label:"Standard Issue"  },
  { name:"Fine",         color:"#6ab08a", weight:17, powMod:1.07, label:"Fine Arms"        },
  { name:"Presentation", color:"#e0c472", weight: 9, powMod:1.13, label:"Presentation Grade"},
  { name:"Legendary",    color:"#d4694f", weight: 4, powMod:1.18, label:"Legendary Piece"  },
];

// ---------------------------------------------------------------------------
// MANUFACTURERS
// Real Civil War arms makers. Each has a stat flavor blurb and a quirk downside.
// side: "US" | "CS" | null (imported/both)
// arm: array of arm codes this maker supplies, or null (all inf)
// ---------------------------------------------------------------------------
const MANUFACTURERS = {
  springfield: {
    name:"Springfield Armory",  side:"US", arm:["inf"],
    blurb:"The Union's bedrock — reliable in mud, sleet, and sustained fire.",
    quirk:{ label:"Heavy Load",  desc:"Bulk slows reload; -1 effective range on triple-canister action." },
  },
  sharps: {
    name:"Sharps Rifle Co.",    side:"US", arm:["inf","cav"],
    blurb:"Exceptional accuracy from the breech — a sharpshooter's pride.",
    quirk:{ label:"Fouling Catch", desc:"Carbon build-up after 20 rounds degrades seal; cleaning kit required." },
  },
  spencer: {
    name:"Spencer Repeating Arms", side:"US", arm:["inf","cav"],
    blurb:"Seven shots without reloading — the magazine rifle that shocked the Confederacy.",
    quirk:{ label:"Magazine Warp", desc:"Humidity can warp the tube magazine; one misfire per wet engagement." },
  },
  henry: {
    name:"New Haven Arms / Henry", side:"US", arm:["inf","cav"],
    blurb:"Sixteen rounds of lever-action fury — 'that damned Yankee rifle that you could load on Sunday and shoot all week.'",
    quirk:{ label:"Exposed Magazine", desc:"Under-barrel magazine dents in close combat, jamming the action." },
  },
  richmond: {
    name:"Richmond Armory",     side:"CS", arm:["inf"],
    blurb:"Confederate workhorse built from scavenged machinery — adequate when dry.",
    quirk:{ label:"Misfires in Rain", desc:"Substandard powder seating causes double misfires in wet weather." },
  },
  enfield: {
    name:"London Armoury / Enfield", side:null, arm:["inf","cav"],
    blurb:"British-made precision imported through the blockade — prized by both sides.",
    quirk:{ label:"Ammunition Strain", desc:"Relies on imported cartridges; resupply penalties in late-war logistics." },
  },
  colt: {
    name:"Colt's Patent Firearms", side:"US", arm:["cav","inf"],
    blurb:"The revolving cylinder brought repeating fire to the cavalry — Col. Grierson's troopers never looked back.",
    quirk:{ label:"Cylinder Timing", desc:"Worn timing pin can cause chain-fire; inspections required after hard use." },
  },
  tredegar: {
    name:"Tredegar Iron Works",  side:"CS", arm:["art"],
    blurb:"Richmond's iron heart — the South's only large-scale cannon foundry.",
    quirk:{ label:"Casting Variance", desc:"Inconsistent iron quality; occasional bore eccentricity at extreme range." },
  },
  parrott: {
    name:"West Point Foundry / Parrott", side:"US", arm:["art"],
    blurb:"Reinforced breech rifled cannon — dependable at range, the backbone of Union artillery.",
    quirk:{ label:"Breech Crack", desc:"Parrott guns have a known tendency to burst at the reinforcing band under prolonged fire." },
  },
  cook: {
    name:"Cook & Brother (Athens)", side:"CS", arm:["inf","cav"],
    blurb:"Georgia-made Enfield copies — the best Confederate private arms works still in operation by 1863.",
    quirk:{ label:"Finish Variation", desc:"Lock tolerances vary by batch; some examples are near-Enfield quality, others are not." },
  },
};

// ---------------------------------------------------------------------------
// NAMED_UNIQUES
// Small table of famously-issued or captured pieces that rollLoot can yield
// at Legendary tier. Each has a fixed baseName, blurb override, and powBonus
// on top of tier powMod.
// ---------------------------------------------------------------------------
const NAMED_UNIQUES = [
  {
    id:"lincoln_henry",
    displayName:"The Lincoln Henry — '16-Shot' Presentation",
    baseKey:"henry", mfrKey:"henry",
    blurb:"One of the gilt-framed Henry repeaters presented to President Lincoln in 1862, later carried into the field by an aide and captured at Cedar Creek.",
    powBonus:1.04,
  },
  {
    id:"jackson_sword",
    displayName:"Stonewall's Saber Carbine",
    baseKey:"carbine", mfrKey:"richmond",
    blurb:"A Richmond-worked saddle carbine engraved with a valley map — attributed to Jackson's escort and taken at the crossing of the North Anna.",
    powBonus:1.06,
  },
  {
    id:"whitworth_import",
    displayName:"Whitworth Sharpshooter's Rifle",
    baseKey:"enfield", mfrKey:"enfield",
    blurb:"A hexagonal-bore Whitworth, one of the select British imports issued to Confederate sharpshooter battalions — effective beyond 1,000 yards.",
    powBonus:1.09,
  },
  {
    id:"parrott_longshot",
    displayName:"The 'Bull Pup' 20-pdr Parrott",
    baseKey:"parrott", mfrKey:"parrott",
    blurb:"An over-spec 20-pounder Parrott captured at Second Manassas — its extended tube gave extraordinary range but a fearsome recoil.",
    powBonus:1.07,
  },
  {
    id:"confederate_napoleon",
    displayName:"Tredegar No. 1 — Presentation Napoleon",
    baseKey:"napoleon", mfrKey:"tredegar",
    blurb:"The first Napoleon cast at Tredegar, engraved for a Richmond ceremony and later lost to Union cavalry at Yellow Tavern.",
    powBonus:1.05,
  },
  {
    id:"spencer_grierson",
    displayName:"Grierson's Spencer — 'The Raid Carbine'",
    baseKey:"spencerC", mfrKey:"spencer",
    blurb:"One of the repeating carbines issued for Grierson's Raid in April 1863, marked with a brass raid-route plate riveted to the stock.",
    powBonus:1.05,
  },
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

// Weighted random pick from LOOT_TIERS using the engine PRNG.
function _pickTier() {
  const total = LOOT_TIERS.reduce(function(s, t){ return s + t.weight; }, 0);
  let r = RND() * total; // RND() is the engine Mulberry32 PRNG (no Math.random)
  for (let i = 0; i < LOOT_TIERS.length; i++) {
    r -= LOOT_TIERS[i].weight;
    if (r <= 0) return i;
  }
  return LOOT_TIERS.length - 1;
}

// Filter MANUFACTURERS to those that can supply a given arm code.
function _mfrsForArm(arm) {
  return Object.keys(MANUFACTURERS).filter(function(k) {
    const m = MANUFACTURERS[k];
    return !m.arm || m.arm.indexOf(arm) !== -1;
  });
}

// Filter MANUFACTURERS to those compatible with a given side ("US"|"CS").
function _mfrsForSide(arm, side) {
  const keys = _mfrsForArm(arm);
  return keys.filter(function(k) {
    const m = MANUFACTURERS[k];
    return !m.side || m.side === side;
  });
}

// Era-legal weapon keys for a given arm and year.
function _weaponKeysForArm(arm, year) {
  return Object.keys(WEAPONS).filter(function(k) {
    const w = WEAPONS[k];
    return w.arm === arm && w.era <= year;
  });
}

// Condition factor: maps a 0-100 condition int to a [0.72, 1.00] multiplier.
function _conditionFactor(cond) {
  return 0.72 + (cond / 100) * 0.28;
}

// ---------------------------------------------------------------------------
// rollLoot(weaponKey, year, side) → loot instance
//
// weaponKey  : WEAPONS key of the base weapon being looted
// year       : battle year (1861-1865), used for era-gate and unique eligibility
// side       : "US" | "CS" — the CAPTURING side (determines manufacturer pool)
//
// Returns an object suitable for storage in G.campaign.captured:
//   { baseKey, baseName, tierIdx, tier{name,color,label,powMod},
//     mfrKey, mfr{name,blurb,quirk,...},
//     quirk{label,desc}, condition, pow, displayName,
//     unique?:{id,blurb,powBonus} }
// ---------------------------------------------------------------------------
function rollLoot(weaponKey, year, side) {
  const baseW = WEAPONS[weaponKey];
  if (!baseW) return null;

  const arm = baseW.arm;
  const tierIdx = _pickTier();
  const tier = LOOT_TIERS[tierIdx];

  // Manufacturer pool: prefer side-compatible, fall back to all for that arm.
  let mfrPool = _mfrsForSide(arm, side);
  if (mfrPool.length === 0) mfrPool = _mfrsForArm(arm);
  if (mfrPool.length === 0) mfrPool = Object.keys(MANUFACTURERS);
  const mfrKey = pick(mfrPool);
  const mfr = MANUFACTURERS[mfrKey];

  // Condition: Surplus skews low, Legendary skews high.
  const condBase = [40, 55, 68, 80, 90][tierIdx];
  const condJitter = rint(-12, 12);
  const condition = clamp(condBase + condJitter, 0, 100);

  // Named unique: only at Legendary (tierIdx === 4), year >= 1862, ~25% chance.
  let unique = null;
  if (tierIdx === 4 && year >= 1862 && chance(0.25)) {
    // Filter uniques whose baseKey is era-legal for this arm and year.
    const eligible = NAMED_UNIQUES.filter(function(u) {
      const uw = WEAPONS[u.baseKey];
      return uw && uw.arm === arm && uw.era <= year;
    });
    if (eligible.length > 0) unique = pick(eligible);
  }

  // Effective power.
  const condF = _conditionFactor(condition);
  let pow = baseW.pow * tier.powMod * condF;
  if (unique) pow *= unique.powBonus;
  // Round to 2 decimal places to avoid float noise in display.
  pow = Math.round(pow * 100) / 100;

  // Display name.
  let displayName;
  if (unique) {
    displayName = unique.displayName;
  } else {
    displayName = tier.label + " " + baseW.name + " (" + mfr.name + ")";
  }

  return {
    baseKey:     weaponKey,
    baseName:    baseW.name,
    tierIdx:     tierIdx,
    tier:        tier,
    mfrKey:      mfrKey,
    mfr:         mfr,
    quirk:       mfr.quirk,
    condition:   condition,
    pow:         pow,
    displayName: displayName,
    unique:      unique || null,
    // Carry weapon metadata for card rendering without re-lookup.
    rng:         baseW.rng,
    arm:         arm,
  };
}

// ---------------------------------------------------------------------------
// captureLootFromRout(routedUnit, capturingSide) → loot | null
//
// routedUnit    : a live roster/unit object with at minimum {weapon, side}
// capturingSide : "US" | "CS"
//
// Returns a loot instance if capturingSide is the PLAYER side (G.campaign?.side)
// and the routed unit has a valid weapon, else null.
//
// CONTRACT FOR FABLE:
//   Call this function from inside killUnit() on the rout/death path, after
//   confirming the unit is defeated. Recommended call site (one line):
//
//     const _lc = captureLootFromRout(u, by && by.side ? by.side : null);
//     if (_lc && G.campaign) { G.campaign.captured = G.campaign.captured || []; G.campaign.captured.push(_lc); }
//
//   Storage shape assumed:
//     G.campaign.captured — Array of loot instance objects (as returned by rollLoot).
//     Initialise to [] in startCampaign alongside the other fields.
//     Fable is responsible for persisting this through applySave/saveState.
// ---------------------------------------------------------------------------
function captureLootFromRout(routedUnit, capturingSide) {
  // Guard: no campaign, no player side resolution.
  if (!capturingSide) return null;
  // Only reward the player's own side.
  if (!G.campaign || capturingSide !== G.campaign.side) return null;
  // Must have a weapon key.
  if (!routedUnit || !routedUnit.weapon || !WEAPONS[routedUnit.weapon]) return null;

  // Determine year from current battle if available.
  const year = (G.battle && G.battle.bd && G.battle.bd.year) ? G.battle.bd.year : 1861;

  return rollLoot(routedUnit.weapon, year, capturingSide);
}

// ---------------------------------------------------------------------------
// ensureLootStyle()
// Injects card-specific CSS exactly once (guarded by id "c10-style").
// renderWeaponCard() calls this automatically.
//
// All lc- prefixed classes. Contrast ratios noted inline.
// Card bg: #1a1208 (lum≈0.004). Text #e8dcc0 (lum≈0.791) → (0.796/0.009) ≈ 88:1 ✓
// ---------------------------------------------------------------------------
function ensureLootStyle() {
  if (document.getElementById("c10-style")) return;
  const s = document.createElement("style");
  s.id = "c10-style";
  s.textContent = [
    /* Card shell */
    ".lc-card{position:relative;background:#1a1208;border-radius:3px;padding:10px 12px 8px;",
    "  font-family:Georgia,serif;color:#e8dcc0;box-sizing:border-box;overflow:hidden;}",
    /* Rarity border — color set inline via style attr */
    ".lc-card::before{content:'';position:absolute;inset:0;border-radius:3px;",
    "  border:2px solid currentColor;pointer-events:none;}",
    /* Corner ribbon badge */
    ".lc-ribbon{position:absolute;top:6px;right:0;padding:2px 8px 2px 6px;",
    "  font-size:9px;letter-spacing:.08em;text-transform:uppercase;font-family:'Arial Narrow',Arial,sans-serif;",
    "  background:#1a1208;border-left:2px solid currentColor;border-top:1px solid currentColor;",
    "  border-bottom:1px solid currentColor;border-radius:2px 0 0 2px;}",
    /* Weapon name heading — color set inline */
    ".lc-name{font-size:14px;font-weight:700;margin:0 0 1px;padding-right:72px;line-height:1.25;",
    "  letter-spacing:.01em;}",
    /* Manufacturer sub-line: #c9a85f on #1a1208 → lum 0.430 → (0.435/0.009)≈48:1 ✓ */
    ".lc-mfr{font-size:10px;color:#c9a85f;letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px;}",
    /* Blurb text: #c8bea8 on #1a1208 → lum≈0.551 → (0.556/0.009)≈61:1 ✓ */
    ".lc-blurb{font-size:11px;font-style:italic;color:#c8bea8;margin-bottom:7px;line-height:1.45;}",
    /* Stat row */
    ".lc-stats{display:flex;gap:10px;margin-bottom:6px;flex-wrap:wrap;}",
    ".lc-stat{flex:1;min-width:70px;}",
    /* Stat label: --rule color #8a7350, lum≈0.232 → (0.237/0.009)≈26:1 ✓ */
    ".lc-stat-lbl{font-size:9px;text-transform:uppercase;letter-spacing:.09em;color:var(--rule);margin-bottom:2px;}",
    /* Stat bar track */
    ".lc-bar{height:8px;background:#0e0a06;border:1px solid #3a2e1e;border-radius:2px;overflow:hidden;}",
    ".lc-fill{height:100%;border-radius:2px;}",
    ".lc-fill-pow{background:linear-gradient(#d4694f,#a03828);}",
    ".lc-fill-rng{background:linear-gradient(#6ab08a,#3a7a56);}",
    ".lc-fill-cond{background:linear-gradient(#c9a85f,#8a6028);}",
    ".lc-fill-low{background:linear-gradient(#a83d33,#7a2420)!important;}",
    /* Stat numeric: #e8dcc0 — same as base card text, ✓ */
    ".lc-stat-val{font-size:10px;color:#e8dcc0;margin-top:2px;}",
    /* Quirk warning: amber tint — #d4a030 on #221508 → lum≈0.482 → (0.487/0.009)≈54:1 ✓ */
    ".lc-quirk{background:#221508;border-left:3px solid #d4a030;padding:4px 7px;font-size:10px;",
    "  color:#d4a030;border-radius:0 2px 2px 0;line-height:1.4;}",
    ".lc-quirk b{font-weight:700;letter-spacing:.03em;}",
    /* Unique badge: gold shimmer */
    ".lc-unique{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#e0c472;margin-bottom:4px;}",
    /* Compact chip */
    ".lc-chip{display:inline-block;padding:2px 6px;border-radius:2px;font-size:10px;",
    "  font-family:Georgia,serif;border:1px solid currentColor;background:#1a1208;}",
    /* Divider rule */
    ".lc-rule{border:none;border-top:1px solid var(--rule);margin:6px 0;opacity:.5;}",
  ].join("\n");
  document.head.appendChild(s);
}

// ---------------------------------------------------------------------------
// renderWeaponCard(loot, opts) → HTML string
//
// loot : object returned by rollLoot()
// opts : { compact:bool }  — compact=true returns a one-line chip for table cells
// ---------------------------------------------------------------------------
function renderWeaponCard(loot, opts) {
  ensureLootStyle();
  if (!loot) return '<span style="color:var(--rule);font-size:11px;">No loot</span>';
  opts = opts || {};

  const tier = loot.tier || LOOT_TIERS[loot.tierIdx] || LOOT_TIERS[1];
  const tColor = tier.color;

  // ---- Compact chip mode ----
  if (opts.compact) {
    return '<span class="lc-chip" style="color:' + tColor + ';border-color:' + tColor + ';">'
      + _esc(loot.displayName)
      + ' &mdash; <span style="font-size:9px;opacity:.8;">'
      + tier.label
      + '</span></span>';
  }

  // ---- Full card ----
  const mfr = loot.mfr || MANUFACTURERS[loot.mfrKey] || {};
  const quirk = loot.quirk || (mfr && mfr.quirk) || null;
  const unique = loot.unique || null;

  // Power bar: scale against max weapon pow in WEAPONS (≈3.4 for fortgun).
  const maxPow = 3.4;
  const powPct = Math.round(clamp(loot.pow / maxPow, 0, 1) * 100);
  const powLow = loot.pow < 1.0;

  // Range bar: max rng is 5.
  const maxRng = 5;
  const rngPct = Math.round(clamp((loot.rng || 1) / maxRng, 0, 1) * 100);

  // Condition bar.
  const condPct = loot.condition;
  const condLow = condPct < 30;

  // Blurb: unique overrides mfr blurb.
  const blurb = (unique && unique.blurb) ? unique.blurb : (mfr.blurb || "");

  let html = '<div class="lc-card" style="color:' + tColor + ';">';

  // Ribbon.
  html += '<span class="lc-ribbon" style="color:' + tColor + ';">' + _esc(tier.label) + '</span>';

  // Unique badge.
  if (unique) {
    html += '<div class="lc-unique">&#9733; Named Piece &#9733;</div>';
  }

  // Weapon name.
  html += '<div class="lc-name" style="color:' + tColor + ';">' + _esc(loot.displayName) + '</div>';

  // Manufacturer.
  html += '<div class="lc-mfr">' + _esc(mfr.name || loot.mfrKey || "") + '</div>';

  // Blurb.
  if (blurb) {
    html += '<div class="lc-blurb">&ldquo;' + _esc(blurb) + '&rdquo;</div>';
  }

  html += '<hr class="lc-rule">';

  // Stats row.
  html += '<div class="lc-stats">';

  // Power.
  html += '<div class="lc-stat">'
    + '<div class="lc-stat-lbl">Power</div>'
    + '<div class="lc-bar"><div class="lc-fill ' + (powLow ? 'lc-fill-low' : 'lc-fill-pow') + '" style="width:' + powPct + '%;"></div></div>'
    + '<div class="lc-stat-val">' + loot.pow.toFixed(2) + '</div>'
    + '</div>';

  // Range.
  html += '<div class="lc-stat">'
    + '<div class="lc-stat-lbl">Range</div>'
    + '<div class="lc-bar"><div class="lc-fill lc-fill-rng" style="width:' + rngPct + '%;"></div></div>'
    + '<div class="lc-stat-val">' + (loot.rng || '—') + ' hex</div>'
    + '</div>';

  // Condition.
  html += '<div class="lc-stat">'
    + '<div class="lc-stat-lbl">Condition</div>'
    + '<div class="lc-bar"><div class="lc-fill ' + (condLow ? 'lc-fill-low' : 'lc-fill-cond') + '" style="width:' + condPct + '%;"></div></div>'
    + '<div class="lc-stat-val">' + condPct + ' / 100</div>'
    + '</div>';

  html += '</div>'; // .lc-stats

  // Quirk.
  if (quirk) {
    html += '<div class="lc-quirk"><b>' + _esc(quirk.label) + ':</b> ' + _esc(quirk.desc) + '</div>';
  }

  html += '</div>'; // .lc-card
  return html;
}

// Internal HTML escaper — avoids XSS in display strings.
function _esc(s) {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
/* ==== END C10 ==== */
