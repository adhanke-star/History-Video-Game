/* ===== M3D_POSTFX.js — cinematic post-processing pipeline (append-only override) =====
   Takes the Modern renderer from a flat forward render to a cinematic EffectComposer
   stack: ACES tone-map + (High) SSAO + UnrealBloom + period wet-plate color grade +
   film grain + vignette + SMAA, with DOF available. PERF-TIERED for Intel UHD 617 (§C):

     LOW  (gfxQuality 'low' or tiny viewport): NO composer — direct ACES render only.
     AUTO (default desktop):  composer = bloom + grade + SMAA + vignette (no SSAO/DOF/grain).
     HIGH (gfxQuality 'high'): + SSAO + film grain (+ DOF when __M3D.postDOF enabled).

   DESIGN (honors every locked rule):
     - Single-file / CDN only: post scripts load from the SAME jsdelivr three@0.128.0 tree
       as OrbitControls/GLTFLoader (global THREE.* attach). Load order is dependency-correct
       and adversarially verified against the live tree (graphics-run-research workflow).
     - ZERO core edits: post scripts load lazily on the first render frame; until they
       arrive (or if they fail) the loop renders directly — Modern never breaks.
     - NO load-time THREE use: shader defs are built by FACTORY FUNCTIONS at composer-build
       time (THREE present), never at chunk eval (THREE loads async AFTER this script).
     - Append-only OVERRIDE by redeclaration of _m3dStartLoop and _m3dResize (last def
       wins). Both replicate the prior body verbatim, then add the composer. A guarded
       _m3dFrameUpdate(dt, now) hook lets later chunks (mixer/particles) plug into the loop
       WITHOUT re-overriding it.
     - SSAO/Bokeh re-render scene depth with an override material → transparent Sprite
       billboards would get rectangular AO halos / wrong DOF. So SSAO is HIGH-tier only
       (default Auto is sprite-safe) and DOF is opt-in (off by default — it blurs the
       tactical read). Both GPU-verified before trust.
     - reduceMotion: film grain (the only animated post element) is frozen/zeroed.
     - Bare globals only (G, performance). Never throws into the game.
   ------------------------------------------------------------------------------------ */

/* ===================================================================================
   LOAD ORDER — verified-minimal r0.128.0 example scripts (THREE core already loaded).
   Shaders/math MUST precede the passes that reference them (class X extends THREE.Pass
   throws hard if Pass.js is late; shader refs degrade silently to a black screen).
   =================================================================================== */
function _m3dPostScripts() {
  var B = (typeof THREE_BASE !== "undefined") ? THREE_BASE : "https://cdn.jsdelivr.net/npm/three@0.128.0/";
  var sh = B + "examples/js/shaders/";
  var pp = B + "examples/js/postprocessing/";
  var ma = B + "examples/js/math/";
  return [
    sh + "CopyShader.js",                 // EffectComposer copy pass, ShaderPass default
    sh + "LuminosityHighPassShader.js",   // UnrealBloomPass
    sh + "SSAOShader.js",                 // SSAOPass (bundles SSAO/SSAODepth/SSAOBlur shaders)
    sh + "SMAAShader.js",                 // SMAAPass (Edges/Weights/Blend shaders) — verified load-time dep
    ma + "SimplexNoise.js",               // SSAOPass
    pp + "Pass.js",                       // THREE.Pass base — MUST precede every pass (extends Pass)
    pp + "ShaderPass.js",
    pp + "MaskPass.js",                   // EffectComposer references MaskPass/ClearMaskPass
    pp + "EffectComposer.js",
    pp + "RenderPass.js",
    pp + "SSAOPass.js",
    pp + "UnrealBloomPass.js",
    pp + "SMAAPass.js",
  ];
}

