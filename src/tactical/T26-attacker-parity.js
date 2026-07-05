/* ============================================================================
   src/tactical/T26-attacker-parity.js  —  TACTICAL ENGINE · E53-v2 (D272)
   ATTACKER TACTICAL PARITY — trigger + envelopment wing + wave commit

   D272 amends the D267/D269 build: keep A+B, drop abandonment/recall entirely,
   and scope the mass-capture sidestep valve to active E53 parity only. This
   module writes only attacker AI orders / formation and its own diagnostics.
   It never writes morale, men, casualties, victory, or score state; the combat
   model remains universal and side-agnostic.

   Active only when: asymmetric battle, attackerParity enabled, fog OFF,
   non-cautious attacker posture, AI attacker unit, and not the probe-ai generic
   attacker isolation hook. D64 remains the fallback whenever the trigger is not
   armed or this seam is inactive.

   Bare-name globals: __FIELD, FLD, fld* helpers. No fldRng use.
   ============================================================================ */

FLD.E53_WING_DEPTH = 180;   // station depth beyond obj.r on the rout axis (= 0.75 x RALLY_R)
FLD.E53_WING_X = 120;       // latched-flank lateral offset (= RALLY_R / 2)

/* T25 asks this before using the sidestep capture valve. The valve is scoped to
   parity/fog/generic-isolation, not to the order seam's cautious-posture gate:
   cautious phases still need the D272 sidestep governor so a failed assault
   does not revive the D269 false five-figure capture class. */
function fldParityCaptureValveActive() {
  return !!(__FIELD && __FIELD.attacker && __FIELD.attackerParity &&
    !__FIELD.fog && !__FIELD._aiGenericAtk);
}

/* Per-launch/per-phase module state. T8 fresh phase rosters clear unit flags by
   construction; this reset also clears the flank latch and spread counters. */
function fldParityState() {
  var gen = __FIELD._gen || 0, ph = __FIELD.phaseIdx || 0;
  var st = __FIELD._e53;
  if (!st || st.gen !== gen) {
    st = __FIELD._e53 = {
      gen: gen, ph: ph, lastT: -1,
      armed: false, wingFlankX: null,
      wi: 0, pi: 0,
      wingDeploys: 0, wingFirstT: null, waveTicks: 0, wingByPhase: {},
    };
  }
  if (st.ph !== ph) {
    st.ph = ph; st.lastT = -1; st.armed = false; st.wingFlankX = null;
    st.wi = 0; st.pi = 0;
  }
  return st;
}

/* Army-level trigger + surplus wing peel, recomputed once per AI pass. */
function fldParityRecompute(st) {
  var o = __FIELD.objective, atk = __FIELD.attacker;
  var atkTot = 0, defTot = 0, atkNear = 0, defNear = 0;
  var i, u, d;
  for (i = 0; i < __FIELD.units.length; i++) {
    u = __FIELD.units[i];
    if (!u.alive) continue;
    if (u.side === atk) {
      atkTot += u.men;
      if (u.state !== "routing" && !u._e53Wing) {
        d = fldDist(u, o);
        if (d < FLD.AI_LOCAL_R) atkNear += u.men;
      }
    } else {
      defTot += u.men;
      if (u.state !== "routing" && fldDist(u, o) < FLD.AI_LOCAL_R) defNear += u.men;
    }
  }

  var globRatio = atkTot / Math.max(1, defTot);
  var effLocal = FLD.ATK_LOCAL_RATIO / (__FIELD.aiSkill || 1) *
    fldClamp(1 / Math.max(0.5, globRatio), 0.75, 1.4);
  var canCommit = globRatio >= FLD.ATK_GLOBAL_FLOOR;
  st.armed = canCommit && defNear > 0 && atkNear >= defNear * effLocal;
  if (st.armed) st.waveTicks++;

  if (!st.armed) { st.wi = 0; st.pi = 0; return; }

  if (st.wingFlankX === null) {
    var L = 0, R = 0;
    for (i = 0; i < __FIELD.units.length; i++) {
      u = __FIELD.units[i];
      if (u.side === atk || !u.alive || u.state === "routing") continue;
      if (u.x < o.x) L += u.men; else R += u.men;
    }
    var fx = (L <= R) ? (o.x - FLD.E53_WING_X) : (o.x + FLD.E53_WING_X);
    st.wingFlankX = Math.max(40, Math.min(FLD.FIELD_W - 40, fx));
  }

  var front = [], nAtk = 0, nWing = 0, frontMen = atkNear, bar = defNear * effLocal;
  for (i = 0; i < __FIELD.units.length; i++) {
    u = __FIELD.units[i];
    if (u.side !== atk || !u.alive) continue;
    nAtk++;
    if (u._e53Wing) { nWing++; continue; }
    if (u.state === "routing") continue;
    if (fldDist(u, o) < FLD.AI_LOCAL_R) front.push(u);
  }
  front.sort(function (a, b) { return fldDist(b, o) - fldDist(a, o); });
  for (i = 0; i < front.length && nWing < Math.floor(nAtk / 2); i++) {
    var cu = front[i];
    if (frontMen - cu.men < bar) break;
    cu._e53Wing = true; frontMen -= cu.men; nWing++;
    st.wingDeploys++;
    if (st.wingFirstT === null) st.wingFirstT = Math.round(__FIELD.t);
    st.wingByPhase[st.ph] = (st.wingByPhase[st.ph] || 0) + 1;
  }
  st.wi = 0; st.pi = 0;
}

