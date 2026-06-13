/* ==== §9 — UI CORE (CHUNK-01) ==== */

// ---- logMsg(msg, cls) ----
function logMsg(msg, cls) {
  const body = document.getElementById("logBody");
  if (!body) return;
  const el = document.createElement("div");
  el.className = cls ? "e " + cls : "e";
  el.textContent = msg;
  body.appendChild(el);
  while (body.children.length > 80) body.removeChild(body.firstChild);
  const log = document.getElementById("log");
  if (log) log.scrollTop = log.scrollHeight;
  if (G.battle) G.battle.log.push({ msg, cls: cls || "" });
}

// ---- toast(msg, ms=1900) ----
let _toastTimer = null;
function toast(msg, ms) {
  const el = document.getElementById("toast");
  if (!el) return;
  if (_toastTimer !== null) { clearTimeout(_toastTimer); _toastTimer = null; }
  el.textContent = msg;
  el.classList.add("show");
  _toastTimer = setTimeout(function () { el.classList.remove("show"); _toastTimer = null; },
    (typeof ms === "number") ? ms : 1900);
}

// ---- showHud() / hideHud() ----
// showHud reveals all panels except #info (hidden until unit selected via refreshUI)
const _HUD_IDS = ["topbar", "objbar", "info", "orders", "log", "mini", "turnstrip"];
function showHud() {
  for (const id of _HUD_IDS) {
    const el = document.getElementById(id);
    if (el) el.classList[id === "info" ? "add" : "remove"]("hidden");
  }
}
function hideHud() {
  for (const id of _HUD_IDS) {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  }
}