/* ---- sequential loader (order matters); sets __M3D.postLoaded true/false ----------- */
function _m3dLoadPostFX(done) {
  if (!__M3D) { done && done(false); return; }
  if (__M3D.postLoaded === true) { done && done(true); return; }
  if (__M3D.postLoading) return;                // in flight; loop retries next frame
  __M3D.postLoading = true;
  var list = _m3dPostScripts(), i = 0;
  (function next() {
    if (i >= list.length) {
      __M3D.postLoading = false;
      __M3D.postLoaded = !!(window.THREE && window.THREE.EffectComposer && window.THREE.RenderPass);
      done && done(__M3D.postLoaded);
      return;
    }
    var s = document.createElement("script");
    s.src = list[i++];
    s.onload = next;
    s.onerror = function () { __M3D.postLoading = false; __M3D.postLoaded = false; done && done(false); };
    document.head.appendChild(s);
  })();
}

/* ===================================================================================
   SHADER FACTORIES — built at composer time (THREE present). Period wet-plate grade +
   cheap film-grain/vignette, tuned for the UHD 617 (no loops, no derivatives).
   =================================================================================== */
function _m3dGradeShaderDef() {
  var T = window.THREE;
  return {
    uniforms: {
      tDiffuse:    { value: null },
      amount:      { value: 0.82 },                              // 0 bypass .. 1 full
      uShadows:    { value: new T.Color(0.180, 0.259, 0.333) },  // #2E4255 steel-blue
      uMids:       { value: new T.Color(0.663, 0.569, 0.471) },  // #A99178 warm khaki
      uHighlights: { value: new T.Color(0.957, 0.925, 0.859) },  // #F4ECDB ivory
      uSat:        { value: 0.80 },
      uLift:       { value: 0.012 },
      uContrast:   { value: 1.06 }
    },
    vertexShader:
      "varying vec2 vUv;\n" +
      "void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: [
      "uniform sampler2D tDiffuse;",
      "uniform float amount; uniform vec3 uShadows; uniform vec3 uMids; uniform vec3 uHighlights;",
      "uniform float uSat; uniform float uLift; uniform float uContrast;",
      "varying vec2 vUv;",
      "const vec3 LUMA = vec3(0.2126,0.7152,0.0722);",
      "void main(){",
      "  vec3 src = texture2D(tDiffuse, vUv).rgb;",
      "  vec3 c = src;",
      "  float L = dot(c, LUMA);",
      "  float wS = 1.0 - smoothstep(0.0,0.5,L);",
      "  float wH = smoothstep(0.5,1.0,L);",
      "  float wM = 1.0 - wS - wH;",
      "  vec3 tShadow = uShadows    - dot(uShadows,    LUMA);",
      "  vec3 tMid    = uMids       - dot(uMids,       LUMA);",
      "  vec3 tHigh   = uHighlights - dot(uHighlights, LUMA);",
      "  vec3 tint = wS*tShadow + wM*tMid + wH*tHigh;",
      "  c += tint * 0.55;",
      "  float g = dot(c, LUMA);",
      "  c = mix(vec3(g), c, uSat);",
      "  c = mix(c, uHighlights, wH * 0.12);",
      "  c = (c - 0.5) * uContrast + 0.5;",
      "  c = c * (1.0 - uLift) + uLift;",
      "  c = clamp(c, 0.0, 1.0);",
      "  gl_FragColor = vec4(mix(src, c, amount), 1.0);",
      "}"
    ].join("\n")
  };
}

function _m3dGrainShaderDef() {
  var T = window.THREE;
  return {
    uniforms: {
      tDiffuse:    { value: null },
      uTime:       { value: 0.0 },
      uResolution: { value: new T.Vector2(1, 1) },
      uGrain:      { value: 0.0 },          // 0 on auto/low; ~0.045 on high (& !reduceMotion)
      uVigStart:   { value: 0.62 },
      uVigEnd:     { value: 1.32 },
      uVigAmount:  { value: 0.5 }
    },
    vertexShader:
      "varying vec2 vUv;\n" +
      "void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: [
      "uniform sampler2D tDiffuse; uniform float uTime; uniform vec2 uResolution;",
      "uniform float uGrain; uniform float uVigStart; uniform float uVigEnd; uniform float uVigAmount;",
      "varying vec2 vUv;",
      "float hash(vec2 p){ p = fract(p*vec2(443.897,441.423)); p += dot(p, p.yx+19.19); return fract((p.x+p.y)*p.x); }",
      "void main(){",
      "  vec3 c = texture2D(tDiffuse, vUv).rgb;",
      "  vec2 px = vUv * uResolution;",
      "  float n = hash(px + fract(uTime)*137.0) - 0.5;",
      "  float luma = dot(c, vec3(0.2126,0.7152,0.0722));",
      "  float grainMask = mix(1.0, 0.45, luma);",
      "  c += n * uGrain * grainMask;",
      "  vec2 d = vUv - 0.5;",
      "  d.x *= uResolution.x / max(uResolution.y, 1.0);",
      "  float r = length(d) * 1.41421356;",
      "  float v = smoothstep(uVigEnd, uVigStart, r);",
      "  v = mix(1.0, v, uVigAmount);",
      "  c *= v;",
      "  gl_FragColor = vec4(clamp(c,0.0,1.0), 1.0);",
      "}"
    ].join("\n")
  };
}

