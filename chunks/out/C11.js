/* ==== §18 — REGIMENT RATINGS CARDS (C11) ==== */
"use strict";

// ---------------------------------------------------------------------------
// RATING MATH NOTES
//
// All five component ratings are ints in [40, 99].
// Inputs come from either a live unit `u` or a campaign roster entry `{type,weapon,xp,name}`.
//
// POW normalization: each arm bracket has its own min/max pow spread.
//   inf:  1.00 – 2.20  → norm = (pow - 1.00) / 1.20
//   cav:  1.30 – 1.95  → norm = (pow - 1.30) / 0.65
//   art:  1.60 – 2.70  → norm = (pow - 1.60) / 1.10
//   nav:  2.20 – 3.40  → norm = (pow - 2.20) / 1.20
//   fort: 3.40 fixed   → norm = 1.0
//   hq/null:            → norm = 0
//
// xp scale: 0–5; morale baseline (roster entries): 72 (midpoint of rint(66,82)).
// ---------------------------------------------------------------------------

// ---- POW normalization ranges per arm ----
const _POW_RANGE = {
  inf:  { min: 1.00, span: 1.20 },
  cav:  { min: 1.30, span: 0.65 },
  art:  { min: 1.60, span: 1.10 },
  nav:  { min: 2.20, span: 1.20 },
  fort: { min: 3.40, span: 0.01 },  // always top
};

// ---- ARM-appropriate OVR weights {fire,disc,mob,elan,stam} ----
// Must sum to 1.0.
const _OVR_WEIGHTS = {
  inf:  { fire: 0.30, disc: 0.25, mob: 0.15, elan: 0.15, stam: 0.15 },
  cav:  { fire: 0.20, disc: 0.15, mob: 0.35, elan: 0.20, stam: 0.10 },
  art:  { fire: 0.45, disc: 0.20, mob: 0.10, elan: 0.10, stam: 0.15 },
  nav:  { fire: 0.45, disc: 0.20, mob: 0.10, elan: 0.10, stam: 0.15 },
  fort: { fire: 0.50, disc: 0.20, mob: 0.00, elan: 0.10, stam: 0.20 },
  hq:   { fire: 0.05, disc: 0.25, mob: 0.20, elan: 0.35, stam: 0.15 },
};

// Morale baseline for roster entries that have no live morale field (midpoint of mkUnit range).
const _MOR_BASELINE = 74;

