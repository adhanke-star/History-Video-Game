/* ===========================================================================
   S2 m4 · 34-press.js — THE PRESS / PUBLIC-OPINION SYSTEM (§8.57 / D38.1).

   The real Civil War newspapers, North and South, react to your war's turns with
   period-voice broadsheet editorials. Each paper has a LEAN (radical / administration
   / war-democrat / copperhead / fire-eater / abolitionist / moderate) that sets HOW it
   reacts: a victory rallies the administration sheets and the radicals; a bloody defeat
   is meat for the Copperheads; emancipation splits the Northern press; the Confederate
   press (the Examiner, the Mercury) savages Davis whatever happens. Each turn the papers
   shift their FAVOR toward or against the war effort; the aggregate SENTIMENT feeds
   C.morale.public (the m3 home-front layer) — so the press is a real driver of the
   public will that decides the 1864 election. (Censorship is the lever: the existing
   us-press-censorship / us-vallandigham decision cards act on it.)

   Data: data/press.json -> GAME_DATA.press (real papers/editors/leanings, Verified;
   voice/editorials web-grounded + adversarially verified). EXTENDS: adds C.press
   (plain data; rides the save, no _SAVE_VER bump). The ONE sim coupling is read-only
   from morale's side (moraleCompute reads pressSentiment, anchored at 50=neutral, a
   no-op until the press has reacted — so it perturbs nothing at init).

   pressInit / pressOnResolve registered in 90 (pressOnResolve BEFORE moraleOnResolve so
   morale reads the fresh sentiment). pressRenderTab = a new "The Press" desk tab (12th),
   the period broadsheet. Bare-name globals; _prs/press prefix; render never mutates/saves.
   =========================================================================== */

var _prsLEAN_BASE = { administration: 66, radical: 63, abolitionist: 66, moderate: 50, "war-democrat": 48, copperhead: 34, "fire-eater": 37 };
var _prsFAVOR_DELTA = { "strongly-for": 8, "for": 4, "neutral": 0, "against": -4, "strongly-against": -8 };
var _prsLEAN_LABEL = { administration: "Administration", radical: "Radical", abolitionist: "Abolitionist", moderate: "Moderate", "war-democrat": "War Democrat", copperhead: "Copperhead", "fire-eater": "Fire-Eater" };

