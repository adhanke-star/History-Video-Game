/* ===========================================================================
   T21 — MODERN-ENGINE VISUAL FIDELITY  (Phase H · H5-i2 — the polished HYBRID look)

   The modern (non-hex) real-time engine's "look better than Ultimate General:
   Gettysburg" pass (Aaron, D138/D140). It does NOT flip the global colour
   pipeline — THREE r128 predates the r152 colour-management overhaul, so an ACES
   tone-map / sRGB flip would split the pipeline (the T16 smoke + T17 precip
   ShaderMaterials write raw gl_FragColor and would NOT tone-map → a visible seam)
   and force re-tuning every hardcoded colour across four modules. Instead it beats
   UG:G ADDITIVELY, keeping the authored antique-broadsheet palette intact:

     1. GROUND RELIEF — high/low ground reads at a glance: the open field is
        darkened in the low ground and lifted on the crests (normalized to the
        battle's own height range), with a warm exposed-soil tint on steep slopes.
        (Extends T18's vertex-colour enrichment; a complement to the explicit
        legend/contour/hover layer that H5-i3 terrain-readability adds on top.)
     2. CONTACT SHADOWS — a soft round shadow under every brigade so the markers
        sit IN the field instead of floating above it (the single biggest UG:G
        grounding cue; one shared instanced decal layer, NOT real shadow maps —
        those are an r128 InstancedMesh-depth-pass bug + a UHD-617 perf sink).
     3. SKY DOME + VIGNETTE — the flat clear-colour sky deepens horizon→zenith via
        a gradient dome that re-tints itself from the live weather fog colour each
        frame (so T17 stays authoritative), framed by a free CSS radial vignette.
     4. RANK TEXTURE — each brigade slab carries a stylized painted rank-stripe /
        file-tick pattern so it reads as MASSED INFANTRY, not a flat block.
     5. PEG RANKS (Max tier, !fldLow only, fallback path) — a stylized instanced
        peg-rank atop the slab when T24 formation figures are unavailable or
        explicitly off. When T24 will replace the slab with richer figures, skip
        the hidden peg fallback instead of keeping one invisible InstancedMesh per
        brigade resident.

   ARCHITECTURE — PURE PRESENTATION; combat byte-identical BY CONSTRUCTION (D74):
   like T16/T17/T18 this module touches NO sim. It WRAPS the render seams by
   ASSIGNMENT (fld3dInit / fld3dBuildTerrain / fld3dBuildUnits / fld3dSyncUnit /
   fld3dRender / fld2dDraw / fldExit), reads ONLY read-only render + sim fields
   (u.x/u.z/u.facing/u.men/u.maxMen/u.alive/u.state/u.formation/u.side, __FIELD.*),
   never writes a sim field, never calls fldRng, never bumps _SAVE_VER. The ground
   pass recolours VERTICES only (never positions — units seat on analytic
   fldTerrainH, not the mesh). So the headless AI-vs-AI sim is unchanged: the
   per-battle outcomes stay byte-identical (probe-presets 26/26 + probe-phased-ab
   20/0-diff), even though every pixel is richer.

   ACCESSIBILITY / PERF (Intel UHD-617 floor): the whole layer rides T18's single
   G.settings.renderRich==="off" opt-out (fldVfOff) → off reverts to the
   byte-identical default look. Every effect is STATIC (no per-frame animation), so
   nothing needs reduceMotion suppression (the T17/T18 static-tint convention). The
   heavy peg-ranks hard-gate on !fldLow() and on the T24 fallback need; the sky
   dome drops segment count on fldLow(); the vignette is browser-composited (zero
   GPU/2D-path contact). No colour-encoded information anywhere → CVD-safe. New Shaderless materials write
   through THREE's built-in path; CanvasTextures are LEFT at default (linear)
   encoding (r128 has no SRGBColorSpace; setting sRGB would double-gamma).
   =========================================================================== */