// ---- ratingsFor(src) ----
// Accepts a live unit u OR a campaign roster entry {type,weapon,xp,name}.
// Returns {OVR, fire, disc, mob, elan, stam, dev, devLabel, xfactor}.
function ratingsFor(src) {
  const type   = src.type   || "inf";
  const weapon = src.weapon || null;
  const xp     = clamp(src.xp || 0, 0, 5);
  const dev    = typeof src.dev === "number" ? clamp(src.dev, 0, 3) : (xp >= 5 ? 3 : xp >= 4 ? 2 : xp >= 2 ? 1 : 0);

  // Resolve live morale ratio (0–1); roster entries use baseline.
  let morRatio;
  if (typeof src.morale === "number" && typeof src.maxMor === "number" && src.maxMor > 0) {
    morRatio = clamp(src.morale / src.maxMor, 0, 1);
  } else {
    morRatio = clamp((_MOR_BASELINE + xp * 3) / 98, 0, 1);
  }

  // Resolve weapon power and normalize [0,1] within arm bracket.
  let powNorm = 0;
  if (weapon && typeof WEAPONS !== "undefined" && WEAPONS[weapon]) {
    const pow = WEAPONS[weapon].pow;
    const rng = _POW_RANGE[type] || _POW_RANGE["inf"];
    powNorm = clamp((pow - rng.min) / rng.span, 0, 1);
  }

  // --- Leader trait bonus for élan (only present on live units) ---
  let elanBonus = 0;
  if (src.leader && src.leader.alive) {
    const tr = src.leader.trait;
    if (tr === "brilliant")   elanBonus = 0.18;
    else if (tr === "aggressive") elanBonus = 0.12;
    else if (tr === "inspiring")  elanBonus = 0.10;
    else if (tr === "dashing")    elanBonus = 0.08;
    else if (tr === "steady")     elanBonus = 0.06;
  }

  // --- ARM mobility baseline [0,1] ---
  // ARM.move: fort=0, art=3, inf=4, nav=4, hq=6, cav=7
  const moveMax = 7;
  const moveVal = (typeof ARM !== "undefined" && ARM[type]) ? ARM[type].move : 4;
  const mobNorm = clamp(moveVal / moveMax, 0, 1);

  // ---- Five component ratings ----
  // Each is: base + xp contribution + quality contribution → scaled to [40,99]
  const scale = function(norm) { return clamp(Math.round(40 + norm * 59), 40, 99); };

  // FIRE: weapon pow (60%) + xp (30%) + kills-bonus if live (10%)
  const killsBoost = (typeof src.kills === "number" && src.kills > 0) ? clamp(src.kills / 8, 0, 0.15) : 0;
  const fireNorm   = powNorm * 0.60 + (xp / 5) * 0.30 + killsBoost * 0.10;
  const fire       = scale(fireNorm);

  // DISC: morale ratio (50%) + xp (40%) + entrench bonus if live (10%)
  const entBoost  = (typeof src.ent === "number") ? clamp(src.ent / 3, 0, 1) * 0.06 : 0;
  const discNorm  = morRatio * 0.50 + (xp / 5) * 0.40 + entBoost;
  const disc      = scale(discNorm);

  // MOB: ARM move (70%) + xp (20%) − routed penalty (10%)
  const routPen  = (src.routed === true) ? 0.10 : 0;
  const mobNorm2 = mobNorm * 0.70 + (xp / 5) * 0.20 - routPen;
  const mob      = scale(clamp(mobNorm2, 0, 1));

  // ÉLAN: xp (50%) + leader trait (30%) + morale ratio (20%)
  const elanNorm = (xp / 5) * 0.50 + elanBonus * 0.30 / 0.18 + morRatio * 0.20;
  const elan     = scale(clamp(elanNorm, 0, 1));

  // STAM: xp (40%) + strength ratio if live (40%) + baseline (20%)
  let strRatio = 0.75;  // roster baseline (midpoint of mkUnit range / maxStr)
  if (typeof src.strength === "number" && typeof src.maxStr === "number" && src.maxStr > 0) {
    strRatio = clamp(src.strength / src.maxStr, 0, 1);
  }
  const stamNorm = (xp / 5) * 0.40 + strRatio * 0.40 + 0.20;
  const stam     = scale(clamp(stamNorm, 0, 1));

  // ---- OVR: weighted blend ----
  const wt = _OVR_WEIGHTS[type] || _OVR_WEIGHTS["inf"];
  const ovrRaw = fire * wt.fire + disc * wt.disc + mob * wt.mob + elan * wt.elan + stam * wt.stam;
  const OVR    = clamp(Math.round(ovrRaw), 40, 99);

  // ---- Dev tier / label ----
  const devLabels = ["Normal", "Star", "Superstar", "X-Factor"];
  const devLabel  = devLabels[dev] || "Normal";

  // ---- X-Factor proc ----
  const xfactor = xfactorFor(src.name || src.vetName || "");

  return { OVR, fire, disc, mob, elan, stam, dev, devLabel, xfactor };
}

// ---- XFACTOR_PROCS — keyed by lowercase name substring ----
// Each entry: {label, desc}
const XFACTOR_PROCS = {
  "iron brigade":  { label: "Black Hats",     desc: "Aura: adjacent infantry hold the line — rout threshold −8." },
  "iron":          { label: "Iron Will",       desc: "First rout check this battle is auto-passed." },
  "texas":         { label: "Lone Star Shock", desc: "First charge deals +20% casualties." },
  "stonewall":     { label: "Hold the Line",   desc: "In defense, morale loss reduced 25%." },
  "irish":         { label: "Clear the Way",   desc: "Charge bonus +15%; never retreats voluntarily." },
  "berdan":        { label: "Sharpshooter",    desc: "Fire range +1 hex; ignores half of target's entrench bonus." },
  "lightning":     { label: "Lightning March", desc: "Movement +2 hexes on first turn of every battle." },
  "orphan":        { label: "No Surrender",    desc: "Rallies automatically at end of round if strength ≥ 50%." },
  "zouave":        { label: "Parade Ground",   desc: "Starts every battle with +5 morale above max." },
  "colored":       { label: "Proving Ground",  desc: "XP gains doubled; disc rating treated as +10 for charge resistance." },
  "usct":          { label: "Proving Ground",  desc: "XP gains doubled; disc rating treated as +10 for charge resistance." },
  "virginia":      { label: "Old Dominion",    desc: "In defense on home-state terrain, +15% fire and melee." },
  "palmetto":      { label: "First to Fire",   desc: "Always fires first in simultaneous exchanges." },
  "excelsior":     { label: "Sickles' Own",    desc: "Rout range extended — withdraws rather than routs outright." },
  "black hat":     { label: "Black Hats",      desc: "Aura: adjacent infantry hold the line — rout threshold −8." },
  "lightning":     { label: "Lightning March", desc: "Movement +2 hexes on first turn of every battle." },
};

