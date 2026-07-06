/* ============================================================================
   src/tactical/T27-llm-commander.js  —  TACTICAL ENGINE · Q-D270-5 (D283)
   THE LLM FIELD COMMANDER — slice 1: the engine seam (ZERO network)

   Design law: docs/design/llm-opponent-design.md (Aaron-locked, D283). A
   player-configured LLM commands the AI-led army at operational cadence
   through this seam. SLICE 1 ships state + the fog-respecting band-quantized
   digest + the deterministic validation wall + order application + every
   inertness gate and test hook. There is NO network code in this module and
   NO UI: the only plan source is the __FIELD._t27MockPlan test hook, so the
   shipped game cannot activate this seam at all (fldLlmConfigured() is
   honestly false until the slice-2 connector exists). Zero network by
   construction (law §2.4/§7.4).

   Header discipline (the T26 idiom, law §3.1): this module writes ONLY
   u.order / u.formation and its own diagnostics bag __FIELD._t27 — never
   men/morale/casualties/captured/victory/score. NO fldRng use, ever (the
   sim's seeded stream must not be perturbed). NEVER playerCharge (that flag
   is the human-gesture marker; AI order writes stay byte-identical without
   it). Orders map ONLY to the existing vocabulary the engine and the player
   already share: u.order {type:"move"|"hold"|"charge", tx, tz, tface} +
   u.formation "line"|"column". Bare-name globals: __FIELD, FLD, fld*.

   GATES (law §4 — OFF-state byte identity by construction):
   · __FIELD.llmCommander is default absent/false; NOTHING in slice 1 sets it.
     The ARM CONTRACT for slice 2's launch stamp and for probes is:
       __FIELD.llmCommander = true; __FIELD._t27 = null;
     per launch, only from explicit player opts + live connector config. A
     stale llmCommander leaking into a NEW launch (_t27.gen mismatch) is
     self-healed: the first dispatch DISARMS and returns false — consent
     never carries across launches.
   · Sticky _llmOff test hook (the _parityOff idiom) force-refuses.
   · PM3 double lock (law §4.2): hard-refuse whenever __FIELD.autoBoth OR the
     headless renderer (__FIELD.rendererKind === "none") is set — the D277
     war-state-pure replay path (renderer:"none" + autoBoth:true,
     87-auto-resolve.js:98) can never reach the LLM.
   · No-config gate: with no _t27MockPlan and no connector config (slice 1:
     always none), the seam refuses.
   Every refuse leg leaves ZERO _t27 state and writes nothing → every
   existing probe and the whole vet:noreg battery run with the seam
   unreachable, byte-identical by construction (no re-pins).

   Cadence (law §3.3): plan pull every FLD.LLM_PLAN_INTERVAL sim-seconds and
   on phase change — NEVER per-AI-tick (AI_HZ stays engine-only). The attempt
   time advances whether or not the response validates, so a malformed cycle
   retries at the NEXT interval (it never blocks, never busy-loops); the last
   good plan stands in the meantime. Slice 2 makes the pull ASYNC at the
   fldLlmRequestPlan seam (one in-flight max, late responses dropped); the
   slice-1 mock is synchronous by design.

   Plan schema (the wall's contract; slice 2's system prompt states it):
     { "orders": [ { "id": "<brigadeId>", "type": "move"|"hold"|"charge",
         "tx": <0..FLD.FIELD_W>, "tz": <0..FLD.FIELD_H>,
         "tface": <radians, optional>, "formation": "line"|"column" (opt) } ] }
   Wall verdicts (law §3.4): malformed whole response → whole-cycle fallback
   (keep the last good plan); an illegal order (unknown/dead/off-side/player
   brigade, off-map target, unknown enum) → drop THAT order, the brigade
   falls to the REAL engine (defender/T26/D64), never a stub. "hold" anchors
   at the unit's own position (the engine idiom); tx/tz are required on-map
   only for move/charge.
   ============================================================================ */

FLD.LLM_PLAN_INTERVAL = 25;   // sim-seconds between plan pulls (law §3.3; + phase boundaries)
FLD.LLM_BAND_MEN = 250;       // digest strength band (law §3.4: never an exact, citable figure)
FLD.LLM_BAND_POS = 25;        // digest position/geometry band (yards)
FLD.LLM_BAND_CLOCK = 5;       // digest clock band (seconds)

/* Slice-2 seam: is a live connector configured AND enabled? Slice 1 ships no
   connector, so this is honestly FALSE for every player — the seam can only
   ever activate through the _t27MockPlan test hook (zero network). */
function fldLlmConfigured() { return false; }

/* The side the LLM commands: the AI-led army, i.e. the side the human does
   not hold. autoBoth (both sides AI) is hard-refused before this is read. */
function fldLlmSide() {
  var ps = (typeof fldPlayerSide === "function") ? fldPlayerSide() : (__FIELD.playerSide || "US");
  return fldEnemy(ps === "CS" ? "CS" : "US");
}

/* Per-launch/per-phase seam state (the fldParityState pattern). Created ONLY
   after every gate passes, so inert paths never grow a _t27 bag. Phase change
   clears the plan (T8 fields fresh rosters) and forces an immediate re-pull. */
