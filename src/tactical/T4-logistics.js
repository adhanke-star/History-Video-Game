/* ============================================================================
   src/tactical/T4-logistics.js  —  TACTICAL ENGINE · PHASE B-3 (IN-BATTLE LOGISTICS)

   The AMMUNITION ECONOMY + deeper fatigue. V1-CHECKLIST Phase B-3: "ammo + fatigue
   depth (seeded; deepen) + supply." T0 already drains a brigade's cartridge boxes as
   it fires (fire tapers, then stops at zero) and tires it with marching/fighting —
   but a brigade could never REPLENISH, and an exhausted brigade was only mildly
   slowed. This module deepens all three:

     - SUPPLY SOURCES. Each side fields a rear AMMUNITION TRAIN with a finite battle
       RESERVE. A brigade that is NOT in close action and is within the train's reach
       slowly refills its cartridge boxes, drawing down the reserve. When the reserve
       runs dry the army "runs low on ammunition" — the real battle-decider behind the
       20th Maine's bayonet charge at Little Round Top (out of cartridges) and many a
       stalled assault. The train's reserve + reach scale with the strategic SUPPLY you
       built (bridgeArmy supply / the Engineer Corps), and a raid-supply order cuts the
       enemy's — so logistics you won on the President's Desk pay off on the field.

     - RESUPPLY DOCTRINE (AI). A low-ammo brigade that is not under immediate assault
       falls back to its train to refill (and rest), then returns — the historical
       rotation of spent units to the rear. A brigade out of cartridges with the enemy
       on it stands to the bayonet (melee needs no powder) rather than fleeing.

     - EXHAUSTION. A brigade pushed past its limit becomes SPENT (a deeper move penalty
       on top of the base fatigue slow); pulled back to rest, it recovers.

   ARCHITECTURE: ADDITIVE + fully GATED on __FIELD.logistics (default ON every live
   launch). The field/bullrun/fog/autopause/ai/campaign-link probes set sticky
   __FIELD._logisticsOff and probe-officers sets it too -> with logistics off NO trains
   are built, fldLogisticsStep / the AI override never run, and u.exhausted is never set
   (so the (u.exhausted) read in T0 fldStepMovement is falsy) -> those baselines stay
   BYTE-IDENTICAL. The layer's own coverage = tools/probe-logistics.mjs. DETERMINISM:
   no RNG anywhere here -> same seed reproduces the battle. Bare-name globals (G,
   GAME_DATA, __FIELD, FLD, bridgeArmy, the fld* T0 helpers, _fldCamp from T2,
   fldPlayerSide from T3). All helpers uniquely prefixed + defined once. No literal
   comment-closer in this block.
   ============================================================================ */

var FLDL = {
  RESUPPLY_REACH: 300,     // a brigade within this of its own train can refill (yd)
  RESUPPLY_RATE: 12,       // ammo points/s regained while refilling (DISENGAGED, near the train)
  RESUPPLY_COMBAT_R: 240,  // a living enemy within this -> ENGAGED, no refilling. A brigade must BREAK CONTACT
                           // (pull out of the firing line to the train) to refill — you can't hand up cartridge
                           // boxes under fire (the 20th Maine at Little Round Top). So the ammo economy is a real
                           // tempo cost on BOTH sides (rotate fresh units forward), not free sustained fire.
  RESERVE_DRAW: 0.42,      // train reserve units spent per ammo point delivered
  RESERVE_MAX: 300,        // a side's battle ammunition reserve (scaled by strategic supply)
  LOW_AMMO: 24,            // at/below this a brigade is "low on ammunition" (the AI seeks resupply)
  CRIT_AMMO: 8,            // at/below this it is effectively out — the bayonet, not the volley
  SAFE_PULLBACK_R: 200,    // a low-ammo AI brigade falls back to resupply only if no enemy is within this (else it stands)
  NEAR_TRAIN: 0.7,         // "already at the train" = within this fraction of RESUPPLY_REACH (don't keep marching back)
  EXHAUST: 84,             // fatigue above this -> SPENT (a deeper move penalty; recovers on rest)
  ATK_FOG_RESUPPLY: 0,     // under FOG the attacker resupplies at this fraction of normal — advancing BLIND it cannot run its trains forward
                           // (it has outrun its supply, the culminating point, worse in fog). 0 = fights with what it carries. Restores "fog aids
                           // the defender" (D58/D64): without it the attacker sustained the long fog fire-trade by cycling to its safe rear train, and
                           // a long fire-trade favours numbers (attacker) over cover (defender) — the fog-ON CS 8/8->0/8 flip. The threshold is sharp
                           // (even 0.15 leaves the inversion; only ~0 restores it). 1.0 = no choke; the DEFENDER is never choked.
  ATK_STANDOFF_RESUPPLY: 0,// an AI-LED brigade of a CAUTIOUS-doctrine attacker (fog OFF) resupplies at this fraction of normal — the
                           // fog choke's fog-OFF analog (E62/D281). The D272 cautious posture holds at ATK_ASSAULT_R and trades fire
                           // instead of assaulting, which re-opens the same free-sustained-fire hole in CLEAR weather: the AI attacker
                           // cycles spent brigades to its rear train and grinds the defender past the clock. The choke binds EXACTLY the
                           // brigades the doctrine commands (u.ai — the posture is an AI-COMMAND input; T0 fldAiAttacker consults it only
                           // for AI-led units): the piecemeal command the posture models is Inferred to have been no better at keeping
                           // cartridges moving forward than at coordinating its assaults, so the AI attacker fights with what it carries.
                           // A HUMAN player's brigades are UNBOUND — orders and resupply both (the alt-history hook: outfight the command
                           // failure; deliberate rotation to the train stays a legitimate, designed tempo cost). DEFENDER never choked.
};