var FLDVF = {
  // ground relief (Moderate, Aaron D140): darken low ground / lift high ground, normalized to the battle's height range
  AO_DARK: 0.12, AO_LIFT: 0.06,
  AO_CONCAVE: 0.05,                 // a small extra darkening in genuine local hollows (2nd-difference)
  SLOPE_MIN: 0.05, SOIL_MIX: 0.26,  // steep open-slope exposed-soil tint (from the vertex normal's verticality)
  SOIL_R: 0.42, SOIL_G: 0.33, SOIL_B: 0.21,
  // contact shadow — a soft pool slightly WIDER + deeper than the block so it reads around the marker's feet
  SHADOW_OP: 0.40, SHADOW_W: 1.25, SHADOW_D: 1.55,
  // sky dome / vignette
  ZENITH_MUL: 0.74,                 // zenith luminance vs the horizon (a deeper antique sky overhead)
  VIG_A: 0.34,                      // vignette corner darkness (faint — never fights the palette / HUD)
  // peg ranks (Max tier)
  PEG_ROWS: 2, PEG_COLS: 11, PEG_H: 15
};

/* module-level GPU/DOM refs + a swallowed-exception counter (probe asserts errN===0) */
var FLDVF_S = { dome: null, vig: null, shadowTex: null, rankTex: null, shadowMesh: null, shadowDummy: null, errN: 0 };

/* ---- master gate: ride T18's single renderRich opt-out (off ⇒ byte-identical default look) ---- */
function fldVfOff() {
  try { if (typeof fldRrOff === "function") return fldRrOff(); } catch (e) {}
  try { if (typeof G !== "undefined" && G && G.settings && G.settings.renderRich === "off") return true; } catch (e2) {}
  return false;
}

function fldVfFormationFiguresWillReplace(u, g) {
  try {
    if (typeof fldFfOff === "function" && typeof fldFfShowFor === "function") {
      return !fldFfOff() && fldFfShowFor(u, g);
    }
  } catch (e) {}
  return false;
}

function fldVfShouldBuildPegs(u, g) {
  try { if (typeof fldLow === "function" && fldLow()) return false; } catch (e) {}
  return !fldVfFormationFiguresWillReplace(u, g);
}

/* ===========================================================================
   1. GROUND RELIEF — recolour the terrain mesh's VERTEX COLOURS after T18 enriched
   them (positions untouched). Height-relief is the dominant cue (the field is
   deliberately gentle, so a pure curvature AO would be near-invisible); a small
   concavity term deepens true hollows; steep slopes get a warm exposed-soil tint.
   =========================================================================== */