/* T0 dispatches here before fldAiAttacker. Return true only when this seam
   issued the order; return false to let D64 run verbatim. */
function fldParityAiUnit(u) {
  if (!__FIELD.attacker || !__FIELD.attackerParity || __FIELD.fog || __FIELD._atkCautious || __FIELD._aiGenericAtk) return false;
  if (u.side !== __FIELD.attacker) return false;

  var o = __FIELD.objective, atk = __FIELD.attacker;
  var st = fldParityState();
  if (st.lastT !== __FIELD.t) { st.lastT = __FIELD.t; fldParityRecompute(st); }

  var sgnA = (fldHomeEdgeZ(atk) > o.z) ? 1 : -1;
  var near = null, nd = 1e9, i, e, d;
  for (i = 0; i < __FIELD.units.length; i++) {
    e = __FIELD.units[i];
    if (e.side === u.side || !e.alive) continue;
    d = fldDist(u, e);
    if (d < nd) { nd = d; near = e; }
  }
  var face = near ? Math.atan2(near.x - u.x, -(near.z - u.z)) : Math.atan2(o.x - u.x, -(o.z - u.z));

  if (u._e53Wing) {
    var spread = (st.wi % 5 - 2) * 60; st.wi++;
    var wx = (st.wingFlankX === null ? o.x : st.wingFlankX) + spread;
    var wz = o.z - sgnA * (o.r + FLD.E53_WING_DEPTH);
    u.formation = (fldDist(u, { x: wx, z: wz }) > 160) ? "column" : "line";
    u.order = { type: "move", tx: wx, tz: wz, tface: face };
    return true;
  }

  if (!st.armed) return false;

  var dObj = fldDist(u, o);
  if (dObj < o.r + 90) {
    var best = null, bd = 1e9;
    for (i = 0; i < __FIELD.units.length; i++) {
      e = __FIELD.units[i];
      if (e.side === u.side || !e.alive || e.state === "routing") continue;
      d = fldDist(u, e);
      if (d < bd) { bd = d; best = e; }
    }
    if (best && bd < 260) {
      u.order = { type: "charge", tx: best.x, tz: best.z, tface: Math.atan2(best.x - u.x, -(best.z - u.z)) };
      return true;
    }
  }

  var sp = (st.pi % 5 - 2) * 45; st.pi++;
  var px = o.x + sp, pz = o.z + sgnA * 10;
  u.formation = (fldDist(u, { x: px, z: pz }) > 160) ? "column" : "line";
  u.order = { type: "move", tx: px, tz: pz, tface: face };
  return true;
}
