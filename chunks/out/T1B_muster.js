/* ==== THE MUSTER ROLL (mr) — cross-mode regimental ledger ====
 * The series' soul: every named regiment and its fate, kept permanently.
 * Exports exactly four functions for the integrator:
 *   mrInit(C), mrOnResolve(winnerSide,type,B,C,win), mrRenderHTML(C), mrWire(C)
 * State lives only in C.muster. No engine symbols redeclared. Ledger layer only;
 * never touches battle play, render, combat math, or G.settings. */

const _mrSTATES_US = ["Maine","New York","Pennsylvania","Ohio","Indiana","Illinois",
  "Michigan","Wisconsin","Massachusetts","Connecticut","Iowa","Minnesota"];
const _mrSTATES_CS = ["Virginia","Georgia","Alabama","Mississippi","Texas",
  "South Carolina","North Carolina","Tennessee","Louisiana","Arkansas","Florida"];
const _mrARM = { inf:"Infantry", art:"Battery", cav:"Cavalry" };

// minimal HTML escape for trusted-but-unsanitized roster names
function _mrEsc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ordinal: 1->"1st", 2->"2nd", 3->"3rd", 11->"11th", 21->"21st", 33->"33rd"
function _mrOrd(n) {
  n = (n | 0);
  if (n <= 0) n = 1;
  const t = n % 100, o = n % 10;
  let suf = "th";
  if (t < 11 || t > 13) {
    if (o === 1) suf = "st";
    else if (o === 2) suf = "nd";
    else if (o === 3) suf = "rd";
  }
  return n + suf;
}

// deterministic-ish period regimental name driven by C.muster.nameSeq
function _mrName(C, type, side) {
  const m = C.muster;
  const seq = (m.nameSeq | 0);
  m.nameSeq = seq + 1;
  const pool = (side === "CS") ? _mrSTATES_CS : _mrSTATES_US;
  const state = pool[seq % pool.length];
  const arm = _mrARM[type] || "Infantry";
  // ordinal cycles 1..(pool length*2-ish) so numbers stay period-plausible
  const ord = _mrOrd((seq % 33) + 1);
  return ord + " " + state + " " + arm;
}

// mrInit(C): create C.muster if absent, then sync rolls from C.roster.
function mrInit(C) {
  if (!C) return;
  if (!C.muster || typeof C.muster !== "object") {
    C.muster = { rolls: {}, fallen: [], nameSeq: 0 };
  }
  const m = C.muster;
  if (!m.rolls || typeof m.rolls !== "object") m.rolls = {};
  if (!Array.isArray(m.fallen)) m.fallen = [];
  if (typeof m.nameSeq !== "number") m.nameSeq = 0;

  const roster = Array.isArray(C.roster) ? C.roster : [];
  for (let i = 0; i < roster.length; i++) {
    const e = roster[i];
    if (!e || !e.id) continue;
    const existing = m.rolls[e.id];
    if (!existing) {
      const nm = e.name || _mrName(C, e.type, C.side);
      m.rolls[e.id] = {
        id: e.id,
        name: nm,
        type: e.type || "inf",
        battles: 0,
        kills: 0,
        status: "standing",
        joined: "(mustered in)",
        fellAt: null,
        _auto: !e.name
      };
    } else if (e.name && existing._auto) {
      // player named this regiment after the fact — prefer the real name
      existing.name = e.name;
      existing._auto = false;
    }
  }
}

