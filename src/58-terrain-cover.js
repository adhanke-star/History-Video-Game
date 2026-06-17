/* ===========================================================================
   A3 · 58-terrain-cover.js — the terrain COVER hierarchy.

   Aaron's directive (backlog A3): "add named cover — stone wall (strong),
   forest (strong), wood fence (less strong), trenches, boulders, sunken road —
   slotted into the EXISTING TERRAIN def/cover model."

   How it works (investigated against build/base.html):
     · Combat reduces fire damage by dividing by TERRAIN[tile.t].def (resolveFire
       ~1038, return fire ~1051, charge ~1068). The `cover` field on TERRAIN was
       defined but NEVER read. So we ADD six named cover types as new TERRAIN keys
       with real `def` values — combat picks them up automatically through the
       existing .def path. NO fire-function override (lowest engine risk).
     · TERRAIN / TCOL / PALETTE are frozen `const`s, but ADDING keys to a const
       object/array element is legal. We mutate them at module load (this code
       runs after the base defs, before any battle). Unknown terrain keys already
       fall back to gray in the renderer (TCOL[skin][t]||"#bbb"); we add real
       colors so the new tiles paint in period tone.
     · We OVERRIDE authoredMap (frozen-engine override, §8.2) — verbatim base body
       + a decoration pass that stamps the cover types onto the historical features
       the authored maps already label (Antietam's Sunken Road, Devil's Den, the
       Vicksburg redans, the woods …). Gated by diag-classic; revert on regression.

   Adds NO campaign state. New fns: _tcData / _tcTypes / _tcApplyDefs (load-time
   mutation) / _tcCoverFor / tcDecorateMap. Overrides: authoredMap (manifest).
   Bare-name globals (TERRAIN, TCOL, PALETTE, AUTHORED_MAPS, mulberry, hashStr,
   makeTile); _tc* helpers; decoration never weakens a tile or touches water.
   =========================================================================== */

function _tcData() { return gameData("terrain-cover"); }
function _tcTypes() { var D = _tcData(); return (D && D.types && D.types.length) ? D.types : []; }

/* Install the cover types into the frozen engine consts (idempotent). */
function _tcApplyDefs() {
  if (typeof TERRAIN === "undefined") return false;
  var types = _tcTypes();
  for (var i = 0; i < types.length; i++) {
    var t = types[i]; if (!t || !t.id || !t.terrain) continue;
    if (!TERRAIN[t.id]) TERRAIN[t.id] = t.terrain;   // add the new cover terrain (def picked up by combat)
    var cols = t.colors || [];
    if (typeof TCOL !== "undefined" && TCOL.length) {
      for (var s = 0; s < TCOL.length; s++) { var c = cols[s] || cols[cols.length - 1] || "#9a9088"; if (TCOL[s] && !TCOL[s][t.id]) TCOL[s][t.id] = c; }
    }
    if (typeof PALETTE !== "undefined" && PALETTE && PALETTE.length) {
      for (var p = 0; p < PALETTE.length; p++) { var pc = cols[p] || cols[cols.length - 1] || "#9a9088"; if (PALETTE[p] && !PALETTE[p][t.id]) PALETTE[p][t.id] = pc; }
    }
  }
  return true;
}
_tcApplyDefs();   // run at module load (after base defs, before any battle)

/* Map an authored feature label -> the strongest matching cover terrain id (or null).
   The strongest (highest-def) matching type wins, so "Sunken Road redoubt" -> the harder of the two. */
function _tcCoverFor(label) {
  if (!label || typeof TERRAIN === "undefined") return null;
  var s = String(label).toLowerCase(), types = _tcTypes(), best = null, bestDef = -1;
  for (var i = 0; i < types.length; i++) {
    var t = types[i], m = t.match || [];
    var hit = false;
    for (var j = 0; j < m.length; j++) { if (m[j] && s.indexOf(String(m[j]).toLowerCase()) >= 0) { hit = true; break; } }
    if (!hit) continue;
    var def = (TERRAIN[t.id] && typeof TERRAIN[t.id].def === "number") ? TERRAIN[t.id].def : 0;
    if (def > bestDef) { bestDef = def; best = t.id; }
  }
  return best;
}

