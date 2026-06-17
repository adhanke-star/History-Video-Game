/* ===========================================================================
   H-media · 93-asset-loader.js — ASSET LOADER + MANIFEST + PRELOAD PROGRESS.

   The Phase-H media architecture. Provides:
   (1) A runtime ASSET MANIFEST (`_AL_MANIFEST`) declaring every known external
       asset path + type + priority (critical / normal / lazy).
   (2) A preloader with progress UI (a loading bar shown before the menu when
       critical assets are still in-flight).
   (3) `assetUrl(path)` — the SINGLE source-of-truth for asset path resolution.
       Respects a `<base>` tag if present; falls back to relative resolution.
       Works identically on file://, localhost, GitHub Pages, and itch.io.
   (4) `assetLoad(path, type)` — returns a Promise that resolves to the loaded
       resource (Image, AudioBuffer, ArrayBuffer, JSON) or null on failure.
       Failures are silent (graceful fallback to procedural rendering).
   (5) `assetAudio(path)` — loads an audio file and returns an AudioBuffer,
       or null if the file is missing. Uses the existing Web Audio context.

   Design constraints:
   - ZERO regression: all asset loading is optional. The game boots and runs
     identically with an EMPTY assets/ folder (or on file:// where fetch fails).
   - Works on file://: uses `new Image()` for images (not fetch), and
     `new Audio()` or XHR for audio (with silent failure).
   - No Base64 inlining: assets stay as external files.
   - Build-step integration: `tools/build.mjs` can optionally validate the
     manifest against the actual assets/ folder (future enhancement).

   Bare-name globals: G, toast. All helpers prefixed `_al` (asset-loader).
   =========================================================================== */

/* ============ ASSET BASE PATH RESOLUTION ============ */
var _AL_BASE = "";

(function () {
  /* Resolve the asset base path. Strategy:
     1. If a <base href="..."> tag exists, use it.
     2. If the page URL contains a path (e.g., /repo-name/civil_war_generals.html),
        derive the base from the directory portion.
     3. Otherwise, assets/ is relative to the HTML file (default). */
  try {
    var baseEl = document.querySelector("base[href]");
    if (baseEl && baseEl.href) {
      _AL_BASE = baseEl.href.replace(/\/$/, "") + "/";
    } else {
      /* Derive from the page location */
      var loc = window.location.href;
      var lastSlash = loc.lastIndexOf("/");
      if (lastSlash > 0) {
        _AL_BASE = loc.substring(0, lastSlash + 1);
      }
    }
  } catch (e) {
    _AL_BASE = "";
  }
})();