// mrOnResolve: record the just-finished battle into the ledger. No DOM, no save.
function mrOnResolve(winnerSide, type, B, C, win) {
  mrInit(C);
  if (!C || !C.muster || !B || !Array.isArray(B.units)) return;
  const m = C.muster;
  const pSide = B.playerSide;
  const fellAt = (B.bd && B.bd.name) ? B.bd.name : "an unnamed field";

  for (let i = 0; i < B.units.length; i++) {
    const u = B.units[i];
    if (!u || u.side !== pSide || u.type === "hq") continue;
    const vid = u.vetId;
    let roll = vid ? m.rolls[vid] : null;

    // alive veteran whose roll was never synced (auto-fill) → create standing roll
    if (u.alive && vid && !roll) {
      roll = {
        id: vid,
        // u.vetName is the player-supplied veteran name (null for auto-fill); u.name is
        // the engine's generic in-battle tactical label. Prefer a period _mrName over that.
        name: u.vetName || _mrName(C, u.type, C.side),
        type: u.type || "inf",
        battles: 0,
        kills: 0,
        status: "standing",
        joined: "(mustered in)",
        fellAt: null,
        _auto: !u.vetName
      };
      m.rolls[vid] = roll;
    }
    if (!roll) continue;

    if (u.alive) {
      roll.battles = (roll.battles | 0) + 1;
      // u.kills is PER-BATTLE (it does not persist on the roster), so accumulate to a
      // true campaign credited-kills total rather than taking the single best battle.
      roll.kills = (roll.kills | 0) + (u.kills || 0);
      // Only adopt a genuine player-supplied name (vetName), never the engine's generic label.
      if (u.vetName) { roll.name = u.vetName; roll._auto = false; }
    } else if (roll.status === "standing") {
      roll.status = "fallen";
      roll.fellAt = fellAt;
      m.fallen.push({ id: roll.id, name: roll.name, type: roll.type, fellAt: fellAt });
    }
  }
}

// mrRenderHTML: PURE — returns the War Department tab HTML for the ledger.
function mrRenderHTML(C) {
  if (!C) return "";
  mrInit(C);
  const m = C.muster;
  const rolls = m.rolls || {};
  const standing = [];
  const keys = Object.keys(rolls);
  for (let i = 0; i < keys.length; i++) {
    const r = rolls[keys[i]];
    if (r && r.status === "standing") standing.push(r);
  }
  const fallen = Array.isArray(m.fallen) ? m.fallen : [];
  const served = standing.length + fallen.length;

  let html = "";
  html += "<div class='mr-roll' style=\"font-family:Georgia,serif;background:#f5edd6;color:#2b2118;border:1px solid #c8b07a;border-radius:3px;padding:10px 16px 14px;\">";
  html += "<h3 style=\"margin:6px 0 2px;letter-spacing:.04em;\">The Muster Roll</h3>";
  html += "<p class='mr-counts'>" + standing.length + " standing &middot; " +
          fallen.length + " fallen &middot; " + served + " served in all</p>";

  html += "<h4>Standing</h4>";
  if (!standing.length) {
    html += "<p class='mr-empty'>No regiments yet mustered.</p>";
  } else {
    let s = "<ul class='mr-standing'>";
    for (let i = 0; i < standing.length; i++) {
      const r = standing[i];
      const arm = _mrARM[r.type] || "Infantry";
      s += "<li>" + _mrEsc(r.name) + " &mdash; " + _mrEsc(arm) +
           " &middot; " + (r.battles | 0) + " battle" + ((r.battles | 0) === 1 ? "" : "s") +
           " &middot; " + (r.kills | 0) + " credited</li>";
    }
    s += "</ul>";
    html += s;
  }

  html += "<h4>Roll of the Fallen</h4>";
  if (!fallen.length) {
    html += "<p class='mr-empty'>None have fallen. Long may it hold.</p>";
  } else {
    let f = "<ul class='mr-fallen'>";
    for (let i = 0; i < fallen.length; i++) {
      const r = fallen[i];
      const arm = _mrARM[r.type] || "Infantry";
      f += "<li>" + _mrEsc(r.name) + " &mdash; " + _mrEsc(arm) +
           " &mdash; fell at " + _mrEsc(r.fellAt) + "</li>";
    }
    f += "</ul>";
    html += f;
  }

  html += "</div>";
  return html;
}

// mrWire: ledger is read-only in v1 — no interactive controls.
function mrWire(C) {}