/* ===========================================================================
   BUILD  (T0 fldResetRun hook) — one ammunition train per side, in the rear.
   =========================================================================== */
function fldBuildSupply() {
  __FIELD.trains = null;
  if (!__FIELD.logistics) return;                 // the gate: OFF -> no trains -> the layer is wholly inert
  var sd = __FIELD.scenData, dataSup = (sd && sd.supply) ? sd.supply : null;
  var trains = {};
  var sides = ["US", "CS"], k;
  for (k = 0; k < sides.length; k++) {
    var side = sides[k];
    if (!fldSideHasUnits(side)) continue;          // a side with no units gets no train
    var pos = (dataSup && dataSup[side]) ? dataSup[side] : fldSupplyRearPos(side);
    trains[side] = {
      side: side, x: pos.x, z: pos.z, name: (pos.name || (side === "US" ? "Union ordnance train" : "Confederate ordnance train")),
      radius: FLDL.RESUPPLY_REACH, reserve: fldSupplyReserve(side), reserveMax: fldSupplyReserve(side), alive: true,
    };
  }
  __FIELD.trains = trains;
}
function fldSideHasUnits(side) {
  var U = __FIELD.units, i;
  if (U) for (i = 0; i < U.length; i++) if (U[i].side === side) return true;
  // a side whose whole force DETRAINS as reinforcements has no T=0 units but still needs a train (trains are built
  // once at launch, before any spawn) — scan the reinforcement schedule so it is not left unsupplied all battle.
  var R = __FIELD.reinforce;
  if (R) for (i = 0; i < R.length; i++) { var sp = R[i] && R[i].spec; if (sp && sp.side === side) return true; }
  return false;
}
/* the rear of a side, with a DELIBERATE asymmetry that is both historical and balance-restoring:
   - a DEFENDER (or a symmetric-sandbox side) keeps its train JUST BEHIND THE OBJECTIVE it holds, so it refills
     WHILE denying the ground (it fights on its own depots);
   - an ATTACKER's train sits behind its START LINE — it advances AWAY from its supply, so a deep assault
     outruns its cartridges (Clausewitz's culminating point; the offensive that runs dry stalls). This keeps
     the ammunition economy DEFENDER-FAVORING (consistent with cover + fog), not a free gift to the attacker. */
function fldSupplyRearPos(side) {
  var sx = 0, n = 0, U = __FIELD.units;
  for (var i = 0; i < U.length; i++) { var u = U[i]; if (u.side !== side) continue; sx += u.x; n++; }
  var obj = __FIELD.objective, oz = obj ? obj.z : FLD.FIELD_H / 2, r = obj ? obj.r : FLD.OBJ_R;
  var cx = n ? sx / n : (obj ? obj.x : FLD.FIELD_W / 2);
  var homeZ = fldHomeEdgeZ(side), dir = (homeZ > oz) ? 1 : -1;            // toward this side's home edge
  var isAttacker = (__FIELD.attacker === side);                          // null (symmetric sandbox) -> false for both
  var back = isAttacker ? (r + 400) : (r + 120);                         // attacker: far behind its start; defender: just behind the objective
  var z = fldClamp(oz + dir * back, 40, FLD.FIELD_H - 40);
  return { x: fldClamp(cx, 120, FLD.FIELD_W - 120), z: z };
}
/* the battle ammunition reserve: scaled by the strategic SUPPLY the player built (campaign), else nominal;
   a raid-supply order cuts the enemy's. Deterministic. */
