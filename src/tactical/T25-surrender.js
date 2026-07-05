/* ============================================================================
   src/tactical/T25-surrender.js  —  TACTICAL ENGINE · E49a (D258) + E49b (D261)
   ENVELOPMENT-SURRENDER + STRAGGLER-SHEDDING (SL-1v2, first-break-only)

   The two D242-approved E49 mechanics, built to the AARON-LOCKED design law
   docs/design/e49-surrender-straggler-design.md. The combined D255 build went
   honestly RED on the law's own §3.3 gate — attributed 100% to the original
   per-EVENT SL-1 by the isolated A/B legs (D256; engine rout frequency is
   0.45–16 breaks/unit, so ANY per-event rate compounds uncontrolled, with a
   feedback amplifier) — Aaron SPLIT the ledger (D257), the surrender half
   shipped as E49a (D258), and shedding was REDESIGNED as §5 SL-1v2 (D259):
   FIRST-BREAK-ONLY, landed here as E49b (D261 — the D260 first landing went red
   on the zero-headroom Chancellorsville gate, which Aaron re-anchored as the
   gate owner; law §6). The gap E49 closes: the
   universal model had NO way for a broken force to be permanently lost short
   of death — a router rallied after 6 safe seconds at zero man-loss, forever
   (the D242 Shiloh/Gettysburg flip REDs and the D249/D251 PM2 inversion class).

   - SL-1v2 STRAGGLER-SHEDDING (§5, D259): when a formation FIRST breaks — its
     first transition into state "routing" (the T0 rout roll) — round(men × f),
     f = SHED_FRAC 0.05, of the men PRESENT scatter to the missing ledger, exactly
     ONCE per unit per phase (the sticky per-unit shedDone flag, spawn-initialized
     false; T8 phased battles field fresh rosters -> one collapse per fresh
     commitment). Re-breaks shed NOTHING (the anti-compounding law — the D256
     per-event form died on exactly that). Deterministic, no fldRng; f is the
     one-time collapse fraction and is NEVER raised toward any band/column/gate
     (SL-7 as extended by §5.2). Silent ledger: no announce, no marker — the
     after-action MISSING column + teaching sentence carry it (§5.2 answer 4).

   - SL-2 ENVELOPMENT-SURRENDER: a router whose corridor to its own home edge is
     blocked by steady enemy formations (DIRECTIONAL — strictly between router and
     home edge; RALLY_R-class lateral band; no nearer steady friendly = the rescue
     clause) accrues surrenderT while rallyT is SUPPRESSED (blocked ≠ safe); at
     RALLY_SECS it surrenders — men bank to the captured ledger, the unit leaves
     the field (state "captured", the fldKill sibling). Batteries surrender their
     guns (logged); cavalry gets NO exemption (one rule — the mobility-fidelity
     debt is the law's documented compromise). No pathfinding, no RNG, O(N) scans.
   - SL-3 SCOPE: fires ONLY when __FIELD.attacker is set (asymmetric battles);
     the symmetric sandbox is byte-identical (the E48 holdLive precedent). The T0
     seams carry the gate; these functions guard again (belt and braces).
   - SL-4 ACCOUNTING: battleCas keeps meaning TOTAL men lost (fielded − survivors —
     captured men flow in with zero new wiring). __FIELD.captured/missing are
     labeled SUBSETS for reporting, NEVER added to battleCas (the double-count
     guard). Killed/wounded is DERIVED: cas − captured − missing. T2 campaign
     fractions are UNCHANGED v1 (total-loss — the OR convention).
   - SL-5/SL-6: fully symmetric (§27 — player and AI identically, every tier; the
     B-5 cushions stay upstream); no fldRng draw anywhere in this module.
   - SL-8 PRESENTATION: surrender announce + a static WHITE-FLAG prisoner marker
     at the yield point (shape carries the meaning — CVD-safe, not color-alone;
     static -> reduceMotion-safe) + the after-action killed/wounded · captured ·
     missing columns (fldPrisonerEndHtml, the fldOnOver seam).

   Bare-name globals (__FIELD, FLD, the fld* T0 helpers, window.THREE inside
   runtime fns only). All helpers uniquely prefixed + defined once. No literal
   comment-closer inside this block.
   ============================================================================ */

/* SL-1v2: f = 0.05 — the ONE universal first-break collapse fraction (5% of the
   men PRESENT scatter when a formation first breaks — the §5.2 re-anchored
   rationale; never per-battle, never back-solved, never raised — SL-7/D74). */
FLD.SHED_FRAC = 0.05;