function fldLlmState() {
  var gen = __FIELD._gen || 0, ph = __FIELD.phaseIdx || 0;
  var st = __FIELD._t27;
  if (!st || st.gen !== gen) {
    st = __FIELD._t27 = {
      gen: gen, ph: ph, lastT: -1, planT: -1e9,
      side: fldLlmSide(), plan: null, planN: 0,
      cycles: 0, applied: 0, droppedN: 0, malformed: 0, noResp: 0,
    };
  }
  if (st.ph !== ph) { st.ph = ph; st.lastT = -1; st.planT = -1e9; st.plan = null; st.planN = 0; }
  return st;
}

/* Band helpers — deterministic quantization, no RNG. */
function fldLlmBand(v, b) { return Math.round(v / b) * b; }
function fldLlmCompass(f) {
  // facing convention is atan2(dx, -dz): 0 = N, PI/2 = E, ±PI = S, -PI/2 = W → 8-way band
  var tau = Math.PI * 2, a = ((f % tau) + tau) % tau;
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(a / (Math.PI / 4)) % 8];
}

/* THE DIGEST (law §3.4) — a PURE read of __FIELD: own-side brigades (id, arm,
   strength band, morale state, position, facing, current order), VISIBLE
   enemy contacts only (the same fldVisible the engine AI uses — the D58/D64
   fog law binds the LLM too; an unseen enemy is simply absent, so the LLM can
   be feinted), the objective, a coarse terrain/elevation summary, phase +
   clock. Every number is band-quantized. Writes NOTHING; creates no _t27;
   deterministic for identical state (probe-pinned ×2). */
function fldLlmDigest() {
  var side = fldLlmSide(), o = __FIELD.objective || { x: 0, z: 0, r: 0 };
  var bm = FLD.LLM_BAND_MEN, bp = FLD.LLM_BAND_POS;
  var own = [], enemy = [], i, u;
  for (i = 0; i < __FIELD.units.length; i++) {
    u = __FIELD.units[i];
    if (!u.alive || (u.side !== "US" && u.side !== "CS")) continue;
    if (u.side === side) {
      own.push({
        id: u.id, arm: u.arm, men: fldLlmBand(u.men, bm), state: u.state,
        x: fldLlmBand(u.x, bp), z: fldLlmBand(u.z, bp),
        facing: fldLlmCompass(u.facing), formation: u.formation,
        order: u.order ? { type: u.order.type, tx: fldLlmBand(u.order.tx, bp), tz: fldLlmBand(u.order.tz, bp) } : null,
      });
    } else if (fldVisible(side, u)) {
      enemy.push({
        id: u.id, arm: u.arm, men: fldLlmBand(u.men, bm), state: u.state,
        x: fldLlmBand(u.x, bp), z: fldLlmBand(u.z, bp),
        facing: fldLlmCompass(u.facing), formation: u.formation,
      });
    }
  }
  var t = __FIELD.terrain || {}, ter = { hills: [], woods: [], walls: [], swamps: [], towns: [], forts: [] };
  var hs = fldHills(), ws = fldWalls(), j;
  for (j = 0; j < hs.length; j++) ter.hills.push({ x: fldLlmBand(hs[j].x, bp), z: fldLlmBand(hs[j].z, bp), h: fldLlmBand(hs[j].h || 0, 5), s: fldLlmBand(hs[j].s || 0, bp) });
  for (j = 0; j < ws.length; j++) ter.walls.push({ x1: fldLlmBand(ws[j].x1, bp), z1: fldLlmBand(ws[j].z1, bp), x2: fldLlmBand(ws[j].x2, bp), z2: fldLlmBand(ws[j].z2, bp) });
  var circ = ["woods", "swamps", "towns", "forts"], k, arr;
  for (j = 0; j < circ.length; j++) {
    arr = t[circ[j]] || [];
    for (k = 0; k < arr.length; k++) ter[circ[j]].push({ x: fldLlmBand(arr[k].x, bp), z: fldLlmBand(arr[k].z, bp), r: fldLlmBand(arr[k].r, bp) });
  }
  return {
    side: side, fog: !!__FIELD.fog,
    clock: fldLlmBand(__FIELD.t || 0, FLD.LLM_BAND_CLOCK),
    timeLimit: fldLlmBand(__FIELD.timeLimit || 0, FLD.LLM_BAND_CLOCK),
    phase: { idx: __FIELD.phaseIdx || 0, total: __FIELD.phases ? __FIELD.phases.length : 1 },
    objective: { x: fldLlmBand(o.x, bp), z: fldLlmBand(o.z, bp), r: fldLlmBand(o.r, bp) },
    terrain: ter, own: own, enemy: enemy,
  };
}

/* SLICE-1 PLAN SOURCE — the _t27MockPlan test hook is the ONLY source; the
   slice-2 connector replaces this body with the async adapter dispatch (same
   wall downstream). A hook function is called with the digest (so probes can
   pin the digest-input plumbing); a throwing/absent hook yields null/garbage
   that the wall handles like any failed response. */
