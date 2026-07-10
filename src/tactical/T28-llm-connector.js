/* ============================================================================
   src/tactical/T28-llm-connector.js  —  TACTICAL ENGINE · Q-D270-5 (D283/D284)
   THE LLM FIELD COMMANDER — slice 2: the connector (network + settings UI)

   Design law: docs/design/llm-opponent-design.md (Aaron-locked, D283) §2 (the
   connector law), §6 (settings/persistence), §7.4 (slice 2 scope). Slice 1
   (D284, T27-llm-commander.js) shipped the ENGINE half — the fog digest, the
   validation wall, order application, and every refusal gate — behind the
   __FIELD._t27MockPlan test hook, with NOTHING in the shipped game able to arm
   it. THIS slice is the other half: the player's own model, reached over the
   network, feeding real plans through that same wall.

   WHAT THIS MODULE OWNS (T27 owns cadence + the wall + order application):
     · Two adapters (law §2.1): A = OpenAI-compatible chat-completions
       (OpenRouter / Groq / localhost Ollama / LM Studio / custom); B =
       Anthropic Messages (browser opt-in header, haiku-class default, NEVER
       an Opus/Fable-class auto-select). The browser opt-in is ENFORCED, not
       just presented: adapter B is unconfigured without it (E65/D343), so no
       arm and no dispatch can happen before the player consents.
     · Provider presets (law §2.2), endpoints/free-tiers re-verified 2026-07-06
       (they drift — RE-VERIFY at the next build).
     · The async dispatch fldLlmDispatchAsync — the deliverable's FIRST runtime
       network call class. It is the ONLY fetch in the whole feature; T27 stays
       network-free (its source-hygiene tooth proves it).
     · Device-only config in localStorage under cw_llm_* (law §2.3) — NEVER in
       G.settings, gor_save, the C4 scenario share, any export, or the repo.
     · The connector settings panel + the per-battle enable (law §6), WCAG 2.2
       AA, reduceMotion-clean.
     · fldLlmArmOnLaunch — arms T27 from LIVE config at launch (see below).

   THE ARM CONTRACT (law §6 + the two D284 panel-recorded traps — CONTRACT LAW):
     · Arm = __FIELD.llmCommander = true; __FIELD._t27 = null; done at launch
       from EXPLICIT live config only, in fldLlmArmOnLaunch (called by T0
       fldLaunchSandbox right after fldInitSim).
     · TRAP 1 — NEVER persist llmCommander into __FIELD._launchOpts: the
       relaunch/new-seed button (T0:1663) Object.assigns _launchOpts into a
       fresh launch; a persisted flag would silently re-arm without consent
       (§6 forbids). We re-read live config on every launch instead, so
       DISABLING the connector means the next relaunch does NOT arm.
     · TRAP 2 — playerSide is stamped BEFORE arming: fldInitSim stamps
       __FIELD.playerSide (T0:310) during fldLaunchSandbox, and we arm AFTER
       that returns from fldInitSim, so fldLlmSide() aims the LLM at the AI
       army, never at the human's own side (fldLlmSide falls back to enemy-of-US
       when playerSide is unset).
     · PM3 stays neutral: the arm hook refuses when rendererKind === "none" or
       autoBoth (the D277 auto-resolve replay path); T27 double-locks it too.

   NETWORK LAW (law §2.4): calls fire ONLY in a live, explicitly-enabled battle.
   Off / unconfigured / headless / probe → ZERO network (probe-pinned, the
   fetch-spy tooth extended to the UI paths). The game stays fully playable
   offline forever; the connector is strictly additive. No _SAVE_VER bump —
   nothing LLM-related enters save state; a mid-battle save resumes under the
   ENGINE commander (§6).

   Bare-name globals (G / GAME_DATA / __FIELD / FLD / fld*). No new order types,
   no combat/damage writes (D74) — this module only chooses ORDERS the engine
   and player already share, through the T27 wall.
   ============================================================================ */

var LLM_TIMEOUT_MS = 12000;   // one plan request's wall-clock budget; on expiry the engine keeps commanding
var LLM_MAX_TOKENS = 900;     // enough for a per-brigade order list; small = cheap + fast

/* Provider presets (law §2.2). Endpoints + free tiers re-verified 2026-07-06 —
   free tiers DRIFT; re-verify at the next build. Gemini-direct + OpenAI-direct
   are EXCLUDED by law (no reliable browser CORS; a proxy breaks $0/no-backend).
   adapter: "A" OpenAI-compatible · "B" Anthropic Messages. */