function fldSupplyReserve(side) {
  var base = FLDL.RESERVE_MAX;
  try {
    var C = (typeof _fldCamp === "function") ? _fldCamp() : null;
    if (__FIELD.campaignCtx && C) {
      var ps = (C.side === "CS") ? "CS" : "US";
      if (side === ps) {
        var sup = 50;
        if (typeof bridgeArmy === "function") { var a = bridgeArmy(C); if (a && typeof a.supply === "number" && isFinite(a.supply)) sup = a.supply; }
        // sup is bridgeArmy(C).supply (the engineered supply rating — may differ from the raw warroom value, the bridge
        // folds in a momentum term), clamped 0..100. Curve on THAT value: sup 50 -> ~1.0x ; 100 -> ~1.45x ; 0 -> ~0.55x.
        base = FLDL.RESERVE_MAX * (0.55 + fldClamp(sup, 0, 100) / 100 * 0.9);
      } else {
        var bp = (C.battlePrep) || {};
        base = FLDL.RESERVE_MAX * (bp.raidSupply ? 0.6 : 0.95);                  // the enemy you raided fights short of cartridges
      }
    }
  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("fldInitialAmmo:", e); }
  // difficulty/realism presets (B-5): supply generosity severity (>1 generous / <1 strict; 1.0 = neutral = byte-identical).
  // The severity is clamped >0 at the preset apply seam; floor the rounded reserve at >=1 as defense-in-depth so a
  // malformed/hand-edited preset can never produce a non-positive ammunition reserve.
  base *= (__FIELD.sev ? __FIELD.sev.supply : 1);
  return Math.max(1, Math.round(base));
}
function fldSupplyFor(side) { var t = __FIELD.trains; return (t && t[side]) ? t[side] : null; }

/* ===========================================================================
   THE PER-TICK STEP  (T0 fldSimStep seam — runs before officers/morale).
   Refills cartridge boxes from the train, flags low-ammo / spent, drains the reserve.
   =========================================================================== */