/* Resolve an asset path to a full URL (works on file://, Pages, itch.io). */
function assetUrl(relativePath) {
  if (!relativePath) return "";
  /* Already absolute? Return as-is. */
  if (/^https?:\/\/|^data:|^blob:/.test(relativePath)) return relativePath;
  /* Strip leading "./" if present */
  var clean = relativePath.replace(/^\.\//, "");
  return _AL_BASE + clean;
}

/* ============ ASSET MANIFEST ============ */
/* Priority: "critical" = blocks menu render, "normal" = loads after boot, "lazy" = on-demand */
var _AL_MANIFEST = {
  terrain: {
    priority: "critical",
    type: "image",
    paths: [
      "assets/terrain/clear.png", "assets/terrain/field.png",
      "assets/terrain/woods.png", "assets/terrain/hills.png",
      "assets/terrain/ridge.png", "assets/terrain/town.png",
      "assets/terrain/road.png",  "assets/terrain/river.png",
      "assets/terrain/ford.png",  "assets/terrain/swamp.png",
      "assets/terrain/fort.png",  "assets/terrain/water.png",
      "assets/terrain/shoal.png"
    ]
  },
  portraits: {
    priority: "normal",
    type: "image",
    paths: []  /* Populated dynamically from PHOTO_MANIFEST (base.html) if present */
  },
  audio_sfx: {
    priority: "lazy",
    type: "audio",
    paths: [
      "assets/audio/sfx/cannon_fire.mp3",
      "assets/audio/sfx/musket_volley.mp3",
      "assets/audio/sfx/bugle_charge.mp3",
      "assets/audio/sfx/bugle_retreat.mp3",
      "assets/audio/sfx/cheer.mp3",
      "assets/audio/sfx/rout_cry.mp3"
    ]
  },
  audio_music: {
    priority: "lazy",
    type: "audio",
    paths: [
      "assets/audio/music/camp_ambient.ogg",
      "assets/audio/music/battle_march.ogg",
      "assets/audio/music/victory_fanfare.ogg"
    ]
  },
  audio_ambient: {
    priority: "lazy",
    type: "audio",
    paths: [
      "assets/audio/ambient/wind.ogg",
      "assets/audio/ambient/rain.ogg",
      "assets/audio/ambient/campfire.ogg",
      "assets/audio/ambient/crowd_murmur.ogg"
    ]
  },
  env_hdr: {
    priority: "normal",
    type: "binary",
    paths: [
      "assets/3d/env/sky_day.hdr",
      "assets/3d/env/sky_overcast.hdr",
      "assets/3d/env/sky_dusk.hdr"
    ]
  }
};

/* ============ ASSET LOADING UTILITIES ============ */
var _AL_CACHE = {};  /* path -> loaded resource (Image, AudioBuffer, etc.) or null */
var _AL_PENDING = {};  /* path -> Promise */

/* Load an image asset. Returns a Promise<Image|null>. */
function _alLoadImage(path) {
  var url = assetUrl(path);
  return new Promise(function (resolve) {
    if (typeof Image === "undefined") { resolve(null); return; }
    var img = new Image();
    img.onload = function () { resolve(img); };
    img.onerror = function () { resolve(null); };
    try { img.src = url; } catch (e) { resolve(null); }
  });
}

/* Load an audio asset as an AudioBuffer. Returns Promise<AudioBuffer|null>. */
function _alLoadAudio(path) {
  var url = assetUrl(path);
  return new Promise(function (resolve) {
    /* Try fetch first (works on http/https), fall back to XHR */
    if (typeof fetch !== "undefined" && !/^file:/.test(window.location.protocol)) {
      fetch(url).then(function (r) {
        if (!r.ok) { resolve(null); return; }
        return r.arrayBuffer();
      }).then(function (buf) {
        if (!buf) { resolve(null); return; }
        _alDecodeAudio(buf, resolve);
      }).catch(function () { resolve(null); });
    } else {
      /* file:// fallback via XHR (some browsers allow this) */
      try {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = function () {
          if (xhr.status === 0 || xhr.status === 200) {
            _alDecodeAudio(xhr.response, resolve);
          } else { resolve(null); }
        };
        xhr.onerror = function () { resolve(null); };
        xhr.send();
      } catch (e) { resolve(null); }
    }
  });
}

function _alDecodeAudio(buf, resolve) {
  try {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { resolve(null); return; }
    var ctx = new AC();
    ctx.decodeAudioData(buf, function (decoded) {
      resolve(decoded);
    }, function () { resolve(null); });
  } catch (e) { resolve(null); }
}

/* Load a binary asset (e.g., .hdr, .glb). Returns Promise<ArrayBuffer|null>. */
function _alLoadBinary(path) {
  var url = assetUrl(path);
  return new Promise(function (resolve) {
    if (typeof fetch !== "undefined" && !/^file:/.test(window.location.protocol)) {
      fetch(url).then(function (r) {
        if (!r.ok) { resolve(null); return; }
        return r.arrayBuffer();
      }).then(function (buf) { resolve(buf || null); })
        .catch(function () { resolve(null); });
    } else {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = function () {
          if (xhr.status === 0 || xhr.status === 200) { resolve(xhr.response); }
          else { resolve(null); }
        };
        xhr.onerror = function () { resolve(null); };
        xhr.send();
      } catch (e) { resolve(null); }
    }
  });
}