/* Stamp cover terrain onto an authored map's labelled features. This is a TERRAIN
   SWAP (def + move-cost + color come from the cover type), applied conservatively:
   only when it STRENGTHENS defense (cover.def > current.def) AND never makes the tile
   FASTER to traverse (cover.cost >= current.cost — so high ground / works never become
   cheaper to cross); never on water/river/ford/shoal; objectives/owner/elev untouched
   (only the terrain key changes). Idempotent. */
function tcDecorateMap(M) {
  if (!M || !M.map || !M.key || typeof TERRAIN === "undefined") return 0;
  var feats = M.authoredFeatures || [], stamped = 0, skip = { water: 1, river: 1, ford: 1, shoal: 1 };
  for (var i = 0; i < feats.length; i++) {
    var f = feats[i]; if (!f || typeof f.c !== "number" || typeof f.r !== "number") continue;
    var cover = _tcCoverFor(f.label); if (!cover || !TERRAIN[cover]) continue;
    var tile = M.map[M.key(f.c, f.r)]; if (!tile) continue;
    if (skip[tile.t]) continue;                                   // never wall off a river
    var curT = TERRAIN[tile.t] || {};
    var curDef = (typeof curT.def === "number") ? curT.def : 1;
    var curCost = (typeof curT.cost === "number") ? curT.cost : 1;
    if (TERRAIN[cover].def <= curDef) continue;                   // never weaken an authored position
    var covCost = (typeof TERRAIN[cover].cost === "number") ? TERRAIN[cover].cost : 1;
    if (covCost < curCost) continue;                              // never make a position FASTER to cross (no-speedup guard)
    tile.t = cover; tile.cover = cover; stamped++;                // tag for any future cover-aware code
  }
  return stamped;
}

/* ---- authoredMap OVERRIDE (frozen-engine §8.2): the VERBATIM base body
   (build/base.html 4987-5022) + a decoration pass before the return. ---- */
function authoredMap(bd) {
  const A = AUTHORED_MAPS[bd && bd.id];
  if (!A) return null;
  RND = mulberry(hashStr(bd.id) ^ 0x5C1B1E); // match genMap's deterministic seed
  const GW = A.GW, GH = A.GH, map = {}, key = (c, r) => c + "," + r;
  for (let r = 0; r < GH; r++) {
    const row = A.grid[r] || "";
    for (let c = 0; c < GW; c++) {
      const ch = row[c] || ".";
      const t = A.legend[ch] || "clear";
      map[key(c, r)] = makeTile(c, r, t);
    }
  }
  // objectives — push the actual tile objects so owner updates flow through
  const objs = [];
  (A.objs || []).forEach(o => {
    const t = map[key(o.c, o.r)];
    if (t) { t.obj = { val: o.val }; t.owner = 0; objs.push(t); }
  });
  // deployment zones → per-side Sets of "c,r"
  let deploy = null;
  if (A.deploy && A.deploy.length) {
    deploy = { US: new Set(), CS: new Set() };
    for (let r = 0; r < GH; r++) {
      const row = A.deploy[r] || "";
      for (let c = 0; c < GW; c++) {
        const z = row[c];
        if (z === "U") deploy.US.add(key(c, r));
        else if (z === "C") deploy.CS.add(key(c, r));
      }
    }
  }
  const __M = {
    GW, GH, map, key, objs, naval: false,
    authored: true, authoredFeatures: (A.features || []), deploy,
    ground: (A.ground || "")
  };
  // A3: stamp the named cover hierarchy onto the labelled historical features.
  if (typeof tcDecorateMap === "function") { try { tcDecorateMap(__M); } catch (e) {} }
  return __M;
}