function fldVfEnrichGroundAO() {
  if (fldVfOff()) return;
  if (typeof __FIELD === "undefined" || !__FIELD || !__FIELD.ground || !__FIELD.ground.geometry) return;
  var geo = __FIELD.ground.geometry;
  var posA = geo.attributes && geo.attributes.position;
  var colA = geo.attributes && geo.attributes.color;
  var nrmA = geo.attributes && geo.attributes.normal;
  if (!posA || !colA || colA._vfAO) return;        // idempotent — once per fresh geometry (runs after T18's _rr pass)
  var cnt = posA.count, n = Math.round(Math.sqrt(cnt));
  if (n < 2 || n * n !== cnt) { colA._vfAO = true; return; }   // PlaneGeometry(seg,seg) ⇒ a square (seg+1)² grid; bail safely otherwise
  var W = (typeof FLD !== "undefined" && FLD) ? FLD.FIELD_W : 1200;
  var H = (typeof FLD !== "undefined" && FLD) ? FLD.FIELD_H : 900;
  // pass 1: cache heights + find the height range (so relief normalizes to THIS battle's terrain)
  var hgt = new Float32Array(cnt), hMin = Infinity, hMax = -Infinity;
  for (var i = 0; i < cnt; i++) { var hh = posA.getY(i); hgt[i] = hh; if (hh < hMin) hMin = hh; if (hh > hMax) hMax = hh; }
  var hMid = (hMin + hMax) * 0.5, half = (hMax - hMin) * 0.5;
  if (!(half > 0.0001)) half = 1;                  // a perfectly flat field ⇒ relief is a no-op (factor stays 1)
  // pass 2: apply relief + concavity + soil tint
  for (var z = 0; z < n; z++) {
    for (var x = 0; x < n; x++) {
      var idx = z * n + x, hc = hgt[idx];
      var r = colA.getX(idx), g = colA.getY(idx), b = colA.getZ(idx);
      // (a) HEIGHT RELIEF — low ground darkens, high ground lifts (asymmetric: shadow deeper than highlight)
      var rel = (hc - hMid) / half; if (rel < -1) rel = -1; if (rel > 1) rel = 1;
      var factor = 1 + (rel < 0 ? rel * FLDVF.AO_DARK : rel * FLDVF.AO_LIFT);
      // (b) CONCAVITY — a small extra darkening where the vertex sits below its 4 neighbours (a real hollow)
      var hl = hgt[x > 0 ? idx - 1 : idx], hr = hgt[x < n - 1 ? idx + 1 : idx];
      var hu = hgt[z > 0 ? idx - n : idx], hd = hgt[z < n - 1 ? idx + n : idx];
      var concav = (hl + hr + hu + hd) * 0.25 - hc;     // >0 ⇒ hollow
      if (concav > 0) { var cv = concav * FLDVF.AO_CONCAVE; factor -= (cv > FLDVF.AO_DARK ? FLDVF.AO_DARK : cv); }
      if (factor < 0) factor = 0;
      r *= factor; g *= factor; b *= factor;
      // (c) STEEP-SLOPE SOIL TINT — eroded earth on the steepest open ground (skip the wooded floor)
      if (nrmA) {
        var ny = nrmA.getY(idx); if (ny < 0) ny = -ny;
        var steep = (1 - ny - FLDVF.SLOPE_MIN) / (1 - FLDVF.SLOPE_MIN);
        if (steep > 0) {
          if (steep > 1) steep = 1;
          var wx = posA.getX(idx) + W / 2, wz = posA.getZ(idx) + H / 2;
          var inW = (typeof fldInWoods === "function") ? fldInWoods(wx, wz) : false;
          if (!inW) {
            var mix = steep * FLDVF.SOIL_MIX;
            r = r * (1 - mix) + FLDVF.SOIL_R * mix;
            g = g * (1 - mix) + FLDVF.SOIL_G * mix;
            b = b * (1 - mix) + FLDVF.SOIL_B * mix;
          }
        }
      }
      colA.setXYZ(idx, r < 0 ? 0 : (r > 1 ? 1 : r), g < 0 ? 0 : (g > 1 ? 1 : g), b < 0 ? 0 : (b > 1 ? 1 : b));
    }
  }
  colA.needsUpdate = true; colA._vfAO = true;
}

/* ===========================================================================
   SHARED TEXTURES — one soft contact-shadow blob + one stylized rank pattern,
   reused across every brigade (disposed once on battle exit).
   =========================================================================== */
function fldVfShadowTexture(T) {
  var c = document.createElement("canvas"); c.width = 64; c.height = 64;
  var g = c.getContext("2d");
  var grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(0,0,0,0.80)"); grd.addColorStop(0.55, "rgba(0,0,0,0.42)"); grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd; g.beginPath(); g.arc(32, 32, 32, 0, 7); g.fill();
  var tex = new T.CanvasTexture(c); tex.needsUpdate = true;   // draw BEFORE wrap (the T16 texture-warning lesson)
  tex.minFilter = T.LinearFilter; tex.magFilter = T.LinearFilter; tex.generateMipmaps = false;
  return tex;
}
function fldVfRankTexture(T) {
  var c = document.createElement("canvas"); c.width = 64; c.height = 32;
  var g = c.getContext("2d");
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 64, 32);                 // white base ⇒ the slab's side colour shows through (map MULTIPLIES)
  g.fillStyle = "rgba(40,34,24,0.34)"; g.fillRect(0, 8, 64, 3); g.fillRect(0, 21, 64, 3);  // two darker horizontal RANK bands
  g.fillStyle = "rgba(30,26,18,0.22)"; for (var x = 4; x < 64; x += 8) g.fillRect(x, 2, 2, 28);  // faint vertical FILE ticks (shoulders)
  g.fillStyle = "rgba(255,250,236,0.16)"; g.fillRect(0, 0, 64, 3);   // a soft sun highlight on the front rank
  var tex = new T.CanvasTexture(c); tex.needsUpdate = true;
  tex.wrapS = tex.wrapT = T.RepeatWrapping; tex.repeat.set(7, 2);
  tex.minFilter = T.LinearMipmapLinearFilter; tex.magFilter = T.LinearFilter; tex.generateMipmaps = true;  // 64×32 POT ⇒ mipmaps OK
  return tex;
}
function fldVfEnsureTex(T) {
  if (!FLDVF_S.shadowTex) FLDVF_S.shadowTex = fldVfShadowTexture(T);
  if (!FLDVF_S.rankTex) FLDVF_S.rankTex = fldVfRankTexture(T);
}