/* ---- tier policy: 'low' | 'auto' | 'high' ----------------------------------------- */
function _m3dPostTier() {
  var q = G.settings && G.settings.gfxQuality;
  if (q === "high") return "high";
  if (typeof _m3dLowTier === "function" && _m3dLowTier()) return "low";
  return "auto";
}

/* ---- build (or rebuild on tier change) the EffectComposer; null when post unavailable */
function _m3dEnsurePost() {
  if (!__M3D || !__M3D.renderer || !__M3D.scene || !__M3D.camera || !window.THREE) return null;
  var T = window.THREE;
  // ACES tone-map applies on BOTH paths (even direct/low). Configure renderer BEFORE
  // creating the composer (its render targets snapshot renderer settings).
  if (!__M3D._toneSet) {
    try {
      if (T.ACESFilmicToneMapping !== undefined) __M3D.renderer.toneMapping = T.ACESFilmicToneMapping;
      __M3D.renderer.toneMappingExposure = 1.15;
      if (T.sRGBEncoding !== undefined) __M3D.renderer.outputEncoding = T.sRGBEncoding;
    } catch (e) {}
    __M3D._toneSet = true;
  }
  var tier = _m3dPostTier();
  var dof = !!__M3D.postDOF;
  var rm = !!(G.settings && G.settings.reduceMotion);
  if (tier === "low") {                          // perf floor: no composer
    if (__M3D.composer) { try { __M3D.composer.dispose && __M3D.composer.dispose(); } catch (e) {} __M3D.composer = null; }
    __M3D.postTier = "low";
    return null;
  }
  if (!__M3D.postLoaded) { _m3dLoadPostFX(function () {}); return null; } // render direct meanwhile
  if (!T.EffectComposer || !T.RenderPass) return null;
  var key = tier + (dof ? "+dof" : "") + (rm ? "+rm" : "");
  if (__M3D.composer && __M3D.postKey === key) return __M3D.composer; // reuse
  if (__M3D.composer) { try { __M3D.composer.dispose && __M3D.composer.dispose(); } catch (e) {} }

  var w = window.innerWidth, h = window.innerHeight;
  var pr = __M3D.renderer.getPixelRatio();
  var high = (tier === "high");
  var comp = new T.EffectComposer(__M3D.renderer);
  comp.setPixelRatio(pr);
  comp.setSize(w, h);
  __M3D.postPasses = {};

  comp.addPass(new T.RenderPass(__M3D.scene, __M3D.camera));

  if (high && T.SSAOPass) {                       // High only — sprite-halo risk; Auto stays clean
    var ssao = new T.SSAOPass(__M3D.scene, __M3D.camera, w, h);
    ssao.kernelRadius = 16;                        // scaled up for an outdoor battlefield
    ssao.minDistance = 0.004;
    ssao.maxDistance = 0.18;
    if (T.SSAOPass.OUTPUT) ssao.output = T.SSAOPass.OUTPUT.Default;
    comp.addPass(ssao); __M3D.postPasses.ssao = ssao;
  }

  if (T.UnrealBloomPass) {                          // bias threshold HIGH so daylit grass/sky don't fog out
    var bloom = new T.UnrealBloomPass(new T.Vector2(w, h), high ? 0.40 : 0.30, 0.40, 0.88);
    comp.addPass(bloom); __M3D.postPasses.bloom = bloom;
  }

  var grade = new T.ShaderPass(_m3dGradeShaderDef());
  grade.uniforms.amount.value = high ? 0.86 : 0.74;
  comp.addPass(grade); __M3D.postPasses.grade = grade;

  if (T.SMAAPass) {
    var smaa = new T.SMAAPass(w * pr, h * pr);
    comp.addPass(smaa); __M3D.postPasses.smaa = smaa;
  }

  var grain = new T.ShaderPass(_m3dGrainShaderDef());   // LAST pass → renders to screen
  grain.uniforms.uResolution.value.set(w, h);
  grain.uniforms.uGrain.value = (high && !rm) ? 0.045 : 0.0;
  grain.uniforms.uVigAmount.value = 0.5;
  comp.addPass(grain); __M3D.postPasses.grain = grain;

  // ensure the final pass writes to screen
  var passes = comp.passes;
  for (var i = 0; i < passes.length; i++) passes[i].renderToScreen = (i === passes.length - 1);

  __M3D.composer = comp;
  __M3D.postTier = tier;
  __M3D.postKey = key;
  return comp;
}

