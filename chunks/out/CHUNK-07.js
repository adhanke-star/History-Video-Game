/* ==== §15 — SAVE/LOAD (CHUNK-07) ==== */

// ---- Key and shape constants ----
var _SAVE_KEY = "gor_save";
var _SAVE_VER = 1;

// ---- serializeSave() ----
// Returns a plain object safe to JSON.stringify.
// G.campaign may be null (free-battle mode) — that is valid.
// G.battle is NEVER included (cyclic, volatile, large).
function serializeSave() {
  return {
    ver:      _SAVE_VER,
    when:     Date.now(),
    settings: G.settings,
    campaign: G.campaign
  };
}

// ---- saveLocal() ----
// Writes the save to localStorage["gor_save"].
// Silent on failure — file:// in Safari can permanently block localStorage;
// a silent failure is far less disruptive than repeated toast spam during
// a session where storage is unavailable.
// On SUCCESS: shows a brief, subtle toast ("Progress saved.").
// CHOICE: toast on success, silent on failure.
function saveLocal() {
  try {
    var json = JSON.stringify(serializeSave());
    localStorage.setItem(_SAVE_KEY, json);
    toast("Progress saved.", 1400);
  } catch (e) {
    // Swallow — storage may be blocked on file:// or in private browsing.
  }
}

// ---- loadLocal() ----
// Returns the parsed save object if it passes validation, or null.
// Corrupt JSON, missing key, wrong version, and missing settings all
// return null without throwing — every failure path is explicit.
function loadLocal() {
  try {
    var raw = localStorage.getItem(_SAVE_KEY);
    if (raw === null || raw === undefined) return null;
    var sv;
    try {
      sv = JSON.parse(raw);
    } catch (parseErr) {
      return null;
    }
    // Version gate (strict equality — future versions must bump ver)
    if (!sv || sv.ver !== _SAVE_VER) return null;
    // Shape gate — settings must be an object (not null, not array)
    if (!sv.settings || typeof sv.settings !== "object" || Array.isArray(sv.settings)) return null;
    return sv;
  } catch (e) {
    // localStorage.getItem itself can throw on file:// in Safari
    return null;
  }
}

// ---- applySave(sv) ----
// Merges sv.settings onto the live G.settings so any keys added in later
// engine versions keep their defaults rather than being wiped.
// G.campaign is replaced wholesale (null is valid — means no active campaign).
function applySave(sv) {
  Object.assign(G.settings, sv.settings);
  G.campaign = sv.campaign || null;
}

// ---- exportSave() ----
// Serializes the save and triggers a browser download of a .json file.
// The <a> element is created, used, and discarded — never added to the DOM.
// URL.createObjectURL is revoked after a short delay to allow the download
// to start before the blob URL is invalidated.
function exportSave() {
  try {
    var json = JSON.stringify(serializeSave(), null, 2);
    var blob = new Blob([json], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "generals_of_the_republic_save.json";
    a.click();
    // Revoke after a tick — the download must start before revoke
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  } catch (e) {
    toast("Export failed.", 2200);
  }
}

// ---- importSave(onDone) ----
// Creates a temporary <input type="file"> element (never attached to the DOM),
// clicks it, and reads the chosen file via FileReader.
// onDone(true)  — called when a valid save was successfully applied.
// onDone(false) — called when the user picks an invalid/corrupt file.
//
// NOTE: onDone is NOT called if the user dismisses the file picker without
// choosing a file (focus/cancel detection is unreliable across browsers on
// file:// and on Safari). onDone fires only on the "change" event.
// Callers that need a cancel path should handle it via a timeout or UI cue.
function importSave(onDone) {
  try {
    var input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.style.display = "none";

    input.addEventListener("change", function () {
      var file = input.files && input.files[0];
      if (!file) {
        onDone(false);
        return;
      }
      var reader = new FileReader();
      reader.onload = function (evt) {
        try {
          var sv;
          try {
            sv = JSON.parse(evt.target.result);
          } catch (parseErr) {
            onDone(false);
            return;
          }
          // Same validation as loadLocal
          if (!sv || sv.ver !== _SAVE_VER) { onDone(false); return; }
          if (!sv.settings || typeof sv.settings !== "object" || Array.isArray(sv.settings)) {
            onDone(false);
            return;
          }
          applySave(sv);
          onDone(true);
        } catch (e) {
          onDone(false);
        }
      };
      reader.onerror = function () { onDone(false); };
      reader.readAsText(file);
    });

    input.click();
  } catch (e) {
    onDone(false);
  }
}

// ---- hasSave() ----
// Returns true iff localStorage contains a valid, parseable ver-1 save.
// Calls loadLocal() which already does all validation inside try/catch.
function hasSave() {
  return loadLocal() !== null;
}