// ---- refreshUI() ----
// No-op unless G.battle. Never calls draw().
function refreshUI() {
  if (!G.battle) return;
  const B = G.battle;

  // topbar
  const elB = document.getElementById("tbBattle"); if (elB) elB.textContent = B.bd.name;
  const elY = document.getElementById("tbYear");   if (elY) elY.textContent = B.bd.year;
  const elW = document.getElementById("tbWx");
  if (elW && WX[B.wx]) elW.textContent = WX[B.wx].ico + " " + WX[B.wx].name;
  const elS = document.getElementById("tbSide");
  if (elS) { elS.textContent = B.playerSide === "US" ? "UNION" : "CONFEDERATE"; elS.className = "sidechip " + B.playerSide; }

  // turn strip
  const elT = document.getElementById("tsTurn"); if (elT) elT.textContent = B.turn;
  const elM = document.getElementById("tsMax");  if (elM) elM.textContent = B.maxTurns;

  // objectives list
  const elOL = document.getElementById("objList");
  if (elOL && B.M && B.M.objs) {
    let h = "";
    for (const obj of B.M.objs) {
      const dc = obj.owner === "US" ? "dot held-US" : obj.owner === "CS" ? "dot held-CS" : "dot held-0";
      const tn = (TERRAIN[obj.t] && TERRAIN[obj.t].name) ? TERRAIN[obj.t].name : obj.t;
      h += '<div class="ob"><span class="' + dc + '"></span><span>Objective ★' + (obj.obj ? obj.obj.val : "") + " — " + tn + "</span></div>";
    }
    elOL.innerHTML = h;
  }

  // unit info panel
  const infoEl = document.getElementById("info");
  const u = G.sel;

  if (u) {
    if (infoEl) infoEl.classList.remove("hidden");

    const flagEl = document.getElementById("ufFlag");
    if (flagEl) {
      flagEl.style.background  = u.side === "US" ? "var(--union)" : "var(--reb)";
      flagEl.style.borderColor = u.side === "US" ? "var(--union-lt)" : "var(--reb-lt)";
    }

    const nameEl = document.getElementById("ufName");
    if (nameEl) nameEl.textContent = unitLabel(u);

    const roleEl = document.getElementById("ufRole");
    if (roleEl) {
      const an = (ARM[u.type] && ARM[u.type].name) ? ARM[u.type].name : u.type;
      const wn = (u.weapon && WEAPONS[u.weapon]) ? WEAPONS[u.weapon].name : "";
      roleEl.textContent = wn ? an + " — " + wn : an;
    }

    const bodyEl = document.getElementById("ufBody");
    if (bodyEl) {
      function bar(label, pct, fillCls, lowThresh, valStr) {
        const low = pct < lowThresh;
        return '<div class="stat"><span class="lab">' + label + '</span>'
          + '<div class="bar"><i class="' + fillCls + (low ? " fill-low" : "") + '" style="width:' + Math.round(pct * 100) + '%"></i>'
          + '<span class="num">' + valStr + '</span></div></div>';
      }
      const sp = u.maxStr > 0 ? clamp(u.strength / u.maxStr, 0, 1) : 0;
      const mp = u.maxMor > 0 ? clamp(u.morale  / u.maxMor, 0, 1) : 0;
      let h = bar("Strength", sp, "fill-str", 0.34, u.strength)
            + bar("Morale",   mp, "fill-mor", 0.30, u.morale);
      if (u.maxAmmo > 0) {
        const ap = clamp(u.ammo / u.maxAmmo, 0, 1);
        h += bar("Ammo", ap, "fill-amm", 0.26, u.ammo + "/" + u.maxAmmo);
      }
      // XP pips
      let xp = "";
      const xv = u.xp || 0;
      for (let i = 0; i < 5; i++) xp += '<span class="xp' + (i < xv ? "" : " off") + '"></span>';
      h += '<div class="kv"><span>XP</span><span>' + xp + "</span></div>";
      h += '<div class="kv"><span>Entrench</span><b>' + (u.ent || 0) + "/3</b></div>";
      h += '<div class="kv"><span>Supplied</span><b>' + (u.supplied ? "Yes" : "No") + "</b></div>";
      if (u.leader && u.leader.alive) {
        const td = (TRAITS[u.leader.trait] && TRAITS[u.leader.trait].desc) ? TRAITS[u.leader.trait].desc : "";
        h += '<div class="lead-badge"><div class="lnm">' + u.leader.name + (u.leader.cmd ? " ★" : "") + "</div>"
           + (td ? "<div>" + td + "</div>" : "") + "</div>";
      }
      bodyEl.innerHTML = h;
    }
  } else {
    if (infoEl) infoEl.classList.add("hidden");
  }

  // order buttons
  const bMv = document.getElementById("obMove");
  const bFi = document.getElementById("obFire");
  const bCh = document.getElementById("obCharge");
  const bEn = document.getElementById("obEntrench");
  const bDn = document.getElementById("obDone");
  function setDis(btn, v) { if (!btn) return; v ? btn.setAttribute("disabled","disabled") : btn.removeAttribute("disabled"); }

  if (u && u.side === B.playerSide) {
    setDis(bMv, u.mp <= 0 || u.done || u.routed || u.type === "fort");
    setDis(bFi, u.fired || u.done || u.ammo <= 0 || !u.weapon);
    setDis(bCh, u.done || u.type === "art" || u.type === "nav" || u.type === "fort");
    setDis(bEn, u.done || u.type === "cav" || u.type === "nav" || u.type === "hq" || u.ent >= 3);
    setDis(bDn, u.done);
  } else {
    setDis(bMv, true); setDis(bFi, true); setDis(bCh, true); setDis(bEn, true); setDis(bDn, true);
  }

  // highlight active order button
  for (const [btn, ord] of [[bMv,"move"],[bFi,"fire"],[bCh,"charge"]]) {
    if (!btn) continue;
    btn.style.borderColor = G.order === ord ? "var(--brass-lt)" : "";
    btn.style.boxShadow   = G.order === ord ? "0 0 0 1px var(--brass)" : "";
  }
}

// ---- coachShow / coachNext / coachEnd ----
let _coachSteps = [], _coachIdx = 0;

function coachShow(steps) {
  if (!steps || !steps.length) return;
  _coachSteps = steps; _coachIdx = 0; _coachRender();
}

function _coachRender() {
  const el = document.getElementById("coach");
  if (!el) return;
  const step = _coachSteps[_coachIdx];
  if (!step) { coachEnd(); return; }
  const total = _coachSteps.length;
  const isLast = _coachIdx >= total - 1;
  el.innerHTML =
    '<div class="ct">' + (step.title || "") + "</div>"
    + '<div style="margin:4px 0 8px;font-size:12px;color:var(--parch-dk)">' + (step.body || "") + "</div>"
    + '<div class="cb"><span class="cstep">' + (_coachIdx + 1) + " / " + total + "</span>"
    + '<button class="cnext" id="_coachNxt">' + (isLast ? "Done" : "Next") + "</button></div>";
  el.classList.remove("hidden");
  el.style.left = "50%"; el.style.bottom = "140px"; el.style.transform = "translateX(-50%)";
  const nb = document.getElementById("_coachNxt");
  if (nb) nb.addEventListener("click", isLast ? coachEnd : coachNext);
}

function coachNext() {
  _coachIdx++;
  if (_coachIdx >= _coachSteps.length) coachEnd(); else _coachRender();
}

function coachEnd() {
  const el = document.getElementById("coach");
  if (el) { el.classList.add("hidden"); el.innerHTML = ""; }
  _coachSteps = []; _coachIdx = 0;
}