function fldLogisticsStep(dt) {
  if (!__FIELD.logistics) return;
  var U = __FIELD.units, i;
  for (i = 0; i < U.length; i++) {
    var u = U[i]; if (!u.alive) continue;
    u.exhausted = (u.fatigue > FLDL.EXHAUST);                 // SPENT — a deeper move penalty (read in T0 fldStepMovement)
    u.resupplying = false;
    if (u.state === "routing") { u.ammoLow = (u.ammo <= FLDL.LOW_AMMO); continue; }
    var src = fldSupplyFor(u.side);
    // ATTACKER RESUPPLY CHOKES — both defend the layer's own NEUTRALITY invariant (the ammo economy is texture +
    // the strategic-supply payoff; it must never decide a battle the no-logistics engine decides the other way):
    //  - FOG CULMINATION (D66 fog-fix): under fog the ATTACKER cannot run its trains forward — advancing blind it
    //    has outrun its supply (Clausewitz's culminating point) and fights with what it carries (ATK_FOG_RESUPPLY
    //    ~ 0). Without this the attacker sustained the long fog fire-trade by cycling fresh brigades back to its
    //    safe rear train, and a long fire-trade favours numbers (the attacker) over cover (the defender) —
    //    INVERTING "fog aids the defender" (D58/D64): the empirically-measured fog-ON CS 8/8 -> 0/8 flip.
    //  - CAUTIOUS STAND-OFF (E62/D281 — the D66 class, fog-OFF, AI-LED brigades only): the D272 accurate-input
    //    cautious posture (assaultDoctrine "cautious": Bull Run / Fredericksburg / Malvern Hill + cautious
    //    phases) holds at ATK_ASSAULT_R and trades fire instead of assaulting — re-opening the same hole in
    //    clear weather. Measured at the D279 checkpoint (bullrun1, officers/arms/badges OFF, fog OFF): logistics
    //    OFF = CS 8/8 vs logistics ON = CS 3/8, the US train draining ~300 -> ~0-54 to grind five
    //    historically-correct defender holds into LATE attacker wins. ATK_STANDOFF_RESUPPLY (~0) closes it for
    //    the AI-led brigades the doctrine actually commands (u.ai — a HUMAN attacker is unbound, orders and
    //    resupply both, so the shipped alt-history teaching stands and no hidden nerf touches the player),
    //    restoring logistics ON == OFF in both postures and both fog states (probe-logistics BALANCE v2 pins the
    //    fixed vector; probe-arms owns the OFF baseline).
    // The DEFENDER keeps full supply (it fights on its own depots); a non-cautious fog-OFF attacker resupplies
    // normally; any disengaged brigade of a non-choked side is never choked.
    var atkChoke = (__FIELD.attacker && u.side === __FIELD.attacker)
      ? (__FIELD.fog ? FLDL.ATK_FOG_RESUPPLY : ((__FIELD._atkCautious && u.ai) ? FLDL.ATK_STANDOFF_RESUPPLY : 1.0))
      : 1.0;
    if (src && src.alive && src.reserve > 0 && u.ammo < 100 && !fldUnitInCloseAction(u)) {
      if (fldDist(u, src) <= src.radius) {
        var regain = Math.min(FLDL.RESUPPLY_RATE * dt * atkChoke, 100 - u.ammo, src.reserve / FLDL.RESERVE_DRAW);
        if (regain > 0) { u.ammo += regain; src.reserve -= regain * FLDL.RESERVE_DRAW; u.resupplying = true; }
      }
    }
    u.ammoLow = (u.ammo <= FLDL.LOW_AMMO);
  }
}
function fldUnitInCloseAction(u) {
  var U = __FIELD.units;
  for (var i = 0; i < U.length; i++) {
    var e = U[i];
    if (e.side === u.side || !e.alive) continue;
    if (__FIELD.fog && typeof fldVisible === "function" && !fldVisible(u.side, e)) continue;   // under fog, react only to enemies this side can SEE (consistent with fldAiGeneric/Attacker/Defender — no acting on hidden info)
    if (fldDist(e, u) <= FLDL.RESUPPLY_COMBAT_R) return true;
  }
  return false;
}

/* ===========================================================================
   RESUPPLY DOCTRINE  (T0 fldAiUnit top seam — returns true to OVERRIDE the normal AI).
   A low-ammo AI brigade not under immediate assault falls back to its train to refill +
   rest, then (once refilled) the normal AI resumes. A brigade out of powder with the
   enemy on it is left to the normal AI (it holds / goes to the bayonet — melee needs none).
   =========================================================================== */
function fldLogisticsAiUnit(u) {
  if (!__FIELD.logistics || !u.alive || u.state === "routing") return false;
  // E62/D281: an AI-led cautious fog-OFF attacker brigade is CHOKED to nothing (ATK_STANDOFF_RESUPPLY ~ 0) —
  // there is nothing to be had at the train, so the brigade STANDS with what it carries (fires dry, then the
  // bayonet — the module's existing last-argument doctrine) instead of abandoning the line for a dry errand.
  // That matches the no-logistics baseline (no trains -> no rotation), which is exactly what the neutrality
  // invariant demands. (This seam only ever runs for AI units — fldAiUnit — but u.ai is asserted anyway so the
  // scope survives any future caller; the LOAD-BEARING human carve-out is the u.ai key on the STEP choke above,
  // since fldLogisticsStep iterates ALL units including human-led ones.) The FOG path is deliberately left as
  // shipped: a BLIND army still marches
  // back to where its trains should be (it cannot know they are empty-handed), and the D66-probed fog baseline
  // stays byte-identical.
  if (!__FIELD.fog && __FIELD._atkCautious && u.ai && __FIELD.attacker && u.side === __FIELD.attacker && FLDL.ATK_STANDOFF_RESUPPLY <= 0) return false;
  // only a brigade that is genuinely OUT breaks off to the train (a last resort, not a tempo weapon) — a merely
  // "low" brigade fights on and tops up passively during lulls, so neither side can cycle fresh fire endlessly.
  if (u.ammo > FLDL.CRIT_AMMO) return false;
  // NEVER abandon the objective to refill: a brigade holding the contested ground stands and fires dry, then
  // goes to the bayonet (the 20th Maine) — rear/reinforcing brigades are the ones that rotate back to the train.
  if (__FIELD.objective && fldDist(u, __FIELD.objective) < __FIELD.objective.r) return false;
  var src = fldSupplyFor(u.side);
  if (!src || !src.alive || src.reserve <= 0) return false;       // nowhere to refill -> fight on as normal
  if (fldDist(u, src) <= src.radius * FLDL.NEAR_TRAIN) return false;   // already at the train -> let it refill while the normal AI fights
  // under immediate assault -> do NOT turn the back to resupply (the normal AI holds / bayonets)
  var U = __FIELD.units;
  for (var i = 0; i < U.length; i++) {
    var e = U[i];
    if (e.side === u.side || !e.alive) continue;
    if (__FIELD.fog && typeof fldVisible === "function" && !fldVisible(u.side, e)) continue;   // under fog, only a SEEN enemy holds the brigade in place (no acting on hidden info — D58/D64)
    if (fldDist(e, u) <= FLDL.SAFE_PULLBACK_R) return false;
  }
  // fall back to the train to refill (face the threat-ward home so it can about-face on return)
  var face = Math.atan2(src.x - u.x, -(src.z - u.z));
  u.formation = "column"; u.order = { type: "move", tx: src.x, tz: src.z, tface: face };
  return true;
}