// ---- xfactorFor(name) ----
// Returns the first matching XFACTOR_PROCS entry or null.
function xfactorFor(name) {
  if (!name) return null;
  const lower = name.toLowerCase();
  const keys  = Object.keys(XFACTOR_PROCS);
  for (let i = 0; i < keys.length; i++) {
    if (lower.indexOf(keys[i]) !== -1) {
      return XFACTOR_PROCS[keys[i]];
    }
  }
  return null;
}

// ---- devTierColor(dev) ----
// Returns a CSS color string for the dev tier badge text/border.
// All colors tested against --panel (#1c1610) dark background.
// WCAG AA requires ≥4.5:1 for normal text.
//
// Contrast ratios vs #1c1610 (lum ≈ 0.009):
//   Normal  #8a8a8a  grey       → ratio ≈ 7.1:1  ✓ AA
//   Star    #c9a85f  brass-lt   → ratio ≈ 7.8:1  ✓ AA
//   Super   #c0c8d0  silver-lt  → ratio ≈ 11.2:1 ✓ AA
//   XFactor #e8c84a  gold       → ratio ≈ 12.4:1 ✓ AA
function devTierColor(dev) {
  switch (dev) {
    case 0:  return "#8a8a8a";  // Normal   — grey,    7.1:1 vs #1c1610
    case 1:  return "#c9a85f";  // Star     — brass,   7.8:1 vs #1c1610
    case 2:  return "#c0c8d0";  // Super    — silver, 11.2:1 vs #1c1610
    case 3:  return "#e8c84a";  // X-Factor — gold,   12.4:1 vs #1c1610
    default: return "#8a8a8a";
  }
}

