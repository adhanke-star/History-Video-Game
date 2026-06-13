/* ==== AUDIO_WIRE — integration glue for the adaptive period score ==================
   Thin, fully-guarded bridge between the engine's lifecycle and AUDIO_SCORE's API
   (scoreInit / musicStart / musicStop / bugleCall / dinSet / dinStop /
   scoreSampleBattle, all on window). Engine core calls only these three helpers
   (+ a couple of bugleCall sites) so the core edits stay one-liners.

   Also fixes a latent gap found this run: ambientStart() was only ever called from
   the Settings sound toggle, so the looping wind bed never started on battle entry.
   _audEnterBattle starts it (and _audLeaveBattle/_audMenu stop it).

   All helpers swallow errors — audio must never crash the game. Nothing here is
   saved or persisted; no engine symbol is redeclared.
   ----------------------------------------------------------------------------------- */

var _audDinTimer = null;   // setInterval handle sampling battle intensity -> dinSet

function _audCall(fn, a) {
  try { if (typeof window !== "undefined" && typeof window[fn] === "function") window[fn](a); }
  catch (e) {}
}

// Battle begins: bring up the martial bed + the wind ambient, prime the din to 0,
// and start sampling combat intensity to drive the din bed.
function _audEnterBattle() {
  try {
    _audCall("scoreInit");
    _audCall("musicStart", "battle");
    _audCall("dinSet", 0);
    if (typeof ambientStart === "function") ambientStart();      // also fixes the latent gap
    if (_audDinTimer) { clearInterval(_audDinTimer); _audDinTimer = null; }
    if (typeof setInterval !== "undefined") {
      _audDinTimer = setInterval(function () {
        try {
          if (typeof G === "undefined" || G.mode !== "battle" || !G.battle || G.battle.over) return;
          if (typeof scoreSampleBattle === "function" && typeof dinSet === "function") {
            dinSet(scoreSampleBattle());
          }
        } catch (e) {}
      }, 1200);
    }
  } catch (e) {}
}

// Battle ends / we leave the field: silence the din + martial bed + wind.
function _audLeaveBattle() {
  try {
    if (_audDinTimer) { clearInterval(_audDinTimer); _audDinTimer = null; }
    _audCall("dinStop");
    if (typeof ambientStop === "function") ambientStop();
    _audCall("musicStop");
  } catch (e) {}
}

// The morning-newspaper menu: a bright fife-and-drum quickstep. (Crossfades from
// whatever was playing; the AudioContext only sounds after the first user gesture,
// so the very first boot is silent until the player clicks — standard autoplay rule.)
function _audMenu() {
  try {
    if (_audDinTimer) { clearInterval(_audDinTimer); _audDinTimer = null; }
    _audCall("scoreInit");
    _audCall("dinStop");
    if (typeof ambientStop === "function") ambientStop();
    _audCall("musicStart", "menu");
  } catch (e) {}
}