/* ===========================================================================
   HUD  (T0 fldRenderHud seams)
   =========================================================================== */
function fldLogisticsHudSelected(u) {
  if (!__FIELD.logistics || !u) return "";
  var s = "";
  if (u.ammo <= FLDL.CRIT_AMMO) s = '<span style="color:#cf7a5a;">&#9888; Out of cartridges — to the bayonet</span>';
  else if (u.resupplying) s = '<span style="color:#8fb47a;">&#9876; Resupplying from the train</span>';
  else if (u.ammoLow) s = '<span style="color:#d2a85f;">Low on ammunition</span>';
  if (u.exhausted) s += (s ? ' &middot; ' : '') + '<span style="color:#cf9a6a;">Spent</span>';
  return s ? '<div style="font-size:12px;margin-top:2px;">' + s + '</div>' : "";
}
function fldLogisticsHudReserve() {
  if (!__FIELD.logistics) return "";
  var ps = (typeof fldPlayerSide === "function") ? fldPlayerSide() : "US";
  var src = fldSupplyFor(ps); if (!src) return "";
  var pct = Math.round(fldClamp(src.reserve / Math.max(1, src.reserveMax), 0, 1) * 100);
  var word = pct > 60 ? "ample" : (pct > 25 ? "running low" : (pct > 0 ? "nearly out" : "exhausted"));
  var col = pct > 60 ? "#8fb47a" : (pct > 25 ? "#d2a85f" : "#d49888");
  return '<div style="opacity:.8;margin-top:5px;font-size:12px;">Ammunition train: <span style="color:' + col + ';">' + word + '</span> (' + pct + '%)</div>';
}