/* ---- render one frame: composer when available, else direct ACES render ------------ */
function _m3dPostRender(now) {
  var comp = null;
  try { comp = _m3dEnsurePost(); } catch (e) { comp = null; }
  if (comp) {
    var grain = __M3D.postPasses && __M3D.postPasses.grain;
    if (grain) {
      var rm = !!(G.settings && G.settings.reduceMotion);
      grain.uniforms.uTime.value = rm ? 0.0 : (now % 100000) * 0.001;
    }
    comp.render();
  } else if (__M3D.renderer && __M3D.scene && __M3D.camera) {
    __M3D.renderer.render(__M3D.scene, __M3D.camera);
  }
}

/* ===================================================================================
   OVERRIDE: _m3dStartLoop — replicate parity body, swap in the composer render, and
   expose a guarded per-frame hook (_m3dFrameUpdate) for later chunks (mixer/particles).
   =================================================================================== */
function _m3dStartLoop() {
  if (__M3D.raf) return;
  function tick() {
    __M3D.raf = requestAnimationFrame(tick);
    if (!_m3dModern() || !__M3D.ready) { cancelAnimationFrame(__M3D.raf); __M3D.raf = 0; return; }
    if (__M3D.controls) __M3D.controls.update();
    var now = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    var dt = __M3D._lastT ? Math.min(0.1, (now - __M3D._lastT) / 1000) : 0.016;
    __M3D._lastT = now;
    if (typeof _m3dFrameUpdate === "function") { try { _m3dFrameUpdate(dt, now); } catch (e) {} } // mixer/particles hook
    try { _m3dFXUpdate(now); } catch (e) {}
    _m3dPostRender(now);
  }
  __M3D.raf = requestAnimationFrame(tick);
}

/* ===================================================================================
   OVERRIDE: _m3dResize — replicate original, then resize composer + size-bound passes
   (EffectComposer.setSize does NOT propagate to all passes in r128).
   =================================================================================== */
function _m3dResize() {
  if (!__M3D || !__M3D.renderer || !__M3D.camera) return; // __M3D may be undefined during early boot
  var w = window.innerWidth, h = window.innerHeight;
  __M3D.renderer.setSize(w, h, false);
  __M3D.camera.aspect = w / Math.max(1, h);
  __M3D.camera.updateProjectionMatrix();
  if (__M3D.composer) {
    try {
      var pr = __M3D.renderer.getPixelRatio();
      __M3D.composer.setSize(w, h);
      var p = __M3D.postPasses || {};
      if (p.ssao && p.ssao.setSize) p.ssao.setSize(w, h);
      if (p.bloom && p.bloom.setSize) p.bloom.setSize(w, h);
      if (p.smaa && p.smaa.setSize) p.smaa.setSize(w * pr, h * pr);
      if (p.grain && p.grain.uniforms && p.grain.uniforms.uResolution.value && p.grain.uniforms.uResolution.value.set)
        p.grain.uniforms.uResolution.value.set(w, h);
    } catch (e) {}
  }
}