function _prsData() { return (typeof GAME_DATA !== "undefined" && GAME_DATA && GAME_DATA.press) ? GAME_DATA.press : null; }
function _prsAllPapers() { var d = _prsData(); return (d && d.papers && d.papers.length) ? d.papers : []; }
function _prsPapers(side) {
  var s = (side === "CS") ? "CS" : "US", all = _prsAllPapers(), out = [];
  for (var i = 0; i < all.length; i++) if (all[i] && all[i].side === s) out.push(all[i]);
  return out;
}
function _prsById(id) { var all = _prsAllPapers(); for (var i = 0; i < all.length; i++) if (all[i] && all[i].id === id) return all[i]; return null; }
function _prsEsc(s) {
  s = (s == null) ? "" : String(s);
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function _prsBaseline(p) { return (p && _prsLEAN_BASE[p.lean] != null) ? _prsLEAN_BASE[p.lean] : 50; }

/* ---- pressInit: idempotent. C.press = per-paper favor + aggregate sentiment + the
   day's headlines. sentiment stays a NEUTRAL 50 until the press first reacts. ---- */
function pressInit(C) {
  if (!C) return;
  var side = (C.side === "CS") ? "CS" : "US";
  if (!C.press || typeof C.press !== "object" || Array.isArray(C.press)) {
    C.press = { favor: {}, sentiment: 50, reacted: false, headlines: [], emancipationReacted: false };
  }
  var P = C.press;
  if (!P.favor || typeof P.favor !== "object" || Array.isArray(P.favor)) P.favor = {};
  if (typeof P.sentiment !== "number" || !isFinite(P.sentiment)) P.sentiment = 50; else P.sentiment = Math.max(0, Math.min(100, P.sentiment));   // D52.2: NaN/range guard (typeof NaN === "number")
  if (typeof P.reacted !== "boolean") P.reacted = false;
  if (!Array.isArray(P.headlines)) P.headlines = [];
  else { var _ph = []; for (var hh = 0; hh < P.headlines.length; hh++) { var _he = P.headlines[hh]; if (_he && typeof _he === "object" && !Array.isArray(_he)) _ph.push(_he); } P.headlines = _ph; }   // D52.1: drop malformed headline entries so pressRenderTab can't crash
  if (typeof P.emancipationReacted !== "boolean") P.emancipationReacted = false;
  var papers = _prsPapers(side);
  for (var i = 0; i < papers.length; i++) {
    var id = papers[i].id;
    if (typeof P.favor[id] !== "number" || !(P.favor[id] >= 0 && P.favor[id] <= 100)) P.favor[id] = _prsBaseline(papers[i]);
  }
}

/* The war conditions the papers react to THIS turn (priority order applied later). */
function _prsConditions(B, C, win, type, winnerSide) {
  var conds = [], side = (C.side === "CS") ? "CS" : "US";
  if (type === "draw" || winnerSide == null) conds.push("stalemate");   // D52.5: mirror endBattle's draw definition, don't trust the type string alone
  else if (win) conds.push("victory");
  else conds.push("defeat");
  var cas = (B && B.casualties && B.casualties[side]) ? (B.casualties[side] || 0) : 0;
  if (cas >= 8000) conds.push("heavy-casualties");
  // emancipation: the Northern press reacts ONCE when the Proclamation issues
  var em = C.president && C.president.emancipation;
  if (side === "US" && em && em.issued && C.press && !C.press.emancipationReacted) { conds.push("emancipation"); }
  return conds;
}

/* Pick the editorial a paper runs for the active conditions (priority: emancipation >
   heavy-casualties > the battle result). Returns the editorial or null. */
function _prsPickEditorial(paper, conds) {
  if (!paper || !paper.editorials) return null;
  var priority = ["emancipation", "heavy-casualties", "victory", "defeat", "stalemate"];
  for (var pr = 0; pr < priority.length; pr++) {
    var want = priority[pr];
    if (conds.indexOf(want) < 0) continue;
    for (var e = 0; e < paper.editorials.length; e++) if (paper.editorials[e].condition === want) return paper.editorials[e];
  }
  // fall back to an "always" editorial if present
  for (var a = 0; a < paper.editorials.length; a++) if (paper.editorials[a].condition === "always") return paper.editorials[a];
  return null;
}

/* ---- pressOnResolve: the papers react. Runs BEFORE moraleOnResolve so the fresh
   sentiment feeds the public-will layer the same turn. ---- */
function pressOnResolve(winnerSide, type, B, C, win) {
  if (!C) return;
  pressInit(C);
  try {
    var P = C.press, side = (C.side === "CS") ? "CS" : "US";
    var conds = _prsConditions(B, C, win, type, winnerSide);
    var papers = _prsPapers(side), heads = [], sum = 0, n = 0, firedEmancipation = false;
    for (var i = 0; i < papers.length; i++) {
      var p = papers[i], ed = _prsPickEditorial(p, conds), base = _prsBaseline(p);
      var cur = (typeof P.favor[p.id] === "number") ? P.favor[p.id] : base;
      if (ed) {
        var delta = _prsFAVOR_DELTA[ed.favorShift] || 0;
        cur = Math.max(0, Math.min(100, cur + delta));
        if (ed.condition === "emancipation") firedEmancipation = true;
        if (ed.headline) heads.push({ id: p.id, name: p.name, lean: p.lean, headline: ed.headline });   // D52.7: skip an empty headline
      } else {
        // no editorial for today's news -> drift a step back toward the paper's standing disposition
        cur = cur + (base > cur ? 1 : (base < cur ? -1 : 0));
        cur = Math.max(0, Math.min(100, cur));
      }
      P.favor[p.id] = cur; sum += cur; n++;
    }
    if (firedEmancipation) P.emancipationReacted = true;   // D52.4: latch ONLY when a paper actually printed an emancipation editorial
    P.sentiment = n ? Math.round(sum / n) : 50;
    P.reacted = true;
    P.headlines = heads;
  } catch (e) { if (typeof console !== "undefined" && console.warn) console.warn("pressOnResolve:", e); }
}

/* The aggregate press sentiment toward the war effort (0-100). NEUTRAL 50 until the
   press has first reacted, so it perturbs nothing at init / in unrelated probes. */
function pressSentiment(C) {
  if (!C || !C.press || !C.press.reacted || typeof C.press.sentiment !== "number" || !(C.press.sentiment >= 0 && C.press.sentiment <= 100)) return 50;   // D52.6: range test rejects NaN/Infinity
  return C.press.sentiment;
}

/* ===== render: "The Press" desk tab — the period broadsheet ===== */

function _prsFavorWord(v) {
  if (v >= 70) return ["Solidly behind the war", "#4a6b3a"];
  if (v >= 55) return ["Supportive", "#6f9e5a"];
  if (v >= 45) return ["Wavering", "#b8863b"];
  if (v >= 30) return ["Critical", "#c9712e"];
  return ["In open opposition", "#9c3b2e"];
}

function pressRenderTab(C) {
  if (!C) return '';
  pressInit(C);
  if (!_prsData()) return '<p class="lede" style="font-size:13px">The presses are quiet.</p>';
  var side = (C.side === "CS") ? "CS" : "US", P = C.press, papers = _prsPapers(side);
  var sent = pressSentiment(C), sw = _prsFavorWord(sent);

  // the day's headlines (the broadsheet front page)
  var front = "";
  if (P.reacted && P.headlines && P.headlines.length) {
    front = '<div style="margin:8px 0;padding:10px;border:2px double var(--rule);border-radius:4px;background:rgba(0,0,0,.1)">'
      + '<div style="text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--rule);border-bottom:1px solid var(--rule);padding-bottom:3px;margin-bottom:5px">From the day\'s editions</div>';
    for (var h = 0; h < P.headlines.length; h++) {
      var hd = P.headlines[h]; if (!hd) continue;   // D52.1: defense-in-depth
      front += '<div style="margin:5px 0"><span style="font-size:10px;opacity:.6">' + _prsEsc(hd.name) + ':</span> '
        + '<span style="font-weight:bold;font-size:13px;font-style:italic">&ldquo;' + _prsEsc(hd.headline) + '&rdquo;</span></div>';
    }
    front += '</div>';
  } else {
    front = '<p class="lede" style="font-size:12px;opacity:.7">The presses await the next turn of the war.</p>';
  }

  // each paper's standing stance
  var rows = "";
  for (var i = 0; i < papers.length; i++) {
    var p = papers[i], fav = (typeof P.favor[p.id] === "number") ? P.favor[p.id] : _prsBaseline(p), fw = _prsFavorWord(fav);
    rows += '<div style="padding:8px 0;border-bottom:1px dotted var(--rule)">'
      + '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">'
      +   '<span style="font-weight:bold;font-size:13px">' + _prsEsc(p.name) + ' <span style="font-weight:normal;opacity:.6;font-size:11px">&middot; ' + _prsEsc(_prsLEAN_LABEL[p.lean] || p.lean) + (p.editor ? ' &middot; ' + _prsEsc(p.editor) : '') + '</span></span>'
      +   '<span style="font-size:11px;color:' + fw[1] + '">' + fw[0] + '</span>'
      + '</div>'
      + (p.voice ? '<div style="font-size:11px;opacity:.7;margin-top:2px">' + _prsEsc(p.voice) + '</div>' : '')
      + '</div>';
  }

  return ''
    + '<p class="lede" style="font-size:13px;margin-bottom:6px">The newspapers are the voice &mdash; and the maker &mdash; of the public mind. They cheer your victories, magnify your defeats, and carry the people toward November 1864.</p>'
    + '<div style="display:flex;justify-content:space-between;align-items:baseline;padding:6px 0;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule)">'
    +   '<span style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--rule)">The press, on the whole</span>'
    +   '<span style="font-weight:bold;color:' + sw[1] + '">' + (P.reacted ? sent + ' &middot; ' + sw[0] : 'Not yet in print') + '</span>'
    + '</div>'
    + front
    + '<div style="margin-top:8px">' + rows + '</div>'
    + _prsCardHTML(C);
}

function _prsCardHTML(C) {
  var d = _prsData();
  if (!d || !d.teachingCards || !d.teachingCards.length) return "";
  var html = "";
  for (var i = 0; i < d.teachingCards.length; i++) {
    var c = d.teachingCards[i], persp = "";
    if (c.perspectives) for (var p = 0; p < c.perspectives.length; p++) persp += '<div style="margin:4px 0;font-size:12px"><span style="opacity:.6;font-style:italic">' + _prsEsc(c.perspectives[p].voice) + ':</span> ' + _prsEsc(c.perspectives[p].text) + '</div>';
    html += '<div style="margin-top:10px;padding:9px;border:1px solid var(--rule);border-radius:5px;background:rgba(0,0,0,.1)">'
      + '<div style="font-weight:bold;font-size:13px">' + _prsEsc(c.title) + '</div>'
      + '<div style="font-size:12px;opacity:.85;margin:2px 0">' + _prsEsc(c.claim) + '</div>'
      + '<button id="prsCard_' + i + '" type="button" class="upg" style="font-size:11px;padding:1px 8px;margin-top:3px">The historians &#9656;</button>'
      + '<div id="prsCardBox_' + i + '" style="display:none;margin-top:4px">' + persp
      + '<div style="margin-top:4px;font-size:10px;opacity:.6">' + _prsEsc(c.provenance || "Inferred") + (c.sources && c.sources.length ? ' &middot; ' + _prsEsc(c.sources.join("; ")) : '') + '</div></div>'
      + '</div>';
  }
  return html;
}

function pressWireTab(C) {
  var d = _prsData();
  if (d && d.teachingCards) for (var i = 0; i < d.teachingCards.length; i++) {
    (function (idx) {
      var b = document.getElementById("prsCard_" + idx);
      if (b) b.addEventListener("click", function () {
        var box = document.getElementById("prsCardBox_" + idx);
        if (box) box.style.display = (box.style.display === "none") ? "block" : "none";
      });
    })(i);
  }
}