/* SL-1v2: the FIRST break sheds stragglers to the missing pool — exactly once per
   unit (sticky shedDone, spawn-initialized false in fldMakeUnit; phased battles
   re-arm via their fresh per-phase rosters). Called from the T0 rout roll (the
   __FIELD.routEverCount++ transition), gated on __FIELD.attacker there AND here.
   Re-breaks shed nothing; round(men × f) ≤ men for all men ≥ 1, so no clamp is
   needed (a clamp would signal the refuted maxMen-anchored form — §5.1).
   Deterministic — no fldRng draw (SL-6). */
function fldShedStragglers(u) {
  if (__FIELD._e49NoShed) return;   // sticky ISOLATION test hook (the _officersOff class) — the §3 A/B's surrender-only leg; never set by any live path
  if (!__FIELD.attacker || !u || !u.alive) return;
  if (u.shedDone) return;
  u.shedDone = true;                                       // consumed on the FIRST break even if the shed rounds to 0
  var shed = Math.round(u.men * FLD.SHED_FRAC);
  if (shed <= 0) return;
  u.men -= shed;
  if (__FIELD.missing) __FIELD.missing[u.side] = (__FIELD.missing[u.side] || 0) + shed;
}

/* SL-2: is the router's corridor home BLOCKED? The flight lane is the constant-x
   ray toward fldHomeEdgeZ(u.side) (the T0 rout movement). A blocker is a STEADY
   enemy (the existing state enum — no new men-floor constant) within a RALLY_R
   lateral half-band of the lane whose z lies STRICTLY BETWEEN the router and the
   home edge (the DIRECTIONAL clause — a pursuer behind never blocks). Blocked
   needs ≥1 blocker AND no steady friendly nearer than the nearest blocker (the
   rescue clause). Fog-blind ground truth, like the rally/objective scans (SL-9);
   officers/trains live outside __FIELD.units -> excluded by construction. */
function fldSurrenderBlocked(u) {
  var homeZ = fldHomeEdgeZ(u.side), dir = (homeZ > u.z) ? 1 : -1;
  var U = __FIELD.units, nearest = -1, i, e, d;
  for (i = 0; i < U.length; i++) {
    e = U[i];
    if (e.side === u.side || !e.alive || e.state !== "steady") continue;
    if (Math.abs(e.x - u.x) > FLD.RALLY_R) continue;       // outside the lateral band of the flight lane
    if ((e.z - u.z) * dir <= 0) continue;                  // DIRECTIONAL: behind (or abreast of) the router
    if ((homeZ - e.z) * dir <= 0) continue;                // not strictly short of the home edge
    d = fldDist(u, e);
    if (nearest < 0 || d < nearest) nearest = d;
  }
  if (nearest < 0) return false;
  for (i = 0; i < U.length; i++) {
    e = U[i];
    if (e === u || e.side !== u.side || !e.alive || e.state !== "steady") continue;
    if (fldDist(u, e) < nearest) return false;             // a steady friendly is nearer — the corridor can be reopened
  }
  return true;
}

/* SL-2: the per-tick surrender step for a ROUTING unit (called from the T0 routing
   branch BEFORE the rally scan; gated on __FIELD.attacker there and here). Returns
   true when the corridor is blocked (rallyT suppressed — blocked ≠ safe — and
   surrenderT accrued; surrenders at the RALLY_SECS grace, no leader modifier v1);
   false when the corridor is clear (surrenderT reset -> the verbatim rally scan
   runs unchanged). */
function fldSurrenderStep(u, dt) {
  if (__FIELD._e49NoSurrender) return false;   // sticky ISOLATION test hook — the §3 A/B's shedding-only leg; never set by any live path
  if (!__FIELD.attacker) return false;
  if (!fldSurrenderBlocked(u)) { u.surrenderT = 0; return false; }
  u.rallyT = 0;                                            // blocked SUPPRESSES rally (the D255 clause)
  u.surrenderT = (u.surrenderT || 0) + dt;
  if (u.surrenderT >= FLD.RALLY_SECS) fldSurrender(u);
  return true;
}

/* SL-2: the surrender itself — the fldKill sibling. Men bank to the captured
   SUBSET ledger (SL-4); a battery's guns are logged as captured guns; the unit
   leaves the field. Announce + a prisoner marker at the yield point (SL-8). */