/* end-screen teaching payoff (T0 fldOnOver seam) — the ammunition economy, if a reserve ran low. */
function fldLogisticsEndHtml() {
  if (!__FIELD.logistics) return "";
  var t = __FIELD.trains; if (!t) return "";
  var notes = [], s;
  for (s in t) {
    if (!Object.prototype.hasOwnProperty.call(t, s)) continue;
    var tr = t[s]; var pct = tr.reserveMax ? (tr.reserve / tr.reserveMax) : 1;
    if (pct <= 0.18) notes.push((s === "US" ? "The Union" : "The Confederate") + " ordnance ran low — the cartridge boxes could not be kept full.");
  }
  if (!notes.length) return "";
  return '<div style="text-align:left;background:#15110b;border:1px solid #715e3e;border-radius:6px;padding:12px 14px;margin-bottom:16px;">' +
    '<div style="color:#d8c87a;font-weight:bold;margin-bottom:6px;">The ammunition told</div>' +
    '<div style="font-size:13px;opacity:.9;line-height:1.5;">A Civil War brigade carried ~40 rounds; a hot hour emptied them. Holding ground meant keeping the trains up — and when the cartridges ran out, the bayonet was the only argument left (the 20th Maine at Little Round Top). ' + _fldEscL(notes.join(" ")) + '</div></div>';
}
function _fldEscL(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

/* ===========================================================================
   2D RENDERER  (T0 fld2dDraw seam) — an ammunition wagon + a faint resupply ring.
   Fog: the player's own train is always shown; an enemy train only when scouted near.
   =========================================================================== */
function fldDrawSupply(ctx, v) {
  if (!__FIELD.logistics) return;
  var t = __FIELD.trains; if (!t) return;
  var ps = (typeof fldPlayerSide === "function") ? fldPlayerSide() : "US", s;
  for (s in t) {
    if (!Object.prototype.hasOwnProperty.call(t, s)) continue;
    var tr = t[s]; if (!tr.alive) continue;
    if (!fldSupplySeen(tr, ps)) continue;
    var cx = v.ox + tr.x * v.s, cz = v.oz + tr.z * v.s;
    var col = tr.side === "US" ? "#9fb6d8" : "#d8a79f";
    // resupply reach (faint dashed ring)
    ctx.save(); ctx.globalAlpha = 0.14; ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.setLineDash([4, 7]);
    ctx.beginPath(); ctx.arc(cx, cz, tr.radius * v.s, 0, 7); ctx.stroke(); ctx.restore();
    // the wagon: a small box + two wheels
    ctx.save();
    ctx.fillStyle = "#5a4432"; ctx.fillRect(cx - 9, cz - 5, 18, 9);
    ctx.strokeStyle = "#2a2018"; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(cx - 6, cz + 5, 3, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 6, cz + 5, 3, 0, 7); ctx.stroke();
    ctx.fillStyle = col; ctx.fillRect(cx - 9, cz - 8, 18, 3);   // the side-coloured tilt cover
    ctx.restore();
    if (typeof fld2dLabel === "function") fld2dLabel(ctx, "❈ Train", cx, cz + 20);
  }
}
function fldSupplySeen(tr, ps) {
  if (!__FIELD.fog || tr.side === ps) return true;
  var U = __FIELD.units;
  for (var i = 0; i < U.length; i++) { var u = U[i]; if (u.side !== tr.side || !u.alive) continue; if (fldDist(u, tr) <= 200 && fldVisible(ps, u)) return true; }
  return false;
}

/* ===========================================================================
   3D RENDERER  (T0 fld3dInit / fld3dRender seams) — a wagon box + a ground ring.
   =========================================================================== */
function fld3dBuildSupply() {
  var T = window.THREE; if (!T || !__FIELD.scene) return;
  fld3dDisposeSupply();
  __FIELD._sup3d = {};
  var t = __FIELD.trains; if (!t) return;
  var grp = new T.Group(); __FIELD.scene.add(grp); __FIELD._sup3dGroup = grp; var s;
  for (s in t) {
    if (!Object.prototype.hasOwnProperty.call(t, s)) continue;
    var tr = t[s];
    var col = tr.side === "US" ? "#9fb6d8" : "#d8a79f";
    var g = new T.Group();
    var box = new T.Mesh(new T.BoxGeometry(26, 14, 16), new T.MeshLambertMaterial({ color: "#5a4432" })); box.position.y = 11; g.add(box);
    var cover = new T.Mesh(new T.BoxGeometry(27, 5, 17), new T.MeshLambertMaterial({ color: col })); cover.position.y = 20; g.add(cover);
    var ring = new T.Mesh(new T.RingGeometry(Math.max(8, tr.radius - 6), tr.radius, 48), new T.MeshBasicMaterial({ color: col, side: T.DoubleSide, transparent: true, opacity: 0.10 }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 1.2; ring.name = "ring"; g.add(ring);
    grp.add(g); __FIELD._sup3d[tr.side] = g;
  }
}
function fld3dSyncSupply() {
  var t = __FIELD.trains, map = __FIELD._sup3d; if (!t || !map) return;
  var ps = (typeof fldPlayerSide === "function") ? fldPlayerSide() : "US", s;
  for (s in t) {
    if (!Object.prototype.hasOwnProperty.call(t, s)) continue;
    var tr = t[s], g = map[tr.side]; if (!g) continue;
    var shown = tr.alive && fldSupplySeen(tr, ps);
    g.visible = shown; if (!shown) continue;
    var y = (typeof fldTerrainH === "function") ? fldTerrainH(tr.x, tr.z) : 0;
    g.position.set(tr.x, y, tr.z);
  }
}
function fld3dDisposeSupply() {
  var grp = __FIELD._sup3dGroup; if (!grp) { __FIELD._sup3d = null; return; }
  try {
    grp.traverse(function (o) { if (o.geometry && o.geometry.dispose) o.geometry.dispose(); if (o.material && o.material.dispose) o.material.dispose(); });
    if (grp.parent) grp.parent.remove(grp);
  } catch (e) {}
  __FIELD._sup3dGroup = null; __FIELD._sup3d = null;
}
