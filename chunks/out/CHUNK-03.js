/* ==== §11 — AI (CHUNK-03) ==== */
function runAI(cb) {
  const B = G.battle;
  let fired = false;

  function done_cb() {
    if (!fired) { fired = true; cb(); }
  }

  // Guard: if battle already over on entry (beginTurn found victory), fire cb once and return.
  if (!G.battle || B.over) { done_cb(); return; }

  // Collect living enemy units in priority order:
  //   artillery + naval first, then infantry + cavalry, then hq last.
  //   Routed units are included — they still need retreatHex processing.
  const D = DIFF[G.settings.diff];
  const A = D.aiAgg;    // aggression 0..1.25
  const S = D.skill;    // targeting skill 0..1

  const rawUnits = B.units.filter(u => u.alive && u.side === B.enemySide);

  // Sort into buckets
  const artNav  = rawUnits.filter(u => u.type === "art" || u.type === "nav" || u.type === "fort");
  const infCav  = rawUnits.filter(u => u.type === "inf" || u.type === "cav");
  const hqUnits = rawUnits.filter(u => u.type === "hq");
  const queue   = artNav.concat(infCav).concat(hqUnits);

  // Track which units we have processed so each is visited at most once.
  const processed = new Set();

  let idx = 0;

  function step() {
    // Re-check battle reference and over flag on every tick.
    if (G.battle !== B || B.over) { done_cb(); return; }

    if (idx >= queue.length) {
      // All units processed — schedule final callback with a small delay
      // so the last draw has a chance to settle.
      setTimeout(() => { done_cb(); }, 200);
      return;
    }

    const u = queue[idx];
    idx++;

    // Skip if already processed (shouldn't happen given queue build, but safety).
    if (processed.has(u.id)) { setTimeout(step, 0); return; }
    processed.add(u.id);

    // Skip dead units that may have been killed mid-phase by a return volley.
    if (!u.alive) { setTimeout(step, 150); return; }

    // ---- Routed units: retreat toward home edge, then continue. ----
    if (u.routed) {
      retreatHex(u);
      u.done = true;
      if (typeof refreshUI === "function") refreshUI();
      if (typeof draw === "function") draw();
      setTimeout(step, 150);
      return;
    }

    // ---- HQ units: move toward friendly combat-unit centroid, avoid adjacency to enemy. ----
    if (u.type === "hq") {
      processHQ(u);
      if (typeof refreshUI === "function") refreshUI();
      if (typeof draw === "function") draw();
      setTimeout(step, 150);
      return;
    }

    // ---- Combat units (art, nav, fort, inf, cav). ----
    processCombatUnit(u);
    if (typeof refreshUI === "function") refreshUI();
    if (typeof draw === "function") draw();
    setTimeout(step, 150);
  }

  // -----------------------------------------------------------------------
  // HQ movement logic
  // -----------------------------------------------------------------------
  function processHQ(u) {
    if (u.done) return;

    // Compute centroid of friendly combat units.
    const friends = B.units.filter(f => f.alive && f.side === B.enemySide && f.type !== "hq");
    let goal = null;
    if (friends.length) {
      const sc = friends.reduce((acc, f) => { acc.c += f.c; acc.r += f.r; return acc; }, {c: 0, r: 0});
      goal = [Math.round(sc.c / friends.length), Math.round(sc.r / friends.length)];
    }

    if (!goal) { u.done = true; return; }

    // Build reachable set, pick hex closest to centroid that is not adjacent to any enemy.
    G.reach = reachable(u);
    if (G.reach.size === 0) { G.reach = null; u.done = true; return; }

    // HQ is enemy-side; player units are enemies of the HQ.
    const playerSide = B.playerSide;

    let bestKey = null;
    let bestDist = Infinity;

    for (const [key] of G.reach) {
      const [hc, hr] = key.split(",").map(Number);
      // Avoid hexes adjacent to player units if possible.
      const adjPlayer = neighbors(hc, hr).some(n => {
        const o = unitAt(n[0], n[1]);
        return o && o.side === playerSide && o.type !== "hq";
      });
      const d = hexDist([hc, hr], goal);
      // Prefer non-adjacent hex; use a penalty of +1000 for adjacent enemy hexes.
      const score = d + (adjPlayer ? 1000 : 0);
      if (score < bestDist) { bestDist = score; bestKey = key; }
    }

    if (bestKey) {
      const [tc, tr] = bestKey.split(",").map(Number);
      doMove(u, tc, tr);
    }

    G.reach = null;
    u.done = true;
  }

  // -----------------------------------------------------------------------
  // Combat unit AI
  // -----------------------------------------------------------------------
  function processCombatUnit(u) {
    if (u.done) return;

    // ---- 1. Attempt fire if targets available. ----
    const fTargets = fireTargets(u);
    if (fTargets.size > 0) {
      const tgt = chooseBestFireTarget(u, fTargets, S);
      if (tgt) {
        resolveFire(u, tgt[0], tgt[1]);
        // resolveFire sets u.fired=true, u.done=true internally.
        // B.over may now be true — next tick's guard will catch it.
        return;
      }
    }

    // ---- 2. Attempt charge if targets available and ratio favorable. ----
    const cTargets = chargeTargets(u);
    if (cTargets.size > 0 && !u.fired) {
      const bestCharge = chooseBestChargeTarget(u, cTargets, A);
      if (bestCharge) {
        resolveCharge(u, bestCharge[0], bestCharge[1]);
        // resolveCharge sets u.done=true, u.fired=true, u.moved=true internally.
        return;
      }
    }

    // ---- 3. Defensive posture check (defender holding good ground). ----
    if (shouldHoldGround(u, A)) {
      // Entrench with 50% chance.
      if (chance(0.5) && u.ent < 3) {
        u.ent = Math.min(3, u.ent + 1);
      }
      u.done = true;
      return;
    }

    // ---- 4. Advance: move toward goal, then fire if possible after move. ----
    advanceUnit(u, S);
  }

  // -----------------------------------------------------------------------
  // Fire target selection
  // -----------------------------------------------------------------------
  function chooseBestFireTarget(u, targets, skill) {
    // Build candidate list.
    const candidates = [];
    for (const key of targets) {
      const [tc, tr] = key.split(",").map(Number);
      const tgt = unitAt(tc, tr);
      if (!tgt) continue;
      const tt = tileAt(tc, tr);
      const tDef = tt ? TERRAIN[tt.t].def : 1.0;
      const score = tgt.strength * tDef; // lower = better target
      candidates.push({ tc, tr, score });
    }
    if (!candidates.length) return null;

    // Sort ascending (weakest/least defended first = best target).
    candidates.sort((a, b) => a.score - b.score);

    // With probability=skill, pick the best; otherwise pick randomly.
    if (chance(skill)) {
      return [candidates[0].tc, candidates[0].tr];
    } else {
      const c = pick(candidates);
      return [c.tc, c.tr];
    }
  }

  // -----------------------------------------------------------------------
  // Charge target selection and ratio check
  // -----------------------------------------------------------------------
  function chooseBestChargeTarget(u, targets, agg) {
    const threshold = 1.25 - 0.35 * agg;

    for (const key of targets) {
      const [tc, tr] = key.split(",").map(Number);
      const tgt = unitAt(tc, tr);
      if (!tgt) continue;
      const tt = tileAt(tc, tr);
      const tDef = tt ? TERRAIN[tt.t].def : 1.0;

      const atkPower = u.strength * ARM[u.type].melee * (u.morale / u.maxMor);
      const defPower = tgt.strength * ARM[tgt.type].melee * tDef * (1 + tgt.ent * 0.3);

      const ratio = atkPower / Math.max(1, defPower);
      if (ratio > threshold) {
        return [tc, tr];
      }
    }
    return null;
  }

  // -----------------------------------------------------------------------
  // Defensive hold check
  // -----------------------------------------------------------------------
  function shouldHoldGround(u, agg) {
    // Defenders on objective or fort hexes with no enemies within 2 hexes hold ground.
    const isDefender = B.atkSide !== B.enemySide;
    if (!isDefender) return false;

    const tile = tileAt(u.c, u.r);
    if (!tile) return false;
    const onGoodGround = tile.t === "fort" || tile.t === "ridge" || tile.t === "hills" ||
                         (tile.obj !== null && tile.obj !== undefined);
    if (!onGoodGround) return false;

    // Check if any player unit is within 2 hexes.
    const nearEnemy = B.units.some(e => {
      return e.alive && e.side === B.playerSide && hexDist([u.c, u.r], [e.c, e.r]) <= 2;
    });
    if (nearEnemy) return false;

    return true;
  }

  // -----------------------------------------------------------------------
  // Advance movement
  // -----------------------------------------------------------------------
  function advanceUnit(u, skill) {
    G.reach = reachable(u);

    if (G.reach.size === 0) {
      // Blocked — no reachable hexes. Just mark done and leave.
      G.reach = null;
      u.done = true;
      return;
    }

    const goalHex = computeMoveGoal(u);

    // Find best reachable hex: minimize hexDist to goal, tie-break by terrain def (higher = better).
    let bestKey = null;
    let bestDist = Infinity;
    let bestDef = -1;

    for (const [key] of G.reach) {
      const [hc, hr] = key.split(",").map(Number);
      const d = goalHex ? hexDist([hc, hr], goalHex) : 0;
      const tt = tileAt(hc, hr);
      const tDef = tt ? TERRAIN[tt.t].def : 1.0;
      if (d < bestDist || (d === bestDist && tDef > bestDef)) {
        bestDist = d;
        bestDef = tDef;
        bestKey = key;
      }
    }

    if (bestKey) {
      const [tc, tr] = bestKey.split(",").map(Number);
      doMove(u, tc, tr);
    }

    G.reach = null;

    // After moving, attempt fire if not yet fired.
    if (!u.fired && !u.done) {
      const fTargets = fireTargets(u);
      if (fTargets.size > 0) {
        const tgt = chooseBestFireTarget(u, fTargets, skill);
        if (tgt) {
          resolveFire(u, tgt[0], tgt[1]);
          // resolveFire sets u.done=true internally; B.over may now be true.
          return;
        }
      }
    }

    u.done = true;
  }

  // -----------------------------------------------------------------------
  // Goal hex computation for movement
  // -----------------------------------------------------------------------
  function computeMoveGoal(u) {
    // Attacker mindset: go for unowned objectives.
    if (B.atkSide === B.enemySide) {
      // Find nearest objective not owned by enemy side.
      let bestObj = null;
      let bestObjDist = Infinity;
      for (const obj of B.M.objs) {
        if (obj.owner === B.enemySide) continue; // already own it
        const d = hexDist([u.c, u.r], [obj.c, obj.r]);
        if (d < bestObjDist) { bestObjDist = d; bestObj = obj; }
      }
      if (bestObj) return [bestObj.c, bestObj.r];
    }

    // Defender mindset or no unowned objectives: move toward nearest player unit.
    // AI ignores fog — it can see all player units.
    let nearestPlayer = null;
    let nearestDist = Infinity;
    for (const pu of B.units) {
      if (!pu.alive || pu.side !== B.playerSide) continue;
      const d = hexDist([u.c, u.r], [pu.c, pu.r]);
      if (d < nearestDist) { nearestDist = d; nearestPlayer = pu; }
    }
    if (nearestPlayer) return [nearestPlayer.c, nearestPlayer.r];

    return null; // hold
  }

  // -----------------------------------------------------------------------
  // Kick off the chain.
  // -----------------------------------------------------------------------
  if (queue.length === 0) {
    // No enemy units at all — fire callback after minimal delay.
    setTimeout(() => { done_cb(); }, 200);
    return;
  }

  setTimeout(step, 150);
}