var LLM_PRESETS = {
  openrouter: {
    adapter: "A", label: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", needsKey: true,
    models: ["deepseek/deepseek-r1:free", "meta-llama/llama-3.3-70b-instruct:free", "qwen/qwen3-coder:free", "openai/gpt-oss-120b:free"],
    cost: "free", note: "Free — pick a “:free” model, no card. One key, many models. Browser calls work; the free tier runs ~20 requests a minute.",
  },
  groq: {
    adapter: "A", label: "Groq", baseUrl: "https://api.groq.com/openai/v1", needsKey: true,
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "openai/gpt-oss-120b"],
    cost: "free", note: "Free tier ~30 requests a minute, no card, very fast. Browser access is open.",
  },
  ollama: {
    adapter: "A", label: "Ollama (on your computer)", baseUrl: "http://localhost:11434/v1", needsKey: false,
    models: ["llama3.1:8b", "qwen2.5:7b", "phi3.5"],
    cost: "local", note: "Runs privately on your machine — no key, no cost. Start Ollama with OLLAMA_ORIGINS set to allow this page; your browser may ask permission to reach the local network. Small models play weakly.",
  },
  lmstudio: {
    adapter: "A", label: "LM Studio (on your computer)", baseUrl: "http://localhost:1234/v1", needsKey: false,
    models: [],
    cost: "local", note: "Local server — turn on the CORS switch in LM Studio’s Developer tab. No key, no cost. Small models play weakly.",
  },
  anthropic: {
    adapter: "B", label: "Anthropic (Claude)", baseUrl: "https://api.anthropic.com", needsKey: true,
    models: ["claude-haiku-4-5"],
    cost: "paid", note: "PAID — needs Console API credits on your own key. A Claude Pro/Max subscription is NOT an API key. Uses a small, fast model by choice.",
  },
  custom: {
    adapter: "A", label: "Custom (OpenAI-compatible)", baseUrl: "", needsKey: false,
    models: [],
    cost: "custom", note: "Any OpenAI-compatible /chat/completions endpoint. Fill in the base URL, model, and a key if the server needs one.",
  },
};

/* The static system prompt (law §3.4 + §5 the voice/gravity law). Asks for orders
   JSON plus an OPTIONAL ≤160-char in-character "dispatch" line. The §5 containment
   stack is bound here: one-way facts (the model may phrase only what the digest
   shows — the SCHEMA carries no figure/date/citation/rank/unit-history field), the
   grim-professional register, and the anti-Lost-Cause charter (so any CS persona
   inherits it). Labeling ("Dramatization"), somber-scene suppression, and
   failure=silence live on the RENDER side (fldLlmRenderDispatch). */
var LLM_SYSTEM = [
  "You command one army in a real-time American Civil War brigade battle. You are the enemy general the human player faces.",
  "You are given a JSON battlefield digest of ONLY what your own side can see. Enemy brigades you have not scouted are simply absent — you can be deceived; do not assume what you cannot see.",
  "Reply with ONLY a JSON object, no prose, no markdown:",
  '{ "orders": [ { "id": "<your brigade id>", "type": "move"|"hold"|"charge", "tx": <x in yards>, "tz": <y in yards>, "formation": "line"|"column" } ], "dispatch": "<optional short in-character line>" }',
  "Rules: coordinates are yards on a field about 1200 wide by 900 deep. \"move\" and \"charge\" need tx/tz; \"hold\" holds in place (omit tx/tz). \"line\" maximizes fire; \"column\" marches faster. Only order YOUR brigades (the ids under \"own\"). Seize or deny the objective; concentrate force; use terrain and cover; exploit disorder.",
  "Register: a grim, professional 1860s field commander. Never glorify secession or slavery; no Lost-Cause tropes; no gloating, banter, or joking.",
  "The optional \"dispatch\" is ONE short in-character sentence (160 characters or fewer) — a field order or report in your own voice. Speak ONLY of what the digest shows you; never invent casualty figures, dates, place names, unit histories, ranks, or citations. If you have nothing grave and fitting to say, omit it.",
].join("\n");

/* Order schema for Adapter B's guaranteed-parse json_schema output (Anthropic).
   The optional voice dispatch (law §5) is bounded to 160 chars HERE, at the
   schema; it carries NO figure/date/citation/rank/unit-history field (one-way
   facts, §5.1). T27's wall re-clamps regardless (Adapter A can't enforce a schema). */
var LLM_PLAN_SCHEMA = {
  type: "object", additionalProperties: false, required: ["orders"],
  properties: {
    orders: {
      type: "array",
      items: {
        type: "object", additionalProperties: false, required: ["id", "type"],
        properties: {
          id: { type: "string" },
          type: { type: "string", enum: ["move", "hold", "charge"] },
          tx: { type: "number" },
          tz: { type: "number" },
          formation: { type: "string", enum: ["line", "column"] },
        },
      },
    },
    dispatch: { type: "string", maxLength: 160 },
  },
};

/* The somber battle set (law §5.4) — a local mirror of H0_SOMBER_SCENES
   (98-h0-main-menu.js: {antietam, gettysburg, chancellorsville}, the D280/D282
   dead-in-frame casualty plates). On these scenes NO live dispatch text renders —
   orders still execute; silence stands in. Kept local (H0_SOMBER_SCENES is
   module-scoped in 98-h0); if that set changes, mirror it here. */
var LLM_SOMBER_SCENES = { antietam: 1, gettysburg: 1, chancellorsville: 1 };
function fldLlmSceneIsSomber(sc) {
  if (!sc) return false;
  var s = String(sc).toLowerCase();
  if (LLM_SOMBER_SCENES[s]) return true;
  for (var k in LLM_SOMBER_SCENES) if (LLM_SOMBER_SCENES.hasOwnProperty(k) && s.indexOf(k) >= 0) return true;  // phase-suffixed / prefixed / substring ids
  return false;
}
/* The live somber gate — checks the field's scenario id AND the scenData id/name.
   __FIELD.scenario is the authoritative launch id for direct/registry launches
   (bullrun sets 'bullrun1'), but a procedurally-launched campaign battle can carry
   the default 'sandbox'; checking scenData.id/name too is fail-safe belt-and-braces
   (it only ADDS suppression — never renders live text where the id says somber). */