function fldSurrender(u) {
  if (!u.alive) return;
  var men = Math.max(0, Math.round(u.men));
  u.alive = false; u.men = 0; u.state = "captured"; u.surrenderT = 0;
  __FIELD.surrenderEverCount = (__FIELD.surrenderEverCount || 0) + 1;
  if (__FIELD.captured) __FIELD.captured[u.side] = (__FIELD.captured[u.side] || 0) + men;
  if (u.guns && __FIELD.capturedGuns) __FIELD.capturedGuns[u.side] = (__FIELD.capturedGuns[u.side] || 0) + u.guns;
  if (__FIELD.lastSeen) delete __FIELD.lastSeen[u.id];     // like fldKill: a captured unit leaves no fog "ghost"
  if (__FIELD.prisonerMarkers) __FIELD.prisonerMarkers.push({ x: u.x, z: u.z, side: u.side, name: u.name, men: men, guns: u.guns || 0 });
  var msg = u.name + " surrenders — " + _fldPrisComma(men) + " men captured" + (u.guns ? " with " + u.guns + " guns" : "") + ".";
  fldAnnounce(msg);
  if (typeof fldScenarioBanner === "function") { try { fldScenarioBanner(msg, u.side); } catch (e) {} }
}

/* SL-8: the 2D prisoner marker — a static WHITE FLAG at each yield point (the
   SHAPE carries the meaning; the halo'd caption carries the count — CVD-safe,
   never color-alone; no animation -> reduceMotion-safe by construction). */
function fld2dDrawPrisoners(ctx, v) {
  var M = __FIELD.prisonerMarkers; if (!M || !M.length) return;
  for (var i = 0; i < M.length; i++) {
    var m = M[i], cx = v.ox + m.x * v.s, cz = v.oz + m.z * v.s;
    ctx.save();
    ctx.strokeStyle = "rgba(13,10,7,0.9)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, cz + 8); ctx.lineTo(cx, cz - 11); ctx.stroke();   // the pole
    ctx.fillStyle = "#f2ecdc"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, cz - 11); ctx.lineTo(cx + 10, cz - 7.5); ctx.lineTo(cx, cz - 4); ctx.closePath();
    ctx.fill(); ctx.stroke();                                                          // the white pennant
    ctx.font = "9px Georgia"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    var cap = _fldPrisComma(m.men) + " captured";
    ctx.lineWidth = 3; ctx.strokeStyle = "rgba(13,10,7,0.88)"; ctx.strokeText(cap, cx, cz + 19);
    ctx.fillStyle = "#e6ddc6"; ctx.fillText(cap, cx, cz + 19);
    ctx.restore();
    ctx.textAlign = "start";
  }
}

/* SL-8: the 3D prisoner marker sync (the fld3dRender seam). A dedicated scene
   group rebuilt only when the marker count changes (surrender events are rare);
   static dark pole + white pennant — same reduceMotion/CVD reasoning as the 2D
   path. Disposed with the scene (fld3dDispose drops the ref). */
function fld3dSyncPrisoners() {
  var T = window.THREE; if (!T || !__FIELD.scene) return;
  var M = __FIELD.prisonerMarkers || [];
  var g = __FIELD._pris3dGroup;
  if (!g || g.parent !== __FIELD.scene) {
    if (!M.length) return;
    g = new T.Group(); g.name = "prisonerMarkers"; g.userData._n = -1;
    __FIELD.scene.add(g); __FIELD._pris3dGroup = g;
  }
  if (g.userData._n === M.length) return;
  while (g.children.length) {
    var ch = g.children[0];
    if (ch.traverse) ch.traverse(function (o) {
      if (o.geometry && o.geometry.dispose) o.geometry.dispose();
      if (o.material && o.material.dispose) o.material.dispose();
    });
    g.remove(ch);
  }
  for (var i = 0; i < M.length; i++) {
    var m = M[i], y = (typeof fldTerrainH === "function") ? fldTerrainH(m.x, m.z) : 0;
    var mk = new T.Group(); mk.position.set(m.x, y + 2, m.z);
    var pole = new T.Mesh(new T.CylinderGeometry(1.2, 1.2, 46, 6), new T.MeshLambertMaterial({ color: "#2a2018" }));
    pole.position.y = 23; mk.add(pole);
    var flag = new T.Mesh(new T.PlaneGeometry(20, 12), new T.MeshBasicMaterial({ color: "#f2ecdc", side: T.DoubleSide }));
    flag.position.set(10, 40, 0); mk.add(flag);
    g.add(mk);
  }
  g.userData._n = M.length;
}

/* SL-4/SL-8: the per-side battle tally with the SUBSET columns. Phased battles
   read the T8 cumulative ledgers (the last phase is accumulated before "over");
   single-objective battles compute fielded − survivors over the live roster and
   read the run ledgers directly. kw is DERIVED (cas − captured − missing; display
   floor 0 against fractional-men rounding noise). */