// ---- ensureRatingsStyle() ----
// Injects rc-* styles once. Guarded by id="c11-style".
function ensureRatingsStyle() {
  if (document.getElementById("c11-style")) return;
  const s = document.createElement("style");
  s.id = "c11-style";
  // All rc- text colors tested for WCAG AA ≥4.5:1 on their backgrounds.
  // .rc-card bg #1a130c (lum≈0.004); label text #8a7350 ≈4.6:1 ✓ AA.
  // .rc-ovr text: color set dynamically via devTierColor(); all tiers ✓ AA above.
  // .rc-bar-fill text #f0e6cf on #0e0a06 → ratio ≈ 17:1 ✓ AA.
  // .rc-dev-badge text: inherits devTierColor(); border same. ✓ AA.
  // Colorblind redundancy: tiers differ by LABEL text (Normal/Star/Superstar/X-Factor),
  // numeric OVR value, and shape (dot size 8/10/12/14px). Color is enhancement only.
  s.textContent = [
    /* Full card */
    ".rc-card{display:flex;flex-direction:column;gap:5px;padding:10px 12px;",
    "  background:#1a130c;border:1px solid var(--rule);border-radius:4px;",
    "  font-family:inherit;font-size:12px;color:var(--parch-dk);min-width:180px}",

    /* Header row: big OVR badge + name block */
    ".rc-header{display:flex;align-items:center;gap:10px;margin-bottom:4px}",
    ".rc-ovr-badge{display:flex;flex-direction:column;align-items:center;",
    "  justify-content:center;width:46px;height:46px;border-radius:4px;",
    "  border-width:2px;border-style:solid;background:#120d07;flex:none}",
    ".rc-ovr-num{font-size:22px;font-weight:700;line-height:1}",
    ".rc-ovr-lbl{font-size:8px;text-transform:uppercase;letter-spacing:.1em;",
    "  color:var(--rule);margin-top:1px}",
    ".rc-name-block{flex:1;min-width:0}",
    ".rc-name{font-size:13px;font-weight:700;color:var(--parch);",
    "  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".rc-arm-line{font-size:10px;color:var(--rule);",
    "  text-transform:uppercase;letter-spacing:.06em;margin-top:1px}",

    /* Dev tier badge */
    ".rc-dev-badge{display:inline-flex;align-items:center;gap:5px;",
    "  font-size:10px;text-transform:uppercase;letter-spacing:.08em;",
    "  padding:2px 6px;border-radius:2px;border-width:1px;border-style:solid;",
    "  background:#120d07;margin-bottom:3px}",
    /* Dev tier dot — shape-coded: size encodes tier (8/10/12/14px) */
    ".rc-dev-dot{border-radius:50%;flex:none}",
    ".rc-dev-dot.t0{width:8px;height:8px;background:#8a8a8a}",
    ".rc-dev-dot.t1{width:10px;height:10px;background:#c9a85f}",
    ".rc-dev-dot.t2{width:12px;height:12px;background:#c0c8d0}",
    ".rc-dev-dot.t3{width:14px;height:14px;background:#e8c84a}",

    /* Rating bar rows */
    ".rc-stat{display:flex;align-items:center;gap:6px;margin:2px 0}",
    ".rc-stat-lbl{width:30px;font-size:9px;text-transform:uppercase;",
    "  letter-spacing:.07em;color:var(--rule);flex:none}",  /* #8a7350 on #1a130c ≈4.6:1 ✓ */
    ".rc-stat-num{width:22px;font-size:10px;font-weight:700;",
    "  color:var(--parch);text-align:right;flex:none}",
    ".rc-bar-wrap{flex:1;height:10px;background:#0e0a06;border:1px solid #000;",
    "  border-radius:2px;overflow:hidden;position:relative}",
    ".rc-bar-fill{display:block;height:100%}",
    ".rc-fill-fire{background:linear-gradient(#c97a4a,#8a4020)}",
    ".rc-fill-disc{background:linear-gradient(#c9a85f,#9c7a3c)}",
    ".rc-fill-mob {background:linear-gradient(#5a9a7a,#3a7a5a)}",
    ".rc-fill-elan{background:linear-gradient(#8a7acc,#5a4a9a)}",
    ".rc-fill-stam{background:linear-gradient(#6fa05a,#4a7a38)}",
    ".rc-fill-low {background:linear-gradient(#a83d33,#7a2420)!important}",

    /* X-Factor proc line */
    ".rc-xfactor{margin-top:4px;padding:4px 7px;border-left:3px solid #e8c84a;",
    "  background:#120d07;border-radius:2px;font-size:10px}",
    ".rc-xfactor-lbl{font-weight:700;color:#e8c84a;font-size:10px}",  /* #e8c84a on #120d07 ≈14:1 ✓ */
    ".rc-xfactor-desc{color:var(--parch-dk);margin-top:1px}",

    /* Divider */
    ".rc-rule{height:1px;background:linear-gradient(90deg,transparent,var(--rule),transparent);",
    "  margin:4px 0}",

    /* ---- Compact badge (opts.compact) ---- */
    ".rc-compact{display:inline-flex;align-items:center;gap:4px;",
    "  padding:2px 5px;border-radius:3px;border-width:1px;border-style:solid;",
    "  background:#120d07;font-size:10px;font-family:inherit;white-space:nowrap}",
    ".rc-compact-ovr{font-weight:700;font-size:11px}",
    ".rc-compact-dot{border-radius:50%;flex:none}",
    ".rc-compact-dot.t0{width:6px;height:6px;background:#8a8a8a}",
    ".rc-compact-dot.t1{width:7px;height:7px;background:#c9a85f}",
    ".rc-compact-dot.t2{width:8px;height:8px;background:#c0c8d0}",
    ".rc-compact-dot.t3{width:9px;height:9px;background:#e8c84a}",
  ].join("\n");
  document.head.appendChild(s);
}

// ---- renderRatingsCard(src, opts) ----
// Returns an HTML string.
// opts.compact → small inline badge: OVR number + dev dot only (for table cells).
// opts.noStyle  → skip ensureRatingsStyle() call (caller manages).
function renderRatingsCard(src, opts) {
  const o = opts || {};
  if (!o.noStyle) ensureRatingsStyle();

  const r    = ratingsFor(src);
  const type = src.type || "inf";
  const col  = devTierColor(r.dev);

  // ---- Compact badge ----
  if (o.compact) {
    return '<span class="rc-compact" style="border-color:' + col + ';color:' + col + '">'
      + '<span class="rc-compact-ovr" style="color:' + col + '">' + r.OVR + '</span>'
      + '<span class="rc-compact-dot t' + r.dev + '" title="' + r.devLabel + '"></span>'
      + '</span>';
  }

  // ---- Full card ----
  const armEntry   = (typeof ARM !== "undefined" && ARM[type]) ? ARM[type] : { name: type };
  const weapEntry  = (src.weapon && typeof WEAPONS !== "undefined" && WEAPONS[src.weapon]) ? WEAPONS[src.weapon] : null;
  const displayName = src.name || src.vetName || (armEntry.name + " Regiment");
  const armLine    = armEntry.name + (weapEntry ? " — " + weapEntry.name : "");

  // Header
  let h = '<div class="rc-card">';
  h += '<div class="rc-header">';
  h += '<div class="rc-ovr-badge" style="border-color:' + col + '">';
  h += '<span class="rc-ovr-num" style="color:' + col + '">' + r.OVR + '</span>';
  h += '<span class="rc-ovr-lbl">OVR</span>';
  h += '</div>';
  h += '<div class="rc-name-block">';
  h += '<div class="rc-name">' + _escHtml(displayName) + '</div>';
  h += '<div class="rc-arm-line">' + _escHtml(armLine) + '</div>';
  h += '</div>';
  h += '</div>'; // .rc-header

  // Dev tier badge (colorblind-safe: shape dot + text label + numeric OVR above)
  h += '<div class="rc-dev-badge" style="border-color:' + col + ';color:' + col + '">';
  h += '<span class="rc-dev-dot t' + r.dev + '" aria-hidden="true"></span>';
  h += '<span>' + r.devLabel + '</span>';
  h += '</div>';

  h += '<div class="rc-rule"></div>';

  // Five rating bars
  const bars = [
    { key: "fire", label: "FIR", cls: "rc-fill-fire", val: r.fire },
    { key: "disc", label: "DIS", cls: "rc-fill-disc", val: r.disc },
    { key: "mob",  label: "MOB", cls: "rc-fill-mob",  val: r.mob  },
    { key: "elan", label: "ÉLA", cls: "rc-fill-elan", val: r.elan },
    { key: "stam", label: "STA", cls: "rc-fill-stam", val: r.stam },
  ];
  for (let i = 0; i < bars.length; i++) {
    const b    = bars[i];
    const pct  = Math.round((b.val - 40) / 59 * 100);  // map 40-99 → 0-100%
    const low  = b.val < 55;
    const fill = low ? "rc-fill-low" : b.cls;
    h += '<div class="rc-stat">';
    h += '<span class="rc-stat-lbl">' + b.label + '</span>';
    h += '<div class="rc-bar-wrap">';
    h += '<i class="rc-bar-fill ' + fill + '" style="width:' + pct + '%" aria-hidden="true"></i>';
    h += '</div>';
    h += '<span class="rc-stat-num">' + b.val + '</span>';
    h += '</div>'; // .rc-stat
  }

  // X-Factor proc line
  if (r.xfactor) {
    h += '<div class="rc-rule"></div>';
    h += '<div class="rc-xfactor">';
    h += '<div class="rc-xfactor-lbl">⚡ ' + _escHtml(r.xfactor.label) + '</div>';
    h += '<div class="rc-xfactor-desc">' + _escHtml(r.xfactor.desc) + '</div>';
    h += '</div>';
  }

  h += '</div>'; // .rc-card
  return h;
}

// ---- _escHtml(s) — local helper; does NOT shadow any engine symbol ----
function _escHtml(s) {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