function fldLlmSomberNow() {
  if (typeof __FIELD === "undefined" || !__FIELD) return false;
  if (fldLlmSceneIsSomber(__FIELD.scenario)) return true;
  var sd = __FIELD.scenData;
  return !!(sd && (fldLlmSceneIsSomber(sd.id) || fldLlmSceneIsSomber(sd.name)));
}

/* PERSONA / DIFFICULTY SEASONING (law §3.4 + §7.4) — INPUT texture ONLY. A persona
   note may nudge COMMAND STYLE; it must NEVER encode a target outcome ("ensure the
   Confederates hold" is a D74 violation in prompt form). fldLlmPersonaLine is a
   PURE map from a commander's documented aggression (0..100) to a style clause.
   fldLlmPersonaFor resolves an OPTIONAL per-general temperament from generals.json
   (GAME_DATA.generals) for the commanded side, fully null-guarded — no match →
   "" (the base system prompt stands). It reads the battle's NAMED field/army
   leaders first (scenData.leaders, whose `short` surnames match the generals
   roster — e.g. Bull Run CS = Beauregard/Johnston/Jackson), in list order (army
   commander first), then brigade commanders (u.commander) as a fallback. Only the
   ICONIC roster (10/side) carries aggression, so this is honestly best-effort: it
   seasons when a rostered general commands, and is silent (inert) otherwise. */