function _fldPrisTally() {
  var t = { US: { cas: 0, cap: 0, mis: 0, kw: 0 }, CS: { cas: 0, cap: 0, mis: 0, kw: 0 } }, s, i;
  if (__FIELD.phases && __FIELD.battleCas) {
    t.US.cas = Math.round(__FIELD.battleCas.US || 0); t.CS.cas = Math.round(__FIELD.battleCas.CS || 0);
    t.US.cap = Math.round((__FIELD.battleCaptured || {}).US || 0); t.CS.cap = Math.round((__FIELD.battleCaptured || {}).CS || 0);
    t.US.mis = Math.round((__FIELD.battleMissing || {}).US || 0); t.CS.mis = Math.round((__FIELD.battleMissing || {}).CS || 0);
  } else {
    var fielded = { US: 0, CS: 0 }, surv = { US: 0, CS: 0 };
    for (i = 0; i < __FIELD.units.length; i++) {
      var u = __FIELD.units[i]; if (u.side !== "US" && u.side !== "CS") continue;
      fielded[u.side] += Math.max(0, u.maxMen || 0);
      if (u.alive) surv[u.side] += Math.max(0, u.men || 0);
    }
    for (s = 0; s < 2; s++) {
      var sd = s === 0 ? "US" : "CS";
      t[sd].cas = Math.max(0, Math.round(fielded[sd] - surv[sd]));
      t[sd].cap = Math.round((__FIELD.captured || {})[sd] || 0);
      t[sd].mis = Math.round((__FIELD.missing || {})[sd] || 0);
    }
  }
  t.US.kw = Math.max(0, t.US.cas - t.US.cap - t.US.mis);
  t.CS.kw = Math.max(0, t.CS.cas - t.CS.cap - t.CS.mis);
  return t;
}

/* SL-8: the after-action columns box (the fldOnOver seam). Asymmetric battles
   only ("" in the symmetric sandbox, where both ledgers are structurally zero —
   SL-3). Reports killed/wounded · captured · missing · total per side, the OR
   convention note, and captured guns when any battery yielded. */
function fldPrisonerEndHtml() {
  if (!__FIELD.attacker) return "";
  var t = _fldPrisTally();
  var _gSrc = (__FIELD.phases && __FIELD.battleCapturedGuns) ? __FIELD.battleCapturedGuns : (__FIELD.capturedGuns || {});   // phased battles report the ALL-phase gun total
  var gUS = Math.round(_gSrc.US || 0), gCS = Math.round(_gSrc.CS || 0);
  function _fldPrisRow(label, r, col) {
    return '<div style="display:flex;justify-content:space-between;gap:8px;padding:3px 0;border-top:1px solid #4a3c28;font-size:12.5px;">' +
      '<span style="color:' + col + ';min-width:88px;text-align:left;">' + label + '</span>' +
      '<span style="flex:1;text-align:right;">' + _fldPrisComma(r.kw) + '</span>' +
      '<span style="flex:1;text-align:right;">' + _fldPrisComma(r.cap) + '</span>' +
      '<span style="flex:1;text-align:right;">' + _fldPrisComma(r.mis) + '</span>' +
      '<span style="flex:1;text-align:right;font-weight:bold;">' + _fldPrisComma(r.cas) + '</span></div>';
  }
  return '<div style="text-align:left;background:#15110b;border:1px solid #715e3e;border-radius:6px;padding:12px 14px;margin-bottom:16px;">' +
    '<div style="color:#d8c87a;font-weight:bold;margin-bottom:4px;">The butcher\'s bill</div>' +
    '<div style="display:flex;justify-content:space-between;gap:8px;font-size:11px;opacity:.65;letter-spacing:.5px;">' +
      '<span style="min-width:88px;"></span><span style="flex:1;text-align:right;">KILLED &amp; WOUNDED</span>' +
      '<span style="flex:1;text-align:right;">CAPTURED</span><span style="flex:1;text-align:right;">MISSING</span>' +
      '<span style="flex:1;text-align:right;">TOTAL LOSS</span></div>' +
    _fldPrisRow("Union", t.US, "#9fb6d8") + _fldPrisRow("Confederate", t.CS, "#d8a79f") +
    ((gUS || gCS) ? '<div style="font-size:12px;opacity:.85;margin-top:6px;">Guns captured &mdash; ' +
      (gUS ? "Union lost " + gUS : "") + (gUS && gCS ? " &middot; " : "") + (gCS ? "Confederate lost " + gCS : "") + '.</div>' : '') +
    '<div style="font-size:11px;opacity:.55;margin-top:6px;">Captured and missing men are part of each side\'s total loss &mdash; the Official Records convention.' +
      ((t.US.mis + t.CS.mis) > 0 ? ' Missing counts the stragglers who scattered when a brigade first broke.' : '') + '</div>' +
  '</div>';
}

/* the shared thousands-separator (uniquely prefixed — T8's _fldComma is phased-only). */
function _fldPrisComma(n) { n = Math.round(n || 0); return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