function fldVfDisposeShadowLayer(keepTexture) {
  var m = FLDVF_S.shadowMesh;
  if (m) {
    try { if (m.parent) m.parent.remove(m); } catch (e) {}
    try { if (m.geometry && m.geometry.dispose) m.geometry.dispose(); } catch (e2) {}
    try { if (m.material && m.material.dispose) m.material.dispose(); } catch (e3) {}
  }
  FLDVF_S.shadowMesh = null;
  if (!keepTexture && FLDVF_S.shadowTex && FLDVF_S.shadowTex.dispose) { try { FLDVF_S.shadowTex.dispose(); } catch (e4) {} FLDVF_S.shadowTex = null; }
}

function fldVfEnsureShadowLayer(T) {
  if (!T || typeof __FIELD === "undefined" || !__FIELD || !__FIELD.scene || !__FIELD.units) return null;
  fldVfEnsureTex(T);
  var cap = Math.max(1, __FIELD.units.length || 1);
  if (FLDVF_S.shadowMesh && FLDVF_S.shadowMesh.parent && FLDVF_S.shadowMesh.userData && FLDVF_S.shadowMesh.userData.cap >= cap) return FLDVF_S.shadowMesh;
  fldVfDisposeShadowLayer(true);
  var mat = new T.MeshBasicMaterial({ map: FLDVF_S.shadowTex, color: 0x000000, transparent: true, opacity: FLDVF.SHADOW_OP, depthWrite: false });
  mat.polygonOffset = true; mat.polygonOffsetFactor = -1; mat.polygonOffsetUnits = -1;
  var im = new T.InstancedMesh(new T.PlaneGeometry(1, 1), mat, cap);
  im.name = "vfShadowLayer"; im.frustumCulled = false; im.renderOrder = -0.5; im.userData.cap = cap;
  FLDVF_S.shadowDummy = FLDVF_S.shadowDummy || new T.Object3D();
  for (var i = 0; i < cap; i++) { FLDVF_S.shadowDummy.position.set(0, -9999, 0); FLDVF_S.shadowDummy.scale.set(0.001, 0.001, 0.001); FLDVF_S.shadowDummy.updateMatrix(); im.setMatrixAt(i, FLDVF_S.shadowDummy.matrix); }
  im.instanceMatrix.needsUpdate = true;
  __FIELD.scene.add(im);
  FLDVF_S.shadowMesh = im;
  return im;
}

function fldVfSetShadow(vf, u, g, visible) {
  var mesh = FLDVF_S.shadowMesh, d = FLDVF_S.shadowDummy;
  if (!vf || !mesh || !d || vf.shIndex == null || vf.shIndex < 0 || vf.shIndex >= mesh.userData.cap) return;
  if (!visible || !u || !g) {
    d.position.set(0, -9999, 0); d.rotation.set(0, 0, 0); d.scale.set(0.001, 0.001, 0.001);
  } else {
    var lineW = (u.formation === "column" ? 34 : 96) * (0.5 + 0.5 * u.men / u.maxMen);
    var lineD = (u.formation === "column" ? 60 : 26);
    d.position.set(u.x, ((typeof fldTerrainH === "function") ? fldTerrainH(u.x, u.z) : 0) + 0.5, u.z);
    d.rotation.set(-Math.PI / 2, -u.facing, 0);
    d.scale.set(lineW * FLDVF.SHADOW_W, lineD * FLDVF.SHADOW_D, 1);
  }
  d.updateMatrix();
  mesh.setMatrixAt(vf.shIndex, d.matrix);
  mesh.instanceMatrix.needsUpdate = true;
}