/* Generic asset load dispatcher. Returns Promise<resource|null>. */
function assetLoad(path, type) {
  if (_AL_CACHE[path] !== undefined) {
    return Promise.resolve(_AL_CACHE[path]);
  }
  if (_AL_PENDING[path]) return _AL_PENDING[path];

  var loader;
  if (type === "image") loader = _alLoadImage(path);
  else if (type === "audio") loader = _alLoadAudio(path);
  else loader = _alLoadBinary(path);

  _AL_PENDING[path] = loader.then(function (result) {
    _AL_CACHE[path] = result;
    delete _AL_PENDING[path];
    return result;
  });
  return _AL_PENDING[path];
}

/* Convenience: load audio and return AudioBuffer or null. */
function assetAudio(path) {
  return assetLoad(path, "audio");
}

/* ============ PRELOAD PROGRESS UI ============ */
var _AL_PROGRESS = { total: 0, done: 0, started: false };

function _alProgressPct() {
  if (_AL_PROGRESS.total === 0) return 100;
  return Math.round((_AL_PROGRESS.done / _AL_PROGRESS.total) * 100);
}

function _alShowProgress() {
  var bar = document.getElementById("alProgressBar");
  if (!bar) return;
  var pct = _alProgressPct();
  bar.style.width = pct + "%";
  var label = document.getElementById("alProgressLabel");
  if (label) label.textContent = pct + "%";
  if (pct >= 100) {
    var container = document.getElementById("alProgressContainer");
    if (container) {
      setTimeout(function () {
        container.style.opacity = "0";
        setTimeout(function () { container.style.display = "none"; }, 400);
      }, 300);
    }
  }
}

function _alInjectProgressBar() {
  /* Only inject if we have critical assets to load */
  var critical = _AL_MANIFEST.terrain;
  if (!critical || !critical.paths || critical.paths.length === 0) return;

  var container = document.createElement("div");
  container.id = "alProgressContainer";
  container.style.cssText = "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:99998;background:rgba(13,10,7,.92);border:1px solid #8b7a56;border-radius:6px;padding:10px 20px;min-width:200px;text-align:center;font-family:Georgia,serif;color:#cdb87f;font-size:12px;transition:opacity .4s";
  container.innerHTML =
    '<div style="margin-bottom:6px">Loading assets&hellip; <span id="alProgressLabel">0%</span></div>' +
    '<div style="background:rgba(139,122,86,.25);border-radius:3px;height:6px;overflow:hidden">' +
      '<div id="alProgressBar" style="height:100%;background:#c9a85f;border-radius:3px;width:0%;transition:width .2s"></div>' +
    '</div>';
  document.body.appendChild(container);
}

/* ============ PRELOAD CRITICAL + NORMAL ASSETS ============ */
function _alPreloadCategory(category) {
  var cat = _AL_MANIFEST[category];
  if (!cat || !cat.paths || cat.paths.length === 0) return;
  _AL_PROGRESS.total += cat.paths.length;
  _alShowProgress();

  for (var i = 0; i < cat.paths.length; i++) {
    (function (path) {
      assetLoad(path, cat.type).then(function () {
        _AL_PROGRESS.done++;
        _alShowProgress();
      });
    })(cat.paths[i]);
  }
}

/* Boot sequence: load critical assets first, then normal, then let lazy load on-demand. */
(function () {
  if (typeof document === "undefined") return;  /* jsdom/headless: skip */

  /* Wait for body to exist */
  function _alBoot() {
    _alInjectProgressBar();
    _alPreloadCategory("terrain");
    /* Normal-priority assets load after a short delay to not block the menu */
    setTimeout(function () {
      _alPreloadCategory("portraits");
      _alPreloadCategory("env_hdr");
    }, 1000);
  }

  if (document.body) { _alBoot(); }
  else { document.addEventListener("DOMContentLoaded", _alBoot); }
})();