function fldLlmRequestPlan(digest) {
  var m = __FIELD._t27MockPlan;
  if (m == null) return null;
  if (typeof m === "function") {
    try { return m(digest); } catch (e) { return "__t27_mock_threw__"; }
  }
  return m;
}

/* THE VALIDATION WALL (law §3.4) — deterministic, pure. Returns
   {ok:false} for a malformed whole response (whole-cycle fallback), else
   {ok:true, orders:<id→sanitized>, n, dropped}. Per-order legality: the id
   must be an alive, AI-led brigade of the commanded side; type/formation in
   vocabulary; tx/tz finite and on-map for move/charge. Later duplicate ids
   overwrite earlier ones (deterministic). Only sanitized primitives are
   kept — raw LLM objects never enter the plan. */
function fldLlmValidatePlan(raw, side) {
  if (!raw || typeof raw !== "object" || !raw.orders || Object.prototype.toString.call(raw.orders) !== "[object Array]") return { ok: false };
  var out = Object.create(null), n = 0, dropped = 0, i, e, u, tx, tz, tf, fm;
  for (i = 0; i < raw.orders.length; i++) {
    e = raw.orders[i];
    if (!e || typeof e !== "object" || typeof e.id !== "string") { dropped++; continue; }
    u = fldById(e.id);
    if (!u || !u.alive || u.side !== side || !u.ai) { dropped++; continue; }
    if (e.type !== "move" && e.type !== "hold" && e.type !== "charge") { dropped++; continue; }
    tx = null; tz = null;
    if (e.type !== "hold") {
      tx = e.tx; tz = e.tz;
      if (typeof tx !== "number" || !isFinite(tx) || tx < 0 || tx > FLD.FIELD_W ||
          typeof tz !== "number" || !isFinite(tz) || tz < 0 || tz > FLD.FIELD_H) { dropped++; continue; }
    }
    fm = null;
    if (e.formation != null) {
      if (e.formation !== "line" && e.formation !== "column") { dropped++; continue; }
      fm = e.formation;
    }
    tf = (typeof e.tface === "number" && isFinite(e.tface)) ? e.tface : null;
    if (out[e.id] === undefined) n++;
    out[e.id] = { type: e.type, tx: tx, tz: tz, tface: tf, formation: fm };
  }
  return { ok: true, orders: out, n: n, dropped: dropped };
}

/* One plan cycle: digest → request → wall → install. The attempt timestamp
   was already advanced by the caller; a null/malformed response keeps the
   LAST GOOD plan (per-brigade command continuity, law §3.4). */
function fldLlmCycle(st) {
  st.cycles++;
  var raw = fldLlmRequestPlan(fldLlmDigest());
  if (raw == null) { st.noResp++; return; }
  var v = fldLlmValidatePlan(raw, st.side);
  if (!v.ok) { st.malformed++; return; }
  st.plan = v.orders; st.planN = v.n; st.droppedN += v.dropped;
}

/* T0 dispatches here (inside the asymmetric block, above fldAiDefender —
   law §3.2) for every AI unit when __FIELD.llmCommander is truthy. Returns
   true ONLY when this seam wrote the unit's order; false → the defender/
   T26/D64 doctrines run verbatim (per-brigade fallback to the REAL engine). */
function fldLlmAiUnit(u) {
  if (!__FIELD.llmCommander) return false;
  var st = __FIELD._t27;
  if (st && st.gen !== (__FIELD._gen || 0)) {           // stale arm from a previous launch:
    __FIELD.llmCommander = false; __FIELD._t27 = null;  // consent never carries across launches
    return false;
  }
  if (__FIELD._llmOff || __FIELD.autoBoth || __FIELD.rendererKind === "none") {
    __FIELD.llmCommander = false;                       // sticky hook + the PM3 double lock (law §4.2)
    if (st) __FIELD._t27 = null;
    return false;
  }
  if (__FIELD._t27MockPlan == null && !fldLlmConfigured()) {  // no plan source → no seam (law §4.1)
    __FIELD.llmCommander = false;
    if (st) __FIELD._t27 = null;
    return false;
  }
  st = fldLlmState();
  if (st.lastT !== __FIELD.t) {                         // once per AI pass, first dispatched unit
    st.lastT = __FIELD.t;
    if (__FIELD.t - st.planT >= FLD.LLM_PLAN_INTERVAL) { st.planT = __FIELD.t; fldLlmCycle(st); }
  }
  if (u.side !== st.side || !u.ai) return false;
  var e = st.plan ? st.plan[u.id] : null;
  if (!e) return false;
  var tx = (e.type === "hold") ? u.x : e.tx;
  var tz = (e.type === "hold") ? u.z : e.tz;
  var tf = (e.tface != null) ? e.tface
    : (e.type === "hold" ? u.facing : Math.atan2(tx - u.x, -(tz - u.z)));
  u.order = { type: e.type, tx: tx, tz: tz, tface: tf };
  if (e.formation) u.formation = e.formation;
  st.applied++;
  return true;
}