function fldLlmPersonaLine(aggr) {
  if (typeof aggr !== "number" || !isFinite(aggr)) return "";
  var style = (aggr >= 65) ? "bold and offensive — you seek the decision by maneuver and concentrated attack"
    : (aggr <= 35) ? "deliberate and protective of your men — you maneuver with care and do not squander a brigade"
    : "measured — you balance caution with initiative as the field allows";
  return "Command temperament: " + style + ".";
}
/* lowercased surname token of a "Rank First M. Last" / "Last-J" string. */
function _fldLlmSurname(s) {
  if (typeof s !== "string" || !s) return "";
  var t = s.toLowerCase().replace(/["'`]/g, " ").replace(/[.,]/g, " ");
  var parts = t.split(/\s+/), last = "";
  for (var i = 0; i < parts.length; i++) if (parts[i]) last = parts[i];
  return last.replace(/-[a-z]$/, "");   // strip a "-j"/"-a" disambiguation suffix (Johnston-J -> johnston)
}
function fldLlmPersonaFor(side) {
  try {
    if (side !== "US" && side !== "CS") return "";
    var gd = (typeof GAME_DATA !== "undefined" && GAME_DATA && GAME_DATA.generals) ? GAME_DATA.generals : null;
    if (!gd || !gd.sides || !gd.sides[side] || !gd.sides[side].generals) return "";
    var gens = gd.sides[side].generals;
    if (Object.prototype.toString.call(gens) !== "[object Array]") return "";
    if (typeof __FIELD === "undefined" || !__FIELD) return "";
    // surname -> aggression, first occurrence wins (deterministic on a shared surname)
    var byName = Object.create(null), i, g, sn;
    for (i = 0; i < gens.length; i++) {
      g = gens[i];
      if (!g || typeof g.name !== "string" || typeof g.aggression !== "number" || !isFinite(g.aggression)) continue;
      sn = _fldLlmSurname(g.name);
      if (sn && byName[sn] === undefined) byName[sn] = g.aggression;
    }
    // ordered candidates: named field/army leaders (scenData.leaders) first, then
    // brigade commanders — the FIRST that matches the roster wins (army commander).
    var cands = [], sd = __FIELD.scenData, arr, l;
    if (sd && sd.leaders && Object.prototype.toString.call(sd.leaders[side]) === "[object Array]") {
      arr = sd.leaders[side];
      for (i = 0; i < arr.length; i++) { l = arr[i]; if (l) { sn = _fldLlmSurname(l.short || l.name); if (sn) cands.push(sn); } }
    }
    if (__FIELD.units) for (i = 0; i < __FIELD.units.length; i++) { var u = __FIELD.units[i];
      if (u && u.side === side && typeof u.commander === "string") { sn = _fldLlmSurname(u.commander); if (sn) cands.push(sn); } }
    for (i = 0; i < cands.length; i++) if (byName[cands[i]] !== undefined) return fldLlmPersonaLine(byName[cands[i]]);
    return "";
  } catch (e) { return ""; }
}

/* The per-battle system prompt = the static charter + optional persona seasoning
   for the commanded side. Input texture only; never an outcome directive. */
function fldLlmSystemPrompt(side) {
  var p = fldLlmPersonaFor(side);
  return p ? (LLM_SYSTEM + "\n" + p) : LLM_SYSTEM;
}

/* ---- device-only config (law §2.3): cw_llm_conn (provider/baseUrl/model/opts)
   + cw_llm_key (the secret, split out so "clear key" is surgical). NEVER touches
   G.settings / gor_save / the C4 share / any export. ---------------------- */
var LLM_STORE = "cw_llm_conn", LLM_KEY_STORE = "cw_llm_key";
var _llmConn = null;   // in-memory config; null = unconfigured

function _llmStrip(o) { if (o && typeof o === "object") { try { delete o.__proto__; } catch (e) {} try { delete o.constructor; } catch (e) {} try { delete o.prototype; } catch (e) {} } return o; }
function fldLlmConnReload() {
  var cfg = null, key = "";
  try { if (typeof localStorage !== "undefined") { var raw = localStorage.getItem(LLM_STORE); if (raw) { var o = JSON.parse(raw); if (o && typeof o === "object") cfg = _llmStrip(o); } } } catch (e) { cfg = null; }
  try { if (typeof localStorage !== "undefined") key = localStorage.getItem(LLM_KEY_STORE) || ""; } catch (e) { key = ""; }
  if (cfg) cfg.key = key;
  _llmConn = cfg;
  return _llmConn;
}
function _llmPersist() {
  try {
    if (typeof localStorage === "undefined") return;
    if (!_llmConn) { localStorage.removeItem(LLM_STORE); localStorage.removeItem(LLM_KEY_STORE); return; }
    var pub = { provider: _llmConn.provider, baseUrl: _llmConn.baseUrl, model: _llmConn.model, browserOptIn: !!_llmConn.browserOptIn, enabled: !!_llmConn.enabled };
    localStorage.setItem(LLM_STORE, JSON.stringify(pub));
    if (_llmConn.key) localStorage.setItem(LLM_KEY_STORE, _llmConn.key); else localStorage.removeItem(LLM_KEY_STORE);
  } catch (e) {}
}

/* Config API (T27's fldLlmConfigured delegates to fldLlmConnConfigured).
   E65 (D343): this predicate is the ONE consent seam — adapter B (Anthropic)
   is NOT configured until the player's explicit "Allow direct browser calls"
   opt-in is on, so fldLlmEnabledForBattle, fldLlmArmOnLaunch, and
   fldLlmDispatchAsync (which all gate on configured) can never arm or send
   the anthropic-dangerous-direct-browser-access header without consent. A
   pre-E65 stored config without the flag is deliberately NOT grandfathered. */
function fldLlmConn() { return _llmConn; }
function fldLlmConnConfigured() {
  if (!_llmConn || !_llmConn.provider || !_llmConn.model) return false;
  var p = LLM_PRESETS[_llmConn.provider]; if (!p) return false;
  if (p.needsKey && !_llmConn.key) return false;
  if (p.adapter === "A" && !_llmConn.baseUrl) return false;
  if (p.adapter === "B" && !_llmConn.browserOptIn) return false;
  return true;
}
function fldLlmEnabledForBattle() { return fldLlmConnConfigured() && !!(_llmConn && _llmConn.enabled); }
function fldLlmConnSet(cfg) {
  cfg = cfg || {};
  var p = LLM_PRESETS[cfg.provider] ? cfg.provider : "custom", def = LLM_PRESETS[p];
  _llmConn = {
    provider: p,
    baseUrl: (cfg.baseUrl != null ? String(cfg.baseUrl) : (def.baseUrl || "")),
    model: cfg.model != null ? String(cfg.model) : "",
    key: cfg.key != null ? String(cfg.key) : (_llmConn && _llmConn.key ? _llmConn.key : ""),
    browserOptIn: !!cfg.browserOptIn,
    enabled: !!cfg.enabled,
  };
  _llmPersist();
  return _llmConn;
}
function fldLlmConnClearKey() { if (_llmConn) _llmConn.key = ""; try { if (typeof localStorage !== "undefined") localStorage.removeItem(LLM_KEY_STORE); } catch (e) {} }
function fldLlmConnClear() { _llmConn = null; _llmPersist(); }

/* THE ARM HOOK (law §6 + the two D284 traps). T0 fldLaunchSandbox calls this
   right after fldInitSim (playerSide already stamped). Arms T27 ONLY from live
   config; refuses headless/autoBoth (PM3); NEVER writes into _launchOpts. */
function fldLlmArmOnLaunch() {
  if (typeof __FIELD === "undefined" || !__FIELD) return;
  if (__FIELD.rendererKind === "none" || __FIELD.autoBoth) return;   // PM3 / headless: engine only
  if (!fldLlmEnabledForBattle()) return;                             // opt-in, off by default
  __FIELD.llmCommander = true;                                       // arm from LIVE config (never via _launchOpts)
  __FIELD._t27 = null;                                               // fresh seam state for this launch/gen
}

/* ---- the two adapters (law §2.1) ---------------------------------------- */
function _llmParseJsonLoose(s) {
  if (typeof s !== "string") return null;
  var m = s.match(/\{[\s\S]*\}/);   // the LLM may wrap JSON in prose/fences; the wall re-validates regardless
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch (e) { return null; }
}
function _llmReqA(conn, digest) {   // OpenAI-compatible chat-completions
  var headers = { "Content-Type": "application/json" };
  if (conn.key) headers["Authorization"] = "Bearer " + conn.key;
  return {
    url: String(conn.baseUrl || "").replace(/\/+$/, "") + "/chat/completions",
    headers: headers,
    body: {
      model: conn.model,
      messages: [{ role: "system", content: fldLlmSystemPrompt(digest && digest.side) }, { role: "user", content: JSON.stringify(digest) }],
      response_format: { type: "json_object" }, max_tokens: LLM_MAX_TOKENS, temperature: 0.7,
    },
    parse: function (data) {
      var c = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      return _llmParseJsonLoose(c);
    },
  };
}
function _llmReqB(conn, digest) {   // Anthropic Messages (browser opt-in header; haiku-class default)
  return {
    url: "https://api.anthropic.com/v1/messages",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": conn.key || "",
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: {
      model: conn.model || "claude-haiku-4-5", max_tokens: LLM_MAX_TOKENS,
      system: fldLlmSystemPrompt(digest && digest.side), messages: [{ role: "user", content: JSON.stringify(digest) }],
      output_config: { format: { type: "json_schema", schema: LLM_PLAN_SCHEMA } },
    },
    parse: function (data) {
      var blocks = data && data.content, txt = "";
      if (Object.prototype.toString.call(blocks) === "[object Array]") {
        for (var i = 0; i < blocks.length; i++) if (blocks[i] && blocks[i].type === "text" && typeof blocks[i].text === "string") txt += blocks[i].text;
      }
      return _llmParseJsonLoose(txt);
    },
  };
}

/* THE ASYNC DISPATCH (law §2.4/§3.3) — the deliverable's FIRST runtime network
   call class, and the ONLY fetch in the feature. T27's fldLlmRequestPlan calls
   this when no mock hook is present and a connector is live. One request; a
   hard timeout; ANY failure (network / HTTP error / bad JSON / refusal / abort)
   resolves cb(null) so the wall keeps the last good plan and the engine
   commands meanwhile. Never throws; never blocks the sim. */
function fldLlmDispatchAsync(digest, cb) {
  var done = false, timer = null, ctrl = null;
  function finish(v) { if (done) return; done = true; if (timer != null) { try { clearTimeout(timer); } catch (e) {} } try { cb(v); } catch (e) {} }
  try {
    var conn = fldLlmConn();
    if (!conn || !fldLlmConnConfigured()) { finish(null); return; }
    if (typeof fetch !== "function") { finish(null); return; }
    var preset = LLM_PRESETS[conn.provider] || LLM_PRESETS.custom;
    var req = (preset.adapter === "B") ? _llmReqB(conn, digest) : _llmReqA(conn, digest);
    if (!req.url) { finish(null); return; }
    try { ctrl = (typeof AbortController !== "undefined") ? new AbortController() : null; } catch (e) { ctrl = null; }
    timer = setTimeout(function () { if (ctrl) { try { ctrl.abort(); } catch (e) {} } finish(null); }, LLM_TIMEOUT_MS);
    var opts = { method: "POST", headers: req.headers, body: JSON.stringify(req.body) };
    if (ctrl) opts.signal = ctrl.signal;
    fetch(req.url, opts).then(function (r) {
      if (!r || !r.ok) { finish(null); return null; }
      return r.json();
    }).then(function (data) {
      if (done) return;
      finish(data ? req.parse(data) : null);
    })["catch"](function () { finish(null); });
  } catch (e) { finish(null); }
}

/* ===========================================================================
   THE DISPATCH RENDER SURFACE (law §5 — voice & gravity). Reads the latest
   captured dispatch from T27's seam state (__FIELD._t27.dispatch) and paints a
   small in-battle HUD card, under the full containment stack:
     · Labeling (§5.3): always captioned "Dramatization", visually distinct
       (italic body, small-caps brass caption) from the cited Verified/Inferred
       layer — this text is NEVER stamped Verified/Inferred.
     · Somber suppression (§5.4): on H0_SOMBER_SCENES no live TEXT renders (orders
       still executed upstream) — silence stands in over the dead.
     · Failure = silence (§5.5): no current dispatch (refusal/error/timeout/empty,
       or a valid plan that carried no line) → nothing renders (element hidden);
       never an apology, never meta-text.
     · One-way facts (§5.1) are enforced upstream (schema + T27 clean); the LLM
       text is HTML-escaped here (untrusted).
     · Grounding null-guard (§5.6): this reads ONLY __FIELD._t27 (T27's own bag),
       never __FIELD._e53 (which exists only while T26 parity is active) — no
       T26-diagnostic dependency, so nothing to null-guard-miss.
   Called each frame from T0 fldRenderTop (a cheap no-op when the seam is off) and
   directly by the probe. reduceMotion-safe: the card is static (no transition/
   animation); only its text changes, and only when the dispatch changes. */
function fldLlmRenderDispatch() {
  try {
    if (typeof document === "undefined" || typeof __FIELD === "undefined" || !__FIELD) return;
    var top = document.getElementById("fldTop");
    var root = (top && top.parentNode) ? top.parentNode : null;
    if (!root) return;                                   // no field DOM (headless) → nothing to paint
    var el = document.getElementById("fldDispatch");
    var st = __FIELD._t27;
    var somber = fldLlmSomberNow();                      // §5.4: no live text over the dead (scenario + scenData id/name)
    var text = (__FIELD.llmCommander && st && !somber && typeof st.dispatch === "string" && st.dispatch) ? st.dispatch : "";
    if (!text) {                                         // §5.5 silence (or suppressed) → hide
      if (el) { el.style.display = "none"; el.removeAttribute("data-disp"); }
      return;
    }
    if (!el) {
      el = document.createElement("div");
      el.id = "fldDispatch"; el.setAttribute("role", "note"); el.setAttribute("aria-label", "Enemy dispatch, dramatization");
      // top-LEFT, below the #fldTop bar: the only reliably panel-free zone (#fldHud
      // is top-right, #fldBar bottom-center, the terrain legend bottom-right — the
      // screenshot-readback collision the geometry teeth missed, D282 lesson).
      el.style.cssText = "position:absolute;top:62px;left:12px;max-width:280px;z-index:5;background:#0c0f14f2;border:1px solid #745e3f;border-radius:6px;padding:8px 11px;font-size:12.5px;line-height:1.42;color:#e9dcc0;pointer-events:none;";
      root.appendChild(el);
    }
    if (el.getAttribute("data-disp") === text) { el.style.display = "block"; return; }   // unchanged → no DOM thrash
    el.setAttribute("data-disp", text);
    el.style.display = "block";
    el.innerHTML = '<div style="font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;color:#d8b458;font-weight:bold;margin-bottom:3px;">Enemy Dispatch &middot; Dramatization</div>'
      + '<div style="font-style:italic;color:#e9dcc0;">' + _llmEsc(text) + '</div>';
  } catch (e) {}
}

/* ===========================================================================
   THE CONNECTOR SETTINGS PANEL (law §6) — a main-menu sheet, the T6 idiom.
   WCAG 2.2 AA: role=group + aria-labelledby, aria-pressed toggle groups (NOT
   role=radio — no roving nav), <label for> on every input, an aria-live
   summary, focus into the panel on open. reduceMotion-clean (sheets never
   animate). Device-only key handling with the "stored on this device only"
   note + a clear-key button.
   =========================================================================== */
var _llmUi = null;   // in-progress panel edits (committed to _llmConn only on Save)

function _llmUiInit() {
  var c = _llmConn || {};
  var prov = LLM_PRESETS[c.provider] ? c.provider : "openrouter", def = LLM_PRESETS[prov];
  _llmUi = {
    provider: prov,
    baseUrl: (c.baseUrl != null && c.provider === prov) ? c.baseUrl : (def.baseUrl || ""),
    model: (c.model && c.provider === prov) ? c.model : (def.models[0] || ""),
    key: c.key || "",
    browserOptIn: !!c.browserOptIn,
    enabled: !!c.enabled,
  };
}
function _llmPickProvider(prov) {
  if (!LLM_PRESETS[prov]) return;
  var keepKey = _llmUi ? _llmUi.key : "", def = LLM_PRESETS[prov];
  _llmUi.provider = prov;
  _llmUi.baseUrl = def.baseUrl || "";
  _llmUi.model = def.models[0] || "";
  _llmUi.key = keepKey;   // a typed key survives a provider switch (a key mismatch just fails on use)
}
function _llmEsc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

/* The Status text (the aria-live region's content). Extracted so a toggle can
   refresh it IN PLACE (D285 panel-polish) instead of via a full openSheet
   re-render — a replaced live-region node does not reliably announce. */
function _llmSummaryText() {
  var u = _llmUi || {};
  if (fldLlmConnConfigured() && u.enabled) return "Connected AI will command the enemy in your next battle.";
  // E65: when the ONLY blocker is the un-clicked consent toggle, say so — "fill in
  // the fields" is misleading when every field is visibly filled.
  if (u.enabled && u.provider === "anthropic" && u.key && u.model && !u.browserOptIn)
    return "Enabled — but turn on “Allow direct browser calls” above to let the game reach Anthropic.";
  return u.enabled ? "Enabled — but fill in the fields above to finish connecting." : "Off — the built-in general commands the enemy.";
}

function _llmConnHtml() {
  var u = _llmUi, def = LLM_PRESETS[u.provider];
  var provCards = "";
  var order = ["openrouter", "groq", "ollama", "lmstudio", "anthropic", "custom"];
  for (var i = 0; i < order.length; i++) {
    var pk = order[i], p = LLM_PRESETS[pk], on = (pk === u.provider);
    var tag = p.cost === "free" ? "Free" : (p.cost === "local" ? "On your PC" : (p.cost === "paid" ? "Paid key" : "Custom"));
    provCards += '<button type="button" class="upg" role="button" aria-pressed="' + (on ? "true" : "false") + '" data-lprov="' + pk + '"'
      + ' style="flex:1 1 150px;min-width:140px;text-align:left;padding:8px 10px;border-radius:6px;'
      + (on ? "outline:2px solid var(--h0d-focus);outline-offset:1px;background:var(--h0d-panel2);" : "background:var(--h0d-panel);") + '">'
      + '<div style="font-weight:bold;color:' + (on ? "var(--h0d-focus)" : "var(--h0d-ink)") + ';">' + (on ? "▸ " : "") + _llmEsc(p.label) + '</div>'
      + '<div style="font-size:11px;color:var(--h0d-brass);margin-top:2px;letter-spacing:.04em;">' + tag + '</div></button>';
  }
  var modelChips = "";
  if (def.models.length) {
    modelChips = '<div role="group" aria-label="Suggested models" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:5px;">';
    for (var m = 0; m < def.models.length; m++) {
      var mid = def.models[m], msel = (mid === u.model);
      modelChips += '<button type="button" class="upg" data-lmodel="' + _llmEsc(mid) + '" aria-pressed="' + (msel ? "true" : "false") + '"'
        + ' style="font-size:11.5px;padding:4px 8px;border-radius:5px;' + (msel ? "outline:2px solid var(--h0d-focus);outline-offset:1px;background:var(--h0d-panel2);color:var(--h0d-focus);" : "background:var(--h0d-panel);color:var(--h0d-ink);") + '">' + _llmEsc(mid) + '</button>';
    }
    modelChips += '</div>';
  }
  var keyBlock = "";
  if (def.needsKey) {
    keyBlock = '<div style="margin-top:12px;">'
      + '<label for="llmKey" style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--h0d-brass);margin-bottom:3px;">Your API key</label>'
      + '<div style="display:flex;gap:6px;">'
      +   '<input id="llmKey" type="password" autocomplete="off" spellcheck="false" value="' + _llmEsc(u.key) + '" placeholder="' + (u.provider === "anthropic" ? "sk-ant-…" : "sk-…") + '"'
      +     ' style="flex:1;background:#0c1210;color:var(--h0d-ink);border:1px solid var(--h0d-line);border-radius:5px;padding:8px 10px;font:13px monospace;" />'
      +   '<button id="llmClearKey" type="button" class="upg" style="white-space:nowrap;">Clear key</button>'
      + '</div>'
      + '<div style="font-size:11px;color:var(--h0d-muted);margin-top:4px;">🔒 Stored on this device only — never in your saves, shares, or exports, and never sent anywhere but the endpoint above.</div>'
      + '</div>';
  }
  var browserBlock = "";
  if (u.provider === "anthropic") {
    browserBlock = '<div style="margin-top:10px;display:flex;align-items:flex-start;gap:8px;">'
      + '<button id="llmBrowserOptIn" type="button" class="upg" role="checkbox" aria-checked="' + (u.browserOptIn ? "true" : "false") + '" aria-label="Allow direct browser calls to Anthropic" style="min-width:56px;">' + (u.browserOptIn ? "On" : "Off") + '</button>'
      + '<span style="font-size:12px;color:var(--h0d-muted);line-height:1.45;">Anthropic needs an explicit browser opt-in. Turn this on to allow this page to call the Claude API directly with your key. While this is off, the game will not call Anthropic at all.</span>'
      + '</div>';
  }
  var baseBlock = "";
  if (u.provider === "custom" || u.provider === "ollama" || u.provider === "lmstudio") {
    baseBlock = '<div style="margin-top:12px;">'
      + '<label for="llmBase" style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--h0d-brass);margin-bottom:3px;">Endpoint base URL</label>'
      + '<input id="llmBase" type="text" autocomplete="off" spellcheck="false" value="' + _llmEsc(u.baseUrl) + '" placeholder="https://…/v1"'
      +   ' style="width:100%;box-sizing:border-box;background:#0c1210;color:var(--h0d-ink);border:1px solid var(--h0d-line);border-radius:5px;padding:8px 10px;font:13px monospace;" />'
      + '</div>';
  }
  var summary = _llmSummaryText();
  return ''
    + '<div style="--h0d-panel:#111918;--h0d-panel2:#17231f;--h0d-ink:#f3efe4;--h0d-muted:#c5cdc3;--h0d-brass:#d8b458;--h0d-amber:#d0a047;--h0d-focus:#ffe27a;--h0d-line:rgba(216,180,88,.30);max-width:680px;margin:0 auto;color:var(--h0d-ink);">'
    + '<h1 class="title-xl" style="text-align:center;">⚜ Connected AI Opponent</h1>'
    + '<p class="title-sub" style="text-align:center;">Experimental. Connect your own AI model to command the enemy army — it can genuinely surprise you and be out-generaled live. The built-in general is often stronger than small free models, and a connected battle is not reproducible.</p>'
    + '<hr class="rule">'
    + '<div id="llmProvGroup" role="group" aria-labelledby="llmProvLbl">'
    +   '<div id="llmProvLbl" style="font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--h0d-brass);margin-bottom:5px;">Provider</div>'
    +   '<div style="display:flex;gap:8px;flex-wrap:wrap;">' + provCards + '</div>'
    + '</div>'
    + '<div style="margin-top:9px;font-size:12px;color:var(--h0d-muted);line-height:1.5;">' + _llmEsc(def.note) + '</div>'
    + baseBlock
    + '<div style="margin-top:12px;">'
    +   '<label for="llmModel" style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--h0d-brass);margin-bottom:3px;">Model</label>'
    +   '<input id="llmModel" type="text" autocomplete="off" spellcheck="false" value="' + _llmEsc(u.model) + '" placeholder="model name"'
    +     ' style="width:100%;box-sizing:border-box;background:#0c1210;color:var(--h0d-ink);border:1px solid var(--h0d-line);border-radius:5px;padding:8px 10px;font:13px monospace;" />'
    +   modelChips
    + '</div>'
    + keyBlock
    + browserBlock
    + '<div style="margin-top:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid var(--h0d-line);padding-top:12px;">'
    +   '<span style="font-size:13px;">Command the enemy with the connected AI</span>'
    +   '<button id="llmEnable" type="button" class="upg" role="switch" aria-checked="' + (u.enabled ? "true" : "false") + '" aria-label="Command the enemy with the connected AI" style="min-width:64px;' + (u.enabled ? "outline:2px solid var(--h0d-focus);outline-offset:1px;font-weight:bold;" : "") + '">' + (u.enabled ? "On" : "Off") + '</button>'
    + '</div>'
    + '<div style="font-size:12px;color:var(--h0d-muted);margin-top:6px;" aria-live="polite">Status: <b id="llmSummary" style="color:var(--h0d-ink);">' + _llmEsc(summary) + '</b></div>'
    + '<div class="btn-row" style="margin-top:14px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">'
    +   '<button id="llmBack" type="button" class="upg">Back</button>'
    +   '<button id="llmForget" type="button" class="upg">Forget this device’s connection</button>'
    +   '<button id="llmSave" type="button" class="bigbtn">Save &amp; Close</button>'
    + '</div>'
    + '</div>';
}
function _llmReadFields() {
  var mv = document.getElementById("llmModel"); if (mv) _llmUi.model = mv.value;
  var kv = document.getElementById("llmKey"); if (kv) _llmUi.key = kv.value;
  var bv = document.getElementById("llmBase"); if (bv) _llmUi.baseUrl = bv.value;
}
function _llmRerender(focusSel) {
  if (typeof openSheet !== "function") return;
  openSheet(_llmConnHtml());
  _llmConnWire();
  try { var f = focusSel ? document.querySelector(focusSel) : null; if (f) f.focus(); } catch (e) {}
}
function _llmConnWire() {
  var w = function (id, ev, fn) { var el = document.getElementById(id); if (el) el.addEventListener(ev, fn); };
  var cards = document.querySelectorAll("[data-lprov]");
  for (var i = 0; i < cards.length; i++) (function (el) {
    el.addEventListener("click", function () { _llmReadFields(); _llmPickProvider(el.getAttribute("data-lprov")); _llmRerender('[data-lprov="' + el.getAttribute("data-lprov") + '"]'); });
  })(cards[i]);
  var chips = document.querySelectorAll("[data-lmodel]");
  for (var j = 0; j < chips.length; j++) (function (el) {
    el.addEventListener("click", function () { _llmReadFields(); _llmUi.model = el.getAttribute("data-lmodel"); _llmRerender('[data-lmodel="' + CSS_ATTR(el.getAttribute("data-lmodel")) + '"]'); });
  })(chips[j]);
  function CSS_ATTR(s) { return String(s).replace(/"/g, '\\"'); }
  w("llmEnable", "click", function () {
    _llmReadFields(); _llmUi.enabled = !_llmUi.enabled;
    // D285 panel-polish: update the switch + the aria-live Status region IN PLACE
    // (not a full openSheet re-render) so the toggle reliably announces to AT.
    var btn = document.getElementById("llmEnable");
    if (btn) {
      btn.setAttribute("aria-checked", _llmUi.enabled ? "true" : "false");
      btn.textContent = _llmUi.enabled ? "On" : "Off";
      btn.style.outline = _llmUi.enabled ? "2px solid var(--h0d-focus)" : "";
      btn.style.outlineOffset = _llmUi.enabled ? "1px" : "";
      btn.style.fontWeight = _llmUi.enabled ? "bold" : "";
    }
    var s = document.getElementById("llmSummary"); if (s) s.textContent = _llmSummaryText();
    try { if (btn) btn.focus(); } catch (e) {}
  });
  w("llmBrowserOptIn", "click", function () { _llmReadFields(); _llmUi.browserOptIn = !_llmUi.browserOptIn; _llmRerender("#llmBrowserOptIn"); });
  w("llmClearKey", "click", function () { _llmUi.key = ""; var kv = document.getElementById("llmKey"); if (kv) kv.value = ""; fldLlmConnClearKey(); try { if (kv) kv.focus(); } catch (e) {} });
  w("llmForget", "click", function () { fldLlmConnClear(); _llmUiInit(); _llmRerender('[data-lprov="' + _llmUi.provider + '"]'); });
  w("llmSave", "click", function () {
    _llmReadFields();
    fldLlmConnSet({ provider: _llmUi.provider, baseUrl: _llmUi.baseUrl, model: _llmUi.model, key: _llmUi.key, browserOptIn: _llmUi.browserOptIn, enabled: _llmUi.enabled });
    if (typeof openMainMenu === "function") openMainMenu();
  });
  w("llmBack", "click", function () { if (typeof openMainMenu === "function") openMainMenu(); });
}
function fldLlmConnMenu() {
  if (typeof openSheet !== "function") return;
  _llmUiInit();
  openSheet(_llmConnHtml());
  _llmConnWire();
  try { var f = document.querySelector('[data-lprov="' + _llmUi.provider + '"]') || document.querySelector("[data-lprov]"); if (f) f.focus(); } catch (e) {}
}

/* ---- main-menu button injection (the canonical fldInjectMenuButton pattern:
   chain off the last known injected tactical button, MutationObserver re-inject). */
function fldLlmInjectMenuButton() {
  try {
    if (typeof document === "undefined" || document.getElementById("fldLlmBtn")) return;
    var afterBtn = document.getElementById("fldCustomBuilderBtn") || document.getElementById("fldPresetBtn")
      || document.getElementById("fldSkirmishBtn") || document.getElementById("fldSandboxBtn") || document.getElementById("gnFree");
    if (!afterBtn || !afterBtn.parentNode) return;
    var b = document.createElement("button");
    b.className = "gn-btn"; b.id = "fldLlmBtn";
    b.setAttribute("aria-label", "Connected AI Opponent, experimental — connect your own AI model (OpenRouter, Groq, a local model, or a Claude key) to command the enemy army in real-time battles.");
    b.innerHTML = '<span class="gn-hl">⚜ CONNECTED AI OPPONENT</span><span class="gn-deck">Experimental — bring your own AI model (free OpenRouter/Groq, a local model, or a Claude key) to command the enemy army. Off by default.</span>';
    b.addEventListener("click", function () { fldLlmConnMenu(); });
    if (afterBtn.nextSibling) afterBtn.parentNode.insertBefore(b, afterBtn.nextSibling); else afterBtn.parentNode.appendChild(b);
  } catch (e) {}
}
function fldLlmInstallMenuObserver() {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;
  try {
    fldLlmInjectMenuButton();
    var obs = new MutationObserver(function () { fldLlmInjectMenuButton(); });
    obs.observe(document.body, { childList: true, subtree: true });
  } catch (e) {}
}

/* boot: load device config so fldLlmConnConfigured() is honest from the first
   launch, and install the menu-button observer. */
(function fldLlmBoot() {
  try {
    fldLlmConnReload();
    if (typeof document === "undefined") return;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fldLlmInstallMenuObserver);
    else fldLlmInstallMenuObserver();
  } catch (e) {}
})();