function fldVfClearShadowLayer() {
  var mesh = FLDVF_S.shadowMesh, d = FLDVF_S.shadowDummy;
  if (!mesh || !d || !mesh.userData) return;
  for (var i = 0; i < mesh.userData.cap; i++) {
    d.position.set(0, -9999, 0); d.rotation.set(0, 0, 0); d.scale.set(0.001, 0.001, 0.001);
    d.updateMatrix(); mesh.setMatrixAt(i, d.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

/* ===========================================================================
   2/4/5. PER-BRIGADE DECORATION — rank map + instanced contact shadow + (Max) peg ranks,
   added after the base (re)builds the unit groups. Rank maps and Max-tier pegs are
   attached to each unit Group; contact shadows share one scene-level InstancedMesh
   so the UHD-617 floor pays one draw call instead of one per brigade. A fresh group
   from the base carries no g.userData._vf → it gets decorated exactly once per
   (re)build, and the shared shadow layer is cleared before each fresh unit set.
   =========================================================================== */
function fldVfAddPegs(T, u, g) {
  var rows = FLDVF.PEG_ROWS, cols = FLDVF.PEG_COLS, nfig = rows * cols;
  var geo = new T.CylinderGeometry(2.3, 2.9, FLDVF.PEG_H, 5);        // a stubby tapered peg — stylized, never a modelled man
  var col = (u.side === "US") ? 0x2c4474 : 0x7a3a2e;                 // a shade deeper than the slab so the rank reads atop it
  var mat = new T.MeshLambertMaterial({ color: col, transparent: true, opacity: 1 });   // transparent ⇒ T18 casualty-fade includes it
  var im = new T.InstancedMesh(geo, mat, nfig); im.name = "vfPegs";  // NOT "flag"/"ring" ⇒ T18 fade toggles it
  var dummy = new T.Object3D(), frontHalf = 46;
  var k = 0;
  for (var rr = 0; rr < rows; rr++) {
    for (var cc = 0; cc < cols; cc++) {
      var px = cols > 1 ? (-frontHalf + (cc / (cols - 1)) * frontHalf * 2) : 0;
      var pz = -7 + rr * 9;                                         // two ranks just behind the front edge
      dummy.position.set(px, 4 + FLDVF.PEG_H * 0.5, pz);            // stand on the slab top (slab half-height 4)
      dummy.updateMatrix(); im.setMatrixAt(k++, dummy.matrix);
    }
  }
  im.instanceMatrix.needsUpdate = true;
  // r128 won't derive a bounding sphere for an InstancedMesh; give it one (sized to the full-width block — the
  // per-frame x-scale only SHRINKS it, so this bounds every state) so the renderer CAN frustum-cull the peg
  // block when it is off-camera. The parent group.visible still owns the fog gate, independently of the frustum.
  try { geo.boundingSphere = new T.Sphere(new T.Vector3(0, 4 + FLDVF.PEG_H * 0.5, -2.5), frontHalf + 16); } catch (e) {}
  g.add(im); g.userData._vf.pegs = im;
}
function fldVfDecorateUnits() {
  if (fldVfOff()) return;
  var T = window.THREE;
  if (!T || typeof __FIELD === "undefined" || !__FIELD || !__FIELD._u3d || !__FIELD.units) return;
  fldVfEnsureTex(T);
  var shadowLayer = fldVfEnsureShadowLayer(T);
  fldVfClearShadowLayer();
  for (var i = 0; i < __FIELD.units.length; i++) {
    var u = __FIELD.units[i], g = __FIELD._u3d[u.id];
    if (!g || !g.userData) continue;
    if (g.userData._vf) continue;                                   // already decorated this (re)build
    g.userData._vf = { shIndex: shadowLayer ? i : -1 };
    // (4) rank map on the slab (white-based ⇒ multiplies the side colour; CVD-safe luminance pattern)
    var slab = g.getObjectByName("slab");
    if (slab && slab.material && FLDVF_S.rankTex) { try { slab.material.map = FLDVF_S.rankTex; slab.material.needsUpdate = true; } catch (e) { FLDVF_S.errN++; } }
    // (5) peg ranks (Max tier fallback): keep them when slabs remain visible, skip hidden residents when T24 figures replace the slab.
    if (fldVfShouldBuildPegs(u, g)) { try { fldVfAddPegs(T, u, g); } catch (e3) { FLDVF_S.errN++; } }
  }
}
function fldVfSyncUnit(u, g) {
  if (!u || !g || !g.userData || !g.userData._vf) return;
  var vf = g.userData._vf;
  if (!u.alive || !g.visible || fldVfOff()) { fldVfSetShadow(vf, null, null, false); return; }   // dying/dead/fog/off: no global shadow leak
  var lineW = (u.formation === "column" ? 34 : 96) * (0.5 + 0.5 * u.men / u.maxMen);
  // contact shadow: one shared instanced layer, glued to the ground and width-matched to the live block
  fldVfSetShadow(vf, u, g, true);
  // peg ranks: scale the whole instanced block to the current front width (no per-peg matrix writes); drop when routing
  if (vf.pegs) {
    vf.pegs.scale.x = lineW / 96;
    vf.pegs.visible = (u.state !== "routing");
  }
}

/* ===========================================================================
   3. SKY DOME + VIGNETTE — built once per battle (wrapped onto fld3dInit, after
   T17 set the weather sky/fog). The dome's vertex colours bake a luminance ramp
   (1.0 at the horizon → ZENITH_MUL overhead); its material.color carries the live
   horizon hue (re-copied from the fog colour each frame), so the dome ALWAYS
   agrees with T17's weather and the ground fog blends seamlessly into the sky.
   =========================================================================== */
function fldVfBuildSky() {
  if (fldVfOff()) return;
  var T = window.THREE;
  if (!T || typeof __FIELD === "undefined" || !__FIELD || !__FIELD.scene) return;
  if (FLDVF_S.dome) return;                                        // once per battle (fld3dInit runs once; phase advances reuse the dome)
  var sc = __FIELD.scene;
  var horizon = (sc.fog && sc.fog.color && sc.fog.color.clone) ? sc.fog.color.clone()
              : (sc.background && sc.background.clone ? sc.background.clone() : new T.Color("#acc2d6"));
  var lo = (typeof fldLow === "function") ? fldLow() : false;
  var R = 4600, geo = new T.SphereGeometry(R, lo ? 16 : 32, lo ? 10 : 18);
  var pos = geo.attributes.position, cols = [];
  for (var i = 0; i < pos.count; i++) {
    var t = pos.getY(i) / R; if (t < 0) t = 0;                     // only the upper hemisphere deepens; horizon & below stay 1.0
    var lum = 1 - t * (1 - FLDVF.ZENITH_MUL);
    cols.push(lum, lum, lum);
  }
  geo.setAttribute("color", new T.Float32BufferAttribute(cols, 3));
  var mat = new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, depthWrite: false, fog: false });
  mat.color.copy(horizon);
  var dome = new T.Mesh(geo, mat); dome.name = "vfSky"; dome.renderOrder = -1; dome.frustumCulled = false;
  dome.position.set((typeof FLD !== "undefined" ? FLD.FIELD_W : 1200) / 2, 0, (typeof FLD !== "undefined" ? FLD.FIELD_H : 900) / 2);
  sc.add(dome);
  // KEEP scene.background (the engine/T17 horizon colour) as a seamless fallback: the dome (radius 4600) renders
  // over it, but the camera (orbit ≤2200 from field-centre) puts the dome's far side at up to ~6800 — past the
  // 6000 far-plane — so a thin behind-the-camera horizon ring is clipped; the matching background colour fills
  // it invisibly. Nulling it would show black there. T17 keeps bg == fog == the dome horizon, so all three agree.
  FLDVF_S.dome = dome;
}
function fldVfSyncSky() {
  var d = FLDVF_S.dome; if (!d || !d.material || !d.material.color) return;
  var sc = (typeof __FIELD !== "undefined" && __FIELD) ? __FIELD.scene : null; if (!sc) return;
  var hz = (sc.fog && sc.fog.color) ? sc.fog.color : sc.background;
  if (hz && hz.isColor) d.material.color.copy(hz);                 // keep the dome horizon matched to the live weather fog colour (== scene.background)
}
function fldVfBuildVignette() {
  if (fldVfOff()) return;
  if (typeof document === "undefined") return;
  var root = (typeof __FIELD !== "undefined" && __FIELD) ? __FIELD.root : null;
  if (!root || FLDVF_S.vig) return;
  var d = document.createElement("div"); d.id = "fldVignette"; d.setAttribute("aria-hidden", "true");
  d.style.cssText = "position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 78% 78% at 50% 47%,rgba(0,0,0,0) 52%,rgba(9,6,3," + FLDVF.VIG_A + ") 100%);";
  var cv = document.getElementById("fldGl");
  if (cv && cv.nextSibling) root.insertBefore(d, cv.nextSibling); else root.appendChild(d);   // above the canvas, BELOW the HUD (DOM order) ⇒ HUD stays fully legible
  FLDVF_S.vig = d;
}
function fldVfRemoveVignette() {
  try { if (FLDVF_S.vig && FLDVF_S.vig.parentNode) FLDVF_S.vig.parentNode.removeChild(FLDVF_S.vig); } catch (e) {}
  FLDVF_S.vig = null;
}

/* ===========================================================================
   2D FALLBACK PARITY — a subtle rank hatch on each living block so the top-down
   view reads as massed ranks too (the 3D rank texture's analogue). Drawn after the
   base paints the units; kept faint and atop-friendly (no cast shadow — shadows
   read poorly top-down). Rides the same renderRich opt-out + fog visibility.
   =========================================================================== */
function fldVfDraw2d(ctx, v) {
  if (!ctx || !v || fldVfOff()) return;
  if (typeof __FIELD === "undefined" || !__FIELD || !__FIELD.units) return;
  var ps = (typeof fldPlayerSide === "function") ? fldPlayerSide() : "US";
  for (var i = 0; i < __FIELD.units.length; i++) {
    var u = __FIELD.units[i]; if (!u.alive) continue;
    if (__FIELD.fog && u.side !== ps && typeof fldVisible === "function" && !fldVisible(ps, u)) continue;
    var cx = v.ox + u.x * v.s, cz = v.oz + u.z * v.s;
    var w = (u.formation === "column" ? 36 : 96) * v.s * (0.5 + 0.5 * u.men / u.maxMen);
    var d = (u.formation === "column" ? 60 : 26) * v.s;
    if (!(w > 4) || !(d > 4)) continue;                            // too small to read a hatch ⇒ skip
    ctx.save();
    ctx.translate(cx, cz); ctx.rotate(u.facing);
    ctx.globalAlpha = 0.16; ctx.strokeStyle = "#0d0a06"; ctx.lineWidth = Math.max(0.6, 0.8 * v.s);
    var ranks = [-d * 0.18, d * 0.18];
    for (var rki = 0; rki < ranks.length; rki++) { ctx.beginPath(); ctx.moveTo(-w / 2 + 2, ranks[rki]); ctx.lineTo(w / 2 - 2, ranks[rki]); ctx.stroke(); }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

/* ---- teardown: dispose the dome + shared textures + remove the vignette on battle exit ---- */
function fldVfDispose() {
  try {
    if (FLDVF_S.dome) {
      if (FLDVF_S.dome.parent) FLDVF_S.dome.parent.remove(FLDVF_S.dome);
      if (FLDVF_S.dome.geometry && FLDVF_S.dome.geometry.dispose) FLDVF_S.dome.geometry.dispose();
      if (FLDVF_S.dome.material && FLDVF_S.dome.material.dispose) FLDVF_S.dome.material.dispose();
    }
    FLDVF_S.dome = null;
    fldVfRemoveVignette();
    fldVfDisposeShadowLayer(true);
    if (FLDVF_S.shadowTex && FLDVF_S.shadowTex.dispose) FLDVF_S.shadowTex.dispose();
    if (FLDVF_S.rankTex && FLDVF_S.rankTex.dispose) FLDVF_S.rankTex.dispose();
    FLDVF_S.shadowTex = null; FLDVF_S.rankTex = null; FLDVF_S.shadowDummy = null;
  } catch (e) {}
}

/* ===========================================================================
   WIRE-IN — wrap the render seams by ASSIGNMENT (no combat file touched). T21 loads
   LAST (after T20), so fld3d* are already defined + already wrapped by T16/T17/T18;
   we wrap OUTERMOST and copy every existing marker (._wx/._atmo/._rr/._t10*) forward
   so the chain stays introspectable. Each wrap try/catches so a render throw can
   never crash the loop, counting into FLDVF_S.errN (the probe asserts it's 0).
   =========================================================================== */
(function () {
  function _vfErr(e) { FLDVF_S.errN++; if (!FLDVF._warned && typeof console !== "undefined" && console.warn) { FLDVF._warned = true; console.warn("T21 visual-fidelity:", (e && e.message) || e); } }
  function _carry(dst, src) { for (var k in src) { if (Object.prototype.hasOwnProperty.call(src, k)) { try { dst[k] = src[k]; } catch (e) {} } } }

  if (typeof fld3dInit === "function" && !fld3dInit._vf) {
    var _oi = fld3dInit;
    fld3dInit = function () { var r = _oi.apply(this, arguments); try { fldVfBuildSky(); } catch (e) { _vfErr(e); } try { fldVfBuildVignette(); } catch (e2) { _vfErr(e2); } return r; };
    _carry(fld3dInit, _oi); fld3dInit._vf = true;
  }
  if (typeof fld3dBuildTerrain === "function" && !fld3dBuildTerrain._vf) {
    var _ot = fld3dBuildTerrain;
    fld3dBuildTerrain = function () { var r = _ot.apply(this, arguments); try { fldVfEnrichGroundAO(); } catch (e) { _vfErr(e); } return r; };
    _carry(fld3dBuildTerrain, _ot); fld3dBuildTerrain._vf = true;
  }
  if (typeof fld3dBuildUnits === "function" && !fld3dBuildUnits._vf) {
    var _ou = fld3dBuildUnits;
    fld3dBuildUnits = function () { var r = _ou.apply(this, arguments); try { fldVfDecorateUnits(); } catch (e) { _vfErr(e); } return r; };
    _carry(fld3dBuildUnits, _ou); fld3dBuildUnits._vf = true;
  }
  if (typeof fld3dSyncUnit === "function" && !fld3dSyncUnit._vf) {
    var _os = fld3dSyncUnit;
    fld3dSyncUnit = function (u, g) { var r = _os.apply(this, arguments); try { fldVfSyncUnit(u, g); } catch (e) { _vfErr(e); } return r; };
    _carry(fld3dSyncUnit, _os); fld3dSyncUnit._vf = true;
  }
  if (typeof fld3dRender === "function" && !fld3dRender._vf) {
    var _orr = fld3dRender;
    fld3dRender = function () { try { fldVfSyncSky(); } catch (e) { _vfErr(e); } return _orr.apply(this, arguments); };
    _carry(fld3dRender, _orr); fld3dRender._vf = true;
  }
  if (typeof fld2dDraw === "function" && !fld2dDraw._vf) {
    var _od = fld2dDraw;
    fld2dDraw = function () { var r = _od.apply(this, arguments); try { fldVfDraw2d(__FIELD.ctx2d, fld2dView()); } catch (e) { _vfErr(e); } return r; };
    _carry(fld2dDraw, _od); fld2dDraw._vf = true;
  }
  if (typeof fldExit === "function" && !fldExit._vf) {
    var _oe = fldExit;
    fldExit = function () { try { fldVfDispose(); } catch (e) { _vfErr(e); } return _oe.apply(this, arguments); };
    _carry(fldExit, _oe); fldExit._vf = true;
  }
})();
